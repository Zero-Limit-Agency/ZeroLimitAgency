import "server-only";
import { IntegrationError } from "./errors.js";
import { assertProviderScope } from "./registry.js";

export function canReconcileIntegration(connection, context = {}) {
  if (!connection || connection.status === "pending" || connection.status === "revoked") return false;
  if (connection.status === "active") return true;
  if (connection.status === "expired") return context.purpose === "restore_provider_state";
  return connection.status === "error" && connection.recoverable === true && context.purpose === "restore_provider_state";
}

function assertConnectionScopes(connection) {
  if (!assertProviderScope(connection?.provider, connection?.scope_type, connection?.scopes || [])) {
    throw new IntegrationError("integration_scope_mismatch", 409);
  }
}

export async function syncIntegration(connection, adapter, context = {}) {
  if (!connection || connection.status !== "active") throw new IntegrationError("integration_not_connected", 409);
  assertConnectionScopes(connection);
  if (!adapter || typeof adapter.sync !== "function") throw new IntegrationError("integration_provider_unavailable", 503);
  try {
    return await adapter.sync({ connectionId: connection.id, scopes: [...connection.scopes], context });
  } catch (cause) {
    if (cause instanceof IntegrationError) throw cause;
    throw new IntegrationError("integration_sync_failed", 502, context.correlationId, { cause });
  }
}

export async function reconcileIntegration(connection, adapter, context = {}) {
  if (!canReconcileIntegration(connection, context)) throw new IntegrationError("integration_not_connected", 409);
  assertConnectionScopes(connection);
  if (!adapter || typeof adapter.reconcile !== "function") {
    if (connection.status === "active") return syncIntegration(connection, adapter, context);
    throw new IntegrationError("integration_provider_unavailable", 503);
  }
  return adapter.reconcile({ connectionId: connection.id, context });
}
