import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";

import { NextResponse } from "next/server";

const localRateLimitStore = new Map();
const blockedIpStore = new Map();

// Only explicitly known non-production environments may use process-local counters.
function deploymentEnvironment() {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview" || vercelEnv === "development") return vercelEnv;
  if (vercelEnv || process.env.VERCEL === "1" || process.env.NODE_ENV === "production") return "production";
  return "development";
}

function normalizeIp(value) {
  const ip = String(value || "").trim();
  if (!isIP(ip) || ip.includes("%")) return "";
  // URL canonicalizes equivalent IPv6 spellings; keep IPv4-mapped IPv6 stable too.
  if (isIP(ip) === 6) return new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  return ip;
}

function getRequestIp(request) {
  if (process.env.VERCEL === "1") {
    // Vercel documents X-Forwarded-For as overwritten at its ingress.
    // https://vercel.com/docs/headers/request-headers
    return normalizeIp(request.headers.get("x-forwarded-for"));
  }
  if (process.env.TRUST_PROXY_IP_HEADERS === "true") {
    // The operator must ensure the ingress overwrites X-Forwarded-For with ONE IP.
    return normalizeIp(request.headers.get("x-forwarded-for"));
  }
  return "";
}

function hashIdentity(value) {
  return createHash("sha256").update(String(value || "anonymous")).digest("hex").slice(0, 48);
}

function buildRateLimitKey(identity) {
  const prefix = String(process.env.RATE_LIMIT_KEY_PREFIX || "zla:rate-limit").replace(/[^a-zA-Z0-9:_-]/g, "");
  return `${prefix}:${deploymentEnvironment()}:${hashIdentity(identity)}`;
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

  // An untrusted User-Agent/path must never create a fresh quota.
  return suffix ? `anonymous:${suffix}` : "anonymous";
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

  if (new URL(redisUrl).protocol !== "https:") throw new Error("Redis requires HTTPS.");

  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(1500)
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    throw new Error("Rate limit Redis indisponible.");
  }

  return data?.result;
}

async function enforceRedisRateLimit(identity, { limit, windowMs }) {
  const key = buildRateLimitKey(identity);
  // One atomic operation: expiry cannot be lost between INCR and PEXPIRE.
  // Repair legacy counters without TTL instead of blocking indefinitely.
  const result = await redisCommand(["EVAL", `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`, "1", key, String(windowMs)]);
  if (!Array.isArray(result) || result.length !== 2 ||
      !Number.isSafeInteger(result[0]) || result[0] < 1 ||
      !Number.isSafeInteger(result[1]) || result[1] < 0 || result[1] > windowMs) {
    throw new Error("Invalid Redis counter response.");
  }
  const [count, ttl] = result;
  const resetAt = Date.now() + ttl;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    local: false
  };
}

let lastWarningAt = -Infinity;
function reportUnavailable(production) {
  if (Date.now() - lastWarningAt < 60_000) return;
  lastWarningAt = Date.now();
  // Never log URLs, tokens, identities or provider response bodies.
  console.error(production ? "[rate-limit] Redis unavailable; protected requests denied (503)." :
    "[rate-limit] Redis unavailable; using per-instance memory in dev/preview.");
}

function unavailableResponse() {
  return NextResponse.json({ success: false, error: "Service temporairement indisponible. Merci de réessayer." },
    { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } });
}

async function resolveRateLimit(identity, options) {
  const production = deploymentEnvironment() === "production";
  const provider = String(process.env.RATE_LIMIT_PROVIDER || "").trim().toLowerCase();
  const configured = process.env.RATE_LIMIT_REDIS_URL || process.env.RATE_LIMIT_REDIS_TOKEN;
  if (production || provider === "redis" || (!provider && configured)) {
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
  } catch {
    const production = deploymentEnvironment() === "production";
    reportUnavailable(production);
    if (production) return unavailableResponse();
    result = enforceLocalRateLimit(identity, { limit, windowMs });
  }

  if (!result.allowed) {
    return buildRateLimitResponse(result, errorMessage);
  }

  return null;
}

export function enforceRateLimit(request, options) {
  const provider = String(process.env.RATE_LIMIT_PROVIDER || "local").trim().toLowerCase();

  if (deploymentEnvironment() === "production" || provider === "redis" ||
      (!process.env.RATE_LIMIT_PROVIDER && (process.env.RATE_LIMIT_REDIS_URL || process.env.RATE_LIMIT_REDIS_TOKEN))) {
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
  lastWarningAt = -Infinity;
}
