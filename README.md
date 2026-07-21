# The Record — Police Accountability Archive

A Next.js + Supabase site implementing a documented, tiered-verification
accountability archive: public video submissions go through admin review,
identifications are labeled by evidence strength (unidentified → alleged →
reported → sourced), and every reviewer action is logged.

## Stack
- **Frontend/backend:** Next.js 15 (App Router, Server Actions)
- **Database + Auth + Storage:** Supabase (Postgres + RLS)
- **Hosting:** Vercel (frontend) — Supabase is already hosted

## 1. Create a Supabase project
1. Go to https://supabase.com → New project.
2. Once it's provisioned, go to **SQL Editor** and run the entire contents
   of `supabase/schema.sql`. This creates all tables, enums, and Row Level
   Security policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

## 2. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in the two values from
step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Create storage buckets
In Supabase, go to **Storage** and create two buckets:
- `videos` — set to **public** for now (simplest option for a v1; see
  "Hardening ideas" below for making unpublished footage private)
- `photos` — public

## 4. Create your first reviewer account
Reviewer accounts are **not** self-service signup on purpose — you create
them manually so random people can't grant themselves moderation power.

1. In Supabase, go to **Authentication → Users → Add user**. Set an email
   and password.
2. Copy that user's UUID.
3. In the **SQL Editor**, run:
   ```sql
   insert into reviewers (id, name, role)
   values ('paste-the-uuid-here', 'Your Name', 'senior_reviewer');
   ```
4. You can now log in at `/admin/login` with that email/password.

To add more reviewers later, repeat this process (create the auth user in
the dashboard, then insert a matching row in `reviewers`).

## 5. Run locally
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`.

## 6. Deploy
1. Push this repo to GitHub.
2. Import it into Vercel (vercel.com → New Project).
3. Add the same two environment variables in Vercel's project settings.
4. Deploy.

## How the review workflow works
1. Someone submits a video at `/submit`. This creates an `incidents` row
   with `status = 'unreviewed'` — **not public**.
2. A reviewer logs in at `/admin`, sees it in the queue, and opens it.
3. The reviewer can:
   - Add people involved, with **sources** for any name (court filing,
     official record, department statement, news article). The system
     computes the confidence tier automatically from what's actually
     attached — a reviewer cannot manually promote someone to "Sourced"
     without two independent, qualifying sources.
   - Mark whether footage was reverse-search checked.
   - Publish the incident, or reject it with a note.
4. Published incidents and person profiles become visible at `/incidents`
   and `/persons/[id]`.
5. Anyone can dispute an identification from a person's profile. Disputes
   land in the admin queue; resolving one either flags the profile as
   disputed (visible publicly) or dismisses the dispute.
6. Every publish/reject/tier-change/dispute action is written to
   `review_log`, which is append-only (no update/delete permissions), so
   there's a durable audit trail of who did what.

## Before you launch — things this starter does NOT handle for you
This is a working scaffold, not a launch-ready product. Before taking this
live, you should:

- **Get legal review of your publication policy**, especially the
  "Alleged" and "Reported" tiers — defamation exposure varies by
  jurisdiction and you should not treat this README as legal advice.
- **Write real Terms of Service and a takedown/correction policy**, and
  link them from the footer.
- **Decide your moderation capacity** before launch — an unreviewed queue
  that never gets touched undermines the whole premise.
- **Harden video storage.** The current setup makes the `videos` bucket
  public for simplicity. For a real deployment, consider making it
  private and serving unpublished footage only via signed URLs generated
  server-side for reviewers.
- **Add rate limiting / spam protection** on the public submission and
  dispute forms (e.g. Cloudflare Turnstile or similar) — right now
  anyone can submit unlimited entries.
- **Set a video size/length cap** — storage and bandwidth costs scale
  with upload volume; the submission form does not currently enforce a
  file size limit.
- **Review the RLS policies in `supabase/schema.sql` yourself** before
  going live. They're written to be conservative, but you (or someone
  you trust) should read and understand every policy, since they're what
  actually stands between "unreviewed" and "public."

## Project structure
```
app/
  page.tsx                  Homepage
  incidents/                Public archive + incident detail
  persons/[id]/             Person profile + dispute form
  submit/                   Public submission form
  methodology/              Public explanation of verification tiers
  admin/
    login/                  Reviewer login
    page.tsx                Review queue dashboard
    actions.ts              Server actions (all admin mutations + audit log)
    incidents/[id]/         Incident review UI (approve/reject, add people/sources)
    disputes/[id]/          Dispute resolution UI
lib/
  verification.ts           Tier-calculation rules (shared, pure functions)
  supabase-client.ts        Browser Supabase client
  supabase-server.ts        Server Supabase client (cookie-based auth)
middleware.ts                Protects /admin routes, refreshes session
supabase/schema.sql          Full DB schema + RLS policies
```
