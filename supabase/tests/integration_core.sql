begin;
select plan(26);
insert into auth.users(id,email) values
 ('70000000-0000-0000-0000-000000000001','integration-owner-a@example.test'),
 ('70000000-0000-0000-0000-000000000002','integration-owner-b@example.test'),
 ('70000000-0000-0000-0000-000000000003','integration-admin-a@example.test'),
 ('70000000-0000-0000-0000-000000000004','integration-member-a@example.test');
insert into public.profiles(id,auth_user_id,username,display_name) values
 ('71000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','integration_owner_a','Owner A'),
 ('71000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000002','integration_owner_b','Owner B'),
 ('71000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000003','integration_admin_a','Admin A'),
 ('71000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000004','integration_member_a','Member A');
insert into public.organizations(id,name,slug,owner_profile_id) values
 ('72000000-0000-0000-0000-000000000001','Org A','integration-org-a','71000000-0000-0000-0000-000000000001'),
 ('72000000-0000-0000-0000-000000000002','Org B','integration-org-b','71000000-0000-0000-0000-000000000002');
insert into public.organization_memberships(organization_id,profile_id,role) values
 ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000003','admin'),
 ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000004','member');
insert into public.integration_connections(id,provider,scope_type,profile_id,organization_id,external_account_id,status,connected_at,scopes) values
 ('73000000-0000-0000-0000-000000000001','discord','profile','71000000-0000-0000-0000-000000000001',null,'discord-a','active',now(),'{identify}'),
 ('73000000-0000-0000-0000-000000000002','discord','profile','71000000-0000-0000-0000-000000000002',null,'discord-b','active',now(),'{identify}'),
 ('73000000-0000-0000-0000-000000000003','discord','organization',null,'72000000-0000-0000-0000-000000000001','guild-a','active',now(),'{guilds}'),
 ('73000000-0000-0000-0000-000000000004','google','organization',null,'72000000-0000-0000-0000-000000000001','drive-a','active',now(),'{drive.file}'),
 ('73000000-0000-0000-0000-000000000005','discord','organization',null,'72000000-0000-0000-0000-000000000002','guild-b','active',now(),'{guilds}');
insert into public.integration_credentials(connection_id,access_token_ciphertext,encryption_key_version) values
 ('73000000-0000-0000-0000-000000000001','test-fixture-not-a-real-token','test-only'),
 ('73000000-0000-0000-0000-000000000003','test-fixture-not-a-real-token','test-only');
select throws_ok($$insert into public.integration_connections(provider,scope_type,profile_id,organization_id,external_account_id) values('google','profile','71000000-0000-0000-0000-000000000001','72000000-0000-0000-0000-000000000001','bad')$$,'23514',null,'exactly one scope');
select throws_ok($$insert into public.integration_connections(provider,scope_type,profile_id,external_account_id) values('discord','profile','71000000-0000-0000-0000-000000000002','discord-a')$$,'23505',null,'personal external account unique');

set local role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000004',true);
select is((select count(*) from public.get_my_integration_connections()),2::bigint,'organization member reads safe projection');
select throws_ok($$select public.disconnect_integration('73000000-0000-0000-0000-000000000003')$$,'42501','integration_forbidden','simple member cannot manage');
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000003',true);
select throws_ok($$select public.disconnect_integration('73000000-0000-0000-0000-000000000005')$$,'42501','integration_forbidden','Org A admin cannot manage Org B');
select lives_ok($$select public.disconnect_integration('73000000-0000-0000-0000-000000000003')$$,'organization admin can manage');
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.disconnect_integration('73000000-0000-0000-0000-000000000004')$$,'organization owner can manage');
select lives_ok($$select public.disconnect_integration('73000000-0000-0000-0000-000000000001')$$,'profile owner disconnects own connection');
select is((select status from public.integration_connections where id='73000000-0000-0000-0000-000000000001'),'revoked','disconnect marks revoked');
select ok((select disconnected_at is not null from public.integration_connections where id='73000000-0000-0000-0000-000000000001'),'disconnect timestamps connection');
select ok((select access_token_ciphertext is null and refresh_token_ciphertext is null and revoked_at is not null from public.integration_credentials where connection_id='73000000-0000-0000-0000-000000000001'),'disconnect clears credentials');
select is((select count(*) from public.audit_logs where action='integration_disconnected' and resource_id='73000000-0000-0000-0000-000000000001'),1::bigint,'disconnect audits once');
select lives_ok($$select public.disconnect_integration('73000000-0000-0000-0000-000000000001')$$,'second disconnect is no-op');
select is((select count(*) from public.audit_logs where action='integration_disconnected' and resource_id='73000000-0000-0000-0000-000000000001'),1::bigint,'no duplicate disconnect audit');
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.disconnect_integration('73000000-0000-0000-0000-000000000001')$$,'42501','integration_forbidden','user B cannot disconnect user A');
select throws_ok($$select * from public.integration_credentials$$,'42501',null,'browser cannot read credentials');
select throws_ok($$select * from public.integration_connections$$,'42501',null,'browser cannot read raw connections');
reset role;

insert into public.integration_oauth_states(state_hash,profile_id,provider,return_path,expires_at) values
 (repeat('a',64),'71000000-0000-0000-0000-000000000001','google','/identite',now()+interval '10 minutes'),
 (repeat('b',64),'71000000-0000-0000-0000-000000000001','google','/identite',now()-interval '1 minute'),
 (repeat('c',64),'71000000-0000-0000-0000-000000000001','google','/identite',now()+interval '10 minutes'),
 (repeat('d',64),'71000000-0000-0000-0000-000000000001','google','/identite',now()+interval '10 minutes');
select is(public.consume_integration_oauth_state(repeat('a',64),'71000000-0000-0000-0000-000000000001','google'),'/identite','valid state consumed once');
select throws_ok($$select public.consume_integration_oauth_state(repeat('a',64),'71000000-0000-0000-0000-000000000001','google')$$,'22023','integration_state_invalid','state replay denied');
select throws_ok($$select public.consume_integration_oauth_state(repeat('b',64),'71000000-0000-0000-0000-000000000001','google')$$,'22023','integration_state_invalid','expired state denied');
select throws_ok($$select public.consume_integration_oauth_state(repeat('c',64),'71000000-0000-0000-0000-000000000001','discord')$$,'22023','integration_state_invalid','provider mismatch denied');
select throws_ok($$select public.consume_integration_oauth_state(repeat('d',64),'71000000-0000-0000-0000-000000000002','google')$$,'22023','integration_state_invalid','profile mismatch denied');
select ok(not exists(select 1 from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where c.oid='public.integration_credentials'::regclass and a.grantee=0 and a.privilege_type='SELECT'),'PUBLIC has no credential select');
select ok(not has_table_privilege('authenticated','public.integration_credentials','select'),'authenticated has no credential select');
select ok(has_function_privilege('service_role','public.consume_integration_oauth_state(text,uuid,text)','execute'),'state consume is explicit service role');
select ok(not has_function_privilege('authenticated','public.consume_integration_oauth_state(text,uuid,text)','execute'),'state consume is not browser callable');
select * from finish();
rollback;
