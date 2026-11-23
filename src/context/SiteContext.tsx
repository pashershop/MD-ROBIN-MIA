import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  hasLocalDraftOverrides,
  loadSiteContent,
  resetLocalDraftContent,
  saveLocalDraftContent,
} from '../services/contentProvider';
import { apiClient } from '../services/apiClient';
import type { SiteContentData } from '../types/content';

type ThemeMode = 'light' | 'dark';
export type CmsSource = 'api' | 'static-fallback';

interface SiteContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  content: SiteContentData;
  updateContent: (next: SiteContentData) => void;
  resetContent: () => void;
  hasDraft: boolean;
  cmsSource: CmsSource;
  isCmsLoading: boolean;
  refreshContent: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'mrm-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // ignore storage errors
  }
  return 'light';
}

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [content, setContent] = useState<SiteContentData>(() => loadSiteContent());
  const [hasDraft, setHasDraft] = useState<boolean>(() => hasLocalDraftOverrides());
  const [cmsSource, setCmsSource] = useState<CmsSource>('static-fallback');
  const [isCmsLoading, setIsCmsLoading] = useState<boolean>(true);

  const refreshContent = useCallback(async () => {
    setIsCmsLoading(true);
    try {
      const res = await apiClient.fetchPublicBootstrap();
      if (res.ok && res.data) {
        setContent(res.data);
        setCmsSource('api');
      }
    } catch {
      // Static preview fallback remains active when Worker API is unreachable or unbound
      setCmsSource('static-fallback');
    } finally {
      setIsCmsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshContent();
  }, [refreshContent]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const updateContent = useCallback((next: SiteContentData) => {
    saveLocalDraftContent(next);
    setContent(next);
    setHasDraft(true);
  }, []);

  const resetContent = useCallback(() => {
    const fresh = resetLocalDraftContent();
    setContent(fresh);
    setHasDraft(false);
  }, []);

  return (
    <SiteContext.Provider
      value={{
        theme,
        toggleTheme,
        content,
        updateContent,
        resetContent,
        hasDraft,
        cmsSource,
        isCmsLoading,
        refreshContent,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error('useSite must be used inside SiteProvider');
  }
  return ctx;
}
