import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, FileText, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { Reveal } from '../components/Reveal';
import {
  ButtonLink,
  Container,
  PageHeroHeader,
  Section,
} from '../components/ui/DesignSystem';
import type { AchievementGroup, AchievementItem } from '../types/content';

const GROUPS: Array<'All' | AchievementGroup> = [
  'All',
  'Certificates Showcase',
  'Educational Background',
  'Personal Milestones',
  'Awards & Recognition',
];

export default function AchievementsPage() {
  const { content } = useSite();
  const [selectedGroup, setSelectedGroup] = useState<'All' | AchievementGroup>('All');
  const [previewItem, setPreviewItem] = useState<AchievementItem | null>(null);

  const items = useMemo(() => {
    if (selectedGroup === 'All') return content.achievements;
    return content.achievements.filter((a) => a.group === selectedGroup);
  }, [content.achievements, selectedGroup]);

  useEffect(() => {
    if (!previewItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewItem(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [previewItem]);

  return (
    <>
      <SeoHead
        title="Achievements | MD ROBIN MIA"
        description="Certificates showcase, educational background, personal milestones, and awards timeline for MD Robin Mia."
        canonicalPath="/achievements"
      />

      <PageHeroHeader
        label="04 / Milestones & Timeline"
        title="Achievements."
        description="A structured timeline documenting personal milestones, educational progress, certificates, and future recognitions."
      >
        <div
          role="group"
          aria-label="Filter achievements by category"
          className="mt-8 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] p-1 sm:mt-10 dark:border-[#222222] dark:bg-[#111111]"
        >
          {GROUPS.map((group) => {
            const active = selectedGroup === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedGroup(group)}
                aria-pressed={active}
                className={`min-h-[38px] rounded-[4px] px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:focus-visible:outline-white ${
                  active
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                    : 'text-[#707070] hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white'
                }`}
              >
                {group}
              </button>
            );
          })}
        </div>
      </PageHeroHeader>

      <Section surface="muted">
        <Container>
          <div className="relative border-l border-[#EAEAEA] pl-6 sm:pl-10 dark:border-[#222222]">
            <div className="space-y-6 sm:space-y-8">
              {items.map((item, idx) => (
                <Reveal key={item.id} delay={idx * 0.04}>
                  <article className="relative rounded-[8px] border border-[#EAEAEA] bg-white p-6 transition-colors duration-150 hover:border-[#111111] sm:p-8 dark:border-[#222222] dark:bg-[#111111] dark:hover:border-white">
                    <span
                      aria-hidden="true"
                      className="absolute top-8 -left-[30px] h-2.5 w-2.5 rounded-[2px] border border-[#111111] bg-white sm:-left-[46px] dark:border-white dark:bg-[#0D0D0D]"
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
                      <div className="md:col-span-3">
                        <time className="font-mono-tabular text-xs font-medium tracking-wider text-[#111111] uppercase dark:text-white">
                          {item.dateLabel}
                        </time>
                        <p className="mt-1 text-xs text-[#707070] dark:text-[#A3A3A3]">
                          {item.group}
                        </p>
                      </div>

                      <div className="md:col-span-9">
                        <h2 className="type-subheading text-[#000000] dark:text-white">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-[#707070] dark:text-[#A3A3A3]">
                          {item.issuerOrContext}
                        </p>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                          {item.description}
                        </p>

                        <div className="mt-5 border-t border-[#EAEAEA] pt-4 dark:border-[#222222]">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="inline-flex min-h-[38px] items-center gap-2 text-xs font-semibold tracking-wider text-[#111111] uppercase hover:underline dark:text-white"
                          >
                            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              {item.group === 'Certificates Showcase'
                                ? 'Certificate Preview'
                                : 'View Details'}
                            </span>
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:mt-12 sm:flex-row sm:items-center sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
            <div>
              <h2 className="text-lg font-semibold text-[#111111] dark:text-white">
                Explore Ongoing Work
              </h2>
              <p className="mt-1 text-sm text-[#707070] dark:text-[#A3A3A3]">
                See how these milestones connect with my skills and active digital projects.
              </p>
            </div>
            <ButtonLink to="/projects" variant="primary" className="group w-full sm:w-auto">
              <span>View Projects</span>
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="achievement-preview-title"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-xl rounded-[12px] border border-[#EAEAEA] bg-white p-6 text-[#111111] shadow-xl sm:p-10 dark:border-[#222222] dark:bg-[#111111] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#EAEAEA] pb-5 dark:border-[#222222]">
              <div>
                <p className="font-mono-tabular text-xs text-[#707070] dark:text-[#A3A3A3]">
                  {previewItem.group} <span aria-hidden="true">·</span> {previewItem.dateLabel}
                </p>
                <h2
                  id="achievement-preview-title"
                  className="type-subheading mt-2 text-[#000000] dark:text-white"
                >
                  {previewItem.title}
                </h2>
              </div>

              <button
                type="button"
                autoFocus
                onClick={() => setPreviewItem(null)}
                aria-label="Close certificate preview"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#EAEAEA] text-[#111111] hover:bg-[#F8F8F8] dark:border-[#222222] dark:text-white dark:hover:bg-[#1A1A1A]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6">
              <div className="rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] p-8 text-center dark:border-[#222222] dark:bg-[#161616]">
                <p className="text-sm font-semibold text-[#111111] dark:text-white">
                  {previewItem.isPlaceholder
                    ? 'Archive Record — Coming Soon'
                    : 'Milestone Record'}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                  {previewItem.issuerOrContext}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[#111111] dark:text-[#E5E5E5]">
                  {previewItem.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
