-- Actual PostgreSQL/RLS regression scenario.
-- Run only after `supabase db reset` on a disposable local Supabase database:
--   supabase test db supabase/tests/zero_limit_id_rls.sql
begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test', '', now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test', '', now(), now());

insert into public.profiles (id, auth_user_id, username, display_name)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'rls_user_a', 'A'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'rls_user_b', 'B');

insert into public.organizations (id, name, slug, owner_profile_id)
values
  ('30000000-0000-0000-0000-000000000001', 'Team A', 'rls-team-a', '20000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', 'Team B', 'rls-team-b', '20000000-0000-0000-0000-000000000002');
insert into public.organization_memberships (organization_id, profile_id, role)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'member');

insert into public.spaces (kind, name, owner_profile_id, personal_profession)
values ('personal', 'Coach A', '20000000-0000-0000-0000-000000000001', 'coach'),
       ('personal', 'Manager A', '20000000-0000-0000-0000-000000000001', 'manager_agent'),
       ('personal', 'Coach B', '20000000-0000-0000-0000-000000000002', 'coach');
insert into public.spaces (kind, name, organization_id)
values ('team', 'Team A', '30000000-0000-0000-0000-000000000001'),
       ('team', 'Team B', '30000000-0000-0000-0000-000000000002');
insert into public.linked_accounts (profile_id, provider, provider_user_id)
values ('20000000-0000-0000-0000-000000000002', 'discord', 'discord-b');
insert into public.platform_roles (profile_id, role)
values ('20000000-0000-0000-0000-000000000002', 'owner');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

do $$
declare affected integer;
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'cross-user profile leak'; end if;
  if (select count(*) from public.spaces) <> 3 then raise exception 'cross-owner or cross-organization space leak'; end if;
  if (select count(*) from public.organizations) <> 1 then raise exception 'cross-organization leak'; end if;
  if (select count(*) from public.organization_memberships) <> 2 then raise exception 'unexpected membership visibility'; end if;
  if (select count(*) from public.linked_accounts) <> 0 then raise exception 'cross-user linked-account leak'; end if;
  if exists (select 1 from public.platform_roles) then raise exception 'platform authority leak'; end if;

  update public.profiles set display_name = 'intrusion' where username = 'rls_user_b';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'cross-user profile update succeeded'; end if;

  begin
    update public.profiles set auth_user_id = '10000000-0000-0000-0000-000000000002'
    where username = 'rls_user_a';
    raise exception 'auth identity replacement unexpectedly succeeded';
  exception when unique_violation or insufficient_privilege then null;
  end;

  begin
    insert into public.linked_accounts (profile_id, provider, provider_user_id)
    values ('20000000-0000-0000-0000-000000000001', 'discord', 'unverified-claim');
    raise exception 'unverified linked account insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.platform_roles (profile_id, role)
    values ('20000000-0000-0000-0000-000000000001', 'owner');
    raise exception 'platform owner escalation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

-- B is an ordinary member of Team A and must not promote itself there.
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
do $$
declare affected integer;
begin
  update public.organization_memberships set role = 'admin'
  where organization_id = '30000000-0000-0000-0000-000000000001'
    and profile_id = '20000000-0000-0000-0000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'member self-promotion succeeded'; end if;
end $$;

rollback;
