import "server-only";

import { hasEntitlement } from "@/lib/zero-limit-id/entitlements";
import { requireSpaceAccess } from "@/lib/zero-limit-id/spaces";
import { moduleRegistry } from "@/lib/workspace/module-registry";
import { requireResolvedModule, resolveModulesForSpace, toModuleNavigation } from "@/lib/workspace/module-resolution";

const defaultActivation = (manifest) => manifest.defaultEnabled === true;

async function entitlementSetFor(space, manifests, options) {
  const keys = [...new Set(manifests.flatMap((manifest) => manifest.requiredEntitlements))];
  const scope = space.kind === "team" ? { organizationId: space.organization.id } : { spaceId: space.id };
  const checks = await Promise.all(keys.map(async (key) => [key, await hasEntitlement({ key, ...scope }, options)]));
  return new Set(checks.filter(([, active]) => active).map(([key]) => key));
}

export async function getAccessibleModulesForCurrentProfile(spaceId, options = {}) {
  const context = await requireSpaceAccess(spaceId, options);
  const manifests = moduleRegistry.list();
  const entitlements = await entitlementSetFor(context.space, manifests, options);
  const resolvedModules = resolveModulesForSpace({ space: context.space, registry: moduleRegistry, isEnabled: defaultActivation, hasEntitlement: (key) => entitlements.has(key) });
  return { ...context, resolvedModules, modules: toModuleNavigation(resolvedModules) };
}

export async function requireModuleAccess(spaceId, moduleKey, options = {}) {
  // Space authorization happens first, preventing cross-space probing.
  const context = await requireSpaceAccess(spaceId, options);
  const manifest = moduleRegistry.get(moduleKey);
  const entitlements = await entitlementSetFor(context.space, manifest ? [manifest] : [], options);
  const module = requireResolvedModule({ space: context.space, moduleKey, registry: moduleRegistry, isEnabled: defaultActivation, hasEntitlement: (key) => entitlements.has(key) });
  return { ...context, module };
}
