import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260920_team_management_foundation.sql", "utf8");
const manager = readFileSync("components/workspace/team-members-manager.jsx", "utf8");
const server = readFileSync("lib/zero-limit-id/team-management.js", "utf8");
const repair = readFileSync("supabase/migrations/20260923_repair_team_management_rpcs.sql", "utf8");
const lifecycle = readFileSync("supabase/migrations/20260922_workspace_settings_lifecycle.sql", "utf8");

test("owner remains canonical and Team roles never introduce owner", () => {
  assert.match(migration, /organizations\.owner_profile_id/);
  assert.doesNotMatch(migration, /role_value[^\n]+owner|role\s*=\s*'owner'/);
  assert.match(migration, /owner_protected/);
  assert.match(migration, /cannot_leave_as_owner/);
});

test("member and invitation projections expose only deliberate fields", () => {
  const members = migration.match(/create function public\.get_team_members[\s\S]*?end \$\$;/)?.[0] || "";
  const invitations = migration.match(/create function public\.get_pending_team_invitations[\s\S]*?end \$\$;/)?.[0] || "";
  assert.match(members, /public\.is_organization_member/);
  assert.doesNotMatch(members, /auth_user_id|email/);
  assert.match(invitations, /owner_profile_id[\s\S]*m\.role = 'admin'/);
  assert.doesNotMatch(invitations, /token_hash|accepted_by_profile_id/);
  assert.doesNotMatch(manager, /auth_user_id|token_hash|tokenHash/);
  assert.doesNotMatch(server.match(/return \{\s*members:[\s\S]*?\n  \};/)?.[0] || "", /auth_user_id|token_hash|tokenHash/);
});

test("sensitive mutations derive actor, scope targets and harden grants", () => {
  for (const name of ["update_team_member_role", "remove_team_member", "leave_team", "revoke_team_invitation", "resend_team_invitation"]) {
    const definition = migration.match(new RegExp(`create function public\\.${name}[\\s\\S]*?end \\$\\$;`))?.[0] || "";
    assert.match(definition, /public\.current_profile_id\(\)/);
    assert.match(definition, /security definer set search_path = pg_catalog, public/);
    assert.match(definition, /organization_value/);
  }
  assert.match(migration, /revoke all on function[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function[\s\S]*to authenticated/);
});

test("permission policy is owner-all and admin invitations plus simple members", () => {
  const roleChange = migration.match(/create function public\.update_team_member_role[\s\S]*?end \$\$;/)?.[0] || "";
  const remove = migration.match(/create function public\.remove_team_member[\s\S]*?end \$\$;/)?.[0] || "";
  assert.match(roleChange, /public\.is_organization_owner/);
  assert.match(remove, /target\.role <> 'member'/);
  assert.match(remove, /actor_is_owner/);
  assert.match(migration, /o\.owner_profile_id=actor_profile_id or m\.role='admin'/);
});

test("row locks and replacement token semantics protect concurrent mutations", () => {
  assert.match(migration, /organization_invitations where id=invitation_value[\s\S]*for update/g);
  assert.match(migration, /organization_memberships where id=membership_value[\s\S]*for update/g);
  assert.match(migration, /set token_hash=token_hash_value, expires_at=expires_at_value/);
  assert.match(migration, /accepted_at is not null[\s\S]*invitation_already_used/g);
});

test("all required domain audits are emitted without secret metadata", () => {
  for (const action of ["team_member_role_changed", "team_member_removed", "team_member_left", "team_invitation_revoked", "team_invitation_resent"]) assert.match(migration, new RegExp(`'${action}'`));
  const auditCalls = [...migration.matchAll(/record_provisioning_audit\([\s\S]*?\);/g)].map((match) => match[0]).join("\n");
  assert.doesNotMatch(auditCalls, /token_hash_value|JWT|auth payload/i);
});

test("UI applies role visibility, confirmations, status and responsive hooks", () => {
  assert.match(manager, /actor\.isOwner && !member\.isOwner/);
  assert.match(manager, /actor\.role === "admin" && member\.role === "member"/);
  assert.match(manager, /window\.confirm/);
  assert.match(manager, /role=.*alert.*status/);
  assert.match(manager, /TeamInvitationForm/);
  assert.match(manager, /ownerCannotLeave/);
});

test("additive repair recreates every Team RPC and restores authenticated grants", () => {
  for (const name of ["get_team_members", "get_pending_team_invitations", "update_team_member_role", "remove_team_member", "leave_team", "revoke_team_invitation", "create_team_invitation", "accept_team_invitation", "resend_team_invitation"]) {
    assert.match(repair, new RegExp(`create or replace function public\\.${name}\\b`));
  }
  assert.match(repair, /revoke all on function[\s\S]*from public, anon, authenticated/);
  assert.match(repair, /grant execute on function[\s\S]*to authenticated/);
  assert.doesNotMatch(repair, /drop\s+(table|schema)|truncate/i);
});

test("direct operational RPCs require one active Team space and a current Team entitlement", () => {
  const helper = repair.match(/create or replace function public\.assert_team_operational[\s\S]*?end \$\$;/)?.[0] || "";
  assert.match(helper, /team_space_count<>1 or active_team_space_count<>1[\s\S]*team_space_inactive/);
  assert.match(helper, /organization_id=organization_value and key='team_access' and status='active'/);
  assert.match(helper, /starts_at<=timezone\('utc',now\(\)\)/);
  assert.match(helper, /expires_at is null or expires_at>timezone\('utc',now\(\)\)/);
  assert.match(repair, /revoke all on function public\.assert_team_operational\(uuid\)[\s\S]*from public, anon, authenticated/);
  for (const name of ["get_team_members", "get_pending_team_invitations", "update_team_member_role", "remove_team_member", "create_team_invitation", "resend_team_invitation"]) {
    const definition = repair.match(new RegExp(`create or replace function public\\.${name}[\\s\\S]*?end \\$\\$;`))?.[0] || "";
    assert.match(definition, /perform public\.assert_team_operational\(organization_value\)/, `${name} must enforce operational access`);
  }
  const accept = repair.match(/create or replace function public\.accept_team_invitation[\s\S]*?end \$\$;/)?.[0] || "";
  assert.match(accept, /perform public\.assert_team_operational\(invitation_row\.organization_id\)/);
  assert.doesNotMatch(accept, /is_organization_member|is_organization_owner/);
});

test("leave and revoke remain available without operational Team access", () => {
  for (const name of ["leave_team", "revoke_team_invitation"]) {
    const definition = repair.match(new RegExp(`create or replace function public\\.${name}[\\s\\S]*?end \\$\\$;`))?.[0] || "";
    assert.doesNotMatch(definition, /assert_team_operational/);
  }
});

test("all operational mutations follow lifecycle's space then organization lock order", () => {
  const settings = lifecycle.match(/create or replace function public\.update_workspace_settings[\s\S]*?end \$\$;/)?.[0] || "";
  assert.ok(settings.indexOf("from public.spaces") < settings.indexOf("from public.organizations"));
  for (const name of ["update_team_member_role", "remove_team_member", "create_team_invitation", "resend_team_invitation"]) {
    const definition = repair.match(new RegExp(`create or replace function public\\.${name}[\\s\\S]*?end \\$\\$;`))?.[0] || "";
    const spaceLock = definition.indexOf("from public.spaces where organization_id=organization_value and kind='team' for update");
    const organizationLock = definition.indexOf("from public.organizations where id=organization_value for update");
    const entitlementLock = definition.indexOf("from public.zero_limit_entitlements where organization_id=organization_value and key='team_access' for share");
    assert.ok(spaceLock >= 0 && spaceLock < organizationLock && organizationLock < entitlementLock, `${name} lock order must be space -> organization -> entitlement`);
  }
  const accept = repair.match(/create or replace function public\.accept_team_invitation[\s\S]*?end \$\$;/)?.[0] || "";
  const firstLookup = accept.indexOf("from public.organization_invitations where token_hash=token_hash_value;");
  const spaceLock = accept.indexOf("from public.spaces where organization_id=invitation_row.organization_id and kind='team' for update");
  const organizationLock = accept.indexOf("from public.organizations where id=invitation_row.organization_id for update");
  const entitlementLock = accept.indexOf("from public.zero_limit_entitlements where organization_id=invitation_row.organization_id and key='team_access' for share");
  const invitationLock = accept.indexOf("from public.organization_invitations where token_hash=token_hash_value for update");
  assert.ok(firstLookup >= 0 && firstLookup < spaceLock && spaceLock < organizationLock && organizationLock < entitlementLock && entitlementLock < invitationLock);
});

test("repaired invitation create and accept preserve authorization and token safety", () => {
  const create = repair.match(/create or replace function public\.create_team_invitation[\s\S]*?end \$\$;/)?.[0] || "";
  assert.match(create, /owner_profile_id=profile_value or m\.role='admin'/);
  assert.match(create, /role_value not in \('admin','member'\)/);
  assert.match(create, /lower\(btrim\(email_value\)\)/);
  assert.match(create, /token_hash_value/);
  assert.match(create, /team_invitation_created/);
  const accept = repair.match(/create or replace function public\.accept_team_invitation[\s\S]*?end \$\$;/)?.[0] || "";
  assert.match(accept, /email_confirmed_at[\s\S]*invitation_email_unverified/);
  assert.match(accept, /invitation_row\.email<>auth_email/);
  assert.match(accept, /token_hash=token_hash_value for update/);
  assert.match(accept, /accepted_at is not null[\s\S]*invitation_used/);
  assert.match(accept, /revoked_at is not null[\s\S]*invitation_revoked/);
  assert.match(accept, /expires_at<=timezone\('utc',now\(\)\)[\s\S]*invitation_expired/);
  assert.match(accept, /organization_memberships[\s\S]*team_invitation_accepted/);
  assert.doesNotMatch(accept, /is_organization_member|is_organization_owner/);
});

test("repair preserves canonical ownership, scoped targets, and safe projections", () => {
  const members = repair.match(/create or replace function public\.get_team_members[\s\S]*?end \$\$;/)?.[0] || "";
  const invitations = repair.match(/create or replace function public\.get_pending_team_invitations[\s\S]*?end \$\$;/)?.[0] || "";
  assert.match(members, /public\.is_organization_member/);
  assert.doesNotMatch(members, /auth_user_id|email/);
  assert.doesNotMatch(invitations, /token_hash|accepted_by_profile_id/);
  assert.match(repair, /owner_profile_id=target\.profile_id[\s\S]*owner_protected/);
  assert.match(repair, /id=membership_value and organization_id=organization_value/g);
  assert.match(repair, /id=invitation_value and organization_id=organization_value/g);
  assert.doesNotMatch(repair, /role_value[^\n]+owner|role\s*=\s*'owner'/);
});

test("runtime diagnostics distinguish missing RPC, grants, RLS, transport, and lifecycle", () => {
  assert.match(server, /PGRST202[\s\S]*rpc_unavailable[\s\S]*rpc_absent/);
  assert.match(server, /row-level security[\s\S]*row_level_security[\s\S]*category: "rls"/);
  assert.match(server, /permission_denied/);
  assert.match(server, /RPC transport failure[\s\S]*transport_error/);
  assert.match(server, /team_space_inactive[\s\S]*access_issue/);
  assert.doesNotMatch(server, /result\.data\s*[,}]/);
});
