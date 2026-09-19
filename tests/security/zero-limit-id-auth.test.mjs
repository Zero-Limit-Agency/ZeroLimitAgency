import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateDisplayName, validateIntent, validateLocale, validateUsername } from "../../lib/zero-limit-id/validation.js";
import { privateDestination } from "../../lib/zero-limit-id/redirects.js";
import { profileAccessError } from "../../lib/zero-limit-id/profile-errors.js";

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
  assert.match(fs.readFileSync("app/identite/onboarding/page.js", "utf8"), /redirect\("\/identite\/connexion"\)/);
  assert.match(fs.readFileSync("app/api/auth/logout/route.js", "utf8"), /revokeSupabaseSession/);
  assert.match(fs.readFileSync("app/api/auth/logout/route.js", "utf8"), /clearClientAuthCookies/);
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
