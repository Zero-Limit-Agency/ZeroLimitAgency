import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateDisplayName, validateIntent, validateLocale, validateUsername } from "../../lib/zero-limit-id/validation.js";
import { privateDestination } from "../../lib/zero-limit-id/redirects.js";
import { profileAccessError } from "../../lib/zero-limit-id/profile-errors.js";
import { bindImportedSession } from "../../lib/auth/session-import.js";
import { hasTrustedMutationOrigin } from "../../lib/security/csrf-origin.js";

test("username, display name, locale and intent are validated server-side", () => {
  assert.equal(validateUsername(" Valid.Name ").value, "valid.name");
  assert.equal(validateUsername("no").ok, false);
  assert.equal(validateUsername("UPPER").value, "upper");
  assert.equal(validateDisplayName("  Ada   Lovelace ").value, "Ada Lovelace");
  assert.equal(validateDisplayName("").ok, false);
  assert.equal(validateLocale("fr").ok, true); assert.equal(validateLocale("de").ok, false);
  assert.equal(validateIntent("team").ok, true); assert.equal(validateIntent("owner").ok, false);
});

test("onboarding state controls the private destination explicitly", () => {
  assert.equal(privateDestination({ onboarding_completed_at: null }), "/identite/onboarding");
  assert.equal(privateDestination({ onboarding_completed_at: "2026-08-27T00:00:00Z" }), "/identite");
});

test("profile creation is caller-derived, idempotent, and independent from legacy applications", () => {
  const source = fs.readFileSync("lib/zero-limit-id/profile.js", "utf8");
  assert.match(source, /session\?\.user\?\.id/);
  assert.match(source, /auth_user_id: userId/);
  assert.match(source, /recovered/);
  assert.doesNotMatch(source, /applications|client_access/);
  assert.doesNotMatch(fs.readFileSync("app/api/id/onboarding/route.js", "utf8"), /body\.auth_user_id/);
});

test("private pages reject missing sessions and logout revokes upstream session", () => {
  assert.match(fs.readFileSync("app/identite/page.js", "utf8"), /AuthenticationRequiredError/);
  assert.match(fs.readFileSync("app/identite/onboarding/page.js", "utf8"), /redirect\("\/connexion"\)/);
  assert.match(fs.readFileSync("app/api/auth/logout/route.js", "utf8"), /revokeSupabaseSession/);
  assert.match(fs.readFileSync("app/api/auth/logout/route.js", "utf8"), /clearClientAuthCookies/);
});

test("confirmation binds and rotates the access and refresh token pair before setting cookies", () => {
  const auth = fs.readFileSync("lib/auth/client-auth.js", "utf8");
  const binding = fs.readFileSync("lib/auth/session-import.js", "utf8");
  const route = fs.readFileSync("app/api/id/session/route.js", "utf8");
  assert.match(auth, /validateImportedClientSession/);
  assert.match(binding, /refreshedUserResult\.data\?\.id !== accessUserResult\.data\.id/);
  assert.match(route, /validateImportedClientSession\(accessToken, refreshToken\)/);
  assert.match(route, /setClientAuthCookies\(response, session\)/);
  assert.doesNotMatch(route, /setClientAuthCookies\(response, \{ access_token: accessToken/);
});

test("an access token for user A and refresh token for user B are rejected", async () => {
  const result = await bindImportedSession("access-a", "refresh-b", {
    getUserFromAccessToken: async (token) => ({
      ok: true,
      data: { id: token === "access-a" ? "user-a" : "user-b" }
    }),
    refreshSession: async () => ({
      ok: true,
      data: { access_token: "rotated-access-b", refresh_token: "rotated-refresh-b" }
    })
  });
  assert.equal(result, null);
});

test("CSRF origins come from deployment configuration, never the request Host", () => {
  const production = { NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://zero.example" };
  assert.equal(hasTrustedMutationOrigin({}, production), false);
  assert.equal(hasTrustedMutationOrigin({ origin: "https://evil.example" }, production), false);
  assert.equal(hasTrustedMutationOrigin({ origin: "https://zero.example" }, production), true);
  assert.equal(hasTrustedMutationOrigin({ referer: "https://zero.example/form" }, production), true);
  assert.equal(hasTrustedMutationOrigin({ origin: "https://attacker.vercel.app" }, production), false);
  assert.equal(hasTrustedMutationOrigin(
    { origin: "https://z0agency-git-security-team.vercel.app" },
    { NODE_ENV: "production", VERCEL_URL: "z0agency-git-security-team.vercel.app" }
  ), true);
});

test("public application intake cannot create or confirm an Auth identity", () => {
  const contact = fs.readFileSync("app/api/contact/route.js", "utf8");
  const activation = fs.readFileSync("lib/auth/client-activation.js", "utf8");
  assert.doesNotMatch(contact, /auth\.admin\.createUser|email_confirm/);
  assert.doesNotMatch(activation, /password:\s*buildRandomPassword|Math\.random/);
  assert.match(activation, /sendPasswordRecovery/);
});

test("a Preview missing onboarding columns gets a precise server-only diagnostic", () => {
  const missingColumn = profileAccessError({
    status: 400,
    data: { code: "42703", message: "column profiles.onboarding_completed_at does not exist" }
  }, "lookup");
  assert.equal(missingColumn.category, "onboarding_schema_missing");
  assert.equal(missingColumn.status, 400);
  assert.equal(missingColumn.cause, "lookup");
});

test("profile privileges required by RLS are explicit in the corrective migration", () => {
  const migration = fs.readFileSync("supabase/migrations/20260828_zero_limit_id_profile_access.sql", "utf8");
  assert.match(migration, /grant select, insert on public\.profiles to authenticated/);
  assert.match(migration, /onboarding_completed_at/);
  assert.doesNotMatch(migration, /service_role/);
});
