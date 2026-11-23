import type { WorkerEnv } from '../types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function handleSeoRoutes(
  _request: Request,
  env: WorkerEnv,
  path: string,
): Promise<Response | null> {
  if (path === '/api/v1/sitemap.xml' && _request.method === 'GET') {
    const settings = await env.DB.prepare(`SELECT canonical_base_url FROM site_settings WHERE id = 1`).first<{
      canonical_base_url: string;
    }>();
    const baseUrl = (settings?.canonical_base_url || env.CANONICAL_SITE_URL || 'https://mdrobinmia.pages.dev').replace(
      /\/+$/,
      '',
    );
    const today = new Date().toISOString().slice(0, 10);

    const [pages, projects, posts, categories] = await Promise.all([
      env.DB.prepare(
        `SELECT slug, canonical_path, updated_at, is_system FROM pages WHERE status = 'published' AND no_index = 0`,
      ).all<{ slug: string; canonical_path: string; updated_at: string; is_system: number }>(),
      env.DB.prepare(
        `SELECT slug, updated_at FROM projects WHERE status = 'published' ORDER BY sort_order ASC`,
      ).all<{ slug: string; updated_at: string }>(),
      env.DB.prepare(
        `SELECT slug, publish_date, updated_at FROM blog_posts
         WHERE status = 'published' OR (status = 'scheduled' AND publish_date <= ?)
         ORDER BY publish_date DESC`,
      )
        .bind(today)
        .all<{ slug: string; publish_date: string; updated_at: string }>(),
      env.DB.prepare(`SELECT slug, updated_at FROM blog_categories ORDER BY sort_order ASC`).all<{
        slug: string;
        updated_at: string;
      }>(),
    ]);

    const urls: Array<{ loc: string; lastmod: string; priority: string }> = [];
    const seen = new Set<string>();

    const addUrl = (relPath: string, lastmodRaw: string, priority: string) => {
      const normalized = relPath === '/' ? '/' : `/${relPath.replace(/^\/+/, '')}`;
      if (normalized.startsWith('/admin') || normalized.startsWith('/content-schema')) return;
      const loc = `${baseUrl}${normalized}`;
      if (seen.has(loc)) return;
      seen.add(loc);
      const lastmod = (lastmodRaw || today).slice(0, 10);
      urls.push({ loc, lastmod, priority });
    };

    for (const pg of pages.results) {
      const rel = pg.is_system ? pg.canonical_path || `/${pg.slug}` : `/p/${pg.slug}`;
      addUrl(rel, pg.updated_at, rel === '/' ? '1.0' : '0.8');
    }

    for (const proj of projects.results) {
      addUrl(`/projects/${proj.slug}`, proj.updated_at, '0.8');
    }

    for (const cat of categories.results) {
      addUrl(`/blog/category/${cat.slug}`, cat.updated_at, '0.6');
    }

    for (const post of posts.results) {
      addUrl(`/blog/${post.slug}`, post.updated_at || post.publish_date, '0.7');
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  if (path === '/api/v1/robots.txt' && _request.method === 'GET') {
    const settings = await env.DB.prepare(`SELECT canonical_base_url FROM site_settings WHERE id = 1`).first<{
      canonical_base_url: string;
    }>();
    const baseUrl = (settings?.canonical_base_url || env.CANONICAL_SITE_URL || 'https://mdrobinmia.pages.dev').replace(
      /\/+$/,
      '',
    );
    const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /content-schema

Sitemap: ${baseUrl}/api/v1/sitemap.xml
`;
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  return null;
}
