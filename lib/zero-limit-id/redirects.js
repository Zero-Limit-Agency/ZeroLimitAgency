import { teamInvitationReturnPath, isSafeTeamInvitationReturnPath } from "../security/internal-return-url.js";
import { resolveLastActiveSpace } from "./space-model.js";

export function privateDestination(profile, next) {
  if (!profile?.onboarding_completed_at) return onboardingDestination(next);
  return teamInvitationReturnPath(next);
}

export function onboardingDestination(next) {
  return isSafeTeamInvitationReturnPath(next)
    ? `/identite/onboarding?next=${encodeURIComponent(next)}`
    : "/identite/onboarding";
}

// The caller must supply the freshly server-authorized set. The cookie is only
// a preference; revoked, archived or foreign IDs cannot select a Space.
export function workspaceEntryDestination(spaces, lastSpaceId) {
  const space = resolveLastActiveSpace(spaces, lastSpaceId) || (spaces.length === 1 ? spaces[0] : null);
  return space ? `/espace/${encodeURIComponent(space.id)}/activer` : null;
}

export function requireCompletedOnboarding(profile) {
  return profile?.onboarding_completed_at ? null : onboardingDestination();
}
