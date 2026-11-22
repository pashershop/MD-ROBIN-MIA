import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import { Reveal } from '../components/Reveal';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import {
  Button,
  ButtonLink,
  Container,
  PageHeroHeader,
  Section,
} from '../components/ui/DesignSystem';
import type { ProjectItem, ProjectStatus } from '../types/content';

const STATUS_FILTERS: Array<'All' | ProjectStatus> = [
  'All',
  'Live',
  'In Development',
  'Concept',
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
        title="Projects Showcase | MD ROBIN MIA"
        description="Explore Vyopic, Qyopic, Comentosh, Pasher Shop, Robin LLM, and LIFEWEB — digital tools and platform concepts by MD Robin Mia."
        canonicalPath="/projects"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Projects by MD Robin Mia',
          url: `${content.identity.canonicalBaseUrl}/projects`,
          author: { '@id': `${content.identity.canonicalBaseUrl}/#person` },
        }}
      />

      <PageHeroHeader
        label="03 / Studio Portfolio"
        title="My Projects."
        description="A curated index of digital tools, platforms, and ongoing initiatives from early concept to active development."
      >
        <div
          role="group"
          aria-label="Filter projects by status"
          className="mt-8 flex w-full flex-wrap items-center gap-1 rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] p-1 sm:mt-10 sm:w-fit dark:border-[#222222] dark:bg-[#111111]"
        >
          {STATUS_FILTERS.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                aria-pressed={active}
                className={`min-h-[40px] rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 sm:px-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:focus-visible:outline-white ${
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
            <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-8 text-center sm:p-12 dark:border-[#222222] dark:bg-[#111111]">
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
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
              {filteredProjects.map((project, index) => (
                <Reveal key={project.id} delay={index * 0.04} className="h-full">
                  <ProjectCard
                    project={project}
                    index={index}
                    onSelect={setSelectedProject}
                    headingTag="h2"
                  />
                </Reveal>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:mt-12 sm:flex-row sm:items-center sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold text-[#111111] dark:text-white">
                Skills &amp; Collaboration
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
                Explore the foundational digital skills supporting these concepts, or get in touch
                about building together.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <ButtonLink to="/skills" variant="secondary" className="w-full sm:w-auto">
                View Skills
              </ButtonLink>
              <ButtonLink to="/contact" variant="primary" className="group w-full sm:w-auto">
                <span>Get in Touch</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </>
  );
}
