import "server-only";

import crypto from "node:crypto";
import { getClientSession } from "@/lib/auth/client-auth";
import { requireSupabaseServiceRoleConfig, supabaseServerRequest } from "@/lib/supabase/server";
import { ensureProfileForSession } from "@/lib/zero-limit-id/profile";
import { isInteractiveProvisioningEnabled } from "@/lib/zero-limit-id/environment";

const PROFESSIONS = new Set(["coach", "manager_agent", "ceo", "community_manager"]);
const ROLES = new Set(["admin", "member"]);

export class ProvisioningError extends Error {
  constructor(code, status = 400) { super(code); this.name = "ProvisioningError"; this.code = code; this.status = status; }
}

export class ProvisioningInfrastructureError extends Error {
  constructor(category, { status = 503, upstreamStatus = null, upstreamCode = null, upstreamMessage = null } = {}) {
    super(category);
    this.name = "ProvisioningInfrastructureError";
    this.category = category;
    this.status = status;
    this.upstreamStatus = upstreamStatus;
    this.upstreamCode = upstreamCode;
    this.upstreamMessage = upstreamMessage;
  }
}

export function requireInteractiveProvisioningEnabled() {
  if (!isInteractiveProvisioningEnabled()) {
    throw new ProvisioningError("provisioning_disabled", 503);
  }
}

async function context() {
  const session = await getClientSession();
  if (!session?.accessToken || session.isDemo) throw new ProvisioningError("authentication_required", 401);
  await ensureProfileForSession(session);
  return session;
}

async function rpc(name, body, { backendOnly = false } = {}) {
  const session = await context();
  if (backendOnly) {
    try { requireSupabaseServiceRoleConfig(); }
    catch (error) { throw new ProvisioningInfrastructureError("service_role_configuration", { upstreamMessage: error?.message }); }
  }
  const requestBody = backendOnly ? { actor_auth_user_id: session.user.id, ...body } : body;
  let result;
  try {
    result = await supabaseServerRequest(`/rest/v1/rpc/${name}`, {
      method: "POST",
      useServiceRole: backendOnly,
      headers: backendOnly ? undefined : { Authorization: `Bearer ${session.accessToken}` },
      body: requestBody
    });
  } catch (error) {
    throw new ProvisioningInfrastructureError("supabase_transport", { upstreamMessage: error?.message });
  }
  if (!result.ok) {
    const known = ["invalid_profession", "slug_taken", "invalid_slug", "invalid_organization_name", "invitation_invalid", "invitation_expired", "invitation_revoked", "invitation_email_mismatch", "invitation_email_unverified", "invitation_used", "invitation_forbidden", "invalid_role"];
    const code = known.find((value) => String(result.data?.message || "").includes(value)) || "unexpected_error";
    if (code !== "unexpected_error") throw new ProvisioningError(code, code === "invitation_forbidden" || code === "invitation_email_mismatch" ? 403 : 400);
    const upstreamCode = String(result.data?.code || "") || null;
    const category = upstreamCode === "PGRST202" ? "rpc_schema_cache" : upstreamCode === "42501" ? "rpc_permission" : upstreamCode === "P0002" ? "profile_resolution" : "rpc_failure";
    throw new ProvisioningInfrastructureError(category, { status: 503, upstreamStatus: result.status, upstreamCode, upstreamMessage: result.data?.message });
  }
  return { session, value: result.data };
}

export function provisionPersonalSpace(profession) {
  if (!PROFESSIONS.has(profession)) throw new ProvisioningError("invalid_profession");
  return rpc("provision_personal_space", { profession_value: profession, entitlement_source: "system" }, { backendOnly: true });
}
export function provisionCreatorSpace() { return rpc("provision_creator_space", { entitlement_source: "system" }, { backendOnly: true }); }
export function provisionTeam({ name, slug }) {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  return rpc("provision_team", { organization_name: String(name || "").trim(), organization_slug: cleanSlug, entitlement_source: "system" }, { backendOnly: true });
}
export async function createTeamInvitation({ organizationId, email, role }) {
  if (!ROLES.has(role)) throw new ProvisioningError("invalid_role");
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  await rpc("create_team_invitation", { organization_value: organizationId, email_value: String(email || "").trim().toLowerCase(), role_value: role, token_hash_value: tokenHash, expires_at_value: expiresAt });
  return { token, expiresAt };
}
export async function acceptTeamInvitation(token) {
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token || "")) throw new ProvisioningError("invitation_invalid");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return rpc("accept_team_invitation", { token_hash_value: tokenHash });
}
