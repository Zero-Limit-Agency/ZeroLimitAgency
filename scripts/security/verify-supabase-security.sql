-- Run manually in Supabase SQL editor or psql against the target project.
-- Read-only verification: lists RLS, policies, grants, SECURITY DEFINER functions and storage buckets/policies.

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
order by table_schema, table_name, grantee, privilege_type;

select n.nspname as schema, p.proname as function_name, p.prosecdef as security_definer, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
order by function_name;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
