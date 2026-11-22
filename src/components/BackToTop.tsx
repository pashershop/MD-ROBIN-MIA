import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 420);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (shouldReduceMotion) {
    if (!visible) return null;
    return (
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className="fixed right-5 bottom-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-[#EAEAEA] bg-[#111111] text-white dark:border-[#333333] dark:bg-white dark:text-[#111111]"
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-5 bottom-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-[#EAEAEA] bg-[#111111] text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:border-[#333333] dark:bg-white dark:text-[#111111] dark:focus-visible:outline-white"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
