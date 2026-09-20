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
insert into public.organization_memberships(id,organization_id,profile_id,role) values
 ('41000000-0000-0000-0000-000000000002','31000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000002','admin'),
 ('41000000-0000-0000-0000-000000000003','31000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000003','member');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);

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
