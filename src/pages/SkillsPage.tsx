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
  SectionHeader,
} from '../components/ui/DesignSystem';
import type { SkillStage } from '../types/content';

const SKILL_GROUPS: Array<{ stage: SkillStage; number: string; subtitle: string }> = [
  {
    stage: 'Current Skills',
    number: '01',
    subtitle: 'Foundational digital tools and everyday workflows I actively use today.',
  },
  {
    stage: 'Currently Learning',
    number: '02',
    subtitle: 'Technical foundations and structured product practices I am actively studying.',
  },
  {
    stage: 'Areas of Interest',
    number: '03',
    subtitle: 'Technology domains I explore and document through experiments and notes.',
  },
];

export default function SkillsPage() {
  const { content } = useSite();

  return (
    <>
      <SeoHead
        title="Skills & Capabilities | MD ROBIN MIA"
        description="Explore Current Skills, Currently Learning areas, and Technology Interests of MD Robin Mia without fabricated proficiency metrics."
        canonicalPath="/skills"
      />

      <PageHeroHeader
        label="02 / Technology & Capabilities"
        title="My Skills."
        description="Organized transparently across what I currently know, what I am actively learning, and the technology areas I explore — without fake percentages or fabricated credentials."
      />

      <Section surface="muted">
        <Container className="space-y-12 sm:space-y-16">
          {SKILL_GROUPS.map((group) => {
            const groupSkills = content.skills.filter((skill) => skill.stage === group.stage);
            if (groupSkills.length === 0) return null;

            return (
              <div key={group.stage}>
                <Reveal>
                  <SectionHeader number={group.number} title={`${group.stage}.`} />
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                    {group.subtitle}
                  </p>
                </Reveal>

                <div className="mt-6 divide-y divide-[#EAEAEA] overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white dark:divide-[#222222] dark:border-[#222222] dark:bg-[#111111]">
                  {groupSkills.map((skill, idx) => (
                    <Reveal key={skill.id} delay={idx * 0.04}>
                      <article className="group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 gap-y-2 px-5 py-6 transition-colors duration-150 hover:bg-[#F8F8F8] sm:px-8 sm:py-7 md:grid-cols-12 md:items-center md:gap-x-6 md:gap-y-0 lg:gap-x-8 dark:hover:bg-[#171717]">
                        <div className="col-start-1 row-start-1 pt-1 md:col-span-1 md:pt-0">
                          <span className="font-mono-tabular text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
                            0{idx + 1}
                          </span>
                        </div>

                        <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-3 md:col-start-auto md:col-span-4">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#EAEAEA] text-[#111111] transition-colors group-hover:border-[#111111] dark:border-[#222222] dark:text-white dark:group-hover:border-white">
                            <SkillIcon skillId={skill.id} className="h-4 w-4" />
                          </span>
                          <h3 className="min-w-0 text-base font-semibold tracking-tight text-[#000000] transition-transform duration-150 group-hover:translate-x-0.5 sm:text-lg dark:text-white">
                            {skill.name}
                          </h3>
                        </div>

                        <div className="col-start-2 min-w-0 md:col-start-auto md:col-span-3">
                          <span className="block text-[11px] font-medium tracking-[0.11em] text-[#707070] uppercase dark:text-[#A3A3A3]">
                            {skill.area}
                          </span>
                        </div>

                        <div className="col-start-2 min-w-0 md:col-start-auto md:col-span-4">
                          <p className="text-sm leading-[1.7] text-[#707070] dark:text-[#A3A3A3]">
                            {skill.note}
                          </p>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex flex-col items-start justify-between gap-6 border-t border-[#EAEAEA] pt-8 sm:flex-row sm:items-center dark:border-[#222222]">
            <p className="max-w-xl text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
              See how these capabilities and learning areas connect with ongoing digital projects.
            </p>
            <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <ButtonLink to="/projects" variant="primary" className="group w-full sm:w-auto">
                <span>View Projects</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </ButtonLink>
              <ButtonLink to="/about" variant="secondary" className="w-full sm:w-auto">
                About Me
              </ButtonLink>
              <ButtonLink to="/achievements" variant="outline" className="w-full sm:w-auto">
                Achievements
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
