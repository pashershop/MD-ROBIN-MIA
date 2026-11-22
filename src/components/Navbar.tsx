import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { Container } from './ui/DesignSystem';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Skills', to: '/skills' },
  { label: 'Projects', to: '/projects' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
];

export function Navbar() {
  const { theme, toggleTheme, content } = useSite();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#EAEAEA] bg-white/95 backdrop-blur-md transition-colors duration-200 dark:border-[#222222] dark:bg-[#050505]/95">
      <Container className="flex h-14 items-center justify-between gap-4 sm:h-16 sm:gap-8">
        <Link
          to="/"
          className="text-lg font-extrabold tracking-[-0.03em] text-[#111111] whitespace-nowrap shrink-0 transition-opacity hover:opacity-75 sm:text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111] dark:text-white dark:focus-visible:outline-white"
        >
          {content.identity.brandMark}
        </Link>

        <div className="flex items-center gap-6 lg:gap-8">
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={`group relative py-1.5 text-[13px] font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111] dark:focus-visible:outline-white ${
                    isActive
                      ? 'text-[#000000] dark:text-white'
                      : 'text-[#707070] hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive ? (
                    shouldReduceMotion ? (
                      <span
                        aria-hidden="true"
                        className="absolute right-0 bottom-0 left-0 h-[1.5px] bg-[#000000] dark:bg-white"
                      />
                    ) : (
                      <motion.span
                        layoutId="nav-active-underline"
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        aria-hidden="true"
                        className="absolute right-0 bottom-0 left-0 h-[1.5px] bg-[#000000] dark:bg-white"
                      />
                    )
                  ) : (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 bottom-0 left-0 h-[1px] origin-left scale-x-0 bg-[#111111] transition-transform duration-200 group-hover:scale-x-100 dark:bg-white"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-[#EAEAEA] bg-white text-[#111111] transition-colors duration-150 hover:border-[#111111] hover:bg-[#F8F8F8] sm:h-10 sm:w-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:border-[#222222] dark:bg-[#111111] dark:text-white dark:hover:border-white dark:hover:bg-[#1A1A1A] dark:focus-visible:outline-white"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation-drawer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-[#EAEAEA] bg-white text-[#111111] transition-colors duration-150 hover:border-[#111111] hover:bg-[#F8F8F8] md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:border-[#222222] dark:bg-[#111111] dark:text-white dark:hover:border-white dark:hover:bg-[#1A1A1A] dark:focus-visible:outline-white"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              aria-hidden="true"
              initial={shouldReduceMotion ? undefined : { opacity: 0 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-x-0 top-14 bottom-0 z-30 bg-black/25 backdrop-blur-[2px] sm:top-16 md:hidden dark:bg-black/60"
            />

            <motion.div
              id="mobile-navigation-drawer"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-[#EAEAEA] bg-white shadow-lg sm:max-h-[calc(100dvh-4rem)] md:hidden dark:border-[#222222] dark:bg-[#050505]"
            >
              <Container className="py-4">
                <nav aria-label="Mobile Navigation" className="flex flex-col">
                  {[...NAV_ITEMS, { label: 'Achievements', to: '/achievements' }].map(
                    (item, idx) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          `flex min-h-[48px] items-center justify-between border-b border-[#EAEAEA] py-3 text-base font-medium transition-colors last:border-b-0 dark:border-[#222222] ${
                            isActive
                              ? 'font-semibold text-[#000000] dark:text-white'
                              : 'text-[#707070] hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white'
                          }`
                        }
                      >
                        <span>{item.label}</span>
                        <span className="font-mono-tabular text-xs text-[#707070] dark:text-[#A3A3A3]">
                          0{idx + 1}
                        </span>
                      </NavLink>
                    ),
                  )}
                </nav>

                <div className="mt-3 border-t border-[#EAEAEA] pt-3 dark:border-[#222222]">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex min-h-[48px] w-full items-center justify-between rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] px-4 py-2.5 text-sm font-medium text-[#111111] transition-colors hover:border-[#111111] dark:border-[#222222] dark:bg-[#111111] dark:text-white dark:hover:border-white"
                  >
                    <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Moon className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </Container>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
