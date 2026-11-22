import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { Reveal } from '../components/Reveal';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import {
  Button,
  Container,
  PageHeroHeader,
  Section,
} from '../components/ui/DesignSystem';
import type { ProjectItem, ProjectStatus } from '../types/content';

const STATUS_FILTERS: Array<'All' | ProjectStatus> = [
  'All',
  'Live',
  'In Development',
  'Planned',
];

export default function ProjectsPage() {
  const { content } = useSite();
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'All') return content.projects;
    return content.projects.filter((project) => project.status === statusFilter);
  }, [content.projects, statusFilter]);

  return (
    <>
      <SeoHead
        title="My Projects | MD ROBIN MIA"
        description="Explore Vyopic, Qyopic, Comentosh, Pasher Shop, Robin LLM, and LIFEWEB — digital concepts and projects by MD Robin Mia."
        canonicalPath="/projects"
      />

      <PageHeroHeader
        label="03 / Studio Portfolio"
        title="My Projects."
        description="A curated index of digital tools, platforms, and ongoing initiatives from early concept to active development."
      >
        <div
          role="group"
          aria-label="Filter projects by status"
          className="mt-8 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] p-1 sm:mt-10 dark:border-[#222222] dark:bg-[#111111]"
        >
          {STATUS_FILTERS.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                aria-pressed={active}
                className={`min-h-[38px] rounded-[4px] px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:focus-visible:outline-white ${
                  active
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                    : 'text-[#707070] hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </PageHeroHeader>

      <Section surface="muted">
        <Container>
          {filteredProjects.length === 0 ? (
            <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-10 text-center sm:p-12 dark:border-[#222222] dark:bg-[#111111]">
              <p className="text-lg font-semibold text-[#111111] dark:text-white">
                No projects currently marked as &ldquo;{statusFilter}&rdquo;.
              </p>
              <p className="mt-2 text-sm text-[#707070] dark:text-[#A3A3A3]">
                Project statuses update as new builds launch and move into active development.
              </p>
              <div className="mt-6">
                <Button type="button" variant="secondary" onClick={() => setStatusFilter('All')}>
                  Show All Projects
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
              {filteredProjects.map((project, index) => {
                const isOffset = index % 2 === 1;
                return (
                  <Reveal key={project.id} delay={index * 0.04}>
                    <article
                      className={`group flex h-full flex-col justify-between rounded-[8px] border border-[#EAEAEA] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111111] sm:p-8 dark:border-[#222222] dark:bg-[#111111] dark:hover:border-white ${
                        isOffset ? 'lg:mt-6' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 border-b border-[#EAEAEA] pb-4 text-xs text-[#707070] dark:border-[#222222] dark:text-[#A3A3A3]">
                          <span>
                            {project.category} <span aria-hidden="true">·</span>{' '}
                            <strong className="font-semibold text-[#111111] dark:text-white">
                              {project.status}
                            </strong>
                          </span>
                          <span className="font-mono-tabular font-medium text-[#111111] dark:text-white">
                            0{index + 1}
                          </span>
                        </div>

                        <h2 className="type-subheading mt-5 text-[#000000] sm:mt-6 sm:text-3xl dark:text-white">
                          {project.name}
                        </h2>
                        <p className="mt-1.5 text-sm font-medium text-[#111111] dark:text-[#E5E5E5]">
                          {project.shortDescription}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                          {project.overview}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#EAEAEA] pt-4 sm:mt-8 sm:pt-5 dark:border-[#222222]">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => setSelectedProject(project)}
                        >
                          <span>View Project</span>
                          <ArrowUpRight
                            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            aria-hidden="true"
                          />
                        </Button>

                        {project.websiteUrl ? (
                          <a
                            href={project.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111] hover:underline whitespace-nowrap shrink-0 dark:text-white"
                          >
                            <span>Live Site</span>
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-xs text-[#707070] dark:text-[#A3A3A3]">
                            Website Coming Soon
                          </span>
                        )}
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </>
  );
}
