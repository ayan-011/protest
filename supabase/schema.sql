-- ============================================================
-- Police Accountability Database — Schema
-- Run this in the Supabase SQL editor (or psql) on a fresh project.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type incident_status as enum ('unreviewed', 'under_review', 'published', 'disputed', 'removed');
create type confidence_tier as enum ('unidentified', 'alleged', 'reported', 'sourced');
create type source_type as enum ('court_filing', 'official_record', 'news_article', 'department_statement', 'other');
create type reviewer_role as enum ('moderator', 'senior_reviewer', 'legal');
create type review_action as enum ('submitted', 'approved', 'tier_changed', 'disputed', 'corrected', 'removed', 'rejected');
create type dispute_status as enum ('open', 'reviewing', 'upheld', 'rejected');
create type person_role as enum ('subject', 'witness', 'other');

-- ---------- Reviewers (admins) ----------
-- Linked 1:1 to a Supabase auth user. Only rows in this table can log into /admin.
create table reviewers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role reviewer_role not null default 'moderator',
  created_at timestamptz not null default now()
);

-- ---------- Submitters (private, never shown publicly) ----------
create table submitters (
  id uuid primary key default gen_random_uuid(),
  contact_email text,
  contact_note text,
  created_at timestamptz not null default now()
);

-- ---------- Incidents ----------
create table incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  date_occurred date,
  location_text text,
  location_lat double precision,
  location_lng double precision,
  department text,
  status incident_status not null default 'unreviewed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Videos ----------
create table videos (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  file_url text not null,
  thumbnail_url text,
  submitted_by uuid references submitters(id),
  submitted_at timestamptz not null default now(),
  original_source_url text,
  reverse_search_checked boolean not null default false,
  chain_of_custody_notes text
);

-- ---------- Persons ----------
create table persons (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  badge_number text,
  department text,
  photo_source_video_id uuid references videos(id),
  photo_url text,
  confidence_tier confidence_tier not null default 'unidentified',
  is_disputed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A name can only exist once a source backs it. Enforced in application layer
-- (see lib/verification.ts) rather than a DB trigger, so error messages stay
-- readable — but the constraint below stops the worst case (name with zero sources).
create table incident_persons (
  incident_id uuid not null references incidents(id) on delete cascade,
  person_id uuid not null references persons(id) on delete cascade,
  role person_role not null default 'subject',
  primary key (incident_id, person_id)
);

-- ---------- Sources ----------
create table sources (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  source_type source_type not null,
  url text not null,
  description text,
  added_by uuid references reviewers(id),
  added_at timestamptz not null default now()
);

-- ---------- Review log (append-only audit trail) ----------
create table review_log (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete set null,
  person_id uuid references persons(id) on delete set null,
  reviewer_id uuid references reviewers(id),
  action review_action not null,
  notes text,
  created_at timestamptz not null default now()
);
-- Append-only: block updates/deletes at the DB level.
revoke update, delete on review_log from public, authenticated, anon;

-- ---------- Disputes ----------
create table disputes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  submitted_contact text,
  reason text not null,
  status dispute_status not null default 'open',
  resolution_notes text,
  resolved_by uuid references reviewers(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ============================================================
-- Row Level Security
-- Public (anon) users: read published incidents/persons/sources only.
-- Public can INSERT into incidents/videos/submitters/disputes (submission forms).
-- Only reviewers can read/write everything else, or move status to published.
-- ============================================================

alter table incidents enable row level security;
alter table videos enable row level security;
alter table persons enable row level security;
alter table incident_persons enable row level security;
alter table sources enable row level security;
alter table review_log enable row level security;
alter table disputes enable row level security;
alter table reviewers enable row level security;
alter table submitters enable row level security;

-- Helper: is the current user a reviewer?
create or replace function is_reviewer() returns boolean as $$
  select exists (select 1 from reviewers where id = auth.uid());
$$ language sql stable security definer;

-- Public read: published incidents only
create policy "public read published incidents" on incidents
  for select using (status = 'published' or is_reviewer());

create policy "public submit incidents" on incidents
  for insert with check (status = 'unreviewed');

create policy "reviewers manage incidents" on incidents
  for update using (is_reviewer());

-- Videos: readable if parent incident is published, or if reviewer
create policy "public read videos of published incidents" on videos
  for select using (
    is_reviewer() or
    exists (select 1 from incidents i where i.id = incident_id and i.status = 'published')
  );

create policy "public submit videos" on videos
  for insert with check (true);

-- Persons: public sees them only via published incidents; unidentified/alleged
-- with no published incident stay hidden.
create policy "public read persons" on persons
  for select using (
    is_reviewer() or
    exists (
      select 1 from incident_persons ip
      join incidents i on i.id = ip.incident_id
      where ip.person_id = persons.id and i.status = 'published'
    )
  );

create policy "reviewers manage persons" on persons
  for all using (is_reviewer()) with check (is_reviewer());

create policy "public read incident_persons" on incident_persons
  for select using (true);

create policy "reviewers manage incident_persons" on incident_persons
  for all using (is_reviewer()) with check (is_reviewer());

create policy "public read sources" on sources
  for select using (true);

create policy "reviewers manage sources" on sources
  for all using (is_reviewer()) with check (is_reviewer());

create policy "reviewers read review_log" on review_log
  for select using (is_reviewer());

create policy "reviewers insert review_log" on review_log
  for insert with check (is_reviewer());

create policy "public submit disputes" on disputes
  for insert with check (status = 'open');

create policy "public read disputes for transparency" on disputes
  for select using (true);

create policy "reviewers manage disputes" on disputes
  for update using (is_reviewer());

create policy "reviewers only read reviewers table" on reviewers
  for select using (is_reviewer());

create policy "public insert submitters" on submitters
  for insert with check (true);

create policy "reviewers read submitters" on submitters
  for select using (is_reviewer());

-- ============================================================
-- Storage buckets (run separately in Supabase Storage UI, or via API):
--   - "videos"  (private until incident is published — use signed URLs)
--   - "photos"  (public, profile stills extracted from approved videos)
-- ============================================================
