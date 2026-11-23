import { constantTimeEqual, generateId, generateRandomToken, sha256Hex } from './crypto';
import { errorResponse, getAllowedOrigins } from './cors';
import type { AdminRecord, AuthenticatedContext, WorkerEnv } from './types';

export const SESSION_COOKIE_NAME = 'mrm_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function buildSessionCookie(request: Request, env: WorkerEnv, token: string, maxAge = SESSION_TTL_SECONDS): string {
  const url = new URL(request.url);
  const isHttps = url.protocol === 'https:' || request.headers.get('X-Forwarded-Proto') === 'https';
  const sameSiteRaw = (env.COOKIE_SAMESITE || 'Lax').trim();
  const sameSite = sameSiteRaw === 'None' && isHttps ? 'None' : sameSiteRaw === 'Strict' ? 'Strict' : 'Lax';
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${maxAge}`,
  ];
  if (isHttps) {
    attrs.push('Secure');
  }
  return attrs.join('; ');
}

export function clearSessionCookie(request: Request, env: WorkerEnv): string {
  return buildSessionCookie(request, env, '', 0);
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp.trim();
  const xff = request.headers.get('X-Forwarded-For');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

export function isOriginAllowedForMutation(request: Request, env: WorkerEnv): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) {
    // Non-browser or same-origin direct fetch without Origin header; verify Referer if present
    const referer = request.headers.get('Referer');
    if (!referer) return true;
    try {
      const refOrigin = new URL(referer).origin;
      return getAllowedOrigins(env).includes(refOrigin);
    } catch {
      return false;
    }
  }
  return getAllowedOrigins(env).includes(origin);
}

export async function createAdminSession(
  request: Request,
  env: WorkerEnv,
  adminId: string,
): Promise<{ sessionToken: string; csrfToken: string; cookieHeader: string }> {
  const sessionToken = generateRandomToken(32);
  const csrfToken = generateRandomToken(24);
  const tokenHash = await sha256Hex(sessionToken);
  const csrfTokenHash = await sha256Hex(csrfToken);
  const ipHash = await sha256Hex(getClientIp(request));
  const ua = (request.headers.get('User-Agent') || '').slice(0, 250);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO admin_sessions (id, admin_id, token_hash, csrf_token_hash, user_agent, ip_hash, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(generateId('sess'), adminId, tokenHash, csrfTokenHash, ua, ipHash, expiresAt)
    .run();

  return {
    sessionToken,
    csrfToken,
    cookieHeader: buildSessionCookie(request, env, sessionToken),
  };
}

export async function getAuthenticatedAdmin(
  request: Request,
  env: WorkerEnv,
): Promise<{ ctx: AuthenticatedContext | null; csrfTokenPlain?: string }> {
  const cookies = parseCookies(request);
  const rawToken = cookies[SESSION_COOKIE_NAME];
  if (!rawToken) return { ctx: null };

  const tokenHash = await sha256Hex(rawToken);
  const nowIso = new Date().toISOString();

  const row = await env.DB.prepare(
    `SELECT
       s.id AS session_id,
       s.csrf_token_hash,
       s.expires_at,
       s.revoked_at,
       a.id AS admin_id,
       a.email,
       a.display_name,
       a.bio,
       a.role,
       a.is_active,
       a.last_login_at
     FROM admin_sessions s
     INNER JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ?
     LIMIT 1`,
  )
    .bind(tokenHash)
    .first<{
      session_id: string;
      csrf_token_hash: string;
      expires_at: string;
      revoked_at: string | null;
      admin_id: string;
      email: string;
      display_name: string;
      bio: string;
      role: string;
      is_active: number;
      last_login_at: string | null;
    }>();

  if (!row || row.revoked_at || row.is_active !== 1 || row.expires_at <= nowIso) {
    return { ctx: null };
  }

  return {
    ctx: {
      admin: {
        id: row.admin_id,
        email: row.email,
        displayName: row.display_name,
        bio: row.bio,
        role: row.role,
        lastLoginAt: row.last_login_at,
      },
      sessionId: row.session_id,
      csrfTokenHash: row.csrf_token_hash,
    },
  };
}

export async function requireAdmin(
  request: Request,
  env: WorkerEnv,
  options?: { verifyCsrf?: boolean },
): Promise<{ auth: AuthenticatedContext } | { error: Response }> {
  const { ctx } = await getAuthenticatedAdmin(request, env);
  if (!ctx) {
    return {
      error: errorResponse(request, env, 401, 'Authentication required.', 'UNAUTHORIZED', {
        isPrivate: true,
      }),
    };
  }

  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase());
  if (isMutation && (options?.verifyCsrf ?? true)) {
    if (!isOriginAllowedForMutation(request, env)) {
      return {
        error: errorResponse(request, env, 403, 'Origin not permitted.', 'FORBIDDEN_ORIGIN', {
          isPrivate: true,
        }),
      };
    }

    const csrfHeader = request.headers.get('X-CSRF-Token') || '';
    if (!csrfHeader) {
      return {
        error: errorResponse(request, env, 403, 'Missing CSRF token.', 'CSRF_REQUIRED', {
          isPrivate: true,
        }),
      };
    }

    const headerHash = await sha256Hex(csrfHeader);
    if (!constantTimeEqual(headerHash, ctx.csrfTokenHash)) {
      return {
        error: errorResponse(request, env, 403, 'Invalid CSRF token.', 'CSRF_INVALID', {
          isPrivate: true,
        }),
      };
    }
  }

  return { auth: ctx };
}

export async function checkRateLimit(
  env: WorkerEnv,
  key: string,
  maxAttempts = MAX_LOGIN_ATTEMPTS,
  windowMs = RATE_LIMIT_WINDOW_MS,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const keyHash = await sha256Hex(key);
  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT attempts_count, first_attempt_at, locked_until FROM login_attempts WHERE key_hash = ?`,
  )
    .bind(keyHash)
    .first<{ attempts_count: number; first_attempt_at: string; locked_until: string | null }>();

  if (!row) return { allowed: true, retryAfterSeconds: 0 };

  if (row.locked_until) {
    const lockedMs = Date.parse(row.locked_until);
    if (Number.isFinite(lockedMs) && lockedMs > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((lockedMs - now) / 1000)),
      };
    }
  }

  const firstMs = Date.parse(row.first_attempt_at);
  if (Number.isFinite(firstMs) && now - firstMs > windowMs) {
    await env.DB.prepare(`DELETE FROM login_attempts WHERE key_hash = ?`).bind(keyHash).run();
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (row.attempts_count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((firstMs + windowMs - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function recordRateLimitHit(
  env: WorkerEnv,
  key: string,
  maxAttempts = MAX_LOGIN_ATTEMPTS,
  windowMs = RATE_LIMIT_WINDOW_MS,
): Promise<void> {
  const keyHash = await sha256Hex(key);
  const nowIso = new Date().toISOString();
  const now = Date.now();

  const existing = await env.DB.prepare(
    `SELECT attempts_count, first_attempt_at FROM login_attempts WHERE key_hash = ?`,
  )
    .bind(keyHash)
    .first<{ attempts_count: number; first_attempt_at: string }>();

  if (!existing || now - Date.parse(existing.first_attempt_at) > windowMs) {
    await env.DB.prepare(
      `INSERT INTO login_attempts (key_hash, attempts_count, first_attempt_at, last_attempt_at, locked_until)
       VALUES (?, 1, ?, ?, NULL)
       ON CONFLICT(key_hash) DO UPDATE SET
         attempts_count = 1,
         first_attempt_at = excluded.first_attempt_at,
         last_attempt_at = excluded.last_attempt_at,
         locked_until = NULL`,
    )
      .bind(keyHash, nowIso, nowIso)
      .run();
    return;
  }

  const nextCount = existing.attempts_count + 1;
  const lockedUntil = nextCount >= maxAttempts ? new Date(now + windowMs).toISOString() : null;
  await env.DB.prepare(
    `UPDATE login_attempts
     SET attempts_count = ?, last_attempt_at = ?, locked_until = ?
     WHERE key_hash = ?`,
  )
    .bind(nextCount, nowIso, lockedUntil, keyHash)
    .run();
}

export async function clearRateLimit(env: WorkerEnv, key: string): Promise<void> {
  const keyHash = await sha256Hex(key);
  await env.DB.prepare(`DELETE FROM login_attempts WHERE key_hash = ?`).bind(keyHash).run();
}

export async function recordRevision(
  env: WorkerEnv,
  entityType: string,
  entityId: string,
  action: string,
  snapshot: unknown,
  adminId: string,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO content_revisions (id, entity_type, entity_id, action, snapshot_json, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(generateId('rev'), entityType, entityId, action, JSON.stringify(snapshot), adminId)
    .run();
}

export type { AdminRecord };
