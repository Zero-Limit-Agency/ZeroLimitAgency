-- Supabase security catalog export (READ ONLY).
-- Run only against a future non-production staging/Preview project before a sensitive
-- production release or the next database migration, and return every result grid.
-- This file intentionally contains no CREATE/ALTER/DROP/GRANT/REVOKE or data writes.

-- A/B. Every public/storage table, including RLS and FORCE RLS state.
select n.nspname as schema_name, c.relname as relation_name,
       case c.relkind when 'r' then 'table' when 'p' then 'partitioned table' end as relation_type,
       c.relrowsecurity, c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage') and c.relkind in ('r', 'p')
order by 1, 2;

-- C. Complete policy expressions and target roles.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- D/E/F/G. Explicit/effective relation ACLs for API roles and PUBLIC.
select n.nspname as schema_name, c.relname as object_name,
       case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end as grantee,
       acl.privilege_type, acl.is_grantable
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(coalesce(
  c.relacl,
  acldefault(case when c.relkind = 'S' then 'S'::"char" else 'r'::"char" end, c.relowner)
)) acl
where n.nspname in ('public', 'storage')
  and c.relkind in ('r', 'p', 'v', 'm', 'S')
  and (acl.grantee = 0 or pg_get_userbyid(acl.grantee) in ('anon', 'authenticated', 'service_role'))
order by 1, 2, 3, 4;

-- H/I. All public functions, exact identity signature, definer flag and configured search_path.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as identity_arguments,
       pg_get_function_result(p.oid) as result_type,
       l.lanname as language, p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ', '), '<database/role default>') as function_config,
       pg_get_userbyid(p.proowner) as owner
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
order by 2, 3;

-- J/L. Effective EXECUTE per API role. Public-schema functions are potentially PostgREST RPCs;
-- the final four columns make implicit PUBLIC privileges visible as well as explicit grants.
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as identity_arguments,
       p.prosecdef as security_definer,
       exists (
         select 1
         from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
         where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
       ) as public_can_execute,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute,
       coalesce(array_to_string(p.proacl, ', '), '<default ACL: PUBLIC execute>') as raw_acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by 1, 2;

-- K. Views/materialized views, ownership, security options and definitions.
select n.nspname as schema_name, c.relname as view_name,
       case c.relkind when 'v' then 'view' when 'm' then 'materialized view' end as view_type,
       pg_get_userbyid(c.relowner) as owner,
       coalesce(array_to_string(c.reloptions, ', '), '<none>') as security_options,
       pg_get_viewdef(c.oid, true) as definition
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage') and c.relkind in ('v', 'm')
order by 1, 2;

-- Storage is a separate sensitive surface.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
