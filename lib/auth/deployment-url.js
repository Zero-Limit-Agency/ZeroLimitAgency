function normalizedHttpOrigin(value, { allowLocalhost = false, requireVercel = false } = {}) {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  try {
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return "";
    if (local) return allowLocalhost && url.protocol === "http:" ? url.origin : "";
    if (url.protocol !== "https:") return "";
    if (requireVercel && url.hostname !== "vercel.app" && !url.hostname.endsWith(".vercel.app")) return "";
    return url.origin;
  } catch {
    return "";
  }
}

export function resolveAuthRedirectOrigin(environment = process.env, requestUrl = "") {
  if (environment.VERCEL_ENV === "preview") {
    const previewOrigin = normalizedHttpOrigin(environment.VERCEL_URL, { requireVercel: true });
    if (previewOrigin) return previewOrigin;
    throw new Error("A trusted Vercel Preview URL is required for Auth redirects");
  }

  const configuredOrigin = normalizedHttpOrigin(environment.NEXT_PUBLIC_APP_URL, {
    allowLocalhost: environment.NODE_ENV !== "production"
  });
  if (configuredOrigin) return configuredOrigin;

  if (environment.VERCEL_ENV === "production") {
    const productionOrigin = normalizedHttpOrigin(environment.VERCEL_PROJECT_PRODUCTION_URL, { requireVercel: true });
    if (productionOrigin) return productionOrigin;
  }

  if (environment.NODE_ENV !== "production") {
    try {
      return normalizedHttpOrigin(new URL(requestUrl).origin, { allowLocalhost: true }) || "http://localhost:3000";
    } catch {
      return "http://localhost:3000";
    }
  }

  throw new Error("A trusted application URL is required for Auth redirects");
}

export function buildAuthRedirectUrl(pathname, environment = process.env, requestUrl = "") {
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) {
    throw new Error("Auth redirect path must be internal");
  }
  return new URL(pathname, resolveAuthRedirectOrigin(environment, requestUrl)).toString();
}
