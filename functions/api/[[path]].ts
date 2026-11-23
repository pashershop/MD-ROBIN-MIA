/**
 * Optional Cloudflare Pages Function proxy for same-origin `/api/*` requests.
 * When a Service Binding named `API_WORKER` (pointing to `mrm-cms-api`) or
 * `API_ORIGIN` env var is attached in Cloudflare Pages Settings -> Functions,
 * `/api/v1/*` requests stay 100% same-origin on https://mdrobinmia.pages.dev,
 * allowing strict HttpOnly; Secure; SameSite=Lax admin session cookies across all browsers.
 */
interface PagesFunctionContext {
  request: Request;
  env: {
    API_WORKER?: { fetch(request: Request): Promise<Response> };
    API_ORIGIN?: string;
  };
}

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  const { request, env } = context;

  if (env.API_WORKER) {
    return env.API_WORKER.fetch(request);
  }

  if (env.API_ORIGIN) {
    const incomingUrl = new URL(request.url);
    const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, env.API_ORIGIN);
    const proxied = new Request(targetUrl.toString(), request);
    return fetch(proxied);
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error:
        'CMS API Worker is not bound to Cloudflare Pages yet. Configure Service Binding "API_WORKER" or set VITE_API_BASE_URL.',
      code: 'API_WORKER_UNBOUND',
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    },
  );
}
