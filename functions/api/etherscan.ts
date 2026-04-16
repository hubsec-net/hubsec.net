// Cloudflare Pages Function: proxies /api/etherscan?... to Etherscan V2 API.
// Same-origin proxy so the browser never makes a cross-origin request.

interface Env {
  ETHERSCAN_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const incomingUrl = new URL(request.url);
  const qs = incomingUrl.searchParams;

  // Inject server-side API key if available
  const apiKey = context.env.ETHERSCAN_API_KEY || qs.get('apikey') || '';
  if (apiKey) {
    qs.set('apikey', apiKey);
  }

  const targetUrl = `https://api.etherscan.io/v2/api?${qs.toString()}`;

  try {
    const upstream = await fetch(targetUrl, {
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
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy fetch failed' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
