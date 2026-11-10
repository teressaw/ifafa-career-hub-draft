\set ON_ERROR_STOP 0
\pset tuples_only on
insert into auth.users values ('00000000-0000-0000-0000-00000000000e','editor@x'),('00000000-0000-0000-0000-00000000000a','admin@x'),('00000000-0000-0000-0000-00000000000f','random@x');
insert into public.admin_users values ('00000000-0000-0000-0000-00000000000e','editor'),('00000000-0000-0000-0000-00000000000a','admin');
insert into public.opportunities (slug,employer,programme_name,summary,description,location,region,work_arrangement,programme_type,career_break,sector,source_url,publication)
values ('draft-one','Draft Employer','Draft Programme','A draft summary here','A draft description that is long enough.','Dublin','dublin','hybrid','returnship','not-specified','technology','https://example.org/d','draft');

\echo '--- anon'
set role anon; select set_config('request.jwt.claim.sub','',false);
select 'anon sees published: ' || count(*) from public.opportunities where publication='published';
select 'anon sees drafts: ' || count(*) from public.opportunities where publication<>'published';
select 'anon reads created_by (should fail):'; select created_by from public.opportunities limit 1;
select 'anon insert (should fail):'; insert into public.opportunities (slug,employer,programme_name,summary,description,location,region,work_arrangement,programme_type,career_break,sector,source_url) values ('x','Emp','Prog','Summary text','Description long enough text','Dublin','dublin','hybrid','returnship','not-specified','technology','https://e.org');
select 'anon update rows: '; update public.opportunities set employer='HACKED' where true;
select 'anon reads admin_users (should fail):'; select * from public.admin_users;
reset role;

\echo '--- signed-in non-volunteer'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000f',false);
select 'random sees drafts: ' || count(*) from public.opportunities where publication<>'published';
select 'random insert (should fail):'; insert into public.opportunities (slug,employer,programme_name,summary,description,location,region,work_arrangement,programme_type,career_break,sector,source_url) values ('y','Emp','Prog','Summary text','Description long enough text','Dublin','dublin','hybrid','returnship','not-specified','technology','https://e.org');
with u as (update public.opportunities set employer='HACKED' returning 1) select 'random updated rows: ' || count(*) from u;
select 'random makes self admin (should fail):'; insert into public.admin_users values ('00000000-0000-0000-0000-00000000000f','admin');
reset role;

\echo '--- editor'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000e',false);
select 'editor sees drafts: ' || count(*) from public.opportunities where publication<>'published';
insert into public.opportunities (slug,employer,programme_name,summary,description,location,region,work_arrangement,programme_type,career_break,sector,source_url) values ('editor-new','Emp','Prog','Summary text','Description long enough text','Dublin','dublin','hybrid','returnship','not-specified','technology','https://e.org');
select 'editor insert created_by set: ' || (created_by = '00000000-0000-0000-0000-00000000000e') from public.opportunities where slug='editor-new';
with u as (update public.opportunities set publication='published', created_by='00000000-0000-0000-0000-00000000000f' where slug='editor-new' returning created_by) select 'editor publish ok, created_by tamper blocked: ' || (created_by='00000000-0000-0000-0000-00000000000e') from u;
with d as (delete from public.opportunities where slug='editor-new' returning 1) select 'editor deleted rows (expect 0): ' || count(*) from d;
select 'editor stores unverified dates (should fail):'; update public.opportunities set opens_on=current_date where slug='editor-new';
select 'editor dates out of order (should fail):'; update public.opportunities set dates_verified=true, opens_on=current_date, closes_on=current_date-1 where slug='editor-new';
select 'editor bad url (should fail):'; update public.opportunities set source_url='javascript:alert(1)' where slug='editor-new';
select 'editor promotes self (should fail):'; update public.admin_users set role='admin' where user_id='00000000-0000-0000-0000-00000000000e';
select 'editor sees own membership: ' || count(*) from public.admin_users;
reset role;

\echo '--- admin'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
with d as (delete from public.opportunities where slug='editor-new' returning 1) select 'admin deleted rows (expect 1): ' || count(*) from d;
reset role;
select 'employers changed to HACKED (expect 0): ' || count(*) from public.opportunities where employer='HACKED';
