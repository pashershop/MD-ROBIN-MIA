import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Briefcase,
  Compass,
  ExternalLink,
  FileText,
  FolderGit2,
  FolderTree,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Moon,
  PenTool,
  Shield,
  Sparkles,
  Sun,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { SeoHead } from '../../components/SeoHead';
import { useSite } from '../../context/SiteContext';
import { ApiError, apiClient } from '../../services/apiClient';
import type { AdminUser } from '../../types/content';
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  AdminNotice,
  ConfirmModal,
} from './components/AdminPrimitives';
import { AnalyticsSection, OverviewSection } from './sections/OverviewAndAnalyticsSections';
import {
  AboutSectionEditor,
  EducationSection,
  HomepageSectionsEditor,
  PagesSection,
  SkillsSection,
} from './sections/EditorialContentSections';
import {
  BlogSection,
  CategoriesSection,
  ProjectsSection,
} from './sections/PortfolioAndBlogSections';
import {
  AchievementsSection,
  ExperienceSection,
  MessagesSection,
  ServicesSection,
  TestimonialsSection,
} from './sections/ProfileGrowthAndInboxSections';
import {
  AdminProfileSection,
  MediaSection,
  NavigationSection,
  SeoSettingsSection,
  WebsiteSettingsSection,
} from './sections/MediaSettingsAndAccountSections';
import type { AdminSectionId } from './types';

interface NavGroup {
  label: string;
  items: Array<{
    id: AdminSectionId;
    label: string;
    icon: typeof LayoutDashboard;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Core Content',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'pages', label: 'Pages', icon: FileText },
      { id: 'homepage', label: 'Homepage Sections', icon: LayoutTemplate },
      { id: 'about', label: 'About', icon: User },
      { id: 'education', label: 'Education', icon: GraduationCap },
      { id: 'skills', label: 'Skills', icon: Sparkles },
    ],
  },
  {
    label: 'Portfolio & Writing',
    items: [
      { id: 'projects', label: 'Projects', icon: FolderGit2 },
      { id: 'blog', label: 'Blog', icon: PenTool },
      { id: 'categories', label: 'Categories', icon: FolderTree },
      { id: 'achievements', label: 'Achievements', icon: Award },
      { id: 'experience', label: 'Experience', icon: Briefcase },
      { id: 'services', label: 'Services', icon: Wrench },
      { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    ],
  },
  {
    label: 'Assets & Inbox',
    items: [
      { id: 'media', label: 'Media Library', icon: ImageIcon },
      { id: 'messages', label: 'Contact Messages', icon: Mail },
    ],
  },
  {
    label: 'System & Security',
    items: [
      { id: 'navigation', label: 'Navigation Menu', icon: Compass },
      { id: 'settings', label: 'Website Settings', icon: Layers },
      { id: 'seo', label: 'SEO Settings', icon: Globe },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'profile', label: 'Admin Profile', icon: Shield },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, refreshContent } = useSite();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authState, setAuthState] = useState<'checking' | 'ready' | 'offline'>('checking');
  const [offlineMsg, setOfflineMsg] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSectionId>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingSection, setPendingSection] = useState<AdminSectionId | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    setAuthState('checking');
    try {
      const res = await apiClient.getMe();
      setAdmin(res.admin);
      setAuthState('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setOfflineMsg(
        err instanceof Error
          ? err.message
          : 'Unable to reach Cloudflare Worker CMS API (/api/v1).',
      );
      setAuthState('offline');
    }
  }, [navigate]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  const handleRequestNavigate = useCallback(
    (next: AdminSectionId) => {
      if (next === activeSection) {
        setDrawerOpen(false);
        return;
      }
      if (dirty) {
        setPendingSection(next);
        setDrawerOpen(false);
        return;
      }
      setActiveSection(next);
      setDrawerOpen(false);
    },
    [activeSection, dirty],
  );

  const confirmLeaveDirty = () => {
    if (pendingSection) {
      setDirty(false);
      setActiveSection(pendingSection);
      setPendingSection(null);
    }
  };

  const handleLogout = async () => {
    setLogoutModalOpen(false);
    await apiClient.logout();
    navigate('/admin/login', { replace: true });
  };

  const handleSignedOut = () => {
    navigate('/admin/login', { replace: true });
  };

  const activeMeta = ALL_ITEMS.find((i) => i.id === activeSection) || ALL_ITEMS[0];

  if (authState === 'checking') {
    return (
      <>
        <SeoHead title="Admin Dashboard | MRM CMS" description="Private CMS administration." noIndex />
        <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] text-xs font-medium tracking-[0.12em] text-[#707070] uppercase dark:bg-[#050505] dark:text-[#A3A3A3]">
          Verifying Session...
        </div>
      </>
    );
  }

  if (authState === 'offline') {
    return (
      <>
        <SeoHead title="Admin Unavailable | MRM CMS" description="Private CMS administration." noIndex />
        <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4 py-12 dark:bg-[#050505]">
          <div className="w-full max-w-lg rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
            <h1 className="text-xl font-bold tracking-tight text-[#000000] dark:text-white">
              CMS Backend Connection Required
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
              The Admin Dashboard connects to your Cloudflare Worker + D1 API at{' '}
              <code className="font-mono-tabular">/api/v1</code>. In standalone static preview, no Worker is bound yet.
            </p>
            <div className="mt-4">
              <AdminNotice type="error" message={offlineMsg} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => void checkAuth()} className={ADMIN_BTN_PRIMARY}>
                Retry Connection
              </button>
              <Link to="/" className={ADMIN_BTN_SECONDARY}>
                Return to Public Site
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#0A0A0A]">
      <div className="overflow-y-auto px-3 py-5">
        <div className="mb-6 flex items-center justify-between px-3">
          <div>
            <span className="text-lg font-extrabold tracking-[-0.04em] text-[#000000] dark:text-white">
              MRM.
            </span>
            <span className="ml-2 font-mono-tabular text-[11px] tracking-widest text-[#707070] uppercase dark:text-[#A3A3A3]">
              CMS
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation drawer"
            className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#EAEAEA] text-[#111111] lg:hidden dark:border-[#222222] dark:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="CMS Sections" className="space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[11px] font-semibold tracking-[0.12em] text-[#707070] uppercase dark:text-[#A3A3A3]">
                {group.label}
              </p>
              <ul className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleRequestNavigate(item.id)}
                        className={`flex min-h-[44px] w-full items-center gap-3 rounded-[4px] px-3 py-2 text-left text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                            : 'text-[#111111] hover:bg-[#F8F8F8] dark:text-[#D4D4D4] dark:hover:bg-[#161616]'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-[#EAEAEA] p-3 dark:border-[#222222]">
        <div className="mb-2 px-3 py-1">
          <p className="truncate text-xs font-semibold text-[#111111] dark:text-white">
            {admin?.displayName}
          </p>
          <p className="truncate font-mono-tabular text-[11px] text-[#707070] dark:text-[#A3A3A3]">
            {admin?.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLogoutModalOpen(true)}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-[4px] px-3 py-2 text-left text-xs font-semibold text-[#DC2626] transition-colors hover:bg-[#FEF2F2] dark:hover:bg-[#2A0F0F]"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  const sectionProps = {
    onNavigate: handleRequestNavigate,
    setDirty,
    onPublicDataChanged: () => {
      void refreshContent();
    },
    admin: admin ?? undefined,
    onAdminUpdated: (updated: AdminUser) => setAdmin(updated),
    onSignedOut: handleSignedOut,
  };

  return (
    <>
      <SeoHead
        title={`${activeMeta.label} | MRM Admin`}
        description="Private CMS administration console."
        noIndex
      />

      <div className="flex min-h-screen bg-[#F8F8F8] text-[#111111] dark:bg-[#050505] dark:text-white">
        {/* Desktop Sidebar (260px) */}
        <aside className="hidden w-[260px] shrink-0 border-r border-[#EAEAEA] lg:block dark:border-[#222222]">
          <div className="sticky top-0 h-screen">{sidebarContent}</div>
        </aside>

        {/* Mobile Drawer */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 flex lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation menu"
          >
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="relative z-10 h-full w-[280px] max-w-[85vw] border-r border-[#EAEAEA] dark:border-[#222222]">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-3 border-b border-[#EAEAEA] bg-white/95 px-4 backdrop-blur-sm sm:px-6 dark:border-[#222222] dark:bg-[#0A0A0A]/95">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open admin menu"
                className="flex h-11 w-11 items-center justify-center rounded-[4px] border border-[#EAEAEA] text-[#111111] lg:hidden dark:border-[#222222] dark:text-white"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="font-mono-tabular truncate text-[11px] tracking-[0.12em] text-[#707070] uppercase dark:text-[#A3A3A3]">
                  Admin / {activeMeta.label}
                  {dirty ? ' · Unsaved changes' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[4px] border border-[#EAEAEA] bg-white px-3 py-1.5 text-xs font-medium text-[#111111] transition-colors hover:border-[#111111] whitespace-nowrap dark:border-[#222222] dark:bg-[#111111] dark:text-white dark:hover:border-white"
              >
                <span>Public Site</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle monochrome theme"
                className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#EAEAEA] bg-white text-[#111111] transition-colors hover:border-[#111111] dark:border-[#222222] dark:bg-[#111111] dark:text-white dark:hover:border-white"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">
            {activeSection === 'overview' && <OverviewSection {...sectionProps} />}
            {activeSection === 'pages' && <PagesSection {...sectionProps} />}
            {activeSection === 'homepage' && <HomepageSectionsEditor {...sectionProps} />}
            {activeSection === 'about' && <AboutSectionEditor {...sectionProps} />}
            {activeSection === 'education' && <EducationSection {...sectionProps} />}
            {activeSection === 'skills' && <SkillsSection {...sectionProps} />}
            {activeSection === 'projects' && <ProjectsSection {...sectionProps} />}
            {activeSection === 'blog' && <BlogSection {...sectionProps} />}
            {activeSection === 'categories' && <CategoriesSection {...sectionProps} />}
            {activeSection === 'achievements' && <AchievementsSection {...sectionProps} />}
            {activeSection === 'experience' && <ExperienceSection {...sectionProps} />}
            {activeSection === 'services' && <ServicesSection {...sectionProps} />}
            {activeSection === 'testimonials' && <TestimonialsSection {...sectionProps} />}
            {activeSection === 'media' && <MediaSection />}
            {activeSection === 'messages' && <MessagesSection />}
            {activeSection === 'navigation' && <NavigationSection {...sectionProps} />}
            {activeSection === 'settings' && <WebsiteSettingsSection {...sectionProps} />}
            {activeSection === 'seo' && <SeoSettingsSection {...sectionProps} />}
            {activeSection === 'analytics' && <AnalyticsSection />}
            {activeSection === 'profile' && <AdminProfileSection {...sectionProps} />}
          </main>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingSection)}
        title="Discard Unsaved Changes?"
        description="You have unsaved edits in the current form. Switching sections will discard those changes."
        confirmLabel="Discard & Switch"
        danger
        onCancel={() => setPendingSection(null)}
        onConfirm={confirmLeaveDirty}
      />

      <ConfirmModal
        open={logoutModalOpen}
        title="Sign Out of CMS?"
        description="This terminates your active administrator session on this browser."
        confirmLabel="Sign Out"
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={() => void handleLogout()}
      />
    </>
  );
}
