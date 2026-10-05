import test from "node:test";
import assert from "node:assert/strict";
import { privateDestination, workspaceEntryDestination } from "../../lib/zero-limit-id/redirects.js";
import { normalizeAccessibleSpaces } from "../../lib/zero-limit-id/space-model.js";

const invitation = `/invitation/team/${"a".repeat(43)}`;
const completed = { onboarding_completed_at: "2026-10-05T00:00:00Z" };
test("incomplete onboarding retains only an allowlisted invitation", () => {
  assert.equal(privateDestination({}, invitation), `/identite/onboarding?next=${encodeURIComponent(invitation)}`);
  for (const next of ["https://evil.example", "//evil.example", "/espace/foreign/activer", `${invitation}?next=evil`]) {
    assert.equal(privateDestination({}, next), "/identite/onboarding");
    assert.equal(privateDestination(completed, next), "/espace?entree=1");
  }
  assert.equal(privateDestination(completed, invitation), invitation);
});
test("entry resumes a validated last Space, otherwise selects a sole Space or keeps the hub", () => {
  const spaces = [{ id: "a" }, { id: "b" }];
  assert.equal(workspaceEntryDestination(spaces, "b"), "/espace/b/activer");
  assert.equal(workspaceEntryDestination(spaces, "foreign"), null);
  assert.equal(workspaceEntryDestination([spaces[0]], "foreign"), "/espace/a/activer");
  assert.equal(workspaceEntryDestination([], "a"), null);
});
test("remembering a suspended Space or revoked entitlement never restores access", () => {
  const profile = { id: "owner" };
  const owned = { id: "a", kind: "creator", name: "Creator", owner_profile_id: "owner", status: "active" };
  const entitlement = { key: "creator_access", space_id: "a", status: "active", starts_at: "2020-01-01", expires_at: null };
  for (const [space, grant] of [[{ ...owned, status: "suspended" }, entitlement], [owned, { ...entitlement, status: "revoked" }]]) {
    const spaces = normalizeAccessibleSpaces({ profile, ownedSpaces: [space], entitlements: [grant] });
    assert.equal(workspaceEntryDestination(spaces, "a"), null);
  }
});
