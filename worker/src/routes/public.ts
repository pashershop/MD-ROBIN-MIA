import { checkRateLimit, getClientIp, isOriginAllowedForMutation, recordRateLimitHit } from '../auth';
import { errorResponse, jsonResponse } from '../cors';
import { generateId, sha256Hex } from '../crypto';
import { cleanString, parseJsonSafe, sanitizeEmail } from '../sanitize';
import type { WorkerEnv } from '../types';

function splitMarkdownParagraphs(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function handlePublicRoutes(
  request: Request,
  env: WorkerEnv,
  path: string,
  url: URL,
): Promise<Response | null> {
  if (path === '/api/v1/health' && request.method === 'GET') {
    return jsonResponse(request, env, {
      ok: true,
      service: 'mrm-cms-api',
      capabilities: {
        r2Media: Boolean(env.MEDIA_BUCKET),
      },
    });
  }

  // GET /api/v1/public/bootstrap — all published site data
  if (path === '/api/v1/public/bootstrap' && request.method === 'GET') {
    const today = new Date().toISOString().slice(0, 10);

    const [
      settings,
      homepageSections,
      aboutSections,
      educationRows,
      skillRows,
      projectRows,
      projectImageRows,
      achievementRows,
      categoryRows,
      postRows,
      postTagRows,
      experienceRows,
      serviceRows,
      testimonialRows,
      pageRows,
    ] = await Promise.all([
      env.DB.prepare(`SELECT * FROM site_settings WHERE id = 1`).first<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, section_key, section_number, title, subtitle, content_markdown, cta_label, cta_url, is_visible, sort_order
         FROM homepage_sections WHERE status = 'published' AND is_visible = 1 ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, slug, title, content, is_placeholder, sort_order
         FROM about_sections WHERE status = 'published' ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, period, title, institution, location, summary, is_placeholder, sort_order
         FROM education WHERE status = 'published' ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, slug, name, stage, area, note, icon_key, sort_order
         FROM skills WHERE status = 'published' ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, slug, name, short_description, overview, case_study_markdown, category, project_status,
                website_url, repo_url, url_placeholder_note, highlights_json, tech_stack_json,
                development_progress, cover_image_url, featured, seo_title, seo_description, sort_order
         FROM projects WHERE status = 'published' ORDER BY sort_order ASC, created_at DESC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, project_id, image_url, alt_text, caption, sort_order
         FROM project_images ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, group_name, title, issuer_or_context, date_label, description, credential_url, certificate_image_url, is_placeholder
         FROM achievements WHERE status = 'published' ORDER BY sort_order ASC, created_at DESC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, slug, name, name_bn, description, sort_order FROM blog_categories ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, slug, title, title_bn, excerpt, excerpt_bn, content_markdown, content_markdown_bn,
                language, category_id, category_name, cover_image_url, reading_time_minutes,
                featured, is_sample, publish_date, seo_title, seo_description, author_name
         FROM blog_posts
         WHERE status = 'published' OR (status = 'scheduled' AND publish_date <= ?)
         ORDER BY featured DESC, publish_date DESC`,
      )
        .bind(today)
        .all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT bpt.post_id, bt.slug, bt.name
         FROM blog_post_tags bpt INNER JOIN blog_tags bt ON bt.id = bpt.tag_id`,
      ).all<{ post_id: string; slug: string; name: string }>(),
      env.DB.prepare(
        `SELECT id, role_title, organization, period, location, employment_type, summary, highlights_json
         FROM experiences WHERE status = 'published' ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, slug, title, short_description, deliverables_json, availability_note
         FROM services WHERE status = 'published' ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, author_name, author_role, organization, quote, project_ref
         FROM testimonials WHERE status = 'published' AND is_approved = 1 ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT id, slug, title, subtitle, hero_label, content_markdown, seo_title, seo_description, canonical_path, no_index, is_system
         FROM pages WHERE status = 'published' ORDER BY sort_order ASC`,
      ).all<Record<string, unknown>>(),
    ]);

    const galleryByProject = new Map<string, Array<Record<string, unknown>>>();
    for (const img of projectImageRows.results) {
      const pid = String(img.project_id);
      const list = galleryByProject.get(pid) ?? [];
      list.push({
        id: img.id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        caption: img.caption,
      });
      galleryByProject.set(pid, list);
    }

    const tagsByPost = new Map<string, Array<{ slug: string; name: string }>>();
    for (const row of postTagRows.results) {
      const list = tagsByPost.get(row.post_id) ?? [];
      list.push({ slug: row.slug, name: row.name });
      tagsByPost.set(row.post_id, list);
    }

    const socialLinks = parseJsonSafe<Array<Record<string, unknown>>>(
      String(settings?.social_links_json ?? '[]'),
      [],
    );
    const seoDefaults = parseJsonSafe<Record<string, unknown>>(
      String(settings?.seo_defaults_json ?? '{}'),
      {},
    );
    const navigationMenu = parseJsonSafe<Array<Record<string, unknown>>>(
      String(settings?.navigation_menu_json ?? '[]'),
      [],
    );

    const contactEmail = String(settings?.contact_email ?? '');

    return jsonResponse(request, env, {
      ok: true,
      data: {
        identity: {
          brandMark: String(settings?.brand_mark ?? 'MRM.'),
          fullName: String(settings?.full_name ?? 'MD ROBIN MIA'),
          professionalIdentity: String(
            settings?.professional_identity ?? 'Technology Explorer & Entrepreneur',
          ),
          tagline: String(settings?.tagline ?? 'THINK. CREATE. BUILD. INSPIRE.'),
          availabilityLabel: String(settings?.availability_label ?? 'Personal Brand & Technology'),
          heroLabel: String(settings?.hero_label ?? 'PERSONAL BRAND & TECHNOLOGY'),
          heroSubheading: String(settings?.hero_subheading ?? ''),
          heroDescription: String(settings?.hero_description ?? ''),
          footerDescription: String(settings?.footer_description ?? ''),
          copyrightText: String(settings?.copyright_text ?? '© 2026 MD ROBIN MIA. All Rights Reserved.'),
          canonicalBaseUrl: String(settings?.canonical_base_url ?? 'https://mdrobinmia.pages.dev'),
        },
        aboutIntro: String(settings?.about_intro ?? ''),
        seoDefaults,
        navigationMenu: navigationMenu.filter((item) => item.visible !== false),
        homepageSections: homepageSections.results.map((s) => ({
          id: s.id,
          sectionKey: s.section_key,
          sectionNumber: s.section_number,
          title: s.title,
          subtitle: s.subtitle,
          contentMarkdown: s.content_markdown,
          ctaLabel: s.cta_label,
          ctaUrl: s.cta_url,
          sortOrder: s.sort_order,
        })),
        aboutSections: aboutSections.results.map((s) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          isPlaceholder: Boolean(s.is_placeholder),
        })),
        educationEntries: educationRows.results.map((e) => ({
          id: e.id,
          period: e.period,
          title: e.title,
          institutionOrContext: e.institution,
          location: e.location,
          summary: e.summary,
          isPlaceholder: Boolean(e.is_placeholder),
        })),
        skills: skillRows.results.map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          stage: s.stage,
          area: s.area,
          note: s.note,
          iconKey: s.icon_key,
        })),
        projects: projectRows.results.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          shortDescription: p.short_description,
          overview: p.overview,
          caseStudyMarkdown: p.case_study_markdown,
          category: p.category,
          status: p.project_status,
          websiteUrl: p.website_url || null,
          repoUrl: p.repo_url || null,
          urlPlaceholderNote: p.url_placeholder_note,
          highlights: parseJsonSafe<string[]>(String(p.highlights_json ?? '[]'), []),
          techStack: parseJsonSafe<string[]>(String(p.tech_stack_json ?? '[]'), []),
          developmentProgress: p.development_progress,
          coverImageUrl: p.cover_image_url || null,
          gallery: galleryByProject.get(String(p.id)) ?? [],
          featured: Boolean(p.featured),
          seoTitle: p.seo_title || '',
          seoDescription: p.seo_description || '',
        })),
        achievements: achievementRows.results.map((a) => ({
          id: a.id,
          group: a.group_name,
          title: a.title,
          issuerOrContext: a.issuer_or_context,
          dateLabel: a.date_label,
          description: a.description,
          credentialUrl: a.credential_url || null,
          certificateImageUrl: a.certificate_image_url || null,
          isPlaceholder: Boolean(a.is_placeholder),
        })),
        blogCategories: categoryRows.results.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          nameBn: c.name_bn,
          description: c.description,
        })),
        blogPosts: postRows.results.map((b) => ({
          id: b.id,
          slug: b.slug,
          title: b.title,
          titleBn: b.title_bn || '',
          excerpt: b.excerpt,
          excerptBn: b.excerpt_bn || '',
          content: splitMarkdownParagraphs(String(b.content_markdown ?? '')),
          contentMarkdown: String(b.content_markdown ?? ''),
          contentMarkdownBn: String(b.content_markdown_bn ?? ''),
          language: b.language,
          category: b.category_name,
          coverImageUrl: b.cover_image_url || null,
          publishDate: b.publish_date,
          readingTimeMinutes: Number(b.reading_time_minutes ?? 3),
          featured: Boolean(b.featured),
          isSample: Boolean(b.is_sample),
          tags: tagsByPost.get(String(b.id)) ?? [],
          seoTitle: b.seo_title || '',
          seoDescription: b.seo_description || '',
          authorName: b.author_name || 'MD Robin Mia',
        })),
        experiences: experienceRows.results.map((ex) => ({
          id: ex.id,
          roleTitle: ex.role_title,
          organization: ex.organization,
          period: ex.period,
          location: ex.location,
          employmentType: ex.employment_type,
          summary: ex.summary,
          highlights: parseJsonSafe<string[]>(String(ex.highlights_json ?? '[]'), []),
        })),
        services: serviceRows.results.map((sv) => ({
          id: sv.id,
          slug: sv.slug,
          title: sv.title,
          shortDescription: sv.short_description,
          deliverables: parseJsonSafe<string[]>(String(sv.deliverables_json ?? '[]'), []),
          availabilityNote: sv.availability_note,
        })),
        testimonials: testimonialRows.results.map((tm) => ({
          id: tm.id,
          authorName: tm.author_name,
          authorRole: tm.author_role,
          organization: tm.organization,
          quote: tm.quote,
          projectRef: tm.project_ref,
        })),
        pages: pageRows.results.map((pg) => ({
          id: pg.id,
          slug: pg.slug,
          title: pg.title,
          subtitle: pg.subtitle,
          heroLabel: pg.hero_label,
          contentMarkdown: pg.content_markdown,
          seoTitle: pg.seo_title,
          seoDescription: pg.seo_description,
          canonicalPath: pg.canonical_path,
          noIndex: Boolean(pg.no_index),
          isSystem: Boolean(pg.is_system),
        })),
        contact: {
          heading: String(settings?.contact_heading ?? "Let's Connect"),
          description: String(
            settings?.contact_description ??
              'Have an idea, a question or want to collaborate? Feel free to get in touch.',
          ),
          email: contactEmail,
          emailIsPlaceholder: contactEmail.trim() === '',
          socialLinks,
        },
      },
    });
  }

  // GET /api/v1/public/projects/:slug
  const projectSlugMatch = path.match(/^\/api\/v1\/public\/projects\/([a-z0-9-]+)$/);
  if (projectSlugMatch && request.method === 'GET') {
    const slug = projectSlugMatch[1];
    const p = await env.DB.prepare(
      `SELECT * FROM projects WHERE slug = ? AND status = 'published' LIMIT 1`,
    )
      .bind(slug)
      .first<Record<string, unknown>>();
    if (!p) {
      return errorResponse(request, env, 404, 'Project not found.', 'NOT_FOUND');
    }
    const imgs = await env.DB.prepare(
      `SELECT id, image_url, alt_text, caption FROM project_images WHERE project_id = ? ORDER BY sort_order ASC`,
    )
      .bind(p.id)
      .all<Record<string, unknown>>();

    return jsonResponse(request, env, {
      ok: true,
      project: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        shortDescription: p.short_description,
        overview: p.overview,
        caseStudyMarkdown: p.case_study_markdown,
        category: p.category,
        status: p.project_status,
        websiteUrl: p.website_url || null,
        repoUrl: p.repo_url || null,
        urlPlaceholderNote: p.url_placeholder_note,
        highlights: parseJsonSafe<string[]>(String(p.highlights_json ?? '[]'), []),
        techStack: parseJsonSafe<string[]>(String(p.tech_stack_json ?? '[]'), []),
        developmentProgress: p.development_progress,
        coverImageUrl: p.cover_image_url || null,
        gallery: imgs.results.map((i) => ({
          id: i.id,
          imageUrl: i.image_url,
          altText: i.alt_text,
          caption: i.caption,
        })),
        featured: Boolean(p.featured),
        seoTitle: p.seo_title || '',
        seoDescription: p.seo_description || '',
      },
    });
  }

  // GET /api/v1/public/blog (search, category, tag, pagination)
  if (path === '/api/v1/public/blog' && request.method === 'GET') {
    const today = new Date().toISOString().slice(0, 10);
    const category = url.searchParams.get('category')?.trim() || '';
    const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
    const lang = url.searchParams.get('lang')?.trim() || '';
    const page = Math.max(1, Number(url.searchParams.get('page') || '1') || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || '20') || 20));
    const offset = (page - 1) * limit;

    const conditions = [`(status = 'published' OR (status = 'scheduled' AND publish_date <= ?))`];
    const params: unknown[] = [today];
    if (category && category !== 'All') {
      conditions.push(`(category_name = ? OR category_id IN (SELECT id FROM blog_categories WHERE slug = ?))`);
      params.push(category, category);
    }
    if (lang && ['en', 'bn', 'bilingual'].includes(lang)) {
      conditions.push(`language = ?`);
      params.push(lang);
    }
    if (q) {
      const like = `%${q}%`;
      conditions.push(
        `(LOWER(title) LIKE ? OR LOWER(excerpt) LIKE ? OR LOWER(title_bn) LIKE ? OR LOWER(category_name) LIKE ?)`,
      );
      params.push(like, like, like, like);
    }

    const whereClause = conditions.join(' AND ');
    const countRow = await env.DB.prepare(`SELECT COUNT(*) AS cnt FROM blog_posts WHERE ${whereClause}`)
      .bind(...params)
      .first<{ cnt: number }>();

    const rows = await env.DB.prepare(
      `SELECT id, slug, title, title_bn, excerpt, excerpt_bn, content_markdown, content_markdown_bn,
              language, category_name, cover_image_url, reading_time_minutes, featured, is_sample,
              publish_date, seo_title, seo_description, author_name
       FROM blog_posts
       WHERE ${whereClause}
       ORDER BY featured DESC, publish_date DESC
       LIMIT ? OFFSET ?`,
    )
      .bind(...params, limit, offset)
      .all<Record<string, unknown>>();

    return jsonResponse(request, env, {
      ok: true,
      total: countRow?.cnt ?? 0,
      page,
      limit,
      posts: rows.results.map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        titleBn: b.title_bn || '',
        excerpt: b.excerpt,
        excerptBn: b.excerpt_bn || '',
        content: splitMarkdownParagraphs(String(b.content_markdown ?? '')),
        contentMarkdown: String(b.content_markdown ?? ''),
        contentMarkdownBn: String(b.content_markdown_bn ?? ''),
        language: b.language,
        category: b.category_name,
        coverImageUrl: b.cover_image_url || null,
        publishDate: b.publish_date,
        readingTimeMinutes: Number(b.reading_time_minutes ?? 3),
        featured: Boolean(b.featured),
        isSample: Boolean(b.is_sample),
        seoTitle: b.seo_title || '',
        seoDescription: b.seo_description || '',
        authorName: b.author_name || 'MD Robin Mia',
      })),
    });
  }

  // GET /api/v1/public/pages/:slug
  const pageSlugMatch = path.match(/^\/api\/v1\/public\/pages\/([a-z0-9-]+)$/);
  if (pageSlugMatch && request.method === 'GET') {
    const slug = pageSlugMatch[1];
    const pg = await env.DB.prepare(
      `SELECT * FROM pages WHERE slug = ? AND status = 'published' LIMIT 1`,
    )
      .bind(slug)
      .first<Record<string, unknown>>();
    if (!pg) {
      return errorResponse(request, env, 404, 'Page not found.', 'NOT_FOUND');
    }
    return jsonResponse(request, env, {
      ok: true,
      page: {
        id: pg.id,
        slug: pg.slug,
        title: pg.title,
        subtitle: pg.subtitle,
        heroLabel: pg.hero_label,
        contentMarkdown: pg.content_markdown,
        seoTitle: pg.seo_title,
        seoDescription: pg.seo_description,
        canonicalPath: pg.canonical_path,
        noIndex: Boolean(pg.no_index),
        isSystem: Boolean(pg.is_system),
      },
    });
  }

  // POST /api/v1/contact (honeypot + rate limit + parameterized D1 insert)
  if (path === '/api/v1/contact' && request.method === 'POST') {
    if (!isOriginAllowedForMutation(request, env)) {
      return errorResponse(request, env, 403, 'Origin not permitted.', 'FORBIDDEN_ORIGIN');
    }

    const ip = getClientIp(request);
    const rateKey = `contact:${ip}`;
    const rate = await checkRateLimit(env, rateKey, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return errorResponse(
        request,
        env,
        429,
        'Rate limit exceeded for contact submissions. Please try again later.',
        'RATE_LIMITED',
        { extraHeaders: { 'Retry-After': String(rate.retryAfterSeconds) } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON');
    }

    // Honeypot must remain blank
    if (cleanString(body.honeypot, 100) !== '') {
      return errorResponse(request, env, 400, 'Submission blocked by spam protection.', 'SPAM_DETECTED');
    }

    const fullName = cleanString(body.fullName, 120);
    const email = sanitizeEmail(body.email);
    const subject = cleanString(body.subject, 200);
    const message = cleanString(body.message, 5000);

    if (fullName.length < 2) {
      return errorResponse(request, env, 400, 'Full name must be at least 2 characters.', 'VALIDATION_ERROR');
    }
    if (!email) {
      return errorResponse(request, env, 400, 'Please enter a valid email address.', 'VALIDATION_ERROR');
    }
    if (subject.length < 3) {
      return errorResponse(request, env, 400, 'Subject must be at least 3 characters.', 'VALIDATION_ERROR');
    }
    if (message.length < 10) {
      return errorResponse(request, env, 400, 'Message must be at least 10 characters.', 'VALIDATION_ERROR');
    }

    await recordRateLimitHit(env, rateKey, 5, 60 * 60 * 1000);

    const id = generateId('msg');
    const ipHash = await sha256Hex(ip);
    const ua = (request.headers.get('User-Agent') || '').slice(0, 200);

    await env.DB.prepare(
      `INSERT INTO contact_messages (id, full_name, email, subject, message, status, ip_hash, user_agent)
       VALUES (?, ?, ?, ?, ?, 'unread', ?, ?)`,
    )
      .bind(id, fullName, email, subject, message, ipHash, ua)
      .run();

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        id,
        message:
          'Your message has been delivered to the site inbox for review. (Note: no automated email notification is sent from the server.)',
      },
      201,
    );
  }

  // POST /api/v1/analytics/pageview (privacy-friendly aggregate daily count; skips /admin)
  if (path === '/api/v1/analytics/pageview' && request.method === 'POST') {
    const settings = await env.DB.prepare(`SELECT analytics_enabled FROM site_settings WHERE id = 1`).first<{
      analytics_enabled: number;
    }>();
    if (settings && settings.analytics_enabled === 0) {
      return jsonResponse(request, env, { ok: true, recorded: false });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(request, env, 400, 'Invalid JSON body.', 'INVALID_JSON');
    }

    const viewPath = cleanString(body.path, 200);
    if (!viewPath.startsWith('/') || viewPath.startsWith('/admin') || viewPath.startsWith('/content-schema')) {
      return jsonResponse(request, env, { ok: true, recorded: false });
    }

    const contentType = cleanString(body.contentType, 40) || 'page';
    const contentSlug = cleanString(body.contentSlug, 120);
    const viewDate = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO page_views (id, path, content_type, content_slug, view_date, views_count, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)
       ON CONFLICT(path, view_date) DO UPDATE SET
         views_count = views_count + 1,
         updated_at = excluded.updated_at`,
    )
      .bind(generateId('pv'), viewPath, contentType, contentSlug, viewDate, nowIso)
      .run();

    return jsonResponse(request, env, { ok: true, recorded: true });
  }

  return null;
}
