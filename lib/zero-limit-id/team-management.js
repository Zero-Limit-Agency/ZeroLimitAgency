import "server-only";

import crypto from "node:crypto";
import { getClientSession } from "@/lib/auth/client-auth";
import { supabaseServerRequest } from "@/lib/supabase/server";
import { ensureProfileForSession } from "@/lib/zero-limit-id/profile";

const KNOWN_ERRORS = new Set([
  "authentication_required", "target_not_member", "owner_protected",
  "insufficient_permission", "invitation_already_used", "invitation_revoked",
  "invitation_expired", "invitation_invalid", "already_removed",
  "cannot_leave_as_owner", "use_leave_team", "team_space_inactive", "entitlement_required", "invalid_role"
]);

function classifyRpcFailure(result) {
  const supabaseCode = String(result.data?.code || "");
  const message = String(result.data?.message || "");
  const knownCode = [...KNOWN_ERRORS].find((candidate) => message.includes(candidate));
  if (knownCode) return { code: knownCode, category: ["team_space_inactive", "entitlement_required"].includes(knownCode) ? "access_issue" : "domain_error" };
  if (supabaseCode === "PGRST202" || result.status === 404 && supabaseCode.startsWith("PGRST")) return { code: "rpc_unavailable", category: "rpc_absent" };
  if (supabaseCode === "42501" && /row-level security/i.test(message)) return { code: "row_level_security", category: "rls" };
  if (supabaseCode === "42501" || result.status === 401 || result.status === 403) return { code: "permission_denied", category: "permission_denied" };
  return { code: "unexpected_error", category: "supabase_error" };
}

export class TeamManagementError extends Error {
  constructor(code, status = 400, correlationId) {
    super(code);
    this.name = "TeamManagementError";
    this.code = code;
    this.status = status;
    this.correlationId = correlationId;
  }
}

async function callRpc(name, body) {
  const session = await getClientSession();
  if (!session?.accessToken || session.isDemo) throw new TeamManagementError("authentication_required", 401);
  await ensureProfileForSession(session);
  let result;
  try {
    result = await supabaseServerRequest(`/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body
    });
  } catch (error) {
    const correlationId = crypto.randomUUID();
    console.error("[team-management] RPC transport failure", { correlationId, rpc: name, category: "transport", name: error?.name });
    throw new TeamManagementError("transport_error", 503, correlationId);
  }
  if (!result.ok) {
    const failure = classifyRpcFailure(result);
    const correlationId = crypto.randomUUID();
    console.error("[team-management] RPC failure", { correlationId, rpc: name, category: failure.category, status: result.status, supabaseCode: result.data?.code });
    const forbidden = new Set(["insufficient_permission", "owner_protected", "cannot_leave_as_owner", "entitlement_required", "permission_denied", "row_level_security"]);
    const status = failure.code === "authentication_required" ? 401 : forbidden.has(failure.code) ? 403 : failure.code === "rpc_unavailable" ? 503 : failure.code === "unexpected_error" ? 500 : 400;
    throw new TeamManagementError(failure.code, status, correlationId);
  }
  return result.data;
}

export async function getTeamManagement(organizationId, canManageInvitations) {
  const members = await callRpc("get_team_members", { organization_value: organizationId });
  const invitations = canManageInvitations
    ? await callRpc("get_pending_team_invitations", { organization_value: organizationId })
    : [];
  return {
    members: (members || []).map((member) => ({
      membershipId: member.membership_id,
      profileId: member.profile_id,
      displayName: member.display_name,
      username: member.username,
      role: member.role,
      isOwner: member.is_owner,
      joinedAt: member.joined_at
    })),
    invitations: (invitations || []).map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
      invitedByDisplayName: invitation.invited_by_display_name
    }))
  };
}

export function updateTeamMemberRole(organizationId, membershipId, role) {
  return callRpc("update_team_member_role", { organization_value: organizationId, membership_value: membershipId, role_value: role });
}

export function removeTeamMember(organizationId, membershipId) {
  return callRpc("remove_team_member", { organization_value: organizationId, membership_value: membershipId });
}

export function leaveTeam(organizationId) {
  return callRpc("leave_team", { organization_value: organizationId });
}

export function revokeTeamInvitation(organizationId, invitationId) {
  return callRpc("revoke_team_invitation", { organization_value: organizationId, invitation_value: invitationId });
}

export async function resendTeamInvitation(organizationId, invitationId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const email = await callRpc("resend_team_invitation", {
    organization_value: organizationId,
    invitation_value: invitationId,
    token_hash_value: tokenHash,
    expires_at_value: expiresAt
  });
  return { token, email, expiresAt };
}
