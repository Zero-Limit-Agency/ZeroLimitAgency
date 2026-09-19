export class ProfileDataAccessError extends Error {
  constructor(category, status, cause) {
    super(category);
    this.name = "ProfileDataAccessError";
    this.category = category;
    this.status = status;
    this.cause = cause;
  }
}

export function isMissingOnboardingSchema(response) {
  const code = String(response?.data?.code || "");
  const message = String(response?.data?.message || "").toLowerCase();
  return code === "42703" || code === "PGRST204" || (message.includes("onboarding_completed_at") && message.includes("column"));
}

export function profileAccessError(response, operation) {
  if (isMissingOnboardingSchema(response)) return new ProfileDataAccessError("onboarding_schema_missing", response.status, operation);
  if (response.status === 401) return new ProfileDataAccessError("profile_session_rejected", response.status, operation);
  if (response.status === 403) return new ProfileDataAccessError("profile_access_denied", response.status, operation);
  return new ProfileDataAccessError(`profile_${operation}_failed`, response.status, operation);
}
