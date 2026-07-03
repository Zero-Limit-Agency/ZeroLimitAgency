export function sanitizeExternalUrl(value, { allowHttpInDevelopment = true, allowedProtocols = ["https:"] } = {}) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    const protocols = new Set(allowedProtocols);

    if (allowHttpInDevelopment && process.env.NODE_ENV !== "production") {
      protocols.add("http:");
    }

    if (!protocols.has(url.protocol)) {
      return "";
    }

    if (!url.hostname || url.username || url.password) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export function sanitizeInternalPath(value, fallback = "/") {
  const raw = String(value || "").trim();

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  if (/javascript:/i.test(raw) || /[\u0000-\u001f]/.test(raw)) {
    return fallback;
  }

  return raw;
}
