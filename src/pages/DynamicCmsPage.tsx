import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { apiClient } from '../services/apiClient';
import { SeoHead } from '../components/SeoHead';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ButtonLink, Container, PageHeroHeader, Section } from '../components/ui/DesignSystem';
import type { CmsPageItem } from '../types/content';

export default function DynamicCmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { content } = useSite();
  const [fetchedPage, setFetchedPage] = useState<CmsPageItem | null>(null);
  const [loading, setLoading] = useState(false);

  const cachedPage = content.pages?.find((pg) => pg.slug === slug && !pg.isSystem) ?? null;

  useEffect(() => {
    if (cachedPage || !slug) return;
    let active = true;
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/public/pages/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.ok && data.page) {
          setFetchedPage(data.page as CmsPageItem);
        }
      })
      .catch(() => {
        // ignore cleanly
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, cachedPage, apiClient]);

  const page = cachedPage || fetchedPage;

  if (loading) {
    return (
      <Section surface="white">
        <Container className="py-12">
          <div className="h-8 w-48 animate-pulse rounded bg-[#EAEAEA] dark:bg-[#222222]" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-[#F8F8F8] dark:bg-[#111111]" />
        </Container>
      </Section>
    );
  }

  if (!page) {
    return (
      <>
        <SeoHead
          title="Page Not Found | MD ROBIN MIA"
          description="The requested page could not be found on MD ROBIN MIA."
          noIndex
        />
        <Section surface="white">
          <Container className="max-w-3xl text-center">
            <p className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">Error 404</p>
            <h1 className="type-section mt-3 text-[#000000] dark:text-white">Page Not Found</h1>
            <p className="type-body mt-4 text-[#707070] dark:text-[#A3A3A3]">
              The page you are looking for does not exist or is not published.
            </p>
            <div className="mt-8">
              <ButtonLink to="/" variant="primary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Return Home</span>
              </ButtonLink>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={page.seoTitle || `${page.title} | MD ROBIN MIA`}
        description={page.seoDescription || page.subtitle || page.title}
        canonicalPath={page.canonicalPath || `/p/${page.slug}`}
        noIndex={page.noIndex}
      />

      <PageHeroHeader
        label={page.heroLabel || 'Page'}
        title={page.title}
        description={page.subtitle || ''}
      />

      <Section surface="muted">
        <Container className="max-w-3xl">
          <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 text-base text-[#111111] sm:p-10 dark:border-[#222222] dark:bg-[#111111] dark:text-[#E5E5E5]">
            <MarkdownRenderer markdown={page.contentMarkdown} />
          </div>
        </Container>
      </Section>
    </>
  );
}
