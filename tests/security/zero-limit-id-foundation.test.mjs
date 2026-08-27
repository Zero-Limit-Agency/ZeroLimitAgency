import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/20260825_zero_limit_id_foundation.sql";
const sql = readFileSync(migrationPath, "utf8");

test("Zero Limit ID is rooted in Auth, never applications", () => {
  const profileDefinition = sql.match(/create table public\.profiles \(([\s\S]*?)\n\);/)?.[1] ?? "";
  assert.match(profileDefinition, /auth_user_id uuid not null unique references auth\.users\(id\)/);
  assert.doesNotMatch(profileDefinition, /applications|email/i);
  assert.doesNotMatch(sql, /alter table public\.applications/i);
});

test("one profile can own multiple independently typed spaces", () => {
  assert.match(sql, /create table public\.spaces/);
  assert.match(sql, /kind in \('personal', 'creator', 'team'\)/);
  assert.match(sql, /personal_profession in \('coach', 'manager_agent', 'ceo', 'community_manager'\)/);
  assert.doesNotMatch(sql, /unique \(owner_profile_id\)/);
  assert.match(sql, /kind = 'team' and owner_profile_id is null and organization_id is not null/);
});

test("RLS scopes private and organization data without blanket authenticated access", () => {
  for (const table of ["profiles", "linked_accounts", "organizations", "organization_memberships", "spaces", "platform_roles"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(sql, /profiles_self_select[\s\S]*auth_user_id = auth\.uid\(\)/);
  assert.match(sql, /revoke update on public\.profiles from authenticated/);
  assert.match(sql, /grant update \(username, display_name, preferred_locale, avatar_url\) on public\.profiles to authenticated/);
  assert.match(sql, /organization_memberships_org_select[\s\S]*public\.is_organization_member\(organization_id\)/);
  assert.match(sql, /spaces_access_select[\s\S]*public\.is_organization_member\(organization_id\)/);
  assert.doesNotMatch(sql, /to authenticated\s+using \(true\)/);
  assert.match(sql, /linked_accounts_self_select[\s\S]*for select to authenticated/);
  assert.doesNotMatch(sql, /linked_accounts[^\n]*for (insert|update|delete|all) to authenticated/);
});

test("organization owner and platform owner are separate authorities", () => {
  assert.match(sql, /owner_profile_id uuid not null references public\.profiles/);
  assert.match(sql, /create table public\.platform_roles/);
  assert.match(sql, /role = 'platform_owner'/);
  assert.doesNotMatch(sql, /create policy [^\n]+ on public\.platform_roles/);
});

test("organization ownership has one canonical source and protected membership", () => {
  assert.match(sql, /organization_memberships_role_check check \(role in \('admin', 'member'\)\)/);
  assert.match(sql, /create trigger protect_organization_owner_membership/);
  assert.match(sql, /create trigger require_new_organization_owner_membership/);
  assert.doesNotMatch(sql, /organization_memberships[\s\S]{0,240}role in \([^)]*'owner'/);
});

test("SECURITY DEFINER trigger functions are fixed-path and not publicly executable", () => {
  for (const name of [
    "add_organization_owner_membership",
    "protect_organization_owner_membership",
    "require_new_organization_owner_membership",
    "audit_identity_foundation_change",
    "audit_organization_change",
  ]) {
    assert.match(sql, new RegExp(`create function public\\.${name}\\(\\)[\\s\\S]*?security definer set search_path = public`));
    assert.match(sql, new RegExp(`revoke all on function public\\.${name}\\(\\) from public`));
  }
});

test("Node checks are static assertions and the real RLS scenario covers denied mutations", () => {
  const rlsScenario = readFileSync("supabase/tests/zero_limit_id_rls.sql", "utf8");
  assert.match(rlsScenario, /Actual PostgreSQL\/RLS regression scenario/);
  assert.match(rlsScenario, /cross-user profile update succeeded/);
  assert.match(rlsScenario, /unverified linked account insert unexpectedly succeeded/);
  assert.match(rlsScenario, /platform owner escalation unexpectedly succeeded/);
  assert.match(rlsScenario, /member self-promotion succeeded/);
});
