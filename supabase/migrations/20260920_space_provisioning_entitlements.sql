-- Zero Limit space provisioning and scoped entitlements.
-- The legacy public.entitlements table remains untouched: it is auth-user/product
-- access for the applications/client_access domain, not the Zero Limit space domain.

-- SECURITY DEFINER functions resolve only pg_catalog and explicitly qualified
-- application objects. Untrusted roles cannot create shadowing objects in public.
revoke create on schema public from public;

create table public.zero_limit_entitlements (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  profile_id uuid references public.profiles(id) on delete cascade,
  space_id uuid references public.spaces(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  source text not null,
  status text not null default 'active',
  starts_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint zero_limit_entitlements_one_scope check (
    num_nonnulls(profile_id, space_id, organization_id) = 1
  ),
  constraint zero_limit_entitlements_key_check check (key ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint zero_limit_entitlements_source_check check (source in ('subscription', 'purchase', 'manual', 'promotion', 'migration', 'system')),
  constraint zero_limit_entitlements_status_check check (status in ('active', 'suspended', 'revoked')),
  constraint zero_limit_entitlements_dates_check check (expires_at is null or expires_at > starts_at)
);

create unique index spaces_one_personal_profession_per_profile
  on public.spaces(owner_profile_id, personal_profession) where kind = 'personal';
create unique index spaces_one_creator_per_profile
  on public.spaces(owner_profile_id) where kind = 'creator';
create unique index spaces_one_team_per_organization
  on public.spaces(organization_id) where kind = 'team';
create unique index zero_limit_entitlements_profile_key_unique
  on public.zero_limit_entitlements(profile_id, key) where profile_id is not null;
create unique index zero_limit_entitlements_space_key_unique
  on public.zero_limit_entitlements(space_id, key) where space_id is not null;
create unique index zero_limit_entitlements_organization_key_unique
  on public.zero_limit_entitlements(organization_id, key) where organization_id is not null;
create index zero_limit_entitlements_active_idx on public.zero_limit_entitlements(key, status, starts_at, expires_at);

create trigger set_zero_limit_entitlements_updated_at before update on public.zero_limit_entitlements
for each row execute function public.set_updated_at();

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null,
  token_hash text not null unique,
  invited_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by_profile_id uuid references public.profiles(id) on delete restrict,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_invitations_role_check check (role in ('admin', 'member')),
  constraint organization_invitations_email_check check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint organization_invitations_expiry_check check (expires_at > created_at),
  constraint organization_invitations_acceptance_check check ((accepted_at is null) = (accepted_by_profile_id is null)),
  constraint organization_invitations_terminal_check check (accepted_at is null or revoked_at is null)
);
create unique index organization_invitations_pending_unique
  on public.organization_invitations(organization_id, email) where accepted_at is null and revoked_at is null;

alter table public.zero_limit_entitlements enable row level security;
alter table public.organization_invitations enable row level security;
revoke all on public.zero_limit_entitlements, public.organization_invitations from anon, authenticated;

create policy zero_limit_entitlements_access_select on public.zero_limit_entitlements for select to authenticated using (
  profile_id = public.current_profile_id()
  or exists (select 1 from public.spaces s where s.id = space_id and (s.owner_profile_id = public.current_profile_id() or public.is_organization_member(s.organization_id)))
  or public.is_organization_member(organization_id)
);
grant select (id, key, profile_id, space_id, organization_id, source, status, starts_at, expires_at, created_at, updated_at)
  on public.zero_limit_entitlements to authenticated;

create function public.record_provisioning_audit(actor_user_id_value uuid, action_name text, resource_type_name text, resource_id_value uuid, details jsonb default '{}'::jsonb)
returns void language plpgsql volatile security definer set search_path = pg_catalog, public as $$
begin
  insert into public.audit_logs(actor_user_id, actor_role, action, resource_type, resource_id, metadata)
  values (actor_user_id_value, coalesce(auth.role(), current_user), action_name, resource_type_name, resource_id_value::text, details);
end $$;

create function public.provision_personal_space(actor_auth_user_id uuid, profession_value text, entitlement_source text default 'system')
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare profile_value uuid; space_value uuid; entitlement_value uuid; label text; space_created boolean := false;
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='backend_only'; end if;
  select id into profile_value from public.profiles where auth_user_id=actor_auth_user_id;
  if profile_value is null then raise exception using errcode = 'P0002', message = 'profile_not_found'; end if;
  if profession_value not in ('coach','manager_agent','ceo','community_manager') then raise exception using errcode = '22023', message = 'invalid_profession'; end if;
  if entitlement_source not in ('subscription','purchase','manual','promotion','migration','system') then raise exception using errcode = '22023', message = 'invalid_source'; end if;
  label := case profession_value when 'coach' then 'Espace Coach' when 'manager_agent' then 'Espace Manager / Agent' when 'ceo' then 'Espace CEO / Dirigeant' else 'Espace Community Manager' end;
  insert into public.spaces(kind,name,owner_profile_id,personal_profession) values ('personal',label,profile_value,profession_value)
    on conflict (owner_profile_id, personal_profession) where kind = 'personal' do nothing returning id into space_value;
  if space_value is not null then space_created := true;
  else select id into space_value from public.spaces where owner_profile_id=profile_value and personal_profession=profession_value and kind='personal'; end if;
  insert into public.zero_limit_entitlements(key,space_id,source) values ('personal_access',space_value,entitlement_source) on conflict do nothing returning id into entitlement_value;
  if space_created then perform public.record_provisioning_audit(actor_auth_user_id,'personal_space_created','space',space_value,jsonb_build_object('profession',profession_value)); end if;
  if entitlement_value is not null then perform public.record_provisioning_audit(actor_auth_user_id,'entitlement_granted','zero_limit_entitlement',entitlement_value,jsonb_build_object('key','personal_access','scope','space','scope_id',space_value)); end if;
  return space_value;
end $$;

create function public.provision_creator_space(actor_auth_user_id uuid, entitlement_source text default 'system')
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare profile_value uuid; space_value uuid; entitlement_value uuid; space_created boolean := false;
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='backend_only'; end if;
  select id into profile_value from public.profiles where auth_user_id=actor_auth_user_id;
  if profile_value is null then raise exception using errcode = 'P0002', message = 'profile_not_found'; end if;
  if entitlement_source not in ('subscription','purchase','manual','promotion','migration','system') then raise exception using errcode = '22023', message = 'invalid_source'; end if;
  insert into public.spaces(kind,name,owner_profile_id) values ('creator','Espace Creator',profile_value)
    on conflict (owner_profile_id) where kind = 'creator' do nothing returning id into space_value;
  if space_value is not null then space_created := true;
  else select id into space_value from public.spaces where owner_profile_id=profile_value and kind='creator'; end if;
  insert into public.zero_limit_entitlements(key,space_id,source) values ('creator_access',space_value,entitlement_source) on conflict do nothing returning id into entitlement_value;
  if space_created then perform public.record_provisioning_audit(actor_auth_user_id,'creator_space_created','space',space_value,'{}'); end if;
  if entitlement_value is not null then perform public.record_provisioning_audit(actor_auth_user_id,'entitlement_granted','zero_limit_entitlement',entitlement_value,jsonb_build_object('key','creator_access','scope','space','scope_id',space_value)); end if;
  return space_value;
end $$;

create function public.provision_team(actor_auth_user_id uuid, organization_name text, organization_slug text, entitlement_source text default 'system')
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare profile_value uuid; organization_value uuid; space_value uuid; entitlement_value uuid; organization_created boolean := false;
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='backend_only'; end if;
  select id into profile_value from public.profiles where auth_user_id=actor_auth_user_id;
  if profile_value is null then raise exception using errcode = 'P0002', message = 'profile_not_found'; end if;
  if entitlement_source not in ('subscription','purchase','manual','promotion','migration','system') then raise exception using errcode = '22023', message = 'invalid_source'; end if;
  if btrim(organization_name) = '' or char_length(btrim(organization_name)) > 100 then raise exception using errcode='22023', message='invalid_organization_name'; end if;
  if organization_slug !~ '^[a-z0-9][a-z0-9-]{2,62}$' then raise exception using errcode='22023', message='invalid_slug'; end if;
  insert into public.organizations(name,slug,owner_profile_id) values (btrim(organization_name),organization_slug,profile_value)
    on conflict (slug) do nothing returning id into organization_value;
  if organization_value is not null then organization_created := true;
  else
    select id into organization_value from public.organizations where slug=organization_slug and owner_profile_id=profile_value and name=btrim(organization_name);
    if organization_value is null then raise exception using errcode='23505', message='slug_taken'; end if;
  end if;
  insert into public.spaces(kind,name,organization_id) values ('team',btrim(organization_name),organization_value)
    on conflict (organization_id) where kind='team' do nothing returning id into space_value;
  if space_value is null then select id into space_value from public.spaces where organization_id=organization_value and kind='team'; end if;
  insert into public.zero_limit_entitlements(key,organization_id,source) values ('team_access',organization_value,entitlement_source) on conflict do nothing returning id into entitlement_value;
  if organization_created then perform public.record_provisioning_audit(actor_auth_user_id,'organization_created','organization',organization_value,'{}'); end if;
  if entitlement_value is not null then perform public.record_provisioning_audit(actor_auth_user_id,'entitlement_granted','zero_limit_entitlement',entitlement_value,jsonb_build_object('key','team_access','scope','organization','scope_id',organization_value)); end if;
  return space_value;
end $$;

create function public.create_team_invitation(organization_value uuid, email_value text, role_value text, token_hash_value text, expires_at_value timestamptz)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare profile_value uuid; invitation_value uuid;
begin
  profile_value := public.current_profile_id();
  if profile_value is null then raise exception using errcode='28000',message='authentication_required'; end if;
  if role_value not in ('admin','member') then raise exception using errcode='22023',message='invalid_role'; end if;
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=profile_value where o.id=organization_value and (o.owner_profile_id=profile_value or m.role='admin')) then raise exception using errcode='42501',message='invitation_forbidden'; end if;
  if expires_at_value <= timezone('utc',now()) or expires_at_value > timezone('utc',now()) + interval '30 days' then raise exception using errcode='22023',message='invalid_expiry'; end if;
  insert into public.organization_invitations(organization_id,email,role,token_hash,invited_by_profile_id,expires_at)
    values(organization_value,lower(btrim(email_value)),role_value,token_hash_value,profile_value,expires_at_value)
    on conflict (organization_id,email) where accepted_at is null and revoked_at is null
    do update set role=excluded.role,token_hash=excluded.token_hash,invited_by_profile_id=excluded.invited_by_profile_id,expires_at=excluded.expires_at,created_at=timezone('utc',now()) returning id into invitation_value;
  perform public.record_provisioning_audit(auth.uid(),'team_invitation_created','organization_invitation',invitation_value,jsonb_build_object('organization_id',organization_value,'role',role_value));
  return invitation_value;
end $$;

create function public.accept_team_invitation(token_hash_value text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare profile_value uuid; invitation_row public.organization_invitations%rowtype; auth_email text; email_verified_at timestamptz; space_value uuid;
begin
  profile_value := public.current_profile_id();
  if profile_value is null then raise exception using errcode='28000',message='authentication_required'; end if;
  select lower(btrim(email)), email_confirmed_at into auth_email, email_verified_at from auth.users where id=auth.uid();
  if email_verified_at is null then raise exception using errcode='42501',message='invitation_email_unverified'; end if;
  select * into invitation_row from public.organization_invitations where token_hash=token_hash_value for update;
  if not found then raise exception using errcode='P0002',message='invitation_invalid'; end if;
  if invitation_row.email <> auth_email then raise exception using errcode='42501',message='invitation_email_mismatch'; end if;
  if invitation_row.accepted_at is not null and invitation_row.accepted_by_profile_id <> profile_value then raise exception using errcode='22023',message='invitation_used'; end if;
  if invitation_row.accepted_at is not null then select id into space_value from public.spaces where organization_id=invitation_row.organization_id and kind='team'; return space_value; end if;
  if invitation_row.revoked_at is not null then raise exception using errcode='22023',message='invitation_revoked'; end if;
  if invitation_row.expires_at <= timezone('utc',now()) then raise exception using errcode='22023',message='invitation_expired'; end if;
  insert into public.organization_memberships(organization_id,profile_id,role) values(invitation_row.organization_id,profile_value,invitation_row.role) on conflict (organization_id,profile_id) do nothing;
  if invitation_row.accepted_at is null then
    update public.organization_invitations set accepted_at=timezone('utc',now()),accepted_by_profile_id=profile_value where id=invitation_row.id;
    perform public.record_provisioning_audit(auth.uid(),'team_invitation_accepted','organization_invitation',invitation_row.id,jsonb_build_object('organization_id',invitation_row.organization_id));
  end if;
  select id into space_value from public.spaces where organization_id=invitation_row.organization_id and kind='team';
  return space_value;
end $$;

revoke all on function public.record_provisioning_audit(uuid,text,text,uuid,jsonb) from public;
revoke all on function public.provision_personal_space(uuid,text,text) from public;
revoke all on function public.provision_creator_space(uuid,text) from public;
revoke all on function public.provision_team(uuid,text,text,text) from public;
revoke all on function public.create_team_invitation(uuid,text,text,text,timestamptz) from public;
revoke all on function public.accept_team_invitation(text) from public;
revoke all on function public.record_provisioning_audit(uuid,text,text,uuid,jsonb), public.provision_personal_space(uuid,text,text), public.provision_creator_space(uuid,text), public.provision_team(uuid,text,text,text), public.create_team_invitation(uuid,text,text,text,timestamptz), public.accept_team_invitation(text) from anon, authenticated;
grant execute on function public.provision_personal_space(uuid,text,text), public.provision_creator_space(uuid,text), public.provision_team(uuid,text,text,text) to service_role;
grant execute on function public.create_team_invitation(uuid,text,text,text,timestamptz), public.accept_team_invitation(text) to authenticated;

comment on table public.zero_limit_entitlements is 'Zero Limit profile/space/organization capabilities; separate from legacy auth-user product entitlements.';
comment on table public.organization_invitations is 'Email is invitation transport only; accepted membership identity is profile_id.';
