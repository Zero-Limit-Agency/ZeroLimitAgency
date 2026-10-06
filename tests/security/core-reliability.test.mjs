import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { requestCoreJson } from "../../lib/http/core-request.js";
import { normalizeAccessibleSpaces, normalizeArchivedOwnedSpaces } from "../../lib/zero-limit-id/space-model.js";
import { sendZeroLimitEmail } from "../../lib/emails/zero-limit.js";

const originalFetch = globalThis.fetch;
const emailEnv = Object.fromEntries(["RESEND_API_KEY", "EMAIL_RETRY_ATTEMPTS", "EMAIL_RETRY_BASE_DELAY_MS"].map(key => [key, process.env[key]]));
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(emailEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("Core mutations reject HTTP failures, explicit failure and malformed acknowledgements", async () => {
  for (const response of [json({ success: false, code: "owner_protected" }, 403), json({ success: false }), json({}), new Response("<html>proxy failure</html>"), new Response(null, { status: 204 })]) {
    globalThis.fetch = async () => response;
    await assert.rejects(requestCoreJson("/api/core", { method: "POST" }));
  }
  globalThis.fetch = async () => json({ success: true, spaceId: "a" });
  assert.equal((await requestCoreJson("/api/core")).spaceId, "a");
});

test("Core mutation transport failures are not retried and preserve provider/domain errors", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new TypeError("Failed to fetch"); };
  await assert.rejects(requestCoreJson("/api/core"), /Failed to fetch/);
  assert.equal(calls, 1);
  globalThis.fetch = async () => json({ success: false, code: "email_delivery_failed", mutationApplied: true }, 502);
  await assert.rejects(requestCoreJson("/api/core"), error => error.result.code === "email_delivery_failed" && error.result.mutationApplied);
});

const email = { from: "sender@example.test", to: "recipient@example.test", subject: "Core QA", text: "Core QA" };
function configureEmail() {
  process.env.RESEND_API_KEY = "re_fixture";
  process.env.EMAIL_RETRY_ATTEMPTS = "3";
  process.env.EMAIL_RETRY_BASE_DELAY_MS = "100";
}

test("Resend resolved validation/auth errors never report success or retry", async () => {
  configureEmail();
  for (const status of [401, 403, 422]) {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return json({ name: "validation_error", message: "Provider rejected email" }, status); };
    const result = await sendZeroLimitEmail(email);
    assert.equal(result.ok, false); assert.equal(result.skipped, false);
    assert.match(result.error, /Provider rejected email/); assert.equal(result.transient, false);
    assert.equal(calls, 1);
  }
});

test("Resend transient resolved errors retry with one idempotency key and a confirmed email ID", async () => {
  configureEmail();
  for (const status of [429, 500]) {
    const keys = [];
    globalThis.fetch = async (_url, options) => {
      keys.push(new Headers(options.headers).get("Idempotency-Key"));
      return keys.length === 1 ? json({ name: "rate_limit_exceeded", message: "Temporary failure" }, status) : json({ id: "email-confirmed" });
    };
    const result = await sendZeroLimitEmail(email);
    assert.equal(result.ok, true); assert.equal(result.attempt, 2);
    assert.ok(keys[0]); assert.equal(keys[0], keys[1]);
  }
});

test("Resend exhausted provider errors and thrown transport failures stay failures", async () => {
  configureEmail();
  for (const fail of [() => json({ name: "application_error", message: "Service unavailable" }, 503), () => { throw new TypeError("fetch failed"); }]) {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return fail(); };
    const result = await sendZeroLimitEmail(email);
    assert.equal(result.ok, false); assert.equal(result.transient, true); assert.equal(calls, 3);
  }
});

test("Resend missing configuration or missing email ID cannot succeed", async () => {
  delete process.env.RESEND_API_KEY;
  globalThis.fetch = async () => { throw new Error("Must not call provider"); };
  assert.equal((await sendZeroLimitEmail(email)).skipped, true);
  configureEmail(); process.env.EMAIL_RETRY_ATTEMPTS = "not-a-number";
  globalThis.fetch = async () => json({});
  const result = await sendZeroLimitEmail(email);
  assert.equal(result.ok, false); assert.match(result.error, /no email ID/);
});

test("archived recovery lists only canonical owners, independently of active entitlement", () => {
  const data = {
    profile: { id: "owner" },
    ownedSpaces: [
      { id: "personal", kind: "personal", name: "Personal", status: "archived", owner_profile_id: "owner" },
      { id: "creator", kind: "creator", name: "Creator", status: "archived", owner_profile_id: "owner" },
      { id: "foreign", kind: "creator", name: "Foreign", status: "archived", owner_profile_id: "other" },
      { id: "suspended", kind: "creator", name: "Suspended", status: "suspended", owner_profile_id: "owner" }
    ],
    memberships: [{ organization_id: "owned", role: "member" }, { organization_id: "admin", role: "admin" }],
    organizations: [{ id: "owned", name: "Owned Team", owner_profile_id: "owner" }, { id: "admin", name: "Admin Team", owner_profile_id: "other" }],
    teamSpaces: [{ id: "team", kind: "team", status: "archived", organization_id: "owned" }, { id: "admin-team", kind: "team", status: "archived", organization_id: "admin" }],
    entitlements: []
  };
  assert.deepEqual(normalizeArchivedOwnedSpaces(data).map(s => s.id).sort(), ["creator", "personal", "team"]);
  assert.deepEqual(normalizeAccessibleSpaces(data), []);
  assert.deepEqual(normalizeArchivedOwnedSpaces({ ...data, memberships: [] }).map(s => s.id).sort(), ["creator", "personal"]);
});

test("settings recovery uses its own authorized RPC without requiring active module access", async () => {
  const source = await readFile("app/espace/[spaceId]/settings/page.js", "utf8");
  assert.match(source, /Promise\.all\(\[getAccessibleSpacesForCurrentProfile\(\), getWorkspaceSettings\(params.spaceId\)\]\)/);
  assert.match(source, /if \(context\.spaces\.some[\s\S]*getAccessibleModulesForCurrentProfile/);
});

// Exercise route response contracts without a deployed database or real email.
// Only imports are substituted; the POST handlers run unchanged.
let moduleId = 0;
async function loadRoute(path, fixtures) {
  const source = (await readFile(path, "utf8")).replace(/import[\s\S]*?from "[^"]+";\n/g, "");
  globalThis.coreRouteFixtures = {
    NextResponse: { json: (body, init = {}) => json(body, init.status || 200) },
    checkRateLimit: async () => null,
    buildAbsoluteUrl: path => `https://core.example${path}`,
    canReturnPreviewInvitationToken: () => false,
    ProvisioningError: class extends Error {}, TeamManagementError: class extends Error {},
    ...fixtures
  };
  const bindings = Object.keys(globalThis.coreRouteFixtures).join(", ");
  return import(`data:text/javascript;base64,${Buffer.from(`const { ${bindings} } = globalThis.coreRouteFixtures;\n${source}`).toString("base64")}#${moduleId++}`);
}
function post(body) { return new Request("https://core.example/api/core", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }

test("Team invitation creation and resend report persisted-but-failed delivery explicitly", async () => {
  for (const [path, body, fixtures] of [
    ["app/api/team/invitations/route.js", { organizationId: "org", email: "invite@example.test", role: "member" }, { createTeamInvitation: async () => ({ token: "private-token" }) }],
    ["app/api/team/management/route.js", { action: "resendInvitation", organizationId: "org", invitationId: "inv" }, { resendTeamInvitation: async () => ({ token: "private-token", email: "invite@example.test" }), leaveTeam() {}, removeTeamMember() {}, revokeTeamInvitation() {}, updateTeamMemberRole() {} }]
  ]) {
    for (const delivery of [{ ok: true }, { ok: false, skipped: true }, { ok: false, skipped: false, error: "PRIVATE PROVIDER DETAILS" }]) {
      const route = await loadRoute(path, { ...fixtures, sendZeroLimitEmail: async () => delivery });
      const response = await route.POST(post(body));
      const result = await response.json();
      assert.equal(response.status, delivery.ok ? 200 : 502);
      assert.equal(result.success, delivery.ok);
      assert.equal(result.delivery, delivery.ok ? "sent" : "failed");
      if (!delivery.ok) { assert.equal(result.code, "email_delivery_failed"); assert.equal(result.mutationApplied, true); }
      assert.equal(result.previewUrl, undefined);
      assert.doesNotMatch(JSON.stringify(result), /private-token|PRIVATE PROVIDER DETAILS/);
    }
  }
});

test("password recovery surfaces provider rejection and transport errors without leaking account details", async () => {
  for (const outcome of [() => ({ ok: true }), () => ({ ok: false, data: { message: "private detail" } }), () => { throw new Error("private detail"); }]) {
    const route = await loadRoute("app/api/id/forgot-password/route.js", {
      buildAuthRedirectUrl: () => "https://core.example/nouveau-mot-de-passe",
      createSupabaseAdminClient: () => ({ auth: { sendPasswordRecovery: outcome } })
    });
    const response = await route.POST(post({ email: "account@example.test" }));
    const result = await response.json();
    assert.equal(result.success, response.status === 200);
    assert.ok([200, 503].includes(response.status));
    assert.doesNotMatch(JSON.stringify(result), /private detail|account@example/);
  }
  delete globalThis.coreRouteFixtures;
});

test("legacy exposed password recovery also rejects a resolved provider failure", async () => {
  const route = await loadRoute("app/api/auth/forgot-password/route.js", {
    isValidEmailAddress: () => true, normalizeEmailAddress: value => value,
    buildAuthRedirectUrl: () => "https://core.example/connexion/definir-mot-de-passe",
    createSupabaseAdminClient: () => ({ auth: { sendPasswordRecovery: async () => ({ ok: false }) } })
  });
  const response = await route.POST(post({ email: "account@example.test" }));
  assert.equal(response.status, 500); assert.equal((await response.json()).success, false);
  delete globalThis.coreRouteFixtures;
});

test("intake email delivery distinguishes skipped or rejected emails from accepted sends", async () => {
  const source = await readFile("app/api/contact/route.js", "utf8");
  const definition = source.match(/function summarizeEmailFailure[\s\S]*?\n}/)[0];
  const { summarizeEmailFailure } = await import(`data:text/javascript;base64,${Buffer.from(`export ${definition}`).toString("base64")}`);
  assert.equal(summarizeEmailFailure({ ok: true }, "confirmation"), null);
  for (const result of [{ ok: false, skipped: true, error: "Missing configuration" }, { ok: false, skipped: false, error: "Provider rejected" }]) {
    const failure = summarizeEmailFailure(result, "confirmation");
    assert.equal(failure.target, "confirmation"); assert.equal(failure.reason, result.error);
  }
});
