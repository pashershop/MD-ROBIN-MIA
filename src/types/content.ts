export type ProjectStatus = 'Live' | 'In Development' | 'Concept' | 'Planned';

export type SkillStage = 'Current Skills' | 'Currently Learning' | 'Areas of Interest';

export type BlogCategory =
  | 'Technology'
  | 'Web Development'
  | 'AI & Machine Learning'
  | 'Digital Projects'
  | 'Learning Journey';

export interface AboutSectionItem {
  id: string;
  title: string;
  content: string;
  isPlaceholder: boolean;
  placeholderHint?: string;
}

export interface EducationEntry {
  id: string;
  period: string;
  title: string;
  institutionOrContext: string;
  summary: string;
  isPlaceholder: boolean;
}

export interface SkillItem {
  id: string;
  name: string;
  stage: SkillStage;
  area: string;
  note: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  overview: string;
  category: string;
  status: ProjectStatus;
  websiteUrl: string | null;
  urlPlaceholderNote: string;
  highlights: string[];
  techStack: string[];
  developmentProgress: string;
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
  isPlaceholder: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: BlogCategory;
  publishDate: string;
  readingTimeMinutes: number;
  featured: boolean;
  isSample: boolean;
}

export interface SocialLinkItem {
  id: string;
  platform: 'Email' | 'Facebook' | 'LinkedIn' | 'GitHub' | 'Instagram';
  label: string;
  url: string | null;
  placeholderNote: string;
}

export interface SiteIdentity {
  brandMark: string;
  fullName: string;
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
  blogPosts: BlogPost[];
  contact: ContactConfig;
}
