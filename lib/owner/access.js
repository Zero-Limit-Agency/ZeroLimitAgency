import "server-only";
import { getClientSession } from "@/lib/auth/client-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { OwnerAccessError, OWNER_ERROR_CODES } from "@/lib/owner/errors";

export const PLATFORM_OWNER_ROLE = "owner";
export async function resolveOwnerSession(session, adminClient = createSupabaseAdminClient()) {
  if (!session?.user?.id || session.isDemo) throw new OwnerAccessError(OWNER_ERROR_CODES.REQUIRED, 401);
  const profileResult = await adminClient.ownerIdentity.getByAuthUserId(session.user.id);
  const profile = profileResult.ok && Array.isArray(profileResult.data) ? profileResult.data[0] : null;
  if (!profile?.id || profile.auth_user_id !== session.user.id) throw new OwnerAccessError();
  const roleResult = await adminClient.ownerIdentity.getRole(profile.id);
  const platformRole = roleResult.ok && Array.isArray(roleResult.data) ? roleResult.data[0] : null;
  if (platformRole?.profile_id !== profile.id || platformRole.role !== PLATFORM_OWNER_ROLE) throw new OwnerAccessError();
  return Object.freeze({ authUserId: session.user.id, profileId: profile.id, username: profile.username,
    displayName: profile.display_name, preferredLocale: profile.preferred_locale === "en" ? "en" : "fr",
    platformRole: PLATFORM_OWNER_ROLE, grantedAt: platformRole.granted_at || null, assuranceLevel: "aal1" });
}
export async function requireOwnerSession() { return resolveOwnerSession(await getClientSession()); }
