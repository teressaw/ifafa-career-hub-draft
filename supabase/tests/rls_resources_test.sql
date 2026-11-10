\echo '--- resources: editor'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000e',false);
insert into public.resources (kind,title,provider,summary,url,publication) values ('support','Draft support','Provider','A draft summary here','https://e.org/d','draft');
insert into public.resources (kind,title,provider,summary,url,publication,audiences) values ('resource','Published guide','Provider','A published summary','https://e.org/p','published','{return}');
select 'editor unverified event date (should fail):'; insert into public.resources (kind,title,provider,summary,url,event_date) values ('event','Ev','Provider','An event summary','https://e.org/e',current_date);
select 'editor date on non-event (should fail):'; insert into public.resources (kind,title,provider,summary,url,event_date,date_verified) values ('support','Support two','Provider','A support summary','https://e.org/s',current_date,true);
select 'editor bad audience (should fail):'; insert into public.resources (kind,title,provider,summary,url,audiences) values ('support','Support three','Provider','A support summary','https://e.org/s','{everyone}');
select 'editor bad url (should fail):'; insert into public.resources (kind,title,provider,summary,url) values ('support','Support four','Provider','A support summary','javascript:alert(1)');
insert into public.resources (kind,title,provider,summary,url,event_date,date_verified) values ('event','Verified event','Provider','An event summary','https://e.org/v',current_date+7,true);
with d as (delete from public.resources returning 1) select 'editor deleted (expect 0): ' || count(*) from d;
select 'editor created_by set: ' || bool_and(created_by='00000000-0000-0000-0000-00000000000e') from public.resources;
reset role;

\echo '--- resources: anon'
set role anon; select set_config('request.jwt.claim.sub','',false);
select 'anon sees published only (expect 1): ' || count(*) from public.resources where kind <> 'event';
select 'anon reads created_by (should fail):'; select created_by from public.resources;
select 'anon insert (should fail):'; insert into public.resources (kind,title,provider,summary,url) values ('support','X','Provider','A support summary','https://e.org/x');
select 'anon reads abroad_eligibility: ' || count(abroad_eligibility) from public.opportunities;
reset role;

\echo '--- resources: random signed-in'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000f',false);
select 'random sees drafts (expect 0): ' || count(*) from public.resources where publication='draft';
with u as (update public.resources set title='HACKED' returning 1) select 'random updated (expect 0): ' || count(*) from u;
reset role;

\echo '--- resources: admin'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
with d as (delete from public.resources returning 1) select 'admin deleted (expect 3): ' || count(*) from d;
reset role;
