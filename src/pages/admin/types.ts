import type { AdminUser } from '../../types/content';

export type AdminSectionId =
  | 'overview'
  | 'pages'
  | 'homepage'
  | 'about'
  | 'education'
  | 'skills'
  | 'projects'
  | 'blog'
  | 'categories'
  | 'achievements'
  | 'experience'
  | 'services'
  | 'testimonials'
  | 'media'
  | 'messages'
  | 'navigation'
  | 'settings'
  | 'seo'
  | 'analytics'
  | 'profile';

export interface AdminSectionProps {
  onNavigate: (section: AdminSectionId) => void;
  setDirty: (dirty: boolean) => void;
  onPublicDataChanged: () => void;
  admin?: AdminUser;
  onAdminUpdated?: (admin: AdminUser) => void;
  onSignedOut?: () => void;
}
