import { useEffect } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { ProjectItem } from '../types/content';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[12px] border border-[#EAEAEA] bg-white p-5 text-[#111111] shadow-xl sm:p-8 lg:p-10 dark:border-[#222222] dark:bg-[#111111] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EAEAEA] pb-6 dark:border-[#222222]">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#707070] dark:text-[#A3A3A3]">
              {project.category} <span aria-hidden="true">·</span> Status: {project.status}
            </p>
            <h2
              id="project-modal-title"
              className="type-subheading mt-2 text-[#000000] dark:text-white"
            >
              {project.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-[#707070] dark:text-[#A3A3A3]">
              {project.shortDescription}
            </p>
          </div>

          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close project details"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#EAEAEA] text-[#111111] transition-colors hover:bg-[#F8F8F8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] dark:border-[#222222] dark:text-white dark:hover:bg-[#1A1A1A] dark:focus-visible:outline-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">Overview</h3>
            <p className="type-body mt-2 text-[#111111] dark:text-[#E5E5E5]">{project.overview}</p>
          </div>

          <div>
            <h3 className="type-label uppercase text-[#707070] dark:text-[#A3A3A3]">
              Key Focus Areas
            </h3>
            <ul className="mt-3 space-y-2 border-t border-[#EAEAEA] pt-3 dark:border-[#222222]">
              {project.highlights.map((item, idx) => (
                <li
                  key={item}
                  className="flex items-baseline gap-3 text-sm text-[#111111] dark:text-[#E5E5E5]"
                >
                  <span className="font-mono-tabular text-xs text-[#707070] dark:text-[#A3A3A3]">
                    0{idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[#EAEAEA] pt-6 dark:border-[#222222]">
            {project.websiteUrl ? (
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] bg-[#111111] px-6 py-3 text-xs font-medium tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#000000] dark:bg-white dark:text-[#111111]"
              >
                <span>Visit Project Website</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <div className="rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] px-4 py-3 text-xs text-[#707070] dark:border-[#222222] dark:bg-[#161616] dark:text-[#A3A3A3]">
                {project.urlPlaceholderNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
