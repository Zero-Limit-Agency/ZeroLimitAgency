export function isVercelProduction(environment = process.env) {
  return environment.VERCEL_ENV === "production" || (!environment.VERCEL_ENV && environment.NODE_ENV === "production");
}

export function canReturnPreviewInvitationToken(environment = process.env) {
  if (environment.VERCEL_ENV === "production") return false;
  return environment.VERCEL_ENV === "preview" || (!environment.VERCEL_ENV && environment.NODE_ENV !== "production");
}

export function isInteractiveProvisioningEnabled(environment = process.env) {
  return !isVercelProduction(environment) || environment.ZERO_LIMIT_INTERACTIVE_PROVISIONING === "enabled";
}
