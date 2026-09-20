-- Run after all migrations in a disposable local Supabase/PostgreSQL database.
begin;

do $$
declare profile_value uuid; organization_value uuid; personal_space uuid; team_space uuid; account_value uuid;
begin
  insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
    values('11000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','billing@example.test','',now(),now(),now()) on conflict do nothing;
  insert into public.profiles(id,auth_user_id,username,display_name)
    values('21000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','billing_test','Billing Test') returning id into profile_value;
  insert into public.organizations(name,slug,owner_profile_id) values('Billing Org','billing-org',profile_value) returning id into organization_value;
  insert into public.spaces(kind,name,owner_profile_id,personal_profession) values('personal','Coach',profile_value,'coach') returning id into personal_space;
  insert into public.spaces(kind,name,organization_id) values('team','Team',organization_value) returning id into team_space;

  begin
    insert into public.billing_accounts(profile_id,organization_id,provider,provider_customer_id) values(profile_value,organization_value,'stripe','cus_invalid');
    raise exception 'expected exact payer scope rejection';
  exception when check_violation then null; end;
  insert into public.billing_accounts(profile_id,provider,provider_customer_id) values(profile_value,'stripe','cus_profile') returning id into account_value;
  begin
    insert into public.billing_accounts(profile_id,provider,provider_customer_id) values(profile_value,'stripe','cus_second');
    raise exception 'expected one provider customer per payer';
  exception when unique_violation then null; end;
  begin
    insert into public.billing_subscriptions(billing_account_id,provider,provider_subscription_id,plan_key,entitlement_key,target_space_id,target_kind,status,provider_updated_at)
      values(account_value,'stripe','sub_wrong_team','team','team_access',team_space,'team','active',now());
    perform set_config('request.jwt.claim.role','service_role',true);
    perform public.sync_subscription_entitlements((select id from public.billing_subscriptions where provider_subscription_id='sub_wrong_team'));
    raise exception 'expected cross-scope Team rejection';
  exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claim.role','service_role',true);
do $$
declare account_value uuid; result jsonb; sub_value uuid; manager_space uuid;
begin
  select id into account_value from public.billing_accounts where provider_customer_id='cus_profile';
  result := public.process_billing_subscription_event('stripe','evt_incomplete','customer.subscription.created',now(),now(),'sub_manager',repeat('a',64),account_value,null,'personal','manager_agent','cus_profile','personal_manager_agent','personal_access','incomplete',1,now(),now()+interval '1 month',false,null);
  if exists(select 1 from public.spaces where owner_profile_id='21000000-0000-0000-0000-000000000001' and personal_profession='manager_agent') then raise exception 'inactive billing provisioned a Space'; end if;

  result := public.process_billing_subscription_event('stripe','evt_active','customer.subscription.updated',now(),now()+interval '1 second','sub_manager',repeat('b',64),account_value,null,'personal','manager_agent','cus_profile','personal_manager_agent','personal_access','active',1,now(),now()+interval '1 month',false,null);
  select id into manager_space from public.spaces where owner_profile_id='21000000-0000-0000-0000-000000000001' and personal_profession='manager_agent';
  if manager_space is null then raise exception 'valid billing did not provision Personal'; end if;
  perform public.process_billing_subscription_event('stripe','evt_active','customer.subscription.updated',now(),now()+interval '1 second','sub_manager',repeat('b',64),account_value,null,'personal','manager_agent','cus_profile','personal_manager_agent','personal_access','active',1,now(),now()+interval '1 month',false,null);
  if (select count(*) from public.spaces where owner_profile_id='21000000-0000-0000-0000-000000000001' and personal_profession='manager_agent')<>1 then raise exception 'retry duplicated Personal'; end if;

  insert into public.zero_limit_entitlements(key,space_id,source) values('personal_access',manager_space,'manual');
  select id into sub_value from public.billing_subscriptions where provider_subscription_id='sub_manager';
  update public.billing_subscriptions set status='canceled',current_period_end=now()-interval '1 second' where id=sub_value;
  perform public.sync_subscription_entitlements(sub_value);
  if not exists(select 1 from public.zero_limit_entitlements where space_id=manager_space and source='manual' and status='active') then raise exception 'manual entitlement was changed'; end if;

  result := public.process_billing_subscription_event('stripe','evt_failed','customer.subscription.created',now(),now(),'sub_bad',repeat('c',64),account_value,null,'team',null,'cus_profile','team','team_access','active',1,now(),now()+interval '1 month',false,null);
  if not (result->>'failed')::boolean or not exists(select 1 from public.billing_webhook_events where provider_event_id='evt_failed' and status='failed') then raise exception 'failed inbox was not persisted'; end if;
  perform public.process_billing_subscription_event('stripe','evt_failed','customer.subscription.created',now(),now(),'sub_bad',repeat('c',64),account_value,null,'team',null,'cus_profile','team','team_access','active',1,now(),now()+interval '1 month',false,null);
  if (select attempt_count from public.billing_webhook_events where provider_event_id='evt_failed')<>2 then raise exception 'failed retry was not counted'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
do $$
begin
  begin perform id from public.billing_accounts; raise exception 'authenticated read billing account'; exception when insufficient_privilege then null; end;
  begin insert into public.billing_webhook_events(provider,provider_event_id,event_type,payload_hash,provider_created_at) values('stripe','evt_browser','x',repeat('a',64),now()); raise exception 'authenticated wrote inbox'; exception when insufficient_privilege then null; end;
end $$;
reset role;

rollback;
