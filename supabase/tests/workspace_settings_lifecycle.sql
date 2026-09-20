-- Dynamic workspace settings/lifecycle regression scenario.
-- Run after `supabase db reset` in a disposable local PostgreSQL database.
begin;

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('12000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','settings-owner@test.invalid','',now(),now(),now()),
 ('12000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','settings-foreign@test.invalid','',now(),now(),now());
insert into public.profiles(id,auth_user_id,username,display_name) values
 ('22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000001','settings_owner','Settings Owner'),
 ('22000000-0000-0000-0000-000000000002','12000000-0000-0000-0000-000000000002','settings_foreign','Settings Foreign');
insert into public.spaces(id,kind,name,owner_profile_id,personal_profession) values
 ('32000000-0000-0000-0000-000000000001','personal','Coach space','22000000-0000-0000-0000-000000000001','coach');
insert into public.zero_limit_entitlements(key,space_id,source) values
 ('personal_access','32000000-0000-0000-0000-000000000001','system');
insert into public.organizations(id,name,slug,owner_profile_id) values
 ('42000000-0000-0000-0000-000000000001','Settings Team','settings-team','22000000-0000-0000-0000-000000000001');
insert into public.spaces(id,kind,name,organization_id) values
 ('52000000-0000-0000-0000-000000000001','team','Settings Team','42000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000002',true);
do $$ begin
  begin perform public.update_workspace_settings('32000000-0000-0000-0000-000000000001','rename_space','Attack'); raise exception 'cross-user rename succeeded'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000001',true);
do $$ begin
  begin update public.spaces set name='REST bypass' where id='32000000-0000-0000-0000-000000000001'; raise exception 'direct spaces.name update succeeded'; exception when insufficient_privilege then null; end;
  begin update public.spaces set status='archived' where id='32000000-0000-0000-0000-000000000001'; raise exception 'direct spaces.status update succeeded'; exception when insufficient_privilege then null; end;
  begin update public.organizations set name='REST bypass' where id='42000000-0000-0000-0000-000000000001'; raise exception 'direct organizations.name update succeeded'; exception when insufficient_privilege then null; end;
  begin update public.organizations set slug='rest-bypass' where id='42000000-0000-0000-0000-000000000001'; raise exception 'direct organizations.slug update succeeded'; exception when insufficient_privilege then null; end;
end $$;
select public.update_workspace_settings('32000000-0000-0000-0000-000000000001','rename_space','Renamed coach');
select public.update_workspace_settings('32000000-0000-0000-0000-000000000001','archive',null);
do $$ begin
  if (select status from public.spaces where id='32000000-0000-0000-0000-000000000001') <> 'archived' then raise exception 'archive failed'; end if;
  if not exists(select 1 from public.zero_limit_entitlements where space_id='32000000-0000-0000-0000-000000000001') then raise exception 'archive deleted entitlement'; end if;
  begin perform public.update_workspace_settings('32000000-0000-0000-0000-000000000001','rename_space','Archived rename'); raise exception 'archived rename succeeded'; exception when invalid_parameter_value then null; end;
end $$;
select public.update_workspace_settings('32000000-0000-0000-0000-000000000001','restore',null);

do $$ begin
  if (select status from public.spaces where id='32000000-0000-0000-0000-000000000001') <> 'active' then raise exception 'restore failed'; end if;
  if (select personal_profession from public.spaces where id='32000000-0000-0000-0000-000000000001') <> 'coach' then raise exception 'profession changed'; end if;
end $$;

-- Suspension is privileged setup only; authenticated RPC callers are read-only.
reset role;
update public.spaces set status='suspended' where id='32000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000001',true);
do $$ begin
  begin perform public.update_workspace_settings('32000000-0000-0000-0000-000000000001','rename_space','Suspended rename'); raise exception 'suspended rename succeeded'; exception when insufficient_privilege then null; end;
  begin perform public.update_workspace_settings('32000000-0000-0000-0000-000000000001','archive',null); raise exception 'suspended archive succeeded'; exception when insufficient_privilege then null; end;
  begin perform public.update_workspace_settings('32000000-0000-0000-0000-000000000001','restore',null); raise exception 'suspended restore succeeded'; exception when insufficient_privilege then null; end;
end $$;

rollback;
