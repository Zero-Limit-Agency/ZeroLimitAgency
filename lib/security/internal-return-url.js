export function isSafeTeamInvitationReturnPath(value) {
  return typeof value === "string" && /^\/invitation\/team\/[A-Za-z0-9_-]{40,100}$/.test(value);
}

export function teamInvitationReturnPath(value, fallback = "/espace?entree=1") {
  return isSafeTeamInvitationReturnPath(value) ? value : fallback;
}
