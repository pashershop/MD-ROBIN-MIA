# MD ROBIN MIA — Cloudflare CMS & Admin Dashboard Setup Guide

This guide covers deploying the full-stack CMS (`Cloudflare Pages` + `Cloudflare Workers` + `Cloudflare D1` + optional `Cloudflare R2`) for `https://mdrobinmia.pages.dev`.

---

## 1. Architecture Overview

- **Frontend Public & Admin App (`/src`, Vite React SPA)**: Deployed to Cloudflare Pages (`npm run build` -> `dist/`).
  - Public routes (`/`, `/about`, `/skills`, `/projects`, `/projects/:slug`, `/achievements`, `/blog`, `/blog/category/:slug`, `/blog/:slug`, `/contact`, `/p/:slug`) hydrate live from `/api/v1/public/bootstrap` and fall back gracefully to local static defaults during offline/static previews.
  - Private Admin CMS routes (`/admin/setup`, `/admin/login`, `/admin`, `/admin/dashboard`) are hidden from public navigation/footer/sitemap and marked `noindex, nofollow`.
- **Pages Service Binding Proxy (`/functions/api/[[path]].ts`)**: Forwards `/api/*` requests from `https://mdrobinmia.pages.dev/api/*` directly to the Worker via an `API_WORKER` Service Binding (or `API_ORIGIN`), keeping admin session cookies strictly first-party (`SameSite=Lax`, `HttpOnly`, `Secure`).
- **CMS API Worker (`/worker/src/index.ts`)**: Runs on Cloudflare Workers with Cloudflare D1 (`DB` binding) and optional Cloudflare R2 (`MEDIA_BUCKET` binding).

---

## 2. Provision Cloudflare D1 & Apply Migrations

Authenticate Wrangler locally:

```bash
npx wrangler login
```

Create the D1 database:

```bash
npx wrangler d1 create mrm-cms-db
```

Copy the returned `database_id` into `worker/wrangler.jsonc` (`REPLACE_WITH_D1_DATABASE_ID`).

Apply the relational schema and idempotent initial seed remotely (and optionally locally for dev):

```bash
# Production remote D1
npx wrangler d1 execute mrm-cms-db --remote --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute mrm-cms-db --remote --file=./migrations/0002_seed_verified_content.sql

# Local Wrangler D1 dev
npx wrangler d1 execute mrm-cms-db --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute mrm-cms-db --local --file=./migrations/0002_seed_verified_content.sql
```

---

## 3. Configure Secrets & Deploy the API Worker

Set the one-time setup secret (never committed to Git):

```bash
npx wrangler secret put ADMIN_BOOTSTRAP_SECRET --config worker/wrangler.jsonc
```

Generate a strong secret beforehand, e.g.:

```bash
openssl rand -hex 32
```

Deploy the Worker:

```bash
npx wrangler deploy --config worker/wrangler.jsonc
```

---

## 4. Connect Cloudflare Pages (`mdrobinmia.pages.dev`)

### Option A (Recommended): First-Party Service Binding (`SameSite=Lax`)

1. In Cloudflare Dashboard -> **Workers & Pages** -> **mdrobinmia** (Pages project) -> **Settings** -> **Functions** -> **Service bindings**:
   - **Variable name**: `API_WORKER`
   - **Service**: `mrm-cms-api`
2. Keep `VITE_API_BASE_URL` unset/empty in Pages environment variables so requests go to `/api/v1/*` on the exact same domain (`https://mdrobinmia.pages.dev/api/v1/*`), handled seamlessly by `functions/api/[[path]].ts`.
3. Keep `COOKIE_SAMESITE: "Lax"` in `worker/wrangler.jsonc`.

### Option B: Direct Cross-Origin Worker URL (`SameSite=None`)

If deploying the frontend to a separate origin without Pages Functions:
1. Set `VITE_API_BASE_URL=https://mrm-cms-api.<your-subdomain>.workers.dev` in Pages build environment variables.
2. Add your Pages origin to `ALLOWED_ORIGINS` in `worker/wrangler.jsonc`.
3. Change `COOKIE_SAMESITE` to `"None"` in `worker/wrangler.jsonc` and redeploy the Worker.

---

## 5. Optional: Enable Cloudflare R2 Direct Image Uploads

1. Create an R2 bucket:

```bash
npx wrangler r2 bucket create mrm-media
```

2. Uncomment the `r2_buckets` block in `worker/wrangler.jsonc` (`"binding": "MEDIA_BUCKET"`, `"bucket_name": "mrm-media"`).
3. Redeploy the Worker (`npx wrangler deploy --config worker/wrangler.jsonc`).
4. Direct `PNG`/`JPEG`/`WebP`/`SVG` uploads (up to 5 MB) in `/admin` -> **Media Library** activate automatically. Until bound, admins can register external `https://` image URLs safely in D1.

---

## 6. First-Time Admin Bootstrap (`/admin/setup`)

1. Open `https://mdrobinmia.pages.dev/admin/setup` directly in your browser.
2. Enter:
   - Your `ADMIN_BOOTSTRAP_SECRET`
   - Display Name (e.g., `MD Robin Mia`)
   - Admin Email
   - Strong password (12+ characters with uppercase, lowercase, and numbers)
3. Submit to create your salted PBKDF2-SHA256 admin account and start an authenticated session.
4. Once one admin exists, `/api/v1/auth/setup` permanently locks itself (`403`) — further logins happen at `/admin/login`.

---

## 7. Backups & Recovery

- **In-Dashboard**: Open `/admin` -> **Overview** or **Website Settings** -> **Export JSON Backup**.
- **CLI D1 Export**:

```bash
npx wrangler d1 export mrm-cms-db --remote --output=./mrm-cms-backup.sql
```

- **Test Suite Verification**:

```bash
npx tsx --test tests/cms.test.ts
npx tsc -p worker/tsconfig.json --noEmit
npm run lint
npm run build
```
