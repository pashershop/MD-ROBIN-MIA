import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ButtonLink, Container, Section } from '../components/ui/DesignSystem';

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { content } = useSite();
  const [imgFailed, setImgFailed] = useState(false);

  const project = content.projects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <>
        <SeoHead
          title="Project Not Found | MD ROBIN MIA"
          description="The requested project could not be found on MD Robin Mia."
          noIndex
        />
        <Section surface="white">
          <Container className="max-w-3xl text-center">
            <p className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">Projects</p>
            <h1 className="type-section mt-3 text-[#111111] dark:text-white">Project Not Found</h1>
            <p className="type-body mt-4 text-[#707070] dark:text-[#A3A3A3]">
              This project does not exist or is currently unpublished.
            </p>
            <div className="mt-8">
              <ButtonLink to="/projects" variant="primary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back to All Projects</span>
              </ButtonLink>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  const baseUrl = content.identity.canonicalBaseUrl.replace(/\/+$/, '');
  const seoTitle = project.seoTitle || `${project.name} — ${project.shortDescription} | MD ROBIN MIA`;
  const seoDesc = project.seoDescription || project.overview;

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        canonicalPath={`/projects/${project.slug}`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.name,
          description: seoDesc,
          url: `${baseUrl}/projects/${project.slug}`,
          author: { '@id': `${baseUrl}/#person` },
        }}
      />

      <article className="bg-white py-12 sm:py-16 lg:py-24 dark:bg-[#050505]">
        <Container className="max-w-4xl">
          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-[#707070] uppercase transition-colors hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-1"
              aria-hidden="true"
            />
            <span>Back to Projects</span>
          </Link>

          <header className="mt-8 border-b border-[#EAEAEA] pb-8 dark:border-[#222222]">
            <p className="text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
              {project.category} <span aria-hidden="true">·</span> Status: {project.status}
            </p>
            <h1 className="type-section mt-3 text-[#000000] text-balance dark:text-white">
              {project.name}
            </h1>
            <p className="type-subheading mt-2 text-[#111111] dark:text-[#E5E5E5]">
              {project.shortDescription}
            </p>
            <p className="type-body mt-5 max-w-2xl text-[#707070] dark:text-[#A3A3A3]">
              {project.overview}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {project.websiteUrl ? (
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] bg-[#111111] px-5 py-2.5 text-xs font-medium tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#000000] dark:bg-white dark:text-[#111111]"
                >
                  <span>Visit Live Website</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : (
                <span className="rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] px-4 py-2.5 text-xs text-[#707070] dark:border-[#222222] dark:bg-[#111111] dark:text-[#A3A3A3]">
                  {project.urlPlaceholderNote}
                </span>
              )}

              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-[#EAEAEA] px-4 py-2.5 text-xs font-medium tracking-[0.12em] text-[#111111] uppercase transition-colors hover:border-[#111111] dark:border-[#222222] dark:text-white dark:hover:border-white"
                >
                  <span>Source / Reference</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </header>

          {project.coverImageUrl && !imgFailed && (
            <div className="mt-8 overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] dark:border-[#222222] dark:bg-[#111111]">
              <img
                src={project.coverImageUrl}
                alt={`${project.name} cover preview`}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 gap-8 border-b border-[#EAEAEA] pb-10 sm:grid-cols-2 dark:border-[#222222]">
            <div>
              <h2 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
                Development Progress
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#111111] dark:text-[#E5E5E5]">
                {project.developmentProgress}
              </p>
            </div>
            <div>
              <h2 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
                Technology &amp; Scope
              </h2>
              <ul className="mt-2 space-y-1 text-sm text-[#111111] dark:text-[#E5E5E5]">
                {project.techStack.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          {project.highlights.length > 0 && (
            <section className="mt-10 border-b border-[#EAEAEA] pb-10 dark:border-[#222222]">
              <h2 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
                Key Highlights
              </h2>
              <ul className="mt-4 space-y-2.5">
                {project.highlights.map((item, idx) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-3 text-sm text-[#111111] dark:text-[#E5E5E5]"
                  >
                    <span className="font-mono-tabular text-xs text-[#707070] dark:text-[#A3A3A3]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {project.caseStudyMarkdown && (
            <section className="mt-10 text-base text-[#111111] dark:text-[#E5E5E5]">
              <MarkdownRenderer markdown={project.caseStudyMarkdown} />
            </section>
          )}

          {project.gallery && project.gallery.length > 0 && (
            <section className="mt-12 border-t border-[#EAEAEA] pt-10 dark:border-[#222222]">
              <h2 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">Gallery</h2>
              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {project.gallery.map((img) => (
                  <figure
                    key={img.id}
                    className="overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] dark:border-[#222222] dark:bg-[#111111]"
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.altText || `${project.name} gallery visual`}
                      referrerPolicy="no-referrer"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    {img.caption && (
                      <figcaption className="border-t border-[#EAEAEA] px-4 py-2.5 text-xs text-[#707070] dark:border-[#222222] dark:text-[#A3A3A3]">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}
        </Container>
      </article>
    </>
  );
}
