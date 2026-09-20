-- Dynamic Team management/RLS regression scenario.
-- Run after `supabase db reset` in a disposable local database.
begin;

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('11000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner@test.invalid','',now(),now(),now()),
 ('11000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@test.invalid','',now(),now(),now()),
 ('11000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','member@test.invalid','',now(),now(),now()),
 ('11000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','foreign@test.invalid','',now(),now(),now());
insert into public.profiles(id,auth_user_id,username,display_name) values
 ('21000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','team_owner','Owner'),
 ('21000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000002','team_admin','Admin'),
 ('21000000-0000-0000-0000-000000000003','11000000-0000-0000-0000-000000000003','team_member','Member'),
 ('21000000-0000-0000-0000-000000000004','11000000-0000-0000-0000-000000000004','team_foreign','Foreign');
insert into public.organizations(id,name,slug,owner_profile_id) values
 ('31000000-0000-0000-0000-000000000001','Managed Team','managed-team','21000000-0000-0000-0000-000000000001'),
 ('31000000-0000-0000-0000-000000000002','Foreign Team','foreign-team','21000000-0000-0000-0000-000000000004');
insert into public.spaces(id,kind,name,organization_id) values
 ('51000000-0000-0000-0000-000000000001','team','Managed Team','31000000-0000-0000-0000-000000000001'),
 ('51000000-0000-0000-0000-000000000002','team','Foreign Team','31000000-0000-0000-0000-000000000002');
insert into public.zero_limit_entitlements(id,key,organization_id,source) values
 ('61000000-0000-0000-0000-000000000001','team_access','31000000-0000-0000-0000-000000000001','system'),
 ('61000000-0000-0000-0000-000000000002','team_access','31000000-0000-0000-0000-000000000002','system');
insert into public.organization_memberships(id,organization_id,profile_id,role) values
 ('41000000-0000-0000-0000-000000000002','31000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000002','admin'),
 ('41000000-0000-0000-0000-000000000003','31000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000003','member');
insert into public.organization_invitations(id,organization_id,email,role,token_hash,invited_by_profile_id,expires_at) values
 ('71000000-0000-0000-0000-000000000001','31000000-0000-0000-0000-000000000001','owner@test.invalid','member',repeat('a',64),'21000000-0000-0000-0000-000000000001',now()+interval '7 days');

-- Direct RPC operational gate: lifecycle and entitlement are enforced in SQL,
-- while revoke/leave deliberately remain escape hatches.
update public.spaces set status='archived' where id='51000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000001',true);
do $$ begin
  begin perform * from public.get_team_members('31000000-0000-0000-0000-000000000001'); raise exception 'archived roster succeeded'; exception when object_not_in_prerequisite_state then null; end;
  begin perform * from public.get_pending_team_invitations('31000000-0000-0000-0000-000000000001'); raise exception 'archived invitations succeeded'; exception when object_not_in_prerequisite_state then null; end;
  begin perform public.update_team_member_role('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','admin'); raise exception 'archived role update succeeded'; exception when object_not_in_prerequisite_state then null; end;
  begin perform public.remove_team_member('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003'); raise exception 'archived remove succeeded'; exception when object_not_in_prerequisite_state then null; end;
  begin perform public.resend_team_invitation('31000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001',repeat('b',64),now()+interval '7 days'); raise exception 'archived resend succeeded'; exception when object_not_in_prerequisite_state then null; end;
  begin perform public.create_team_invitation('31000000-0000-0000-0000-000000000001','new@test.invalid','member',repeat('f',64),now()+interval '7 days'); raise exception 'archived create invitation succeeded'; exception when object_not_in_prerequisite_state then null; end;
  begin perform public.accept_team_invitation(repeat('a',64)); raise exception 'archived accept invitation succeeded'; exception when object_not_in_prerequisite_state then null; end;
end $$;
savepoint archived_revoke;
select public.revoke_team_invitation('31000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001');
rollback to archived_revoke;
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000003',true);
savepoint archived_leave;
select public.leave_team('31000000-0000-0000-0000-000000000001');
rollback to archived_leave;

reset role;
update public.spaces set status='suspended' where id='51000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000001',true);
do $$ declare statement text; begin
  foreach statement in array array[
    'select * from public.get_team_members(''31000000-0000-0000-0000-000000000001'')',
    'select * from public.get_pending_team_invitations(''31000000-0000-0000-0000-000000000001'')',
    'select public.update_team_member_role(''31000000-0000-0000-0000-000000000001'',''41000000-0000-0000-0000-000000000003'',''admin'')',
    'select public.remove_team_member(''31000000-0000-0000-0000-000000000001'',''41000000-0000-0000-0000-000000000003'')',
    'select public.resend_team_invitation(''31000000-0000-0000-0000-000000000001'',''71000000-0000-0000-0000-000000000001'',repeat(''b'',64),now()+interval ''7 days'')',
    'select public.create_team_invitation(''31000000-0000-0000-0000-000000000001'',''new@test.invalid'',''member'',repeat(''f'',64),now()+interval ''7 days'')',
    'select public.accept_team_invitation(repeat(''a'',64))'
  ] loop begin execute statement; raise exception 'suspended Team operation succeeded: %',statement; exception when object_not_in_prerequisite_state then null; end; end loop;
end $$;

reset role;
update public.spaces set status='active' where id='51000000-0000-0000-0000-000000000001';
update public.zero_limit_entitlements set status='revoked' where id='61000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000001',true);
do $$ declare statement text; begin
  foreach statement in array array[
    'select * from public.get_team_members(''31000000-0000-0000-0000-000000000001'')','select * from public.get_pending_team_invitations(''31000000-0000-0000-0000-000000000001'')',
    'select public.update_team_member_role(''31000000-0000-0000-0000-000000000001'',''41000000-0000-0000-0000-000000000003'',''admin'')','select public.remove_team_member(''31000000-0000-0000-0000-000000000001'',''41000000-0000-0000-0000-000000000003'')',
    'select public.resend_team_invitation(''31000000-0000-0000-0000-000000000001'',''71000000-0000-0000-0000-000000000001'',repeat(''c'',64),now()+interval ''7 days'')',
    'select public.create_team_invitation(''31000000-0000-0000-0000-000000000001'',''new@test.invalid'',''member'',repeat(''f'',64),now()+interval ''7 days'')','select public.accept_team_invitation(repeat(''a'',64))'
  ] loop begin execute statement; raise exception 'revoked entitlement operation succeeded: %',statement; exception when insufficient_privilege then null; end; end loop;
end $$;
savepoint revoked_entitlement_revoke;
select public.revoke_team_invitation('31000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001');
rollback to revoked_entitlement_revoke;
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000003',true);
savepoint revoked_entitlement_leave;
select public.leave_team('31000000-0000-0000-0000-000000000001');
rollback to revoked_entitlement_leave;
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000001',true);
reset role;
update public.zero_limit_entitlements set status='suspended' where id='61000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$ declare statement text; begin
  foreach statement in array array[
    'select * from public.get_team_members(''31000000-0000-0000-0000-000000000001'')','select * from public.get_pending_team_invitations(''31000000-0000-0000-0000-000000000001'')',
    'select public.update_team_member_role(''31000000-0000-0000-0000-000000000001'',''41000000-0000-0000-0000-000000000003'',''admin'')','select public.remove_team_member(''31000000-0000-0000-0000-000000000001'',''41000000-0000-0000-0000-000000000003'')',
    'select public.resend_team_invitation(''31000000-0000-0000-0000-000000000001'',''71000000-0000-0000-0000-000000000001'',repeat(''d'',64),now()+interval ''7 days'')',
    'select public.create_team_invitation(''31000000-0000-0000-0000-000000000001'',''new@test.invalid'',''member'',repeat(''f'',64),now()+interval ''7 days'')','select public.accept_team_invitation(repeat(''a'',64))'
  ] loop begin execute statement; raise exception 'suspended entitlement operation succeeded: %',statement; exception when insufficient_privilege then null; end; end loop;
end $$;
reset role;
update public.zero_limit_entitlements set status='active',starts_at=now()-interval '2 days',expires_at=now()-interval '1 day' where id='61000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$ declare statement text; begin
  foreach statement in array array[
    'select * from public.get_team_members(''31000000-0000-0000-0000-000000000001'')','select * from public.get_pending_team_invitations(''31000000-0000-0000-0000-000000000001'')',
    'select public.update_team_member_role(''31000000-0000-0000-0000-000000000001'',''41000000-0000-0000-0000-000000000003'',''admin'')','select public.remove_team_member(''31000000-0000-0000-0000-000000000001'',''41000000-0000-0000-0000-000000000003'')',
    'select public.resend_team_invitation(''31000000-0000-0000-0000-000000000001'',''71000000-0000-0000-0000-000000000001'',repeat(''e'',64),now()+interval ''7 days'')',
    'select public.create_team_invitation(''31000000-0000-0000-0000-000000000001'',''new@test.invalid'',''member'',repeat(''f'',64),now()+interval ''7 days'')','select public.accept_team_invitation(repeat(''a'',64))'
  ] loop begin execute statement; raise exception 'expired entitlement operation succeeded: %',statement; exception when insufficient_privilege then null; end; end loop;
end $$;
reset role;
update public.zero_limit_entitlements set status='active',starts_at=now(),expires_at=null where id='61000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000001',true);
savepoint active_create_invitation;
select public.create_team_invitation('31000000-0000-0000-0000-000000000001','new@test.invalid','member',repeat('f',64),now()+interval '7 days');
rollback to active_create_invitation;
savepoint active_accept_invitation;
select public.accept_team_invitation(repeat('a',64));
rollback to active_accept_invitation;

-- Member: roster allowed; invitation projection and mutations denied; leave allowed.
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000003',true);
do $$ begin
  if (select count(*) from public.get_team_members('31000000-0000-0000-0000-000000000001')) <> 3 then raise exception 'same-Team roster unavailable'; end if;
  begin perform * from public.get_pending_team_invitations('31000000-0000-0000-0000-000000000001'); raise exception 'member read invitations'; exception when insufficient_privilege then null; end;
  begin perform public.update_team_member_role('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','admin'); raise exception 'member self-promoted'; exception when insufficient_privilege then null; end;
  begin perform * from public.get_team_members('31000000-0000-0000-0000-000000000002'); raise exception 'cross-org roster leaked'; exception when insufficient_privilege then null; end;
end $$;

-- Admin: cannot manage owner/admin or roles, but can remove an ordinary member.
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000002',true);
do $$ begin
  begin perform public.update_team_member_role('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','admin'); raise exception 'admin promoted member'; exception when insufficient_privilege then null; end;
  begin perform public.remove_team_member('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000002'); raise exception 'admin removed itself through remove'; exception when insufficient_privilege then null; end;
  perform public.remove_team_member('31000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003');
end $$;

-- Owner membership is protected for role, removal and leave.
select set_config('request.jwt.claim.sub','11000000-0000-0000-0000-000000000001',true);
do $$ declare owner_membership uuid; begin
  select id into owner_membership from public.organization_memberships where organization_id='31000000-0000-0000-0000-000000000001' and profile_id='21000000-0000-0000-0000-000000000001';
  begin perform public.update_team_member_role('31000000-0000-0000-0000-000000000001',owner_membership,'member'); raise exception 'owner role changed'; exception when insufficient_privilege then null; end;
  begin perform public.remove_team_member('31000000-0000-0000-0000-000000000001',owner_membership); raise exception 'owner removed'; exception when insufficient_privilege then null; end;
  begin perform public.leave_team('31000000-0000-0000-0000-000000000001'); raise exception 'owner left'; exception when insufficient_privilege then null; end;
end $$;

rollback;
