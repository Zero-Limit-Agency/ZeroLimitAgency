import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
  getSupabaseUserFromAccessToken: auth.getSupabaseUserFromAccessToken,
  updateSupabasePassword: auth.updateSupabasePassword,
  NextResponse: { json: (body, init = {}) => Response.json(body, init) }
});

function isolatedAuth(t, handler = async () => Response.json({})) {
  const previous = { ...process.env }, originalFetch = globalThis.fetch;
  t.after(() => { process.env = previous; globalThis.fetch = originalFetch; });
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
