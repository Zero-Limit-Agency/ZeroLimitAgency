import "server-only";

import { getClientSession } from "@/lib/auth/client-auth";
import { supabaseServerRequest } from "@/lib/supabase/server";
import { ProfileDataAccessError, profileAccessError } from "@/lib/zero-limit-id/profile-errors";

export class AuthenticationRequiredError extends Error {}

function provisionalUsername(userId) {
  return `zlid_${String(userId).replace(/-/g, "").slice(0, 20)}`;
}

export async function ensureProfileForSession(session, request = supabaseServerRequest) {
  const userId = session?.user?.id;
  const accessToken = session?.accessToken;
  if (!userId || !accessToken || session.isDemo) throw new AuthenticationRequiredError("Authentication required");

  // Listing the onboarding columns deliberately doubles as a schema readiness
  // check. A Preview missing the onboarding migration now produces a classified
  // server diagnostic instead of an unexplained error boundary.
  const columns = "id,auth_user_id,username,display_name,preferred_locale,avatar_url,onboarding_completed_at,onboarding_intent";
  const query = `/rest/v1/profiles?auth_user_id=eq.${encodeURIComponent(userId)}&select=${columns}&limit=1`;
  const existing = await request(query, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!existing.ok) throw profileAccessError(existing, "lookup");
  if (existing.data?.[0]) return existing.data[0];

  const created = await request("/rest/v1/profiles", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, Prefer: "return=representation" },
    body: { auth_user_id: userId, username: provisionalUsername(userId), display_name: "Membre Zero Limit", preferred_locale: "fr" }
  });
  if (created.ok && created.data?.[0]) return created.data[0];

  // A unique violation is expected when two first requests race. Always re-read
  // the caller-scoped row; no identity supplied by a browser is ever trusted.
  const recovered = await request(query, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (recovered.ok && recovered.data?.[0]) return recovered.data[0];
  if (!recovered.ok) throw profileAccessError(recovered, "recovery");
  throw profileAccessError(created, "creation");
}

export async function ensureCurrentProfile() {
  return ensureProfileForSession(await getClientSession());
}

export async function updateCurrentProfile(profile, accessToken, values, request = supabaseServerRequest) {
  return request(`/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}&auth_user_id=eq.${encodeURIComponent(profile.auth_user_id)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, Prefer: "return=representation" },
    body: values
  });
}

export function describeProfileDataAccessError(error) {
  return error instanceof ProfileDataAccessError
    ? { category: error.category, status: error.status, operation: error.cause }
    : null;
}
