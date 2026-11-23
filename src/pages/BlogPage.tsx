import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, Search, Share2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { Reveal } from '../components/Reveal';
import {
  Button,
  ButtonLink,
  Container,
  PageHeroHeader,
  Section,
} from '../components/ui/DesignSystem';
import type { BlogCategory } from '../types/content';

const DEFAULT_CATEGORIES: Array<'All' | BlogCategory> = [
  'All',
  'Technology',
  'Web Development',
  'AI & Machine Learning',
  'Digital Projects',
  'Learning Journey',
];

export default function BlogPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const { content } = useSite();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | BlogCategory>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (content.blogCategories && content.blogCategories.length > 0) {
      return ['All', ...content.blogCategories.map((c) => c.name)];
    }
    return DEFAULT_CATEGORIES;
  }, [content.blogCategories]);

  useEffect(() => {
    if (!categorySlug) {
      setActiveCategory('All');
      return;
    }
    const matched = content.blogCategories?.find((c) => c.slug === categorySlug);
    if (matched) {
      setActiveCategory(matched.name);
      return;
    }
    const normalized = categorySlug.replace(/-/g, ' ').toLowerCase();
    const fallbackMatch = categories.find((c) => c.toLowerCase() === normalized);
    if (fallbackMatch) setActiveCategory(fallbackMatch);
  }, [categorySlug, content.blogCategories, categories]);

  const featuredPost = useMemo(
    () => content.blogPosts.find((p) => p.featured) ?? content.blogPosts[0],
    [content.blogPosts],
  );

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return content.blogPosts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        (post.titleBn || '').toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [content.blogPosts, activeCategory, searchQuery]);

  const handleShare = async (slug: string, title: string, id: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <>
      <SeoHead
        title="Blog & Journal Essays | MD ROBIN MIA"
        description="Read articles, tutorials, and reflections on technology, web development, AI concepts, and digital design written by MD Robin Mia."
        canonicalPath="/blog"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'MD Robin Mia Journal',
          url: `${content.identity.canonicalBaseUrl}/blog`,
          author: { '@id': `${content.identity.canonicalBaseUrl}/#person` },
        }}
      />

      <PageHeroHeader
        label="05 / Content & Learning Notes"
        title="Blog."
        description="Notes on technology, web development fundamentals, AI workflow explorations, digital projects, and my ongoing learning journey."
      >
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#707070] dark:text-[#A3A3A3]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              aria-label="Search blog articles"
              className="min-h-[44px] w-full rounded-[4px] border border-[#EAEAEA] bg-white pr-4 pl-10 text-sm text-[#111111] placeholder-[#707070] focus:border-[#111111] focus:outline-none dark:border-[#222222] dark:bg-[#111111] dark:text-white dark:placeholder-[#8E8E8E] dark:focus:border-white"
            />
          </div>

          <div
            role="group"
            aria-label="Filter articles by category"
            className="flex max-w-full flex-wrap items-center gap-1 rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] p-1 dark:border-[#222222] dark:bg-[#111111]"
          >
            {categories.map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={active}
                  className={`min-h-[38px] rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                      : 'text-[#707070] hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </PageHeroHeader>

      {featuredPost && activeCategory === 'All' && !searchQuery.trim() && (
        <Section surface="muted">
          <Container>
            <Reveal>
              <article className="rounded-[12px] border border-[#EAEAEA] bg-white p-6 sm:p-10 lg:p-12 dark:border-[#222222] dark:bg-[#111111]">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#707070] dark:text-[#A3A3A3]">
                  <span className="font-semibold tracking-wider text-[#111111] uppercase dark:text-white">
                    Featured Article
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{featuredPost.category}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={featuredPost.publishDate} className="font-mono-tabular">
                    {featuredPost.publishDate}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{featuredPost.readingTimeMinutes} min read</span>
                </div>

                <h2 className="type-section mt-5 max-w-4xl text-[#000000] text-balance dark:text-white">
                  <Link to={`/blog/${featuredPost.slug}`} className="hover:underline">
                    {featuredPost.title}
                  </Link>
                </h2>

                <p className="type-body mt-5 max-w-2xl text-[#707070] dark:text-[#A3A3A3]">
                  {featuredPost.excerpt}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#EAEAEA] pt-5 sm:mt-8 sm:gap-6 sm:pt-6 dark:border-[#222222]">
                  <ButtonLink
                    to={`/blog/${featuredPost.slug}`}
                    variant="primary"
                    className="group"
                  >
                    <span>Read Full Article</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </ButtonLink>

                  <button
                    type="button"
                    onClick={() =>
                      handleShare(featuredPost.slug, featuredPost.title, featuredPost.id)
                    }
                    className="inline-flex min-h-[42px] items-center gap-1.5 text-xs font-medium tracking-wider text-[#707070] uppercase hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white"
                  >
                    {copiedId === featuredPost.id ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            </Reveal>
          </Container>
        </Section>
      )}

      <Section surface="white">
        <Container>
          {filteredPosts.length === 0 ? (
            <div className="rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] p-12 text-center dark:border-[#222222] dark:bg-[#111111]">
              <p className="text-lg font-semibold text-[#111111] dark:text-white">
                No matching articles found.
              </p>
              <p className="mt-2 text-sm text-[#707070] dark:text-[#A3A3A3]">
                Try clearing your search or selecting another category.
              </p>
              <div className="mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#EAEAEA] border-y border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
              {filteredPosts.map((post, idx) => (
                <Reveal key={post.id} delay={idx * 0.03}>
                  <article className="group py-6 sm:py-8">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#707070] dark:text-[#A3A3A3]">
                      <span className="font-mono-tabular text-[#111111] dark:text-white">
                        0{idx + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{post.category}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={post.publishDate} className="font-mono-tabular">
                        {post.publishDate}
                      </time>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{post.readingTimeMinutes} min read</span>
                    </div>

                    <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                      <div className="max-w-2xl">
                        <h2 className="type-subheading text-[#000000] dark:text-white">
                          <Link to={`/blog/${post.slug}`} className="hover:underline">
                            {post.title}
                          </Link>
                        </h2>
                        <p className="mt-2.5 text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleShare(post.slug, post.title, post.id)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-medium text-[#707070] hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white"
                        >
                          {copiedId === post.id ? (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Share</span>
                            </>
                          )}
                        </button>

                        <Link
                          to={`/blog/${post.slug}`}
                          className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold tracking-wider text-[#111111] uppercase hover:underline whitespace-nowrap shrink-0 dark:text-white"
                        >
                          <span>Read</span>
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
