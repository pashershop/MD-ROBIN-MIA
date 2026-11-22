import { DEFAULT_SITE_CONTENT } from '../data/siteContent';
import type { SiteContentData } from '../types/content';

const STORAGE_KEY = 'mrm-local-content-draft-v1';

/**
 * ContentProvider abstracts content reading and draft preview persistence.
 * In v1, data is served statically from DEFAULT_SITE_CONTENT with optional
 * localStorage draft overrides for testing edits.
 *
 * Future Cloudflare Workers + D1 Migration:
 * Replace loadSiteContent() with fetch(`${import.meta.env.VITE_API_BASE_URL}/api/content`)
 * backed by Cloudflare D1 tables (site_identity, about_sections, skills, projects, achievements, blog_posts, social_links)
 * and protect write mutations behind Cloudflare Access / server-verified sessions.
 */
export function loadSiteContent(): SiteContentData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SITE_CONTENT;
    }
    const parsed = JSON.parse(raw) as Partial<SiteContentData>;
    return {
      ...DEFAULT_SITE_CONTENT,
      ...parsed,
      identity: {
        ...DEFAULT_SITE_CONTENT.identity,
        ...(parsed.identity ?? {}),
      },
      educationEntries: parsed.educationEntries ?? DEFAULT_SITE_CONTENT.educationEntries,
      contact: {
        ...DEFAULT_SITE_CONTENT.contact,
        ...(parsed.contact ?? {}),
      },
    };
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function saveLocalDraftContent(data: SiteContentData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetLocalDraftContent(): SiteContentData {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_SITE_CONTENT;
}

export function hasLocalDraftOverrides(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

export const CLOUDFLARE_D1_SCHEMA_SQL = `-- Future Cloudflare D1 Relational Schema for MD ROBIN MIA (MRM.)
-- Ready for deployment via Wrangler + Cloudflare Workers API

CREATE TABLE IF NOT EXISTS site_identity (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  brand_mark TEXT NOT NULL,
  full_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  hero_label TEXT NOT NULL,
  hero_subheading TEXT NOT NULL,
  hero_description TEXT NOT NULL,
  footer_description TEXT NOT NULL,
  copyright_text TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS about_sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_placeholder INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  note TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS education_entries (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  title TEXT NOT NULL,
  institution_or_context TEXT NOT NULL,
  summary TEXT NOT NULL,
  is_placeholder INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  overview TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Live', 'In Development', 'Concept', 'Planned')),
  website_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  title TEXT NOT NULL,
  issuer_or_context TEXT NOT NULL,
  date_label TEXT NOT NULL,
  description TEXT NOT NULL,
  is_placeholder INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content_json TEXT NOT NULL,
  category TEXT NOT NULL,
  publish_date TEXT NOT NULL,
  reading_time_minutes INTEGER NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  is_sample INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
`;
