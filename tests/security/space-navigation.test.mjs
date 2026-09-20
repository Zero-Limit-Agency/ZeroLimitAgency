import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { findAccessibleSpace, normalizeAccessibleSpaces, resolveLastActiveSpace } from "../../lib/zero-limit-id/space-model.js";

const profile = { id: "profile-a", display_name: "Ada" };
const personal = (id, profession) => ({ id, kind: "personal", name: `Personal ${profession}`, owner_profile_id: "profile-a", organization_id: null, personal_profession: profession });
const creator = { id: "creator-a", kind: "creator", name: "Creator Ada", owner_profile_id: "profile-a", organization_id: null, personal_profession: null };
const membership = (organization_id, role = "member") => ({ organization_id, profile_id: "profile-a", role });
const organization = (id, owner_profile_id = "someone-else") => ({ id, name: `Team ${id}`, owner_profile_id });
const team = (id, organization_id) => ({ id, kind: "team", name: `Space ${id}`, owner_profile_id: null, organization_id, personal_profession: null });
const active = (values) => ({ status: "active", starts_at: "2020-01-01T00:00:00Z", expires_at: null, profile_id: null, space_id: null, organization_id: null, ...values });
const normalize = (values = {}) => {
  const ownedSpaces = values.ownedSpaces || [];
  const teamSpaces = values.teamSpaces || [];
  const entitlements = values.entitlements || [
    ...ownedSpaces.map((space) => active({ key: space.kind === "personal" ? "personal_access" : "creator_access", space_id: space.id })),
    ...teamSpaces.map((space) => active({ key: "team_access", organization_id: space.organization_id }))
  ];
  return normalizeAccessibleSpaces({ profile, ownedSpaces, memberships: [], teamSpaces, organizations: [], ...values, entitlements });
};

test("profile with no spaces gets an empty list", () => assert.deepEqual(normalize(), []));
test("one Personal space keeps its profession", () => assert.equal(normalize({ ownedSpaces: [personal("p1", "coach")] })[0].profession, "coach"));
test("multiple Personal professions remain distinct", () => assert.deepEqual(normalize({ ownedSpaces: [personal("p1", "coach"), personal("p2", "manager_agent")] }).map((space) => space.id).sort(), ["p1", "p2"]));
test("Creator is a distinct space", () => assert.equal(normalize({ ownedSpaces: [creator] })[0].kind, "creator"));
test("two memberships expose two Teams", () => assert.equal(normalize({ memberships: [membership("a"), membership("b")], organizations: [organization("a"), organization("b")], teamSpaces: [team("ta", "a"), team("tb", "b")] }).length, 2));
test("removing a membership immediately removes its Team", () => assert.deepEqual(normalize({ memberships: [], organizations: [organization("a")], teamSpaces: [team("ta", "a")] }), []));
test("invalid last-active space falls back to null", () => assert.equal(resolveLastActiveSpace(normalize(), "deleted"), null));
test("a space owned by another profile is rejected", () => assert.equal(findAccessibleSpace(normalize({ ownedSpaces: [{ ...personal("foreign", "coach"), owner_profile_id: "profile-b" }] }), "foreign"), null));
test("a Team in another organization is rejected", () => assert.equal(findAccessibleSpace(normalize({ memberships: [membership("a")], organizations: [organization("a"), organization("b")], teamSpaces: [team("tb", "b")] }), "tb"), null));
test("organization owner flag comes only from owner_profile_id", () => assert.equal(normalize({ memberships: [membership("a", "admin")], organizations: [organization("a", "profile-a")], teamSpaces: [team("ta", "a")] })[0].isOwner, true));
test("revoked personal entitlement hides an owned Personal space", () => assert.deepEqual(normalize({ ownedSpaces: [personal("p1", "coach")], entitlements: [active({ key: "personal_access", space_id: "p1", status: "revoked" })] }), []));
test("suspended creator entitlement hides an owned Creator space", () => assert.deepEqual(normalize({ ownedSpaces: [creator], entitlements: [active({ key: "creator_access", space_id: creator.id, status: "suspended" })] }), []));
test("expired Team entitlement hides a Team despite membership", () => assert.deepEqual(normalize({ memberships: [membership("a")], organizations: [organization("a")], teamSpaces: [team("ta", "a")], entitlements: [active({ key: "team_access", organization_id: "a", expires_at: "2020-01-02T00:00:00Z" })] }), []));
test("platform roles cannot enter normalized switcher data", () => {
  const spaces = normalize({ ownedSpaces: [personal("p1", "coach")], platform_roles: [{ role: "platform_owner" }] });
  assert.equal(spaces.length, 1);
  assert.equal("platformRole" in spaces[0], false);
});

test("the private shell replaces the switcher with a non-interactive zero-space status", async () => {
  const shell = await readFile(new URL("../../components/workspace/private-shell.jsx", import.meta.url), "utf8");
  assert.match(shell, /spaces\.length > 0\s*\? <SpaceSwitcher/);
  assert.match(shell, /className="space-switcher-empty" role="status"/);
});

test("a populated space switcher keeps a distinct keyboard-accessible link to the creation hub", async () => {
  const switcher = await readFile(new URL("../../components/workspace/space-switcher.jsx", import.meta.url), "utf8");
  const dictionaries = await readFile(new URL("../../lib/i18n/spaces.js", import.meta.url), "utf8");
  assert.match(switcher, /KINDS\.map[\s\S]*className="space-switcher-create"/);
  assert.match(switcher, /<div role="separator" \/>/);
  assert.match(switcher, /<Link role="menuitem" href="\/espace"/);
  assert.match(switcher, /labels\.createOrJoinSpace/);
  assert.match(dictionaries, /createOrJoinSpace: "Créer ou rejoindre un espace"/);
  assert.match(dictionaries, /createOrJoinSpace: "Create or join a space"/);
});

test("the space hub remains available with active spaces and keeps creation choices", async () => {
  const hub = await readFile(new URL("../../app/espace/page.js", import.meta.url), "utf8");
  assert.doesNotMatch(hub, /lastActive.*redirect/s);
  assert.match(hub, /context\.spaces\.length > 0[\s\S]*className="space-grid"/);
  assert.match(hub, /className="space-add-section"/);
  assert.match(hub, /href="\/espace\/preparation\/personal"/);
  assert.match(hub, /creatorExists[\s\S]*labels\.alreadyActive[\s\S]*href="\/espace\/preparation\/creator"/);
  assert.match(hub, /href="\/espace\/preparation\/team"/);
});
