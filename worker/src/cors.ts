import type { WorkerEnv } from './types';

export function getAllowedOrigins(env: WorkerEnv): string[] {
  const configured = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  if (configured.length > 0) return configured;
  return ['https://mdrobinmia.pages.dev', 'http://localhost:3000', 'http://127.0.0.1:3000'];
}

export function resolveCorsOrigin(request: Request, env: WorkerEnv): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const allowed = getAllowedOrigins(env);
  if (allowed.includes(origin)) {
    return origin;
  }
  return null;
}

export function buildSecurityHeaders(
  request: Request,
  env: WorkerEnv,
  options?: { isPrivate?: boolean; contentType?: string },
): Headers {
  const headers = new Headers();
  headers.set('Content-Type', options?.contentType ?? 'application/json; charset=utf-8');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Vary', 'Origin');

  if (options?.isPrivate) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  const allowedOrigin = resolveCorsOrigin(request, env);
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, X-Bootstrap-Secret');
    headers.set('Access-Control-Max-Age', '600');
  }

  return headers;
}

export function jsonResponse(
  request: Request,
  env: WorkerEnv,
  data: unknown,
  status = 200,
  options?: { isPrivate?: boolean; extraHeaders?: Record<string, string> },
): Response {
  const headers = buildSecurityHeaders(request, env, { isPrivate: options?.isPrivate });
  if (options?.extraHeaders) {
    for (const [k, v] of Object.entries(options.extraHeaders)) {
      headers.append(k, v);
    }
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(
  request: Request,
  env: WorkerEnv,
  status: number,
  error: string,
  code?: string,
  options?: { isPrivate?: boolean; extraHeaders?: Record<string, string> },
): Response {
  return jsonResponse(
    request,
    env,
    { ok: false, error, ...(code ? { code } : {}) },
    status,
    options,
  );
}
