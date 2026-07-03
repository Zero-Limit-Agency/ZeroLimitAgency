import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export function normalizeProductKey(value) {
  const key = String(value || "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._:-]{1,120}$/.test(key) ? key : "";
}

export async function hasActiveEntitlement(userId, productKey) {
  const normalizedProductKey = normalizeProductKey(productKey);

  if (!userId || !normalizedProductKey) {
    return false;
  }

  const adminClient = createSupabaseAdminClient();
  const result = await adminClient.entitlements.getActiveByUserAndProduct(userId, normalizedProductKey);

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return false;
  }

  const entitlement = result.data[0];
  return !entitlement.expires_at || new Date(entitlement.expires_at).getTime() > Date.now();
}

export async function requireEntitlement(user, productKey) {
  if (!user?.id || !(await hasActiveEntitlement(user.id, productKey))) {
    return {
      ok: false,
      entitlement: null
    };
  }

  return {
    ok: true,
    entitlement: { productKey: normalizeProductKey(productKey) }
  };
}
