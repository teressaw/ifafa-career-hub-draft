-- Minimal stand-in for Supabase's roles and auth schema, for testing RLS on plain PostgreSQL.
create role anon nologin; create role authenticated nologin;
grant usage on schema public to anon, authenticated;
create schema auth;
grant usage on schema auth to anon, authenticated;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase grants table privileges to these roles by default; RLS then restricts them.
alter default privileges in schema public grant all on tables to anon, authenticated;
