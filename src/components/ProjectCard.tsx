import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { ProjectItem } from '../types/content';

interface ProjectCardProps {
  project: ProjectItem;
  index: number;
  onSelect: (project: ProjectItem) => void;
  headingTag?: 'h2' | 'h3';
}

export function ProjectCard({
  project,
  index,
  onSelect,
  headingTag = 'h3',
}: ProjectCardProps) {
  const Heading = headingTag;
  const formattedNumber = String(index + 1).padStart(2, '0');
  const hasLiveUrl = Boolean(project.websiteUrl);

  return (
    <article className="group flex h-full flex-col justify-between rounded-[8px] border border-[#EAEAEA] bg-white p-5 transition-[transform,border-color] duration-200 hover:border-[#111111] sm:p-7 md:hover:-translate-y-0.5 dark:border-[#222222] dark:bg-[#111111] dark:hover:border-white">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[#EAEAEA] pb-3.5 text-xs dark:border-[#222222]">
          <div className="flex min-w-0 items-center gap-2 text-[#707070] dark:text-[#A3A3A3]">
            <span className="font-mono-tabular font-semibold text-[#111111] dark:text-white">
              {formattedNumber}
            </span>
            <span aria-hidden="true">/</span>
            <span className="truncate">{project.category}</span>
          </div>

          <span className="font-medium text-[#111111] whitespace-nowrap shrink-0 dark:text-white">
            {project.status}
          </span>
        </div>

        <Heading className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#000000] sm:mt-6 sm:text-2xl dark:text-white">
          {project.name}
        </Heading>

        <p className="mt-1.5 text-sm font-medium text-[#111111] dark:text-[#E5E5E5]">
          {project.shortDescription}
        </p>

        <p className="mt-3 text-sm leading-[1.65] text-[#707070] dark:text-[#A3A3A3]">
          {project.overview}
        </p>

        <dl className="mt-4 space-y-2 border-t border-[#EAEAEA] pt-3.5 text-xs dark:border-[#222222]">
          <div className="flex flex-col gap-0.5">
            <dt className="font-medium tracking-wider text-[#707070] uppercase dark:text-[#A3A3A3]">
              Progress
            </dt>
            <dd className="text-[#111111] dark:text-[#E5E5E5]">{project.developmentProgress}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-medium tracking-wider text-[#707070] uppercase dark:text-[#A3A3A3]">
              Stack
            </dt>
            <dd className="text-[#707070] dark:text-[#A3A3A3]">
              {project.techStack.join(' · ')}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAEAEA] pt-4 sm:mt-7 dark:border-[#222222]">
        {hasLiveUrl && project.websiteUrl ? (
          <>
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[4px] border border-[#111111] bg-[#111111] px-4 py-2 text-xs font-medium tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#000000] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:border-white dark:bg-white dark:text-[#111111] dark:hover:bg-[#EAEAEA] dark:focus-visible:outline-white"
            >
              <span>Visit Project</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={() => onSelect(project)}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-medium tracking-[0.1em] text-[#707070] uppercase transition-colors hover:text-[#111111] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:text-[#A3A3A3] dark:hover:text-white dark:focus-visible:outline-white"
            >
              <span>Case Study</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <span className="text-xs font-medium text-[#707070] dark:text-[#A3A3A3]">
              Not Yet Launched
            </span>

            <button
              type="button"
              onClick={() => onSelect(project)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border border-[#EAEAEA] px-3.5 py-2 text-xs font-medium tracking-[0.1em] text-[#111111] uppercase transition-colors hover:border-[#111111] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:border-[#222222] dark:text-white dark:hover:border-white dark:focus-visible:outline-white"
            >
              <span>Case Study</span>
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
