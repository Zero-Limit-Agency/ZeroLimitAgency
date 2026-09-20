import crypto from "node:crypto";

export const BILLING_ERROR_CODES = Object.freeze([
  "billing_not_configured", "invalid_plan", "subscription_not_found", "subscription_inactive",
  "provider_unavailable", "webhook_signature_invalid", "webhook_duplicate", "billing_scope_mismatch", "seat_limit_reached"
]);

export class BillingError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = "BillingError";
    this.code = BILLING_ERROR_CODES.includes(code) ? code : "provider_unavailable";
    this.status = status;
    this.correlationId = status >= 500 ? crypto.randomUUID() : null;
  }
}
