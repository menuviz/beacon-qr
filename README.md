# Beacon

Beacon prints QR codes before you know where they should go. Each QR points back to `/r/{id}` in this app, where the current destination is looked up at scan time and can be changed later without reprinting.

## Local Setup

1. Enter the dev shell and install dependencies (nix provides bun):

```bash
nix develop   # or nix-shell
bun install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
PROGRAM_PASSCODE=field-programming-passcode
ADMIN_USER=owner
ADMIN_PASS=dashboard-password
ADMIN_SESSION_SECRET=another-long-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. In Supabase, open the SQL editor and run `supabase-schema.sql`.

4. Start the app:

```bash
bun run dev
```

Open `http://localhost:3000` and sign in with `ADMIN_USER` and `ADMIN_PASS`. The dashboard, print sheet, CSV export, and analytics pages are protected by this login. Public scan URLs under `/r/*` stay open, and destination writes still require `PROGRAM_PASSCODE`.

## Security Notes

Beacon is intentionally MVP-simple. The owner dashboard uses one shared login, and field programming writes are protected with one shared `PROGRAM_PASSCODE`. A future version should add per-user accounts if multiple operators need separate access or if code-level audit history matters.

All Supabase access uses the Supabase secret key on the server only. Do not expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in client components or browser code.
