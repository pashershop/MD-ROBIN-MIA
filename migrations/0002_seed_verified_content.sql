-- Migration 0002: Idempotent Seed of Verified Content for MD ROBIN MIA (MRM.)
-- Safe to run multiple times; uses INSERT OR IGNORE so user CMS edits are preserved.

INSERT OR IGNORE INTO site_settings (
  id,
  brand_mark,
  full_name,
  professional_identity,
  tagline,
  availability_label,
  hero_label,
  hero_subheading,
  hero_description,
  about_intro,
  footer_description,
  copyright_text,
  canonical_base_url,
  contact_heading,
  contact_description,
  contact_email,
  social_links_json,
  seo_defaults_json,
  navigation_menu_json,
  analytics_enabled
) VALUES (
  1,
  'MRM.',
  'MD ROBIN MIA',
  'Technology Explorer & Entrepreneur',
  'THINK. CREATE. BUILD. INSPIRE.',
  'Personal Brand & Technology',
  'PERSONAL BRAND & TECHNOLOGY',
  'Exploring technology, developing digital products, learning new skills, and transforming ideas into meaningful digital experiences.',
  'Welcome to my personal digital hub. Here I document my technology interests, foundational digital skills, evolving projects, and ongoing learning journey.',
  'Hello! I''m MD Robin Mia. I am a curious learner focused on technology, digital creativity, and building practical things for the web.',
  'Personal brand, technology hub, project portfolio, and learning journal of MD Robin Mia — transforming ideas into meaningful digital experiences.',
  '© 2026 MD ROBIN MIA. All Rights Reserved.',
  'https://mdrobinmia.pages.dev',
  'Let''s Connect',
  'Have an idea, a question or want to collaborate? Feel free to get in touch.',
  '',
  '[{"id":"email","platform":"Email","label":"Direct Email","url":null,"placeholderNote":"Email address coming soon"},{"id":"facebook","platform":"Facebook","label":"Facebook","url":null,"placeholderNote":"Link coming soon"},{"id":"linkedin","platform":"LinkedIn","label":"LinkedIn","url":null,"placeholderNote":"Link coming soon"},{"id":"github","platform":"GitHub","label":"GitHub","url":null,"placeholderNote":"Link coming soon"},{"id":"instagram","platform":"Instagram","label":"Instagram","url":null,"placeholderNote":"Link coming soon"}]',
  '{"siteTitleTemplate":"%s | MD ROBIN MIA","defaultTitle":"MD ROBIN MIA | Personal Website & Digital Portfolio","defaultDescription":"Explore the personal website of MD Robin Mia — discover skills, digital projects, milestones, and journal notes in one place.","defaultKeywords":"MD Robin Mia, MRM, personal brand, technology explorer, digital projects, Vyopic, Comentosh, Robin LLM, LIFEWEB","ogSiteName":"MD ROBIN MIA","twitterCard":"summary"}',
  '[{"label":"Home","to":"/","visible":true},{"label":"About","to":"/about","visible":true},{"label":"Skills","to":"/skills","visible":true},{"label":"Projects","to":"/projects","visible":true},{"label":"Blog","to":"/blog","visible":true},{"label":"Contact","to":"/contact","visible":true}]',
  1
);

-- System Pages (editable SEO & editorial metadata)
INSERT OR IGNORE INTO pages (id, slug, title, subtitle, hero_label, content_markdown, seo_title, seo_description, canonical_path, no_index, status, is_system, sort_order, published_at) VALUES
('page-home', 'home', 'MD ROBIN MIA', 'Exploring technology, developing digital products, learning new skills, and transforming ideas into meaningful digital experiences.', 'PERSONAL BRAND & TECHNOLOGY', '', 'MD ROBIN MIA | Personal Website & Digital Portfolio', 'Explore the personal website of MD Robin Mia — discover skills, digital projects, milestones, and journal notes in one place.', '/', 0, 'published', 1, 1, '2026-11-01T00:00:00Z'),
('page-about', 'about', 'About Me.', 'Hello! I''m MD Robin Mia. I am a curious learner focused on technology, digital creativity, and building practical things for the web.', '01 / Personal Overview', '', 'About MD Robin Mia | Story, Education & Milestones', 'Learn about MD Robin Mia, his personal journey, independent web learning, educational background, and key personal milestones.', '/about', 0, 'published', 1, 2, '2026-11-01T00:00:00Z'),
('page-skills', 'skills', 'My Skills.', 'Organized transparently across what I currently know, what I am actively learning, and the technology areas I explore — without fake percentages or fabricated credentials.', '02 / Technology & Capabilities', '', 'Skills & Capabilities | MD ROBIN MIA', 'Explore Current Skills, Currently Learning areas, and Technology Interests of MD Robin Mia without fabricated proficiency metrics.', '/skills', 0, 'published', 1, 3, '2026-11-01T00:00:00Z'),
('page-projects', 'projects', 'My Projects.', 'A curated index of digital tools, platforms, and ongoing initiatives from early concept to active development.', '03 / Studio Portfolio', '', 'Projects Showcase | MD ROBIN MIA', 'Explore Vyopic, Qyopic, Comentosh, Pasher Shop, Robin LLM, and LIFEWEB — digital tools and platform concepts by MD Robin Mia.', '/projects', 0, 'published', 1, 4, '2026-11-01T00:00:00Z'),
('page-achievements', 'achievements', 'Achievements.', 'A structured timeline documenting personal milestones, educational progress, verified certificates, and recognitions.', '04 / Milestones & Timeline', '', 'Achievements & Milestones | MD ROBIN MIA', 'View personal milestones, educational progress, certificates archive, and recognitions documented by MD Robin Mia.', '/achievements', 0, 'published', 1, 5, '2026-11-01T00:00:00Z'),
('page-blog', 'blog', 'Blog.', 'Notes on technology, web development fundamentals, AI workflow explorations, digital projects, and my ongoing learning journey.', '05 / Content & Learning Notes', '', 'Blog & Journal Essays | MD ROBIN MIA', 'Read articles, tutorials, and reflections on technology, web development, AI concepts, and digital design written by MD Robin Mia.', '/blog', 0, 'published', 1, 6, '2026-11-01T00:00:00Z'),
('page-contact', 'contact', 'HAVE AN IDEA? LET''S TALK.', 'Have an idea, a question or want to collaborate? Feel free to get in touch.', '06 / Contact', '', 'Contact MD Robin Mia | Get in Touch', 'Have an idea, question, or collaboration inquiry? Reach out to MD Robin Mia using the contact form or available channels.', '/contact', 0, 'published', 1, 7, '2026-11-01T00:00:00Z'),
('page-privacy', 'privacy-policy', 'Privacy Policy', 'How visitor privacy, browser storage, and inquiries are handled on MD Robin Mia.', 'Legal', '', 'Privacy Policy | MD ROBIN MIA', 'Read the Privacy Policy for the personal website of MD Robin Mia (MRM.).', '/privacy-policy', 0, 'published', 1, 8, '2026-11-01T00:00:00Z'),
('page-terms', 'terms-and-conditions', 'Terms & Conditions', 'Guidelines governing informational browsing, content ownership, and project concepts.', 'Legal', '', 'Terms & Conditions | MD ROBIN MIA', 'Review the Terms and Conditions governing informational browsing, content ownership, and project concepts on MD Robin Mia.', '/terms-and-conditions', 0, 'published', 1, 9, '2026-11-01T00:00:00Z');

-- Homepage Sections
INSERT OR IGNORE INTO homepage_sections (id, section_key, section_number, title, subtitle, content_markdown, cta_label, cta_url, is_visible, sort_order, status) VALUES
('hs-about', 'about_preview', '01', 'About Me.', 'Personal Introduction', '', 'About Me', '/about', 1, 1, 'published'),
('hs-skills', 'skills_preview', '02', 'Technology & Skills.', 'Foundational digital tools, active studies, and areas of curiosity.', '', 'My Skills', '/skills', 1, 2, 'published'),
('hs-projects', 'projects_preview', '03', 'My Projects.', 'Selected digital tools and platform concepts.', '', 'My Projects', '/projects', 1, 3, 'published'),
('hs-blog', 'blog_preview', '04', 'My Blog & Notes.', 'Recent essays and learning reflections.', '', 'My Blog', '/blog', 1, 4, 'published'),
('hs-contact', 'contact_cta', '05', 'HAVE AN IDEA? LET''S TALK.', 'Contact & Collaboration', 'Have an idea, a question or want to collaborate? Feel free to get in touch.', 'Start a Conversation', '/contact', 1, 5, 'published');

-- About Sections
INSERT OR IGNORE INTO about_sections (id, slug, title, content, is_placeholder, status, sort_order) VALUES
('personal-introduction', 'personal-introduction', 'Personal Introduction', 'I am MD Robin Mia (MRM.) — an emerging builder and curious learner dedicated to exploring modern technology, clean design, and useful web experiences. This space serves as my central digital hub where ideas, skills, and ongoing projects live together.', 0, 'published', 1),
('my-technology-interests', 'my-technology-interests', 'My Technology Interests', 'My curiosity centers on practical web tools, clean user interfaces, digital image utilities, thoughtful online discussion platforms, and applied language model workflows that simplify everyday tasks.', 0, 'published', 2),
('my-learning-journey', 'my-learning-journey', 'My Learning Journey', 'I am building my technical foundation step by step—moving from everyday computer fluency and visual design into semantic HTML, responsive layouts, modern frontend concepts, and structured product thinking.', 1, 'published', 3),
('my-vision', 'my-vision', 'My Vision', 'To combine simplicity, intentional design, and practical technology so everyday digital products feel clearer, faster, and more human-centered.', 1, 'published', 4),
('my-goals', 'my-goals', 'My Goals', 'To strengthen my web development foundations, ship real-world versions of my early project concepts, and collaborate meaningfully with curious builders and learners.', 1, 'published', 5);

-- Education Entries
INSERT OR IGNORE INTO education (id, period, title, institution, location, summary, is_placeholder, status, sort_order) VALUES
('independent-digital-learning', 'Ongoing', 'Independent Web & Digital Studies', 'Self-Directed Learning', 'Bangladesh', 'Studying modern web structure, typography, responsive design systems, and practical digital workflows through hands-on experimentation.', 0, 'published', 1),
('formal-education-record', 'Academic Record', 'Formal Educational Background', 'Details Pending Update', '', 'Verified school, college, and academic institution records will be documented here once published.', 1, 'draft', 2);

-- Skills
INSERT OR IGNORE INTO skills (id, slug, name, stage, area, note, icon_key, status, sort_order) VALUES
('basic-computer-skills', 'basic-computer-skills', 'Basic Computer Skills', 'Current Skills', 'Foundations', 'Everyday computing workflows, file organization, troubleshooting, and digital productivity.', 'basic-computer-skills', 'published', 1),
('typing', 'typing', 'Typing', 'Current Skills', 'Communication', 'Clear, steady written communication and structured document drafting.', 'typing', 'published', 2),
('canva', 'canva', 'Canva', 'Current Skills', 'Visual Design', 'Creating clean layouts, social graphics, and minimal visual compositions.', 'canva', 'published', 3),
('facebook-social-media', 'facebook-social-media', 'Facebook & Social Media', 'Current Skills', 'Digital Presence', 'Managing pages, sharing updates thoughtfully, and understanding online communities.', 'facebook-social-media', 'published', 4),
('web-development-learning', 'web-development-learning', 'Web Development Fundamentals', 'Currently Learning', 'Web Engineering', 'Actively studying semantic HTML, CSS layout systems, responsive interfaces, and how static sites are built.', 'web-development-learning', 'published', 5),
('digital-creativity', 'digital-creativity', 'Digital Product Thinking', 'Currently Learning', 'Product Design', 'Learning to translate everyday problems into clear user flows, scopes, and clean digital prototypes.', 'digital-creativity', 'published', 6),
('ai-language-workflows', 'ai-language-workflows', 'AI & Language Workflows', 'Areas of Interest', 'AI Exploration', 'Exploring how structured prompts and language models can support everyday clarity and creative tools.', 'ai-language-workflows', 'published', 7),
('minimal-interface-design', 'minimal-interface-design', 'Minimal Interface Architecture', 'Areas of Interest', 'UI & Editorial', 'Studying Swiss editorial typography, whitespace balance, and distraction-free monochrome systems.', 'minimal-interface-design', 'published', 8);

-- Projects (all 6 verified projects)
INSERT OR IGNORE INTO projects (
  id, slug, name, short_description, overview, case_study_markdown, category, project_status,
  website_url, url_placeholder_note, highlights_json, tech_stack_json, development_progress,
  featured, status, sort_order, seo_title, seo_description, published_at
) VALUES
(
  'vyopic', 'vyopic', 'Vyopic', 'Smart Photo Tools',
  'A focused collection of practical, lightweight photo utilities designed to make everyday image adjustments fast and accessible directly from the browser.',
  '## Project Focus\n\nVyopic focuses on stripping away complex desktop photo-editor bloat so common image tasks—cropping, resizing, monochrome adjustment, and export—happen cleanly inside the browser.\n\n## Design Direction\n\n- Fast, clutter-free photo editing workflow\n- Minimalist black-and-white workspace\n- Browser-first accessibility without heavy installs',
  'Photo & Utility', 'In Development', NULL,
  'Website link will be published once this project launches.',
  '["Fast, clutter-free photo editing workflow","Minimalist black-and-white workspace","Browser-first accessibility without heavy installs"]',
  '["HTML / CSS / JavaScript (Learning)","Browser UI Prototype"]',
  'Early UI exploration and core tool scoping',
  1, 'published', 1,
  'Vyopic — Smart Photo Tools | MD ROBIN MIA',
  'A focused collection of practical, lightweight browser photo utilities designed by MD Robin Mia.',
  '2026-11-01T00:00:00Z'
),
(
  'qyopic', 'qyopic', 'Qyopic', 'Digital Image Platform',
  'A clean digital image platform concept centered on organizing, presenting, and discovering visual assets with clarity and speed.',
  '## Concept Overview\n\nQyopic explores how a digital image repository can prioritize calm visual hierarchy and crisp metadata instead of noisy feeds.\n\n## Core Principles\n\n- Curated visual browsing without noise\n- Clean metadata presentation\n- Built for lightweight image discovery',
  'Digital Media', 'Concept', NULL,
  'Website link will be published once this project launches.',
  '["Curated visual browsing without noise","Clean metadata presentation","Built for lightweight image discovery"]',
  '["To be finalized (Concept Stage)"]',
  'Concept definition and visual layout planning',
  1, 'published', 2,
  'Qyopic — Digital Image Platform | MD ROBIN MIA',
  'A clean digital image platform concept centered on organizing and presenting visual assets clearly.',
  '2026-11-01T00:00:00Z'
),
(
  'comentosh', 'comentosh', 'Comentosh', 'Comment-First Social Platform',
  'An experimental social platform concept where thoughtful comments and structured dialogue take center stage over vanity metrics.',
  '## Motivation\n\nMost social networks reward shallow reactions. Comentosh reverses that priority by designing around readable discussions and structured replies.\n\n## Planned Structure\n\n- Conversation-first layout\n- Distraction-free reading and reply threads\n- Focus on meaningful community discussion',
  'Social Platform', 'In Development', NULL,
  'Website link will be published once this project launches.',
  '["Conversation-first layout","Distraction-free reading and reply threads","Focus on meaningful community discussion"]',
  '["Web Interface Design","Frontend Prototype (Learning)"]',
  'Information architecture and discussion thread design',
  1, 'published', 3,
  'Comentosh — Comment-First Social Platform | MD ROBIN MIA',
  'An experimental social platform concept prioritizing thoughtful comments and structured dialogue.',
  '2026-11-01T00:00:00Z'
),
(
  'pasher-shop', 'pasher-shop', 'Pasher Shop', 'Local Shop Discovery Platform',
  'A neighborhood discovery concept connecting people with nearby local shops, essential products, and community storefronts.',
  '## Local Focus\n\nPasher Shop is designed around helping neighbors quickly check nearby store availability and support independent local businesses.\n\n## Goals\n\n- Simple neighborhood store directory\n- Clear product and location visibility\n- Designed to support small local businesses',
  'Local Commerce', 'Concept', NULL,
  'Website link will be published once this project launches.',
  '["Simple neighborhood store directory","Clear product and location visibility","Designed to support small local businesses"]',
  '["To be finalized (Concept Stage)"]',
  'Problem framing and neighborhood directory structure',
  1, 'published', 4,
  'Pasher Shop — Local Shop Discovery Platform | MD ROBIN MIA',
  'A neighborhood discovery concept connecting people with nearby local shops and storefronts.',
  '2026-11-01T00:00:00Z'
),
(
  'robin-llm', 'robin-llm', 'Robin LLM', 'Language Model Project',
  'A personal exploration into language models, prompt architecture, and helpful AI-assisted workflows tailored for everyday clarity.',
  '## Research Scope\n\nRobin LLM documents hands-on experiments in structured prompting, text summarization, bilingual clarity, and lightweight assistant interfaces.\n\n## Focus Areas\n\n- Structured experimentation with language tasks\n- Focus on clear, practical human utility\n- Iterative learning notebook and workflow study',
  'AI & Language', 'In Development', NULL,
  'Website link will be published once this project launches.',
  '["Structured experimentation with language tasks","Focus on clear, practical human utility","Iterative learning notebook and workflow study"]',
  '["Prompt Architecture Exploration","AI Workflow Research"]',
  'Ongoing prompt design and practical use-case testing',
  0, 'published', 5,
  'Robin LLM — Language Model Project | MD ROBIN MIA',
  'A personal exploration into language models, prompt architecture, and helpful AI workflows.',
  '2026-11-01T00:00:00Z'
),
(
  'lifeweb', 'lifeweb', 'LIFEWEB', 'Digital World Platform',
  'An ambitious unified digital world concept bringing personal spaces, creative tools, and connected experiences under one cohesive web umbrella.',
  '## Long-Term Vision\n\nLIFEWEB represents an overarching modular roadmap connecting independent digital tools, personal publishing, and calm web spaces.\n\n## Pillars\n\n- Unified personal digital ecosystem\n- Minimalist Swiss-inspired interface architecture\n- Long-term modular web platform vision',
  'Web Ecosystem', 'Planned', NULL,
  'Website link will be published once this project launches.',
  '["Unified personal digital ecosystem","Minimalist Swiss-inspired interface architecture","Long-term modular web platform vision"]',
  '["To be finalized (Planned Architecture)"]',
  'Long-term modular vision and ecosystem roadmap',
  0, 'published', 6,
  'LIFEWEB — Digital World Platform | MD ROBIN MIA',
  'An ambitious unified digital world concept connecting personal spaces and creative web tools.',
  '2026-11-01T00:00:00Z'
);

-- Blog Categories
INSERT OR IGNORE INTO blog_categories (id, slug, name, name_bn, description, sort_order) VALUES
('cat-technology', 'technology', 'Technology', 'প্রযুক্তি', 'Everyday technology reflections, lightweight tools, and digital systems.', 1),
('cat-web-dev', 'web-development', 'Web Development', 'ওয়েব ডেভেলপমেন্ট', 'Semantic HTML, CSS layout craft, React architecture, and Cloudflare systems.', 2),
('cat-ai-ml', 'ai-and-machine-learning', 'AI & Machine Learning', 'কৃত্রিম বুদ্ধিমত্তা', 'Explorations into language models, prompting, and human-centered AI tools.', 3),
('cat-digital-projects', 'digital-projects', 'Digital Projects', 'ডিজিটাল প্রজেক্ট', 'Behind-the-scenes notes on Vyopic, Qyopic, Comentosh, Pasher Shop, Robin LLM, and LIFEWEB.', 4),
('cat-learning', 'learning-journey', 'Learning Journey', 'শেখার যাত্রা', 'Personal study logs, structured habits, and lessons learned over time.', 5);

-- Blog Posts (migrated from DEFAULT_SITE_CONTENT)
INSERT OR IGNORE INTO blog_posts (
  id, slug, title, excerpt, content_markdown, language, category_id, category_name,
  reading_time_minutes, featured, is_sample, status, publish_date, published_at, seo_title, seo_description, author_name
) VALUES
(
  'sample-post-1',
  'building-a-minimalist-digital-space',
  'Why I Built a Minimalist Black-and-White Digital Space',
  'Exploring how restraint, typography, and clear structure help ideas stand out without visual noise.',
  'When designing a personal website from scratch, it is tempting to fill every corner with colors, animations, and decorative widgets. Yet the clearest digital spaces often rely on the opposite: intentional white space, legible typography, and calm contrast.

Choosing a strict black-and-white palette shifts full attention to the words, ideas, and projects themselves. Without bright gradients competing for attention, every heading, project card, and paragraph carries deliberate weight.

As I continue learning web development and shaping concepts like Vyopic, Comentosh, and LIFEWEB, this journal will evolve into a living notebook for real lessons learned along the way.',
  'en', 'cat-digital-projects', 'Digital Projects', 3, 1, 1, 'published', '2026-11-10', '2026-11-10T00:00:00Z',
  'Why I Built a Minimalist Black-and-White Digital Space | MD ROBIN MIA',
  'Exploring how restraint, typography, and clear structure help ideas stand out without visual noise.',
  'MD Robin Mia'
),
(
  'sample-post-2',
  'learning-web-development-step-by-step',
  'Approaching Web Development One Fundamental at a Time',
  'Focusing on structure, semantic HTML, responsive spacing, and curiosity before chasing complexity.',
  'Starting out in web development can feel overwhelming because tools change rapidly. However, core principles—clear page structure, accessible navigation, clean typography, and responsive layouts—remain constant across every framework.

Instead of rushing to build everything at once, breaking ideas into small, understandable components makes learning sustainable. Every small screen, button, and form teaches something practical about how people interact with software.',
  'en', 'cat-web-dev', 'Web Development', 4, 0, 1, 'published', '2026-11-04', '2026-11-04T00:00:00Z',
  'Approaching Web Development One Fundamental at a Time | MD ROBIN MIA',
  'Focusing on structure, semantic HTML, responsive spacing, and curiosity before chasing complexity.',
  'MD Robin Mia'
),
(
  'sample-post-3',
  'thinking-about-human-centered-ai-tools',
  'Designing Practical Ideas Around Language Models',
  'Reflecting on what makes AI concepts like Robin LLM useful in everyday digital workflows.',
  'Technology becomes meaningful when it reduces friction rather than adding confusion. Whether exploring photo utilities or language models, the central question remains simple: does this help someone think, create, or finish a task more clearly?

Projects like Robin LLM start as curiosity-driven explorations—testing how structured prompts and clean interfaces can turn complex capability into simple, reliable tools.',
  'en', 'cat-ai-ml', 'AI & Machine Learning', 3, 0, 1, 'published', '2026-10-28', '2026-10-28T00:00:00Z',
  'Designing Practical Ideas Around Language Models | MD ROBIN MIA',
  'Reflecting on what makes AI concepts like Robin LLM useful in everyday digital workflows.',
  'MD Robin Mia'
),
(
  'sample-post-4',
  'from-idea-to-structured-project-plan',
  'How to Organize Early-Stage Digital Project Ideas',
  'A straightforward framework for documenting a project name, purpose, category, and realistic status.',
  'Every digital product starts as a short note. Before writing complex code or designing dozens of screens, writing down four simple fields—Name, One-Line Purpose, Category, and Honest Status—keeps expectations grounded.

Separating projects into Planned, Concept, In Development, and Live makes it easy for visitors to understand what exists today and what is actively taking shape.',
  'en', 'cat-learning', 'Learning Journey', 3, 0, 1, 'published', '2026-10-19', '2026-10-19T00:00:00Z',
  'How to Organize Early-Stage Digital Project Ideas | MD ROBIN MIA',
  'A straightforward framework for documenting a project name, purpose, category, and realistic status.',
  'MD Robin Mia'
),
(
  'sample-post-5',
  'minimal-tools-in-everyday-digital-life',
  'Why Lightweight Browser Tools Matter',
  'On the value of fast, focused web utilities for everyday tasks without clutter.',
  'Many everyday tasks—resizing an image, organizing a note, or finding a nearby shop—do not require massive software suites. Focused web tools that open quickly and respect the user''s attention continue to stand the test of time.',
  'en', 'cat-technology', 'Technology', 2, 0, 1, 'published', '2026-10-11', '2026-10-11T00:00:00Z',
  'Why Lightweight Browser Tools Matter | MD ROBIN MIA',
  'On the value of fast, focused web utilities for everyday tasks without clutter.',
  'MD Robin Mia'
);

-- Achievements (1 verified milestone published; future slots stay empty until verified certificates are added via Admin)
INSERT OR IGNORE INTO achievements (
  id, group_name, title, issuer_or_context, date_label, description, is_placeholder, status, sort_order
) VALUES (
  'milestone-personal-space',
  'Personal Milestones',
  'Launching Personal Digital Space (MRM.)',
  'Personal Initiative',
  '2026',
  'Established a unified personal website architecture to document ideas, technology interests, learning progress, and upcoming digital projects.',
  0,
  'published',
  1
);
