-- Additive repair for Preview environments whose manually-applied migration
-- history may not contain the Team Management RPCs (or their grants).
--
-- Keep this file self-contained: do not rely on replaying the already-merged
-- foundation migration. Definitions intentionally remain compatible with the
-- workspace lifecycle migration; SECURITY DEFINER functions do not depend on
-- browser UPDATE grants revoked by that migration.

create or replace function public.assert_team_operational(organization_value uuid)
returns void language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare team_space_count bigint; active_team_space_count bigint; operational_entitlement_found boolean;
begin
  select count(*), count(*) filter (where status='active')
    into team_space_count, active_team_space_count
  from public.spaces
  where organization_id=organization_value and kind='team';
  if team_space_count<>1 or active_team_space_count<>1 then
    raise exception using errcode='55000',message='team_space_inactive';
  end if;
  select exists(
    select 1 from public.zero_limit_entitlements
    where organization_id=organization_value and key='team_access' and status='active'
      and starts_at<=timezone('utc',now())
      and (expires_at is null or expires_at>timezone('utc',now()))
  ) into operational_entitlement_found;
  if not coalesce(operational_entitlement_found,false) then
    raise exception using errcode='42501',message='entitlement_required';
  end if;
end $$;

create or replace function public.get_team_members(organization_value uuid)
returns table (
  membership_id uuid, profile_id uuid, display_name text, username text,
  role text, is_owner boolean, joined_at timestamptz
)
language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  if public.current_profile_id() is null then raise exception using errcode='28000', message='authentication_required'; end if;
  if not public.is_organization_member(organization_value) then raise exception using errcode='42501', message='insufficient_permission'; end if;
  perform public.assert_team_operational(organization_value);
  return query
  select m.id, p.id, p.display_name, p.username, m.role,
    o.owner_profile_id=p.id, m.created_at
  from public.organization_memberships m
  join public.profiles p on p.id=m.profile_id
  join public.organizations o on o.id=m.organization_id
  where m.organization_id=organization_value
  order by (o.owner_profile_id=p.id) desc, m.role, lower(p.display_name), p.id;
end $$;

create or replace function public.get_pending_team_invitations(organization_value uuid)
returns table (id uuid, email text, role text, expires_at timestamptz, created_at timestamptz, invited_by_display_name text)
language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id();
begin
  if actor_profile_id is null then raise exception using errcode='28000', message='authentication_required'; end if;
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=actor_profile_id where o.id=organization_value and (o.owner_profile_id=actor_profile_id or m.role='admin')) then
    raise exception using errcode='42501', message='insufficient_permission';
  end if;
  perform public.assert_team_operational(organization_value);
  return query select i.id,i.email,i.role,i.expires_at,i.created_at,p.display_name
  from public.organization_invitations i join public.profiles p on p.id=i.invited_by_profile_id
  where i.organization_id=organization_value and i.accepted_at is null and i.revoked_at is null
  order by i.created_at desc,i.id;
end $$;

create or replace function public.update_team_member_role(organization_value uuid, membership_value uuid, role_value text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); target public.organization_memberships%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000',message='authentication_required'; end if;
  if role_value not in ('admin','member') then raise exception using errcode='22023',message='invalid_role'; end if;
  if not public.is_organization_owner(organization_value) then raise exception using errcode='42501',message='insufficient_permission'; end if;
  perform 1 from public.spaces where organization_id=organization_value and kind='team' for update;
  perform 1 from public.organizations where id=organization_value for update;
  perform 1 from public.zero_limit_entitlements where organization_id=organization_value and key='team_access' for share;
  perform public.assert_team_operational(organization_value);
  if not public.is_organization_owner(organization_value) then raise exception using errcode='42501',message='insufficient_permission'; end if;
  select * into target from public.organization_memberships where id=membership_value and organization_id=organization_value for update;
  if not found then raise exception using errcode='P0002',message='target_not_member'; end if;
  if exists(select 1 from public.organizations where id=organization_value and owner_profile_id=target.profile_id) then raise exception using errcode='42501',message='owner_protected'; end if;
  if target.role=role_value then return; end if;
  update public.organization_memberships set role=role_value where id=target.id;
  perform public.record_provisioning_audit(auth.uid(),'team_member_role_changed','organization_membership',target.id,jsonb_build_object('organization_id',organization_value,'from_role',target.role,'to_role',role_value));
end $$;

create or replace function public.remove_team_member(organization_value uuid, membership_value uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); actor_is_owner boolean; actor_is_admin boolean; target public.organization_memberships%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000',message='authentication_required'; end if;
  actor_is_owner := public.is_organization_owner(organization_value);
  select exists(select 1 from public.organization_memberships where organization_id=organization_value and profile_id=actor_profile_id and role='admin') into actor_is_admin;
  if not actor_is_owner and not actor_is_admin then raise exception using errcode='42501',message='insufficient_permission'; end if;
  perform 1 from public.spaces where organization_id=organization_value and kind='team' for update;
  perform 1 from public.organizations where id=organization_value for update;
  perform 1 from public.zero_limit_entitlements where organization_id=organization_value and key='team_access' for share;
  perform public.assert_team_operational(organization_value);
  actor_is_owner := public.is_organization_owner(organization_value);
  select exists(select 1 from public.organization_memberships where organization_id=organization_value and profile_id=actor_profile_id and role='admin') into actor_is_admin;
  if not actor_is_owner and not actor_is_admin then raise exception using errcode='42501',message='insufficient_permission'; end if;
  select * into target from public.organization_memberships where id=membership_value and organization_id=organization_value for update;
  if not found then raise exception using errcode='P0002',message='target_not_member'; end if;
  if exists(select 1 from public.organizations where id=organization_value and owner_profile_id=target.profile_id) then raise exception using errcode='42501',message='owner_protected'; end if;
  if target.profile_id=actor_profile_id then raise exception using errcode='42501',message='use_leave_team'; end if;
  if not actor_is_owner and target.role<>'member' then raise exception using errcode='42501',message='insufficient_permission'; end if;
  delete from public.organization_memberships where id=target.id;
  perform public.record_provisioning_audit(auth.uid(),'team_member_removed','organization_membership',target.id,jsonb_build_object('organization_id',organization_value,'removed_profile_id',target.profile_id,'role',target.role));
end $$;

create or replace function public.leave_team(organization_value uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); target public.organization_memberships%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000',message='authentication_required'; end if;
  perform 1 from public.organizations where id=organization_value for update;
  if public.is_organization_owner(organization_value) then raise exception using errcode='42501',message='cannot_leave_as_owner'; end if;
  select * into target from public.organization_memberships where organization_id=organization_value and profile_id=actor_profile_id for update;
  if not found then raise exception using errcode='P0002',message='already_removed'; end if;
  delete from public.organization_memberships where id=target.id;
  perform public.record_provisioning_audit(auth.uid(),'team_member_left','organization_membership',target.id,jsonb_build_object('organization_id',organization_value,'role',target.role));
end $$;

create or replace function public.revoke_team_invitation(organization_value uuid, invitation_value uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); invitation public.organization_invitations%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000',message='authentication_required'; end if;
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=actor_profile_id where o.id=organization_value and (o.owner_profile_id=actor_profile_id or m.role='admin')) then raise exception using errcode='42501',message='insufficient_permission'; end if;
  select * into invitation from public.organization_invitations where id=invitation_value and organization_id=organization_value for update;
  if not found then raise exception using errcode='P0002',message='invitation_invalid'; end if;
  if invitation.revoked_at is not null then return; end if;
  if invitation.accepted_at is not null then raise exception using errcode='22023',message='invitation_already_used'; end if;
  update public.organization_invitations set revoked_at=timezone('utc',now()) where id=invitation.id;
  perform public.record_provisioning_audit(auth.uid(),'team_invitation_revoked','organization_invitation',invitation.id,jsonb_build_object('organization_id',organization_value,'role',invitation.role));
end $$;

create or replace function public.create_team_invitation(organization_value uuid, email_value text, role_value text, token_hash_value text, expires_at_value timestamptz)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare profile_value uuid; invitation_value uuid;
begin
  profile_value := public.current_profile_id();
  if profile_value is null then raise exception using errcode='28000',message='authentication_required'; end if;
  if role_value not in ('admin','member') then raise exception using errcode='22023',message='invalid_role'; end if;
  if expires_at_value <= timezone('utc',now()) or expires_at_value > timezone('utc',now()) + interval '30 days' then raise exception using errcode='22023',message='invalid_expiry'; end if;
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=profile_value where o.id=organization_value and (o.owner_profile_id=profile_value or m.role='admin')) then raise exception using errcode='42501',message='invitation_forbidden'; end if;
  perform 1 from public.spaces where organization_id=organization_value and kind='team' for update;
  perform 1 from public.organizations where id=organization_value for update;
  perform 1 from public.zero_limit_entitlements where organization_id=organization_value and key='team_access' for share;
  perform public.assert_team_operational(organization_value);
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=profile_value where o.id=organization_value and (o.owner_profile_id=profile_value or m.role='admin')) then raise exception using errcode='42501',message='invitation_forbidden'; end if;
  insert into public.organization_invitations(organization_id,email,role,token_hash,invited_by_profile_id,expires_at)
    values(organization_value,lower(btrim(email_value)),role_value,token_hash_value,profile_value,expires_at_value)
    on conflict (organization_id,email) where accepted_at is null and revoked_at is null
    do update set role=excluded.role,token_hash=excluded.token_hash,invited_by_profile_id=excluded.invited_by_profile_id,expires_at=excluded.expires_at,created_at=timezone('utc',now()) returning id into invitation_value;
  perform public.record_provisioning_audit(auth.uid(),'team_invitation_created','organization_invitation',invitation_value,jsonb_build_object('organization_id',organization_value,'role',role_value));
  return invitation_value;
end $$;

create or replace function public.accept_team_invitation(token_hash_value text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare profile_value uuid; invitation_row public.organization_invitations%rowtype; auth_email text; email_verified_at timestamptz; space_value uuid;
begin
  profile_value := public.current_profile_id();
  if profile_value is null then raise exception using errcode='28000',message='authentication_required'; end if;
  select lower(btrim(email)),email_confirmed_at into auth_email,email_verified_at from auth.users where id=auth.uid();
  if email_verified_at is null then raise exception using errcode='42501',message='invitation_email_unverified'; end if;
  select * into invitation_row from public.organization_invitations where token_hash=token_hash_value;
  if not found then raise exception using errcode='P0002',message='invitation_invalid'; end if;
  if invitation_row.email<>auth_email then raise exception using errcode='42501',message='invitation_email_mismatch'; end if;
  perform 1 from public.spaces where organization_id=invitation_row.organization_id and kind='team' for update;
  perform 1 from public.organizations where id=invitation_row.organization_id for update;
  perform 1 from public.zero_limit_entitlements where organization_id=invitation_row.organization_id and key='team_access' for share;
  perform public.assert_team_operational(invitation_row.organization_id);
  select * into invitation_row from public.organization_invitations where token_hash=token_hash_value for update;
  if not found then raise exception using errcode='P0002',message='invitation_invalid'; end if;
  if invitation_row.email<>auth_email then raise exception using errcode='42501',message='invitation_email_mismatch'; end if;
  if invitation_row.accepted_at is not null and invitation_row.accepted_by_profile_id<>profile_value then raise exception using errcode='22023',message='invitation_used'; end if;
  if invitation_row.accepted_at is not null then select id into space_value from public.spaces where organization_id=invitation_row.organization_id and kind='team'; return space_value; end if;
  if invitation_row.revoked_at is not null then raise exception using errcode='22023',message='invitation_revoked'; end if;
  if invitation_row.expires_at<=timezone('utc',now()) then raise exception using errcode='22023',message='invitation_expired'; end if;
  insert into public.organization_memberships(organization_id,profile_id,role) values(invitation_row.organization_id,profile_value,invitation_row.role) on conflict (organization_id,profile_id) do nothing;
  if invitation_row.accepted_at is null then
    update public.organization_invitations set accepted_at=timezone('utc',now()),accepted_by_profile_id=profile_value where id=invitation_row.id;
    perform public.record_provisioning_audit(auth.uid(),'team_invitation_accepted','organization_invitation',invitation_row.id,jsonb_build_object('organization_id',invitation_row.organization_id));
  end if;
  select id into space_value from public.spaces where organization_id=invitation_row.organization_id and kind='team';
  return space_value;
end $$;

create or replace function public.resend_team_invitation(organization_value uuid, invitation_value uuid, token_hash_value text, expires_at_value timestamptz)
returns text language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); invitation public.organization_invitations%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000',message='authentication_required'; end if;
  if expires_at_value<=timezone('utc',now()) or expires_at_value>timezone('utc',now())+interval '30 days' then raise exception using errcode='22023',message='invalid_expiry'; end if;
  if token_hash_value !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023',message='invalid_token_hash'; end if;
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=actor_profile_id where o.id=organization_value and (o.owner_profile_id=actor_profile_id or m.role='admin')) then raise exception using errcode='42501',message='insufficient_permission'; end if;
  perform 1 from public.spaces where organization_id=organization_value and kind='team' for update;
  perform 1 from public.organizations where id=organization_value for update;
  perform 1 from public.zero_limit_entitlements where organization_id=organization_value and key='team_access' for share;
  perform public.assert_team_operational(organization_value);
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=actor_profile_id where o.id=organization_value and (o.owner_profile_id=actor_profile_id or m.role='admin')) then raise exception using errcode='42501',message='insufficient_permission'; end if;
  select * into invitation from public.organization_invitations where id=invitation_value and organization_id=organization_value for update;
  if not found then raise exception using errcode='P0002',message='invitation_invalid'; end if;
  if invitation.accepted_at is not null then raise exception using errcode='22023',message='invitation_already_used'; end if;
  if invitation.revoked_at is not null then raise exception using errcode='22023',message='invitation_revoked'; end if;
  update public.organization_invitations set token_hash=token_hash_value,expires_at=expires_at_value where id=invitation.id;
  perform public.record_provisioning_audit(auth.uid(),'team_invitation_resent','organization_invitation',invitation.id,jsonb_build_object('organization_id',organization_value,'role',invitation.role));
  return invitation.email;
end $$;

revoke all on function public.assert_team_operational(uuid), public.get_team_members(uuid), public.get_pending_team_invitations(uuid),
  public.update_team_member_role(uuid,uuid,text), public.remove_team_member(uuid,uuid), public.leave_team(uuid),
  public.revoke_team_invitation(uuid,uuid), public.create_team_invitation(uuid,text,text,text,timestamptz),
  public.accept_team_invitation(text), public.resend_team_invitation(uuid,uuid,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.get_team_members(uuid), public.get_pending_team_invitations(uuid),
  public.update_team_member_role(uuid,uuid,text), public.remove_team_member(uuid,uuid), public.leave_team(uuid),
  public.revoke_team_invitation(uuid,uuid), public.create_team_invitation(uuid,text,text,text,timestamptz),
  public.accept_team_invitation(text), public.resend_team_invitation(uuid,uuid,text,timestamptz)
  to authenticated;

comment on function public.get_team_members(uuid) is 'Member-safe organization roster; never returns email or auth_user_id.';
comment on function public.get_pending_team_invitations(uuid) is 'Owner/admin invitation projection; never returns token_hash.';
