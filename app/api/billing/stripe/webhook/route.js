import { NextResponse } from "next/server";
import { getStripeConfig } from "@/lib/billing/config";
import { BillingError } from "@/lib/billing/errors";
import { verifyStripeSignature } from "@/lib/billing/stripe-signature";
import { processStripeEvent } from "@/lib/billing/stripe-webhook";
import { recordAuditEvent } from "@/lib/security/audit-log";

export const runtime = "nodejs";

export function webhookHttpResponse(result) {
  if (result?.processing || (result?.failed && !result?.permanent)) {
    return NextResponse.json({ received: false, status: result.processing ? "processing" : "failed" }, { status: 503 });
  }
  return NextResponse.json({ received: true, duplicate: result?.duplicate === true, status: result?.failed ? "failed" : result?.ignored ? "ignored" : "processed" });
}

export async function POST(request) {
  const rawBody = await request.text();
  let config;
  try { config = getStripeConfig(); }
  catch (error) { return NextResponse.json({ error: error.code || "billing_not_configured" }, { status: 503 }); }
  if (!verifyStripeSignature(rawBody, request.headers.get("stripe-signature"), config.webhookSecret)) {
    return NextResponse.json({ error: "webhook_signature_invalid" }, { status: 400 });
  }
  let event;
  try { event = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "webhook_signature_invalid" }, { status: 400 }); }
  try {
    const result = await processStripeEvent(event, rawBody, config);
    return webhookHttpResponse(result);
  } catch (error) {
    const safe = error instanceof BillingError ? error : new BillingError("provider_unavailable", 503);
    await recordAuditEvent({ action: "billing_webhook_failed", resourceType: "billing_webhook_event", resourceId: event?.id, result: "failure", metadata: { eventType: event?.type, correlationId: safe.correlationId } });
    return NextResponse.json({ error: safe.code, correlationId: safe.correlationId || undefined }, { status: safe.status >= 500 ? 503 : safe.status });
  }
}
