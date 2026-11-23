import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  ExternalLink,
  LogOut,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import type {
  MediaItem,
  NavigationMenuItem,
  SeoDefaults,
  SocialLinkItem,
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
/* 1. MEDIA LIBRARY MANAGER (R2 UPLOAD + EXTERNAL HTTPS URL REGISTRATION)     */
/* -------------------------------------------------------------------------- */
export function MediaSection() {
  const [r2Configured, setR2Configured] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [extUrl, setExtUrl] = useState('');
  const [extName, setExtName] = useState('');
  const [extAlt, setExtAlt] = useState('');
  const [editingMeta, setEditingMeta] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getMedia();
      setR2Configured(res.r2Configured);
      setItems(res.items);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load media library.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleR2Upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      await apiClient.uploadMediaFile(file, uploadAlt, uploadCaption);
      setFile(null);
      setUploadAlt('');
      setUploadCaption('');
      setMsg({ type: 'success', text: 'File uploaded to Cloudflare R2 and indexed in D1.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleAddExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extUrl.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await apiClient.addExternalMedia({
        publicUrl: extUrl.trim(),
        fileName: extName.trim(),
        altText: extAlt.trim(),
        caption: '',
      });
      setExtUrl('');
      setExtName('');
      setExtAlt('');
      setMsg({ type: 'success', text: 'External image URL registered in Media Library.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Registration failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!editingMeta) return;
    setBusy(true);
    try {
      await apiClient.updateAdminItem('media', editingMeta.id, {
        altText: editingMeta.altText,
        caption: editingMeta.caption,
      });
      setEditingMeta(null);
      setMsg({ type: 'success', text: 'Media metadata updated.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await apiClient.deleteAdminItem('media', deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ type: 'success', text: 'Media asset deleted.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.publicUrl);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // clipboard ignored
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminPanelCard
          title="Direct R2 Upload"
          description="Upload PNG, JPEG, WebP, or sanitized SVG images up to 5 MB."
        >
          {!r2Configured ? (
            <div className="rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] p-4 text-xs leading-relaxed text-[#707070] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#A3A3A3]">
              <strong className="block font-semibold text-[#111111] dark:text-white">
                Cloudflare R2 Bucket Not Bound (MEDIA_BUCKET)
              </strong>
              <p className="mt-1.5">
                Direct binary uploads require an R2 bucket bound as <code className="font-mono-tabular">MEDIA_BUCKET</code> in{' '}
                <code className="font-mono-tabular">worker/wrangler.jsonc</code>. Meanwhile, you can register external HTTPS image URLs on the right.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleR2Upload(e)} className="space-y-4">
              <AdminField label="Image File (PNG / JPEG / WebP / SVG)">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>
              <AdminField label="Alt Text">
                <input
                  type="text"
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>
              <AdminField label="Caption (Optional)">
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>
              <button type="submit" disabled={busy || !file} className={ADMIN_BTN_PRIMARY}>
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{busy ? 'Uploading...' : 'Upload to R2'}</span>
              </button>
            </form>
          )}
        </AdminPanelCard>

        <AdminPanelCard
          title="Register External HTTPS Image"
          description="Index hosted image URLs in D1 for reuse in projects, blog posts, and certificates."
        >
          <form onSubmit={(e) => void handleAddExternal(e)} className="space-y-4">
            <AdminField label="Image HTTPS URL">
              <input
                type="url"
                required
                value={extUrl}
                onChange={(e) => setExtUrl(e.target.value)}
                placeholder="https://..."
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Asset Label / File Name">
              <input
                type="text"
                value={extName}
                onChange={(e) => setExtName(e.target.value)}
                placeholder="project-screenshot.png"
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Descriptive Alt Text">
              <input
                type="text"
                value={extAlt}
                onChange={(e) => setExtAlt(e.target.value)}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <button type="submit" disabled={busy || !extUrl.trim()} className={ADMIN_BTN_PRIMARY}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Register Asset URL</span>
            </button>
          </form>
        </AdminPanelCard>
      </div>

      <AdminPanelCard title={`Indexed Media Assets (${items.length})`}>
        {loading ? (
          <div className="h-24 animate-pulse rounded bg-[#F8F8F8] dark:bg-[#161616]" />
        ) : !items.length ? (
          <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">No media items indexed yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 rounded-[6px] border border-[#EAEAEA] p-4 dark:border-[#222222]"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.publicUrl}
                    alt={item.altText || item.fileName}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-[4px] border border-[#EAEAEA] object-cover dark:border-[#222222]"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#000000] dark:text-white">
                      {item.fileName}
                    </p>
                    <p className="truncate font-mono-tabular text-[11px] text-[#707070] dark:text-[#A3A3A3]">
                      {item.storageProvider} · {item.publicUrl}
                    </p>
                    {item.altText && (
                      <p className="mt-1 truncate text-xs text-[#707070] dark:text-[#A3A3A3]">
                        Alt: {item.altText}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void copyUrl(item)} className={ADMIN_BTN_SECONDARY}>
                    {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <button type="button" onClick={() => setEditingMeta({ ...item })} className={ADMIN_BTN_SECONDARY}>
                    Edit Alt
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

      {editingMeta && (
        <AdminPanelCard
          title={`Edit Metadata: ${editingMeta.fileName}`}
          actions={
            <button type="button" disabled={busy} onClick={() => void handleSaveMeta()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save Alt &amp; Caption</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminField label="Alt Text">
              <input
                type="text"
                value={editingMeta.altText}
                onChange={(e) => setEditingMeta({ ...editingMeta, altText: e.target.value })}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
            <AdminField label="Caption">
              <input
                type="text"
                value={editingMeta.caption}
                onChange={(e) => setEditingMeta({ ...editingMeta, caption: e.target.value })}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
          </div>
        </AdminPanelCard>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Media Asset?"
        description={`Delete "${deleteTarget?.fileName}" from the library${deleteTarget?.storageProvider === 'r2' ? ' and R2 bucket' : ''}?`}
        confirmLabel="Delete Asset"
        danger
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. NAVIGATION MENU EDITOR                                                  */
/* -------------------------------------------------------------------------- */
export function NavigationSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [nav, setNav] = useState<NavigationMenuItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiClient
      .getSettings()
      .then((res) => setNav((res.settings.navigationMenu as NavigationMenuItem[]) || []))
      .catch((err) => setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Load failed.' }));
  }, []);

  const updateRow = (idx: number, patch: Partial<NavigationMenuItem>) => {
    setDirty(true);
    setNav((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const moveRow = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= nav.length) return;
    setDirty(true);
    const next = [...nav];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    setNav(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.saveSettings({ navigationMenu: nav });
      setDirty(false);
      setMsg({ type: 'success', text: 'Navigation menu saved.' });
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Public Navigation Menu"
        description="Reorder, rename, add, or toggle links shown in the top navigation bar. Admin URLs are automatically blocked."
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setDirty(true);
                setNav([...nav, { label: 'New Link', to: '/p/custom', visible: true }]);
              }}
              className={ADMIN_BTN_SECONDARY}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add Link</span>
            </button>
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Navigation'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {nav.map((item, idx) => (
            <div
              key={`${item.to}-${idx}`}
              className="grid grid-cols-1 items-center gap-3 rounded-[6px] border border-[#EAEAEA] p-3 sm:grid-cols-[1fr_1fr_auto_auto] dark:border-[#222222]"
            >
              <input
                type="text"
                aria-label="Menu label"
                value={item.label}
                onChange={(e) => updateRow(idx, { label: e.target.value })}
                className={`${ADMIN_INPUT_CLASS} mt-0`}
              />
              <input
                type="text"
                aria-label="Route path"
                value={item.to}
                onChange={(e) => updateRow(idx, { to: e.target.value })}
                className={`${ADMIN_INPUT_CLASS} mt-0 font-mono-tabular`}
              />
              <label className="inline-flex min-h-[44px] items-center gap-2 text-xs text-[#111111] dark:text-white">
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={(e) => updateRow(idx, { visible: e.target.checked })}
                />
                <span>Visible</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveRow(idx, -1)}
                  className={ADMIN_BTN_SECONDARY}
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={idx === nav.length - 1}
                  onClick={() => moveRow(idx, 1)}
                  className={ADMIN_BTN_SECONDARY}
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirty(true);
                    setNav(nav.filter((_, i) => i !== idx));
                  }}
                  className={ADMIN_BTN_DANGER}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminPanelCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. WEBSITE BRAND, IDENTITY & CONTACT SETTINGS                              */
/* -------------------------------------------------------------------------- */
interface SettingsFormState {
  brandMark: string;
  fullName: string;
  professionalIdentity: string;
  tagline: string;
  availabilityLabel: string;
  heroLabel: string;
  heroSubheading: string;
  heroDescription: string;
  footerDescription: string;
  copyrightText: string;
  contactHeading: string;
  contactDescription: string;
  contactEmail: string;
  socialLinks: SocialLinkItem[];
  analyticsEnabled: boolean;
}

export function WebsiteSettingsSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [form, setForm] = useState<SettingsFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiClient
      .getSettings()
      .then((res) => setForm(res.settings as unknown as SettingsFormState))
      .catch((err) => setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Load failed.' }));
  }, []);

  const updateSocial = (idx: number, url: string) => {
    if (!form) return;
    setDirty(true);
    const next = form.socialLinks.map((s, i) => (i === idx ? { ...s, url: url || null } : s));
    setForm({ ...form, socialLinks: next });
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.saveSettings(form as unknown as Record<string, unknown>);
      setDirty(false);
      setMsg({ type: 'success', text: 'Website settings saved.' });
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const backup = await apiClient.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mrm-cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Export failed.' });
    } finally {
      setExporting(false);
    }
  };

  if (!form) {
    return <div className="h-40 animate-pulse rounded-[8px] bg-[#F8F8F8] dark:bg-[#161616]" />;
  }

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="Brand Identity, Hero Copy & Contact Channels"
        description="Update site-wide copy, direct contact email, social links, and privacy-friendly analytics."
        actions={
          <>
            <button type="button" disabled={exporting} onClick={() => void handleExport()} className={ADMIN_BTN_SECONDARY}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{exporting ? 'Exporting...' : 'JSON Backup'}</span>
            </button>
            <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminField label="Short Brand Mark">
            <input
              type="text"
              value={form.brandMark}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, brandMark: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Full Name">
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, fullName: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Professional Identity">
            <input
              type="text"
              value={form.professionalIdentity}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, professionalIdentity: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Tagline">
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, tagline: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Hero Label">
            <input
              type="text"
              value={form.heroLabel}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, heroLabel: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Availability Label">
            <input
              type="text"
              value={form.availabilityLabel}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, availabilityLabel: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <div className="sm:col-span-2">
            <AdminField label="Hero Subheading">
              <input
                type="text"
                value={form.heroSubheading}
                onChange={(e) => {
                  setDirty(true);
                  setForm({ ...form, heroSubheading: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
          </div>
          <div className="sm:col-span-2">
            <AdminField label="Hero Description">
              <textarea
                rows={3}
                value={form.heroDescription}
                onChange={(e) => {
                  setDirty(true);
                  setForm({ ...form, heroDescription: e.target.value });
                }}
                className={ADMIN_TEXTAREA_CLASS}
              />
            </AdminField>
          </div>
          <div className="sm:col-span-2">
            <AdminField label="Footer Description">
              <textarea
                rows={2}
                value={form.footerDescription}
                onChange={(e) => {
                  setDirty(true);
                  setForm({ ...form, footerDescription: e.target.value });
                }}
                className={ADMIN_TEXTAREA_CLASS}
              />
            </AdminField>
          </div>
          <AdminField label="Copyright Notice">
            <input
              type="text"
              value={form.copyrightText}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, copyrightText: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Public Contact Email (Optional)">
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, contactEmail: e.target.value });
              }}
              placeholder="Leave blank if using contact form only"
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Contact Page Heading">
            <input
              type="text"
              value={form.contactHeading}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, contactHeading: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Contact Page Intro">
            <input
              type="text"
              value={form.contactDescription}
              onChange={(e) => {
                setDirty(true);
                setForm({ ...form, contactDescription: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>

          <div className="sm:col-span-2 border-t border-[#EAEAEA] pt-4 dark:border-[#222222]">
            <h3 className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#111111] uppercase dark:text-white">
              Social Channel Links (Leave blank for Coming Soon)
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {form.socialLinks.map((soc, idx) => (
                <AdminField key={soc.id} label={soc.platform}>
                  <input
                    type="url"
                    value={soc.url || ''}
                    onChange={(e) => updateSocial(idx, e.target.value)}
                    placeholder="https://..."
                    className={ADMIN_INPUT_CLASS}
                  />
                </AdminField>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 pt-2">
            <label className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[#111111] dark:text-white">
              <input
                type="checkbox"
                checked={form.analyticsEnabled}
                onChange={(e) => {
                  setDirty(true);
                  setForm({ ...form, analyticsEnabled: e.target.checked });
                }}
              />
              <span>Enable cookie-free aggregate page view tracking</span>
            </label>
          </div>
        </div>
      </AdminPanelCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. SEO SETTINGS & DYNAMIC SITEMAP / ROBOTS                                 */
/* -------------------------------------------------------------------------- */
export function SeoSettingsSection({ setDirty, onPublicDataChanged }: AdminSectionProps) {
  const [canonicalBaseUrl, setCanonicalBaseUrl] = useState('https://mdrobinmia.pages.dev');
  const [seoDefaults, setSeoDefaults] = useState<SeoDefaults>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiClient
      .getSettings()
      .then((res) => {
        setCanonicalBaseUrl(String(res.settings.canonicalBaseUrl || 'https://mdrobinmia.pages.dev'));
        setSeoDefaults((res.settings.seoDefaults as SeoDefaults) || {});
      })
      .catch((err) => setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Load failed.' }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.saveSettings({ canonicalBaseUrl, seoDefaults });
      setDirty(false);
      setMsg({ type: 'success', text: 'SEO defaults saved.' });
      onPublicDataChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard
        title="SEO & Open Graph Defaults"
        description="Configure canonical base URL, default titles/descriptions, and inspect dynamic sitemap.xml / robots.txt."
        actions={
          <button type="button" disabled={saving} onClick={() => void handleSave()} className={ADMIN_BTN_PRIMARY}>
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{saving ? 'Saving...' : 'Save SEO Settings'}</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminField label="Canonical Base Domain">
            <input
              type="url"
              value={canonicalBaseUrl}
              onChange={(e) => {
                setDirty(true);
                setCanonicalBaseUrl(e.target.value);
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Open Graph Site Name">
            <input
              type="text"
              value={seoDefaults.ogSiteName || ''}
              onChange={(e) => {
                setDirty(true);
                setSeoDefaults({ ...seoDefaults, ogSiteName: e.target.value });
              }}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <div className="sm:col-span-2">
            <AdminField label="Default Meta Title">
              <input
                type="text"
                value={seoDefaults.defaultTitle || ''}
                onChange={(e) => {
                  setDirty(true);
                  setSeoDefaults({ ...seoDefaults, defaultTitle: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
          </div>
          <div className="sm:col-span-2">
            <AdminField label="Default Meta Description">
              <textarea
                rows={3}
                value={seoDefaults.defaultDescription || ''}
                onChange={(e) => {
                  setDirty(true);
                  setSeoDefaults({ ...seoDefaults, defaultDescription: e.target.value });
                }}
                className={ADMIN_TEXTAREA_CLASS}
              />
            </AdminField>
          </div>
          <div className="sm:col-span-2">
            <AdminField label="Default Keywords">
              <input
                type="text"
                value={seoDefaults.defaultKeywords || ''}
                onChange={(e) => {
                  setDirty(true);
                  setSeoDefaults({ ...seoDefaults, defaultKeywords: e.target.value });
                }}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-[#EAEAEA] pt-5 dark:border-[#222222]">
          <a
            href="/api/v1/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className={ADMIN_BTN_SECONDARY}
          >
            <span>Inspect Dynamic Sitemap.xml</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="/api/v1/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className={ADMIN_BTN_SECONDARY}
          >
            <span>Inspect Robots.txt</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </AdminPanelCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. ADMIN PROFILE, PASSWORD & SESSION SECURITY                              */
/* -------------------------------------------------------------------------- */
export function AdminProfileSection({
  admin,
  onAdminUpdated,
  onSignedOut,
}: AdminSectionProps) {
  const [displayName, setDisplayName] = useState(admin?.displayName || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [bio, setBio] = useState(admin?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [logoutAllModal, setLogoutAllModal] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMsg(null);
    try {
      const res = await apiClient.updateProfile({ displayName, email, bio });
      onAdminUpdated?.(res.admin);
      setMsg({ type: 'success', text: 'Admin profile updated.' });
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Profile update failed.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setSavingPassword(true);
    setMsg(null);
    try {
      await apiClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMsg({ type: 'success', text: 'Password updated cleanly.' });
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Password change failed.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    setLogoutAllModal(false);
    await apiClient.logoutAll();
    onSignedOut?.();
  };

  return (
    <div className="space-y-6">
      <AdminNotice type={msg?.type || 'info'} message={msg?.text || null} onDismiss={() => setMsg(null)} />

      <AdminPanelCard title="Administrator Profile" description="Update your CMS author name, email, and role notes.">
        <form onSubmit={(e) => void handleSaveProfile(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminField label="Display Name">
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Login Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <div className="sm:col-span-2">
            <AdminField label="Author Bio">
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={ADMIN_TEXTAREA_CLASS}
              />
            </AdminField>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={savingProfile} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </AdminPanelCard>

      <AdminPanelCard
        title="Password & Session Security"
        description="PBKDF2 SHA-256 salted password rotation and active session revocation."
        actions={
          <button type="button" onClick={() => setLogoutAllModal(true)} className={ADMIN_BTN_DANGER}>
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Logout All Devices</span>
          </button>
        }
      >
        <form onSubmit={(e) => void handleChangePassword(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AdminField label="Current Password">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={ADMIN_INPUT_CLASS}
              />
            </AdminField>
          </div>
          <AdminField label="New Password" hint="Minimum 12 characters with upper, lower, and digit.">
            <input
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <AdminField label="Confirm New Password">
            <input
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminField>
          <div className="sm:col-span-2">
            <label className="inline-flex min-h-[44px] items-center gap-2 text-xs text-[#111111] dark:text-white">
              <input
                type="checkbox"
                checked={revokeOtherSessions}
                onChange={(e) => setRevokeOtherSessions(e.target.checked)}
              />
              <span>Revoke all other active browser sessions after changing password</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={savingPassword} className={ADMIN_BTN_PRIMARY}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </AdminPanelCard>

      <ConfirmModal
        open={logoutAllModal}
        title="Logout All Devices?"
        description="This immediately revokes every active admin session in D1, including your current browser."
        confirmLabel="Logout Everywhere"
        danger
        onCancel={() => setLogoutAllModal(false)}
        onConfirm={() => void handleLogoutAll()}
      />
    </div>
  );
}
