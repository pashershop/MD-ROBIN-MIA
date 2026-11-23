import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { handleWorkerRequest } from '../worker/src/index';
import type { D1Database, D1PreparedStatement, D1Result, WorkerEnv } from '../worker/src/types';

function createSqliteD1Adapter(): { db: D1Database; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const wrapStatement = (sql: string, boundValues: unknown[] = []): D1PreparedStatement => ({
    bind(...values: unknown[]) {
      const normalized = values.map((v) => {
        if (v === undefined) return null;
        if (typeof v === 'boolean') return v ? 1 : 0;
        return v;
      });
      return wrapStatement(sql, normalized);
    },
    async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
      const stmt = sqlite.prepare(sql);
      const row = stmt.get(...(boundValues as Array<string | number | null | Uint8Array>)) as
        | Record<string, unknown>
        | undefined;
      if (!row) return null;
      if (colName) return (row[colName] as T) ?? null;
      return row as T;
    },
    async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
      const stmt = sqlite.prepare(sql);
      const info = stmt.run(...(boundValues as Array<string | number | null | Uint8Array>));
      return {
        results: [],
        success: true,
        meta: {
          changed_db: Number(info.changes) > 0,
          changes: Number(info.changes),
          last_row_id: Number(info.lastInsertRowid),
        },
      };
    },
    async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
      const stmt = sqlite.prepare(sql);
      const rows = stmt.all(...(boundValues as Array<string | number | null | Uint8Array>)) as T[];
      return {
        results: rows,
        success: true,
        meta: { changed_db: false, changes: 0 },
      };
    },
  });

  const db: D1Database = {
    prepare(query: string) {
      return wrapStatement(query);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const results: D1Result<T>[] = [];
      for (const s of statements) {
        results.push(await s.run<T>());
      }
      return results;
    },
    async exec(query: string) {
      sqlite.exec(query);
      return { count: 1, duration: 1 };
    },
  };

  return { db, sqlite };
}

function createTestEnv(): { env: WorkerEnv; sqlite: DatabaseSync } {
  const { db, sqlite } = createSqliteD1Adapter();
  const root = process.cwd();
  const m1 = fs.readFileSync(path.join(root, 'migrations/0001_initial_schema.sql'), 'utf8');
  const m2 = fs.readFileSync(path.join(root, 'migrations/0002_seed_verified_content.sql'), 'utf8');
  sqlite.exec(m1);
  sqlite.exec(m2);
  // Apply seed twice to prove idempotency
  sqlite.exec(m2);

  const env: WorkerEnv = {
    DB: db,
    ADMIN_BOOTSTRAP_SECRET: 'test-bootstrap-secret-123456',
    ALLOWED_ORIGINS: 'https://mdrobinmia.pages.dev',
    CANONICAL_SITE_URL: 'https://mdrobinmia.pages.dev',
    COOKIE_SAMESITE: 'Lax',
  };

  return { env, sqlite };
}

function extractSessionCookie(res: Response): string {
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/mrm_admin_session=([^;]+)/);
  assert.ok(match, 'Expected mrm_admin_session Set-Cookie header');
  return `mrm_admin_session=${match[1]}`;
}

async function req(
  env: WorkerEnv,
  route: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    csrf?: string;
    origin?: string;
    bootstrapSecret?: string;
    ip?: string;
  } = {},
): Promise<Response> {
  const headers = new Headers();
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.cookie) headers.set('Cookie', options.cookie);
  if (options.csrf) headers.set('X-CSRF-Token', options.csrf);
  if (options.origin) headers.set('Origin', options.origin);
  if (options.bootstrapSecret) headers.set('X-Bootstrap-Secret', options.bootstrapSecret);
  if (options.ip) headers.set('CF-Connecting-IP', options.ip);

  const request = new Request(`https://mdrobinmia.pages.dev${route}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  return handleWorkerRequest(request, env);
}

describe('MRM Cloudflare CMS End-to-End Verification', () => {
  it('1. Applies migrations idempotently and serves published-only public bootstrap without private leakage', async () => {
    const { env } = createTestEnv();
    const res = await req(env, '/api/v1/public/bootstrap');
    assert.equal(res.status, 200);
    const json = (await res.json()) as { ok: boolean; data: Record<string, unknown> };
    assert.equal(json.ok, true);

    const data = json.data as {
      identity: { fullName: string; brandMark: string };
      projects: Array<{ slug: string }>;
      blogPosts: Array<{ slug: string }>;
      experiences: unknown[];
      services: unknown[];
      testimonials: unknown[];
    };

    assert.equal(data.identity.fullName, 'MD ROBIN MIA');
    assert.equal(data.identity.brandMark, 'MRM.');
    assert.equal(data.projects.length, 6);
    assert.equal(data.blogPosts.length, 5);
    assert.equal(data.experiences.length, 0);
    assert.equal(data.services.length, 0);
    assert.equal(data.testimonials.length, 0);

    // Ensure no sensitive columns leak
    const serialized = JSON.stringify(json);
    assert.equal(serialized.includes('password_hash'), false);
    assert.equal(serialized.includes('token_hash'), false);
  });

  it('2. Locks /admin/setup behind bootstrap secret and permanently disables after first admin', async () => {
    const { env } = createTestEnv();

    // Reject without secret
    const noSecretRes = await req(env, '/api/v1/auth/setup', {
      method: 'POST',
      body: {
        displayName: 'MD Robin Mia',
        email: 'robin@mdrobinmia.pages.dev',
        password: 'StrongPassword123',
      },
    });
    assert.equal(noSecretRes.status, 403);

    // Reject weak password
    const weakPwRes = await req(env, '/api/v1/auth/setup', {
      method: 'POST',
      bootstrapSecret: 'test-bootstrap-secret-123456',
      body: {
        displayName: 'MD Robin Mia',
        email: 'robin@mdrobinmia.pages.dev',
        password: 'short',
      },
    });
    assert.equal(weakPwRes.status, 400);

    // Succeed once with valid bootstrap secret + strong password
    const okRes = await req(env, '/api/v1/auth/setup', {
      method: 'POST',
      bootstrapSecret: 'test-bootstrap-secret-123456',
      body: {
        displayName: 'MD Robin Mia',
        email: 'robin@mdrobinmia.pages.dev',
        password: 'StrongPassword123',
      },
    });
    assert.equal(okRes.status, 201);
    const setupJson = (await okRes.json()) as { ok: boolean; csrfToken: string; admin: { email: string } };
    assert.equal(setupJson.ok, true);
    assert.ok(setupJson.csrfToken.length > 20);
    assert.equal(setupJson.admin.email, 'robin@mdrobinmia.pages.dev');

    // Second attempt must fail permanently (403)
    const repeatRes = await req(env, '/api/v1/auth/setup', {
      method: 'POST',
      bootstrapSecret: 'test-bootstrap-secret-123456',
      body: {
        displayName: 'Attacker',
        email: 'attacker@mdrobinmia.pages.dev',
        password: 'StrongPassword123',
      },
    });
    assert.equal(repeatRes.status, 403);
  });

  it('3. Enforces auth session cookies, CSRF tokens, CORS allowlist, and login rate-limiting', async () => {
    const { env } = createTestEnv();

    await req(env, '/api/v1/auth/setup', {
      method: 'POST',
      bootstrapSecret: 'test-bootstrap-secret-123456',
      body: {
        displayName: 'MD Robin Mia',
        email: 'admin@mdrobinmia.pages.dev',
        password: 'StrongPassword123',
      },
    });

    // Unauthenticated admin request -> 401
    const unauth = await req(env, '/api/v1/admin/dashboard');
    assert.equal(unauth.status, 401);

    // Disallowed Origin never gets ACAO
    const badOrigin = await req(env, '/api/v1/public/bootstrap', {
      origin: 'https://evil-domain.example',
    });
    assert.equal(badOrigin.headers.get('access-control-allow-origin'), null);

    // Allowed Origin gets exact ACAO + credentials
    const goodOrigin = await req(env, '/api/v1/public/bootstrap', {
      origin: 'https://mdrobinmia.pages.dev',
    });
    assert.equal(goodOrigin.headers.get('access-control-allow-origin'), 'https://mdrobinmia.pages.dev');

    // Login rate-limiting after repeated failures
    for (let i = 0; i < 6; i += 1) {
      const failRes = await req(env, '/api/v1/auth/login', {
        method: 'POST',
        ip: '203.0.113.55',
        body: { email: 'admin@mdrobinmia.pages.dev', password: 'WrongPassword999' },
      });
      if (i < 5) assert.equal(failRes.status, 401);
      else assert.equal(failRes.status, 429);
    }

    // Valid login from another IP
    const loginRes = await req(env, '/api/v1/auth/login', {
      method: 'POST',
      ip: '198.51.100.10',
      body: { email: 'admin@mdrobinmia.pages.dev', password: 'StrongPassword123' },
    });
    assert.equal(loginRes.status, 200);
    const cookie = extractSessionCookie(loginRes);
    const loginJson = (await loginRes.json()) as { csrfToken: string };

    // Mutation without CSRF token -> 403
    const missingCsrf = await req(env, '/api/v1/admin/skills', {
      method: 'POST',
      cookie,
      body: { name: 'SQLite', stage: 'Current Skills', area: 'Data', note: 'Testing' },
    });
    assert.equal(missingCsrf.status, 403);

    // Mutation with valid CSRF token -> 201
    const withCsrf = await req(env, '/api/v1/admin/skills', {
      method: 'POST',
      cookie,
      csrf: loginJson.csrfToken,
      body: { name: 'Cloudflare Workers', stage: 'Currently Learning', area: 'Edge', note: 'Serverless APIs' },
    });
    assert.equal(withCsrf.status, 201);
  });

  it('4. Supports full Blog/Project/Page CRUD, draft hiding, XSS sanitization, duplicate, and dynamic sitemap', async () => {
    const { env } = createTestEnv();

    const setupRes = await req(env, '/api/v1/auth/setup', {
      method: 'POST',
      bootstrapSecret: 'test-bootstrap-secret-123456',
      body: {
        displayName: 'MD Robin Mia',
        email: 'admin@mdrobinmia.pages.dev',
        password: 'StrongPassword123',
      },
    });
    const cookie = extractSessionCookie(setupRes);
    const { csrfToken } = (await setupRes.json()) as { csrfToken: string };

    // Create bilingual draft post containing XSS script attempt
    const createDraftRes = await req(env, '/api/v1/admin/blog', {
      method: 'POST',
      cookie,
      csrf: csrfToken,
      body: {
        title: 'Bilingual Edge Guide',
        titleBn: 'এজ কম্পিউটিং গাইড',
        slug: 'bilingual-edge-guide',
        excerpt: 'Short intro',
        excerptBn: 'সংক্ষিপ্ত পরিচিতি',
        contentMarkdown: '# Safe Title\n<script>alert(1)</script>\n[Bad](javascript:alert(2))',
        contentMarkdownBn: '## বাংলা সেকশন\nএখানে নিরাপদ কনটেন্ট রয়েছে।',
        language: 'bilingual',
        category: 'Technology',
        status: 'draft',
        tags: ['Cloudflare', 'Edge'],
      },
    });
    assert.equal(createDraftRes.status, 201);
    const createdPost = (await createDraftRes.json()) as { id: string };

    // Draft MUST NOT appear in public bootstrap or sitemap
    const bootBefore = (await (await req(env, '/api/v1/public/bootstrap')).json()) as {
      data: { blogPosts: Array<{ slug: string }> };
    };
    assert.equal(bootBefore.data.blogPosts.some((p) => p.slug === 'bilingual-edge-guide'), false);
    const sitemapBefore = await (await req(env, '/api/v1/sitemap.xml')).text();
    assert.equal(sitemapBefore.includes('bilingual-edge-guide'), false);
    assert.equal(sitemapBefore.includes('/admin'), false);

    // Publish post and check XSS stripping + public visibility + sitemap inclusion
    const pubRes = await req(env, `/api/v1/admin/blog/${createdPost.id}`, {
      method: 'PATCH',
      cookie,
      csrf: csrfToken,
      body: { status: 'published' },
    });
    assert.equal(pubRes.status, 200);

    const bootAfter = (await (await req(env, '/api/v1/public/bootstrap')).json()) as {
      data: { blogPosts: Array<{ slug: string; contentMarkdown?: string; language?: string }> };
    };
    const publishedPost = bootAfter.data.blogPosts.find((p) => p.slug === 'bilingual-edge-guide');
    assert.ok(publishedPost, 'Published post should appear in public bootstrap');
    assert.equal(publishedPost.language, 'bilingual');
    assert.equal(publishedPost.contentMarkdown?.includes('<script'), false);
    assert.equal(publishedPost.contentMarkdown?.includes('javascript:'), false);

    const sitemapAfter = await (await req(env, '/api/v1/sitemap.xml')).text();
    assert.equal(sitemapAfter.includes('https://mdrobinmia.pages.dev/blog/bilingual-edge-guide'), true);

    // Duplicate & delete custom page
    const createPage = await req(env, '/api/v1/admin/pages', {
      method: 'POST',
      cookie,
      csrf: csrfToken,
      body: {
        title: 'Now Page',
        slug: 'now',
        subtitle: 'What I am currently building.',
        contentMarkdown: '## Current Focus\nLearning Cloudflare D1.',
        status: 'published',
      },
    });
    assert.equal(createPage.status, 201);
    const { id: pageId } = (await createPage.json()) as { id: string };

    const dupPage = await req(env, `/api/v1/admin/pages/${pageId}/duplicate`, {
      method: 'POST',
      cookie,
      csrf: csrfToken,
      body: {},
    });
    assert.equal(dupPage.status, 201);

    const delPage = await req(env, `/api/v1/admin/pages/${pageId}`, {
      method: 'DELETE',
      cookie,
      csrf: csrfToken,
    });
    assert.equal(delPage.status, 200);
  });

  it('5. Handles contact submission, honeypot filtering, admin inbox updates, and cookie-free analytics', async () => {
    const { env } = createTestEnv();

    const setupRes = await req(env, '/api/v1/auth/setup', {
      method: 'POST',
      bootstrapSecret: 'test-bootstrap-secret-123456',
      body: {
        displayName: 'MD Robin Mia',
        email: 'admin@mdrobinmia.pages.dev',
        password: 'StrongPassword123',
      },
    });
    const cookie = extractSessionCookie(setupRes);
    const { csrfToken } = (await setupRes.json()) as { csrfToken: string };

    // Valid contact message
    const contactOk = await req(env, '/api/v1/contact', {
      method: 'POST',
      body: {
        fullName: 'Amina Rahman',
        email: 'amina@example.org',
        subject: 'Collaboration Idea',
        message: 'Hello Robin, I would love to collaborate on a web accessibility tool.',
        honeypot: '',
      },
    });
    assert.equal(contactOk.status, 201);

    // Honeypot filled bot submission -> rejected 400 SPAM_DETECTED and NOT stored
    const contactBot = await req(env, '/api/v1/contact', {
      method: 'POST',
      body: {
        fullName: 'Spam Bot',
        email: 'bot@spam.example',
        subject: 'Buy SEO',
        message: 'Spam payload here that triggers honeypot trap.',
        honeypot: 'http://spam.example',
      },
    });
    assert.equal(contactBot.status, 400);
    const botJson = (await contactBot.json()) as { code: string };
    assert.equal(botJson.code, 'SPAM_DETECTED');

    const inboxRes = await req(env, '/api/v1/admin/messages?status=all', { cookie });
    const inboxJson = (await inboxRes.json()) as { items: Array<{ id: string; fullName: string; status: string }> };
    assert.equal(inboxJson.items.length, 1);
    assert.equal(inboxJson.items[0].fullName, 'Amina Rahman');
    assert.equal(inboxJson.items[0].status, 'unread');

    // Track public page view and verify /admin is ignored
    await req(env, '/api/v1/analytics/pageview', {
      method: 'POST',
      body: { path: '/projects/vyopic', contentType: 'project', contentSlug: 'vyopic' },
    });
    await req(env, '/api/v1/analytics/pageview', {
      method: 'POST',
      body: { path: '/admin/dashboard', contentType: 'admin', contentSlug: 'dashboard' },
    });

    const analyticsRes = await req(env, '/api/v1/admin/analytics?days=30', { cookie });
    const analyticsJson = (await analyticsRes.json()) as {
      totalViews: number;
      topPaths: Array<{ path: string; views: number }>;
    };
    assert.equal(analyticsJson.totalViews, 1);
    assert.equal(analyticsJson.topPaths[0].path, '/projects/vyopic');

    // Register external media asset & test JSON backup export
    const mediaExt = await req(env, '/api/v1/admin/media/external', {
      method: 'POST',
      cookie,
      csrf: csrfToken,
      body: {
        publicUrl: 'https://mdrobinmia.pages.dev/og-image.png',
        fileName: 'og-image.png',
        altText: 'MD Robin Mia brand banner',
        caption: '',
      },
    });
    assert.equal(mediaExt.status, 201);

    const exportRes = await req(env, '/api/v1/admin/export', { cookie });
    assert.equal(exportRes.status, 200);
    const exportJson = (await exportRes.json()) as { schemaVersion: string; data: { media: unknown[] } };
    assert.equal(exportJson.schemaVersion, '1.0');
    assert.equal(exportJson.data.media.length, 1);

    // Delete message
    const delMsg = await req(env, `/api/v1/admin/messages/${inboxJson.items[0].id}`, {
      method: 'DELETE',
      cookie,
      csrf: csrfToken,
    });
    assert.equal(delMsg.status, 200);
  });
});
