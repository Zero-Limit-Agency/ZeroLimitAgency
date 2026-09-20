-- Targeted history repair for desynchronized Preview environments where the
-- Zero Limit migrations are recorded as applied but the canonical legacy
-- public.audit_logs table is absent. Additive, idempotent and data-preserving.

create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  resource_type text not null,
  resource_id text,
  result text not null default 'success',
  metadata jsonb not null default '{}'::jsonb,
  constraint audit_logs_result_check check (result in ('success', 'failure'))
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

alter table public.audit_logs enable row level security;

-- Supabase's service role bypasses RLS; make its required insert privilege
-- explicit so server-side audit writers do not depend on project defaults.
grant insert on public.audit_logs to service_role;

-- Some desynchronized Previews do not have the legacy admin predicate. In
-- that case, deliberately expose no authenticated SELECT policy rather than
-- manufacturing an additional legacy dependency.
do $$
begin
  if pg_catalog.to_regprocedure('public.is_admin_user()') is not null
     and exists (
       select 1
       from pg_catalog.pg_proc procedure
       join pg_catalog.pg_namespace namespace on namespace.oid = procedure.pronamespace
       where namespace.nspname = 'public'
         and procedure.proname = 'is_admin_user'
         and procedure.pronargs = 0
         and procedure.prorettype = 'pg_catalog.bool'::pg_catalog.regtype
     )
     and not exists (
       select 1
       from pg_catalog.pg_policies
       where schemaname = 'public'
         and tablename = 'audit_logs'
         and policyname = 'audit_logs_admin_select'
     ) then
    execute 'create policy audit_logs_admin_select on public.audit_logs
      for select to authenticated using (public.is_admin_user())';
  end if;
end
$$;
