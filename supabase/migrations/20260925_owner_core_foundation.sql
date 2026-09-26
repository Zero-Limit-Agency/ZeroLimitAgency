-- OWNER Core: canonical role, deny-by-default grants, auditable actor identity.
-- Legacy public.user_roles/admin remains deliberately untouched. This migration
-- promotes nobody: bootstrap is a separate, controlled service-role/SQL action.
do $$
begin
  if pg_catalog.to_regclass('public.profiles') is null
     or pg_catalog.to_regclass('public.platform_roles') is null
     or pg_catalog.to_regclass('public.audit_logs') is null
     or pg_catalog.to_regclass('auth.users') is null then
    raise exception using errcode = '42P01', message = 'owner_core_preflight_failed: prerequisites are missing';
  end if;
end $$;

-- Fail closed if the historical authority table no longer has its canonical
-- columns, primary key, or foreign keys. Unknown structures are never repaired.
do $$
declare
  missing text;
  profile_attnum smallint;
  granted_by_attnum smallint;
  profile_id_attnum smallint;
  auth_id_attnum smallint;
begin
  select string_agg(v.name, ', ' order by v.name) into missing
  from (values
    ('profile_id', 'uuid', 'NO'),
    ('role', 'text', 'NO'),
    ('granted_at', 'timestamp with time zone', 'NO'),
    ('granted_by', 'uuid', 'YES')
  ) v(name, data_type, is_nullable)
  left join information_schema.columns c
    on c.table_schema = 'public' and c.table_name = 'platform_roles'
   and c.column_name = v.name and c.data_type = v.data_type and c.is_nullable = v.is_nullable
  where c.column_name is null;
  if missing is not null then
    raise exception using errcode = '42804', message = 'owner_core_preflight_failed: incompatible platform_roles columns: ' || missing;
  end if;

  select attnum into profile_attnum from pg_catalog.pg_attribute where attrelid = 'public.platform_roles'::regclass and attname = 'profile_id' and not attisdropped;
  select attnum into granted_by_attnum from pg_catalog.pg_attribute where attrelid = 'public.platform_roles'::regclass and attname = 'granted_by' and not attisdropped;
  select attnum into profile_id_attnum from pg_catalog.pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'id' and not attisdropped;
  select attnum into auth_id_attnum from pg_catalog.pg_attribute where attrelid = 'auth.users'::regclass and attname = 'id' and not attisdropped;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.platform_roles'::regclass and contype = 'p'
      and conkey = array[profile_attnum]::smallint[]
  ) then
    raise exception using errcode = '42804', message = 'owner_core_preflight_failed: platform_roles.profile_id must be the primary key';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.platform_roles'::regclass and contype = 'f' and convalidated
      and conkey = array[profile_attnum]::smallint[] and confrelid = 'public.profiles'::regclass
      and confkey = array[profile_id_attnum]::smallint[] and confdeltype = 'c'
  ) then
    raise exception using errcode = '42804', message = 'owner_core_preflight_failed: platform_roles.profile_id FK must reference profiles(id) on delete cascade';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.platform_roles'::regclass and contype = 'f' and convalidated
      and conkey = array[granted_by_attnum]::smallint[] and confrelid = 'auth.users'::regclass
      and confkey = array[auth_id_attnum]::smallint[] and confdeltype = 'n'
  ) then
    raise exception using errcode = '42804', message = 'owner_core_preflight_failed: platform_roles.granted_by FK must reference auth.users(id) on delete set null';
  end if;
end $$;

-- Accept only the historical or final named role check (or no role check).
-- Any differently named role check is rejected because it could silently block
-- normalization. Formatting/casts are normalized, not semantics.
do $$
declare
  role_attnum smallint;
  item record;
  definition text;
  normalized text;
begin
  select attnum into role_attnum from pg_catalog.pg_attribute
  where attrelid = 'public.platform_roles'::regclass and attname = 'role' and not attisdropped;

  for item in
    select oid, conname, convalidated from pg_catalog.pg_constraint
    where conrelid = 'public.platform_roles'::regclass and contype = 'c'
      and conkey @> array[role_attnum]::smallint[]
  loop
    definition := pg_catalog.pg_get_constraintdef(item.oid);
    normalized := pg_catalog.regexp_replace(
      pg_catalog.replace(pg_catalog.lower(definition), '::text', ''),
      '[()''[:space:]]', '', 'g'
    );
    if item.conname <> 'platform_roles_role_check'
       or not item.convalidated
       or normalized not in ('checkrole=platform_owner', 'checkrole=owner') then
      raise exception using errcode = '42804', message = 'owner_core_preflight_failed: incompatible platform_roles role check: ' || item.conname;
    end if;
  end loop;
end $$;

alter table public.platform_roles drop constraint if exists platform_roles_role_check;
update public.platform_roles set role = 'owner' where role = 'platform_owner';

do $$
begin
  if exists (select 1 from public.platform_roles where role is distinct from 'owner') then
    raise exception using errcode = '23514', message = 'owner_core_preflight_failed: unknown platform role value';
  end if;
end $$;

alter table public.platform_roles
  add constraint platform_roles_role_check check (role = 'owner');

-- Add missing audit actor/correlation columns, but reject a same-named column
-- whose type, nullability, or actor FK differs from the canonical contract.
do $$
declare
  column_type text;
  nullable text;
  actor_attnum smallint;
  profile_id_attnum smallint;
begin
  select data_type, is_nullable into column_type, nullable
  from information_schema.columns
  where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'actor_profile_id';
  if column_type is null then
    alter table public.audit_logs add column actor_profile_id uuid references public.profiles(id) on delete set null;
  elsif column_type <> 'uuid' or nullable <> 'YES' then
    raise exception using errcode = '42804', message = 'owner_core_preflight_failed: incompatible audit_logs.actor_profile_id';
  end if;

  select attnum into actor_attnum from pg_catalog.pg_attribute where attrelid = 'public.audit_logs'::regclass and attname = 'actor_profile_id' and not attisdropped;
  select attnum into profile_id_attnum from pg_catalog.pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'id' and not attisdropped;
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.audit_logs'::regclass and contype = 'f' and convalidated
      and conkey = array[actor_attnum]::smallint[] and confrelid = 'public.profiles'::regclass
      and confkey = array[profile_id_attnum]::smallint[] and confdeltype = 'n'
  ) then
    raise exception using errcode = '42804', message = 'owner_core_preflight_failed: audit_logs.actor_profile_id FK must reference profiles(id) on delete set null';
  end if;

  column_type := null;
  nullable := null;
  select data_type, is_nullable into column_type, nullable
  from information_schema.columns
  where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'correlation_id';
  if column_type is null then
    alter table public.audit_logs add column correlation_id uuid;
  elsif column_type <> 'uuid' or nullable <> 'YES' then
    raise exception using errcode = '42804', message = 'owner_core_preflight_failed: incompatible audit_logs.correlation_id';
  end if;
end $$;

-- Same-named audit indexes must be real, valid indexes with the exact canonical
-- definition. IF NOT EXISTS must never conceal a broken partial migration.
do $$
declare
  item record;
  relation_kind "char";
  valid boolean;
  actual text;
begin
  for item in select * from (values
    ('audit_logs_actor_profile_id_idx', 'CREATE INDEX audit_logs_actor_profile_id_idx ON public.audit_logs USING btree (actor_profile_id)', 'create index audit_logs_actor_profile_id_idx on public.audit_logs(actor_profile_id)'),
    ('audit_logs_correlation_id_idx', 'CREATE INDEX audit_logs_correlation_id_idx ON public.audit_logs USING btree (correlation_id) WHERE (correlation_id IS NOT NULL)', 'create index audit_logs_correlation_id_idx on public.audit_logs(correlation_id) where correlation_id is not null')
  ) x(name, expected, create_sql)
  loop
    select c.relkind, i.indisvalid, pg_catalog.pg_get_indexdef(c.oid)
      into relation_kind, valid, actual
    from pg_catalog.pg_class c
    left join pg_catalog.pg_index i on i.indexrelid = c.oid
    where c.oid = pg_catalog.to_regclass('public.' || item.name);
    if relation_kind is null then
      execute item.create_sql;
    elsif relation_kind not in ('i', 'I') or not coalesce(valid, false) or actual <> item.expected then
      raise exception using errcode = '42804', message = 'owner_core_preflight_failed: incompatible audit index: ' || item.name;
    end if;
  end loop;
end $$;

revoke all on public.platform_roles from public, anon, authenticated;
grant select, insert, update, delete on public.platform_roles to service_role;
alter table public.platform_roles enable row level security;

-- Serialize every operation that would remove OWNER authority. UPDATEs which
-- preserve role='owner' return before locking and remain allowed.
create or replace function public.protect_last_platform_owner()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  owner_count bigint;
begin
  if old.role is distinct from 'owner' then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' and new.role is not distinct from 'owner' then
    return new;
  end if;

  lock table public.platform_roles in share row exclusive mode;
  select count(*) into owner_count from public.platform_roles where role = 'owner';
  if owner_count <= 1 then
    raise exception using errcode = '23514', message = 'owner_last_owner_protected';
  end if;
  return coalesce(new, old);
end $$;
revoke all on function public.protect_last_platform_owner() from public, anon, authenticated;
drop trigger if exists protect_last_platform_owner on public.platform_roles;
create trigger protect_last_platform_owner
before delete or update of role on public.platform_roles
for each row execute function public.protect_last_platform_owner();

comment on table public.platform_roles is 'Canonical platform authority. OWNER is independent from profession, organizations, memberships and legacy admin.';
