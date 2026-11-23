import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';
import type { AnalyticsSummary, DashboardOverview } from '../../../types/content';
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  AdminNotice,
  AdminPanelCard,
} from '../components/AdminPrimitives';
import type { AdminSectionProps } from '../types';

export function OverviewSection({ onNavigate }: AdminSectionProps) {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getDashboard();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      setError(err instanceof Error ? err.message : 'Backup export failed.');
    } finally {
      setExporting(false);
    }
  };

  const counts = data?.counts;

  return (
    <div className="space-y-6">
      <AdminNotice type="error" message={error} onDismiss={() => setError(null)} />

      <AdminPanelCard
        title="Overview"
        description="Live summary from Cloudflare D1 across pages, projects, journal articles, skills, and visitor inquiries."
        actions={
          <>
            <button type="button" onClick={() => void load()} className={ADMIN_BTN_SECONDARY}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void handleExport()}
              className={ADMIN_BTN_PRIMARY}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{exporting ? 'Exporting...' : 'Export JSON Backup'}</span>
            </button>
          </>
        }
      >
        {loading && !data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] dark:border-[#222222] dark:bg-[#161616]"
              />
            ))}
          </div>
        ) : counts ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { label: 'Published Projects', value: counts.totalProjects, go: 'projects' as const },
              { label: 'Published Posts', value: counts.publishedPosts, go: 'blog' as const },
              { label: 'Draft Posts', value: counts.draftPosts, go: 'blog' as const },
              { label: 'Published Skills', value: counts.publishedSkills, go: 'skills' as const },
              { label: 'Published Pages', value: counts.publishedPages, go: 'pages' as const },
              { label: 'Unread Messages', value: counts.unreadMessages, go: 'messages' as const },
              { label: 'Media Assets', value: counts.mediaItems, go: 'media' as const },
              { label: 'Views (30 Days)', value: counts.viewsLast30Days, go: 'analytics' as const },
            ].map((stat) => (
              <button
                key={stat.label}
                type="button"
                onClick={() => onNavigate(stat.go)}
                className="rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] p-4 text-left transition-colors hover:border-[#111111] dark:border-[#222222] dark:bg-[#0A0A0A] dark:hover:border-white"
              >
                <span className="block text-[11px] font-medium tracking-wider text-[#707070] uppercase dark:text-[#A3A3A3]">
                  {stat.label}
                </span>
                <span className="font-mono-tabular mt-2 block text-2xl font-bold text-[#000000] dark:text-white">
                  {stat.value}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </AdminPanelCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminPanelCard
          title="Recent Contact Messages"
          actions={
            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="text-xs font-semibold text-[#111111] underline dark:text-white"
            >
              Open Inbox
            </button>
          }
        >
          {!data?.recentMessages.length ? (
            <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">
              No visitor inquiries received yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#EAEAEA] dark:divide-[#222222]">
              {data.recentMessages.map((msg) => (
                <li key={msg.id} className="flex items-start justify-between gap-3 py-3 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#111111] dark:text-white">
                      {msg.subject}
                    </p>
                    <p className="mt-0.5 text-[#707070] dark:text-[#A3A3A3]">
                      {msg.fullName} · {msg.email}
                    </p>
                  </div>
                  <span className="font-mono-tabular shrink-0 uppercase text-[#707070] dark:text-[#A3A3A3]">
                    {msg.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanelCard>

        <AdminPanelCard title="Recent Content Revisions">
          {!data?.recentRevisions.length ? (
            <p className="text-xs text-[#707070] dark:text-[#A3A3A3]">
              No CMS modifications logged yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#EAEAEA] dark:divide-[#222222]">
              {data.recentRevisions.map((rev) => (
                <li key={rev.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                  <span className="truncate text-[#111111] dark:text-white">
                    {rev.entityType} · {rev.action}
                  </span>
                  <time className="font-mono-tabular shrink-0 text-[#707070] dark:text-[#A3A3A3]">
                    {rev.createdAt.slice(0, 16).replace('T', ' ')}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </AdminPanelCard>
      </div>
    </div>
  );
}

export function AnalyticsSection() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (windowDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAnalytics(windowDays);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const maxDaily = Math.max(1, ...(data?.dailyViews.map((d) => d.views) ?? [1]));

  return (
    <div className="space-y-6">
      <AdminNotice type="error" message={error} onDismiss={() => setError(null)} />

      <AdminPanelCard
        title="Traffic & Page Views"
        description="Privacy-friendly aggregate daily counts stored in D1 without cookies, IP logs, or invasive trackers."
        actions={
          <div className="flex items-center gap-1 rounded-[4px] border border-[#EAEAEA] bg-[#F8F8F8] p-1 dark:border-[#222222] dark:bg-[#0A0A0A]">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                  days === d
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                    : 'text-[#707070] dark:text-[#A3A3A3]'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="h-32 animate-pulse rounded-[6px] bg-[#F8F8F8] dark:bg-[#161616]" />
        ) : !data || data.totalViews === 0 ? (
          <div className="rounded-[6px] border border-[#EAEAEA] bg-[#F8F8F8] p-8 text-center dark:border-[#222222] dark:bg-[#0A0A0A]">
            <p className="text-sm font-semibold text-[#111111] dark:text-white">
              No page views recorded in the last {days} days.
            </p>
            <p className="mt-1.5 text-xs text-[#707070] dark:text-[#A3A3A3]">
              Real aggregate counts appear automatically as visitors browse published public routes.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <p className="text-xs text-[#707070] uppercase dark:text-[#A3A3A3]">
                Total Views ({days} days)
              </p>
              <p className="font-mono-tabular mt-1 text-3xl font-bold text-[#000000] dark:text-white">
                {data.totalViews}
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[#707070] uppercase dark:text-[#A3A3A3]">
                Daily Views
              </h3>
              <div className="space-y-2">
                {data.dailyViews.map((day) => (
                  <div key={day.date} className="grid grid-cols-[90px_1fr_50px] items-center gap-3 text-xs">
                    <span className="font-mono-tabular text-[#707070] dark:text-[#A3A3A3]">
                      {day.date}
                    </span>
                    <div className="h-2.5 overflow-hidden rounded-xs bg-[#F8F8F8] dark:bg-[#1A1A1A]">
                      <div
                        className="h-full bg-[#111111] dark:bg-white"
                        style={{ width: `${Math.round((day.views / maxDaily) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono-tabular text-right font-medium text-[#111111] dark:text-white">
                      {day.views}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[#707070] uppercase dark:text-[#A3A3A3]">
                Top Paths
              </h3>
              <div className="divide-y divide-[#EAEAEA] rounded-[6px] border border-[#EAEAEA] dark:divide-[#222222] dark:border-[#222222]">
                {data.topPaths.map((row) => (
                  <div
                    key={row.path}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-xs"
                  >
                    <span className="font-mono-tabular truncate text-[#111111] dark:text-white">
                      {row.path}
                    </span>
                    <span className="font-mono-tabular shrink-0 font-semibold text-[#111111] dark:text-white">
                      {row.views}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminPanelCard>
    </div>
  );
}
