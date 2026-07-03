# Beacon

Beacon prints QR codes before you know where they should go. Each QR points back to `/r/{id}` in this app, where the current destination is looked up at scan time and can be changed later without reprinting.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
PROGRAM_PASSCODE=field-programming-passcode
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. In Supabase, open the SQL editor and run `supabase-schema.sql`.

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`. The dashboard, print sheet, and analytics pages are currently open while this MVP is being tested. Public scan URLs under `/r/*` are also open, and destination writes still require `PROGRAM_PASSCODE`.

## Security Notes

Beacon is intentionally MVP-simple. The dashboard is currently open while the app is being tested, and field programming writes are protected with one shared `PROGRAM_PASSCODE`. A production version should add dashboard authentication before sharing the URL broadly, especially if multiple operators need separate access or if code-level audit history matters.

All Supabase access uses the Supabase secret key on the server only. Do not expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in client components or browser code.
