import "server-only";

import { getClientSession } from "@/lib/auth/client-auth";
import { supabaseServerRequest } from "@/lib/supabase/server";
import { AuthenticationRequiredError, ensureProfileForSession } from "@/lib/zero-limit-id/profile";
import { findAccessibleSpace, normalizeAccessibleSpaces, SpaceAccessDeniedError } from "@/lib/zero-limit-id/space-model";

export class SpaceDataAccessError extends Error {
  constructor(operation, status) {
    super("Unable to load spaces");
    this.name = "SpaceDataAccessError";
    this.operation = operation;
    this.status = status;
  }
}

function assertResult(result, operation) {
  if (!result.ok) throw new SpaceDataAccessError(operation, result.status);
  return result.data || [];
}

function inFilter(ids) {
  return ids.map((id) => `"${String(id).replaceAll('"', '')}"`).join(",");
}

export async function getAccessibleSpacesForCurrentProfile({ session: suppliedSession, request = supabaseServerRequest } = {}) {
  const session = suppliedSession || await getClientSession();
  if (!session?.user?.id || !session.accessToken || session.isDemo) throw new AuthenticationRequiredError("Authentication required");
  const profile = await ensureProfileForSession(session, request);
  const headers = { Authorization: `Bearer ${session.accessToken}` };

  const [ownedResult, membershipResult, entitlementResult] = await Promise.all([
    request(`/rest/v1/spaces?owner_profile_id=eq.${encodeURIComponent(profile.id)}&kind=in.(personal,creator)&select=id,kind,name,status,owner_profile_id,organization_id,personal_profession`, { headers, cache: "no-store" }),
    request(`/rest/v1/organization_memberships?profile_id=eq.${encodeURIComponent(profile.id)}&select=organization_id,profile_id,role`, { headers }),
    request("/rest/v1/zero_limit_entitlements?select=key,profile_id,space_id,organization_id,status,starts_at,expires_at", { headers })
  ]);
  const ownedSpaces = assertResult(ownedResult, "owned-spaces");
  const memberships = assertResult(membershipResult, "memberships");
  const entitlements = assertResult(entitlementResult, "entitlements");
  const organizationIds = [...new Set(memberships.map((membership) => membership.organization_id))];
  let teamSpaces = [];
  let organizations = [];

  if (organizationIds.length) {
    const filter = inFilter(organizationIds);
    const [teamResult, organizationResult] = await Promise.all([
      request(`/rest/v1/spaces?kind=eq.team&organization_id=in.(${filter})&select=id,kind,name,status,owner_profile_id,organization_id,personal_profession`, { headers, cache: "no-store" }),
      request(`/rest/v1/organizations?id=in.(${filter})&select=id,name,owner_profile_id`, { headers })
    ]);
    teamSpaces = assertResult(teamResult, "team-spaces");
    organizations = assertResult(organizationResult, "organizations");
  }

  return { profile, spaces: normalizeAccessibleSpaces({ profile, ownedSpaces, memberships, teamSpaces, organizations, entitlements }) };
}

export async function requireSpaceAccess(spaceId, options) {
  if (!spaceId || typeof spaceId !== "string") throw new SpaceAccessDeniedError();
  const context = await getAccessibleSpacesForCurrentProfile(options);
  const space = findAccessibleSpace(context.spaces, spaceId);
  if (!space) throw new SpaceAccessDeniedError();
  return { ...context, space };
}

export function reportSpaceDataAccessError(error, route) {
  if (!(error instanceof SpaceDataAccessError)) return null;
  const correlationId = crypto.randomUUID();
  console.error("[space-navigation] data access failure", { correlationId, route, operation: error.operation, status: error.status });
  return correlationId;
}
