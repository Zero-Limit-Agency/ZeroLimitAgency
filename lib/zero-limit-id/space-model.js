export const SPACE_KINDS = ["personal", "creator", "team"];

export class SpaceAccessDeniedError extends Error {
  constructor() {
    super("Space unavailable");
    this.name = "SpaceAccessDeniedError";
  }
}

export function normalizeAccessibleSpaces({ profile, ownedSpaces = [], memberships = [], teamSpaces = [], organizations = [] }) {
  const membershipByOrganization = new Map(memberships.map((membership) => [membership.organization_id, membership]));
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization]));

  const personalAndCreator = ownedSpaces
    .filter((space) => space.owner_profile_id === profile.id && (space.kind === "personal" || space.kind === "creator"))
    .map((space) => ({
      id: space.id,
      kind: space.kind,
      name: space.name,
      profession: space.kind === "personal" ? space.personal_profession : null,
      owner: { id: profile.id, name: profile.display_name },
      organization: null,
      role: null,
      isOwner: false
    }));

  const teams = teamSpaces.flatMap((space) => {
    const membership = membershipByOrganization.get(space.organization_id);
    const organization = organizationById.get(space.organization_id);
    if (!membership || !organization || space.kind !== "team") return [];
    return [{
      id: space.id,
      kind: "team",
      name: space.name,
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

export function resolveLastActiveSpace(spaces, spaceId) {
  return spaceId ? findAccessibleSpace(spaces, spaceId) : null;
}
