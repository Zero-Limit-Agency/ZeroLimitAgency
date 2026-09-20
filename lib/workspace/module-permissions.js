export const TEAM_CAPABILITIES = Object.freeze({
  owner: Object.freeze(["consume_modules", "manage_members", "manage_settings", "manage_modules"]),
  admin: Object.freeze(["consume_modules", "manage_members_limited"]),
  member: Object.freeze(["consume_modules"])
});

export function getTeamCapabilities({ role, isOwner = false }) {
  return new Set(TEAM_CAPABILITIES[isOwner ? "owner" : role] || []);
}

export function getSpaceCapabilities(space) {
  if (space.kind === "personal" || space.kind === "creator") return new Set(["consume_modules", "manage_settings", "manage_modules"]);
  return getTeamCapabilities(space);
}

export function hasRequiredCapabilities(capabilities, required = []) {
  return required.every((capability) => capabilities.has(capability));
}
