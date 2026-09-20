import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { BILLING_PLANS, assertBillingPlanTarget, getBillingPlan } from "../../lib/billing/catalog.js";
import { subscriptionGrantsAccess } from "../../lib/billing/status.js";
import { verifyStripeSignature } from "../../lib/billing/stripe-signature.js";

const migration = await readFile(new URL("../../supabase/migrations/20260924_billing_subscription_foundation.sql", import.meta.url), "utf8");
const route = await readFile(new URL("../../app/api/billing/stripe/webhook/route.js", import.meta.url), "utf8");
const webhook = await readFile(new URL("../../lib/billing/stripe-webhook.js", import.meta.url), "utf8");
const webhookRoute = await readFile(new URL("../../app/api/billing/stripe/webhook/route.js", import.meta.url), "utf8");

test("catalog keys are unique and targets are unambiguous", () => {
  assert.equal(new Set(BILLING_PLANS.map(({ key }) => key)).size, BILLING_PLANS.length);
  assert.equal(assertBillingPlanTarget(getBillingPlan("personal_coach"), { kind: "personal", personalProfession: "coach" }), true);
  assert.equal(assertBillingPlanTarget(getBillingPlan("personal_coach"), { kind: "personal", personalProfession: "ceo" }), false);
  assert.equal(assertBillingPlanTarget(getBillingPlan("creator"), { kind: "creator" }), true);
});

test("access policy keeps paid cancellation periods and is conservative otherwise", () => {
  const now = new Date("2026-09-20T12:00:00Z");
  assert.equal(subscriptionGrantsAccess({ status: "trialing", currentPeriodEnd: "2026-10-01T00:00:00Z" }, now), true);
  assert.equal(subscriptionGrantsAccess({ status: "active", currentPeriodEnd: "2026-10-01T00:00:00Z", cancelAtPeriodEnd: true }, now), true);
  assert.equal(subscriptionGrantsAccess({ status: "canceled", currentPeriodEnd: "2026-10-01T00:00:00Z" }, now), true);
  for (const status of ["incomplete", "past_due", "unpaid", "paused"]) assert.equal(subscriptionGrantsAccess({ status }, now), false);
  assert.equal(subscriptionGrantsAccess({ status: "canceled", currentPeriodEnd: "2026-09-01T00:00:00Z" }, now), false);
});

test("Stripe signatures require the raw body, v1 HMAC and a fresh timestamp", () => {
  const raw = JSON.stringify({ id: "evt_test" });
  const secret = "whsec_test";
  const timestamp = 1_800_000_000;
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  assert.equal(verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret, { now: timestamp * 1000 }), true);
  assert.equal(verifyStripeSignature(`${raw} `, `t=${timestamp},v1=${signature}`, secret, { now: timestamp * 1000 }), false);
  assert.equal(verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret, { now: (timestamp + 301) * 1000 }), false);
});

test("billing schema enforces payer scope, provider uniqueness and server-only access", () => {
  assert.match(migration, /num_nonnulls\(profile_id,organization_id\)=1/);
  assert.match(migration, /unique\(provider,provider_customer_id\)/);
  assert.match(migration, /unique\(provider,provider_subscription_id\)/);
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /revoke all on public\.billing_accounts,public\.billing_subscriptions,public\.billing_webhook_events from public,anon,authenticated/);
  assert.doesNotMatch(migration, /create policy .*billing_/i);
});

test("subscription sync scopes Team to its Organization and preserves other origins", () => {
  assert.match(migration, /target\.kind='team'[\s\S]*target\.organization_id,'subscription'/);
  assert.match(migration, /target\.kind='personal'[\s\S]*'personal_access'/);
  assert.match(migration, /target\.kind='creator'[\s\S]*'creator_access'/);
  assert.match(migration, /on conflict\(billing_subscription_id,key\)/);
  assert.doesNotMatch(migration, /delete from public\.zero_limit_entitlements/);
  assert.doesNotMatch(migration, /update public\.spaces set status/);
});

test("webhook processing is idempotent and rejects out-of-order mutation", () => {
  assert.match(migration, /unique\(provider,provider_event_id\)/);
  assert.match(migration, /on conflict\(provider,provider_event_id\) do nothing/);
  assert.match(migration, /provider_snapshot_at_value<sub\.provider_updated_at/);
  assert.match(migration, /jsonb_build_object\('duplicate',true/);
  assert.match(route, /await request\.text\(\)/);
  assert.match(route, /verifyStripeSignature/);
  assert.match(webhook, /customer\.subscription\.created/);
  assert.match(webhook, /invoice\.payment_failed/);
});

test("new Spaces are resource-only and provisioned only after valid billing", () => {
  assert.match(migration, /target_space_id uuid references public\.spaces/);
  assert.match(migration, /if sub\.target_space_id is null then[\s\S]*if not grants_access then return;[\s\S]*ensure_billing_subscription_space/);
  const ensure = migration.match(/create or replace function public\.ensure_billing_subscription_space[\s\S]*?end \$\$;/)?.[0] || "";
  assert.match(ensure, /on conflict\(owner_profile_id,personal_profession\)/);
  assert.match(ensure, /on conflict\(owner_profile_id\) where kind='creator'/);
  assert.match(ensure, /on conflict\(organization_id\) where kind='team'/);
  assert.doesNotMatch(ensure, /zero_limit_entitlements/);
});

test("failed events persist safely and can be reclaimed", () => {
  assert.match(migration, /begin[\s\S]*exception when others then[\s\S]*status='failed'/);
  assert.match(migration, /error_code=safe_error/);
  assert.match(migration, /attempt_count=attempt_count\+1/);
  assert.match(migration, /interval '5 minutes'/);
  assert.match(migration, /inbox\.status in \('processed','ignored'\)/);
  assert.match(webhook, /record_billing_webhook_failure/);
});

test("event ordering uses a provider-authoritative retrieval, never event IDs", () => {
  assert.match(webhook, /retrieveStripeSubscription/);
  assert.match(webhook, /priceMap\[priceId\]/);
  assert.doesNotMatch(webhook, /metadata\?\.plan_key/);
  assert.doesNotMatch(migration, /provider_event_id_value\s*[<>]/);
  assert.match(migration, /provider_snapshot_at_value<sub\.provider_updated_at/);
});

test("migration accepts compatible partial application and inspects legacy indexes", () => {
  assert.match(migration, /create table if not exists public\.billing_accounts/);
  assert.match(migration, /add column if not exists billing_subscription_id/);
  assert.match(migration, /pg_get_indexdef/);
  assert.match(migration, /incompatible legacy index/);
  assert.doesNotMatch(migration, /drop index public\.zero_limit_entitlements_(?:profile|space|organization)_key_unique;/);
});

test("migration repairs missing constraints and fails closed on incompatible invariants", () => {
  assert.doesNotMatch(migration, /create\s+(?:temporary|temp)\s+table/i);
  assert.doesNotMatch(migration, /pg_temp\./i);
  assert.match(migration, /pg_get_constraintdef/);
  assert.match(migration, /actual_norm:=regexp_replace/);
  assert.match(migration, /if actual is null then execute item\.add_sql/);
  assert.match(migration, /incompatible billing constraint/);
  for (const name of ["billing_accounts_exactly_one_owner", "billing_accounts_profile_id_fkey", "billing_subscriptions_billing_account_id_fkey", "billing_subscriptions_target_space_id_fkey", "billing_webhook_events_provider_provider_event_id_key"]) assert.match(migration, new RegExp(name));
});

test("constraint preflight never materializes a temporary FK to permanent tables", () => {
  assert.doesNotMatch(migration, /temporary[\s\S]{0,500}foreign key/i);
  assert.doesNotMatch(migration, /temp[\s\S]{0,500}references public\./i);
  assert.match(migration, /foreignkeyprofile_idreferencesprofilesidondeleterestrict/);
  assert.match(migration, /foreignkeybilling_subscription_idreferencesbilling_subscriptionsidondeleterestrict/);
});

test("every named Billing and entitlement index is definition and validity checked", () => {
  for (const name of ["billing_accounts_profile_provider_unique", "billing_accounts_organization_provider_unique", "billing_subscriptions_account_idx", "billing_subscriptions_space_idx", "billing_webhook_events_failures_idx", "zero_limit_entitlements_subscription_key_unique"]) assert.match(migration, new RegExp(name));
  assert.match(migration, /relation_kind not in \('i','I'\)/);
  assert.match(migration, /not coalesce\(valid,false\)/);
  assert.doesNotMatch(migration, /create (?:unique )?index if not exists (?:billing_|zero_limit_entitlements_)/);
});

test("webhook HTTP policy acknowledges terminal results and retries transient work", () => {
  assert.match(webhookRoute, /result\?\.processing \|\| \(result\?\.failed && !result\?\.permanent\)/);
  assert.match(webhookRoute, /\{ status: 503 \}/);
  assert.match(webhookRoute, /received: true/);
  assert.match(webhook, /\["billing_scope_mismatch", "billing_constraint_failed"\]/);
  assert.match(webhook, /error\.code === "invalid_plan"/);
  assert.match(webhook, /record_billing_webhook_failure/);
});

test("invalid signatures never reach inbox and Billing never restores Space lifecycle", () => {
  assert.ok(webhookRoute.indexOf("verifyStripeSignature(rawBody") < webhookRoute.indexOf("processStripeEvent(event"));
  assert.doesNotMatch(migration, /update public\.spaces set status/);
});

test("billing stays server-side and legacy client domains stay isolated", () => {
  for (const source of [migration, route, webhook]) {
    assert.doesNotMatch(source, /NEXT_PUBLIC_STRIPE/);
    assert.doesNotMatch(source, /public\.(applications|client_access)/);
  }
  assert.doesNotMatch(route, /STRIPE_SECRET_KEY/);
});
