\echo '--- monitoring: anon'
set role anon;
select 'anon reads sources (should fail):'; select count(*) from public.sources;
select 'anon reads suggestions (should fail):'; select count(*) from public.suggestions;
reset role;

\echo '--- monitoring: signed-in non-volunteer'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000f',false);
select 'random sees sources (expect 0): ' || count(*) from public.sources;
select 'random adds source (should fail):'; insert into public.sources (name,url) values ('Evil','https://evil.example');
with u as (update public.sources set url='https://evil.example' returning 1) select 'random updated sources (expect 0): ' || count(*) from u;
reset role;

\echo '--- monitoring: editor'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000e',false);
select 'editor sees seeded sources (expect 8): ' || count(*) from public.sources;
insert into public.sources (name,url) values ('Test source','https://test.example/page');
select 'editor bad source url (should fail):'; insert into public.sources (name,url) values ('Bad','javascript:alert(1)');
select 'editor bad interval (should fail):'; update public.sources set check_every_days=2 where url='https://test.example/page';
insert into public.suggestions (source_id,url,dedupe_key,kind,fields) select id,url,'k1','structured','{"programme_name":"X"}' from public.sources where url='https://test.example/page';
insert into public.suggestions (url,dedupe_key,kind) values ('https://x','k1','basic') on conflict (dedupe_key) do nothing;
select 'suggestions after duplicate (expect 1): ' || count(*) from public.suggestions;
with u as (update public.suggestions set status='dismissed' returning 1) select 'editor dismissed (expect 1): ' || count(*) from u;
with d as (delete from public.suggestions returning 1) select 'editor deleted suggestions (expect 0): ' || count(*) from d;
with d as (delete from public.sources where url='https://test.example/page' returning 1) select 'editor removed source (expect 1): ' || count(*) from d;
reset role;

\echo '--- monitoring: admin'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
with d as (delete from public.suggestions returning 1) select 'admin deleted suggestions (expect 1): ' || count(*) from d;
reset role;
