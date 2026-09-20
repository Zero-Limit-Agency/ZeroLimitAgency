import "server-only";

import { getClientSession } from "@/lib/auth/client-auth";
import { supabaseServerRequest } from "@/lib/supabase/server";
import { AuthenticationRequiredError, ensureProfileForSession } from "@/lib/zero-limit-id/profile";

const ERROR_CODES = ["space_not_found", "settings_owner_required", "space_suspended", "space_archived_read_only", "invalid_name", "invalid_slug", "slug_taken", "invalid_lifecycle_transition", "entitlement_required", "invalid_operation"];

export class WorkspaceSettingsError extends Error {
  constructor(code, status = 400) { super(code); this.name = "WorkspaceSettingsError"; this.code = code; this.status = status; }
}

async function rpc(name, body) {
  const session = await getClientSession();
  if (!session?.accessToken || session.isDemo) throw new AuthenticationRequiredError("Authentication required");
  await ensureProfileForSession(session);
  const result = await supabaseServerRequest(`/rest/v1/rpc/${name}`, { method: "POST", headers: { Authorization: `Bearer ${session.accessToken}` }, body, cache: "no-store" });
  if (!result.ok) {
    const message = String(result.data?.message || "");
    const code = ERROR_CODES.find((candidate) => message.includes(candidate)) || "unexpected_error";
    throw new WorkspaceSettingsError(code, code === "space_not_found" ? 404 : code === "settings_owner_required" || code === "entitlement_required" ? 403 : code === "unexpected_error" ? 500 : 400);
  }
  return result.data;
}

export async function getWorkspaceSettings(spaceId) {
  const rows = await rpc("get_workspace_settings", { space_value: spaceId });
  if (!rows?.[0]) throw new WorkspaceSettingsError("space_not_found", 404);
  const row = rows[0];
  return { id: row.id, kind: row.kind, name: row.name, status: row.status, profession: row.personal_profession, organization: row.organization_id ? { id: row.organization_id, name: row.organization_name, slug: row.organization_slug } : null, owner: { id: row.owner_profile_id, name: row.owner_display_name }, isOwner: row.is_owner, role: row.member_role, entitlementActive: row.entitlement_active };
}

function mutate(spaceId, operation, value) { return rpc("update_workspace_settings", { space_value: spaceId, operation_value: operation, value_value: value ?? null }); }
export const renamePersonalSpace = (id, name) => mutate(id, "rename_space", name);
export const renameCreatorSpace = (id, name) => mutate(id, "rename_space", name);
export const updateTeamOrganizationName = (id, name) => mutate(id, "rename_organization", name);
export const updateTeamSlug = (id, slug) => mutate(id, "change_slug", slug);
export const archiveSpace = (id) => mutate(id, "archive");
export const restoreSpace = (id) => mutate(id, "restore");
