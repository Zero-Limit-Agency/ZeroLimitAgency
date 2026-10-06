import assert from "node:assert/strict";
import test, { beforeEach, afterEach } from "node:test";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
beforeEach(() => {
  for (const key of Object.keys(process.env)) if (/^(RATE_LIMIT_|VERCEL|TRUST_PROXY_IP_HEADERS|NODE_ENV)/.test(key)) delete process.env[key];
  process.env.NODE_ENV = "test";
  resetRateLimitForTests();
});
afterEach(() => { process.env = { ...originalEnv }; globalThis.fetch = originalFetch; });

const { checkRateLimit, getRequestIdentity, enforceRateLimit, resetRateLimitForTests } = await import("../../lib/security/rate-limit.js");

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

  assert.equal(getRequestIdentity(request, "login"), "anonymous:login");
});

const options = { key: "unit", limit: 2, windowMs: 60_000 };
function redisConfig() {
  process.env.RATE_LIMIT_PROVIDER = "redis";
  process.env.RATE_LIMIT_REDIS_URL = "https://redis.example.test";
  process.env.RATE_LIMIT_REDIS_TOKEN = "fixture-token";
}
function mockRedis(result, status = 200) {
  globalThis.fetch = async () => new Response(JSON.stringify({ result }), { status });
}

for (const env of ["development", "preview"]) {
  for (const provider of ["", "local", "redis"]) {
    test(`${env} with absent Redis (${provider || "default"}) remains usable and limited`, async () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_ENV = env;
      process.env.RATE_LIMIT_PROVIDER = provider;
      process.env.RATE_LIMIT_FAIL_CLOSED = "true"; // obsolete flag cannot break Preview
      assert.equal(await checkRateLimit(buildRequest(), options), null);
      assert.equal(await checkRateLimit(buildRequest(), options), null);
      assert.equal((await checkRateLimit(buildRequest(), options)).status, 429);
    });
  }
  test(`${env} falls back to an enforced local quota when Redis errors`, async () => {
    process.env.VERCEL_ENV = env;
    redisConfig();
    globalThis.fetch = async () => { throw new Error("do not log secret"); };
    for (let i = 0; i < 2; i++) assert.equal(await checkRateLimit(buildRequest(), options), null);
    assert.equal((await checkRateLimit(buildRequest(), options)).status, 429);
  });
}
for (const env of ["production", "custom-environment", ""]) {
  for (const provider of ["", "local", "redis", "typo"]) {
    test(`production cannot silently bypass absent Redis: env=${env}, provider=${provider}`, async () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL_ENV = env;
      process.env.RATE_LIMIT_PROVIDER = provider;
      process.env.RATE_LIMIT_FAIL_CLOSED = "false";
      const response = await checkRateLimit(buildRequest(), options);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("Retry-After"), "30");
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.throws(() => enforceRateLimit(buildRequest(), options));
    });
  }
}
test("Vercel with missing environment is conservatively production", async () => {
  process.env.VERCEL = "1";
  assert.equal((await checkRateLimit(buildRequest(), options)).status, 503);
});
test("production Redis OK, limit reached, recovery and atomic command contract", async () => {
  process.env.VERCEL_ENV = "production";
  redisConfig();
  let count = 0;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://redis.example.test");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal instanceof AbortSignal);
    const command = JSON.parse(init.body);
    assert.equal(command[0], "EVAL");
    assert.equal(command[2], "1");
    assert.equal(command[4], "60000");
    return new Response(JSON.stringify({ result: [++count, 5000] }));
  };
  assert.equal(await checkRateLimit(buildRequest(), options), null);
  assert.equal(await checkRateLimit(buildRequest(), options), null);
  const response = await checkRateLimit(buildRequest(), options);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "5");
  assert.equal(response.headers.get("X-RateLimit-Remaining"), "0");
  globalThis.fetch = async () => { throw new Error("offline"); };
  assert.equal((await checkRateLimit(buildRequest(), options)).status, 503);
  mockRedis([1, 60000]);
  assert.equal(await checkRateLimit(buildRequest(), options), null);
});
for (const result of [null, 0, [], [0, 60000], [1, -1], [1, -2], [1, 60001], [1.5, 200], ["1", 200]]) {
  test(`invalid Redis result fails closed: ${JSON.stringify(result)}`, async () => {
    process.env.VERCEL_ENV = "production"; redisConfig(); mockRedis(result);
    assert.equal((await checkRateLimit(buildRequest(), options)).status, 503);
  });
}
for (const failure of ["http", "json", "provider", "network", "timeout", "insecure-url", "partial-config"]) {
  test(`production Redis failure ${failure} returns 503 without secret disclosure`, async () => {
    process.env.VERCEL_ENV = "production"; redisConfig();
    if (failure === "insecure-url") process.env.RATE_LIMIT_REDIS_URL = "http://redis.example.test";
    if (failure === "partial-config") delete process.env.RATE_LIMIT_REDIS_TOKEN;
    globalThis.fetch = async (_url, init) => {
      if (failure === "http") return new Response("{}", { status: 500 });
      if (failure === "json") return new Response("not-json");
      if (failure === "provider") return new Response(JSON.stringify({ error: "fixture-token" }));
      if (failure === "timeout") return new Promise((_, reject) => {
        // Keep the event loop alive while the actual AbortSignal deadline runs.
        const timer = setTimeout(() => reject(new Error("deadline not applied")), 2500);
        init.signal.addEventListener("abort", () => { clearTimeout(timer); reject(init.signal.reason); });
      });
      throw new Error("fixture-token");
    };
    const response = await checkRateLimit(buildRequest(), options);
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /fixture-token|redis.example/);
  });
}
test("rotating User-Agent, path or spoofed proxy headers cannot rotate an anonymous quota", async () => {
  for (let i = 0; i < 3; i++) {
    const request = buildRequest({ userAgent: `agent-${i}`, path: `/api/${i}`, headers: {
      "x-vercel-forwarded-for": `203.0.113.${i}`, "x-forwarded-for": `203.0.113.${i}`,
      "x-real-ip": `203.0.113.${i}`, "cf-connecting-ip": `203.0.113.${i}`
    } });
    assert.equal(getRequestIdentity(request, "unit"), "anonymous:unit");
    assert.equal((await checkRateLimit(request, options))?.status || 200, i === 2 ? 429 : 200);
  }
});
test("Vercel trusts its documented overwritten X-Forwarded-For, never alternative headers", () => {
  process.env.VERCEL = "1"; process.env.TRUST_PROXY_IP_HEADERS = "false";
  const headers = { "x-vercel-forwarded-for": "198.51.100.1", "x-real-ip": "198.51.100.2", "cf-connecting-ip": "198.51.100.3" };
  for (const value of ["", "invalid", "203.0.113.1, 203.0.113.2", "203.0.113.1:8080", "fe80::1%eth0"]) {
    assert.equal(getRequestIdentity(buildRequest({ headers: { ...headers, "x-forwarded-for": value } })), "anonymous");
  }
  assert.equal(getRequestIdentity(buildRequest({ headers: { ...headers, "x-forwarded-for": "203.0.113.1" } })), "ip:203.0.113.1");
});
test("explicit non-Vercel proxy trust accepts only one valid overwritten X-Forwarded-For", () => {
  process.env.TRUST_PROXY_IP_HEADERS = "true";
  assert.equal(getRequestIdentity(buildRequest({ headers: { "x-forwarded-for": "203.0.113.1" } })), "ip:203.0.113.1");
  assert.equal(getRequestIdentity(buildRequest({ headers: { "x-forwarded-for": "203.0.113.1, 198.51.100.1" } })), "anonymous");
  assert.equal(getRequestIdentity(buildRequest({ headers: { "x-vercel-forwarded-for": "203.0.113.1" } })), "anonymous");
  assert.equal(getRequestIdentity(buildRequest({ headers: { "x-forwarded-for": "2001:0db8:0:0::1" } })), "ip:2001:db8::1");
});
test("Preview and production never share Redis counter keys", async () => {
  redisConfig(); const keys = [];
  globalThis.fetch = async (_url, init) => { keys.push(JSON.parse(init.body)[3]); return new Response(JSON.stringify({ result: [1, 100] })); };
  for (const env of ["preview", "production"]) { process.env.VERCEL_ENV = env; await checkRateLimit(buildRequest(), options); }
  assert.notEqual(keys[0], keys[1]);
});
test("local window expires without sliding on denied requests", async (t) => {
  t.mock.method(Date, "now", () => 1000);
  const single = { ...options, limit: 1, windowMs: 100 };
  assert.equal(await checkRateLimit(buildRequest(), single), null);
  Date.now.mock.mockImplementation(() => 1099);
  assert.equal((await checkRateLimit(buildRequest(), single)).status, 429);
  Date.now.mock.mockImplementation(() => 1100);
  assert.equal(await checkRateLimit(buildRequest(), single), null);
});
