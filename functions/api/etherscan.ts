// Cloudflare Pages Function: proxies /api/etherscan?... to Etherscan API.
// Injects server-side API key and avoids CORS issues.

interface Env {
  ETHERSCAN_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const incomingUrl = new URL(request.url);

  // Forward all query params to Etherscan
  const target = new URL('https://api.etherscan.io/v2/api');
  for (const [key, value] of incomingUrl.searchParams) {
    target.searchParams.set(key, value);
  }

  // Inject server-side API key (overrides any client-sent key)
  const apiKey =
    context.env.ETHERSCAN_API_KEY ||
    incomingUrl.searchParams.get('apikey') ||
    '';
  if (apiKey) {
    target.searchParams.set('apikey', apiKey);
  }

  const upstream = await fetch(target.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
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
