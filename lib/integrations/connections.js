import "server-only";
import { supabaseServerRequest } from "../supabase/server.js";
import { IntegrationError } from "./errors.js";

const SAFE_COLUMNS = "id,provider,scope_type,status,external_account_label,scopes,connected_at,disconnected_at,last_synced_at,created_at,updated_at";

export async function getIntegrationConnectionsForProfile(accessToken, request = supabaseServerRequest) {
  const result = await request(`/rest/v1/rpc/get_my_integration_connections`, {
    method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: {}
  });
  if (!result.ok) throw new IntegrationError("integration_provider_unavailable", 503);
  return result.data || [];
}

export async function getIntegrationConnection(connectionId, accessToken, request = supabaseServerRequest) {
  const result = await request(`/rest/v1/rpc/get_my_integration_connection`, {
    method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: { connection_value: connectionId }
  });
  if (!result.ok) throw new IntegrationError("integration_not_found", result.status === 403 ? 403 : 404);
  return result.data?.[0] || null;
}

export const INTEGRATION_SAFE_COLUMNS = SAFE_COLUMNS;

// Deliberately fail closed until an audited KMS/Vault implementation is wired.
// Never accept ciphertext supplied by a caller as proof that encryption occurred.
export async function writeIntegrationCredentials() {
  throw new IntegrationError("integration_credential_storage_disabled", 501);
}
