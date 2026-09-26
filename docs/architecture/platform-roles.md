# Platform roles

`public.platform_roles` is the sole OWNER source of truth. The Core intentionally defines only `owner`; old `platform_owner` rows are normalized by the additive migration. RLS is enabled and every privilege is explicitly revoked from `PUBLIC`, `anon`, and `authenticated`. Reads and writes happen server-side with the service role.

## Assignment, revocation and bootstrap

There is no HTTP bootstrap endpoint and the migration promotes nobody. Bootstrap is a controlled SQL/service-role operation after an operator has verified both Auth identities out of band. Staging seeds must never run in production.

Set `target_auth_user_id` to the future OWNER's Auth UUID and `operator_auth_user_id` to the accountable operator's Auth UUID. Execute the following as one transaction. The profile lookups must each return the intended identity before executing the insert. The insert deliberately has no `ON CONFLICT`: an already assigned OWNER fails visibly instead of masquerading as a new grant.

```sql
begin;

do $$
declare
  target_profile_id uuid;
  actor_profile_id uuid;
  grant_correlation_id uuid := gen_random_uuid();
begin
  -- 1. Resolve exactly one verified target Zero Limit ID or abort.
  select id into strict target_profile_id
  from public.profiles
  where auth_user_id = '<target_auth_user_id>'::uuid;

  -- 2. Resolve the accountable actor profile when that Auth user has one.
  select id into actor_profile_id
  from public.profiles
  where auth_user_id = '<operator_auth_user_id>'::uuid;

  -- 3. Grant exactly the canonical role. A pre-existing row fails on the PK.
  insert into public.platform_roles (profile_id, role, granted_by)
  values (target_profile_id, 'owner', '<operator_auth_user_id>'::uuid);

  -- 4. Record the explicit OWNER security event without email or other PII.
  insert into public.audit_logs (
    actor_user_id, actor_profile_id, actor_role, action, resource_type,
    resource_id, correlation_id, result, metadata
  ) values (
    '<operator_auth_user_id>'::uuid,
    actor_profile_id,
    'service_role',
    'owner_role_granted',
    'platform_role',
    target_profile_id::text,
    grant_correlation_id,
    'success',
    '{}'::jsonb
  );
end $$;

-- Must return exactly the verified target and its canonical role.
select profile_id, role, granted_at, granted_by
from public.platform_roles
where profile_id = (
  select id from public.profiles
  where auth_user_id = '<target_auth_user_id>'::uuid
);

commit;
```

If the target Auth UUID has no unique profile, `INTO STRICT` aborts the transaction. The actor profile remains nullable when the accountable Auth user has no Zero Limit ID. A pre-existing platform-role row raises a primary-key violation, so an existing OWNER is never reported as a fresh grant. No email, PII metadata, or hardcoded founder UUID belongs in a migration.

Later grants/revocations require an OWNER-only server transaction with correlation ID, MFA/AAL2 step-up, explicit confirmation, and `owner_role_granted`/`owner_role_revoked` audit events. No such mutation endpoint exists in the Core.

A locking trigger protects both deletion and future demotion of the final OWNER. It locks `platform_roles` before counting, serializing concurrent removals. Updates which preserve `role='owner'` are allowed. Multiple owners are supported; the number two is never encoded.
