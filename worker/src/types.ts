export interface D1Meta {
  changed_db?: boolean;
  changes?: number;
  duration?: number;
  last_row_id?: number;
  rows_read?: number;
  rows_written?: number;
}

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: D1Meta;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface R2ObjectBody {
  body: ReadableStream<Uint8Array>;
  size: number;
  etag: string;
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
}

export interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | ReadableStream<Uint8Array> | Blob,
    options?: {
      httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
      };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(keys: string | string[]): Promise<void>;
}

export interface WorkerEnv {
  DB: D1Database;
  MEDIA_BUCKET?: R2Bucket;
  ADMIN_BOOTSTRAP_SECRET?: string;
  ALLOWED_ORIGINS?: string;
  CANONICAL_SITE_URL?: string;
  COOKIE_SAMESITE?: string;
  R2_PUBLIC_BASE_URL?: string;
}

export interface AdminRecord {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  bio: string;
  role: string;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedContext {
  admin: {
    id: string;
    email: string;
    displayName: string;
    bio: string;
    role: string;
    lastLoginAt: string | null;
  };
  sessionId: string;
  csrfTokenHash: string;
}
