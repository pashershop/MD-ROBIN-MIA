-- Migration 0001: Initial CMS & Admin Dashboard Schema for MD ROBIN MIA (MRM.)
-- Target: Cloudflare D1 (SQLite)

PRAGMA foreign_keys = ON;

-- 1. Admin Users (single owner model + strict auth)
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 2. Admin Sessions (only SHA-256 hashes of tokens are stored)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token_hash TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

-- 3. Login & Contact Rate Limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash TEXT PRIMARY KEY,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TEXT NOT NULL,
  last_attempt_at TEXT NOT NULL,
  locked_until TEXT
);

-- 4. Singleton Website, Identity, Navigation, Contact & SEO Settings
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  brand_mark TEXT NOT NULL,
  full_name TEXT NOT NULL,
  professional_identity TEXT NOT NULL,
  tagline TEXT NOT NULL,
  availability_label TEXT NOT NULL,
  hero_label TEXT NOT NULL,
  hero_subheading TEXT NOT NULL,
  hero_description TEXT NOT NULL,
  about_intro TEXT NOT NULL,
  footer_description TEXT NOT NULL,
  copyright_text TEXT NOT NULL,
  canonical_base_url TEXT NOT NULL,
  contact_heading TEXT NOT NULL,
  contact_description TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  social_links_json TEXT NOT NULL DEFAULT '[]',
  seo_defaults_json TEXT NOT NULL DEFAULT '{}',
  navigation_menu_json TEXT NOT NULL DEFAULT '[]',
  analytics_enabled INTEGER NOT NULL DEFAULT 1 CHECK (analytics_enabled IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 5. Media Library (R2 objects or verified external URLs)
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  r2_key TEXT UNIQUE,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  alt_text TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  storage_provider TEXT NOT NULL DEFAULT 'r2' CHECK (storage_provider IN ('r2', 'external_url')),
  uploaded_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- 6. Managed Pages (System routes + Custom CMS pages)
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  hero_label TEXT NOT NULL DEFAULT '',
  content_markdown TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  canonical_path TEXT NOT NULL DEFAULT '',
  no_index INTEGER NOT NULL DEFAULT 0 CHECK (no_index IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_pages_status_sort ON pages(status, sort_order);

-- 7. Homepage Sections
CREATE TABLE IF NOT EXISTS homepage_sections (
  id TEXT PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_number TEXT NOT NULL DEFAULT '01',
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  content_markdown TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_url TEXT NOT NULL DEFAULT '',
  is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON homepage_sections(sort_order);

-- 8. About Sections
CREATE TABLE IF NOT EXISTS about_sections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_placeholder INTEGER NOT NULL DEFAULT 0 CHECK (is_placeholder IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_about_sections_status_order ON about_sections(status, sort_order);

-- 9. Education Timeline
CREATE TABLE IF NOT EXISTS education (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  title TEXT NOT NULL,
  institution TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  is_placeholder INTEGER NOT NULL DEFAULT 0 CHECK (is_placeholder IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_education_status_order ON education(status, sort_order);

-- 10. Skills & Capabilities
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Current Skills', 'Currently Learning', 'Areas of Interest')),
  area TEXT NOT NULL,
  note TEXT NOT NULL,
  icon_key TEXT NOT NULL DEFAULT 'compass',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_skills_status_order ON skills(status, sort_order);

-- 11. Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  overview TEXT NOT NULL,
  case_study_markdown TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  project_status TEXT NOT NULL CHECK (project_status IN ('Live', 'In Development', 'Concept', 'Planned')),
  website_url TEXT,
  repo_url TEXT,
  url_placeholder_note TEXT NOT NULL DEFAULT 'Website link will be published once this project launches.',
  highlights_json TEXT NOT NULL DEFAULT '[]',
  tech_stack_json TEXT NOT NULL DEFAULT '[]',
  development_progress TEXT NOT NULL DEFAULT '',
  cover_media_id TEXT,
  cover_image_url TEXT,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_status_order ON projects(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- 12. Project Gallery Images
CREATE TABLE IF NOT EXISTS project_images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  media_id TEXT,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id, sort_order);

-- 13. Blog Categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  name_bn TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 14. Blog Tags
CREATE TABLE IF NOT EXISTS blog_tags (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 15. Blog Posts (Supports English, Bengali, or Bilingual + Markdown)
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_bn TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL,
  excerpt_bn TEXT NOT NULL DEFAULT '',
  content_markdown TEXT NOT NULL,
  content_markdown_bn TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'bn', 'bilingual')),
  category_id TEXT,
  category_name TEXT NOT NULL DEFAULT 'Technology',
  cover_media_id TEXT,
  cover_image_url TEXT,
  reading_time_minutes INTEGER NOT NULL DEFAULT 3,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  is_sample INTEGER NOT NULL DEFAULT 0 CHECK (is_sample IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  publish_date TEXT NOT NULL,
  published_at TEXT,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT 'MD Robin Mia',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (cover_media_id) REFERENCES media(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_date ON blog_posts(status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_name);

-- 16. Blog Post Tags Join Table
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
);

-- 17. Achievements & Certificates
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL CHECK (group_name IN ('Certificates Showcase', 'Educational Background', 'Personal Milestones', 'Awards & Recognition')),
  title TEXT NOT NULL,
  issuer_or_context TEXT NOT NULL,
  date_label TEXT NOT NULL,
  description TEXT NOT NULL,
  credential_url TEXT,
  certificate_media_id TEXT,
  certificate_image_url TEXT,
  is_placeholder INTEGER NOT NULL DEFAULT 0 CHECK (is_placeholder IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (certificate_media_id) REFERENCES media(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_achievements_status_order ON achievements(status, sort_order);

-- 18. Experiences (Optional Section — hidden on public site if empty)
CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  role_title TEXT NOT NULL,
  organization TEXT NOT NULL,
  period TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  employment_type TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  highlights_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_experiences_status_order ON experiences(status, sort_order);

-- 19. Services / Collaboration Offerings (Optional Section — hidden on public site if empty)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  deliverables_json TEXT NOT NULL DEFAULT '[]',
  availability_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_services_status_order ON services(status, sort_order);

-- 20. Testimonials (Strict moderation: only approved + published appear publicly)
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL,
  project_ref TEXT NOT NULL DEFAULT '',
  is_approved INTEGER NOT NULL DEFAULT 0 CHECK (is_approved IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_testimonials_public ON testimonials(status, is_approved, sort_order);

-- 21. Contact Messages Inbox
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  ip_hash TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_date ON contact_messages(status, created_at DESC);

-- 22. Lightweight Privacy-Friendly Aggregate Page Views (no PII)
CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'page',
  content_slug TEXT NOT NULL DEFAULT '',
  view_date TEXT NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(path, view_date)
);
CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(view_date DESC);

-- 23. Content Revisions History (Audit trail for CMS edits)
CREATE TABLE IF NOT EXISTS content_revisions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_content_revisions_entity ON content_revisions(entity_type, entity_id, created_at DESC);
