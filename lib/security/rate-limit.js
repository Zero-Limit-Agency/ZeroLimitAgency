import "server-only";

import { NextResponse } from "next/server";

const rateLimitStore = new Map();

function getFirstForwardedIp(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  return raw.split(",")[0]?.trim() || "";
}

export function getRequestIdentity(request, suffix = "") {
  const forwardedFor = getFirstForwardedIp(request.headers.get("x-forwarded-for"));
  const realIp = String(request.headers.get("x-real-ip") || "").trim();
  const cfIp = String(request.headers.get("cf-connecting-ip") || "").trim();
  const ip = forwardedFor || realIp || cfIp;

  if (ip) {
    return suffix ? `${ip}:${suffix}` : ip;
  }

  const userAgent = String(request.headers.get("user-agent") || "unknown-agent").slice(0, 160);
  const path = request.nextUrl?.pathname || "unknown-path";
  return suffix ? `${path}:${userAgent}:${suffix}` : `${path}:${userAgent}`;
}

function cleanupBucket(now) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (!entry || entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function enforceRateLimit(request, options) {
  const {
    key,
    limit,
    windowMs,
    errorMessage = "Trop de requetes. Merci de reessayer plus tard."
  } = options;

  const now = Date.now();
  cleanupBucket(now);

  const identity = getRequestIdentity(request, key);
  const entry = rateLimitStore.get(identity);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(identity, {
      count: 1,
      resetAt: now + windowMs
    });
    return null;
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds)
        }
      }
    );
  }

  entry.count += 1;
  rateLimitStore.set(identity, entry);
  return null;
}
