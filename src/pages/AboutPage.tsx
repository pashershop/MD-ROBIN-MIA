import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { Reveal } from '../components/Reveal';
import {
  ButtonLink,
  Container,
  PageHeroHeader,
  Section,
  SectionHeader,
} from '../components/ui/DesignSystem';

export default function AboutPage() {
  const { content } = useSite();

  return (
    <>
      <SeoHead
        title="About MD Robin Mia | Story, Education & Milestones"
        description="Learn about MD Robin Mia, his personal journey, independent web learning, educational background, and key personal milestones."
        canonicalPath="/about"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          name: 'About MD Robin Mia',
          url: `${content.identity.canonicalBaseUrl}/about`,
          mainEntity: { '@id': `${content.identity.canonicalBaseUrl}/#person` },
        }}
      />

      <PageHeroHeader
        label="01 / Personal Overview"
        title="About Me."
        description={content.aboutIntro}
      />

      {/* Editorial Narrative */}
      <Section surface="muted">
        <Container>
          <div className="divide-y divide-[#EAEAEA] border-y border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {content.aboutSections.map((section, idx) => (
              <Reveal key={section.id} delay={idx * 0.04}>
                <article className="grid grid-cols-1 gap-3 py-8 sm:gap-6 sm:py-10 md:grid-cols-12 md:gap-8">
                  <div className="md:col-span-5">
                    <span className="font-mono-tabular text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
                      0{idx + 1}
                    </span>
                    <h2 className="type-subheading mt-1.5 text-[#000000] dark:text-white">
                      {section.title}
                    </h2>
                  </div>

                  <div className="md:col-span-7">
                    <p className="max-w-[65ch] text-[15px] leading-[1.78] text-[#111111] sm:text-[17px] dark:text-[#EAEAEA]">
                      {section.content}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Educational Background */}
      <Section surface="white">
        <Container>
          <Reveal>
            <SectionHeader number="02" title="Educational Background." />
          </Reveal>

          <div className="divide-y divide-[#EAEAEA] border-b border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {content.educationEntries.map((entry, idx) => (
              <Reveal key={entry.id} delay={idx * 0.04}>
                <article className="grid grid-cols-1 gap-3 py-7 sm:gap-6 sm:py-9 md:grid-cols-12 md:gap-8">
                  <div className="md:col-span-5">
                    <p className="font-mono-tabular text-xs font-medium tracking-wider text-[#111111] uppercase dark:text-white">
                      {entry.period}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#707070] dark:text-[#A3A3A3]">
                      {entry.institutionOrContext}
                    </p>
                  </div>

                  <div className="md:col-span-7">
                    <h3 className="text-lg font-semibold tracking-tight text-[#000000] sm:text-xl dark:text-white">
                      {entry.title}
                    </h3>
                    <p className="mt-2.5 max-w-[65ch] text-[15px] leading-[1.75] text-[#707070] sm:text-base dark:text-[#A3A3A3]">
                      {entry.summary}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Minimal Personal Milestones Timeline */}
      <Section surface="muted">
        <Container>
          <Reveal>
            <SectionHeader
              number="03"
              title="Milestones Timeline."
              action={
                <Link
                  to="/achievements"
                  className="group inline-flex min-h-[36px] items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#111111] uppercase hover:underline dark:text-white"
                >
                  <span>Full Archive</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              }
            />
          </Reveal>

          <div className="mt-8 border-l border-[#EAEAEA] pl-5 sm:mt-10 sm:pl-8 dark:border-[#222222]">
            <div className="space-y-6 sm:space-y-8">
              {content.achievements.map((item, idx) => (
                <Reveal key={item.id} delay={idx * 0.04}>
                  <article className="relative grid grid-cols-1 gap-2 pb-6 border-b border-[#EAEAEA] last:border-b-0 last:pb-0 md:grid-cols-12 md:gap-6 dark:border-[#222222]">
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-[25px] h-2.5 w-2.5 rounded-[2px] border border-[#111111] bg-[#F8F8F8] sm:-left-[37px] dark:border-white dark:bg-[#0D0D0D]"
                    />

                    <div className="md:col-span-4">
                      <time className="font-mono-tabular text-xs font-semibold tracking-wider text-[#111111] uppercase dark:text-white">
                        {item.dateLabel}
                      </time>
                      <p className="mt-1 text-xs text-[#707070] dark:text-[#A3A3A3]">
                        {item.group}
                      </p>
                    </div>

                    <div className="md:col-span-8">
                      <h3 className="text-base font-semibold text-[#000000] sm:text-lg dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 max-w-[65ch] text-sm leading-[1.7] text-[#707070] sm:text-[15px] dark:text-[#A3A3A3]">
                        {item.description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:mt-12 sm:flex-row sm:items-center sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold text-[#111111] dark:text-white">
                Explore Skills &amp; Projects
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                Continue exploring the foundational skills I am developing and the digital ideas I
                am building.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <ButtonLink to="/skills" variant="secondary" className="w-full sm:w-auto">
                View Skills
              </ButtonLink>
              <ButtonLink to="/projects" variant="primary" className="group w-full sm:w-auto">
                <span>Explore Projects</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
