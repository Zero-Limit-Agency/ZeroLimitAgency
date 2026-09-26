import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { INTEGRATION_PROVIDERS, assertProviderScope } from "../../lib/integrations/registry.js";
import { createOAuthStateRecord, hashOAuthState, normalizeIntegrationReturnPath, buildIntegrationCallbackUrl } from "../../lib/integrations/oauth.js";
import { writeIntegrationCredentials } from "../../lib/integrations/connections.js";
import { canReconcileIntegration, reconcileIntegration, syncIntegration } from "../../lib/integrations/sync.js";

const migration = fs.readFileSync("supabase/migrations/20260926_integration_core_foundation.sql", "utf8");
const webhookDocs = fs.readFileSync("docs/development/integration-webhooks.md", "utf8");

test("registry is minimal, scoped and excludes Billing Stripe", () => {
  assert.deepEqual(Object.keys(INTEGRATION_PROVIDERS), ["discord", "google"]);
  assert.equal(assertProviderScope("google", "profile", ["drive.file"]), true);
  assert.equal(assertProviderScope("google", "space", []), false);
  assert.equal(INTEGRATION_PROVIDERS.google.syncDirection, "read");
});

test("OAuth state validates provider, is hashed and closes return paths", () => {
  const first = createOAuthStateRecord({ profileId: "profile-a", provider: "google", returnPath: "/espace/abc/settings" });
  assert.equal(first.record.state_hash, hashOAuthState(first.secret));
  for (const unsafe of ["https://evil.example", "//evil.example", "/espace/../owner", "/espace/%2e%2e/owner", "/espace\\evil"]) {
    assert.equal(normalizeIntegrationReturnPath(unsafe), "/identite");
  }
  assert.throws(() => createOAuthStateRecord({ profileId: "profile-a", provider: "unknown" }), /integration_state_invalid/);
  assert.equal(buildIntegrationCallbackUrl("google", { VERCEL_ENV: "preview", VERCEL_URL: "safe-preview.vercel.app" }), "https://safe-preview.vercel.app/api/integrations/google/callback");
  assert.throws(() => buildIntegrationCallbackUrl("google", { VERCEL_ENV: "preview", VERCEL_URL: "evil.example" }));
});

test("sync validates status, provider, owner scope and provider scopes before adapter", async () => {
  let called = false;
  const adapter = { sync(input) { called = true; return input.scopes; } };
  await assert.rejects(() => syncIntegration({ id: "x", provider: "discord", scope_type: "profile", status: "revoked", scopes: [] }, adapter), /integration_not_connected/);
  for (const connection of [
    { provider: "unknown", scope_type: "profile", scopes: [] },
    { provider: "discord", scope_type: "space", scopes: [] },
    { provider: "discord", scope_type: "profile", scopes: ["admin"] }
  ]) await assert.rejects(() => syncIntegration({ id: "x", status: "active", ...connection }, adapter), /integration_scope_mismatch/);
  assert.equal(called, false);
  const result = await syncIntegration({ id: "x", provider: "discord", scope_type: "profile", status: "active", scopes: ["identify"] }, adapter);
  assert.deepEqual(result, ["identify"]);
});

test("reconcile has an explicit repair-only status policy", async () => {
  const base = { id: "x", provider: "google", scope_type: "profile", scopes: ["drive.file"] };
  assert.equal(canReconcileIntegration({ ...base, status: "active" }), true);
  assert.equal(canReconcileIntegration({ ...base, status: "pending" }), false);
  assert.equal(canReconcileIntegration({ ...base, status: "revoked" }), false);
  assert.equal(canReconcileIntegration({ ...base, status: "expired" }, { purpose: "restore_provider_state" }), true);
  assert.equal(canReconcileIntegration({ ...base, status: "expired" }, {}), false);
  assert.equal(canReconcileIntegration({ ...base, status: "error", recoverable: true }, { purpose: "restore_provider_state" }), true);
  assert.equal(canReconcileIntegration({ ...base, status: "error", recoverable: false }, { purpose: "restore_provider_state" }), false);
  await assert.rejects(() => reconcileIntegration({ ...base, status: "pending" }, { reconcile() {} }), /integration_not_connected/);
});

test("credential storage runtime remains fail closed", async () => {
  await assert.rejects(() => writeIntegrationCredentials({ accessToken: "secret" }), /integration_credential_storage_disabled/);
  assert.doesNotMatch(fs.readFileSync("lib/integrations/connections.js", "utf8"), /integration_credentials.*method:\s*["']POST["']/s);
});

test("migration is replay-safe, explicit about grants and coherent credentials", () => {
  const executableStart = migration.replace(/^\s*--.*$/gm, "").trimStart();
  assert.ok(executableStart.startsWith("REVOKE CREATE ON SCHEMA public FROM PUBLIC;\n\ndo $$ begin\n"));
  assert.match(migration, /create table if not exists public\.integration_connections/);
  assert.match(migration, /incompatible column/);
  assert.match(migration, /incompatible constraint/);
  assert.match(migration, /incompatible index/);
  assert.match(migration, /errcode='42804'/);
  assert.match(migration, /from public,anon,authenticated/);
  assert.match(migration, /integration_credentials_lifecycle_check check\(\(revoked_at is null/);
  assert.doesNotMatch(migration, /integration_credentials_ciphertext_check check/);
  assert.match(migration, /if target\.status='revoked' then return/);
  assert.match(migration, /set search_path = pg_catalog, public/g);
});

test("fresh table definitions already match required preflight nullability", () => {
  const requiredFreshColumns = [
    ["integration_connections", /\bid uuid not null default gen_random_uuid\(\)/],
    ["integration_connections", /\bprovider text not null/],
    ["integration_connections", /\bscope_type text not null/],
    ["integration_connections", /\bexternal_account_id text not null/],
    ["integration_connections", /\bstatus text not null default 'pending'/],
    ["integration_connections", /\bscopes text\[\] not null default '\{\}'/],
    ["integration_credentials", /\bconnection_id uuid not null/],
    ["integration_credentials", /\bencryption_key_version text not null/],
    ["integration_oauth_states", /\bstate_hash text not null/],
    ["integration_oauth_states", /\bprofile_id uuid not null/],
    ["integration_oauth_states", /\bexpires_at timestamptz not null/],
    ["integration_webhook_events", /\bid uuid not null default gen_random_uuid\(\)/],
    ["integration_webhook_events", /\bprovider_event_id text not null/],
    ["integration_webhook_events", /\battempt_count integer not null default 1/]
  ];
  for (const [table, expected] of requiredFreshColumns) {
    const body = migration.match(new RegExp(`create table if not exists public\\.${table} \\(([\\s\\S]*?)\\n\\);`))?.[1];
    assert.ok(body, `missing fresh CREATE TABLE body for ${table}`);
    assert.match(body, expected, `${table} fresh shape must satisfy its own preflight`);
  }
  assert.match(migration, /null values prevent required column hardening/);
  assert.match(migration, /alter column %I set not null/);
  assert.match(migration, /incompatible column default/);
});

test("safe reads omit credentials and webhook schema is explicitly preparatory", () => {
  const readSignature = migration.match(/create or replace function public\.get_my_integration_connections\(\)[\s\S]*?language sql/)[0];
  assert.doesNotMatch(readSignature, /token|external_account_id|ciphertext/i);
  for (const absent of ["no endpoint", "signature runtime", "claim", "retry", "stale reclaim", "worker"]) assert.match(webhookDocs.toLowerCase(), new RegExp(absent));
  assert.doesNotMatch(migration, /raw_payload|payload json|payload jsonb/i);
});
