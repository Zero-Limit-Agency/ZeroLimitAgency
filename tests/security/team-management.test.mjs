import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260920_team_management_foundation.sql", "utf8");
const manager = readFileSync("components/workspace/team-members-manager.jsx", "utf8");
const server = readFileSync("lib/zero-limit-id/team-management.js", "utf8");

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
