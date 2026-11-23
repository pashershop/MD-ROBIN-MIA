export type ProjectStatus = 'Live' | 'In Development' | 'Concept' | 'Planned';

export type SkillStage = 'Current Skills' | 'Currently Learning' | 'Areas of Interest';

export type PublicationStatus = 'draft' | 'published' | 'archived';

export type BlogPublicationStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export type BlogLanguage = 'en' | 'bn' | 'bilingual';

export type BlogCategory =
  | 'Technology'
  | 'Web Development'
  | 'AI & Machine Learning'
  | 'Digital Projects'
  | 'Learning Journey'
  | string;

export interface AboutSectionItem {
  id: string;
  slug?: string;
  title: string;
  content: string;
  isPlaceholder: boolean;
  placeholderHint?: string;
  status?: PublicationStatus;
  sortOrder?: number;
}

export interface EducationEntry {
  id: string;
  period: string;
  title: string;
  institutionOrContext: string;
  location?: string;
  summary: string;
  isPlaceholder: boolean;
  status?: PublicationStatus;
  sortOrder?: number;
}

export interface SkillItem {
  id: string;
  slug?: string;
  name: string;
  stage: SkillStage;
  area: string;
  note: string;
  iconKey?: string;
  status?: PublicationStatus;
  sortOrder?: number;
}

export interface ProjectGalleryImage {
  id: string;
  imageUrl: string;
  altText: string;
  caption: string;
  sortOrder?: number;
}

export interface ProjectItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  overview: string;
  caseStudyMarkdown?: string;
  category: string;
  status: ProjectStatus;
  publicationStatus?: PublicationStatus;
  websiteUrl: string | null;
  repoUrl?: string | null;
  urlPlaceholderNote: string;
  highlights: string[];
  techStack: string[];
  developmentProgress: string;
  coverImageUrl?: string | null;
  gallery?: ProjectGalleryImage[];
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
}

export type AchievementGroup =
  | 'Certificates Showcase'
  | 'Educational Background'
  | 'Personal Milestones'
  | 'Awards & Recognition';

export interface AchievementItem {
  id: string;
  group: AchievementGroup;
  title: string;
  issuerOrContext: string;
  dateLabel: string;
  description: string;
  credentialUrl?: string | null;
  certificateImageUrl?: string | null;
  isPlaceholder: boolean;
  status?: PublicationStatus;
  sortOrder?: number;
}

export interface BlogCategoryItem {
  id: string;
  slug: string;
  name: string;
  nameBn?: string;
  description?: string;
  sortOrder?: number;
}

export interface BlogTagItem {
  id?: string;
  slug: string;
  name: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  titleBn?: string;
  excerpt: string;
  excerptBn?: string;
  content: string[];
  contentMarkdown?: string;
  contentMarkdownBn?: string;
  language?: BlogLanguage;
  category: BlogCategory;
  coverImageUrl?: string | null;
  publishDate: string;
  readingTimeMinutes: number;
  featured: boolean;
  isSample: boolean;
  status?: BlogPublicationStatus;
  tags?: BlogTagItem[];
  seoTitle?: string;
  seoDescription?: string;
  authorName?: string;
}

export interface ExperienceItem {
  id: string;
  roleTitle: string;
  organization: string;
  period: string;
  location: string;
  employmentType: string;
  summary: string;
  highlights: string[];
  status?: PublicationStatus;
  sortOrder?: number;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  deliverables: string[];
  availabilityNote: string;
  status?: PublicationStatus;
  sortOrder?: number;
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorRole: string;
  organization: string;
  quote: string;
  projectRef: string;
  isApproved?: boolean;
  status?: PublicationStatus;
  sortOrder?: number;
}

export interface CmsPageItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  heroLabel: string;
  contentMarkdown: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  noIndex: boolean;
  status?: PublicationStatus;
  isSystem: boolean;
  sortOrder?: number;
}

export interface HomepageSectionItem {
  id: string;
  sectionKey: string;
  sectionNumber: string;
  title: string;
  subtitle: string;
  contentMarkdown: string;
  ctaLabel: string;
  ctaUrl: string;
  isVisible?: boolean;
  sortOrder: number;
  status?: PublicationStatus;
}

export interface NavigationMenuItem {
  label: string;
  to: string;
  visible: boolean;
}

export interface SeoDefaults {
  siteTitleTemplate?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultKeywords?: string;
  ogSiteName?: string;
  twitterCard?: string;
}

export interface SocialLinkItem {
  id: string;
  platform: 'Email' | 'Facebook' | 'LinkedIn' | 'GitHub' | 'Instagram' | string;
  label: string;
  url: string | null;
  placeholderNote: string;
}

export interface SiteIdentity {
  brandMark: string;
  fullName: string;
  professionalIdentity?: string;
  tagline: string;
  availabilityLabel: string;
  heroLabel: string;
  heroSubheading: string;
  heroDescription: string;
  footerDescription: string;
  copyrightText: string;
  canonicalBaseUrl: string;
}

export interface ContactConfig {
  heading: string;
  description: string;
  email: string;
  emailIsPlaceholder: boolean;
  socialLinks: SocialLinkItem[];
}

export interface SiteContentData {
  identity: SiteIdentity;
  aboutIntro: string;
  aboutSections: AboutSectionItem[];
  educationEntries: EducationEntry[];
  skills: SkillItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  blogCategories?: BlogCategoryItem[];
  blogPosts: BlogPost[];
  experiences?: ExperienceItem[];
  services?: ServiceItem[];
  testimonials?: TestimonialItem[];
  pages?: CmsPageItem[];
  homepageSections?: HomepageSectionItem[];
  navigationMenu?: NavigationMenuItem[];
  seoDefaults?: SeoDefaults;
  contact: ContactConfig;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  bio: string;
  role: string;
  lastLoginAt: string | null;
}

export interface MediaItem {
  id: string;
  r2Key: string | null;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  caption: string;
  storageProvider: 'r2' | 'external_url';
  createdAt?: string;
}

export interface ContactMessageItem {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  readAt: string | null;
}

export interface AnalyticsSummary {
  days: number;
  totalViews: number;
  dailyViews: Array<{ date: string; views: number }>;
  topPaths: Array<{ path: string; contentType: string; views: number }>;
}

export interface DashboardOverview {
  r2Configured: boolean;
  counts: {
    publishedPages: number;
    totalProjects: number;
    publishedPosts: number;
    draftPosts: number;
    publishedSkills: number;
    publishedAchievements: number;
    unreadMessages: number;
    mediaItems: number;
    viewsLast30Days: number;
  };
  recentMessages: Array<{
    id: string;
    fullName: string;
    email: string;
    subject: string;
    status: string;
    createdAt: string;
  }>;
  recentRevisions: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    createdAt: string;
  }>;
}
