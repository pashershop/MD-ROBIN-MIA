import {
  checkRateLimit,
  clearRateLimit,
  clearSessionCookie,
  createAdminSession,
  getAuthenticatedAdmin,
  getClientIp,
  isOriginAllowedForMutation,
  recordRateLimitHit,
  requireAdmin,
} from '../auth';
import { errorResponse, jsonResponse } from '../cors';
import {
  constantTimeEqual,
  generateId,
  generateRandomToken,
  hashPassword,
  sha256Hex,
  verifyPassword,
} from '../crypto';
import { cleanString, sanitizeEmail, validateStrongPassword } from '../sanitize';
import type { AdminRecord, WorkerEnv } from '../types';

export async function handleAuthRoutes(
  request: Request,
  env: WorkerEnv,
  path: string,
): Promise<Response | null> {
  // GET /api/v1/auth/status
  if (path === '/api/v1/auth/status' && request.method === 'GET') {
    const countRow = await env.DB.prepare(`SELECT COUNT(*) AS cnt FROM admins`).first<{
      cnt: number;
    }>();
    const adminConfigured = (countRow?.cnt ?? 0) > 0;
    const { ctx } = await getAuthenticatedAdmin(request, env);
    return jsonResponse(
      request,
      env,
      {
        ok: true,
        adminConfigured,
        authenticated: Boolean(ctx),
        bootstrapConfigured: Boolean(env.ADMIN_BOOTSTRAP_SECRET && env.ADMIN_BOOTSTRAP_SECRET.length >= 16),
        r2Configured: Boolean(env.MEDIA_BUCKET),
      },
      200,
      { isPrivate: true },
    );
  }

  // POST /api/v1/auth/setup (one-time bootstrap protected by ADMIN_BOOTSTRAP_SECRET)
  if (path === '/api/v1/auth/setup' && request.method === 'POST') {
    if (!isOriginAllowedForMutation(request, env)) {
      return errorResponse(request, env, 403, 'Origin not permitted.', 'FORBIDDEN_ORIGIN', {
        isPrivate: true,
      });
    }

    const ip = getClientIp(request);
    const rate = await checkRateLimit(env, `setup:${ip}`, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return errorResponse(
        request,
        env,
        429,
        'Too many setup attempts. Please wait and try again.',
        'RATE_LIMITED',
        {
          isPrivate: true,
          extraHeaders: { 'Retry-After': String(rate.retryAfterSeconds) },
        },
      );
    }

    if (!env.ADMIN_BOOTSTRAP_SECRET || env.ADMIN_BOOTSTRAP_SECRET.length < 16) {
      return errorResponse(
        request,
        env,
        503,
        'Initial setup is locked until ADMIN_BOOTSTRAP_SECRET (16+ characters) is configured in Cloudflare Worker Secrets.',
        'BOOTSTRAP_SECRET_MISSING',
        { isPrivate: true },
      );
    }

    const existingCount = await env.DB.prepare(`SELECT COUNT(*) AS cnt FROM admins`).first<{
      cnt: number;
    }>();
    if ((existingCount?.cnt ?? 0) > 0) {
      return errorResponse(
        request,
        env,
        403,
        'Admin account already initialized. Public registration is disabled.',
        'SETUP_ALREADY_COMPLETED',
        { isPrivate: true },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', {
        isPrivate: true,
      });
    }

    const suppliedSecret =
      request.headers.get('X-Bootstrap-Secret') ||
      (typeof body.bootstrapSecret === 'string' ? body.bootstrapSecret : '');
    if (!suppliedSecret || !constantTimeEqual(suppliedSecret, env.ADMIN_BOOTSTRAP_SECRET)) {
      await recordRateLimitHit(env, `setup:${ip}`, 5, 15 * 60 * 1000);
      return errorResponse(request, env, 403, 'Invalid bootstrap secret.', 'INVALID_BOOTSTRAP_SECRET', {
        isPrivate: true,
      });
    }

    const email = sanitizeEmail(body.email);
    const displayName = cleanString(body.displayName, 80) || 'MD Robin Mia';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email) {
      return errorResponse(request, env, 400, 'Please enter a valid admin email address.', 'INVALID_EMAIL', {
        isPrivate: true,
      });
    }

    const pwError = validateStrongPassword(password);
    if (pwError) {
      return errorResponse(request, env, 400, pwError, 'WEAK_PASSWORD', { isPrivate: true });
    }

    const adminId = generateId('adm');
    const passwordHash = await hashPassword(password);
    const nowIso = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO admins (id, email, password_hash, display_name, bio, role, is_active, last_login_at)
       VALUES (?, ?, ?, ?, ?, 'owner', 1, ?)`,
    )
      .bind(
        adminId,
        email,
        passwordHash,
        displayName,
        'Technology Explorer & Entrepreneur — Founder of MRM.',
        nowIso,
      )
      .run();

    await clearRateLimit(env, `setup:${ip}`);
    const session = await createAdminSession(request, env, adminId);

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        csrfToken: session.csrfToken,
        admin: {
          id: adminId,
          email,
          displayName,
          bio: 'Technology Explorer & Entrepreneur — Founder of MRM.',
          role: 'owner',
          lastLoginAt: nowIso,
        },
      },
      201,
      {
        isPrivate: true,
        extraHeaders: { 'Set-Cookie': session.cookieHeader },
      },
    );
  }

  // POST /api/v1/auth/login
  if (path === '/api/v1/auth/login' && request.method === 'POST') {
    if (!isOriginAllowedForMutation(request, env)) {
      return errorResponse(request, env, 403, 'Origin not permitted.', 'FORBIDDEN_ORIGIN', {
        isPrivate: true,
      });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', {
        isPrivate: true,
      });
    }

    const email = sanitizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const ip = getClientIp(request);
    const ipKey = `login:ip:${ip}`;
    const emailIpKey = `login:acct:${email}:${ip}`;

    const ipRate = await checkRateLimit(env, ipKey, 10, 15 * 60 * 1000);
    if (!ipRate.allowed) {
      return errorResponse(
        request,
        env,
        429,
        `Too many login attempts. Retry in ${ipRate.retryAfterSeconds} seconds.`,
        'RATE_LIMITED',
        {
          isPrivate: true,
          extraHeaders: { 'Retry-After': String(ipRate.retryAfterSeconds) },
        },
      );
    }

    if (email) {
      const acctRate = await checkRateLimit(env, emailIpKey, 5, 15 * 60 * 1000);
      if (!acctRate.allowed) {
        return errorResponse(
          request,
          env,
          429,
          `Too many failed login attempts for this account. Retry in ${acctRate.retryAfterSeconds} seconds.`,
          'RATE_LIMITED',
          {
            isPrivate: true,
            extraHeaders: { 'Retry-After': String(acctRate.retryAfterSeconds) },
          },
        );
      }
    }

    if (!email || !password) {
      await recordRateLimitHit(env, ipKey, 10, 15 * 60 * 1000);
      return errorResponse(request, env, 400, 'Email and password are required.', 'MISSING_CREDENTIALS', {
        isPrivate: true,
      });
    }

    const admin = await env.DB.prepare(
      `SELECT id, email, password_hash, display_name, bio, role, is_active, last_login_at
       FROM admins WHERE email = ? LIMIT 1`,
    )
      .bind(email)
      .first<AdminRecord>();

    const valid = admin && admin.is_active === 1 && (await verifyPassword(password, admin.password_hash));
    if (!valid || !admin) {
      await recordRateLimitHit(env, ipKey, 10, 15 * 60 * 1000);
      await recordRateLimitHit(env, emailIpKey, 5, 15 * 60 * 1000);
      return errorResponse(request, env, 401, 'Invalid email or password.', 'INVALID_CREDENTIALS', {
        isPrivate: true,
      });
    }

    await clearRateLimit(env, ipKey);
    await clearRateLimit(env, emailIpKey);

    const nowIso = new Date().toISOString();
    await env.DB.prepare(`UPDATE admins SET last_login_at = ?, updated_at = ? WHERE id = ?`)
      .bind(nowIso, nowIso, admin.id)
      .run();

    const session = await createAdminSession(request, env, admin.id);
    return jsonResponse(
      request,
      env,
      {
        ok: true,
        csrfToken: session.csrfToken,
        admin: {
          id: admin.id,
          email: admin.email,
          displayName: admin.display_name,
          bio: admin.bio,
          role: admin.role,
          lastLoginAt: nowIso,
        },
      },
      200,
      {
        isPrivate: true,
        extraHeaders: { 'Set-Cookie': session.cookieHeader },
      },
    );
  }

  // GET /api/v1/auth/me (rotates in-memory CSRF token tied to active HttpOnly cookie session)
  if (path === '/api/v1/auth/me' && request.method === 'GET') {
    const authRes = await requireAdmin(request, env, { verifyCsrf: false });
    if ('error' in authRes) return authRes.error;

    const freshCsrfToken = generateRandomToken(24);
    const freshCsrfHash = await sha256Hex(freshCsrfToken);
    await env.DB.prepare(`UPDATE admin_sessions SET csrf_token_hash = ? WHERE id = ?`)
      .bind(freshCsrfHash, authRes.auth.sessionId)
      .run();

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        csrfToken: freshCsrfToken,
        admin: authRes.auth.admin,
      },
      200,
      { isPrivate: true },
    );
  }

  // POST /api/v1/auth/logout
  if (path === '/api/v1/auth/logout' && request.method === 'POST') {
    const { ctx } = await getAuthenticatedAdmin(request, env);
    if (ctx) {
      const nowIso = new Date().toISOString();
      await env.DB.prepare(`UPDATE admin_sessions SET revoked_at = ? WHERE id = ?`)
        .bind(nowIso, ctx.sessionId)
        .run();
    }
    return jsonResponse(
      request,
      env,
      { ok: true },
      200,
      {
        isPrivate: true,
        extraHeaders: { 'Set-Cookie': clearSessionCookie(request, env) },
      },
    );
  }

  // POST /api/v1/auth/logout-all
  if (path === '/api/v1/auth/logout-all' && request.method === 'POST') {
    const authRes = await requireAdmin(request, env);
    if ('error' in authRes) return authRes.error;

    const nowIso = new Date().toISOString();
    await env.DB.prepare(`UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL`)
      .bind(nowIso, authRes.auth.admin.id)
      .run();

    return jsonResponse(
      request,
      env,
      { ok: true },
      200,
      {
        isPrivate: true,
        extraHeaders: { 'Set-Cookie': clearSessionCookie(request, env) },
      },
    );
  }

  // PATCH /api/v1/auth/profile
  if (path === '/api/v1/auth/profile' && request.method === 'PATCH') {
    const authRes = await requireAdmin(request, env);
    if ('error' in authRes) return authRes.error;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', {
        isPrivate: true,
      });
    }

    const displayName = cleanString(body.displayName, 80);
    const email = sanitizeEmail(body.email);
    const bio = cleanString(body.bio, 500);

    if (!displayName || !email) {
      return errorResponse(request, env, 400, 'Display name and valid email are required.', 'VALIDATION_ERROR', {
        isPrivate: true,
      });
    }

    const nowIso = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE admins SET display_name = ?, email = ?, bio = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(displayName, email, bio, nowIso, authRes.auth.admin.id)
      .run();

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        admin: {
          ...authRes.auth.admin,
          displayName,
          email,
          bio,
        },
      },
      200,
      { isPrivate: true },
    );
  }

  // POST /api/v1/auth/change-password
  if (path === '/api/v1/auth/change-password' && request.method === 'POST') {
    const authRes = await requireAdmin(request, env);
    if ('error' in authRes) return authRes.error;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', {
        isPrivate: true,
      });
    }

    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const revokeOthers = body.revokeOtherSessions !== false;

    const record = await env.DB.prepare(`SELECT password_hash FROM admins WHERE id = ?`)
      .bind(authRes.auth.admin.id)
      .first<{ password_hash: string }>();

    if (!record || !(await verifyPassword(currentPassword, record.password_hash))) {
      return errorResponse(request, env, 401, 'Current password is incorrect.', 'INVALID_PASSWORD', {
        isPrivate: true,
      });
    }

    const pwError = validateStrongPassword(newPassword);
    if (pwError) {
      return errorResponse(request, env, 400, pwError, 'WEAK_PASSWORD', { isPrivate: true });
    }

    const newHash = await hashPassword(newPassword);
    const nowIso = new Date().toISOString();
    await env.DB.prepare(`UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?`)
      .bind(newHash, nowIso, authRes.auth.admin.id)
      .run();

    if (revokeOthers) {
      await env.DB.prepare(
        `UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND id != ? AND revoked_at IS NULL`,
      )
        .bind(nowIso, authRes.auth.admin.id, authRes.auth.sessionId)
        .run();
    }

    return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
  }

  return null;
}
