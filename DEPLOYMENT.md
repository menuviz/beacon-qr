# Beacon Deployment Walkthrough

## 1. Create Supabase

Go to Supabase, create a new project, and wait for it to finish provisioning. Open Project Settings, then API. Copy the project URL and the service role key.

## 2. Run The Database Schema

In Supabase, open SQL Editor, create a new query, paste the contents of `supabase-schema.sql`, and run it once. This creates the QR code table, scan log table, index, and dashboard stats view.

## 3. Put The Code On GitHub

Create a new GitHub repository for Beacon. From this `beacon` folder, commit the project and push it to that repository.

## 4. Import Into Vercel

In Vercel, choose Add New Project, import the GitHub repository, and keep the default Next.js settings.

## 5. Set Environment Variables

In the Vercel project settings, add:

```bash
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
PROGRAM_PASSCODE
NEXT_PUBLIC_SITE_URL
```

Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL for the app, such as `https://your-project.vercel.app`. This value is baked into printed QR images, so it must be the public URL people can scan.

## 6. Deploy And Test

Deploy the project. Visit the Vercel URL, generate one blank code, open `/print`, and scan the QR with a phone camera. Enter the programming passcode, a label, and a destination URL. Scan the same QR again; it should redirect to the destination and appear in analytics.
