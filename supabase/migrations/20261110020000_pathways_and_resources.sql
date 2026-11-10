-- 1. Can a listing be done while living outside Ireland? Drives the homepage "I'm living overseas" path.
--    Existing listings become 'not-stated' — nothing is assumed.
alter table public.opportunities
  add column abroad_eligibility text not null default 'not-stated'
  check (abroad_eligibility in ('yes','no','not-stated'));
grant select (abroad_eligibility) on public.opportunities to anon;

-- 2. Events, career support and practical resources, curated by volunteers with the same rules as listings:
--    an official source link, a last-verified date, drafts until published, and no unconfirmed dates.
create table public.resources (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null check (kind in ('event','support','resource')),
  title            text not null check (char_length(title) between 3 and 160),
  provider         text not null check (char_length(provider) between 2 and 120),
  summary          text not null check (char_length(summary) between 10 and 400),
  details          text check (char_length(details) <= 4000),
  url              text not null check (url ~ '^https?://[^\s]+$' and char_length(url) <= 2000),
  -- Which homepage paths this is relevant to (abroad / return / restart). Empty = all.
  audiences        text[] not null default '{}' check (audiences <@ array['abroad','return','restart']::text[]),
  cost             text not null default 'not-stated' check (cost in ('free','funded','paid','not-stated')),
  format           text not null default 'not-stated' check (format in ('online','in-person','hybrid','not-stated')),
  location         text check (char_length(location) <= 120),
  -- Events only. Stored only when a volunteer confirmed it at the source.
  event_date       date,
  event_time       text check (char_length(event_time) <= 60),
  date_verified    boolean not null default false,
  last_verified_on date,
  publication      text not null default 'draft' check (publication in ('draft','published','archived')),
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id) on delete set null,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users(id) on delete set null,
  constraint resource_date_only_when_verified check (date_verified or (event_date is null and event_time is null)),
  constraint resource_date_only_for_events check (kind = 'event' or (event_date is null and event_time is null and not date_verified)),
  constraint resource_verified_date_present check (not date_verified or event_date is not null)
);
create index resources_kind_idx on public.resources (kind, publication);

create or replace function public.resources_audit() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then new.created_at := now(); new.created_by := auth.uid();
  else new.created_at := old.created_at; new.created_by := old.created_by; end if;
  return new;
end;
$$;
create trigger resources_audit before insert or update on public.resources
  for each row execute function public.resources_audit();

alter table public.resources enable row level security;
create policy "Public reads published resources" on public.resources
  for select to anon, authenticated using (publication = 'published' or public.is_editor());
create policy "Editors create resources" on public.resources
  for insert to authenticated with check (public.is_editor());
create policy "Editors update resources" on public.resources
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Admins delete resources" on public.resources
  for delete to authenticated using (public.is_admin());

revoke all on public.resources from anon;
grant select (id, kind, title, provider, summary, details, url, audiences, cost, format, location,
              event_date, event_time, date_verified, last_verified_on, publication, updated_at) on public.resources to anon;
grant select, insert, update, delete on public.resources to authenticated;
