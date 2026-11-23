import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import type {
  BlogLanguage,
  BlogPublicationStatus,
  MediaItem,
  ProjectGalleryImage,
  ProjectStatus,
  PublicationStatus,
} from '../../../types/content';
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_INPUT_CLASS,
  ADMIN_TEXTAREA_CLASS,
  AdminField,
  AdminNotice,
  AdminPanelCard,
  ConfirmModal,
} from '../components/AdminPrimitives';
import type { AdminSectionProps } from '../types';

/* -------------------------------------------------------------------------- */
/* SHARED INLINE MEDIA PICKER HELPER                                          */
/* -------------------------------------------------------------------------- */
function MediaUrlSelector({
  value,
  onSelect,
  mediaItems,
}: {
  value: string;
  onSelect: (url: string) => void;
  mediaItems: MediaItem[];
}) {
  if (!mediaItems.length) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[#707070] dark:text-[#A3A3A3]" aria-hidden="true" />
      <select
        aria-label="Choose from Media Library"
        value={mediaItems.some((m) => m.publicUrl === value) ? value : ''}
        onChange={(e) => {
          if (e.target.value) onSelect(e.target.value);
        }}
        className="min-h-[36px] w-full rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] px-2.5 py-1 text-xs text-[#111111] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-white"
      >
        <option value="">Select from Media Library ({mediaItems.length} assets)...</option>
        {mediaItems.map((m) => (
          <option key={m.id} value={m.publicUrl}>
            {m.fileName} ({m.storageProvider})
          </option>
        ))}
      </select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. PROJECTS & CASE STUDIES MANAGER                                         */
/* -------------------------------------------------------------------------- */
interface AdminProjectRow {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  overview: string;
  caseStudyMarkdown: string;
  category: string;
  projectStatus: ProjectStatus;
  websiteUrl: string | null;
  repoUrl: string | null;
  urlPlaceholderNote: string;
  highlights: string[];
  techStack: string[];
  developmentProgress: string;
  coverImageUrl: string | null;
  featured: boolean;
  status: PublicationStatus;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  gallery: ProjectGalleryImage[];
}

export function ProjectsSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<AdminProjectRow[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PublicationStatus>('all');
  const [selected, setSelected] = useState<Partial<AdminProjectRow> | null>(null);
  const [highlightsText, setHighlightsText] = useState('');
  const [techStackText, setTechStackText] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryAlt, setNewGalleryAlt] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProjectRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, medRes] = await Promise.all([
        apiClient.getAdminList<AdminProjectRow>('projects'),
        apiClient.getMedia().catch(() => ({ ok: true as const, r2Configured: false, items: [] })),
      ]);
      setItems(projRes.items);
      setMediaItems(medRes.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load projects.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (proj: Partial<AdminProjectRow>) => {
    setPreviewMode(false);
    setSelected({ ...proj });
    setHighlightsText((proj.highlights || []).join('\n'));
    setTechStackText((proj.techStack || []).join(', '));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    const payload = {
      ...selected,
      highlights: highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      techStack: techStackText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (selected.id) {
        await apiClient.updateAdminItem('projects', selected.id, payload);
      } else {
        await apiClient.createAdminItem('projects', payload);
      }
      setDirty(false);
      setSelected(null);
      setMsg({ type: 'success', text: 'Project saved.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save project.' });
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    setItems(reordered);
    try {
      await apiClient.reorderAdminItems(
        'projects',
        reordered.map((p) => p.id),
      );
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Reorder failed.' });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await apiClient.duplicateAdminItem('projects', id);
      setMsg({ type: 'success', text: 'Project duplicated as draft.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Duplicate failed.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiClient.deleteAdminItem('projects', deleteTarget.id);
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
        setDirty(false);
      }
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Project deleted.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddGalleryImage = async () => {
    if (!selected?.id || !newGalleryUrl.trim()) return;
    setSaving(true);
    try {
      const res = await apiClient.addProjectImage(selected.id, {
        imageUrl: newGalleryUrl.trim(),
        altText: newGalleryAlt.trim(),
        caption: newGalleryCaption.trim(),
      });
      const updatedGallery: ProjectGalleryImage[] = [
        ...(selected.gallery || []),
        {
          id: res.id,
          imageUrl: newGalleryUrl.trim(),
          altText: newGalleryAlt.trim(),
          caption: newGalleryCaption.trim(),
        },
      ];
      setSelected({ ...selected, gallery: updatedGallery });
      setNewGalleryUrl('');
      setNewGalleryAlt('');
      setNewGalleryCaption('');
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to attach image.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGalleryImage = async (imageId: string) => {
    if (!selected?.id) return;
    setSaving(true);
    try {
      await apiClient.deleteProjectImage(selected.id, imageId);
      setSelected({
        ...selected,
        gallery: (selected.gallery || []).filter((g) => g.id !== imageId),
      });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to remove gallery image.' });
    } finally {
      setSaving(false);
    }
  };

  const visibleItems = items.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = filterQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Projects & Case Studies"
        description="Manage portfolio experiments, development stages, case-study Markdown, screenshots, and SEO metadata."
        actions={
          <button
            type="button"
            onClick={() =>
              openEditor({
                name: '',
                slug: '',
                shortDescription: '',
                overview: '',
                caseStudyMarkdown: '',
                category: 'Web Tool',
                projectStatus: 'In Development',
                websiteUrl: '',
                repoUrl: '',
                urlPlaceholderNote: 'Website link will be published once this project launches.',
                highlights: [],
                techStack: ['To be finalized'],
                developmentProgress: 'Early scoping stage',
                coverImageUrl: '',
                featured: false,
                status: 'draft',
                seoTitle: '',
                seoDescription: '',
                sortOrder: items.length + 1,
                gallery: [],
              })
            }
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Project</span>
          </button>
        }
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search projects..."
            className={`${ADMIN_INPUT_CLASS} mt-0 flex-1`}
          />
          <select
            aria-label="Filter by publication status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | PublicationStatus)}
            className={`${ADMIN_INPUT_CLASS} mt-0 sm:w-44`}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F8F8F8] dark:bg-[#161616]" />
        ) : !visibleItems.length ? (
          <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">No matching projects found.</p>
        ) : (
          <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {visibleItems.map((proj) => {
              const globalIdx = items.findIndex((i) => i.id === proj.id);
              return (
                <div
                  key={proj.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#000000] dark:text-white">
                        {proj.name}
                      </span>
                      <span className="font-mono-tabular text-xs text-[#707070] dark:text-[#A3A3A3]">
                        /projects/{proj.slug}
                      </span>
                      <span className="font-mono-tabular text-[11px] uppercase text-[#707070] dark:text-[#A3A3A3]">
                        · {proj.projectStatus} · {proj.status}
                        {proj.featured ? ' · Featured' : ''}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-[#707070] dark:text-[#A3A3A3]">
                      {proj.shortDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={globalIdx <= 0}
                      onClick={() => void handleMove(globalIdx, -1)}
                      className={ADMIN_BTN_SECONDARY}
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={globalIdx >= items.length - 1}
                      onClick={() => void handleMove(globalIdx, 1)}
                      className={ADMIN_BTN_SECONDARY}
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditor(proj)}
                      className={ADMIN_BTN_SECONDARY}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDuplicate(proj.id)}
                      className={ADMIN_BTN_SECONDARY}
                      title="Duplicate as draft"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(proj)}
                      className={ADMIN_BTN_DANGER}
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminPanelCard>

      {selected && (
        <AdminPanelCard
          title={selected.id ? `Edit Project: ${selected.name}` : 'Create New Project'}
          actions={
            <>
              <button
                type="button"
                onClick={() => setPreviewMode((p) => !p)}
                className={ADMIN_BTN_SECONDARY}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{previewMode ? 'Back to Editor' : 'Preview Case Study'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setDirty(false);
                }}
                className={ADMIN_BTN_SECONDARY}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Close</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className={ADMIN_BTN_PRIMARY}
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save Project'}</span>
              </button>
            </>
          }
        >
          {previewMode ? (
            <div className="rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] p-6 dark:border-[#222222] dark:bg-[#0A0A0A]">
              <h3 className="type-subheading text-[#000000] dark:text-white">{selected.name}</h3>
              <p className="mt-2 text-sm text-[#707070] dark:text-[#A3A3A3]">
                {selected.overview}
              </p>
              <div className="mt-6 border-t border-[#EAEAEA] pt-6 dark:border-[#222222]">
                <MarkdownRenderer markdown={selected.caseStudyMarkdown || ''} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AdminField label="Project Name">
                  <input
                    type="text"
                    value={selected.name || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, name: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="URL Slug" hint="Served at /projects/your-slug">
                  <input
                    type="text"
                    value={selected.slug || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, slug: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="Category">
                  <input
                    type="text"
                    value={selected.category || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, category: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="Project Lifecycle Status">
                  <select
                    value={selected.projectStatus || 'Concept'}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, projectStatus: e.target.value as ProjectStatus });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  >
                    <option value="Live">Live</option>
                    <option value="In Development">In Development</option>
                    <option value="Concept">Concept</option>
                    <option value="Planned">Planned</option>
                  </select>
                </AdminField>

                <AdminField label="Publication Visibility">
                  <select
                    value={selected.status || 'draft'}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, status: e.target.value as PublicationStatus });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </AdminField>

                <div className="flex items-end pb-2">
                  <label className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[#111111] dark:text-white">
                    <input
                      type="checkbox"
                      checked={Boolean(selected.featured)}
                      onChange={(e) => {
                        setDirty(true);
                        setSelected({ ...selected, featured: e.target.checked });
                      }}
                    />
                    <span>Feature this project on Homepage</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <AdminField label="Short Tagline (One Line)">
                    <input
                      type="text"
                      value={selected.shortDescription || ''}
                      onChange={(e) => {
                        setDirty(true);
                        setSelected({ ...selected, shortDescription: e.target.value });
                      }}
                      className={ADMIN_INPUT_CLASS}
                    />
                  </AdminField>
                </div>

                <div className="sm:col-span-2">
                  <AdminField label="Overview Summary">
                    <textarea
                      rows={3}
                      value={selected.overview || ''}
                      onChange={(e) => {
                        setDirty(true);
                        setSelected({ ...selected, overview: e.target.value });
                      }}
                      className={ADMIN_TEXTAREA_CLASS}
                    />
                  </AdminField>
                </div>

                <div className="sm:col-span-2">
                  <AdminField label="Detailed Case Study (Markdown)">
                    <textarea
                      rows={7}
                      value={selected.caseStudyMarkdown || ''}
                      onChange={(e) => {
                        setDirty(true);
                        setSelected({ ...selected, caseStudyMarkdown: e.target.value });
                      }}
                      className={`${ADMIN_TEXTAREA_CLASS} font-mono-tabular`}
                      placeholder="## Problem & Context&#10;&#10;Explain what this project explores..."
                    />
                  </AdminField>
                </div>

                <AdminField label="Live Website URL (Optional)">
                  <input
                    type="url"
                    value={selected.websiteUrl || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, websiteUrl: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                    placeholder="https://..."
                  />
                </AdminField>

                <AdminField label="Repository URL (Optional)">
                  <input
                    type="url"
                    value={selected.repoUrl || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, repoUrl: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                    placeholder="https://github.com/..."
                  />
                </AdminField>

                <AdminField label="Development Progress Note">
                  <input
                    type="text"
                    value={selected.developmentProgress || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, developmentProgress: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="URL Placeholder Note (if unlaunched)">
                  <input
                    type="text"
                    value={selected.urlPlaceholderNote || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, urlPlaceholderNote: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="Key Highlights (one per line)">
                  <textarea
                    rows={4}
                    value={highlightsText}
                    onChange={(e) => {
                      setDirty(true);
                      setHighlightsText(e.target.value);
                    }}
                    className={ADMIN_TEXTAREA_CLASS}
                  />
                </AdminField>

                <AdminField label="Technology Stack (comma-separated)">
                  <textarea
                    rows={4}
                    value={techStackText}
                    onChange={(e) => {
                      setDirty(true);
                      setTechStackText(e.target.value);
                    }}
                    className={ADMIN_TEXTAREA_CLASS}
                  />
                </AdminField>

                <div className="sm:col-span-2">
                  <AdminField label="Cover Image URL (Optional)">
                    <input
                      type="text"
                      value={selected.coverImageUrl || ''}
                      onChange={(e) => {
                        setDirty(true);
                        setSelected({ ...selected, coverImageUrl: e.target.value });
                      }}
                      className={ADMIN_INPUT_CLASS}
                      placeholder="https://... or /api/v1/media/file/..."
                    />
                    <MediaUrlSelector
                      value={selected.coverImageUrl || ''}
                      mediaItems={mediaItems}
                      onSelect={(url) => {
                        setDirty(true);
                        setSelected({ ...selected, coverImageUrl: url });
                      }}
                    />
                  </AdminField>
                </div>

                <AdminField label="SEO Title">
                  <input
                    type="text"
                    value={selected.seoTitle || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, seoTitle: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="SEO Description">
                  <input
                    type="text"
                    value={selected.seoDescription || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, seoDescription: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>
              </div>

              {selected.id && (
                <div className="border-t border-[#EAEAEA] pt-6 dark:border-[#222222]">
                  <h3 className="text-xs font-semibold tracking-[0.1em] text-[#111111] uppercase dark:text-white">
                    Case Study Gallery Screenshots
                  </h3>
                  <p className="mt-1 text-xs text-[#707070] dark:text-[#A3A3A3]">
                    Attach verified screenshots or mockups displayed on `/projects/{selected.slug}`.
                  </p>

                  {selected.gallery && selected.gallery.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selected.gallery.map((img) => (
                        <div
                          key={img.id}
                          className="flex items-start justify-between gap-3 rounded-[6px] border border-[#EAEAEA] p-3 dark:border-[#222222]"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-mono-tabular text-xs font-medium text-[#111111] dark:text-white">
                              {img.imageUrl}
                            </p>
                            {img.caption && (
                              <p className="mt-1 text-xs text-[#707070] dark:text-[#A3A3A3]">
                                {img.caption}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleRemoveGalleryImage(img.id)}
                            className={ADMIN_BTN_DANGER}
                            title="Remove screenshot"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] p-4 sm:grid-cols-3 dark:border-[#222222] dark:bg-[#0A0A0A]">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={newGalleryUrl}
                        onChange={(e) => setNewGalleryUrl(e.target.value)}
                        placeholder="Image URL (https://... or /api/v1/media/file/...)"
                        className={`${ADMIN_INPUT_CLASS} mt-0`}
                      />
                      <MediaUrlSelector
                        value={newGalleryUrl}
                        mediaItems={mediaItems}
                        onSelect={setNewGalleryUrl}
                      />
                    </div>
                    <input
                      type="text"
                      value={newGalleryAlt}
                      onChange={(e) => setNewGalleryAlt(e.target.value)}
                      placeholder="Descriptive alt text"
                      className={`${ADMIN_INPUT_CLASS} mt-0`}
                    />
                    <input
                      type="text"
                      value={newGalleryCaption}
                      onChange={(e) => setNewGalleryCaption(e.target.value)}
                      placeholder="Caption (optional)"
                      className={`${ADMIN_INPUT_CLASS} mt-0`}
                    />
                    <button
                      type="button"
                      disabled={saving || !newGalleryUrl.trim()}
                      onClick={() => void handleAddGalleryImage()}
                      className={ADMIN_BTN_PRIMARY}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Attach Image</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </AdminPanelCard>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Project?"
        description={`Permanently delete "${deleteTarget?.name}" and its gallery images?`}
        confirmLabel="Delete Project"
        danger
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. BILINGUAL MARKDOWN BLOG MANAGER                                         */
/* -------------------------------------------------------------------------- */
interface AdminBlogRow {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  excerpt: string;
  excerptBn: string;
  contentMarkdown: string;
  contentMarkdownBn: string;
  language: BlogLanguage;
  category: string;
  coverImageUrl: string | null;
  readingTimeMinutes: number;
  featured: boolean;
  isSample: boolean;
  status: BlogPublicationStatus;
  publishDate: string;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  tags: Array<{ id: string; slug: string; name: string }>;
}

export function BlogSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<AdminBlogRow[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPublicationStatus>('all');
  const [selected, setSelected] = useState<Partial<AdminBlogRow> | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBlogRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [blogRes, catRes, medRes] = await Promise.all([
        apiClient.getAdminList<AdminBlogRow>('blog'),
        apiClient.getCategoriesAndTags(),
        apiClient.getMedia().catch(() => ({ ok: true as const, r2Configured: false, items: [] })),
      ]);
      setItems(blogRes.items);
      setCategories(catRes.categories as Array<{ id: string; name: string }>);
      setMediaItems(medRes.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load blog posts.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (post: Partial<AdminBlogRow>) => {
    setPreviewMode(false);
    setSelected({ ...post });
    setTagsInput((post.tags || []).map((t) => t.name).join(', '));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    const payload = {
      ...selected,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (selected.id) {
        await apiClient.updateAdminItem('blog', selected.id, payload);
      } else {
        await apiClient.createAdminItem('blog', payload);
      }
      setDirty(false);
      setSelected(null);
      setMsg({ type: 'success', text: 'Blog article saved.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save article.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await apiClient.duplicateAdminItem('blog', id);
      setMsg({ type: 'success', text: 'Article duplicated as draft.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Duplicate failed.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiClient.deleteAdminItem('blog', deleteTarget.id);
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
        setDirty(false);
      }
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Article deleted.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  const visible = items.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.titleBn || '').toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Blog & Journal Articles"
        description="Write English, Bengali, or Bilingual Markdown essays, manage scheduling, categories, tags, and featured status."
        actions={
          <button
            type="button"
            onClick={() =>
              openEditor({
                title: '',
                titleBn: '',
                slug: '',
                excerpt: '',
                excerptBn: '',
                contentMarkdown: '',
                contentMarkdownBn: '',
                language: 'en',
                category: categories[0]?.name || 'Technology',
                coverImageUrl: '',
                featured: false,
                status: 'draft',
                publishDate: new Date().toISOString().slice(0, 10),
                seoTitle: '',
                seoDescription: '',
                tags: [],
              })
            }
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Article</span>
          </button>
        }
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className={`${ADMIN_INPUT_CLASS} mt-0 flex-1`}
          />
          <select
            aria-label="Filter articles by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | BlogPublicationStatus)}
            className={`${ADMIN_INPUT_CLASS} mt-0 sm:w-44`}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F8F8F8] dark:bg-[#161616]" />
        ) : !visible.length ? (
          <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">No matching articles found.</p>
        ) : (
          <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {visible.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#000000] dark:text-white">
                      {post.title}
                    </span>
                    <span className="font-mono-tabular text-[11px] uppercase text-[#707070] dark:text-[#A3A3A3]">
                      · {post.category} · {post.language} · {post.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono-tabular text-xs text-[#707070] dark:text-[#A3A3A3]">
                    {post.publishDate} · /blog/{post.slug}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditor(post)}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDuplicate(post.id)}
                    className={ADMIN_BTN_SECONDARY}
                    title="Duplicate as draft"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(post)}
                    className={ADMIN_BTN_DANGER}
                    title="Delete article"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      {selected && (
        <AdminPanelCard
          title={selected.id ? `Edit Article: ${selected.title}` : 'Write New Article'}
          actions={
            <>
              <button
                type="button"
                onClick={() => setPreviewMode((p) => !p)}
                className={ADMIN_BTN_SECONDARY}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{previewMode ? 'Back to Editor' : 'Preview Article'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setDirty(false);
                }}
                className={ADMIN_BTN_SECONDARY}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Close</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className={ADMIN_BTN_PRIMARY}
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save Article'}</span>
              </button>
            </>
          }
        >
          {previewMode ? (
            <div className="space-y-6 rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] p-6 dark:border-[#222222] dark:bg-[#0A0A0A]">
              <div>
                <h3 className="type-subheading text-[#000000] dark:text-white">{selected.title}</h3>
                {selected.titleBn && (
                  <p className="mt-1 text-lg font-medium text-[#707070] dark:text-[#A3A3A3]">
                    {selected.titleBn}
                  </p>
                )}
              </div>
              {selected.contentMarkdown && (
                <div className="border-t border-[#EAEAEA] pt-5 dark:border-[#222222]">
                  <MarkdownRenderer markdown={selected.contentMarkdown} />
                </div>
              )}
              {selected.contentMarkdownBn && (
                <div className="border-t border-[#EAEAEA] pt-5 dark:border-[#222222]">
                  <MarkdownRenderer markdown={selected.contentMarkdownBn} />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AdminField label="Article Title (English)">
                <input
                  type="text"
                  value={selected.title || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, title: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <AdminField label="Article Slug" hint="Served at /blog/your-slug">
                <input
                  type="text"
                  value={selected.slug || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, slug: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <AdminField label="Category">
                <select
                  value={selected.category || 'Technology'}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, category: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </AdminField>

              <AdminField label="Language Mode">
                <select
                  value={selected.language || 'en'}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, language: e.target.value as BlogLanguage });
                  }}
                  className={ADMIN_INPUT_CLASS}
                >
                  <option value="en">English Only</option>
                  <option value="bn">Bengali Only</option>
                  <option value="bilingual">Bilingual (English + বাংলা)</option>
                </select>
              </AdminField>

              <AdminField label="Publication Status">
                <select
                  value={selected.status || 'draft'}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, status: e.target.value as BlogPublicationStatus });
                  }}
                  className={ADMIN_INPUT_CLASS}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </AdminField>

              <AdminField label="Publish Date (YYYY-MM-DD)">
                <input
                  type="date"
                  value={(selected.publishDate || '').slice(0, 10)}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, publishDate: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <div className="sm:col-span-2">
                <AdminField label="Summary Excerpt (English)">
                  <textarea
                    rows={2}
                    value={selected.excerpt || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, excerpt: e.target.value });
                    }}
                    className={ADMIN_TEXTAREA_CLASS}
                  />
                </AdminField>
              </div>

              <div className="sm:col-span-2">
                <AdminField label="Article Body Markdown (English)">
                  <textarea
                    rows={9}
                    value={selected.contentMarkdown || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, contentMarkdown: e.target.value });
                    }}
                    className={`${ADMIN_TEXTAREA_CLASS} font-mono-tabular`}
                    placeholder="## Heading&#10;&#10;Write your essay in clean Markdown..."
                  />
                </AdminField>
              </div>

              {(selected.language === 'bn' || selected.language === 'bilingual') && (
                <>
                  <AdminField label="Bengali Title (বাংলা শিরোনাম)">
                    <input
                      type="text"
                      value={selected.titleBn || ''}
                      onChange={(e) => {
                        setDirty(true);
                        setSelected({ ...selected, titleBn: e.target.value });
                      }}
                      className={ADMIN_INPUT_CLASS}
                    />
                  </AdminField>

                  <AdminField label="Bengali Excerpt (সংক্ষিপ্ত বিবরণ)">
                    <input
                      type="text"
                      value={selected.excerptBn || ''}
                      onChange={(e) => {
                        setDirty(true);
                        setSelected({ ...selected, excerptBn: e.target.value });
                      }}
                      className={ADMIN_INPUT_CLASS}
                    />
                  </AdminField>

                  <div className="sm:col-span-2">
                    <AdminField label="Bengali Article Markdown (বাংলা মূল লেখা)">
                      <textarea
                        rows={8}
                        value={selected.contentMarkdownBn || ''}
                        onChange={(e) => {
                          setDirty(true);
                          setSelected({ ...selected, contentMarkdownBn: e.target.value });
                        }}
                        className={ADMIN_TEXTAREA_CLASS}
                      />
                    </AdminField>
                  </div>
                </>
              )}

              <AdminField label="Tags (comma-separated)">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => {
                    setDirty(true);
                    setTagsInput(e.target.value);
                  }}
                  placeholder="web, cloudflare, learning"
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <div className="flex flex-wrap items-center gap-6 pt-5">
                <label className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[#111111] dark:text-white">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.featured)}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, featured: e.target.checked });
                    }}
                  />
                  <span>Featured Article</span>
                </label>

                <label className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[#111111] dark:text-white">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.isSample)}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, isSample: e.target.checked });
                    }}
                  />
                  <span>Mark as Intro/Sample</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <AdminField label="Cover Image URL (Optional)">
                  <input
                    type="text"
                    value={selected.coverImageUrl || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, coverImageUrl: e.target.value });
                    }}
                    className={ADMIN_INPUT_CLASS}
                    placeholder="https://... or /api/v1/media/file/..."
                  />
                  <MediaUrlSelector
                    value={selected.coverImageUrl || ''}
                    mediaItems={mediaItems}
                    onSelect={(url) => {
                      setDirty(true);
                      setSelected({ ...selected, coverImageUrl: url });
                    }}
                  />
                </AdminField>
              </div>

              <AdminField label="SEO Title">
                <input
                  type="text"
                  value={selected.seoTitle || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, seoTitle: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <AdminField label="SEO Description">
                <input
                  type="text"
                  value={selected.seoDescription || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, seoDescription: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>
            </div>
          )}
        </AdminPanelCard>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Article?"
        description={`Permanently delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete Article"
        danger
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. BLOG CATEGORIES & TAGS MANAGER                                          */
/* -------------------------------------------------------------------------- */
interface CatRow {
  id: string;
  slug: string;
  name: string;
  nameBn?: string;
  description?: string;
  sortOrder: number;
}

export function CategoriesSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [categories, setCategories] = useState<CatRow[]>([]);
  const [tags, setTags] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [editing, setEditing] = useState<Partial<CatRow> | null>(null);
  const [deleteCat, setDeleteCat] = useState<CatRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getCategoriesAndTags();
      setCategories(res.categories as unknown as CatRow[]);
      setTags(res.tags);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load categories.' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await apiClient.updateAdminItem('categories', editing.id, editing);
      } else {
        await apiClient.createAdminItem('categories', editing);
      }
      setEditing(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'Category saved.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCat = async () => {
    if (!deleteCat) return;
    setSaving(true);
    try {
      await apiClient.deleteAdminItem('categories', deleteCat.id);
      setDeleteCat(null);
      setMsg({ type: 'success', text: 'Category deleted.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await apiClient.deleteAdminItem('tags', tagId);
      setMsg({ type: 'success', text: 'Tag removed.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete tag.' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Blog Categories"
        description="Categories power /blog/category/:slug archive pages and sitemap entries."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({ name: '', nameBn: '', slug: '', description: '', sortOrder: categories.length + 1 })
            }
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Category</span>
          </button>
        }
      >
        <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#000000] dark:text-white">
                  {cat.name}{' '}
                  {cat.nameBn && <span className="font-normal text-[#707070] dark:text-[#A3A3A3]">({cat.nameBn})</span>}
                </p>
                <p className="font-mono-tabular mt-0.5 text-xs text-[#707070] dark:text-[#A3A3A3]">
                  /blog/category/{cat.slug}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => setEditing({ ...cat })} className={ADMIN_BTN_SECONDARY}>
                  Edit
                </button>
                <button type="button" onClick={() => setDeleteCat(cat)} className={ADMIN_BTN_DANGER}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminPanelCard>

      {editing && (
        <AdminPanelCard
          title={editing.id ? `Edit Category: ${editing.name}` : 'New Category'}
          actions={
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Category</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Name (English)">
              <input
                type="text"
                value={editing.name || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, name: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Bengali Name (Optional)">
              <input
                type="text"
                value={editing.nameBn || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, nameBn: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            {!editing.id && (
              <AdminField label="Slug">
                <input
                  type="text"
                  value={editing.slug || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setEditing({ ...editing, slug: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>
            )}
            <div className="sm:col-span-2">
              <AdminField label="Description">
                <textarea
                  rows={2}
                  value={editing.description || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setEditing({ ...editing, description: e.target.value });
                  }}
                  className={ADMIN_TEXTAREA_CLASS}
                />
              </AdminField>
            </div>
          </div>
        </AdminPanelCard>
      )}

      <AdminPanelCard title="Article Tags" description="Tags created inside articles appear here for cleanup.">
        {!tags.length ? (
          <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">No tags created yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <div
                key={t.id}
                className="inline-flex items-center gap-2 rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] px-3 py-1.5 text-xs text-[#111111] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-white"
              >
                <span>#{t.name}</span>
                <button
                  type="button"
                  onClick={() => void handleDeleteTag(t.id)}
                  aria-label={`Remove tag ${t.name}`}
                  className="text-[#707070] hover:text-[#DC2626]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      <ConfirmModal
        open={Boolean(deleteCat)}
        title="Delete Category?"
        description={`Delete "${deleteCat?.name}"? Existing articles keep their text category label.`}
        confirmLabel="Delete Category"
        danger
        busy={saving}
        onCancel={() => setDeleteCat(null)}
        onConfirm={() => void handleDeleteCat()}
      />
    </div>
  );
}
