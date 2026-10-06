import { isEntitlementActive } from "./entitlement-model.js";

export const SPACE_KINDS = ["personal", "creator", "team"];
export const SPACE_STATUSES = ["active", "suspended", "archived"];

export class SpaceAccessDeniedError extends Error {
  constructor() {
    super("Space unavailable");
    this.name = "SpaceAccessDeniedError";
  }
}

export function normalizeAccessibleSpaces({ profile, ownedSpaces = [], memberships = [], teamSpaces = [], organizations = [], entitlements = [] }) {
  const membershipByOrganization = new Map(memberships.map((membership) => [membership.organization_id, membership]));
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));
  const activeEntitlements = entitlements.filter((entitlement) => isEntitlementActive(entitlement));
  const activeSpaceEntitlements = new Set(activeEntitlements.map((entitlement) => `${entitlement.space_id}:${entitlement.key}`));
  const activeOrganizationEntitlements = new Set(activeEntitlements.map((entitlement) => `${entitlement.organization_id}:${entitlement.key}`));

  const personalAndCreator = ownedSpaces
    .filter((space) => space.status === "active" && space.owner_profile_id === profile.id && (
      (space.kind === "personal" && activeSpaceEntitlements.has(`${space.id}:personal_access`))
      || (space.kind === "creator" && activeSpaceEntitlements.has(`${space.id}:creator_access`))
    ))
    .map((space) => ({
      id: space.id,
      kind: space.kind,
      name: space.name,
      status: space.status,
      profession: space.kind === "personal" ? space.personal_profession : null,
      owner: { id: profile.id, name: profile.display_name },
      organization: null,
      role: null,
      isOwner: false
    }));

  const teams = teamSpaces.flatMap((space) => {
    const membership = membershipByOrganization.get(space.organization_id);
    const organization = organizationById.get(space.organization_id);
    if (!membership || !organization || space.kind !== "team" || space.status !== "active" || !activeOrganizationEntitlements.has(`${space.organization_id}:team_access`)) return [];
    return [{
      id: space.id,
      kind: "team",
      name: space.name,
      status: space.status,
      profession: null,
      owner: null,
      organization: { id: organization.id, name: organization.name },
      role: membership.role,
      isOwner: organization.owner_profile_id === profile.id
    }];
  });

  return [...personalAndCreator, ...teams].sort((a, b) => a.name.localeCompare(b.name));
}

export function findAccessibleSpace(spaces, spaceId) {
  return spaces.find((space) => space.id === spaceId) || null;
}

// Discovery for recovery only: these entries never enter active navigation or
// module authorization. Settings and restore still use the existing RPC guards.
export function normalizeArchivedOwnedSpaces({ profile, ownedSpaces = [], memberships = [], teamSpaces = [], organizations = [] }) {
  const memberOrganizations = new Set(memberships.map((membership) => membership.organization_id));
  const ownedOrganizations = new Map(organizations.filter((organization) => organization.owner_profile_id === profile.id && memberOrganizations.has(organization.id)).map((organization) => [organization.id, organization]));
  return [
    ...ownedSpaces.filter((space) => space.status === "archived" && space.owner_profile_id === profile.id && ["personal", "creator"].includes(space.kind)).map((space) => ({ id: space.id, kind: space.kind, name: space.name })),
    ...teamSpaces.filter((space) => space.status === "archived" && space.kind === "team" && ownedOrganizations.has(space.organization_id)).map((space) => ({ id: space.id, kind: space.kind, name: ownedOrganizations.get(space.organization_id).name }))
  ].sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveLastActiveSpace(spaces, spaceId) {
  return spaceId ? findAccessibleSpace(spaces, spaceId) : null;
}
