import { recordRevision, requireAdmin } from '../auth';
import { errorResponse, jsonResponse } from '../cors';
import { generateId } from '../crypto';
import { cleanString, sanitizeSvgPayload, sanitizeUrl } from '../sanitize';
import type { WorkerEnv } from '../types';

const ALLOWED_IMAGE_MIME = new Map<string, string>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/svg+xml', 'svg'],
]);

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export async function handleMediaRoutes(
  request: Request,
  env: WorkerEnv,
  path: string,
  url: URL,
): Promise<Response | null> {
  // Public R2 object streaming endpoint: GET /api/v1/media/file/:key
  const streamMatch = path.match(/^\/api\/v1\/media\/file\/([a-zA-Z0-9._-]+)$/);
  if (streamMatch && request.method === 'GET') {
    if (!env.MEDIA_BUCKET) {
      return errorResponse(request, env, 404, 'R2 media storage is not configured.', 'R2_NOT_CONFIGURED');
    }
    const key = streamMatch[1];
    const obj = await env.MEDIA_BUCKET.get(key);
    if (!obj) {
      return errorResponse(request, env, 404, 'Media file not found.', 'NOT_FOUND');
    }
    const headers = new Headers();
    headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(obj.body, { status: 200, headers });
  }

  // Admin Media List: GET /api/v1/admin/media
  if (path === '/api/v1/admin/media' && request.method === 'GET') {
    const authRes = await requireAdmin(request, env);
    if ('error' in authRes) return authRes.error;

    const rows = await env.DB.prepare(
      `SELECT id, r2_key, public_url, file_name, mime_type, size_bytes, width, height, alt_text, caption, storage_provider, created_at
       FROM media ORDER BY created_at DESC`,
    ).all<Record<string, unknown>>();

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        r2Configured: Boolean(env.MEDIA_BUCKET),
        items: rows.results.map((m) => ({
          id: m.id,
          r2Key: m.r2_key,
          publicUrl: m.public_url,
          fileName: m.file_name,
          mimeType: m.mime_type,
          sizeBytes: m.size_bytes,
          width: m.width,
          height: m.height,
          altText: m.alt_text,
          caption: m.caption,
          storageProvider: m.storage_provider,
          createdAt: m.created_at,
        })),
      },
      200,
      { isPrivate: true },
    );
  }

  // Admin R2 Multipart Upload: POST /api/v1/admin/media/upload
  if (path === '/api/v1/admin/media/upload' && request.method === 'POST') {
    const authRes = await requireAdmin(request, env);
    if ('error' in authRes) return authRes.error;

    if (!env.MEDIA_BUCKET) {
      return errorResponse(
        request,
        env,
        501,
        'Cloudflare R2 bucket (MEDIA_BUCKET) is not bound on this Worker. Enable R2 in wrangler.jsonc or register an external image URL instead.',
        'R2_NOT_CONFIGURED',
        { isPrivate: true },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse(request, env, 400, 'Expected multipart/form-data upload.', 'INVALID_FORM_DATA', {
        isPrivate: true,
      });
    }

    const fileEntry = formData.get('file');
    if (!fileEntry || typeof fileEntry === 'string') {
      return errorResponse(request, env, 400, 'Missing image file in field "file".', 'MISSING_FILE', {
        isPrivate: true,
      });
    }

    const file = fileEntry as File;
    const ext = ALLOWED_IMAGE_MIME.get(file.type);
    if (!ext) {
      return errorResponse(
        request,
        env,
        400,
        'Unsupported image type. Allowed types: PNG, JPEG, WebP, SVG.',
        'INVALID_FILE_TYPE',
        { isPrivate: true },
      );
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return errorResponse(
        request,
        env,
        400,
        'Image file must be between 1 byte and 5 MB.',
        'FILE_TOO_LARGE',
        { isPrivate: true },
      );
    }

    let payload: ArrayBuffer | string = await file.arrayBuffer();
    if (file.type === 'image/svg+xml') {
      const svgText = new TextDecoder().decode(payload);
      const sanitizedSvg = sanitizeSvgPayload(svgText);
      if (!sanitizedSvg) {
        return errorResponse(request, env, 400, 'Invalid SVG image payload.', 'INVALID_SVG', {
          isPrivate: true,
        });
      }
      payload = sanitizedSvg;
    }

    const id = generateId('med');
    const r2Key = `${id}.${ext}`;
    const altText = cleanString(formData.get('altText'), 300);
    const caption = cleanString(formData.get('caption'), 400);
    const fileName = cleanString(file.name, 160) || r2Key;

    await env.MEDIA_BUCKET.put(r2Key, payload, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const publicUrl = env.R2_PUBLIC_BASE_URL
      ? `${env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${r2Key}`
      : `${url.origin}/api/v1/media/file/${r2Key}`;

    await env.DB.prepare(
      `INSERT INTO media (id, r2_key, public_url, file_name, mime_type, size_bytes, alt_text, caption, storage_provider, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'r2', ?)`,
    )
      .bind(id, r2Key, publicUrl, fileName, file.type, file.size, altText, caption, authRes.auth.admin.id)
      .run();

    await recordRevision(env, 'media', id, 'upload', { id, r2Key, publicUrl, fileName }, authRes.auth.admin.id);

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        item: {
          id,
          r2Key,
          publicUrl,
          fileName,
          mimeType: file.type,
          sizeBytes: file.size,
          altText,
          caption,
          storageProvider: 'r2',
        },
      },
      201,
      { isPrivate: true },
    );
  }

  // Admin Register External Image URL: POST /api/v1/admin/media/external
  if (path === '/api/v1/admin/media/external' && request.method === 'POST') {
    const authRes = await requireAdmin(request, env);
    if ('error' in authRes) return authRes.error;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
    }

    const publicUrl = sanitizeUrl(body.publicUrl);
    if (!publicUrl) {
      return errorResponse(request, env, 400, 'A valid http(s) image URL is required.', 'INVALID_URL', {
        isPrivate: true,
      });
    }

    const id = generateId('med');
    const fileName = cleanString(body.fileName, 160) || publicUrl.split('/').pop()?.slice(0, 120) || 'external-image';
    const altText = cleanString(body.altText, 300);
    const caption = cleanString(body.caption, 400);

    await env.DB.prepare(
      `INSERT INTO media (id, r2_key, public_url, file_name, mime_type, size_bytes, alt_text, caption, storage_provider, uploaded_by)
       VALUES (?, NULL, ?, ?, 'image/external', 0, ?, ?, 'external_url', ?)`,
    )
      .bind(id, publicUrl, fileName, altText, caption, authRes.auth.admin.id)
      .run();

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        item: {
          id,
          r2Key: null,
          publicUrl,
          fileName,
          mimeType: 'image/external',
          sizeBytes: 0,
          altText,
          caption,
          storageProvider: 'external_url',
        },
      },
      201,
      { isPrivate: true },
    );
  }

  // Update / Delete Media: PATCH or DELETE /api/v1/admin/media/:id
  const mediaIdMatch = path.match(/^\/api\/v1\/admin\/media\/([a-zA-Z0-9_-]+)$/);
  if (mediaIdMatch) {
    const authRes = await requireAdmin(request, env);
    if ('error' in authRes) return authRes.error;
    const mediaId = mediaIdMatch[1];

    if (request.method === 'PATCH') {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      }
      const altText = cleanString(body.altText, 300);
      const caption = cleanString(body.caption, 400);
      const nowIso = new Date().toISOString();
      await env.DB.prepare(`UPDATE media SET alt_text = ?, caption = ?, updated_at = ? WHERE id = ?`)
        .bind(altText, caption, nowIso, mediaId)
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }

    if (request.method === 'DELETE') {
      const existing = await env.DB.prepare(`SELECT r2_key, storage_provider FROM media WHERE id = ?`)
        .bind(mediaId)
        .first<{ r2_key: string | null; storage_provider: string }>();
      if (!existing) {
        return errorResponse(request, env, 404, 'Media item not found.', 'NOT_FOUND', { isPrivate: true });
      }
      if (existing.storage_provider === 'r2' && existing.r2_key && env.MEDIA_BUCKET) {
        await env.MEDIA_BUCKET.delete(existing.r2_key);
      }
      await env.DB.prepare(`DELETE FROM media WHERE id = ?`).bind(mediaId).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  return null;
}
