export function privateDestination(profile) {
  return profile?.onboarding_completed_at ? "/identite" : "/identite/onboarding";
}

export function requireCompletedOnboarding(profile) {
  return profile?.onboarding_completed_at ? null : "/identite/onboarding";
}
