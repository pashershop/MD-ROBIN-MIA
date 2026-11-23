import { buildSecurityHeaders, errorResponse } from './cors';
import { handleAdminRoutes } from './routes/adminRoutes';
import { handleAuthRoutes } from './routes/authRoutes';
import { handleMediaRoutes } from './routes/mediaRoutes';
import { handlePublicRoutes } from './routes/public';
import { handleSeoRoutes } from './routes/seo';
import type { WorkerEnv } from './types';

export async function handleWorkerRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  // CORS Preflight
  if (request.method === 'OPTIONS') {
    const headers = buildSecurityHeaders(request, env, {
      isPrivate: path.startsWith('/api/v1/admin') || path.startsWith('/api/v1/auth'),
    });
    return new Response(null, { status: 204, headers });
  }

  try {
    const seoRes = await handleSeoRoutes(request, env, path);
    if (seoRes) return seoRes;

    const authRes = await handleAuthRoutes(request, env, path);
    if (authRes) return authRes;

    const mediaRes = await handleMediaRoutes(request, env, path, url);
    if (mediaRes) return mediaRes;

    const publicRes = await handlePublicRoutes(request, env, path, url);
    if (publicRes) return publicRes;

    const adminRes = await handleAdminRoutes(request, env, path, url);
    if (adminRes) return adminRes;

    return errorResponse(request, env, 404, 'Endpoint not found.', 'NOT_FOUND', {
      isPrivate: path.startsWith('/api/v1/admin'),
    });
  } catch (err) {
    // Never leak internal error stack traces or SQL details in API responses
    console.error('[MRM CMS Worker Error]', err instanceof Error ? err.message : 'Unknown error');
    return errorResponse(request, env, 500, 'An unexpected server error occurred.', 'INTERNAL_ERROR', {
      isPrivate: path.startsWith('/api/v1/admin') || path.startsWith('/api/v1/auth'),
    });
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return handleWorkerRequest(request, env);
  },
};
