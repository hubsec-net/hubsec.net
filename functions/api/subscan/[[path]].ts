// Cloudflare Pages Function: proxies /api/subscan/:chain/... to Subscan API.
// This avoids CORS issues since the browser talks to the same origin.

interface Env {
  SUBSCAN_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { params, request } = context;
  const pathSegments = (params.path as string[]) || [];

  if (pathSegments.length < 2) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), { status: 400 });
  }

  // First segment is the chain name, rest is the API path
  const chain = pathSegments[0];
  const apiPath = pathSegments.slice(1).join('/');
  const targetUrl = `https://${chain}.api.subscan.io/${apiPath}`;

  const body = await request.text();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Use server-side env var (not exposed to client)
  const apiKey =
    context.env.SUBSCAN_API_KEY ||
    request.headers.get('X-API-Key') ||
    '';
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const upstream = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body,
  });

  const responseBody = await upstream.text();

  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=10',
    },
  });
};
