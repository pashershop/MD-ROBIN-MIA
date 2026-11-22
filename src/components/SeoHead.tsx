import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  noIndex = false,
}: SeoHeadProps) {
  const { pathname } = useLocation();
  const { content, theme } = useSite();

  useEffect(() => {
    document.title = title;

    const path = canonicalPath ?? pathname;
    const baseUrl = content.identity.canonicalBaseUrl.replace(/\/+$/, '');
    const canonicalUrl = `${baseUrl}${path === '/' ? '/' : path}`;
    const liveUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : canonicalUrl;

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMetaTag('name', 'theme-color', theme === 'dark' ? '#050505' : '#FFFFFF');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', liveUrl);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);
  }, [
    title,
    description,
    canonicalPath,
    pathname,
    ogType,
    noIndex,
    theme,
    content.identity.canonicalBaseUrl,
  ]);

  return null;
}
