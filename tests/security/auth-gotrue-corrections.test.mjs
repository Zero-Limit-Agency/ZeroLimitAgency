import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { checkRateLimit, resetRateLimitForTests } from "../../lib/security/rate-limit.js";

// Same import-substitution approach as core-reliability.test.mjs: the real
// functions/handler run unchanged; only framework imports and unused services
// are supplied locally. HTTP requests are captured, never sent to Supabase.
let moduleId = 0;
async function loadSource(path, fixtures = {}) {
  const source = (await readFile(path, "utf8")).replace(/\bimport(?:\s+[\s\S]*?from\s+)?\s*["'][^"']+["'];\s*/g, "");
  const fixtureKey = `authCorrectionsFixture${moduleId++}`;
  globalThis[fixtureKey] = fixtures;
  try {
    const bindings = Object.keys(fixtures).join(", ");
    return await import(`data:text/javascript;base64,${Buffer.from(`const { ${bindings} } = globalThis.${fixtureKey};\n${source}`).toString("base64")}`);
  } finally { delete globalThis[fixtureKey]; }
}
const server = await loadSource("lib/supabase/server.js");
const auth = await loadSource("lib/auth/client-auth.js", {
  getSupabaseServerConfig: server.getSupabaseServerConfig,
  cookies: () => assert.fail("these public bearer flows do not require session cookies")
});
const admin = await loadSource("lib/supabase/admin.js", { supabaseServerRequest: server.supabaseServerRequest });
const route = await loadSource("app/api/id/update-password/route.js", {
  checkRateLimit,
  getSupabaseUserFromAccessToken: auth.getSupabaseUserFromAccessToken,
  updateSupabasePassword: auth.updateSupabasePassword,
  NextResponse: { json: (body, init = {}) => Response.json(body, init) }
});

function isolatedAuth(t, handler = async () => Response.json({})) {
  const previous = { ...process.env }, originalFetch = globalThis.fetch;
  t.after(() => { process.env = previous; globalThis.fetch = originalFetch; });
  resetRateLimitForTests();
  process.env.VERCEL_ENV = "development";
  process.env.RATE_LIMIT_PROVIDER = "local";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fixture-anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture-service";
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const call = { url: new URL(url), ...init, body: JSON.parse(init.body || "null") };
    calls.push(call);
    return handler(call);
  };
  return calls;
}
function passwordRequest(accessToken) {
  return new Request("https://app.example/api/id/update-password", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, password: "fixture-new-password", userId: "untrusted-body-user" })
  });
}

test("signup sends the complete confirmation redirect in the GoTrue query", async (t) => {
  const calls = isolatedAuth(t);
  const redirect = "https://preview.example/confirmation?next=%2Finvitation%2Fteam%2Ffixture&source=email";
  await auth.signUpWithPassword({ email: "member@example.test", password: "fixture-password", emailRedirectTo: redirect });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, "/auth/v1/signup");
  assert.equal(calls[0].url.searchParams.get("redirect_to"), redirect);
  assert.deepEqual(calls[0].body, { email: "member@example.test", password: "fixture-password", data: {} });
  assert.equal(calls[0].headers.Authorization, "Bearer fixture-anon");
});

test("recovery sends its redirect in the query, with no redirect headers or body fields", async (t) => {
  const calls = isolatedAuth(t);
  const redirect = "https://preview.example/nouveau-mot-de-passe?next=%2Fidentite&source=email";
  await admin.createSupabaseAdminClient().auth.sendPasswordRecovery("member@example.test", redirect);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, "/auth/v1/recover");
  assert.equal(calls[0].url.searchParams.get("redirect_to"), redirect);
  assert.equal(calls[0].body.email, "member@example.test");
  assert.equal(calls[0].body.redirect_to, undefined);
  assert.equal(calls[0].headers.redirectTo, undefined);
  assert.equal(calls[0].headers.redirect_to, undefined);
  assert.equal(calls[0].headers.Authorization, "Bearer fixture-anon");
});

test("recovery without an optional redirect still uses the default GoTrue endpoint", async (t) => {
  const calls = isolatedAuth(t);
  await admin.createSupabaseAdminClient().auth.sendPasswordRecovery("member@example.test");
  assert.equal(calls[0].url.search, "");
});

test("password update rejects missing and empty tokens before any Auth request", async (t) => {
  const calls = isolatedAuth(t);
  for (const token of [undefined, null, ""]) {
    assert.equal((await route.POST(passwordRequest(token))).status, 400);
  }
  assert.equal(calls.length, 0);
});

test("password update rejects an invalid token even when the request includes a user ID", async (t) => {
  const calls = isolatedAuth(t, async () => Response.json({ message: "Invalid token" }, { status: 401 }));
  assert.equal((await route.POST(passwordRequest("invalid-bearer"))).status, 400);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
});

test("password update requires a canonical authenticated user, not just an HTTP 200", async (t) => {
  const calls = isolatedAuth(t);
  assert.equal((await route.POST(passwordRequest("unidentified-bearer"))).status, 400);
  assert.equal(calls.length, 1);
});

test("password update uses the verified user's bearer authority and reports upstream failure", async (t) => {
  let upstreamStatus;
  const calls = isolatedAuth(t, async (call) => call.method === "GET"
    ? Response.json({ id: "authenticated-user" })
    : Response.json(upstreamStatus === 200 ? { id: "authenticated-user" } : { message: "Rejected" }, { status: upstreamStatus }));
  for (const status of [200, 401]) {
    upstreamStatus = status;
    calls.length = 0;
    const response = await route.POST(passwordRequest("verified-bearer"));
    assert.equal(response.status, status === 200 ? 200 : 400);
    assert.equal((await response.json()).success, status === 200);
    assert.deepEqual(calls.map(c => c.method), ["GET", "PUT"]);
    for (const call of calls) {
      assert.equal(call.url.pathname, "/auth/v1/user");
      assert.equal(call.headers.Authorization, "Bearer verified-bearer");
    }
    assert.deepEqual(calls[1].body, { password: "fixture-new-password" });
  }
});


test("password update quota prevents further Auth calls, including with rotating bearer tokens", async (t) => {
  const calls = isolatedAuth(t, async () => Response.json({ id: "authenticated-user" }));
  for (let i = 0; i < 5; i++) assert.equal((await route.POST(passwordRequest(`bearer-${i}`))).status, 200);
  assert.equal(calls.length, 10);
  assert.equal((await route.POST(passwordRequest("another-bearer"))).status, 429);
  assert.equal(calls.length, 10);
});

test("password update stops before Auth when production Redis is absent", async (t) => {
  const calls = isolatedAuth(t);
  process.env.VERCEL_ENV = "production";
  delete process.env.RATE_LIMIT_REDIS_URL;
  delete process.env.RATE_LIMIT_REDIS_TOKEN;
  assert.equal((await route.POST(passwordRequest("bearer"))).status, 503);
  assert.equal(calls.length, 0);
});


test("password update with healthy production Redis retains the normal Auth flow", async (t) => {
  const calls = isolatedAuth(t, async () => Response.json({ id: "authenticated-user" }));
  process.env.VERCEL_ENV = "production";
  process.env.RATE_LIMIT_REDIS_URL = "https://redis.example.test";
  process.env.RATE_LIMIT_REDIS_TOKEN = "fixture-token";
  const authFetch = globalThis.fetch;
  let quotaChecks = 0;
  globalThis.fetch = async (url, init) => {
    if (url === process.env.RATE_LIMIT_REDIS_URL) {
      quotaChecks++;
      return Response.json({ result: [1, 60000] });
    }
    return authFetch(url, init);
  };
  assert.equal((await route.POST(passwordRequest("verified-bearer"))).status, 200);
  assert.equal(quotaChecks, 1);
  assert.deepEqual(calls.map(c => c.method), ["GET", "PUT"]);
  for (const call of calls) assert.equal(call.headers.Authorization, "Bearer verified-bearer");
});
