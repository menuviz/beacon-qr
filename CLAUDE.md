# CLAUDE.md — qr.menuviz.app (Beacon)

> Operational context for Claude Code. Read this first, every session.

## What this repo is

**Beacon**: dynamic QR codes. Print a code before you know its destination —
`/r/{id}` looks up the current destination at scan time, logs the scan
(country/city/referrer/UA), and redirects. Repointing never needs a reprint.
Includes an owner dashboard (generate/label/delete codes, print sheet, CSV
export, per-code analytics) behind a single shared login.

Runs as Cloudflare Worker **`beacon-qr`** at **qr.menuviz.app** (OpenNext).
Plain JavaScript (no TS). See `DEPLOYMENT.md` for the deploy runbook.

## Architecture notes that will bite you

- **`src/middleware.js` must stay the deprecated `middleware` convention** —
  Next 16's `proxy.ts` runs on the Node runtime, which @opennextjs/cloudflare
  rejects. Same rule across all menuviz Next repos.
- **No `node:crypto` in middleware-imported code** (`src/lib/session.js` uses
  a TextEncoder-based constant-time compare) — middleware is Edge runtime.
- **Scan geo comes from `getCloudflareContext().cf`** (country + city) with a
  `cf-ipcountry` header fallback (`src/app/r/[id]/page.js`). No Vercel headers,
  no zone managed transforms.
- **Supabase access is server-only via the secret key** (`src/lib/supabase.js`).
  Its tables `qr_codes`/`scans` (+ `qr_stats` security-invoker view) have RLS
  enabled with **no policies** — the anon/publishable key sees nothing, on
  purpose: the shared project's publishable key is public via the other apps.
  Never add anon policies to these tables; never expose the secret key.
- Auth = `ADMIN_USER`/`ADMIN_PASS` + a session cookie (`ADMIN_SESSION_SECRET`);
  field reprogramming of a code requires `PROGRAM_PASSCODE`. All are **worker
  secrets** (`bunx wrangler secret put NAME`); local values live in
  `.env.local` (gitignored).

## The MenuViz org (which repo is which service)

Repos are named after the domain they serve. Local checkouts live side by side
in `~/menuviz-org/` (dir names predate the rename).

| GitHub repo | Local dir | Serves | Runs as | Service |
| --- | --- | --- | --- | --- |
| `menuviz.app` | `menuviz-web/` | menuviz.app, www | CF Pages `menuviz-web` | Marketing site (static) |
| `_.menuviz.app` | `menu-viz/` | `<brand>.menuviz.app` (wildcard) | Worker `menu-viz` | Diner app — brand landing at the subdomain root + 3D/AR branch menus at `/<branch>` |
| `admin.menuviz.app` | `menuviz-admin/` | admin.menuviz.app | Worker `menuviz-admin` | Admin panel (private repo) — brands/branches/menus CRUD + 3D model uploads |
| `qr.menuviz.app` | `beacon-qr/` | qr.menuviz.app | Worker `beacon-qr` | **This repo** — dynamic QR redirects + scan analytics |
| `.github` | `.github/` | github.com/menuviz | — | Org profile README |

### Shared infrastructure

- **Cloudflare**: account `09abb782bf38f116f993da799ee6e023`, zone menuviz.app
  `b2edc8a921ac1e85cfe3aa4cc3bb4e60`. Wildcard `*.menuviz.app` route → worker
  `menu-viz`; this repo's specific route `qr.menuviz.app/*` takes precedence.
  `cdn.menuviz.app` → worker `menuviz-cdn` over R2 `menuviz-assets` (3D models,
  brand-namespaced; allows empty-Referer fetches for AR viewers — never
  tighten).
- **Supabase** project `nsqxweafdelhcrneptzc`, shared: menu tables
  (brands/branches/dishes/branch_menu/models) are anon-read +
  authenticated-write; Beacon's tables are service-key-only (above).
- **Credentials**: Cloudflare API token in `menu-viz/.cf-token` (gitignored,
  **expires 2026-08-31 — rotate before then**). GitHub secrets
  `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` per repo; repo variables
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SITE_URL` here (SITE_URL is baked
  into printed QR images — must stay `https://qr.menuviz.app`).
- **Conventions (org-wide, locked)**: bun strictly (only `bun.lock`); nix dev
  shells are the source of truth (`nix develop`; the machine has no global
  node/bun); lefthook gates commits/pushes; CI deploys `main`, PRs get
  `*.workers.dev` preview deploys.

## Where to start (this repo)

```bash
nix develop        # bun + node (+ lefthook, installed on entry)
bun install
cp .env.example .env.local   # if .env.local doesn't exist; fill from Supabase
bun run dev        # http://localhost:3000
```

Gates: `bun run lint`; lefthook runs eslint on commit and `next build` on
push. CI (`.github/workflows/ci.yml`): lint + OpenNext worker build on PRs
(preview URL commented), deploy on `main`.

Map: `src/app/page.js` dashboard · `src/app/r/[id]/` scan/redirect + program
form · `src/app/api/program/route.js` programming API (passcode-gated PATCH) ·
`src/app/analytics/[id]/` per-code stats · `src/app/print/` print sheet ·
`src/lib/` supabase/session/actions · `supabase-schema.sql` reference schema
(live DB was migrated with an RLS-hardened version, migration
`beacon_qr_schema`).
