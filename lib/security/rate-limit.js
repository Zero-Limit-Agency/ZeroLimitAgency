import "server-only";

import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

const localRateLimitStore = new Map();
const blockedIpStore = new Map();

function getFirstForwardedIp(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  return raw.split(",")[0]?.trim() || "";
}

function isTrustedProxyHeaderEnabled() {
  return process.env.TRUST_PROXY_IP_HEADERS === "true" || process.env.VERCEL === "1";
}

function getRequestIp(request) {
  const vercelForwardedFor = getFirstForwardedIp(request.headers.get("x-vercel-forwarded-for"));

  if (vercelForwardedFor) {
    return vercelForwardedFor;
  }

  if (!isTrustedProxyHeaderEnabled()) {
    return "";
  }

  const forwardedFor = getFirstForwardedIp(request.headers.get("x-forwarded-for"));
  const realIp = String(request.headers.get("x-real-ip") || "").trim();
  const cfIp = String(request.headers.get("cf-connecting-ip") || "").trim();
  return forwardedFor || realIp || cfIp || "";
}

function hashIdentity(value) {
  return createHash("sha256").update(String(value || "anonymous")).digest("hex").slice(0, 48);
}

function buildRateLimitKey(identity) {
  const prefix = String(process.env.RATE_LIMIT_KEY_PREFIX || "zla:rate-limit").replace(/[^a-zA-Z0-9:_-]/g, "");
  return `${prefix}:${hashIdentity(identity)}`;
}

export function permanentlyBlockRequestIp(request, reason = "blocked") {
  const ip = getRequestIp(request);

  if (!ip) {
    return false;
  }

  blockedIpStore.set(ip, {
    blockedAt: Date.now(),
    reason: String(reason || "blocked").slice(0, 120)
  });

  return true;
}

export function getBlockedIpResponse(request) {
  const ip = getRequestIp(request);

  if (!ip || !blockedIpStore.has(ip)) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error: "Acces refuse."
    },
    { status: 403 }
  );
}

export function getRequestIdentity(request, suffix = "", userKey = "") {
  const stableUserKey = String(userKey || "").trim();

  if (stableUserKey) {
    return suffix ? `user:${stableUserKey}:${suffix}` : `user:${stableUserKey}`;
  }

  const ip = getRequestIp(request);

  if (ip) {
    return suffix ? `ip:${ip}:${suffix}` : `ip:${ip}`;
  }

  const userAgent = String(request.headers.get("user-agent") || "unknown-agent").slice(0, 160);
  const path = request.nextUrl?.pathname || "unknown-path";
  return suffix ? `${path}:${userAgent}:${suffix}` : `${path}:${userAgent}`;
}

function cleanupLocalBucket(now) {
  for (const [key, entry] of localRateLimitStore.entries()) {
    if (!entry || entry.resetAt <= now) {
      localRateLimitStore.delete(key);
    }
  }
}

function enforceLocalRateLimit(identity, { limit, windowMs }) {
  const now = Date.now();
  cleanupLocalBucket(now);

  const key = buildRateLimitKey(identity);
  const entry = localRateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    localRateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs, local: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, local: true };
  }

  entry.count += 1;
  localRateLimitStore.set(key, entry);
  return { allowed: true, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt, local: true };
}

async function redisCommand(command) {
  const redisUrl = String(process.env.RATE_LIMIT_REDIS_URL || "").replace(/\/$/, "");
  const redisToken = String(process.env.RATE_LIMIT_REDIS_TOKEN || "");

  if (!redisUrl || !redisToken) {
    throw new Error("RATE_LIMIT_REDIS_URL ou RATE_LIMIT_REDIS_TOKEN manquant.");
  }

  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    throw new Error("Rate limit Redis indisponible.");
  }

  return data?.result;
}

async function enforceRedisRateLimit(identity, { limit, windowMs }) {
  const key = buildRateLimitKey(identity);
  const count = Number(await redisCommand(["INCR", key]));

  if (count === 1) {
    await redisCommand(["PEXPIRE", key, String(windowMs)]);
  }

  const ttl = Number(await redisCommand(["PTTL", key]));
  const resetAt = Date.now() + Math.max(0, ttl);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    local: false
  };
}

async function resolveRateLimit(identity, options) {
  const provider = String(process.env.RATE_LIMIT_PROVIDER || "local").trim().toLowerCase();

  if (provider === "redis") {
    return enforceRedisRateLimit(identity, options);
  }

  return enforceLocalRateLimit(identity, options);
}

function buildRateLimitResponse(result, errorMessage) {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

  return NextResponse.json(
    {
      success: false,
      error: errorMessage
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Remaining": "0"
      }
    }
  );
}

export async function checkRateLimit(request, options) {
  const {
    key,
    limit,
    windowMs,
    userKey = "",
    errorMessage = "Trop de requêtes. Merci de réessayer plus tard."
  } = options;

  const blockedResponse = getBlockedIpResponse(request);

  if (blockedResponse) {
    return blockedResponse;
  }

  const identity = getRequestIdentity(request, key, userKey);
  let result;

  try {
    result = await resolveRateLimit(identity, { limit, windowMs });
  } catch (error) {
    if (process.env.RATE_LIMIT_FAIL_CLOSED === "true") {
      result = { allowed: false, remaining: 0, resetAt: Date.now() + windowMs, local: false };
    } else {
      result = enforceLocalRateLimit(identity, { limit, windowMs });
    }
  }

  if (!result.allowed) {
    return buildRateLimitResponse(result, errorMessage);
  }

  return null;
}

export function enforceRateLimit(request, options) {
  const provider = String(process.env.RATE_LIMIT_PROVIDER || "local").trim().toLowerCase();

  if (provider === "redis") {
    throw new Error("enforceRateLimit is synchronous; use await checkRateLimit for RATE_LIMIT_PROVIDER=redis.");
  }

  const blockedResponse = getBlockedIpResponse(request);

  if (blockedResponse) {
    return blockedResponse;
  }

  const result = enforceLocalRateLimit(getRequestIdentity(request, options.key, options.userKey), options);

  if (!result.allowed) {
    return buildRateLimitResponse(result, options.errorMessage || "Trop de requêtes. Merci de réessayer plus tard.");
  }

  return null;
}

export function resetRateLimitForTests() {
  localRateLimitStore.clear();
  blockedIpStore.clear();
}
