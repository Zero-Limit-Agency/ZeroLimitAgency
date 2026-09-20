import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createModuleRegistry } from "../../lib/workspace/module-registry.js";
import { getTeamCapabilities } from "../../lib/workspace/module-permissions.js";
import { ModuleAccessDeniedError, getAvailableModulesForSpace, requireResolvedModule, resolveModulesForSpace } from "../../lib/workspace/module-resolution.js";

const fixture = (key, overrides = {}) => ({
  key, version: "1.0.0", supportedSpaceKinds: ["personal"], supportedProfessions: null,
  requiredEntitlements: [], requiredCapabilities: ["consume_modules"],
  route: `/espace/[spaceId]/modules/${key}`, status: "active", order: 10,
  visibility: "navigation", navigation: { labelKey: `modules.${key}` }, defaultEnabled: true, ...overrides
});
const registry = createModuleRegistry([
  fixture("fixture_coach", { supportedProfessions: ["coach"] }),
  fixture("fixture_manager", { supportedProfessions: ["manager_agent"], order: 20 }),
  fixture("fixture_creator", { supportedSpaceKinds: ["creator"], order: 30 }),
  fixture("fixture_team", { supportedSpaceKinds: ["team"], order: 40 })
]);
const personal = (profession) => ({ id: `personal-${profession}`, kind: "personal", profession });
const creator = { id: "creator", kind: "creator" };
const team = (role = "member", isOwner = false) => ({ id: "team", kind: "team", role, isOwner, organization: { id: "org" } });
const yes = () => true;

// Fixtures remain test-only; the production registry is deliberately empty.
test("Personal Coach only receives compatible fixtures", () => assert.deepEqual(getAvailableModulesForSpace(personal("coach"), registry).map((m) => m.key), ["fixture_coach"]));
test("Personal Manager receives its distinct compatibility", () => assert.deepEqual(getAvailableModulesForSpace(personal("manager_agent"), registry).map((m) => m.key), ["fixture_manager"]));
test("Creator never receives a Personal-only module", () => assert.throws(() => requireResolvedModule({ space: creator, moduleKey: "fixture_coach", registry, isEnabled: yes, hasEntitlement: yes }), (error) => error instanceof ModuleAccessDeniedError && error.reason === "unavailable"));
test("Team member receives an authorized Team module", () => assert.equal(requireResolvedModule({ space: team(), moduleKey: "fixture_team", registry, isEnabled: yes, hasEntitlement: yes }).accessible, true));
test("unknown module keys are refused", () => assert.throws(() => requireResolvedModule({ space: personal("coach"), moduleKey: "missing", registry, isEnabled: yes, hasEntitlement: yes }), /Module unavailable/));
test("disabled modules are refused independently from availability", () => assert.throws(() => requireResolvedModule({ space: personal("coach"), moduleKey: "fixture_coach", registry, isEnabled: () => false, hasEntitlement: yes }), (error) => error.reason === "disabled"));
test("missing required entitlement is refused", () => { const gated = createModuleRegistry([fixture("fixture_gated", { requiredEntitlements: ["product_access"] })]); assert.throws(() => requireResolvedModule({ space: personal("coach"), moduleKey: "fixture_gated", registry: gated, isEnabled: yes, hasEntitlement: () => false }), (error) => error.reason === "entitlement_required"); });
test("insufficient member capability is refused", () => { const managed = createModuleRegistry([fixture("fixture_manage", { supportedSpaceKinds: ["team"], requiredCapabilities: ["manage_modules"] })]); assert.equal(resolveModulesForSpace({ space: team(), registry: managed, isEnabled: yes, hasEntitlement: yes })[0].denialReason, "permission_required"); });
test("owner and admin capabilities preserve canonical ownership", () => { assert.equal(getTeamCapabilities(team("admin", true)).has("manage_modules"), true); assert.equal(getTeamCapabilities(team("admin")).has("manage_members_limited"), true); assert.equal(getTeamCapabilities(team("admin")).has("manage_modules"), false); });
test("registry keys are unique and stable", () => assert.throws(() => createModuleRegistry([fixture("duplicate"), fixture("duplicate")]), /Duplicate module key/));
test("server access checks the requested space before resolving a module", async () => { const source = await readFile(new URL("../../lib/workspace/modules.js", import.meta.url), "utf8"); const body = source.match(/export async function requireModuleAccess[\s\S]*?\n}/)?.[0] || ""; assert.ok(body.indexOf("requireSpaceAccess(spaceId") < body.indexOf("moduleRegistry.get(moduleKey)")); });
