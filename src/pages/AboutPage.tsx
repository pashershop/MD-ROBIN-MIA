import { ArrowRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { Reveal } from '../components/Reveal';
import {
  ButtonLink,
  Container,
  PageHeroHeader,
  Section,
} from '../components/ui/DesignSystem';

export default function AboutPage() {
  const { content } = useSite();

  return (
    <>
      <SeoHead
        title="About Me | MD ROBIN MIA"
        description="Learn about MD Robin Mia — personal introduction, journey, interests, vision, and goals."
        canonicalPath="/about"
      />

      <PageHeroHeader
        label="01 / Personal Overview"
        title="About Me."
        description={content.aboutIntro}
      />

      <Section surface="muted">
        <Container>
          <div className="divide-y divide-[#EAEAEA] border-y border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {content.aboutSections.map((section, idx) => (
              <Reveal key={section.id} delay={idx * 0.04}>
                <article className="grid grid-cols-1 gap-4 py-8 sm:gap-6 sm:py-10 md:grid-cols-12 md:gap-8">
                  <div className="md:col-span-5">
                    <span className="font-mono-tabular text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
                      0{idx + 1}
                    </span>
                    <h2 className="type-subheading mt-1.5 text-[#000000] dark:text-white">
                      {section.title}
                    </h2>
                  </div>

                  <div className="md:col-span-7">
                    <p className="type-body max-w-2xl text-[#111111] dark:text-[#EAEAEA]">
                      {section.content}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
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
