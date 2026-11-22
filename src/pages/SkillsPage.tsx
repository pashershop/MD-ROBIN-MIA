import { ArrowRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { Reveal } from '../components/Reveal';
import { SkillIcon } from '../components/SkillIcon';
import {
  ButtonLink,
  Container,
  PageHeroHeader,
  Section,
} from '../components/ui/DesignSystem';

export default function SkillsPage() {
  const { content } = useSite();

  return (
    <>
      <SeoHead
        title="My Skills | MD ROBIN MIA"
        description="Explore the foundational digital skills, creative tools, and ongoing web development learning areas of MD Robin Mia."
        canonicalPath="/skills"
      />

      <PageHeroHeader
        label="02 / Capabilities & Learning"
        title="My Skills."
        description="Practical digital foundations and ongoing web exploration presented cleanly without artificial proficiency percentages or fabricated experience."
      />

      <Section surface="muted">
        <Container>
          <div className="divide-y divide-[#EAEAEA] overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white dark:divide-[#222222] dark:border-[#222222] dark:bg-[#111111]">
            {content.skills.map((skill, idx) => (
              <Reveal key={skill.id} delay={idx * 0.04}>
                <article className="group grid grid-cols-1 gap-4 px-6 py-8 transition-colors duration-150 hover:bg-[#F8F8F8] sm:px-8 md:grid-cols-12 md:items-center dark:hover:bg-[#171717]">
                  <div className="flex items-center gap-4 md:col-span-5">
                    <span className="font-mono-tabular text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
                      0{idx + 1}
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-[#EAEAEA] text-[#111111] transition-colors group-hover:border-[#111111] dark:border-[#222222] dark:text-white dark:group-hover:border-white">
                      <SkillIcon skillId={skill.id} className="h-4 w-4" />
                    </span>
                    <h2 className="text-lg font-semibold tracking-tight text-[#000000] transition-transform duration-150 group-hover:translate-x-1 sm:text-xl dark:text-white">
                      {skill.name}
                    </h2>
                  </div>

                  <div className="md:col-span-3">
                    <span className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
                      {skill.area}
                    </span>
                  </div>

                  <div className="md:col-span-4">
                    <p className="text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                      {skill.note}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-[#EAEAEA] pt-8 sm:flex-row sm:items-center dark:border-[#222222]">
            <p className="max-w-xl text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
              See how these foundational skills connect with ongoing experiments and platform ideas.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink to="/projects" variant="primary" className="group">
                <span>View Projects</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </ButtonLink>
              <ButtonLink to="/achievements" variant="secondary">
                Achievements
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
