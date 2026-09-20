-- Core workspace settings and product lifecycle. Additive and data preserving.
alter table public.spaces
  add column if not exists status text;

do $$
declare status_type text;
begin
  select pg_catalog.format_type(a.atttypid, a.atttypmod) into status_type
  from pg_catalog.pg_attribute a
  where a.attrelid='public.spaces'::pg_catalog.regclass
    and a.attname='status' and not a.attisdropped;
  if status_type is distinct from 'text' then
    raise exception using errcode='42804', message='public.spaces.status has incompatible type: ' || coalesce(status_type, 'missing');
  end if;
end $$;

alter table public.spaces alter column status set default 'active';
update public.spaces set status='active' where status is null;
alter table public.spaces alter column status set not null;

do $$
declare definition text;
begin
  select pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.pg_get_constraintdef(c.oid)), '[[:space:]]', '', 'g')
    into definition
  from pg_catalog.pg_constraint c
  where c.conrelid='public.spaces'::pg_catalog.regclass
    and c.conname='spaces_status_check';

  if definition is null then
    alter table public.spaces add constraint spaces_status_check
      check (status in ('active', 'suspended', 'archived'));
  elsif definition <> 'check((status=any(array[''active''::text,''suspended''::text,''archived''::text])))' then
    raise exception using errcode='42804', message='public.spaces.spaces_status_check has incompatible definition: ' || definition;
  end if;
end $$;

do $$
declare definition text; relation_kind "char"; index_valid boolean;
begin
  select c.relkind,
    case when c.relkind='i' then pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.pg_get_indexdef(c.oid)), '[[:space:]()]', '', 'g') end,
    i.indisvalid
    into relation_kind, definition, index_valid
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  left join pg_catalog.pg_index i on i.indexrelid=c.oid
  where n.nspname='public' and c.relname='spaces_active_owner_idx';
  if relation_kind is not null and (relation_kind<>'i' or not index_valid or definition <> 'createindexspaces_active_owner_idxonpublic.spacesusingbtreeowner_profile_idwherestatus=''active''::text') then
    raise exception using errcode='42804', message='public.spaces_active_owner_idx has incompatible definition';
  end if;
end $$;

do $$
declare definition text; relation_kind "char"; index_valid boolean;
begin
  select c.relkind,
    case when c.relkind='i' then pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.pg_get_indexdef(c.oid)), '[[:space:]()]', '', 'g') end,
    i.indisvalid
    into relation_kind, definition, index_valid
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  left join pg_catalog.pg_index i on i.indexrelid=c.oid
  where n.nspname='public' and c.relname='spaces_active_organization_idx';
  if relation_kind is not null and (relation_kind<>'i' or not index_valid or definition <> 'createindexspaces_active_organization_idxonpublic.spacesusingbtreeorganization_idwherestatus=''active''::text') then
    raise exception using errcode='42804', message='public.spaces_active_organization_idx has incompatible definition';
  end if;
end $$;

create index if not exists spaces_active_owner_idx on public.spaces(owner_profile_id) where status = 'active';
create index if not exists spaces_active_organization_idx on public.spaces(organization_id) where status = 'active';

-- Lifecycle is intentionally independent from entitlements. Only these RPCs may
-- write status; suspension remains reserved for a future system/OWNER service.
revoke update on public.spaces from authenticated;
revoke update (id, kind, name, owner_profile_id, organization_id, personal_profession, created_at, updated_at, status)
  on public.spaces from authenticated;
revoke update on public.organizations from authenticated;
revoke update (id, name, slug, owner_profile_id, created_at, updated_at)
  on public.organizations from authenticated;

create or replace function public.get_workspace_settings(space_value uuid)
returns table (
  id uuid, kind text, name text, status text, personal_profession text,
  organization_id uuid, organization_name text, organization_slug text,
  owner_profile_id uuid, owner_display_name text, is_owner boolean,
  member_role text, entitlement_active boolean
) language sql stable security definer set search_path = pg_catalog, public as $$
  select s.id, s.kind, case when s.kind='team' then o.name else s.name end, s.status,
    s.personal_profession, o.id, o.name, o.slug,
    coalesce(s.owner_profile_id,o.owner_profile_id), owner.display_name,
    coalesce(s.owner_profile_id,o.owner_profile_id)=public.current_profile_id(), m.role,
    exists(select 1 from public.zero_limit_entitlements e
      where e.status='active' and e.starts_at<=timezone('utc',now())
        and (e.expires_at is null or e.expires_at>timezone('utc',now()))
        and ((s.kind='personal' and e.space_id=s.id and e.key='personal_access')
          or (s.kind='creator' and e.space_id=s.id and e.key='creator_access')
          or (s.kind='team' and e.organization_id=s.organization_id and e.key='team_access')))
  from public.spaces s
  left join public.organizations o on o.id=s.organization_id
  left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=public.current_profile_id()
  join public.profiles owner on owner.id=coalesce(s.owner_profile_id,o.owner_profile_id)
  where s.id=space_value and (s.owner_profile_id=public.current_profile_id() or m.id is not null)
$$;

create or replace function public.update_workspace_settings(space_value uuid, operation_value text, value_value text default null)
returns void language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare s public.spaces%rowtype; o public.organizations%rowtype; profile_value uuid := public.current_profile_id(); clean_value text := btrim(value_value);
begin
  if profile_value is null then raise exception using errcode='28000',message='authentication_required'; end if;
  select * into s from public.spaces where id=space_value for update;
  if not found then raise exception using errcode='P0002',message='space_not_found'; end if;
  if s.kind='team' then select * into o from public.organizations where id=s.organization_id for update; end if;
  if (s.kind in ('personal','creator') and s.owner_profile_id<>profile_value)
    or (s.kind='team' and o.owner_profile_id<>profile_value) then
    raise exception using errcode='42501',message='settings_owner_required';
  end if;

  -- User mutations are lifecycle-gated before any Core field is changed.
  if s.status='suspended' then
    raise exception using errcode='42501',message='space_suspended';
  end if;
  if s.status='archived' and operation_value<>'restore' then
    raise exception using errcode='22023',message='space_archived_read_only';
  end if;

  if operation_value in ('rename_space','rename_organization') then
    if clean_value is null or char_length(clean_value) not between 1 and 100 then raise exception using errcode='22023',message='invalid_name'; end if;
    if s.kind='team' and operation_value='rename_organization' then
      update public.organizations set name=clean_value where id=o.id;
      update public.spaces set name=clean_value where id=s.id;
      perform public.record_provisioning_audit(auth.uid(),'organization_renamed','organization',o.id,jsonb_build_object('space_id',s.id));
    elsif s.kind in ('personal','creator') and operation_value='rename_space' then
      update public.spaces set name=clean_value where id=s.id;
      perform public.record_provisioning_audit(auth.uid(),'space_renamed','space',s.id,jsonb_build_object('kind',s.kind));
    else raise exception using errcode='22023',message='invalid_operation'; end if;
  elsif operation_value='change_slug' and s.kind='team' then
    if clean_value is null or clean_value<>lower(clean_value) or clean_value !~ '^[a-z0-9][a-z0-9-]{2,62}$' then raise exception using errcode='22023',message='invalid_slug'; end if;
    begin update public.organizations set slug=clean_value where id=o.id;
    exception when unique_violation then raise exception using errcode='23505',message='slug_taken'; end;
    perform public.record_provisioning_audit(auth.uid(),'organization_slug_changed','organization',o.id,jsonb_build_object('space_id',s.id));
  elsif operation_value='archive' then
    if s.status<>'active' then raise exception using errcode='22023',message='invalid_lifecycle_transition'; end if;
    update public.spaces set status='archived' where id=s.id;
    perform public.record_provisioning_audit(auth.uid(),'space_archived','space',s.id,jsonb_build_object('kind',s.kind));
  elsif operation_value='restore' then
    if s.status<>'archived' then raise exception using errcode='22023',message='invalid_lifecycle_transition'; end if;
    if not exists(select 1 from public.zero_limit_entitlements e where e.status='active' and e.starts_at<=timezone('utc',now()) and (e.expires_at is null or e.expires_at>timezone('utc',now())) and ((s.kind='personal' and e.space_id=s.id and e.key='personal_access') or (s.kind='creator' and e.space_id=s.id and e.key='creator_access') or (s.kind='team' and e.organization_id=s.organization_id and e.key='team_access'))) then
      raise exception using errcode='42501',message='entitlement_required';
    end if;
    update public.spaces set status='active' where id=s.id;
    perform public.record_provisioning_audit(auth.uid(),'space_restored','space',s.id,jsonb_build_object('kind',s.kind));
  else raise exception using errcode='22023',message='invalid_operation'; end if;
end $$;

-- Creation, acceptance and resend update an invitation and are blocked while the
-- Team space is archived/suspended. Revocation remains possible for cleanup.
create or replace function public.guard_invitations_for_inactive_team()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare changes_invitation_state boolean;
begin
  changes_invitation_state := tg_op='INSERT';
  if tg_op='UPDATE' then
    changes_invitation_state := new.token_hash is distinct from old.token_hash
      or new.accepted_at is distinct from old.accepted_at;
  end if;

  if changes_invitation_state then
    -- Serialization contract: invitation mutations lock their invitation row
    -- (when one exists), then this trigger locks the Team Space. Lifecycle
    -- mutations lock only the Team Space and never an invitation row, so there
    -- is no reverse lock order. Status is validated while holding that lock.
    perform 1 from public.spaces
      where organization_id=new.organization_id and kind='team' and status='active'
      for update;
    if not found then
      raise exception using errcode='55000',message='team_space_inactive';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_invitations_for_inactive_team on public.organization_invitations;
create trigger guard_invitations_for_inactive_team before insert or update on public.organization_invitations
for each row execute function public.guard_invitations_for_inactive_team();

revoke all on function public.get_workspace_settings(uuid), public.update_workspace_settings(uuid,text,text), public.guard_invitations_for_inactive_team() from public, anon, authenticated;
grant execute on function public.get_workspace_settings(uuid), public.update_workspace_settings(uuid,text,text) to authenticated;

comment on column public.spaces.status is 'Product lifecycle independent from entitlement status; no hard-delete state.';
comment on function public.update_workspace_settings(uuid,text,text) is 'Owner-only Core settings and archive/restore transitions; suspension is system-only.';
