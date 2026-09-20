import "server-only";

import { getClientSession } from "@/lib/auth/client-auth";
import { supabaseServerRequest } from "@/lib/supabase/server";
import { hasExactlyOneEntitlementScope, isEntitlementActive } from "@/lib/zero-limit-id/entitlement-model";

export class EntitlementRequiredError extends Error {
  constructor() { super("Entitlement required"); this.name = "EntitlementRequiredError"; }
}

export async function hasEntitlement({ key, profileId, spaceId, organizationId }, { session: suppliedSession, request = supabaseServerRequest } = {}) {
  if (!hasExactlyOneEntitlementScope({ profileId, spaceId, organizationId }) || !/^[a-z][a-z0-9_]{1,79}$/.test(key || "")) return false;
  const session = suppliedSession || await getClientSession();
  if (!session?.accessToken || session.isDemo) return false;
  const scope = profileId ? ["profile_id", profileId] : spaceId ? ["space_id", spaceId] : ["organization_id", organizationId];
  const result = await request(`/rest/v1/zero_limit_entitlements?key=eq.${encodeURIComponent(key)}&${scope[0]}=eq.${encodeURIComponent(scope[1])}&select=status,starts_at,expires_at`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
  return Boolean(result.ok && result.data?.some((entitlement) => isEntitlementActive(entitlement)));
}

export async function requireEntitlement(query, options) {
  if (!await hasEntitlement(query, options)) throw new EntitlementRequiredError();
  return true;
}
