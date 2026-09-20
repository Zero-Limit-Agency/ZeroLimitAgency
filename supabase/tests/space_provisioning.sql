-- Run after all repository migrations in a disposable local Supabase database.
begin;

do $$
begin
  begin
    insert into public.zero_limit_entitlements(key, source) values ('invalid_scope', 'system');
    raise exception 'expected zero-scope entitlement rejection';
  exception when check_violation then null; end;
end $$;

do $$
declare profile_value uuid; first_space uuid;
begin
  insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
  values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','provision@example.test','',now(),now(),now()) on conflict do nothing;
  insert into public.profiles(id,auth_user_id,username,display_name) values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','provision_test','Provision Test') returning id into profile_value;
  insert into public.spaces(kind,name,owner_profile_id,personal_profession) values ('personal','Coach',profile_value,'coach') returning id into first_space;
  begin
    insert into public.spaces(kind,name,owner_profile_id,personal_profession) values ('personal','Coach bis',profile_value,'coach');
    raise exception 'expected duplicate Personal rejection';
  exception when unique_violation then null; end;
  insert into public.spaces(kind,name,owner_profile_id) values ('creator','Creator',profile_value);
  begin
    insert into public.spaces(kind,name,owner_profile_id) values ('creator','Creator bis',profile_value);
    raise exception 'expected duplicate Creator rejection';
  exception when unique_violation then null; end;
  begin
    insert into public.zero_limit_entitlements(key,profile_id,space_id,source) values ('invalid_cross_scope',profile_value,first_space,'system');
    raise exception 'expected cross-scope rejection';
  exception when check_violation then null; end;
  delete from public.spaces where owner_profile_id=profile_value;
end $$;

select set_config('request.jwt.claim.role','service_role',true);
do $$
declare first_result uuid; retry_result uuid;
begin
  first_result := public.provision_personal_space('10000000-0000-0000-0000-000000000001','coach','system');
  retry_result := public.provision_personal_space('10000000-0000-0000-0000-000000000001','coach','system');
  if first_result <> retry_result then raise exception 'Personal retry returned a different space'; end if;

  first_result := public.provision_creator_space('10000000-0000-0000-0000-000000000001','system');
  retry_result := public.provision_creator_space('10000000-0000-0000-0000-000000000001','system');
  if first_result <> retry_result then raise exception 'Creator retry returned a different space'; end if;

  first_result := public.provision_team('10000000-0000-0000-0000-000000000001','Provision Team','provision-team','system');
  retry_result := public.provision_team('10000000-0000-0000-0000-000000000001','Provision Team','provision-team','system');
  if first_result <> retry_result then raise exception 'Team retry returned a different space'; end if;

  if (select count(*) from public.audit_logs where action='personal_space_created') <> 1 then raise exception 'Personal retry wrote false created audit'; end if;
  if (select count(*) from public.audit_logs where action='creator_space_created') <> 1 then raise exception 'Creator retry wrote false created audit'; end if;
  if (select count(*) from public.audit_logs where action='organization_created') <> 1 then raise exception 'Team retry wrote false created audit'; end if;
  if (select count(*) from public.audit_logs where action='entitlement_granted') <> 3 then raise exception 'retry wrote false entitlement audit'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$
begin
  begin
    perform public.provision_personal_space('10000000-0000-0000-0000-000000000001','manager_agent','system');
    raise exception 'authenticated caller bypassed backend-only provisioning';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.zero_limit_entitlements(key,profile_id,source)
    values ('self_grant','20000000-0000-0000-0000-000000000001','system');
    raise exception 'authenticated user self-granted an entitlement';
  exception when insufficient_privilege then null; end;
  begin
    perform metadata from public.zero_limit_entitlements limit 1;
    raise exception 'authenticated caller read entitlement metadata';
  exception when insufficient_privilege then null; end;
  begin
    perform token_hash from public.organization_invitations limit 1;
    raise exception 'authenticated user directly read invitation hashes';
  exception when insufficient_privilege then null; end;
end $$;

reset role;

rollback;
