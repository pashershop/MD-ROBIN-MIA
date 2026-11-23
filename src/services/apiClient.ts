import type {
  AdminUser,
  AnalyticsSummary,
  ContactMessageItem,
  DashboardOverview,
  MediaItem,
  SiteContentData,
} from '../types/content';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// Stored strictly in memory (never localStorage/sessionStorage)
let inMemoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  inMemoryCsrfToken = token;
}

export function getCsrfToken(): string | null {
  return inMemoryCsrfToken;
}

export class ApiError extends Error {
  status: number;
  code: string;
  isNetworkError: boolean;

  constructor(message: string, status = 500, code = 'API_ERROR', isNetworkError = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.isNetworkError = isNetworkError;
  }
}

async function requestJson<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number; bootstrapSecret?: string } = {},
): Promise<T> {
  const { timeoutMs = 10000, bootstrapSecret, headers: customHeaders, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(customHeaders);
  if (!(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryCsrfToken) {
    headers.set('X-CSRF-Token', inMemoryCsrfToken);
  }
  if (bootstrapSecret) {
    headers.set('X-Bootstrap-Secret', bootstrapSecret);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new ApiError(
      err instanceof Error ? err.message : 'Unable to reach CMS API server.',
      0,
      'NETWORK_ERROR',
      true,
    );
  } finally {
    clearTimeout(timer);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(`Server responded with ${response.status}`, response.status, 'HTTP_ERROR');
    }
    throw new ApiError(
      'CMS API returned non-JSON response (static preview or unbound Worker).',
      response.status || 503,
      'NON_JSON_RESPONSE',
      true,
    );
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok || data.ok === false) {
    throw new ApiError(
      typeof data.error === 'string' ? data.error : `Request failed (${response.status})`,
      response.status,
      typeof data.code === 'string' ? data.code : 'API_ERROR',
      response.status === 503 && data.code === 'API_WORKER_UNBOUND',
    );
  }

  return data as T;
}

export const apiClient = {
  // Public
  fetchPublicBootstrap: () =>
    requestJson<{ ok: true; data: SiteContentData }>('/api/v1/public/bootstrap', {
      method: 'GET',
      timeoutMs: 4500,
    }),

  submitContactMessage: (payload: {
    fullName: string;
    email: string;
    subject: string;
    message: string;
    honeypot: string;
  }) =>
    requestJson<{ ok: true; id: string; message: string }>('/api/v1/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  trackPageView: (path: string, contentType = 'page', contentSlug = '') => {
    if (typeof window === 'undefined') return;
    if (path.startsWith('/admin') || path.startsWith('/content-schema')) return;
    fetch(`${API_BASE_URL}/api/v1/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, contentType, contentSlug }),
      keepalive: true,
    }).catch(() => {
      // ignore offline analytics errors cleanly
    });
  },

  // Auth
  getAuthStatus: () =>
    requestJson<{
      ok: true;
      adminConfigured: boolean;
      authenticated: boolean;
      bootstrapConfigured: boolean;
      r2Configured: boolean;
    }>('/api/v1/auth/status', { method: 'GET' }),

  setupAdmin: async (payload: {
    bootstrapSecret: string;
    displayName: string;
    email: string;
    password: string;
  }) => {
    const res = await requestJson<{ ok: true; csrfToken: string; admin: AdminUser }>(
      '/api/v1/auth/setup',
      {
        method: 'POST',
        bootstrapSecret: payload.bootstrapSecret,
        body: JSON.stringify({
          displayName: payload.displayName,
          email: payload.email,
          password: payload.password,
        }),
      },
    );
    setCsrfToken(res.csrfToken);
    return res;
  },

  login: async (email: string, password: string) => {
    const res = await requestJson<{ ok: true; csrfToken: string; admin: AdminUser }>(
      '/api/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    );
    setCsrfToken(res.csrfToken);
    return res;
  },

  getMe: async () => {
    const res = await requestJson<{ ok: true; csrfToken: string; admin: AdminUser }>(
      '/api/v1/auth/me',
      { method: 'GET' },
    );
    setCsrfToken(res.csrfToken);
    return res;
  },

  logout: async () => {
    try {
      await requestJson<{ ok: true }>('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setCsrfToken(null);
    }
  },

  logoutAll: async () => {
    try {
      await requestJson<{ ok: true }>('/api/v1/auth/logout-all', { method: 'POST' });
    } finally {
      setCsrfToken(null);
    }
  },

  updateProfile: (payload: { displayName: string; email: string; bio: string }) =>
    requestJson<{ ok: true; admin: AdminUser }>('/api/v1/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions: boolean;
  }) =>
    requestJson<{ ok: true }>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Dashboard & Analytics
  getDashboard: () => requestJson<{ ok: true } & DashboardOverview>('/api/v1/admin/dashboard'),
  getAnalytics: (days = 30) =>
    requestJson<{ ok: true } & AnalyticsSummary>(`/api/v1/admin/analytics?days=${days}`),
  exportBackup: () => requestJson<Record<string, unknown>>('/api/v1/admin/export'),

  // Generic CRUD helper for Admin modules
  getAdminList: <T = Record<string, unknown>>(resource: string) =>
    requestJson<{ ok: true; items: T[] }>(`/api/v1/admin/${resource}`),
  createAdminItem: (resource: string, payload: unknown) =>
    requestJson<{ ok: true; id: string; slug?: string }>(`/api/v1/admin/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAdminItem: (resource: string, id: string, payload: unknown) =>
    requestJson<{ ok: true }>(`/api/v1/admin/${resource}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAdminItem: (resource: string, id: string) =>
    requestJson<{ ok: true }>(`/api/v1/admin/${resource}/${id}`, { method: 'DELETE' }),
  duplicateAdminItem: (resource: string, id: string) =>
    requestJson<{ ok: true; id: string; slug?: string }>(`/api/v1/admin/${resource}/${id}/duplicate`, {
      method: 'POST',
    }),
  reorderAdminItems: (resource: string, orderedIds: string[]) =>
    requestJson<{ ok: true }>(`/api/v1/admin/${resource}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),

  // Homepage Sections
  getHomepageSections: () =>
    requestJson<{ ok: true; items: Array<Record<string, unknown>> }>('/api/v1/admin/homepage-sections'),
  saveHomepageSections: (items: Array<Record<string, unknown>>) =>
    requestJson<{ ok: true }>('/api/v1/admin/homepage-sections', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),

  // Categories & Tags
  getCategoriesAndTags: () =>
    requestJson<{
      ok: true;
      categories: Array<Record<string, unknown>>;
      tags: Array<{ id: string; slug: string; name: string }>;
    }>('/api/v1/admin/categories'),

  // Settings
  getSettings: () =>
    requestJson<{ ok: true; settings: Record<string, unknown> }>('/api/v1/admin/settings'),
  saveSettings: (payload: Record<string, unknown>) =>
    requestJson<{ ok: true }>('/api/v1/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Media
  getMedia: () =>
    requestJson<{ ok: true; r2Configured: boolean; items: MediaItem[] }>('/api/v1/admin/media'),
  uploadMediaFile: (file: File, altText: string, caption: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('altText', altText);
    fd.append('caption', caption);
    return requestJson<{ ok: true; item: MediaItem }>('/api/v1/admin/media/upload', {
      method: 'POST',
      body: fd,
    });
  },
  addExternalMedia: (payload: {
    publicUrl: string;
    fileName?: string;
    altText: string;
    caption: string;
  }) =>
    requestJson<{ ok: true; item: MediaItem }>('/api/v1/admin/media/external', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Project Gallery
  addProjectImage: (
    projectId: string,
    payload: { imageUrl: string; altText: string; caption: string; mediaId?: string },
  ) =>
    requestJson<{ ok: true; id: string }>(`/api/v1/admin/projects/${projectId}/images`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteProjectImage: (projectId: string, imageId: string) =>
    requestJson<{ ok: true }>(`/api/v1/admin/projects/${projectId}/images/${imageId}`, {
      method: 'DELETE',
    }),

  // Messages
  getMessages: (status = 'all') =>
    requestJson<{ ok: true; items: ContactMessageItem[] }>(
      `/api/v1/admin/messages?status=${encodeURIComponent(status)}`,
    ),
};
