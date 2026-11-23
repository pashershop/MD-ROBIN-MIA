import { recordRevision, requireAdmin } from '../auth';
import { errorResponse, jsonResponse } from '../cors';
import { generateId } from '../crypto';
import {
  cleanOptionalString,
  cleanString,
  estimateReadingTimeMinutes,
  parseJsonSafe,
  sanitizeEmail,
  sanitizeMarkdownContent,
  sanitizeSlug,
  sanitizeStringArray,
  sanitizeUrl,
} from '../sanitize';
import type { WorkerEnv } from '../types';

const VALID_PUB_STATUS = new Set(['draft', 'published', 'archived']);
const VALID_BLOG_STATUS = new Set(['draft', 'published', 'scheduled', 'archived']);
const VALID_PROJECT_STATUS = new Set(['Live', 'In Development', 'Concept', 'Planned']);
const VALID_SKILL_STAGE = new Set(['Current Skills', 'Currently Learning', 'Areas of Interest']);
const VALID_ACHIEVEMENT_GROUP = new Set([
  'Certificates Showcase',
  'Educational Background',
  'Personal Milestones',
  'Awards & Recognition',
]);

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function handleAdminRoutes(
  request: Request,
  env: WorkerEnv,
  path: string,
  url: URL,
): Promise<Response | null> {
  if (!path.startsWith('/api/v1/admin/')) {
    return null;
  }

  const authRes = await requireAdmin(request, env);
  if ('error' in authRes) return authRes.error;
  const { admin } = authRes.auth;

  // 1. Dashboard Overview: GET /api/v1/admin/dashboard
  if (path === '/api/v1/admin/dashboard' && request.method === 'GET') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [
      pagesCount,
      projectsCount,
      postsCount,
      draftPostsCount,
      skillsCount,
      achievementsCount,
      unreadMessagesCount,
      mediaCount,
      viewsRow,
      recentMessages,
      recentRevisions,
    ] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM pages WHERE status = 'published'`).first<{ cnt: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM projects`).first<{ cnt: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM blog_posts WHERE status = 'published'`).first<{ cnt: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM blog_posts WHERE status = 'draft'`).first<{ cnt: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM skills WHERE status = 'published'`).first<{ cnt: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM achievements WHERE status = 'published'`).first<{ cnt: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM contact_messages WHERE status = 'unread'`).first<{ cnt: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS cnt FROM media`).first<{ cnt: number }>(),
      env.DB.prepare(`SELECT COALESCE(SUM(views_count), 0) AS total FROM page_views WHERE view_date >= ?`)
        .bind(thirtyDaysAgo)
        .first<{ total: number }>(),
      env.DB.prepare(
        `SELECT id, full_name, email, subject, status, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 5`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, entity_type, entity_id, action, created_at FROM content_revisions ORDER BY created_at DESC LIMIT 8`,
      ).all<Record<string, unknown>>(),
    ]);

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        r2Configured: Boolean(env.MEDIA_BUCKET),
        counts: {
          publishedPages: pagesCount?.cnt ?? 0,
          totalProjects: projectsCount?.cnt ?? 0,
          publishedPosts: postsCount?.cnt ?? 0,
          draftPosts: draftPostsCount?.cnt ?? 0,
          publishedSkills: skillsCount?.cnt ?? 0,
          publishedAchievements: achievementsCount?.cnt ?? 0,
          unreadMessages: unreadMessagesCount?.cnt ?? 0,
          mediaItems: mediaCount?.cnt ?? 0,
          viewsLast30Days: viewsRow?.total ?? 0,
        },
        recentMessages: recentMessages.results.map((m) => ({
          id: m.id,
          fullName: m.full_name,
          email: m.email,
          subject: m.subject,
          status: m.status,
          createdAt: m.created_at,
        })),
        recentRevisions: recentRevisions.results.map((r) => ({
          id: r.id,
          entityType: r.entity_type,
          entityId: r.entity_id,
          action: r.action,
          createdAt: r.created_at,
        })),
      },
      200,
      { isPrivate: true },
    );
  }

  // 2. Pages CRUD + Duplicate
  if (path === '/api/v1/admin/pages') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM pages ORDER BY sort_order ASC, created_at DESC`).all<
        Record<string, unknown>
      >();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            subtitle: p.subtitle,
            heroLabel: p.hero_label,
            contentMarkdown: p.content_markdown,
            seoTitle: p.seo_title,
            seoDescription: p.seo_description,
            canonicalPath: p.canonical_path,
            noIndex: Boolean(p.no_index),
            status: p.status,
            isSystem: Boolean(p.is_system),
            sortOrder: p.sort_order,
            updatedAt: p.updated_at,
          })),
        },
        200,
        { isPrivate: true },
      );
    }

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const title = cleanString(body.title, 160);
      const slug = sanitizeSlug(body.slug || title);
      if (!title || !slug) {
        return errorResponse(request, env, 400, 'Page title and valid slug are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'draft';
      const id = generateId('page');
      const nowIso = new Date().toISOString();
      const contentMarkdown = sanitizeMarkdownContent(body.contentMarkdown);

      try {
        await env.DB.prepare(
          `INSERT INTO pages (id, slug, title, subtitle, hero_label, content_markdown, seo_title, seo_description, canonical_path, no_index, status, is_system, sort_order, published_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        )
          .bind(
            id,
            slug,
            title,
            cleanString(body.subtitle, 500),
            cleanString(body.heroLabel, 120),
            contentMarkdown,
            cleanString(body.seoTitle, 160) || `${title} | MD ROBIN MIA`,
            cleanString(body.seoDescription, 320),
            cleanString(body.canonicalPath, 200) || `/p/${slug}`,
            body.noIndex ? 1 : 0,
            status,
            Number(body.sortOrder ?? 10),
            status === 'published' ? nowIso : null,
            nowIso,
            nowIso,
          )
          .run();
      } catch {
        return errorResponse(request, env, 409, 'A page with this slug already exists.', 'DUPLICATE_SLUG', {
          isPrivate: true,
        });
      }

      await recordRevision(env, 'page', id, 'create', { id, slug, title, status }, admin.id);
      return jsonResponse(request, env, { ok: true, id, slug }, 201, { isPrivate: true });
    }
  }

  const pageActionMatch = path.match(/^\/api\/v1\/admin\/pages\/([a-zA-Z0-9_-]+)(?:\/(duplicate))?$/);
  if (pageActionMatch) {
    const [, pageId, action] = pageActionMatch;
    if (action === 'duplicate' && request.method === 'POST') {
      const src = await env.DB.prepare(`SELECT * FROM pages WHERE id = ?`).bind(pageId).first<Record<string, unknown>>();
      if (!src) return errorResponse(request, env, 404, 'Page not found.', 'NOT_FOUND', { isPrivate: true });
      const newId = generateId('page');
      const newSlug = `${src.slug}-copy-${Date.now().toString(36).slice(-4)}`;
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO pages (id, slug, title, subtitle, hero_label, content_markdown, seo_title, seo_description, canonical_path, no_index, status, is_system, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, ?, ?, ?)`,
      )
        .bind(
          newId,
          newSlug,
          `${src.title} (Copy)`,
          src.subtitle,
          src.hero_label,
          src.content_markdown,
          src.seo_title,
          src.seo_description,
          `/p/${newSlug}`,
          src.no_index,
          Number(src.sort_order ?? 10) + 1,
          nowIso,
          nowIso,
        )
        .run();
      return jsonResponse(request, env, { ok: true, id: newId, slug: newSlug }, 201, { isPrivate: true });
    }

    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM pages WHERE id = ?`).bind(pageId).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Page not found.', 'NOT_FOUND', { isPrivate: true });
      const title = cleanString(body.title ?? existing.title, 160);
      const slug = existing.is_system ? String(existing.slug) : sanitizeSlug(body.slug ?? existing.slug, String(existing.slug));
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : String(existing.status);
      const nowIso = new Date().toISOString();

      await env.DB.prepare(
        `UPDATE pages SET slug = ?, title = ?, subtitle = ?, hero_label = ?, content_markdown = ?, seo_title = ?, seo_description = ?, canonical_path = ?, no_index = ?, status = ?, sort_order = ?, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?`,
      )
        .bind(
          slug,
          title,
          cleanString(body.subtitle ?? existing.subtitle, 500),
          cleanString(body.heroLabel ?? existing.hero_label, 120),
          sanitizeMarkdownContent(body.contentMarkdown ?? existing.content_markdown),
          cleanString(body.seoTitle ?? existing.seo_title, 160),
          cleanString(body.seoDescription ?? existing.seo_description, 320),
          cleanString(body.canonicalPath ?? existing.canonical_path, 200),
          body.noIndex !== undefined ? (body.noIndex ? 1 : 0) : existing.no_index,
          status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          status === 'published' ? nowIso : null,
          nowIso,
          pageId,
        )
        .run();

      await recordRevision(env, 'page', pageId, 'update', { id: pageId, title, status }, admin.id);
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }

    if (request.method === 'DELETE') {
      const existing = await env.DB.prepare(`SELECT is_system FROM pages WHERE id = ?`).bind(pageId).first<{ is_system: number }>();
      if (!existing) return errorResponse(request, env, 404, 'Page not found.', 'NOT_FOUND', { isPrivate: true });
      if (existing.is_system === 1) {
        return errorResponse(request, env, 400, 'Core system routes cannot be deleted; unpublish or edit instead.', 'SYSTEM_PAGE_PROTECTED', {
          isPrivate: true,
        });
      }
      await env.DB.prepare(`DELETE FROM pages WHERE id = ?`).bind(pageId).run();
      await recordRevision(env, 'page', pageId, 'delete', { id: pageId }, admin.id);
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 3. Homepage Sections
  if (path === '/api/v1/admin/homepage-sections') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM homepage_sections ORDER BY sort_order ASC`).all<
        Record<string, unknown>
      >();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((s) => ({
            id: s.id,
            sectionKey: s.section_key,
            sectionNumber: s.section_number,
            title: s.title,
            subtitle: s.subtitle,
            contentMarkdown: s.content_markdown,
            ctaLabel: s.cta_label,
            ctaUrl: s.cta_url,
            isVisible: Boolean(s.is_visible),
            sortOrder: s.sort_order,
            status: s.status,
          })),
        },
        200,
        { isPrivate: true },
      );
    }

    if (request.method === 'PUT') {
      const body = await readJsonBody(request);
      if (!body || !Array.isArray(body.items)) {
        return errorResponse(request, env, 400, 'Expected items array.', 'VALIDATION_ERROR', { isPrivate: true });
      }
      const nowIso = new Date().toISOString();
      for (let i = 0; i < body.items.length; i += 1) {
        const item = body.items[i] as Record<string, unknown>;
        if (!item.id) continue;
        await env.DB.prepare(
          `UPDATE homepage_sections SET section_number = ?, title = ?, subtitle = ?, content_markdown = ?, cta_label = ?, cta_url = ?, is_visible = ?, sort_order = ?, status = ?, updated_at = ? WHERE id = ?`,
        )
          .bind(
            cleanString(item.sectionNumber, 12) || String(i + 1).padStart(2, '0'),
            cleanString(item.title, 160),
            cleanString(item.subtitle, 240),
            sanitizeMarkdownContent(item.contentMarkdown),
            cleanString(item.ctaLabel, 80),
            sanitizeUrl(item.ctaUrl, { allowRelative: true }) || '',
            item.isVisible === false ? 0 : 1,
            Number(item.sortOrder ?? i + 1),
            VALID_PUB_STATUS.has(String(item.status)) ? String(item.status) : 'published',
            nowIso,
            String(item.id),
          )
          .run();
      }
      await recordRevision(env, 'homepage_sections', 'all', 'update', { count: body.items.length }, admin.id);
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 4. About Sections CRUD
  if (path === '/api/v1/admin/about') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM about_sections ORDER BY sort_order ASC`).all<
        Record<string, unknown>
      >();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((r) => ({
            id: r.id,
            slug: r.slug,
            title: r.title,
            content: r.content,
            isPlaceholder: Boolean(r.is_placeholder),
            status: r.status,
            sortOrder: r.sort_order,
          })),
        },
        200,
        { isPrivate: true },
      );
    }

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const title = cleanString(body.title, 160);
      const content = cleanString(body.content, 5000);
      const slug = sanitizeSlug(body.slug || title, generateId('abt'));
      if (!title || !content) {
        return errorResponse(request, env, 400, 'Title and content are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const id = generateId('abt');
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'published';
      await env.DB.prepare(
        `INSERT INTO about_sections (id, slug, title, content, is_placeholder, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(id, slug, title, content, body.isPlaceholder ? 1 : 0, status, Number(body.sortOrder ?? 10))
        .run();
      return jsonResponse(request, env, { ok: true, id }, 201, { isPrivate: true });
    }
  }

  const aboutIdMatch = path.match(/^\/api\/v1\/admin\/about\/([a-zA-Z0-9_-]+)$/);
  if (aboutIdMatch) {
    const id = aboutIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM about_sections WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'About section not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE about_sections SET title = ?, content = ?, is_placeholder = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(
          cleanString(body.title ?? existing.title, 160),
          cleanString(body.content ?? existing.content, 5000),
          body.isPlaceholder !== undefined ? (body.isPlaceholder ? 1 : 0) : existing.is_placeholder,
          VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : existing.status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          nowIso,
          id,
        )
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM about_sections WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 5. Education CRUD
  if (path === '/api/v1/admin/education') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM education ORDER BY sort_order ASC`).all<Record<string, unknown>>();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((r) => ({
            id: r.id,
            period: r.period,
            title: r.title,
            institution: r.institution,
            location: r.location,
            summary: r.summary,
            isPlaceholder: Boolean(r.is_placeholder),
            status: r.status,
            sortOrder: r.sort_order,
          })),
        },
        200,
        { isPrivate: true },
      );
    }
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const title = cleanString(body.title, 200);
      const institution = cleanString(body.institution, 200);
      const period = cleanString(body.period, 80);
      if (!title || !institution || !period) {
        return errorResponse(request, env, 400, 'Period, title, and institution are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const id = generateId('edu');
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'published';
      await env.DB.prepare(
        `INSERT INTO education (id, period, title, institution, location, summary, is_placeholder, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id,
          period,
          title,
          institution,
          cleanString(body.location, 120),
          cleanString(body.summary, 2000),
          body.isPlaceholder ? 1 : 0,
          status,
          Number(body.sortOrder ?? 10),
        )
        .run();
      return jsonResponse(request, env, { ok: true, id }, 201, { isPrivate: true });
    }
  }

  const eduIdMatch = path.match(/^\/api\/v1\/admin\/education\/([a-zA-Z0-9_-]+)$/);
  if (eduIdMatch) {
    const id = eduIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM education WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Education entry not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE education SET period = ?, title = ?, institution = ?, location = ?, summary = ?, is_placeholder = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(
          cleanString(body.period ?? existing.period, 80),
          cleanString(body.title ?? existing.title, 200),
          cleanString(body.institution ?? existing.institution, 200),
          cleanString(body.location ?? existing.location, 120),
          cleanString(body.summary ?? existing.summary, 2000),
          body.isPlaceholder !== undefined ? (body.isPlaceholder ? 1 : 0) : existing.is_placeholder,
          VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : existing.status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          nowIso,
          id,
        )
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM education WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 6. Skills CRUD + Reorder
  if (path === '/api/v1/admin/skills') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM skills ORDER BY sort_order ASC`).all<Record<string, unknown>>();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((r) => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            stage: r.stage,
            area: r.area,
            note: r.note,
            iconKey: r.icon_key,
            status: r.status,
            sortOrder: r.sort_order,
          })),
        },
        200,
        { isPrivate: true },
      );
    }
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const name = cleanString(body.name, 120);
      const area = cleanString(body.area, 80);
      const note = cleanString(body.note, 600);
      const stage = VALID_SKILL_STAGE.has(String(body.stage)) ? String(body.stage) : 'Current Skills';
      if (!name || !area || !note) {
        return errorResponse(request, env, 400, 'Name, area, and note are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const id = generateId('sk');
      const slug = sanitizeSlug(body.slug || name, id);
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'published';
      await env.DB.prepare(
        `INSERT INTO skills (id, slug, name, stage, area, note, icon_key, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(id, slug, name, stage, area, note, cleanString(body.iconKey, 60) || slug, status, Number(body.sortOrder ?? 20))
        .run();
      return jsonResponse(request, env, { ok: true, id }, 201, { isPrivate: true });
    }
  }

  if (path === '/api/v1/admin/skills/reorder' && request.method === 'POST') {
    const body = await readJsonBody(request);
    if (!body || !Array.isArray(body.orderedIds)) {
      return errorResponse(request, env, 400, 'orderedIds array is required.', 'VALIDATION_ERROR', { isPrivate: true });
    }
    for (let i = 0; i < body.orderedIds.length; i += 1) {
      await env.DB.prepare(`UPDATE skills SET sort_order = ? WHERE id = ?`)
        .bind(i + 1, String(body.orderedIds[i]))
        .run();
    }
    return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
  }

  const skillIdMatch = path.match(/^\/api\/v1\/admin\/skills\/([a-zA-Z0-9_-]+)$/);
  if (skillIdMatch) {
    const id = skillIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM skills WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Skill not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE skills SET name = ?, stage = ?, area = ?, note = ?, icon_key = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(
          cleanString(body.name ?? existing.name, 120),
          VALID_SKILL_STAGE.has(String(body.stage)) ? String(body.stage) : existing.stage,
          cleanString(body.area ?? existing.area, 80),
          cleanString(body.note ?? existing.note, 600),
          cleanString(body.iconKey ?? existing.icon_key, 60),
          VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : existing.status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          nowIso,
          id,
        )
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM skills WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 7. Projects CRUD + Duplicate + Reorder + Gallery Images
  if (path === '/api/v1/admin/projects') {
    if (request.method === 'GET') {
      const [rows, imgs] = await Promise.all([
        env.DB.prepare(`SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC`).all<Record<string, unknown>>(),
        env.DB.prepare(`SELECT * FROM project_images ORDER BY sort_order ASC`).all<Record<string, unknown>>(),
      ]);
      const imgMap = new Map<string, Array<Record<string, unknown>>>();
      for (const im of imgs.results) {
        const list = imgMap.get(String(im.project_id)) ?? [];
        list.push({
          id: im.id,
          imageUrl: im.image_url,
          altText: im.alt_text,
          caption: im.caption,
          sortOrder: im.sort_order,
        });
        imgMap.set(String(im.project_id), list);
      }

      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            shortDescription: p.short_description,
            overview: p.overview,
            caseStudyMarkdown: p.case_study_markdown,
            category: p.category,
            projectStatus: p.project_status,
            websiteUrl: p.website_url,
            repoUrl: p.repo_url,
            urlPlaceholderNote: p.url_placeholder_note,
            highlights: parseJsonSafe<string[]>(String(p.highlights_json ?? '[]'), []),
            techStack: parseJsonSafe<string[]>(String(p.tech_stack_json ?? '[]'), []),
            developmentProgress: p.development_progress,
            coverImageUrl: p.cover_image_url,
            featured: Boolean(p.featured),
            status: p.status,
            sortOrder: p.sort_order,
            seoTitle: p.seo_title,
            seoDescription: p.seo_description,
            gallery: imgMap.get(String(p.id)) ?? [],
            updatedAt: p.updated_at,
          })),
        },
        200,
        { isPrivate: true },
      );
    }

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const name = cleanString(body.name, 140);
      const slug = sanitizeSlug(body.slug || name);
      const shortDescription = cleanString(body.shortDescription, 200);
      const overview = cleanString(body.overview, 3000);
      const category = cleanString(body.category, 80) || 'Digital Project';
      const projectStatus = VALID_PROJECT_STATUS.has(String(body.projectStatus))
        ? String(body.projectStatus)
        : 'Concept';
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'draft';
      if (!name || !slug || !shortDescription || !overview) {
        return errorResponse(request, env, 400, 'Name, slug, short description, and overview are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const id = generateId('proj');
      const nowIso = new Date().toISOString();
      const websiteUrl = sanitizeUrl(body.websiteUrl);
      const repoUrl = sanitizeUrl(body.repoUrl);
      const coverImageUrl = sanitizeUrl(body.coverImageUrl, { allowRelative: true });
      const highlights = sanitizeStringArray(body.highlights, 20, 240);
      const techStack = sanitizeStringArray(body.techStack, 20, 120);

      try {
        await env.DB.prepare(
          `INSERT INTO projects (
            id, slug, name, short_description, overview, case_study_markdown, category, project_status,
            website_url, repo_url, url_placeholder_note, highlights_json, tech_stack_json, development_progress,
            cover_image_url, featured, status, sort_order, seo_title, seo_description, published_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            id,
            slug,
            name,
            shortDescription,
            overview,
            sanitizeMarkdownContent(body.caseStudyMarkdown),
            category,
            projectStatus,
            websiteUrl,
            repoUrl,
            cleanString(body.urlPlaceholderNote, 240) || 'Website link will be published once this project launches.',
            JSON.stringify(highlights),
            JSON.stringify(techStack.length > 0 ? techStack : ['To be finalized']),
            cleanString(body.developmentProgress, 300) || 'Early scoping stage',
            coverImageUrl,
            body.featured ? 1 : 0,
            status,
            Number(body.sortOrder ?? 20),
            cleanString(body.seoTitle, 160) || `${name} — ${shortDescription} | MD ROBIN MIA`,
            cleanString(body.seoDescription, 320) || overview.slice(0, 160),
            status === 'published' ? nowIso : null,
            nowIso,
            nowIso,
          )
          .run();
      } catch {
        return errorResponse(request, env, 409, 'A project with this slug already exists.', 'DUPLICATE_SLUG', {
          isPrivate: true,
        });
      }

      await recordRevision(env, 'project', id, 'create', { id, slug, name, status }, admin.id);
      return jsonResponse(request, env, { ok: true, id, slug }, 201, { isPrivate: true });
    }
  }

  if (path === '/api/v1/admin/projects/reorder' && request.method === 'POST') {
    const body = await readJsonBody(request);
    if (!body || !Array.isArray(body.orderedIds)) {
      return errorResponse(request, env, 400, 'orderedIds array is required.', 'VALIDATION_ERROR', { isPrivate: true });
    }
    for (let i = 0; i < body.orderedIds.length; i += 1) {
      await env.DB.prepare(`UPDATE projects SET sort_order = ? WHERE id = ?`)
        .bind(i + 1, String(body.orderedIds[i]))
        .run();
    }
    return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
  }

  const projectSubMatch = path.match(/^\/api\/v1\/admin\/projects\/([a-zA-Z0-9_-]+)(?:\/(duplicate|images))?(?:\/([a-zA-Z0-9_-]+))?$/);
  if (projectSubMatch) {
    const [, projectId, subAction, imageId] = projectSubMatch;

    if (subAction === 'duplicate' && request.method === 'POST') {
      const src = await env.DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(projectId).first<Record<string, unknown>>();
      if (!src) return errorResponse(request, env, 404, 'Project not found.', 'NOT_FOUND', { isPrivate: true });
      const newId = generateId('proj');
      const newSlug = `${src.slug}-copy-${Date.now().toString(36).slice(-4)}`;
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO projects (
          id, slug, name, short_description, overview, case_study_markdown, category, project_status,
          website_url, repo_url, url_placeholder_note, highlights_json, tech_stack_json, development_progress,
          cover_image_url, featured, status, sort_order, seo_title, seo_description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'draft', ?, ?, ?, ?, ?)`,
      )
        .bind(
          newId,
          newSlug,
          `${src.name} (Copy)`,
          src.short_description,
          src.overview,
          src.case_study_markdown,
          src.category,
          src.project_status,
          src.website_url,
          src.repo_url,
          src.url_placeholder_note,
          src.highlights_json,
          src.tech_stack_json,
          src.development_progress,
          src.cover_image_url,
          Number(src.sort_order ?? 10) + 1,
          src.seo_title,
          src.seo_description,
          nowIso,
          nowIso,
        )
        .run();
      return jsonResponse(request, env, { ok: true, id: newId, slug: newSlug }, 201, { isPrivate: true });
    }

    if (subAction === 'images') {
      if (request.method === 'POST') {
        const body = await readJsonBody(request);
        if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
        const imageUrl = sanitizeUrl(body.imageUrl, { allowRelative: true });
        if (!imageUrl) {
          return errorResponse(request, env, 400, 'Valid image URL is required.', 'VALIDATION_ERROR', {
            isPrivate: true,
          });
        }
        const imgId = generateId('pimg');
        await env.DB.prepare(
          `INSERT INTO project_images (id, project_id, media_id, image_url, alt_text, caption, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            imgId,
            projectId,
            cleanOptionalString(body.mediaId, 120),
            imageUrl,
            cleanString(body.altText, 240),
            cleanString(body.caption, 300),
            Number(body.sortOrder ?? 1),
          )
          .run();
        return jsonResponse(request, env, { ok: true, id: imgId }, 201, { isPrivate: true });
      }
      if (request.method === 'DELETE' && imageId) {
        await env.DB.prepare(`DELETE FROM project_images WHERE id = ? AND project_id = ?`)
          .bind(imageId, projectId)
          .run();
        return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
      }
    }

    if (!subAction && request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(projectId).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Project not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : String(existing.status);
      const slug = sanitizeSlug(body.slug ?? existing.slug, String(existing.slug));
      const highlights = body.highlights !== undefined
        ? JSON.stringify(sanitizeStringArray(body.highlights, 20, 240))
        : String(existing.highlights_json);
      const techStack = body.techStack !== undefined
        ? JSON.stringify(sanitizeStringArray(body.techStack, 20, 120))
        : String(existing.tech_stack_json);

      await env.DB.prepare(
        `UPDATE projects SET
          slug = ?, name = ?, short_description = ?, overview = ?, case_study_markdown = ?, category = ?,
          project_status = ?, website_url = ?, repo_url = ?, url_placeholder_note = ?, highlights_json = ?,
          tech_stack_json = ?, development_progress = ?, cover_image_url = ?, featured = ?, status = ?,
          sort_order = ?, seo_title = ?, seo_description = ?, published_at = COALESCE(published_at, ?), updated_at = ?
         WHERE id = ?`,
      )
        .bind(
          slug,
          cleanString(body.name ?? existing.name, 140),
          cleanString(body.shortDescription ?? existing.short_description, 200),
          cleanString(body.overview ?? existing.overview, 3000),
          sanitizeMarkdownContent(body.caseStudyMarkdown ?? existing.case_study_markdown),
          cleanString(body.category ?? existing.category, 80),
          VALID_PROJECT_STATUS.has(String(body.projectStatus)) ? String(body.projectStatus) : existing.project_status,
          body.websiteUrl !== undefined ? sanitizeUrl(body.websiteUrl) : existing.website_url,
          body.repoUrl !== undefined ? sanitizeUrl(body.repoUrl) : existing.repo_url,
          cleanString(body.urlPlaceholderNote ?? existing.url_placeholder_note, 240),
          highlights,
          techStack,
          cleanString(body.developmentProgress ?? existing.development_progress, 300),
          body.coverImageUrl !== undefined
            ? sanitizeUrl(body.coverImageUrl, { allowRelative: true })
            : existing.cover_image_url,
          body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured,
          status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          cleanString(body.seoTitle ?? existing.seo_title, 160),
          cleanString(body.seoDescription ?? existing.seo_description, 320),
          status === 'published' ? nowIso : null,
          nowIso,
          projectId,
        )
        .run();
      await recordRevision(env, 'project', projectId, 'update', { id: projectId, slug, status }, admin.id);
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }

    if (!subAction && request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM projects WHERE id = ?`).bind(projectId).run();
      await recordRevision(env, 'project', projectId, 'delete', { id: projectId }, admin.id);
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 8. Blog Posts CRUD + Duplicate (supports English, Bengali, Bilingual, Tags, Schedule)
  if (path === '/api/v1/admin/blog') {
    if (request.method === 'GET') {
      const [rows, tagRows] = await Promise.all([
        env.DB.prepare(`SELECT * FROM blog_posts ORDER BY publish_date DESC, created_at DESC`).all<
          Record<string, unknown>
        >(),
        env.DB.prepare(
          `SELECT bpt.post_id, bt.id, bt.slug, bt.name FROM blog_post_tags bpt INNER JOIN blog_tags bt ON bt.id = bpt.tag_id`,
        ).all<{ post_id: string; id: string; slug: string; name: string }>(),
      ]);
      const tagMap = new Map<string, Array<{ id: string; slug: string; name: string }>>();
      for (const tr of tagRows.results) {
        const list = tagMap.get(tr.post_id) ?? [];
        list.push({ id: tr.id, slug: tr.slug, name: tr.name });
        tagMap.set(tr.post_id, list);
      }

      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((b) => ({
            id: b.id,
            slug: b.slug,
            title: b.title,
            titleBn: b.title_bn,
            excerpt: b.excerpt,
            excerptBn: b.excerpt_bn,
            contentMarkdown: b.content_markdown,
            contentMarkdownBn: b.content_markdown_bn,
            language: b.language,
            categoryId: b.category_id,
            category: b.category_name,
            coverImageUrl: b.cover_image_url,
            readingTimeMinutes: b.reading_time_minutes,
            featured: Boolean(b.featured),
            isSample: Boolean(b.is_sample),
            status: b.status,
            publishDate: b.publish_date,
            seoTitle: b.seo_title,
            seoDescription: b.seo_description,
            authorName: b.author_name,
            tags: tagMap.get(String(b.id)) ?? [],
            updatedAt: b.updated_at,
          })),
        },
        200,
        { isPrivate: true },
      );
    }

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const title = cleanString(body.title, 200);
      const slug = sanitizeSlug(body.slug || title);
      const excerpt = cleanString(body.excerpt, 500);
      const contentMarkdown = sanitizeMarkdownContent(body.contentMarkdown);
      const contentMarkdownBn = sanitizeMarkdownContent(body.contentMarkdownBn);
      const language = ['en', 'bn', 'bilingual'].includes(String(body.language)) ? String(body.language) : 'en';
      const status = VALID_BLOG_STATUS.has(String(body.status)) ? String(body.status) : 'draft';
      const categoryName = cleanString(body.category, 80) || 'Technology';
      const publishDate = cleanString(body.publishDate, 20) || new Date().toISOString().slice(0, 10);

      if (!title || !slug || !excerpt || (!contentMarkdown && !contentMarkdownBn)) {
        return errorResponse(
          request,
          env,
          400,
          'Title, slug, excerpt, and article content are required.',
          'VALIDATION_ERROR',
          { isPrivate: true },
        );
      }

      const id = generateId('post');
      const nowIso = new Date().toISOString();
      const catRow = await env.DB.prepare(`SELECT id FROM blog_categories WHERE name = ? LIMIT 1`)
        .bind(categoryName)
        .first<{ id: string }>();

      const readingMinutes =
        Number(body.readingTimeMinutes) ||
        estimateReadingTimeMinutes(`${contentMarkdown} ${contentMarkdownBn}`);

      try {
        await env.DB.prepare(
          `INSERT INTO blog_posts (
            id, slug, title, title_bn, excerpt, excerpt_bn, content_markdown, content_markdown_bn,
            language, category_id, category_name, cover_image_url, reading_time_minutes,
            featured, is_sample, status, publish_date, published_at, seo_title, seo_description, author_name, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            id,
            slug,
            title,
            cleanString(body.titleBn, 200),
            excerpt,
            cleanString(body.excerptBn, 500),
            contentMarkdown,
            contentMarkdownBn,
            language,
            catRow?.id ?? null,
            categoryName,
            sanitizeUrl(body.coverImageUrl, { allowRelative: true }),
            readingMinutes,
            body.featured ? 1 : 0,
            status,
            publishDate,
            status === 'published' ? nowIso : null,
            cleanString(body.seoTitle, 160) || `${title} | MD ROBIN MIA`,
            cleanString(body.seoDescription, 320) || excerpt,
            cleanString(body.authorName, 100) || admin.displayName || 'MD Robin Mia',
            nowIso,
            nowIso,
          )
          .run();
      } catch {
        return errorResponse(request, env, 409, 'A blog post with this slug already exists.', 'DUPLICATE_SLUG', {
          isPrivate: true,
        });
      }

      const tagNames = sanitizeStringArray(body.tags, 15, 50);
      for (const tagName of tagNames) {
        const tagSlug = sanitizeSlug(tagName);
        if (!tagSlug) continue;
        let tagRow = await env.DB.prepare(`SELECT id FROM blog_tags WHERE slug = ?`).bind(tagSlug).first<{ id: string }>();
        if (!tagRow) {
          const newTagId = generateId('tag');
          await env.DB.prepare(`INSERT OR IGNORE INTO blog_tags (id, slug, name) VALUES (?, ?, ?)`)
            .bind(newTagId, tagSlug, tagName)
            .run();
          tagRow = await env.DB.prepare(`SELECT id FROM blog_tags WHERE slug = ?`).bind(tagSlug).first<{ id: string }>();
        }
        if (tagRow) {
          await env.DB.prepare(`INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)`)
            .bind(id, tagRow.id)
            .run();
        }
      }

      await recordRevision(env, 'blog_post', id, 'create', { id, slug, title, status }, admin.id);
      return jsonResponse(request, env, { ok: true, id, slug }, 201, { isPrivate: true });
    }
  }

  const blogActionMatch = path.match(/^\/api\/v1\/admin\/blog\/([a-zA-Z0-9_-]+)(?:\/(duplicate))?$/);
  if (blogActionMatch) {
    const [, postId, action] = blogActionMatch;
    if (action === 'duplicate' && request.method === 'POST') {
      const src = await env.DB.prepare(`SELECT * FROM blog_posts WHERE id = ?`).bind(postId).first<Record<string, unknown>>();
      if (!src) return errorResponse(request, env, 404, 'Post not found.', 'NOT_FOUND', { isPrivate: true });
      const newId = generateId('post');
      const newSlug = `${src.slug}-copy-${Date.now().toString(36).slice(-4)}`;
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO blog_posts (
          id, slug, title, title_bn, excerpt, excerpt_bn, content_markdown, content_markdown_bn,
          language, category_id, category_name, cover_image_url, reading_time_minutes,
          featured, is_sample, status, publish_date, seo_title, seo_description, author_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'draft', ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          newId,
          newSlug,
          `${src.title} (Copy)`,
          src.title_bn,
          src.excerpt,
          src.excerpt_bn,
          src.content_markdown,
          src.content_markdown_bn,
          src.language,
          src.category_id,
          src.category_name,
          src.cover_image_url,
          src.reading_time_minutes,
          src.publish_date,
          src.seo_title,
          src.seo_description,
          src.author_name,
          nowIso,
          nowIso,
        )
        .run();
      return jsonResponse(request, env, { ok: true, id: newId, slug: newSlug }, 201, { isPrivate: true });
    }

    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM blog_posts WHERE id = ?`).bind(postId).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Post not found.', 'NOT_FOUND', { isPrivate: true });

      const nowIso = new Date().toISOString();
      const status = VALID_BLOG_STATUS.has(String(body.status)) ? String(body.status) : String(existing.status);
      const slug = sanitizeSlug(body.slug ?? existing.slug, String(existing.slug));
      const categoryName = cleanString(body.category ?? existing.category_name, 80);
      const catRow = await env.DB.prepare(`SELECT id FROM blog_categories WHERE name = ? LIMIT 1`)
        .bind(categoryName)
        .first<{ id: string }>();
      const contentMarkdown = sanitizeMarkdownContent(body.contentMarkdown ?? existing.content_markdown);
      const contentMarkdownBn = sanitizeMarkdownContent(body.contentMarkdownBn ?? existing.content_markdown_bn);

      await env.DB.prepare(
        `UPDATE blog_posts SET
          slug = ?, title = ?, title_bn = ?, excerpt = ?, excerpt_bn = ?, content_markdown = ?, content_markdown_bn = ?,
          language = ?, category_id = ?, category_name = ?, cover_image_url = ?, reading_time_minutes = ?,
          featured = ?, is_sample = ?, status = ?, publish_date = ?, published_at = COALESCE(published_at, ?),
          seo_title = ?, seo_description = ?, updated_at = ?
         WHERE id = ?`,
      )
        .bind(
          slug,
          cleanString(body.title ?? existing.title, 200),
          cleanString(body.titleBn ?? existing.title_bn, 200),
          cleanString(body.excerpt ?? existing.excerpt, 500),
          cleanString(body.excerptBn ?? existing.excerpt_bn, 500),
          contentMarkdown,
          contentMarkdownBn,
          ['en', 'bn', 'bilingual'].includes(String(body.language)) ? String(body.language) : existing.language,
          catRow?.id ?? existing.category_id,
          categoryName,
          body.coverImageUrl !== undefined
            ? sanitizeUrl(body.coverImageUrl, { allowRelative: true })
            : existing.cover_image_url,
          Number(body.readingTimeMinutes) || estimateReadingTimeMinutes(`${contentMarkdown} ${contentMarkdownBn}`),
          body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured,
          body.isSample !== undefined ? (body.isSample ? 1 : 0) : existing.is_sample,
          status,
          cleanString(body.publishDate ?? existing.publish_date, 20),
          status === 'published' ? nowIso : null,
          cleanString(body.seoTitle ?? existing.seo_title, 160),
          cleanString(body.seoDescription ?? existing.seo_description, 320),
          nowIso,
          postId,
        )
        .run();

      if (Array.isArray(body.tags)) {
        await env.DB.prepare(`DELETE FROM blog_post_tags WHERE post_id = ?`).bind(postId).run();
        for (const tagName of sanitizeStringArray(body.tags, 15, 50)) {
          const tagSlug = sanitizeSlug(tagName);
          if (!tagSlug) continue;
          let tagRow = await env.DB.prepare(`SELECT id FROM blog_tags WHERE slug = ?`).bind(tagSlug).first<{ id: string }>();
          if (!tagRow) {
            const newTagId = generateId('tag');
            await env.DB.prepare(`INSERT OR IGNORE INTO blog_tags (id, slug, name) VALUES (?, ?, ?)`)
              .bind(newTagId, tagSlug, tagName)
              .run();
            tagRow = await env.DB.prepare(`SELECT id FROM blog_tags WHERE slug = ?`).bind(tagSlug).first<{ id: string }>();
          }
          if (tagRow) {
            await env.DB.prepare(`INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)`)
              .bind(postId, tagRow.id)
              .run();
          }
        }
      }

      await recordRevision(env, 'blog_post', postId, 'update', { id: postId, slug, status }, admin.id);
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }

    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM blog_posts WHERE id = ?`).bind(postId).run();
      await recordRevision(env, 'blog_post', postId, 'delete', { id: postId }, admin.id);
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 9. Categories & Tags CRUD
  if (path === '/api/v1/admin/categories') {
    if (request.method === 'GET') {
      const [cats, tags] = await Promise.all([
        env.DB.prepare(`SELECT * FROM blog_categories ORDER BY sort_order ASC`).all<Record<string, unknown>>(),
        env.DB.prepare(`SELECT * FROM blog_tags ORDER BY name ASC`).all<Record<string, unknown>>(),
      ]);
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          categories: cats.results.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            nameBn: c.name_bn,
            description: c.description,
            sortOrder: c.sort_order,
          })),
          tags: tags.results,
        },
        200,
        { isPrivate: true },
      );
    }
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const name = cleanString(body.name, 80);
      const slug = sanitizeSlug(body.slug || name);
      if (!name || !slug) {
        return errorResponse(request, env, 400, 'Category name is required.', 'VALIDATION_ERROR', { isPrivate: true });
      }
      const id = generateId('cat');
      try {
        await env.DB.prepare(
          `INSERT INTO blog_categories (id, slug, name, name_bn, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        )
          .bind(id, slug, name, cleanString(body.nameBn, 80), cleanString(body.description, 300), Number(body.sortOrder ?? 10))
          .run();
      } catch {
        return errorResponse(request, env, 409, 'Category already exists.', 'DUPLICATE_CATEGORY', { isPrivate: true });
      }
      return jsonResponse(request, env, { ok: true, id, slug }, 201, { isPrivate: true });
    }
  }

  const catIdMatch = path.match(/^\/api\/v1\/admin\/categories\/([a-zA-Z0-9_-]+)$/);
  if (catIdMatch) {
    const id = catIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM blog_categories WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Category not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE blog_categories SET name = ?, name_bn = ?, description = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(
          cleanString(body.name ?? existing.name, 80),
          cleanString(body.nameBn ?? existing.name_bn, 80),
          cleanString(body.description ?? existing.description, 300),
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          nowIso,
          id,
        )
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM blog_categories WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  const tagIdMatch = path.match(/^\/api\/v1\/admin\/tags\/([a-zA-Z0-9_-]+)$/);
  if (tagIdMatch && request.method === 'DELETE') {
    await env.DB.prepare(`DELETE FROM blog_tags WHERE id = ?`).bind(tagIdMatch[1]).run();
    return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
  }

  // 10. Achievements & Certificates CRUD
  if (path === '/api/v1/admin/achievements') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM achievements ORDER BY sort_order ASC, created_at DESC`).all<
        Record<string, unknown>
      >();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((r) => ({
            id: r.id,
            group: r.group_name,
            title: r.title,
            issuerOrContext: r.issuer_or_context,
            dateLabel: r.date_label,
            description: r.description,
            credentialUrl: r.credential_url,
            certificateImageUrl: r.certificate_image_url,
            isPlaceholder: Boolean(r.is_placeholder),
            status: r.status,
            sortOrder: r.sort_order,
          })),
        },
        200,
        { isPrivate: true },
      );
    }
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const groupName = VALID_ACHIEVEMENT_GROUP.has(String(body.group))
        ? String(body.group)
        : 'Personal Milestones';
      const title = cleanString(body.title, 200);
      const issuerOrContext = cleanString(body.issuerOrContext, 160);
      const dateLabel = cleanString(body.dateLabel, 60);
      const description = cleanString(body.description, 2000);
      if (!title || !issuerOrContext || !dateLabel || !description) {
        return errorResponse(request, env, 400, 'Title, issuer, date label, and description are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const id = generateId('ach');
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'published';
      await env.DB.prepare(
        `INSERT INTO achievements (id, group_name, title, issuer_or_context, date_label, description, credential_url, certificate_image_url, is_placeholder, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id,
          groupName,
          title,
          issuerOrContext,
          dateLabel,
          description,
          sanitizeUrl(body.credentialUrl),
          sanitizeUrl(body.certificateImageUrl, { allowRelative: true }),
          body.isPlaceholder ? 1 : 0,
          status,
          Number(body.sortOrder ?? 10),
        )
        .run();
      return jsonResponse(request, env, { ok: true, id }, 201, { isPrivate: true });
    }
  }

  const achIdMatch = path.match(/^\/api\/v1\/admin\/achievements\/([a-zA-Z0-9_-]+)$/);
  if (achIdMatch) {
    const id = achIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM achievements WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Achievement not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE achievements SET group_name = ?, title = ?, issuer_or_context = ?, date_label = ?, description = ?, credential_url = ?, certificate_image_url = ?, is_placeholder = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(
          VALID_ACHIEVEMENT_GROUP.has(String(body.group)) ? String(body.group) : existing.group_name,
          cleanString(body.title ?? existing.title, 200),
          cleanString(body.issuerOrContext ?? existing.issuer_or_context, 160),
          cleanString(body.dateLabel ?? existing.date_label, 60),
          cleanString(body.description ?? existing.description, 2000),
          body.credentialUrl !== undefined ? sanitizeUrl(body.credentialUrl) : existing.credential_url,
          body.certificateImageUrl !== undefined
            ? sanitizeUrl(body.certificateImageUrl, { allowRelative: true })
            : existing.certificate_image_url,
          body.isPlaceholder !== undefined ? (body.isPlaceholder ? 1 : 0) : existing.is_placeholder,
          VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : existing.status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          nowIso,
          id,
        )
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM achievements WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 11. Experiences CRUD
  if (path === '/api/v1/admin/experiences') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM experiences ORDER BY sort_order ASC`).all<Record<string, unknown>>();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((r) => ({
            id: r.id,
            roleTitle: r.role_title,
            organization: r.organization,
            period: r.period,
            location: r.location,
            employmentType: r.employment_type,
            summary: r.summary,
            highlights: parseJsonSafe<string[]>(String(r.highlights_json ?? '[]'), []),
            status: r.status,
            sortOrder: r.sort_order,
          })),
        },
        200,
        { isPrivate: true },
      );
    }
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const roleTitle = cleanString(body.roleTitle, 160);
      const organization = cleanString(body.organization, 160);
      const period = cleanString(body.period, 80);
      if (!roleTitle || !organization || !period) {
        return errorResponse(request, env, 400, 'Role, organization, and period are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const id = generateId('exp');
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'draft';
      await env.DB.prepare(
        `INSERT INTO experiences (id, role_title, organization, period, location, employment_type, summary, highlights_json, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id,
          roleTitle,
          organization,
          period,
          cleanString(body.location, 120),
          cleanString(body.employmentType, 80),
          cleanString(body.summary, 2000),
          JSON.stringify(sanitizeStringArray(body.highlights, 15, 240)),
          status,
          Number(body.sortOrder ?? 10),
        )
        .run();
      return jsonResponse(request, env, { ok: true, id }, 201, { isPrivate: true });
    }
  }

  const expIdMatch = path.match(/^\/api\/v1\/admin\/experiences\/([a-zA-Z0-9_-]+)$/);
  if (expIdMatch) {
    const id = expIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM experiences WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Experience not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE experiences SET role_title = ?, organization = ?, period = ?, location = ?, employment_type = ?, summary = ?, highlights_json = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(
          cleanString(body.roleTitle ?? existing.role_title, 160),
          cleanString(body.organization ?? existing.organization, 160),
          cleanString(body.period ?? existing.period, 80),
          cleanString(body.location ?? existing.location, 120),
          cleanString(body.employmentType ?? existing.employment_type, 80),
          cleanString(body.summary ?? existing.summary, 2000),
          body.highlights !== undefined
            ? JSON.stringify(sanitizeStringArray(body.highlights, 15, 240))
            : String(existing.highlights_json),
          VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : existing.status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          nowIso,
          id,
        )
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM experiences WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 12. Services CRUD
  if (path === '/api/v1/admin/services') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM services ORDER BY sort_order ASC`).all<Record<string, unknown>>();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((r) => ({
            id: r.id,
            slug: r.slug,
            title: r.title,
            shortDescription: r.short_description,
            deliverables: parseJsonSafe<string[]>(String(r.deliverables_json ?? '[]'), []),
            availabilityNote: r.availability_note,
            status: r.status,
            sortOrder: r.sort_order,
          })),
        },
        200,
        { isPrivate: true },
      );
    }
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const title = cleanString(body.title, 160);
      const slug = sanitizeSlug(body.slug || title);
      const shortDescription = cleanString(body.shortDescription, 1000);
      if (!title || !slug || !shortDescription) {
        return errorResponse(request, env, 400, 'Title and description are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const id = generateId('srv');
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'draft';
      await env.DB.prepare(
        `INSERT INTO services (id, slug, title, short_description, deliverables_json, availability_note, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id,
          slug,
          title,
          shortDescription,
          JSON.stringify(sanitizeStringArray(body.deliverables, 15, 200)),
          cleanString(body.availabilityNote, 200),
          status,
          Number(body.sortOrder ?? 10),
        )
        .run();
      return jsonResponse(request, env, { ok: true, id }, 201, { isPrivate: true });
    }
  }

  const srvIdMatch = path.match(/^\/api\/v1\/admin\/services\/([a-zA-Z0-9_-]+)$/);
  if (srvIdMatch) {
    const id = srvIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM services WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Service not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE services SET title = ?, short_description = ?, deliverables_json = ?, availability_note = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(
          cleanString(body.title ?? existing.title, 160),
          cleanString(body.shortDescription ?? existing.short_description, 1000),
          body.deliverables !== undefined
            ? JSON.stringify(sanitizeStringArray(body.deliverables, 15, 200))
            : String(existing.deliverables_json),
          cleanString(body.availabilityNote ?? existing.availability_note, 200),
          VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : existing.status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          nowIso,
          id,
        )
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM services WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 13. Testimonials CRUD (Moderation / Approval)
  if (path === '/api/v1/admin/testimonials') {
    if (request.method === 'GET') {
      const rows = await env.DB.prepare(`SELECT * FROM testimonials ORDER BY sort_order ASC`).all<Record<string, unknown>>();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          items: rows.results.map((r) => ({
            id: r.id,
            authorName: r.author_name,
            authorRole: r.author_role,
            organization: r.organization,
            quote: r.quote,
            projectRef: r.project_ref,
            isApproved: Boolean(r.is_approved),
            status: r.status,
            sortOrder: r.sort_order,
          })),
        },
        200,
        { isPrivate: true },
      );
    }
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const authorName = cleanString(body.authorName, 120);
      const authorRole = cleanString(body.authorRole, 120);
      const quote = cleanString(body.quote, 2000);
      if (!authorName || !authorRole || !quote) {
        return errorResponse(request, env, 400, 'Author name, role, and quote are required.', 'VALIDATION_ERROR', {
          isPrivate: true,
        });
      }
      const id = generateId('tm');
      const status = VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : 'draft';
      await env.DB.prepare(
        `INSERT INTO testimonials (id, author_name, author_role, organization, quote, project_ref, is_approved, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id,
          authorName,
          authorRole,
          cleanString(body.organization, 120),
          quote,
          cleanString(body.projectRef, 120),
          body.isApproved ? 1 : 0,
          status,
          Number(body.sortOrder ?? 10),
        )
        .run();
      return jsonResponse(request, env, { ok: true, id }, 201, { isPrivate: true });
    }
  }

  const tmIdMatch = path.match(/^\/api\/v1\/admin\/testimonials\/([a-zA-Z0-9_-]+)$/);
  if (tmIdMatch) {
    const id = tmIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM testimonials WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Testimonial not found.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE testimonials SET author_name = ?, author_role = ?, organization = ?, quote = ?, project_ref = ?, is_approved = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(
          cleanString(body.authorName ?? existing.author_name, 120),
          cleanString(body.authorRole ?? existing.author_role, 120),
          cleanString(body.organization ?? existing.organization, 120),
          cleanString(body.quote ?? existing.quote, 2000),
          cleanString(body.projectRef ?? existing.project_ref, 120),
          body.isApproved !== undefined ? (body.isApproved ? 1 : 0) : existing.is_approved,
          VALID_PUB_STATUS.has(String(body.status)) ? String(body.status) : existing.status,
          Number(body.sortOrder ?? existing.sort_order ?? 0),
          nowIso,
          id,
        )
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM testimonials WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 14. Contact Messages Inbox
  if (path === '/api/v1/admin/messages' && request.method === 'GET') {
    const filter = url.searchParams.get('status') || 'all';
    const query =
      filter !== 'all' && ['unread', 'read', 'archived'].includes(filter)
        ? env.DB.prepare(`SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC`).bind(filter)
        : env.DB.prepare(`SELECT * FROM contact_messages ORDER BY created_at DESC`);
    const rows = await query.all<Record<string, unknown>>();
    return jsonResponse(
      request,
      env,
      {
        ok: true,
        items: rows.results.map((m) => ({
          id: m.id,
          fullName: m.full_name,
          email: m.email,
          subject: m.subject,
          message: m.message,
          status: m.status,
          createdAt: m.created_at,
          readAt: m.read_at,
        })),
      },
      200,
      { isPrivate: true },
    );
  }

  const msgIdMatch = path.match(/^\/api\/v1\/admin\/messages\/([a-zA-Z0-9_-]+)$/);
  if (msgIdMatch) {
    const id = msgIdMatch[1];
    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const status = String(body.status);
      if (!['unread', 'read', 'archived'].includes(status)) {
        return errorResponse(request, env, 400, 'Invalid message status.', 'VALIDATION_ERROR', { isPrivate: true });
      }
      const readAt = status === 'read' ? new Date().toISOString() : null;
      await env.DB.prepare(`UPDATE contact_messages SET status = ?, read_at = COALESCE(read_at, ?) WHERE id = ?`)
        .bind(status, readAt, id)
        .run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM contact_messages WHERE id = ?`).bind(id).run();
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 15. Website Settings, Navigation Menu & SEO Defaults
  if (path === '/api/v1/admin/settings') {
    if (request.method === 'GET') {
      const s = await env.DB.prepare(`SELECT * FROM site_settings WHERE id = 1`).first<Record<string, unknown>>();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          settings: {
            brandMark: s?.brand_mark ?? 'MRM.',
            fullName: s?.full_name ?? 'MD ROBIN MIA',
            professionalIdentity: s?.professional_identity ?? 'Technology Explorer & Entrepreneur',
            tagline: s?.tagline ?? 'THINK. CREATE. BUILD. INSPIRE.',
            availabilityLabel: s?.availability_label ?? '',
            heroLabel: s?.hero_label ?? '',
            heroSubheading: s?.hero_subheading ?? '',
            heroDescription: s?.hero_description ?? '',
            aboutIntro: s?.about_intro ?? '',
            footerDescription: s?.footer_description ?? '',
            copyrightText: s?.copyright_text ?? '',
            canonicalBaseUrl: s?.canonical_base_url ?? 'https://mdrobinmia.pages.dev',
            contactHeading: s?.contact_heading ?? "Let's Connect",
            contactDescription: s?.contact_description ?? '',
            contactEmail: s?.contact_email ?? '',
            socialLinks: parseJsonSafe(String(s?.social_links_json ?? '[]'), []),
            seoDefaults: parseJsonSafe(String(s?.seo_defaults_json ?? '{}'), {}),
            navigationMenu: parseJsonSafe(String(s?.navigation_menu_json ?? '[]'), []),
            analyticsEnabled: Boolean(s?.analytics_enabled ?? 1),
          },
        },
        200,
        { isPrivate: true },
      );
    }

    if (request.method === 'PATCH') {
      const body = await readJsonBody(request);
      if (!body) return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON', { isPrivate: true });
      const existing = await env.DB.prepare(`SELECT * FROM site_settings WHERE id = 1`).first<Record<string, unknown>>();
      if (!existing) return errorResponse(request, env, 404, 'Settings missing.', 'NOT_FOUND', { isPrivate: true });
      const nowIso = new Date().toISOString();

      let socialLinksJson = String(existing.social_links_json);
      if (Array.isArray(body.socialLinks)) {
        const cleanedLinks = body.socialLinks.map((item: unknown) => {
          const obj = (item || {}) as Record<string, unknown>;
          return {
            id: cleanString(obj.id, 40),
            platform: cleanString(obj.platform, 40),
            label: cleanString(obj.label, 80),
            url: sanitizeUrl(obj.url),
            placeholderNote: cleanString(obj.placeholderNote, 160),
          };
        });
        socialLinksJson = JSON.stringify(cleanedLinks);
      }

      let navJson = String(existing.navigation_menu_json);
      if (Array.isArray(body.navigationMenu)) {
        const cleanedNav = body.navigationMenu
          .map((item: unknown) => {
            const obj = (item || {}) as Record<string, unknown>;
            const label = cleanString(obj.label, 40);
            const to = sanitizeUrl(obj.to, { allowRelative: true });
            if (!label || !to || to.startsWith('/admin')) return null;
            return { label, to, visible: obj.visible !== false };
          })
          .filter(Boolean);
        navJson = JSON.stringify(cleanedNav);
      }

      const seoDefaultsJson =
        body.seoDefaults && typeof body.seoDefaults === 'object'
          ? JSON.stringify(body.seoDefaults)
          : String(existing.seo_defaults_json);

      const emailVal = body.contactEmail !== undefined
        ? (cleanString(body.contactEmail, 254) === '' ? '' : sanitizeEmail(body.contactEmail))
        : String(existing.contact_email);

      const canonicalBaseUrl =
        body.canonicalBaseUrl !== undefined
          ? sanitizeUrl(body.canonicalBaseUrl) || String(existing.canonical_base_url)
          : String(existing.canonical_base_url);

      await env.DB.prepare(
        `UPDATE site_settings SET
          brand_mark = ?, full_name = ?, professional_identity = ?, tagline = ?, availability_label = ?,
          hero_label = ?, hero_subheading = ?, hero_description = ?, about_intro = ?, footer_description = ?,
          copyright_text = ?, canonical_base_url = ?, contact_heading = ?, contact_description = ?,
          contact_email = ?, social_links_json = ?, seo_defaults_json = ?, navigation_menu_json = ?,
          analytics_enabled = ?, updated_at = ?
         WHERE id = 1`,
      )
        .bind(
          cleanString(body.brandMark ?? existing.brand_mark, 20),
          cleanString(body.fullName ?? existing.full_name, 100),
          cleanString(body.professionalIdentity ?? existing.professional_identity, 160),
          cleanString(body.tagline ?? existing.tagline, 160),
          cleanString(body.availabilityLabel ?? existing.availability_label, 120),
          cleanString(body.heroLabel ?? existing.hero_label, 120),
          cleanString(body.heroSubheading ?? existing.hero_subheading, 400),
          cleanString(body.heroDescription ?? existing.hero_description, 1000),
          cleanString(body.aboutIntro ?? existing.about_intro, 1000),
          cleanString(body.footerDescription ?? existing.footer_description, 500),
          cleanString(body.copyrightText ?? existing.copyright_text, 160),
          canonicalBaseUrl,
          cleanString(body.contactHeading ?? existing.contact_heading, 120),
          cleanString(body.contactDescription ?? existing.contact_description, 500),
          emailVal,
          socialLinksJson,
          seoDefaultsJson,
          navJson,
          body.analyticsEnabled !== undefined ? (body.analyticsEnabled ? 1 : 0) : existing.analytics_enabled,
          nowIso,
        )
        .run();

      await recordRevision(env, 'site_settings', '1', 'update', { updatedAt: nowIso }, admin.id);
      return jsonResponse(request, env, { ok: true }, 200, { isPrivate: true });
    }
  }

  // 16. Analytics (Real aggregate data from page_views; returns empty arrays if zero views)
  if (path === '/api/v1/admin/analytics' && request.method === 'GET') {
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get('days') || '30') || 30));
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [dailyRows, topPathsRows, totalRow] = await Promise.all([
      env.DB.prepare(
        `SELECT view_date, SUM(views_count) AS views FROM page_views WHERE view_date >= ? GROUP BY view_date ORDER BY view_date ASC`,
      )
        .bind(sinceDate)
        .all<{ view_date: string; views: number }>(),
      env.DB.prepare(
        `SELECT path, content_type, SUM(views_count) AS views FROM page_views WHERE view_date >= ? GROUP BY path, content_type ORDER BY views DESC LIMIT 15`,
      )
        .bind(sinceDate)
        .all<{ path: string; content_type: string; views: number }>(),
      env.DB.prepare(`SELECT COALESCE(SUM(views_count), 0) AS total FROM page_views WHERE view_date >= ?`)
        .bind(sinceDate)
        .first<{ total: number }>(),
    ]);

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        days,
        totalViews: totalRow?.total ?? 0,
        dailyViews: dailyRows.results.map((r) => ({ date: r.view_date, views: r.views })),
        topPaths: topPathsRows.results.map((r) => ({
          path: r.path,
          contentType: r.content_type,
          views: r.views,
        })),
      },
      200,
      { isPrivate: true },
    );
  }

  // 17. Content Revisions & JSON Backup Export
  if (path === '/api/v1/admin/revisions' && request.method === 'GET') {
    const rows = await env.DB.prepare(
      `SELECT id, entity_type, entity_id, action, created_at FROM content_revisions ORDER BY created_at DESC LIMIT 50`,
    ).all<Record<string, unknown>>();
    return jsonResponse(request, env, { ok: true, items: rows.results }, 200, { isPrivate: true });
  }

  if (path === '/api/v1/admin/export' && request.method === 'GET') {
    const [
      settings,
      pages,
      homepageSections,
      aboutSections,
      education,
      skills,
      projects,
      blogCategories,
      blogPosts,
      achievements,
      experiences,
      services,
      testimonials,
      media,
    ] = await Promise.all([
      env.DB.prepare(`SELECT * FROM site_settings WHERE id = 1`).first(),
      env.DB.prepare(`SELECT * FROM pages ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM homepage_sections ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM about_sections ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM education ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM skills ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM projects ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM blog_categories ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM blog_posts ORDER BY publish_date DESC`).all(),
      env.DB.prepare(`SELECT * FROM achievements ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM experiences ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM services ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT * FROM testimonials ORDER BY sort_order ASC`).all(),
      env.DB.prepare(`SELECT id, r2_key, public_url, file_name, mime_type, size_bytes, alt_text, caption, storage_provider, created_at FROM media`).all(),
    ]);

    return jsonResponse(
      request,
      env,
      {
        exportedAt: new Date().toISOString(),
        schemaVersion: '1.0',
        data: {
          siteSettings: settings,
          pages: pages.results,
          homepageSections: homepageSections.results,
          aboutSections: aboutSections.results,
          education: education.results,
          skills: skills.results,
          projects: projects.results,
          blogCategories: blogCategories.results,
          blogPosts: blogPosts.results,
          achievements: achievements.results,
          experiences: experiences.results,
          services: services.results,
          testimonials: testimonials.results,
          media: media.results,
        },
      },
      200,
      { isPrivate: true },
    );
  }

  return errorResponse(request, env, 404, 'Admin endpoint not found.', 'NOT_FOUND', { isPrivate: true });
}
