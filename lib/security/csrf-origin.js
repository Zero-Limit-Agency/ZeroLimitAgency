function parseTrustedOrigin(value, { vercelOnly = false, localOnly = false } = {}) {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  try {
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return "";
    if (localOnly) return isLocal && url.protocol === "http:" ? url.origin : "";
    if (isLocal || url.protocol !== "https:") return "";
    if (vercelOnly && !url.hostname.endsWith(".vercel.app")) return "";
    return url.origin;
  } catch {
    return "";
  }
}

export function trustedMutationOrigins(environment = process.env) {
  const origins = new Set();
  const configured = parseTrustedOrigin(environment.NEXT_PUBLIC_APP_URL);
  const preview = parseTrustedOrigin(environment.VERCEL_URL, { vercelOnly: true });
  const production = parseTrustedOrigin(environment.VERCEL_PROJECT_PRODUCTION_URL, { vercelOnly: true });
  const local = environment.NODE_ENV !== "production"
    ? parseTrustedOrigin(environment.NEXT_PUBLIC_APP_URL, { localOnly: true }) || "http://localhost:3000"
    : "";
  for (const origin of [configured, preview, production, local]) if (origin) origins.add(origin);
  return origins;
}

export function hasTrustedMutationOrigin({ origin, referer }, environment = process.env) {
  const source = origin || referer;
  if (!source) return false;
  try {
    return trustedMutationOrigins(environment).has(new URL(source).origin);
  } catch {
    return false;
  }
}
