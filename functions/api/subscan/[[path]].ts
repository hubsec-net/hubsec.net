// Cloudflare Pages Function: proxies /api/subscan/:chain/... to Subscan API.
// Same-origin proxy so the browser never makes a cross-origin request.

interface Env {
  SUBSCAN_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { params, request } = context;
  const raw = params.path;

  // params.path is string[] for [[path]] catch-all routes
  const pathSegments: string[] = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split('/').filter(Boolean)
      : [];

  if (pathSegments.length < 2) {
    return new Response(
      JSON.stringify({ error: 'Invalid path', segments: pathSegments }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // First segment is the chain subdomain, rest is the API path
  const chain = pathSegments[0];
  const apiPath = pathSegments.slice(1).join('/');
  const targetUrl = `https://${chain}.api.subscan.io/${apiPath}`;

  const body = await request.text();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey =
    context.env.SUBSCAN_API_KEY ||
    request.headers.get('X-API-Key') ||
    '';
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  try {
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
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy fetch failed', target: targetUrl }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
