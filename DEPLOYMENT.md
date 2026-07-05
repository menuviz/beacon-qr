# Beacon Deployment (Cloudflare Workers)

Beacon runs as the Cloudflare Worker **`beacon-qr`** at **qr.menuviz.app**,
built with `@opennextjs/cloudflare` (see `wrangler.jsonc`). It shares the
MenuViz Supabase project (`nsqxweafdelhcrneptzc`) with menuviz-admin; its
tables (`qr_codes`, `scans`) have RLS enabled with **no policies**, so they are
reachable only through the server-side secret key — never the publishable key.

## CI

`.github/workflows/ci.yml`: every push/PR runs lint and the OpenNext worker
build; pushes to `main` deploy the worker; PRs get a `*.workers.dev` preview
URL comment.

GitHub **secrets**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
Repo **variables** (inlined at build time): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SITE_URL` (baked into printed QR images — must stay
`https://qr.menuviz.app`).

## Worker secrets (runtime)

Set with `bunx wrangler secret put <NAME>`:

- `SUPABASE_SECRET_KEY` — Supabase dashboard → Project Settings → API keys
- `ADMIN_USER` / `ADMIN_PASS` — dashboard login
- `ADMIN_SESSION_SECRET` — session cookie value
- `PROGRAM_PASSCODE` — required to (re)program a code from `/r/{id}`

## Schema

`supabase-schema.sql` is the reference; the live project was migrated with an
RLS-hardened version of it (`beacon_qr_schema` migration). Scan geo (country,
city) comes from Cloudflare's `request.cf` via the OpenNext adapter — no
Vercel geo headers, no managed transforms needed.

## Manual deploy

```bash
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SITE_URL=https://qr.menuviz.app \
  bun run deploy
```

## Smoke test

Sign in at qr.menuviz.app, generate a blank code, open `/print`, scan the QR
with a phone. Enter the programming passcode, a label, and a destination URL.
Scan again: it should redirect and show up in analytics.
