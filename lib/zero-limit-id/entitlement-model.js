export function isEntitlementActive(entitlement, now = new Date()) {
  if (!entitlement || entitlement.status !== "active") return false;
  const time = now.getTime();
  return new Date(entitlement.starts_at).getTime() <= time && (!entitlement.expires_at || new Date(entitlement.expires_at).getTime() > time);
}

export function hasExactlyOneEntitlementScope({ profileId, spaceId, organizationId }) {
  return [profileId, spaceId, organizationId].filter(Boolean).length === 1;
}
