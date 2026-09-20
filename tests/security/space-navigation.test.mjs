import test from "node:test";
import assert from "node:assert/strict";
import { findAccessibleSpace, normalizeAccessibleSpaces, resolveLastActiveSpace } from "../../lib/zero-limit-id/space-model.js";

const profile = { id: "profile-a", display_name: "Ada" };
const personal = (id, profession) => ({ id, kind: "personal", name: `Personal ${profession}`, owner_profile_id: "profile-a", organization_id: null, personal_profession: profession });
const creator = { id: "creator-a", kind: "creator", name: "Creator Ada", owner_profile_id: "profile-a", organization_id: null, personal_profession: null };
const membership = (organization_id, role = "member") => ({ organization_id, profile_id: "profile-a", role });
const organization = (id, owner_profile_id = "someone-else") => ({ id, name: `Team ${id}`, owner_profile_id });
const team = (id, organization_id) => ({ id, kind: "team", name: `Space ${id}`, owner_profile_id: null, organization_id, personal_profession: null });
const normalize = (values = {}) => normalizeAccessibleSpaces({ profile, ownedSpaces: [], memberships: [], teamSpaces: [], organizations: [], ...values });

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
test("platform roles cannot enter normalized switcher data", () => {
  const spaces = normalize({ ownedSpaces: [personal("p1", "coach")], platform_roles: [{ role: "platform_owner" }] });
  assert.equal(spaces.length, 1);
  assert.equal("platformRole" in spaces[0], false);
});
