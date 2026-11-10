-- Watched sources and suggestions: lets volunteers see which official pages changed, and review
-- job details found on them. Nothing here is ever public. Nothing is published automatically:
-- a suggestion only becomes a listing when a volunteer saves it as a draft and then publishes it.

create table public.sources (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 160),
  url               text not null unique check (url ~ '^https?://[^\s]+$' and char_length(url) <= 2000),
  kind              text not null default 'programme-page' check (kind in ('programme-page','careers-page','directory','job-board')),
  notes             text check (char_length(notes) <= 1000),
  active            boolean not null default true,
  check_every_days  int not null default 7 check (check_every_days in (1,3,7,14,30)),
  last_checked_at   timestamptz,
  last_changed_at   timestamptz,
  last_status       text not null default 'not-checked' check (last_status in ('not-checked','unchanged','changed','error','blocked')),
  last_error        text check (char_length(last_error) <= 500),
  content_hash      text,
  snapshot          text check (char_length(snapshot) <= 200000),
  last_change       jsonb,
  created_at        timestamptz not null default now(),
  created_by        uuid default auth.uid() references auth.users(id) on delete set null
);

create table public.suggestions (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid references public.sources(id) on delete set null,
  url             text not null check (char_length(url) <= 2000),
  dedupe_key      text not null unique check (char_length(dedupe_key) <= 500),
  kind            text not null check (kind in ('structured','basic')),
  fields          jsonb not null default '{}'::jsonb,
  provenance      jsonb not null default '{}'::jsonb,
  status          text not null default 'new' check (status in ('new','accepted','dismissed')),
  opportunity_id  uuid references public.opportunities(id) on delete set null,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz
);
create index suggestions_status_idx on public.suggestions (status, created_at desc);

alter table public.sources enable row level security;
alter table public.suggestions enable row level security;

create policy "Editors read sources"   on public.sources for select to authenticated using (public.is_editor());
create policy "Editors add sources"    on public.sources for insert to authenticated with check (public.is_editor());
create policy "Editors update sources" on public.sources for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Editors remove sources" on public.sources for delete to authenticated using (public.is_editor());

create policy "Editors read suggestions"   on public.suggestions for select to authenticated using (public.is_editor());
create policy "Editors add suggestions"    on public.suggestions for insert to authenticated with check (public.is_editor());
create policy "Editors review suggestions" on public.suggestions for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Admins delete suggestions"  on public.suggestions for delete to authenticated using (public.is_admin());

revoke all on public.sources, public.suggestions from anon;
grant select, insert, update, delete on public.sources, public.suggestions to authenticated;

-- The official Irish pages the prototype watches. Volunteers can add, pause or remove sources in the app.
insert into public.sources (name, url, kind, notes, created_by) values
  ('Civil Service — Assisted Return to Career (ARC) Programme', 'https://www.gov.ie/en/department-of-justice-home-affairs-and-migration/organisation-information/assisted-return-to-career-programme', 'programme-page', 'Six-month paid returnship in the Civil Service.', null),
  ('Deloitte Ireland — Return to Work Programme', 'https://www.deloitte.com/ie/en/careers/deloitte-life/benefits/Return-to-Work-Programme.html', 'programme-page', 'Annual programme; roles are advertised on Deloitte’s careers site when open.', null),
  ('PM Group — Returners Programme', 'https://www.pmgroup-global.com/careers/returners-programme', 'programme-page', 'Engineering, technical and project management returners.', null),
  ('Technology Ireland Digital Skillnet — Women ReBOOT', 'https://www.digitalskillnet.ie/women-reboot/', 'programme-page', 'Training and work placement for women returning to tech roles.', null),
  ('University College Cork — Rejuvenate', 'https://ucc.ie/en/fitu/courses/shortcourse-rejuvenate', 'programme-page', 'Course for women planning a return to work.', null),
  ('Back for Business (returning emigrants)', 'https://www.backforbusiness.com', 'programme-page', 'Free programme for returning emigrants starting a business.', null),
  ('Women Returners — returner opportunities in Ireland', 'https://womenreturners.com/returners/returner-opportunities-ireland/', 'directory', 'Lists returner programmes across employers in Ireland.', null),
  ('Back to Work Connect', 'https://backtoworkconnect.ie/', 'directory', 'Services and listings for returners.', null)
on conflict (url) do nothing;
