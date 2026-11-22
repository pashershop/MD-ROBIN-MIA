import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Share2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { ButtonLink, Container, Section } from '../components/ui/DesignSystem';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { content } = useSite();
  const [copied, setCopied] = useState(false);

  const post = content.blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return (
      <>
        <SeoHead
          title="Article Not Found | MD ROBIN MIA"
          description="The requested article could not be found."
        />
        <Section surface="white">
          <Container className="max-w-3xl text-center">
            <p className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">Blog</p>
            <h1 className="type-section mt-3 text-[#111111] dark:text-white">
              Article Not Found
            </h1>
            <p className="type-body mt-4 text-[#707070] dark:text-[#A3A3A3]">
              The article you are looking for does not exist or may have been updated.
            </p>
            <div className="mt-8">
              <ButtonLink to="/blog" variant="primary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back to All Articles</span>
              </ButtonLink>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `${content.identity.canonicalBaseUrl}/blog/${post.slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopyLink();
      return;
    }
    try {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: shareUrl,
      });
    } catch {
      // user cancelled
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(post.title);

  const relatedPosts = content.blogPosts.filter((item) => item.id !== post.id).slice(0, 2);

  return (
    <>
      <SeoHead
        title={`${post.title} | MD ROBIN MIA`}
        description={post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
      />

      <article className="bg-white py-12 sm:py-16 lg:py-24 dark:bg-[#050505]">
        <div className="mx-auto max-w-[68ch] px-5 sm:px-6">
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-[#707070] uppercase transition-colors hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-1"
              aria-hidden="true"
            />
            <span>Back to Blog</span>
          </Link>

          <header className="mt-8 border-b border-[#EAEAEA] pb-8 sm:mt-10 sm:pb-10 dark:border-[#222222]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#707070] dark:text-[#A3A3A3]">
              <span>{post.category}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishDate} className="font-mono-tabular">
                {post.publishDate}
              </time>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{post.readingTimeMinutes} min read</span>
            </div>

            <h1 className="type-section mt-5 text-[#000000] text-balance dark:text-white">
              {post.title}
            </h1>

            <p className="type-body mt-5 text-[#707070] dark:text-[#A3A3A3]">{post.excerpt}</p>
          </header>

          <div className="mt-10 space-y-6 text-base leading-[1.8] text-[#111111] sm:text-lg dark:text-[#E5E5E5]">
            {post.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-16 border-y border-[#EAEAEA] py-7 dark:border-[#222222]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
                Share Article
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[4px] border border-[#EAEAEA] px-3.5 py-2 text-xs font-medium text-[#111111] transition-colors hover:border-[#111111] dark:border-[#222222] dark:text-white dark:hover:border-white"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[4px] border border-[#EAEAEA] px-3.5 py-2 text-xs font-medium text-[#111111] transition-colors hover:border-[#111111] dark:border-[#222222] dark:text-white dark:hover:border-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center rounded-[4px] border border-[#EAEAEA] px-3.5 py-2 text-xs font-medium text-[#111111] transition-colors hover:border-[#111111] dark:border-[#222222] dark:text-white dark:hover:border-white"
                >
                  X / Twitter
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center rounded-[4px] border border-[#EAEAEA] px-3.5 py-2 text-xs font-medium text-[#111111] transition-colors hover:border-[#111111] dark:border-[#222222] dark:text-white dark:hover:border-white"
                >
                  LinkedIn
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center rounded-[4px] border border-[#EAEAEA] px-3.5 py-2 text-xs font-medium text-[#111111] transition-colors hover:border-[#111111] dark:border-[#222222] dark:text-white dark:hover:border-white"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>

          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
                Continue Reading
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedPosts.map((item) => (
                  <Link
                    key={item.id}
                    to={`/blog/${item.slug}`}
                    className="block rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] p-6 transition-colors hover:border-[#111111] dark:border-[#222222] dark:bg-[#111111] dark:hover:border-white"
                  >
                    <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">
                      {item.category} <span aria-hidden="true">·</span>{' '}
                      <span className="font-mono-tabular">{item.readingTimeMinutes} min read</span>
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-[#111111] dark:text-white">
                      {item.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  );
}
