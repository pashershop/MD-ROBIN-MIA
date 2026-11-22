import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BackToTop } from './BackToTop';

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111111] transition-colors duration-200 dark:bg-[#050505] dark:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:border focus:border-[#111111] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#111111] dark:focus:border-white dark:focus:bg-[#111111] dark:focus:text-white"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="flex-1">
        {shouldReduceMotion ? (
          <div>{children}</div>
        ) : (
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
