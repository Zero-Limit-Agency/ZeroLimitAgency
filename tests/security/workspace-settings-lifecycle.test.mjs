import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isModuleAvailableForSpace } from "../../lib/workspace/module-resolution.js";

const migration = await readFile(new URL("../../supabase/migrations/20260922_workspace_settings_lifecycle.sql", import.meta.url), "utf8");
const service = await readFile(new URL("../../lib/zero-limit-id/workspace-settings.js", import.meta.url), "utf8");

test("lifecycle migration is additive with three states and active backfill", () => {
  assert.match(migration, /add column if not exists status text/);
  assert.match(migration, /alter column status set default 'active'/);
  assert.match(migration, /update public\.spaces set status='active' where status is null/);
  assert.match(migration, /alter column status set not null/);
  assert.match(migration, /status in \('active', 'suspended', 'archived'\)/);
  assert.doesNotMatch(migration, /delete from public\./i);
});

test("migration is replay-safe and repairs partially applied objects", () => {
  assert.match(migration, /spaces_status_check has incompatible definition/);
  assert.match(migration, /create index if not exists spaces_active_owner_idx/);
  assert.match(migration, /create index if not exists spaces_active_organization_idx/);
  assert.match(migration, /spaces_active_owner_idx has incompatible definition/);
  assert.match(migration, /spaces_active_organization_idx has incompatible definition/);
  for (const name of ["get_workspace_settings", "update_workspace_settings", "guard_invitations_for_inactive_team"]) {
    assert.match(migration, new RegExp(`create or replace function public\\.${name}`));
  }
  assert.match(migration, /drop trigger if exists guard_invitations_for_inactive_team on public\.organization_invitations/);
  assert.match(migration, /create trigger guard_invitations_for_inactive_team/);
});

test("owner-only RPC centralizes settings, lifecycle validation and audit", () => {
  assert.match(migration, /o\.owner_profile_id<>profile_value/);
  assert.match(migration, /s\.owner_profile_id<>profile_value/);
  for (const action of ["space_renamed", "organization_renamed", "organization_slug_changed", "space_archived", "space_restored"]) assert.match(migration, new RegExp(`'${action}'`));
  assert.match(migration, /status='active'/);
  assert.match(migration, /message='entitlement_required'/);
  assert.match(migration, /s\.status='suspended'[\s\S]*message='space_suspended'/);
  assert.match(migration, /s\.status='archived' and operation_value<>'restore'/);
});

test("authenticated has no direct Core column update privileges", () => {
  assert.doesNotMatch(service, /personal_profession.*mutate|owner_profile_id.*mutate/);
  assert.match(migration, /revoke update on public\.spaces from authenticated/);
  assert.match(migration, /revoke update \(id, kind, name, owner_profile_id, organization_id, personal_profession, created_at, updated_at, status\)/);
  assert.match(migration, /revoke update on public\.organizations from authenticated/);
  assert.match(migration, /revoke update \(id, name, slug, owner_profile_id, created_at, updated_at\)/);
  assert.doesNotMatch(migration, /grant update/);
});

test("modules reject archived and suspended spaces", () => {
  const manifest = { supportedSpaceKinds: ["creator"] };
  assert.equal(isModuleAvailableForSpace(manifest, { kind: "creator", status: "archived" }), false);
  assert.equal(isModuleAvailableForSpace(manifest, { kind: "creator", status: "suspended" }), false);
  assert.equal(isModuleAvailableForSpace(manifest, { kind: "creator", status: "active" }), true);
});

test("Team invitation creation, resend and acceptance are guarded when inactive", () => {
  assert.match(migration, /guard_invitations_for_inactive_team/);
  assert.match(migration, /new\.token_hash is distinct from old\.token_hash/);
  assert.match(migration, /new\.accepted_at is distinct from old\.accepted_at/);
  assert.match(migration, /message='team_space_inactive'/);
  assert.match(migration, /where organization_id=new\.organization_id and kind='team' and status='active'[\s\S]*for update/);
  assert.match(migration, /invitation mutations lock their invitation row[\s\S]*then this trigger locks the Team Space/);
});
