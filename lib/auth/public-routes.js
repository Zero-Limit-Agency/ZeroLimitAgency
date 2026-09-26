const LEGACY_AUTH_ROUTES = Object.freeze({
  "/identite/connexion": "/connexion",
  "/identite/inscription": "/inscription",
  "/identite/mot-de-passe-oublie": "/mot-de-passe-oublie",
  "/identite/nouveau-mot-de-passe": "/nouveau-mot-de-passe",
  "/identite/confirmation": "/confirmation"
});

const PASSTHROUGH_PARAMETERS = new Set([
  "invitation", "token", "code", "state", "type", "error", "error_code", "error_description"
]);

export function canonicalAuthRoute(pathname) {
  return LEGACY_AUTH_ROUTES[pathname] || null;
}

export function isSafeAuthNext(value) {
  return typeof value === "string" && (
    value === "/identite" ||
    value === "/identite/onboarding" ||
    value === "/espace" ||
    /^\/espace\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(value) ||
    /^\/invitation\/team\/[A-Za-z0-9_-]{40,100}$/.test(value)
  );
}

export function buildLegacyAuthRedirect(pathname, searchParams = {}) {
  const destination = canonicalAuthRoute(pathname);
  if (!destination) return null;

  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(searchParams || {})) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (typeof value !== "string") continue;
      if (key === "next") {
        if (isSafeAuthNext(value)) params.append(key, value);
      } else if (PASSTHROUGH_PARAMETERS.has(key)) {
        params.append(key, value);
      }
    }
  }

  const query = params.toString();
  return query ? `${destination}?${query}` : destination;
}
