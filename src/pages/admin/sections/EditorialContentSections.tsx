import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Eye, Plus, Save, Trash2 } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import type { PublicationStatus, SkillStage } from '../../../types/content';
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
/* 1. PAGES MANAGER                                                           */
/* -------------------------------------------------------------------------- */
interface PageRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  heroLabel: string;
  contentMarkdown: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  noIndex: boolean;
  status: PublicationStatus;
  isSystem: boolean;
  sortOrder: number;
}

export function PagesSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<PageRow[]>([]);
  const [selected, setSelected] = useState<Partial<PageRow> | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminList<PageRow>('pages');
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load pages.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    try {
      if (selected.id) {
        await apiClient.updateAdminItem('pages', selected.id, selected);
      } else {
        await apiClient.createAdminItem('pages', selected);
      }
      setDirty(false);
      setMsg({ type: 'success', text: 'Page saved.' });
      setSelected(null);
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save page.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await apiClient.duplicateAdminItem('pages', id);
      setMsg({ type: 'success', text: 'Page duplicated as draft.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Duplicate failed.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiClient.deleteAdminItem('pages', deleteTarget.id);
      setDeleteTarget(null);
      setSelected(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'Custom page deleted.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice
        type={msg?.type || 'info'}
        message={msg?.text || null}
        onDismiss={() => setMsg(null)}
      />

      <AdminPanelCard
        title="Pages Manager"
        description="Edit SEO metadata for core system pages or create new custom Markdown pages served at /p/:slug."
        actions={
          <button
            type="button"
            onClick={() => {
              setPreviewMode(false);
              setSelected({
                title: '',
                slug: '',
                heroLabel: 'Custom Page',
                subtitle: '',
                contentMarkdown: '',
                seoTitle: '',
                seoDescription: '',
                noIndex: false,
                status: 'draft',
                sortOrder: items.length + 1,
              });
            }}
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Custom Page</span>
          </button>
        }
      >
        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F8F8F8] dark:bg-[#161616]" />
        ) : (
          <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {items.map((pg) => (
              <div
                key={pg.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#000000] dark:text-white">
                      {pg.title}
                    </span>
                    <span className="font-mono-tabular text-xs text-[#707070] dark:text-[#A3A3A3]">
                      {pg.isSystem ? pg.canonicalPath || `/${pg.slug}` : `/p/${pg.slug}`}
                    </span>
                    <span className="font-mono-tabular text-[11px] uppercase text-[#707070] dark:text-[#A3A3A3]">
                      · {pg.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewMode(false);
                      setSelected({ ...pg });
                    }}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDuplicate(pg.id)}
                    className={ADMIN_BTN_SECONDARY}
                    title="Duplicate as draft"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  {!pg.isSystem && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(pg)}
                      className={ADMIN_BTN_DANGER}
                      title="Delete custom page"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      {selected && (
        <AdminPanelCard
          title={selected.id ? `Edit Page: ${selected.title}` : 'Create Custom Page'}
          actions={
            <>
              <button
                type="button"
                onClick={() => setPreviewMode((p) => !p)}
                className={ADMIN_BTN_SECONDARY}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{previewMode ? 'Back to Editor' : 'Preview Markdown'}</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className={ADMIN_BTN_PRIMARY}
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save Page'}</span>
              </button>
            </>
          }
        >
          {previewMode ? (
            <div className="rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] p-6 dark:border-[#222222] dark:bg-[#0A0A0A]">
              <h3 className="type-subheading text-[#000000] dark:text-white">{selected.title}</h3>
              <p className="mt-2 text-sm text-[#707070] dark:text-[#A3A3A3]">{selected.subtitle}</p>
              <div className="mt-6 border-t border-[#EAEAEA] pt-6 dark:border-[#222222]">
                <MarkdownRenderer markdown={selected.contentMarkdown || ''} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AdminField label="Page Title" htmlFor="pg-title">
                <input
                  id="pg-title"
                  type="text"
                  value={selected.title || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, title: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <AdminField
                label="Slug"
                htmlFor="pg-slug"
                hint={selected.isSystem ? 'System route slug is locked.' : 'Served at /p/your-slug'}
              >
                <input
                  id="pg-slug"
                  type="text"
                  disabled={Boolean(selected.isSystem)}
                  value={selected.slug || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, slug: e.target.value });
                  }}
                  className={`${ADMIN_INPUT_CLASS} disabled:opacity-60`}
                />
              </AdminField>

              <AdminField label="Hero Label" htmlFor="pg-label">
                <input
                  id="pg-label"
                  type="text"
                  value={selected.heroLabel || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, heroLabel: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <AdminField label="Publication Status" htmlFor="pg-status">
                <select
                  id="pg-status"
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

              <div className="sm:col-span-2">
                <AdminField label="Subtitle / Intro" htmlFor="pg-subtitle">
                  <textarea
                    id="pg-subtitle"
                    rows={2}
                    value={selected.subtitle || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, subtitle: e.target.value });
                    }}
                    className={ADMIN_TEXTAREA_CLASS}
                  />
                </AdminField>
              </div>

              <div className="sm:col-span-2">
                <AdminField label="Body Markdown (Custom Pages)" htmlFor="pg-md">
                  <textarea
                    id="pg-md"
                    rows={8}
                    value={selected.contentMarkdown || ''}
                    onChange={(e) => {
                      setDirty(true);
                      setSelected({ ...selected, contentMarkdown: e.target.value });
                    }}
                    className={`${ADMIN_TEXTAREA_CLASS} font-mono-tabular`}
                    placeholder="## Section Heading&#10;&#10;Write clean Markdown content..."
                  />
                </AdminField>
              </div>

              <AdminField label="SEO Title" htmlFor="pg-seo-title">
                <input
                  id="pg-seo-title"
                  type="text"
                  value={selected.seoTitle || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setSelected({ ...selected, seoTitle: e.target.value });
                  }}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <AdminField label="SEO Description" htmlFor="pg-seo-desc">
                <input
                  id="pg-seo-desc"
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
        title="Delete Custom Page?"
        description={`Permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Page"
        danger
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. HOMEPAGE SECTIONS                                                       */
/* -------------------------------------------------------------------------- */
interface HomepageRow {
  id: string;
  sectionKey: string;
  sectionNumber: string;
  title: string;
  subtitle: string;
  contentMarkdown: string;
  ctaLabel: string;
  ctaUrl: string;
  isVisible: boolean;
  sortOrder: number;
  status: PublicationStatus;
}

export function HomepageSectionsEditor({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<HomepageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiClient
      .getHomepageSections()
      .then((res) => setItems(res.items as unknown as HomepageRow[]))
      .catch((err) =>
        setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load.' }),
      )
      .finally(() => setLoading(false));
  }, []);

  const updateItem = (idx: number, patch: Partial<HomepageRow>) => {
    setDirty(true);
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.saveHomepageSections(items as unknown as Array<Record<string, unknown>>);
      setDirty(false);
      setMsg({ type: 'success', text: 'Homepage sections updated.' });
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice
        type={msg?.type || 'info'}
        message={msg?.text || null}
        onDismiss={() => setMsg(null)}
      />

      <AdminPanelCard
        title="Homepage Sections"
        description="Configure section titles, numbering, visibility, and CTA destinations on the landing page."
        actions={
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void handleSave()}
            className={ADMIN_BTN_PRIMARY}
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        }
      >
        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F8F8F8] dark:bg-[#161616]" />
        ) : (
          <div className="space-y-4">
            {items.map((sec, idx) => (
              <div
                key={sec.id}
                className="grid grid-cols-1 gap-4 rounded-[6px] border border-[#EAEAEA] p-4 sm:grid-cols-2 dark:border-[#222222]"
              >
                <div className="flex items-center justify-between sm:col-span-2">
                  <span className="font-mono-tabular text-xs font-semibold text-[#707070] uppercase dark:text-[#A3A3A3]">
                    Key: {sec.sectionKey}
                  </span>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-[#111111] dark:text-white">
                    <input
                      type="checkbox"
                      checked={sec.isVisible}
                      onChange={(e) => updateItem(idx, { isVisible: e.target.checked })}
                    />
                    <span>Visible on Homepage</span>
                  </label>
                </div>

                <AdminField label="Section Number">
                  <input
                    type="text"
                    value={sec.sectionNumber}
                    onChange={(e) => updateItem(idx, { sectionNumber: e.target.value })}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="Section Title">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => updateItem(idx, { title: e.target.value })}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="CTA Label">
                  <input
                    type="text"
                    value={sec.ctaLabel}
                    onChange={(e) => updateItem(idx, { ctaLabel: e.target.value })}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>

                <AdminField label="CTA Path / URL">
                  <input
                    type="text"
                    value={sec.ctaUrl}
                    onChange={(e) => updateItem(idx, { ctaUrl: e.target.value })}
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. ABOUT SECTIONS MANAGER                                                  */
/* -------------------------------------------------------------------------- */
interface AboutRow {
  id: string;
  title: string;
  content: string;
  status: PublicationStatus;
  sortOrder: number;
}

export function AboutSectionEditor({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [aboutIntro, setAboutIntro] = useState('');
  const [items, setItems] = useState<AboutRow[]>([]);
  const [editing, setEditing] = useState<Partial<AboutRow> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AboutRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [aboutRes, settingsRes] = await Promise.all([
        apiClient.getAdminList<AboutRow>('about'),
        apiClient.getSettings(),
      ]);
      setItems(aboutRes.items);
      setAboutIntro(String(settingsRes.settings.aboutIntro || ''));
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load About.' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveIntro = async () => {
    setSaving(true);
    try {
      await apiClient.saveSettings({ aboutIntro });
      setDirty(false);
      setMsg({ type: 'success', text: 'About intro updated.' });
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save intro.' });
    } finally {
      setSaving(false);
    }
  };

  const saveSection = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await apiClient.updateAdminItem('about', editing.id, editing);
      } else {
        await apiClient.createAdminItem('about', editing);
      }
      setEditing(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'About section saved.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiClient.deleteAdminItem('about', deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Section deleted.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice
        type={msg?.type || 'info'}
        message={msg?.text || null}
        onDismiss={() => setMsg(null)}
      />

      <AdminPanelCard
        title="About Page Introduction"
        actions={
          <button type="button" disabled={saving} onClick={() => void saveIntro()} className={ADMIN_BTN_PRIMARY}>
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Save Intro</span>
          </button>
        }
      >
        <AdminField label="Hero Introduction Statement" htmlFor="about-intro-input">
          <textarea
            id="about-intro-input"
            rows={3}
            value={aboutIntro}
            onChange={(e) => {
              setDirty(true);
              setAboutIntro(e.target.value);
            }}
            className={ADMIN_TEXTAREA_CLASS}
          />
        </AdminField>
      </AdminPanelCard>

      <AdminPanelCard
        title="About Narrative Sections"
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({ title: '', content: '', status: 'published', sortOrder: items.length + 1 })
            }
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Section</span>
          </button>
        }
      >
        <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
          {items.map((sec) => (
            <div key={sec.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#000000] dark:text-white">
                  {sec.title}{' '}
                  <span className="font-mono-tabular text-xs font-normal text-[#707070] dark:text-[#A3A3A3]">
                    · {sec.status}
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[#707070] dark:text-[#A3A3A3]">
                  {sec.content}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => setEditing({ ...sec })} className={ADMIN_BTN_SECONDARY}>
                  Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(sec)} className={ADMIN_BTN_DANGER}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminPanelCard>

      {editing && (
        <AdminPanelCard
          title={editing.id ? `Edit Section: ${editing.title}` : 'New About Section'}
          actions={
            <button type="button" disabled={saving} onClick={() => void saveSection()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Section</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Title">
              <input
                type="text"
                value={editing.title || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, title: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Status">
              <select
                value={editing.status || 'published'}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, status: e.target.value as PublicationStatus });
                }}
                className={ADMIN_INPUT_CLASS}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </AdminField>
            <div className="sm:col-span-2">
              <AdminField label="Content">
                <textarea
                  rows={4}
                  value={editing.content || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setEditing({ ...editing, content: e.target.value });
                  }}
                  className={ADMIN_TEXTAREA_CLASS}
                />
              </AdminField>
            </div>
          </div>
        </AdminPanelCard>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete About Section?"
        description={`Delete "${deleteTarget?.title}" permanently?`}
        confirmLabel="Delete"
        danger
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void deleteSection()}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. EDUCATION MANAGER                                                       */
/* -------------------------------------------------------------------------- */
interface EduRow {
  id: string;
  period: string;
  title: string;
  institution: string;
  location: string;
  summary: string;
  status: PublicationStatus;
  sortOrder: number;
}

export function EducationSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<EduRow[]>([]);
  const [editing, setEditing] = useState<Partial<EduRow> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EduRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getAdminList<EduRow>('education');
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load education.' });
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
        await apiClient.updateAdminItem('education', editing.id, editing);
      } else {
        await apiClient.createAdminItem('education', editing);
      }
      setEditing(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'Education entry saved.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiClient.deleteAdminItem('education', deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Education entry deleted.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Educational Background"
        description="Manage academic records and self-directed learning entries shown on About Me."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({ period: '', title: '', institution: '', location: '', summary: '', status: 'published', sortOrder: items.length + 1 })
            }
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Education</span>
          </button>
        }
      >
        <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
          {items.map((edu) => (
            <div key={edu.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#000000] dark:text-white">
                  {edu.title}{' '}
                  <span className="font-mono-tabular text-xs font-normal text-[#707070] dark:text-[#A3A3A3]">
                    · {edu.period} · {edu.status}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[#707070] dark:text-[#A3A3A3]">{edu.institution}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => setEditing({ ...edu })} className={ADMIN_BTN_SECONDARY}>
                  Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(edu)} className={ADMIN_BTN_DANGER}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminPanelCard>

      {editing && (
        <AdminPanelCard
          title={editing.id ? 'Edit Education Entry' : 'New Education Entry'}
          actions={
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Entry</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Period / Year">
              <input
                type="text"
                value={editing.period || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, period: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Status">
              <select
                value={editing.status || 'published'}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, status: e.target.value as PublicationStatus });
                }}
                className={ADMIN_INPUT_CLASS}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </AdminField>
            <AdminField label="Program / Focus Title">
              <input
                type="text"
                value={editing.title || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, title: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Institution / Context">
              <input
                type="text"
                value={editing.institution || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, institution: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <div className="sm:col-span-2">
              <AdminField label="Summary">
                <textarea
                  rows={3}
                  value={editing.summary || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setEditing({ ...editing, summary: e.target.value });
                  }}
                  className={ADMIN_TEXTAREA_CLASS}
                />
              </AdminField>
            </div>
          </div>
        </AdminPanelCard>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Education Entry?"
        description={`Delete "${deleteTarget?.title}" permanently?`}
        confirmLabel="Delete"
        danger
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. SKILLS MANAGER                                                          */
/* -------------------------------------------------------------------------- */
interface SkillRow {
  id: string;
  slug: string;
  name: string;
  stage: SkillStage;
  area: string;
  note: string;
  iconKey: string;
  status: PublicationStatus;
  sortOrder: number;
}

export function SkillsSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<SkillRow[]>([]);
  const [editing, setEditing] = useState<Partial<SkillRow> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkillRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getAdminList<SkillRow>('skills');
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load skills.' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const moveItem = async (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    setItems(reordered);
    try {
      await apiClient.reorderAdminItems(
        'skills',
        reordered.map((s) => s.id),
      );
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Reorder failed.' });
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await apiClient.updateAdminItem('skills', editing.id, editing);
      } else {
        await apiClient.createAdminItem('skills', editing);
      }
      setEditing(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'Skill saved.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiClient.deleteAdminItem('skills', deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Skill deleted.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Skills & Learning Stages"
        description="Organize authentic capabilities across Current Skills, Currently Learning, and Areas of Interest."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({
                name: '',
                stage: 'Current Skills',
                area: '',
                note: '',
                status: 'published',
                sortOrder: items.length + 1,
              })
            }
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Skill</span>
          </button>
        }
      >
        <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
          {items.map((sk, idx) => (
            <div key={sk.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#000000] dark:text-white">
                  {sk.name}{' '}
                  <span className="font-mono-tabular text-xs font-normal text-[#707070] dark:text-[#A3A3A3]">
                    · {sk.stage} · {sk.status}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[#707070] dark:text-[#A3A3A3]">
                  {sk.area} — {sk.note}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => void moveItem(idx, -1)}
                  className={ADMIN_BTN_SECONDARY}
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => void moveItem(idx, 1)}
                  className={ADMIN_BTN_SECONDARY}
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setEditing({ ...sk })} className={ADMIN_BTN_SECONDARY}>
                  Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(sk)} className={ADMIN_BTN_DANGER}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminPanelCard>

      {editing && (
        <AdminPanelCard
          title={editing.id ? `Edit Skill: ${editing.name}` : 'New Skill'}
          actions={
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Skill</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Skill Name">
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
            <AdminField label="Stage">
              <select
                value={editing.stage || 'Current Skills'}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, stage: e.target.value as SkillStage });
                }}
                className={ADMIN_INPUT_CLASS}
              >
                <option value="Current Skills">Current Skills</option>
                <option value="Currently Learning">Currently Learning</option>
                <option value="Areas of Interest">Areas of Interest</option>
              </select>
            </AdminField>
            <AdminField label="Domain / Area">
              <input
                type="text"
                value={editing.area || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, area: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Publication Status">
              <select
                value={editing.status || 'published'}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, status: e.target.value as PublicationStatus });
                }}
                className={ADMIN_INPUT_CLASS}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </AdminField>
            <div className="sm:col-span-2">
              <AdminField label="Description Note">
                <textarea
                  rows={2}
                  value={editing.note || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setEditing({ ...editing, note: e.target.value });
                  }}
                  className={ADMIN_TEXTAREA_CLASS}
                />
              </AdminField>
            </div>
          </div>
        </AdminPanelCard>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Skill?"
        description={`Delete "${deleteTarget?.name}" permanently?`}
        confirmLabel="Delete"
        danger
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
