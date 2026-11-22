import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | null;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  const existing = Array.from(document.querySelectorAll<HTMLMetaElement>(`meta[${attr}="${key}"]`));
  let primary = existing[0];
  for (let i = 1; i < existing.length; i += 1) {
    existing[i].remove();
  }
  if (!primary) {
    primary = document.createElement('meta');
    primary.setAttribute(attr, key);
    document.head.appendChild(primary);
  }
  primary.setAttribute('content', content);
}

function setCanonicalLink(href: string) {
  const existing = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
  let primary = existing[0];
  for (let i = 1; i < existing.length; i += 1) {
    existing[i].remove();
  }
  if (!primary) {
    primary = document.createElement('link');
    primary.setAttribute('rel', 'canonical');
    document.head.appendChild(primary);
  }
  primary.setAttribute('href', href);
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  noIndex = false,
  structuredData = null,
}: SeoHeadProps) {
  const { pathname } = useLocation();
  const { content, theme } = useSite();

  const serializedJsonLd = structuredData ? JSON.stringify(structuredData) : null;

  useEffect(() => {
    document.title = title;

    const path = canonicalPath ?? pathname;
    const baseUrl = content.identity.canonicalBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path === '/' ? '/' : path.replace(/\/+$/, '');
    const canonicalUrl = `${baseUrl}${normalizedPath}`;

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMetaTag('name', 'theme-color', theme === 'dark' ? '#050505' : '#FFFFFF');
    setMetaTag('property', 'og:site_name', 'MD ROBIN MIA');
    setMetaTag('property', 'og:locale', 'en_US');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('name', 'twitter:card', 'summary');
    setMetaTag('name', 'twitter:url', canonicalUrl);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    setCanonicalLink(canonicalUrl);

    const scriptId = 'route-jsonld';
    const existingScript = document.getElementById(scriptId);
    if (serializedJsonLd) {
      let scriptEl = existingScript as HTMLScriptElement | null;
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = serializedJsonLd;
    } else if (existingScript) {
      existingScript.remove();
    }

    return () => {
      const cleanupEl = document.getElementById(scriptId);
      if (cleanupEl) {
        cleanupEl.remove();
      }
    };
  }, [
    title,
    description,
    canonicalPath,
    pathname,
    ogType,
    noIndex,
    theme,
    content.identity.canonicalBaseUrl,
    serializedJsonLd,
  ]);

  return null;
}
