-- Zero Limit ID, workspace and organization foundation.
-- Additive only: the legacy applications/client_* model is intentionally untouched.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  username text not null unique,
  display_name text not null,
  preferred_locale text not null default 'fr',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_check check (username ~ '^[a-z0-9][a-z0-9_.-]{2,31}$'),
  constraint profiles_display_name_check check (char_length(display_name) between 1 and 80),
  constraint profiles_locale_check check (preferred_locale in ('fr', 'en'))
);

create table public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  provider_username text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint linked_accounts_provider_check check (provider in ('discord', 'twitch', 'youtube', 'epic', 'phone')),
  constraint linked_accounts_provider_user_id_check check (char_length(provider_user_id) between 1 and 255),
  unique (provider, provider_user_id),
  unique (profile_id, provider)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organizations_name_check check (char_length(name) between 1 and 100),
  constraint organizations_slug_check check (slug ~ '^[a-z0-9][a-z0-9-]{2,62}$')
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  -- Organization ownership is canonical on organizations.owner_profile_id.
  -- Membership roles deliberately do not duplicate an "owner" authority.
  constraint organization_memberships_role_check check (role in ('admin', 'member')),
  unique (organization_id, profile_id)
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text not null,
  owner_profile_id uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  personal_profession text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint spaces_kind_check check (kind in ('personal', 'creator', 'team')),
  constraint spaces_name_check check (char_length(name) between 1 and 100),
  constraint spaces_profession_check check (personal_profession is null or personal_profession in ('coach', 'manager_agent', 'ceo', 'community_manager')),
  constraint spaces_ownership_check check (
    (kind = 'personal' and owner_profile_id is not null and organization_id is null and personal_profession is not null)
    or (kind = 'creator' and owner_profile_id is not null and organization_id is null and personal_profession is null)
    or (kind = 'team' and owner_profile_id is null and organization_id is not null and personal_profession is null)
  )
);

-- Platform authority is intentionally separate from organization membership.
-- There are no authenticated policies: assignments are server/service-role only.
create table public.platform_roles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null,
  granted_at timestamptz not null default timezone('utc', now()),
  granted_by uuid references auth.users(id) on delete set null,
  constraint platform_roles_role_check check (role = 'platform_owner')
);

create index profiles_auth_user_idx on public.profiles(auth_user_id);
create index linked_accounts_profile_idx on public.linked_accounts(profile_id);
create index organization_memberships_profile_idx on public.organization_memberships(profile_id);
create index spaces_owner_profile_idx on public.spaces(owner_profile_id) where owner_profile_id is not null;
create index spaces_organization_idx on public.spaces(organization_id) where organization_id is not null;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_linked_accounts_updated_at before update on public.linked_accounts for each row execute function public.set_updated_at();
create trigger set_organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger set_organization_memberships_updated_at before update on public.organization_memberships for each row execute function public.set_updated_at();
create trigger set_spaces_updated_at before update on public.spaces for each row execute function public.set_updated_at();

create function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from public.profiles where auth_user_id = auth.uid() $$;

create function public.is_organization_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id and profile_id = public.current_profile_id()
  )
$$;

create function public.is_organization_owner(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organizations
    where id = target_organization_id and owner_profile_id = public.current_profile_id()
  )
$$;

revoke all on function public.current_profile_id() from public;
revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_owner(uuid) from public;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_owner(uuid) to authenticated;

create function public.add_organization_owner_membership()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.organization_memberships (organization_id, profile_id, role)
  values (new.id, new.owner_profile_id, 'admin');
  return new;
end;
$$;

create trigger add_organization_owner_membership
after insert on public.organizations for each row execute function public.add_organization_owner_membership();

create function public.protect_organization_owner_membership()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.organizations
    where id = old.organization_id and owner_profile_id = old.profile_id
  ) then
    raise exception 'organization owner membership cannot be changed directly';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger protect_organization_owner_membership
before update or delete on public.organization_memberships
for each row execute function public.protect_organization_owner_membership();

create function public.require_new_organization_owner_membership()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.owner_profile_id is distinct from old.owner_profile_id and not exists (
    select 1 from public.organization_memberships
    where organization_id = new.id and profile_id = new.owner_profile_id
  ) then
    raise exception 'new organization owner must already be a member';
  end if;
  return new;
end;
$$;

create trigger require_new_organization_owner_membership
before update of owner_profile_id on public.organizations
for each row execute function public.require_new_organization_owner_membership();

create function public.audit_identity_foundation_change()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  subject_id text := coalesce(new.id::text, old.id::text);
begin
  insert into public.audit_logs (actor_user_id, actor_role, action, resource_type, resource_id, metadata)
  values (
    auth.uid(),
    coalesce(auth.role(), current_user),
    lower(tg_op),
    tg_table_name,
    subject_id,
    jsonb_build_object('organization_id', coalesce(new.organization_id, old.organization_id))
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_organization_membership_changes
after insert or update or delete on public.organization_memberships
for each row execute function public.audit_identity_foundation_change();

create function public.audit_organization_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.audit_logs (actor_user_id, actor_role, action, resource_type, resource_id)
  values (
    auth.uid(),
    coalesce(auth.role(), current_user),
    lower(tg_op),
    tg_table_name,
    coalesce(
      to_jsonb(new) ->> 'id',
      to_jsonb(old) ->> 'id',
      to_jsonb(new) ->> 'profile_id',
      to_jsonb(old) ->> 'profile_id'
    )
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_organization_changes after insert or update or delete on public.organizations
for each row execute function public.audit_organization_change();
create trigger audit_platform_role_changes after insert or update or delete on public.platform_roles
for each row execute function public.audit_organization_change();
create trigger audit_linked_account_changes after insert or update or delete on public.linked_accounts
for each row execute function public.audit_organization_change();

-- Trigger functions are never client-callable. Predicate helpers expose only a
-- boolean/current caller projection and cannot be used for arbitrary-user checks.
revoke all on function public.add_organization_owner_membership() from public;
revoke all on function public.protect_organization_owner_membership() from public;
revoke all on function public.require_new_organization_owner_membership() from public;
revoke all on function public.audit_identity_foundation_change() from public;
revoke all on function public.audit_organization_change() from public;

alter table public.profiles enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.spaces enable row level security;
alter table public.platform_roles enable row level security;

-- RLS chooses rows; column grants also make immutable identity/ownership keys
-- impossible to rewrite through the authenticated REST API.
revoke update on public.profiles from authenticated;
grant update (username, display_name, preferred_locale, avatar_url) on public.profiles to authenticated;
revoke update on public.organizations from authenticated;
grant update (name, slug) on public.organizations to authenticated;
revoke update on public.organization_memberships from authenticated;
grant update (role) on public.organization_memberships to authenticated;
revoke update on public.spaces from authenticated;
grant update (name, personal_profession) on public.spaces to authenticated;

create policy profiles_self_select on public.profiles for select to authenticated using (auth_user_id = auth.uid());
create policy profiles_self_insert on public.profiles for insert to authenticated with check (auth_user_id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- Reads are self-scoped. Writes require a future server-side provider proof;
-- an arbitrary provider_user_id submitted by a browser is not verification.
create policy linked_accounts_self_select on public.linked_accounts for select to authenticated
  using (profile_id = public.current_profile_id());

create policy organizations_member_select on public.organizations for select to authenticated
  using (public.is_organization_member(id));
create policy organizations_self_insert on public.organizations for insert to authenticated
  with check (owner_profile_id = public.current_profile_id());
create policy organizations_owner_update on public.organizations for update to authenticated
  using (public.is_organization_owner(id)) with check (owner_profile_id = public.current_profile_id());

create policy organization_memberships_org_select on public.organization_memberships for select to authenticated
  using (public.is_organization_member(organization_id));
create policy organization_memberships_owner_insert on public.organization_memberships for insert to authenticated
  with check (public.is_organization_owner(organization_id));
create policy organization_memberships_owner_update on public.organization_memberships for update to authenticated
  using (public.is_organization_owner(organization_id))
  with check (public.is_organization_owner(organization_id));
create policy organization_memberships_owner_delete on public.organization_memberships for delete to authenticated
  using (public.is_organization_owner(organization_id) and profile_id <> public.current_profile_id());

create policy spaces_access_select on public.spaces for select to authenticated
  using (owner_profile_id = public.current_profile_id() or public.is_organization_member(organization_id));
create policy spaces_personal_insert on public.spaces for insert to authenticated
  with check (kind in ('personal', 'creator') and owner_profile_id = public.current_profile_id() and organization_id is null);
create policy spaces_team_insert on public.spaces for insert to authenticated
  with check (kind = 'team' and public.is_organization_owner(organization_id));
create policy spaces_personal_update on public.spaces for update to authenticated
  using (owner_profile_id = public.current_profile_id())
  with check (kind in ('personal', 'creator') and owner_profile_id = public.current_profile_id() and organization_id is null);
create policy spaces_team_update on public.spaces for update to authenticated
  using (kind = 'team' and public.is_organization_owner(organization_id))
  with check (kind = 'team' and owner_profile_id is null and public.is_organization_owner(organization_id));

comment on table public.profiles is 'Stable Zero Limit ID domain profile, distinct from authentication and legacy applications.';
comment on table public.linked_accounts is 'External account links; never an authority or entitlement source.';
comment on table public.platform_roles is 'Internal platform authority; deliberately unrelated to organization owner roles.';
comment on table public.spaces is 'Personal, creator, and organization-owned team workspace roots.';
