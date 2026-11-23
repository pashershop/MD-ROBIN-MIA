import { useCallback, useEffect, useState } from 'react';
import { Check, Inbox, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import type {
  AchievementGroup,
  ContactMessageItem,
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
/* 1. ACHIEVEMENTS & CERTIFICATES MANAGER                                     */
/* -------------------------------------------------------------------------- */
interface AchRow {
  id: string;
  group: AchievementGroup;
  title: string;
  issuerOrContext: string;
  dateLabel: string;
  description: string;
  credentialUrl: string | null;
  certificateImageUrl: string | null;
  isPlaceholder: boolean;
  status: PublicationStatus;
  sortOrder: number;
}

export function AchievementsSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<AchRow[]>([]);
  const [groupFilter, setGroupFilter] = useState<'all' | AchievementGroup>('all');
  const [editing, setEditing] = useState<Partial<AchRow> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AchRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getAdminList<AchRow>('achievements');
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load achievements.' });
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
        await apiClient.updateAdminItem('achievements', editing.id, editing);
      } else {
        await apiClient.createAdminItem('achievements', editing);
      }
      setEditing(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'Achievement saved.' });
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
      await apiClient.deleteAdminItem('achievements', deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Achievement deleted.' });
      await load();
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  const visible = items.filter((a) => groupFilter === 'all' || a.group === groupFilter);

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Achievements & Certificates"
        description="Keep drafts ready for upcoming certificates and publish only verified milestones and credentials."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({
                group: 'Personal Milestones',
                title: '',
                issuerOrContext: '',
                dateLabel: String(new Date().getFullYear()),
                description: '',
                credentialUrl: '',
                certificateImageUrl: '',
                isPlaceholder: false,
                status: 'draft',
                sortOrder: items.length + 1,
              })
            }
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Entry</span>
          </button>
        }
      >
        <div className="mb-4">
          <select
            aria-label="Filter achievements by group"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as 'all' | AchievementGroup)}
            className={`${ADMIN_INPUT_CLASS} mt-0 sm:w-64`}
          >
            <option value="all">All Groups</option>
            <option value="Certificates Showcase">Certificates Showcase</option>
            <option value="Educational Background">Educational Background</option>
            <option value="Personal Milestones">Personal Milestones</option>
            <option value="Awards & Recognition">Awards &amp; Recognition</option>
          </select>
        </div>

        <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
          {visible.map((ach) => (
            <div key={ach.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#000000] dark:text-white">
                  {ach.title}{' '}
                  <span className="font-mono-tabular text-xs font-normal text-[#707070] dark:text-[#A3A3A3]">
                    · {ach.group} · {ach.status}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[#707070] dark:text-[#A3A3A3]">
                  {ach.issuerOrContext} · {ach.dateLabel}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => setEditing({ ...ach })} className={ADMIN_BTN_SECONDARY}>
                  Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(ach)} className={ADMIN_BTN_DANGER}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminPanelCard>

      {editing && (
        <AdminPanelCard
          title={editing.id ? `Edit: ${editing.title}` : 'New Achievement / Certificate'}
          actions={
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Entry</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Category Group">
              <select
                value={editing.group || 'Personal Milestones'}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, group: e.target.value as AchievementGroup });
                }}
                className={ADMIN_INPUT_CLASS}
              >
                <option value="Certificates Showcase">Certificates Showcase</option>
                <option value="Educational Background">Educational Background</option>
                <option value="Personal Milestones">Personal Milestones</option>
                <option value="Awards & Recognition">Awards &amp; Recognition</option>
              </select>
            </AdminField>

            <AdminField label="Publication Status">
              <select
                value={editing.status || 'draft'}
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

            <AdminField label="Issuer / Context">
              <input
                type="text"
                value={editing.issuerOrContext || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, issuerOrContext: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>

            <AdminField label="Date / Year Label">
              <input
                type="text"
                value={editing.dateLabel || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, dateLabel: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>

            <AdminField label="Credential Verification URL (Optional)">
              <input
                type="url"
                value={editing.credentialUrl || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, credentialUrl: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>

            <div className="sm:col-span-2">
              <AdminField label="Description">
                <textarea
                  rows={3}
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

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Entry?"
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
/* 2. EXPERIENCE MANAGER                                                      */
/* -------------------------------------------------------------------------- */
interface ExpRow {
  id: string;
  roleTitle: string;
  organization: string;
  period: string;
  location: string;
  employmentType: string;
  summary: string;
  highlights: string[];
  status: PublicationStatus;
  sortOrder: number;
}

export function ExperienceSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<ExpRow[]>([]);
  const [editing, setEditing] = useState<Partial<ExpRow> | null>(null);
  const [highlightsText, setHighlightsText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ExpRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getAdminList<ExpRow>('experiences');
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load experience.' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      ...editing,
      highlights: highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editing.id) {
        await apiClient.updateAdminItem('experiences', editing.id, payload);
      } else {
        await apiClient.createAdminItem('experiences', payload);
      }
      setEditing(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'Experience saved.' });
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
      await apiClient.deleteAdminItem('experiences', deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Experience deleted.' });
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
        title="Experience & Roles"
        description="Remain hidden on the public website until you publish verified real roles or collaborations."
        actions={
          <button
            type="button"
            onClick={() => {
              setHighlightsText('');
              setEditing({
                roleTitle: '',
                organization: '',
                period: '',
                location: '',
                employmentType: '',
                summary: '',
                status: 'draft',
                sortOrder: items.length + 1,
              });
            }}
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Experience</span>
          </button>
        }
      >
        {!items.length ? (
          <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">
            No experience records created yet. Public section stays hidden automatically.
          </p>
        ) : (
          <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {items.map((exp) => (
              <div key={exp.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#000000] dark:text-white">
                    {exp.roleTitle} · {exp.organization}{' '}
                    <span className="font-mono-tabular text-xs font-normal text-[#707070] dark:text-[#A3A3A3]">
                      ({exp.status})
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#707070] dark:text-[#A3A3A3]">
                    {exp.period} {exp.location ? `· ${exp.location}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setHighlightsText((exp.highlights || []).join('\n'));
                      setEditing({ ...exp });
                    }}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(exp)} className={ADMIN_BTN_DANGER}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      {editing && (
        <AdminPanelCard
          title={editing.id ? 'Edit Experience' : 'Add Experience'}
          actions={
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Experience</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Role Title">
              <input
                type="text"
                value={editing.roleTitle || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, roleTitle: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Organization">
              <input
                type="text"
                value={editing.organization || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, organization: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Period">
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
                value={editing.status || 'draft'}
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
            <AdminField label="Location">
              <input
                type="text"
                value={editing.location || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, location: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Engagement Type">
              <input
                type="text"
                value={editing.employmentType || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, employmentType: e.target.value });
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
            <div className="sm:col-span-2">
              <AdminField label="Key Highlights (one per line)">
                <textarea
                  rows={3}
                  value={highlightsText}
                  onChange={(e) => {
                    setDirty(true);
                    setHighlightsText(e.target.value);
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
        title="Delete Experience?"
        description={`Delete "${deleteTarget?.roleTitle}" permanently?`}
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
/* 3. SERVICES / COLLABORATION OFFERINGS MANAGER                              */
/* -------------------------------------------------------------------------- */
interface SrvRow {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  deliverables: string[];
  availabilityNote: string;
  status: PublicationStatus;
  sortOrder: number;
}

export function ServicesSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<SrvRow[]>([]);
  const [editing, setEditing] = useState<Partial<SrvRow> | null>(null);
  const [deliverablesText, setDeliverablesText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SrvRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getAdminList<SrvRow>('services');
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load services.' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      ...editing,
      deliverables: deliverablesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editing.id) {
        await apiClient.updateAdminItem('services', editing.id, payload);
      } else {
        await apiClient.createAdminItem('services', payload);
      }
      setEditing(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'Offering saved.' });
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
      await apiClient.deleteAdminItem('services', deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Offering deleted.' });
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
        title="Collaboration & Services"
        description="Optional offerings section. Stays hidden on public pages unless published."
        actions={
          <button
            type="button"
            onClick={() => {
              setDeliverablesText('');
              setEditing({
                title: '',
                slug: '',
                shortDescription: '',
                availabilityNote: '',
                status: 'draft',
                sortOrder: items.length + 1,
              });
            }}
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Service</span>
          </button>
        }
      >
        {!items.length ? (
          <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">No offerings added yet.</p>
        ) : (
          <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {items.map((srv) => (
              <div key={srv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#000000] dark:text-white">
                    {srv.title}{' '}
                    <span className="font-mono-tabular text-xs font-normal text-[#707070] dark:text-[#A3A3A3]">
                      ({srv.status})
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#707070] dark:text-[#A3A3A3]">{srv.shortDescription}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliverablesText((srv.deliverables || []).join('\n'));
                      setEditing({ ...srv });
                    }}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(srv)} className={ADMIN_BTN_DANGER}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      {editing && (
        <AdminPanelCard
          title={editing.id ? 'Edit Offering' : 'New Offering'}
          actions={
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Offering</span>
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
                value={editing.status || 'draft'}
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
              <AdminField label="Description">
                <textarea
                  rows={3}
                  value={editing.shortDescription || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setEditing({ ...editing, shortDescription: e.target.value });
                  }}
                  className={ADMIN_TEXTAREA_CLASS}
                />
              </AdminField>
            </div>
            <div className="sm:col-span-2">
              <AdminField label="Deliverables (one per line)">
                <textarea
                  rows={3}
                  value={deliverablesText}
                  onChange={(e) => {
                    setDirty(true);
                    setDeliverablesText(e.target.value);
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
        title="Delete Service?"
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
/* 4. TESTIMONIALS & ENDORSEMENTS MODERATION                                  */
/* -------------------------------------------------------------------------- */
interface TmRow {
  id: string;
  authorName: string;
  authorRole: string;
  organization: string;
  quote: string;
  projectRef: string;
  isApproved: boolean;
  status: PublicationStatus;
  sortOrder: number;
}

export function TestimonialsSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [items, setItems] = useState<TmRow[]>([]);
  const [editing, setEditing] = useState<Partial<TmRow> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TmRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getAdminList<TmRow>('testimonials');
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load testimonials.' });
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
        await apiClient.updateAdminItem('testimonials', editing.id, editing);
      } else {
        await apiClient.createAdminItem('testimonials', editing);
      }
      setEditing(null);
      setDirty(false);
      setMsg({ type: 'success', text: 'Testimonial saved.' });
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
      await apiClient.deleteAdminItem('testimonials', deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Testimonial deleted.' });
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
        title="Testimonials & Endorsements"
        description="Only authentic testimonials marked both Approved and Published appear publicly. Fake reviews are never seeded."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({
                authorName: '',
                authorRole: '',
                organization: '',
                quote: '',
                projectRef: '',
                isApproved: false,
                status: 'draft',
                sortOrder: items.length + 1,
              })
            }
            className={ADMIN_BTN_PRIMARY}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Testimonial</span>
          </button>
        }
      >
        {!items.length ? (
          <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">
            No testimonials stored yet. Public testimonial blocks stay hidden automatically.
          </p>
        ) : (
          <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {items.map((tm) => (
              <div key={tm.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#000000] dark:text-white">
                    {tm.authorName} · {tm.authorRole}{' '}
                    <span className="font-mono-tabular text-xs font-normal text-[#707070] dark:text-[#A3A3A3]">
                      ({tm.isApproved ? 'Approved' : 'Unapproved'} · {tm.status})
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#707070] dark:text-[#A3A3A3]">{tm.quote}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => setEditing({ ...tm })} className={ADMIN_BTN_SECONDARY}>
                    Edit
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(tm)} className={ADMIN_BTN_DANGER}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      {editing && (
        <AdminPanelCard
          title={editing.id ? 'Moderate Testimonial' : 'Add Real Testimonial'}
          actions={
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Author Name">
              <input
                type="text"
                value={editing.authorName || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, authorName: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Role / Title">
              <input
                type="text"
                value={editing.authorRole || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, authorRole: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Organization">
              <input
                type="text"
                value={editing.organization || ''}
                onChange={(e) => {
                  setDirty(true);
                  setEditing({ ...editing, organization: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Status">
              <select
                value={editing.status || 'draft'}
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
              <AdminField label="Endorsement Quote">
                <textarea
                  rows={3}
                  value={editing.quote || ''}
                  onChange={(e) => {
                    setDirty(true);
                    setEditing({ ...editing, quote: e.target.value });
                  }}
                  className={ADMIN_TEXTAREA_CLASS}
                />
              </AdminField>
            </div>
            <div className="sm:col-span-2">
              <label className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[#111111] dark:text-white">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isApproved)}
                  onChange={(e) => {
                    setDirty(true);
                    setEditing({ ...editing, isApproved: e.target.checked });
                  }}
                />
                <span>Approve for public display</span>
              </label>
            </div>
          </div>
        </AdminPanelCard>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Testimonial?"
        description={`Delete endorsement from "${deleteTarget?.authorName}" permanently?`}
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
/* 5. CONTACT MESSAGES INBOX                                                  */
/* -------------------------------------------------------------------------- */
export function MessagesSection() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [items, setItems] = useState<ContactMessageItem[]>([]);
  const [selected, setSelected] = useState<ContactMessageItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async (filter: string) => {
    setLoading(true);
    try {
      const res = await apiClient.getMessages(filter);
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load messages.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(statusFilter);
  }, [statusFilter, load]);

  const setStatus = async (item: ContactMessageItem, status: 'unread' | 'read' | 'archived') => {
    setSaving(true);
    try {
      await apiClient.updateAdminItem('messages', item.id, { status });
      setItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, status } : m)));
      if (selected?.id === item.id) {
        setSelected({ ...item, status });
      }
      setMsg({ type: 'success', text: `Marked message as ${status}.` });
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update message status.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiClient.deleteAdminItem('messages', deleteTarget.id);
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Message deleted permanently.' });
      await load(statusFilter);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete message.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Contact Messages Inbox"
        description="Messages submitted from the public /contact form are stored securely in D1."
        actions={
          <>
            <div className="flex items-center gap-1 rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] p-1 dark:border-[#222222] dark:bg-[#0A0A0A]">
              {(['all', 'unread', 'read', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-[4px] px-3 py-1.5 text-xs font-medium capitalize ${
                    statusFilter === st
                      ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                      : 'text-[#707070] dark:text-[#A3A3A3]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void load(statusFilter)} className={ADMIN_BTN_SECONDARY}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </>
        }
      >
        {loading ? (
          <div className="h-32 animate-pulse rounded bg-[#F8F8F8] dark:bg-[#161616]" />
        ) : !items.length ? (
          <div className="flex flex-col items-center justify-center rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] p-8 text-center dark:border-[#222222] dark:bg-[#0A0A0A]">
            <Inbox className="h-6 w-6 text-[#707070] dark:text-[#A3A3A3]" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-[#111111] dark:text-white">No messages in this view</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#000000] dark:text-white">
                    {item.subject}{' '}
                    <span className="font-mono-tabular text-xs font-normal uppercase text-[#707070] dark:text-[#A3A3A3]">
                      · {item.status}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#707070] dark:text-[#A3A3A3]">
                    {item.fullName} ({item.email}) · {item.createdAt.slice(0, 16).replace('T', ' ')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      if (item.status === 'unread') {
                        void setStatus(item, 'read');
                      }
                    }}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    Read
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void setStatus(item, item.status === 'archived' ? 'read' : 'archived')}
                    className={ADMIN_BTN_SECONDARY}
                  >
                    {item.status === 'archived' ? 'Unarchive' : 'Archive'}
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(item)} className={ADMIN_BTN_DANGER}>
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
          title={selected.subject}
          description={`From ${selected.fullName} <${selected.email}> · ${selected.createdAt.slice(0, 16).replace('T', ' ')}`}
          actions={
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => void setStatus(selected, selected.status === 'unread' ? 'read' : 'unread')}
                className={ADMIN_BTN_SECONDARY}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mark {selected.status === 'unread' ? 'Read' : 'Unread'}</span>
              </button>
              <button type="button" onClick={() => setSelected(null)} className={ADMIN_BTN_SECONDARY}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </>
          }
        >
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#111111] dark:text-[#E5E5E5]">
            {selected.message}
          </p>
        </AdminPanelCard>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Message?"
        description={`Permanently delete message "${deleteTarget?.subject}" from ${deleteTarget?.fullName}?`}
        confirmLabel="Delete Message"
        danger
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
