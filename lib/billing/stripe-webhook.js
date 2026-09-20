import "server-only";
import crypto from "node:crypto";
import { getBillingPlan } from "./catalog.js";
import { BillingError } from "./errors.js";
import { SUBSCRIPTION_STATUSES } from "./status.js";
import { supabaseServerRequest } from "@/lib/supabase/server";

export const SUPPORTED_STRIPE_EVENTS = new Set([
  "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
  "invoice.paid", "invoice.payment_failed"
]);

function isoFromSeconds(value) { return Number.isFinite(value) ? new Date(value * 1000).toISOString() : null; }

export async function retrieveStripeSubscription(subscriptionId, secretKey, fetchImpl = fetch) {
  if (!/^sub_[A-Za-z0-9_]+$/.test(subscriptionId || "")) throw new BillingError("provider_unavailable", 400);
  const response = await fetchImpl(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` }, cache: "no-store"
  });
  if (!response.ok) throw new BillingError("provider_unavailable", 503);
  return response.json();
}

export function normalizeStripeSubscriptionEvent(event, providerSubscription, priceMap = {}, retrievedAt = new Date()) {
  if (!event?.id || !event?.type || !providerSubscription?.id) throw new BillingError("provider_unavailable", 400);
  if (!event.type.startsWith("customer.subscription.")) return null;
  const priceId = providerSubscription.items?.data?.[0]?.price?.id;
  // Price mapping is the only source of plan identity. Payload metadata cannot choose a plan, entitlement or profession.
  const planKey = priceMap[priceId];
  const plan = getBillingPlan(planKey);
  if (!plan || !priceId) throw new BillingError("invalid_plan", 400);
  if (!SUBSCRIPTION_STATUSES.includes(providerSubscription.status)) throw new BillingError("provider_unavailable", 400);
  return {
    providerEventId: event.id, eventType: event.type, providerCreatedAt: isoFromSeconds(event.created),
    providerSnapshotAt: retrievedAt.toISOString(), objectId: providerSubscription.id, payloadHash: null,
    billingAccountId: providerSubscription.metadata?.billing_account_id || null,
    targetSpaceId: providerSubscription.metadata?.space_id || null,
    targetKind: plan.spaceKind, personalProfession: plan.personalProfession || null,
    providerCustomerId: typeof providerSubscription.customer === "string" ? providerSubscription.customer : providerSubscription.customer?.id,
    planKey, entitlementKey: plan.entitlementKey, status: providerSubscription.status,
    quantity: providerSubscription.items?.data?.[0]?.quantity || 1,
    currentPeriodStart: isoFromSeconds(providerSubscription.current_period_start), currentPeriodEnd: isoFromSeconds(providerSubscription.current_period_end),
    cancelAtPeriodEnd: Boolean(providerSubscription.cancel_at_period_end), canceledAt: isoFromSeconds(providerSubscription.canceled_at)
  };
}

export async function processStripeEvent(event, rawBody, config, { request = supabaseServerRequest, fetchImpl = fetch } = {}) {
  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  if (!event?.id || !event?.type) throw new BillingError("provider_unavailable", 400);
  if (!SUPPORTED_STRIPE_EVENTS.has(event.type) || !event.type.startsWith("customer.subscription.")) {
    const result = await request("/rest/v1/rpc/record_billing_webhook_event", { method: "POST", useServiceRole: true, body: {
      provider_value: "stripe", provider_event_id_value: event.id, event_type_value: event.type,
      provider_created_at_value: isoFromSeconds(event.created), object_id_value: event.data?.object?.id || null, payload_hash_value: payloadHash
    }});
    if (!result.ok) throw new BillingError("provider_unavailable", 503);
    return result.data;
  }
  const subscriptionId = event.data?.object?.id;
  let normalized;
  try {
    const providerSubscription = await retrieveStripeSubscription(subscriptionId, config.secretKey, fetchImpl);
    normalized = normalizeStripeSubscriptionEvent(event, providerSubscription, config.priceMap, new Date());
  } catch (error) {
    await request("/rest/v1/rpc/record_billing_webhook_failure", { method: "POST", useServiceRole: true, body: {
      provider_value: "stripe", provider_event_id_value: event.id, event_type_value: event.type,
      provider_created_at_value: isoFromSeconds(event.created), object_id_value: subscriptionId || null,
      payload_hash_value: payloadHash, error_code_value: error instanceof BillingError ? error.code : "provider_unavailable"
    }});
    if (error instanceof BillingError && error.code === "invalid_plan") {
      return { failed: true, permanent: true, errorCode: "invalid_plan" };
    }
    throw error;
  }
  normalized.payloadHash = payloadHash;
  const result = await request("/rest/v1/rpc/process_billing_subscription_event", { method: "POST", useServiceRole: true, body: {
    provider_value: "stripe", provider_event_id_value: normalized.providerEventId, event_type_value: normalized.eventType,
    provider_created_at_value: normalized.providerCreatedAt, provider_snapshot_at_value: normalized.providerSnapshotAt,
    object_id_value: normalized.objectId, payload_hash_value: normalized.payloadHash,
    billing_account_value: normalized.billingAccountId, target_space_value: normalized.targetSpaceId,
    target_kind_value: normalized.targetKind, personal_profession_value: normalized.personalProfession,
    provider_customer_value: normalized.providerCustomerId, plan_key_value: normalized.planKey, entitlement_key_value: normalized.entitlementKey,
    status_value: normalized.status, quantity_value: normalized.quantity, current_period_start_value: normalized.currentPeriodStart,
    current_period_end_value: normalized.currentPeriodEnd, cancel_at_period_end_value: normalized.cancelAtPeriodEnd, canceled_at_value: normalized.canceledAt
  }});
  if (!result.ok) throw new BillingError("provider_unavailable", 503);
  if (result.data?.failed) {
    const permanent = ["billing_scope_mismatch", "billing_constraint_failed"].includes(result.data.error_code);
    return { ...result.data, permanent };
  }
  return result.data;
}
