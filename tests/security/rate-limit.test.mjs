import assert from "node:assert/strict";
import test from "node:test";

process.env.RATE_LIMIT_PROVIDER = "local";
process.env.TRUST_PROXY_IP_HEADERS = "false";

const { checkRateLimit, getRequestIdentity, resetRateLimitForTests } = await import("../../lib/security/rate-limit.js");

function buildRequest({ path = "/api/test", userAgent = "security-test", headers = {} } = {}) {
  const requestHeaders = new Headers({ "user-agent": userAgent, ...headers });
  return {
    headers: requestHeaders,
    nextUrl: { pathname: path }
  };
}

test("rate limiter allows requests below the limit and blocks after limit", async () => {
  resetRateLimitForTests();
  const request = buildRequest();
  const options = { key: "unit", limit: 2, windowMs: 60_000 };

  assert.equal(await checkRateLimit(request, options), null);
  assert.equal(await checkRateLimit(request, options), null);

  const blocked = await checkRateLimit(request, options);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After") !== null, true);
});

test("rate limit keys are separated by route key", async () => {
  resetRateLimitForTests();
  const request = buildRequest();

  assert.equal(await checkRateLimit(request, { key: "route-a", limit: 1, windowMs: 60_000 }), null);
  assert.equal((await checkRateLimit(request, { key: "route-a", limit: 1, windowMs: 60_000 })).status, 429);
  assert.equal(await checkRateLimit(request, { key: "route-b", limit: 1, windowMs: 60_000 }), null);
});

test("rate limit keys are separated by authenticated user key", async () => {
  resetRateLimitForTests();
  const request = buildRequest();

  assert.equal(await checkRateLimit(request, { key: "user-route", userKey: "user-1", limit: 1, windowMs: 60_000 }), null);
  assert.equal(await checkRateLimit(request, { key: "user-route", userKey: "user-2", limit: 1, windowMs: 60_000 }), null);
  assert.equal((await checkRateLimit(request, { key: "user-route", userKey: "user-1", limit: 1, windowMs: 60_000 })).status, 429);
});

test("untrusted x-forwarded-for is not used unless trusted proxy headers are enabled", () => {
  const request = buildRequest({ headers: { "x-forwarded-for": "203.0.113.10" } });

  assert.equal(getRequestIdentity(request, "login"), "/api/test:security-test:login");
});
