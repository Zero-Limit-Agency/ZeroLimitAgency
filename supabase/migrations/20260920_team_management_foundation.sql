-- Team management foundation. Ownership remains canonical on
-- organizations.owner_profile_id; membership roles remain admin/member only.

create function public.get_team_members(organization_value uuid)
returns table (
  membership_id uuid,
  profile_id uuid,
  display_name text,
  username text,
  role text,
  is_owner boolean,
  joined_at timestamptz
)
language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  if public.current_profile_id() is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if not public.is_organization_member(organization_value) then
    raise exception using errcode = '42501', message = 'insufficient_permission';
  end if;

  return query
  select m.id, p.id, p.display_name, p.username, m.role,
    o.owner_profile_id = p.id, m.created_at
  from public.organization_memberships m
  join public.profiles p on p.id = m.profile_id
  join public.organizations o on o.id = m.organization_id
  where m.organization_id = organization_value
  order by (o.owner_profile_id = p.id) desc, m.role, lower(p.display_name), p.id;
end $$;

create function public.get_pending_team_invitations(organization_value uuid)
returns table (
  id uuid,
  email text,
  role text,
  expires_at timestamptz,
  created_at timestamptz,
  invited_by_display_name text
)
language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id();
begin
  if actor_profile_id is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if not exists (
    select 1 from public.organizations o
    left join public.organization_memberships m
      on m.organization_id = o.id and m.profile_id = actor_profile_id
    where o.id = organization_value
      and (o.owner_profile_id = actor_profile_id or m.role = 'admin')
  ) then
    raise exception using errcode = '42501', message = 'insufficient_permission';
  end if;

  return query
  select i.id, i.email, i.role, i.expires_at, i.created_at, p.display_name
  from public.organization_invitations i
  join public.profiles p on p.id = i.invited_by_profile_id
  where i.organization_id = organization_value
    and i.accepted_at is null and i.revoked_at is null
  order by i.created_at desc, i.id;
end $$;

create function public.update_team_member_role(
  organization_value uuid,
  membership_value uuid,
  role_value text
)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); target public.organization_memberships%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000', message='authentication_required'; end if;
  if role_value not in ('admin', 'member') then raise exception using errcode='22023', message='invalid_role'; end if;
  perform 1 from public.organizations where id = organization_value for update;
  if not public.is_organization_owner(organization_value) then raise exception using errcode='42501', message='insufficient_permission'; end if;
  select * into target from public.organization_memberships
    where id = membership_value and organization_id = organization_value for update;
  if not found then raise exception using errcode='P0002', message='target_not_member'; end if;
  if public.is_organization_owner(organization_value) and exists (
    select 1 from public.organizations where id=organization_value and owner_profile_id=target.profile_id
  ) then raise exception using errcode='42501', message='owner_protected'; end if;
  if target.role = role_value then return; end if;
  update public.organization_memberships set role = role_value where id = target.id;
  perform public.record_provisioning_audit(auth.uid(), 'team_member_role_changed', 'organization_membership', target.id,
    jsonb_build_object('organization_id', organization_value, 'from_role', target.role, 'to_role', role_value));
end $$;

create function public.remove_team_member(organization_value uuid, membership_value uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); actor_is_owner boolean; actor_is_admin boolean; target public.organization_memberships%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000', message='authentication_required'; end if;
  perform 1 from public.organizations where id = organization_value for update;
  actor_is_owner := public.is_organization_owner(organization_value);
  select exists(select 1 from public.organization_memberships where organization_id=organization_value and profile_id=actor_profile_id and role='admin') into actor_is_admin;
  if not actor_is_owner and not actor_is_admin then raise exception using errcode='42501', message='insufficient_permission'; end if;
  select * into target from public.organization_memberships where id=membership_value and organization_id=organization_value for update;
  if not found then return; end if;
  if exists(select 1 from public.organizations where id=organization_value and owner_profile_id=target.profile_id) then raise exception using errcode='42501', message='owner_protected'; end if;
  if target.profile_id = actor_profile_id then raise exception using errcode='42501', message='use_leave_team'; end if;
  if not actor_is_owner and target.role <> 'member' then raise exception using errcode='42501', message='insufficient_permission'; end if;
  delete from public.organization_memberships where id=target.id;
  perform public.record_provisioning_audit(auth.uid(), 'team_member_removed', 'organization_membership', target.id,
    jsonb_build_object('organization_id', organization_value, 'removed_profile_id', target.profile_id, 'role', target.role));
end $$;

create function public.leave_team(organization_value uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); target public.organization_memberships%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000', message='authentication_required'; end if;
  perform 1 from public.organizations where id=organization_value for update;
  if public.is_organization_owner(organization_value) then raise exception using errcode='42501', message='cannot_leave_as_owner'; end if;
  select * into target from public.organization_memberships where organization_id=organization_value and profile_id=actor_profile_id for update;
  if not found then raise exception using errcode='P0002', message='already_removed'; end if;
  delete from public.organization_memberships where id=target.id;
  perform public.record_provisioning_audit(auth.uid(), 'team_member_left', 'organization_membership', target.id,
    jsonb_build_object('organization_id', organization_value, 'role', target.role));
end $$;

create function public.revoke_team_invitation(organization_value uuid, invitation_value uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); invitation public.organization_invitations%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000', message='authentication_required'; end if;
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=actor_profile_id where o.id=organization_value and (o.owner_profile_id=actor_profile_id or m.role='admin')) then raise exception using errcode='42501', message='insufficient_permission'; end if;
  select * into invitation from public.organization_invitations where id=invitation_value and organization_id=organization_value for update;
  if not found or invitation.revoked_at is not null then return; end if;
  if invitation.accepted_at is not null then raise exception using errcode='22023', message='invitation_already_used'; end if;
  update public.organization_invitations set revoked_at=timezone('utc',now()) where id=invitation.id;
  perform public.record_provisioning_audit(auth.uid(), 'team_invitation_revoked', 'organization_invitation', invitation.id,
    jsonb_build_object('organization_id', organization_value, 'role', invitation.role));
end $$;

create function public.resend_team_invitation(organization_value uuid, invitation_value uuid, token_hash_value text, expires_at_value timestamptz)
returns text language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor_profile_id uuid := public.current_profile_id(); invitation public.organization_invitations%rowtype;
begin
  if actor_profile_id is null then raise exception using errcode='28000', message='authentication_required'; end if;
  if expires_at_value <= timezone('utc',now()) or expires_at_value > timezone('utc',now()) + interval '30 days' then raise exception using errcode='22023', message='invalid_expiry'; end if;
  if token_hash_value !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023', message='invalid_token_hash'; end if;
  if not exists(select 1 from public.organizations o left join public.organization_memberships m on m.organization_id=o.id and m.profile_id=actor_profile_id where o.id=organization_value and (o.owner_profile_id=actor_profile_id or m.role='admin')) then raise exception using errcode='42501', message='insufficient_permission'; end if;
  select * into invitation from public.organization_invitations where id=invitation_value and organization_id=organization_value for update;
  if not found then raise exception using errcode='P0002', message='invitation_invalid'; end if;
  if invitation.accepted_at is not null then raise exception using errcode='22023', message='invitation_already_used'; end if;
  if invitation.revoked_at is not null then raise exception using errcode='22023', message='invitation_revoked'; end if;
  update public.organization_invitations set token_hash=token_hash_value, expires_at=expires_at_value where id=invitation.id;
  perform public.record_provisioning_audit(auth.uid(), 'team_invitation_resent', 'organization_invitation', invitation.id,
    jsonb_build_object('organization_id', organization_value, 'role', invitation.role));
  return invitation.email;
end $$;

revoke all on function public.get_team_members(uuid), public.get_pending_team_invitations(uuid),
  public.update_team_member_role(uuid,uuid,text), public.remove_team_member(uuid,uuid),
  public.leave_team(uuid), public.revoke_team_invitation(uuid,uuid),
  public.resend_team_invitation(uuid,uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.get_team_members(uuid), public.get_pending_team_invitations(uuid),
  public.update_team_member_role(uuid,uuid,text), public.remove_team_member(uuid,uuid),
  public.leave_team(uuid), public.revoke_team_invitation(uuid,uuid),
  public.resend_team_invitation(uuid,uuid,text,timestamptz) to authenticated;

comment on function public.get_team_members(uuid) is 'Member-safe organization roster; never returns email or auth_user_id.';
comment on function public.get_pending_team_invitations(uuid) is 'Owner/admin invitation projection; never returns token_hash.';
