import { useState } from 'react';
import { Check, Copy, RotateCcw } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { CLOUDFLARE_D1_SCHEMA_SQL } from '../services/contentProvider';
import { SeoHead } from '../components/SeoHead';
import { Button, Container, Section } from '../components/ui/DesignSystem';
import type { ProjectStatus } from '../types/content';

const STATUS_OPTIONS: ProjectStatus[] = ['Live', 'In Development', 'Planned'];

export default function ContentSchemaPage() {
  const { content, updateContent, resetContent, hasDraft } = useSite();
  const [savedNotice, setSavedNotice] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  const handleProjectStatusChange = (id: string, status: ProjectStatus) => {
    const next = {
      ...content,
      projects: content.projects.map((p) => (p.id === id ? { ...p, status } : p)),
    };
    updateContent(next);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleProjectUrlChange = (id: string, url: string) => {
    const cleaned = url.trim();
    const next = {
      ...content,
      projects: content.projects.map((p) =>
        p.id === id ? { ...p, websiteUrl: cleaned === '' ? null : cleaned } : p,
      ),
    };
    updateContent(next);
  };

  const handleEmailChange = (email: string) => {
    const next = {
      ...content,
      contact: {
        ...content.contact,
        email,
        emailIsPlaceholder: email.includes('.example'),
      },
    };
    updateContent(next);
  };

  const handleSocialUrlChange = (id: string, url: string) => {
    const cleaned = url.trim();
    const next = {
      ...content,
      contact: {
        ...content.contact,
        socialLinks: content.contact.socialLinks.map((s) =>
          s.id === id ? { ...s, url: cleaned === '' ? null : cleaned } : s,
        ),
      },
    };
    updateContent(next);
  };

  const handleAboutSectionChange = (id: string, value: string) => {
    const next = {
      ...content,
      aboutSections: content.aboutSections.map((sec) =>
        sec.id === id ? { ...sec, content: value, isPlaceholder: false } : sec,
      ),
    };
    updateContent(next);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <>
      <SeoHead
        title="Content Schema & Cloudflare D1 Architecture | MD ROBIN MIA"
        description="Local content preview editor and Cloudflare Workers + D1 schema blueprint for MD ROBIN MIA."
        canonicalPath="/content-schema"
        noIndex
      />

      <Section surface="white">
        <Container>
          <p className="type-label font-mono-tabular uppercase text-[#707070] dark:text-[#A3A3A3]">
            Content Architecture
          </p>
          <h1 className="type-section mt-3 text-[#000000] dark:text-white">
            Content Schema &amp; Local Draft Preview
          </h1>

          <div className="mt-8 rounded-[8px] border border-[#111111] bg-[#F8F8F8] p-6 text-sm text-[#111111] dark:border-white dark:bg-[#111111] dark:text-white">
            <p className="font-semibold">
              Important Notice: Unauthenticated Local Browser Preview (Not a Secured Admin Panel)
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#707070] dark:text-[#A3A3A3]">
              Per security best practices, no password or secret key is stored in frontend code,
              and client-side previews are not claimed as authenticated security. Edits made here
              save only to your local browser (<code className="font-mono-tabular">localStorage</code>)
              so you can preview content updates before deploying a protected Cloudflare Workers +
              Cloudflare Access + D1 backend.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" variant="primary" onClick={handleCopyJson}>
              {jsonCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>JSON Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Export Content JSON</span>
                </>
              )}
            </Button>

            {hasDraft && (
              <Button type="button" variant="secondary" onClick={resetContent}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Local Draft to Defaults</span>
              </Button>
            )}

            {savedNotice && (
              <span className="text-xs font-medium text-[#111111] dark:text-white">
                Updated in local browser preview.
              </span>
            )}
          </div>
        </Container>
      </Section>

      <Section surface="muted">
        <Container className="space-y-8">
          <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
            <h2 className="type-subheading text-[#111111] dark:text-white">
              Projects — Status &amp; Optional URLs
            </h2>
            <p className="mt-1 text-xs text-[#707070] dark:text-[#A3A3A3]">
              Toggle project statuses between Live, In Development, and Planned, or attach live
              URLs when ready.
            </p>

            <div className="mt-6 space-y-4">
              {content.projects.map((project) => (
                <div
                  key={project.id}
                  className="grid grid-cols-1 gap-4 rounded-[8px] border border-[#EAEAEA] p-4 md:grid-cols-12 md:items-center dark:border-[#222222]"
                >
                  <div className="md:col-span-4">
                    <p className="text-sm font-semibold text-[#111111] dark:text-white">
                      {project.name}
                    </p>
                    <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">
                      {project.shortDescription}
                    </p>
                  </div>

                  <div className="md:col-span-3">
                    <label htmlFor={`status-${project.id}`} className="sr-only">
                      Status for {project.name}
                    </label>
                    <select
                      id={`status-${project.id}`}
                      value={project.status}
                      onChange={(e) =>
                        handleProjectStatusChange(project.id, e.target.value as ProjectStatus)
                      }
                      className="min-h-[40px] w-full rounded-[4px] border border-[#EAEAEA] bg-white px-3 text-xs font-medium text-[#111111] dark:border-[#222222] dark:bg-[#161616] dark:text-white"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-5">
                    <label htmlFor={`url-${project.id}`} className="sr-only">
                      Website URL for {project.name}
                    </label>
                    <input
                      id={`url-${project.id}`}
                      type="url"
                      value={project.websiteUrl ?? ''}
                      onChange={(e) => handleProjectUrlChange(project.id, e.target.value)}
                      placeholder="https://... (leave blank if not published)"
                      className="min-h-[40px] w-full rounded-[4px] border border-[#EAEAEA] bg-white px-3 text-xs text-[#111111] placeholder-[#707070] dark:border-[#222222] dark:bg-[#161616] dark:text-white dark:placeholder-[#8E8E8E]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
            <h2 className="type-subheading text-[#111111] dark:text-white">
              Contact Email &amp; Social Media Links
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="schema-email"
                  className="type-label block uppercase text-[#707070] dark:text-[#A3A3A3]"
                >
                  Contact Email
                </label>
                <input
                  id="schema-email"
                  type="email"
                  value={content.contact.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="mt-1.5 min-h-[40px] w-full rounded-[4px] border border-[#EAEAEA] bg-white px-3 text-xs text-[#111111] dark:border-[#222222] dark:bg-[#161616] dark:text-white"
                />
              </div>

              {content.contact.socialLinks
                .filter((s) => s.platform !== 'Email')
                .map((social) => (
                  <div key={social.id}>
                    <label
                      htmlFor={`schema-social-${social.id}`}
                      className="type-label block uppercase text-[#707070] dark:text-[#A3A3A3]"
                    >
                      {social.platform} URL
                    </label>
                    <input
                      id={`schema-social-${social.id}`}
                      type="url"
                      value={social.url ?? ''}
                      onChange={(e) => handleSocialUrlChange(social.id, e.target.value)}
                      placeholder={`https://... (${social.platform} URL)`}
                      className="mt-1.5 min-h-[40px] w-full rounded-[4px] border border-[#EAEAEA] bg-white px-3 text-xs text-[#111111] placeholder-[#707070] dark:border-[#222222] dark:bg-[#161616] dark:text-white dark:placeholder-[#8E8E8E]"
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
            <h2 className="type-subheading text-[#111111] dark:text-white">
              Hero Availability &amp; About Me Sections
            </h2>
            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="schema-availability"
                  className="type-label block uppercase text-[#707070] dark:text-[#A3A3A3]"
                >
                  Hero Availability / Status Label
                </label>
                <input
                  id="schema-availability"
                  type="text"
                  value={content.identity.availabilityLabel}
                  onChange={(e) =>
                    updateContent({
                      ...content,
                      identity: { ...content.identity, availabilityLabel: e.target.value },
                    })
                  }
                  className="mt-1.5 min-h-[40px] w-full rounded-[4px] border border-[#EAEAEA] bg-white px-3 text-xs text-[#111111] dark:border-[#222222] dark:bg-[#161616] dark:text-white"
                />
              </div>

              {content.aboutSections.map((sec) => (
                <div key={sec.id}>
                  <label
                    htmlFor={`schema-about-${sec.id}`}
                    className="type-label block uppercase text-[#707070] dark:text-[#A3A3A3]"
                  >
                    {sec.title}
                  </label>
                  <textarea
                    id={`schema-about-${sec.id}`}
                    rows={2}
                    value={sec.content}
                    onChange={(e) => handleAboutSectionChange(sec.id, e.target.value)}
                    className="mt-1.5 w-full rounded-[4px] border border-[#EAEAEA] bg-white p-3 text-xs text-[#111111] dark:border-[#222222] dark:bg-[#161616] dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
            <h2 className="type-subheading text-[#111111] dark:text-white">
              Cloudflare Workers &amp; D1 Database Blueprint
            </h2>
            <p className="mt-1 text-xs text-[#707070] dark:text-[#A3A3A3]">
              Ready-to-migrate SQL schema matching the TypeScript interfaces in{' '}
              <code className="font-mono-tabular">src/types/content.ts</code>.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-[8px] border border-[#EAEAEA] bg-[#F8F8F8] p-4 font-mono-tabular text-xs leading-relaxed text-[#111111] dark:border-[#222222] dark:bg-[#161616] dark:text-[#E5E5E5]">
              <code>{CLOUDFLARE_D1_SCHEMA_SQL}</code>
            </pre>
          </div>
        </Container>
      </Section>
    </>
  );
}
