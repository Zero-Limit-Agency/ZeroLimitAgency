import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { hasExactlyOneEntitlementScope, isEntitlementActive } from "../../lib/zero-limit-id/entitlement-model.js";
import { canReturnPreviewInvitationToken, isInteractiveProvisioningEnabled } from "../../lib/zero-limit-id/environment.js";
import { teamInvitationReturnPath } from "../../lib/security/internal-return-url.js";

const migration = await readFile(new URL("../../supabase/migrations/20260920_space_provisioning_entitlements.sql", import.meta.url), "utf8");
const auditMigration = await readFile(new URL("../../supabase/migrations/20260703_security_policies_and_entitlements.sql", import.meta.url), "utf8");
const provisioningService = await readFile(new URL("../../lib/zero-limit-id/provisioning.js", import.meta.url), "utf8");
const provisioningRoute = await readFile(new URL("../../app/api/spaces/provision/route.js", import.meta.url), "utf8");

test("Zero Limit entitlements are separate and exactly one-scoped", () => { assert.match(migration,/create table public\.zero_limit_entitlements/);assert.match(migration,/num_nonnulls\(profile_id, space_id, organization_id\) = 1/);assert.doesNotMatch(migration,/alter table public\.entitlements/); });
test("provisioning fails early when the historical audit foundation is absent or incompatible", () => {
  assert.match(auditMigration, /create table if not exists public\.audit_logs/);
  assert.match(migration, /pg_catalog\.to_regclass\('public\.audit_logs'\) is null/);
  assert.match(migration, /missing prerequisite migration: 20260703_security_policies_and_entitlements\.sql/);
  for (const [column, type] of [
    ["actor_user_id", "uuid"],
    ["actor_role", "text"],
    ["action", "text"],
    ["resource_type", "text"],
    ["resource_id", "text"],
    ["metadata", "jsonb"],
  ]) {
    assert.match(migration, new RegExp(`\\('${column}', '${type}'\\)`));
  }
  assert.ok(migration.indexOf("pg_catalog.to_regclass('public.audit_logs')") < migration.indexOf("create table public.zero_limit_entitlements"));
});
test("database enforces Personal, Creator and Team uniqueness", () => { assert.match(migration,/spaces_one_personal_profession_per_profile/);assert.match(migration,/spaces_one_creator_per_profile/);assert.match(migration,/spaces_one_team_per_organization/); });
test("provisioning is backend-only and derives a profile from the server-authenticated Auth user", () => { assert.match(migration,/auth\.role\(\) <> 'service_role'.*backend_only/);assert.match(migration,/where auth_user_id=actor_auth_user_id/);assert.match(migration,/grant execute on function public\.provision_personal_space\(uuid,text,text\)[^;]*to service_role/);assert.doesNotMatch(migration,/grant execute on function public\.provision_personal_space[^;]*to authenticated/); });
test("Preview provisioning follows the session-checked backend-only service path", () => {
  assert.match(provisioningRoute, /requireInteractiveProvisioningEnabled\(\)/);
  assert.match(provisioningService, /await context\(\)/);
  assert.match(provisioningService, /useServiceRole: backendOnly/);
  assert.match(provisioningService, /actor_auth_user_id: session\.user\.id/);
  assert.doesNotMatch(provisioningService, /SUPABASE_SERVICE_ROLE_KEY/);
});
test("backend provisioning sends the exact post-migration RPC arguments", () => {
  assert.match(provisioningService, /actor_auth_user_id: session\.user\.id/);
  assert.match(provisioningService, /provision_personal_space", \{ profession_value: profession, entitlement_source: "system" \}/);
  assert.match(provisioningService, /provision_creator_space", \{ entitlement_source: "system" \}/);
  assert.match(provisioningService, /provision_team", \{ organization_name: String\(name \|\| ""\)\.trim\(\), organization_slug: cleanSlug, entitlement_source: "system" \}/);
  assert.match(migration, /provision_personal_space\(actor_auth_user_id uuid, profession_value text, entitlement_source text/);
  assert.match(migration, /provision_creator_space\(actor_auth_user_id uuid, entitlement_source text/);
  assert.match(migration, /provision_team\(actor_auth_user_id uuid, organization_name text, organization_slug text, entitlement_source text/);
});
test("missing service-role and PostgREST failures produce safe correlated diagnostics", () => {
  assert.match(provisioningService, /requireSupabaseServiceRoleConfig\(\)/);
  assert.match(provisioningService, /service_role_configuration/);
  assert.match(provisioningService, /PGRST202.*rpc_schema_cache/);
  assert.match(provisioningService, /42501.*rpc_permission/);
  assert.match(provisioningRoute, /correlationId, category: error\.category/);
  assert.doesNotMatch(provisioningRoute, /upstreamMessage.*NextResponse\.json/);
});
test("team transaction includes organization, space and entitlement", () => { const body=migration.match(/create function public\.provision_team[\s\S]*?end \$\$;/)?.[0]||"";assert.match(body,/insert into public\.organizations/);assert.match(body,/insert into public\.spaces/);assert.match(body,/insert into public\.zero_limit_entitlements/); });
test("invitation acceptance is locked, email-bound and idempotent", () => { assert.match(migration,/token_hash text not null unique/);assert.match(migration,/for update/);assert.match(migration,/invitation_row\.email <> auth_email/);assert.match(migration,/on conflict \(organization_id,profile_id\) do nothing/); });
test("entitlement status and time are constrained", () => { assert.match(migration,/status in \('active', 'suspended', 'revoked'\)/);assert.match(migration,/expires_at is null or expires_at > starts_at/); });
test("entitlement resolution rejects expired, suspended, revoked and cross-scope values", () => {
  const now = new Date("2026-09-20T12:00:00Z");
  assert.equal(isEntitlementActive({ status:"active", starts_at:"2026-09-19T00:00:00Z", expires_at:null }, now), true);
  assert.equal(isEntitlementActive({ status:"active", starts_at:"2026-09-19T00:00:00Z", expires_at:"2026-09-20T11:00:00Z" }, now), false);
  assert.equal(isEntitlementActive({ status:"suspended", starts_at:"2026-09-19T00:00:00Z" }, now), false);
  assert.equal(isEntitlementActive({ status:"revoked", starts_at:"2026-09-19T00:00:00Z" }, now), false);
  assert.equal(hasExactlyOneEntitlementScope({ profileId:"p", spaceId:"s" }), false);
  assert.equal(hasExactlyOneEntitlementScope({ organizationId:"o" }), true);
});
test("authenticated callers can only select visible entitlements and cannot self-grant", () => {
  assert.match(migration, /revoke all on public\.zero_limit_entitlements, public\.organization_invitations from anon, authenticated/);
  assert.match(migration, /create policy zero_limit_entitlements_access_select/);
  assert.match(migration, /grant select \(id, key, profile_id, space_id, organization_id, source, status, starts_at, expires_at, created_at, updated_at\)[\s\S]*?on public\.zero_limit_entitlements to authenticated/);
  assert.doesNotMatch(migration, /grant select \([^)]*metadata[^)]*\)[^;]*zero_limit_entitlements/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]*zero_limit_entitlements/i);
});
test("organization invitation hashes are not directly readable", () => {
  assert.doesNotMatch(migration, /create policy[^;]*organization_invitations[^;]*select/i);
  assert.doesNotMatch(migration, /grant select[^;]*organization_invitations/i);
});
test("invitation acceptance requires a confirmed Supabase Auth email", () => {
  assert.match(migration, /from auth\.users where id=auth\.uid\(\)/);
  assert.match(migration, /email_verified_at is null.*invitation_email_unverified/);
});
test("invitation return URL only permits expected internal token paths", () => {
  const valid = "/invitation/team/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN123456";
  assert.equal(teamInvitationReturnPath(valid), valid);
  assert.equal(teamInvitationReturnPath("https://evil.example"), "/identite");
  assert.equal(teamInvitationReturnPath("//evil.example"), "/identite");
  assert.equal(teamInvitationReturnPath("/admin"), "/identite");
});
test("raw token is returned in Vercel Preview/local dev but never Vercel Production", () => {
  assert.equal(canReturnPreviewInvitationToken({ VERCEL_ENV:"preview", NODE_ENV:"production" }), true);
  assert.equal(canReturnPreviewInvitationToken({ VERCEL_ENV:"production", NODE_ENV:"production" }), false);
  assert.equal(canReturnPreviewInvitationToken({ NODE_ENV:"development" }), true);
});
test("interactive provisioning requires explicit opt-in in production only", () => {
  assert.equal(isInteractiveProvisioningEnabled({ VERCEL_ENV:"production", NODE_ENV:"production" }), false);
  assert.equal(isInteractiveProvisioningEnabled({ VERCEL_ENV:"production", NODE_ENV:"production", ZERO_LIMIT_INTERACTIVE_PROVISIONING:"enabled" }), true);
  assert.equal(isInteractiveProvisioningEnabled({ VERCEL_ENV:"preview", NODE_ENV:"production" }), true);
});
test("Team slug conflicts never return a foreign organization", () => {
  assert.match(migration, /where slug=organization_slug and owner_profile_id=profile_value and name=btrim\(organization_name\)/);
  assert.match(migration, /message='slug_taken'/);
});
test("provisioning retries only audit rows actually inserted", () => {
  assert.match(migration, /on conflict \(owner_profile_id, personal_profession\)[\s\S]*?do nothing returning id into space_value/);
  assert.match(migration, /if space_created then perform public\.record_provisioning_audit/);
  assert.match(migration, /on conflict do nothing returning id into entitlement_value/);
  assert.match(migration, /if entitlement_value is not null then perform public\.record_provisioning_audit/g);
  assert.match(migration, /if organization_created then perform public\.record_provisioning_audit/);
});
test("SECURITY DEFINER functions use a hardened path and public schema creation is revoked", () => {
  assert.match(migration, /revoke create on schema public from public/);
  const definitions = migration.match(/returns [\s\S]*?security definer set search_path = pg_catalog, public/g) || [];
  assert.equal(definitions.length, 6);
});
