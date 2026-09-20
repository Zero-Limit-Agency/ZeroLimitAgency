import { getSpaceCapabilities, hasRequiredCapabilities } from "./module-permissions.js";

export class ModuleAccessDeniedError extends Error {
  constructor(reason = "module_access_denied") {
    super("Module unavailable");
    this.name = "ModuleAccessDeniedError";
    this.reason = reason;
  }
}

export function isModuleAvailableForSpace(manifest, space) {
  if (!manifest.supportedSpaceKinds.includes(space.kind)) return false;
  return space.kind !== "personal" || !manifest.supportedProfessions || manifest.supportedProfessions.includes(space.profession);
}

export function getAvailableModulesForSpace(space, registry) {
  return registry.list().filter((manifest) => isModuleAvailableForSpace(manifest, space));
}

export function resolveModulesForSpace({ space, registry, isEnabled, hasEntitlement }) {
  const capabilities = getSpaceCapabilities(space);
  return getAvailableModulesForSpace(space, registry).map((manifest) => {
    const enabled = manifest.status === "active" && isEnabled(manifest, space);
    const entitled = manifest.requiredEntitlements.every((key) => hasEntitlement(key, space));
    const permitted = hasRequiredCapabilities(capabilities, manifest.requiredCapabilities);
    return Object.freeze({ manifest, available: true, enabled, accessible: enabled && entitled && permitted, denialReason: !enabled ? "disabled" : !entitled ? "entitlement_required" : !permitted ? "permission_required" : null });
  });
}

export function requireResolvedModule({ space, moduleKey, registry, isEnabled, hasEntitlement }) {
  const manifest = registry.get(moduleKey);
  if (!manifest) throw new ModuleAccessDeniedError("unknown_module");
  if (!isModuleAvailableForSpace(manifest, space)) throw new ModuleAccessDeniedError("unavailable");
  const resolved = resolveModulesForSpace({ space, registry: { list: () => [manifest] }, isEnabled, hasEntitlement })[0];
  if (!resolved.accessible) throw new ModuleAccessDeniedError(resolved.denialReason);
  return resolved;
}

export function toModuleNavigation(resolvedModules) {
  return resolvedModules.filter(({ accessible, manifest }) => accessible && manifest.visibility === "navigation").map(({ manifest }) => ({ key: manifest.key, labelKey: manifest.navigation.labelKey, href: manifest.route, order: manifest.order }));
}
