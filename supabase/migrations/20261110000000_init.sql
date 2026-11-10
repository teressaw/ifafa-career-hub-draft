-- IFAFA Career Hub — initial schema with row-level security.
-- Run once in the Supabase SQL editor (or with `supabase db push`).
--
-- Security model
--   * Visitors (anon) can read PUBLISHED listings only, and only the public columns.
--   * Signed-in users can do nothing extra unless they are listed in public.admin_users.
--   * Editors (admin_users.role = 'editor') can create, edit, verify, publish and archive listings.
--   * Admins (role = 'admin') can also permanently delete listings.
--   * Volunteers are added to admin_users by a project owner in the SQL editor — never through the app.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- Volunteers allowed to manage listings
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'editor' check (role in ('editor', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- SECURITY DEFINER so policies can check membership without exposing admin_users to everyone.
create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'admin');
$$;

revoke all on function public.is_editor() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_editor() to authenticated, anon;
grant execute on function public.is_admin() to authenticated, anon;

-- Volunteers can see their own membership (so the app can show who they are); admins can see all.
create policy "Read own membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
-- No insert/update/delete policies: membership is managed by the project owner only.
revoke insert, update, delete on public.admin_users from anon, authenticated;
revoke all on public.admin_users from anon;

-- ---------------------------------------------------------------- Opportunities
create table public.opportunities (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 140),
  employer         text not null check (char_length(employer) between 2 and 120),
  programme_name   text not null check (char_length(programme_name) between 2 and 160),
  summary          text not null check (char_length(summary) between 10 and 300),
  description      text not null check (char_length(description) between 20 and 6000),
  eligibility      text check (char_length(eligibility) <= 3000),
  duration         text check (char_length(duration) <= 200),
  compensation     text check (char_length(compensation) <= 300),
  location         text not null check (char_length(location) between 2 and 120),
  region           text not null check (region in ('dublin','cork','galway','limerick','waterford','other-ireland','anywhere-ireland','multiple')),
  work_arrangement text not null check (work_arrangement in ('remote','hybrid','onsite','not-specified')),
  programme_type   text not null check (programme_type in ('returnship','reentry','flexible-role','training','mentoring','job')),
  career_break     text not null check (career_break in ('designed-for-returners','breaks-welcome','not-specified')),
  sector           text not null check (sector in ('technology','finance','legal','public-sector','health','education','communications','engineering','nonprofit','business','other')),
  opens_on         date,
  closes_on        date,
  dates_verified   boolean not null default false,
  recorded_status  text check (recorded_status in ('open','upcoming','closed')),
  application_url  text check (application_url ~* '^https?://'),
  source_url       text not null check (source_url ~* '^https?://'),
  last_verified_on date,
  verified_by      uuid references auth.users (id) on delete set null,
  publication      text not null default 'draft' check (publication in ('draft','published','archived')),
  is_example       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by       uuid references auth.users (id) on delete set null,

  -- Never show dates nobody has confirmed: dates may only be stored when marked as verified.
  constraint dates_only_when_verified check (dates_verified or (opens_on is null and closes_on is null)),
  constraint verified_dates_present  check (not dates_verified or opens_on is not null or closes_on is not null),
  constraint dates_in_order          check (opens_on is null or closes_on is null or closes_on >= opens_on)
);

create index opportunities_publication_idx on public.opportunities (publication);
create index opportunities_closes_on_idx on public.opportunities (closes_on);

-- Keep audit fields honest: set by the database, not the client.
create or replace function public.opportunities_audit() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.created_by := auth.uid();
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;
create trigger opportunities_audit before insert or update on public.opportunities
  for each row execute function public.opportunities_audit();

alter table public.opportunities enable row level security;

create policy "Public reads published listings" on public.opportunities
  for select to anon, authenticated using (publication = 'published' or public.is_editor());
create policy "Editors create listings" on public.opportunities
  for insert to authenticated with check (public.is_editor());
create policy "Editors update listings" on public.opportunities
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Admins delete listings" on public.opportunities
  for delete to authenticated using (public.is_admin());

-- Column-level privileges: visitors can never read internal audit columns, and can never write.
revoke all on public.opportunities from anon;
grant select (id, slug, employer, programme_name, summary, description, eligibility, duration, compensation,
              location, region, work_arrangement, programme_type, career_break, sector, opens_on, closes_on,
              dates_verified, recorded_status, application_url, source_url, last_verified_on, publication,
              is_example, updated_at) on public.opportunities to anon;
grant select, insert, update, delete on public.opportunities to authenticated;
