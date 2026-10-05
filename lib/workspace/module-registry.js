const MODULE_KEY_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export const MODULE_STATUSES = Object.freeze(["active", "disabled", "coming_soon"]);
export const MODULE_VISIBILITIES = Object.freeze(["navigation", "hidden"]);
export const MODULE_NAVIGATION_SECTIONS = Object.freeze(["work"]);
export const MODULE_NAVIGATION_PRIORITIES = Object.freeze(["primary", "overflow"]);

function freezeManifest(manifest) {
  return Object.freeze({
    ...manifest,
    supportedSpaceKinds: Object.freeze([...manifest.supportedSpaceKinds]),
    supportedProfessions: manifest.supportedProfessions ? Object.freeze([...manifest.supportedProfessions]) : null,
    requiredEntitlements: Object.freeze([...(manifest.requiredEntitlements || [])]),
    requiredCapabilities: Object.freeze([...(manifest.requiredCapabilities || [])]),
    navigation: Object.freeze({ ...manifest.navigation })
  });
}

export function assertModuleManifest(manifest) {
  if (!manifest || !MODULE_KEY_PATTERN.test(manifest.key || "")) throw new TypeError("Invalid module key");
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) throw new TypeError(`Invalid version for module ${manifest.key}`);
  if (!Array.isArray(manifest.supportedSpaceKinds) || !manifest.supportedSpaceKinds.length) throw new TypeError(`Missing supported space kinds for module ${manifest.key}`);
  if (!manifest.supportedSpaceKinds.every((kind) => ["personal", "creator", "team"].includes(kind))) throw new TypeError(`Invalid space kind for module ${manifest.key}`);
  if (manifest.supportedProfessions && !manifest.supportedSpaceKinds.includes("personal")) throw new TypeError(`Profession filter is only valid for Personal modules: ${manifest.key}`);
  if (!MODULE_STATUSES.includes(manifest.status)) throw new TypeError(`Invalid status for module ${manifest.key}`);
  if (!MODULE_VISIBILITIES.includes(manifest.visibility)) throw new TypeError(`Invalid visibility for module ${manifest.key}`);
  if (!Number.isInteger(manifest.order)) throw new TypeError(`Invalid order for module ${manifest.key}`);
  if (manifest.route !== `/espace/[spaceId]/modules/${manifest.key}`) throw new TypeError(`Invalid route for module ${manifest.key}`);
  if (!manifest.navigation?.labelKey) throw new TypeError(`Missing navigation label for module ${manifest.key}`);
  if (!MODULE_NAVIGATION_SECTIONS.includes(manifest.navigation.section || "work")) throw new TypeError(`Invalid navigation section for module ${manifest.key}`);
  if (!MODULE_NAVIGATION_PRIORITIES.includes(manifest.navigation.priority || "primary")) throw new TypeError(`Invalid navigation priority for module ${manifest.key}`);
  if (manifest.navigation.icon && !/^[a-z][a-z0-9-]*$/.test(manifest.navigation.icon)) throw new TypeError(`Invalid navigation icon for module ${manifest.key}`);
  return manifest;
}

export function createModuleRegistry(manifests) {
  const entries = new Map();
  for (const source of manifests) {
    const manifest = freezeManifest(assertModuleManifest(source));
    if (entries.has(manifest.key)) throw new TypeError(`Duplicate module key: ${manifest.key}`);
    entries.set(manifest.key, manifest);
  }
  return Object.freeze({
    get: (key) => entries.get(key) || null,
    list: () => [...entries.values()].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
  });
}

// Production intentionally starts empty. Future modules register a reviewed manifest here.
export const moduleRegistry = createModuleRegistry([]);
