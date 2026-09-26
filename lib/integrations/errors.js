import { randomUUID } from "node:crypto";

export const INTEGRATION_ERROR_CODES = Object.freeze([
  "integration_not_found", "integration_not_connected", "integration_provider_unavailable",
  "integration_state_invalid", "integration_scope_mismatch", "integration_account_already_linked",
  "integration_token_expired", "integration_refresh_failed", "integration_webhook_invalid",
  "integration_sync_failed", "integration_forbidden", "integration_credential_storage_disabled"
]);

export class IntegrationError extends Error {
  constructor(code, status = 400, correlationId, options) {
    super(code, options);
    this.name = "IntegrationError";
    this.code = INTEGRATION_ERROR_CODES.includes(code) ? code : "integration_sync_failed";
    this.status = status;
    this.correlationId = correlationId || randomUUID();
  }
}
