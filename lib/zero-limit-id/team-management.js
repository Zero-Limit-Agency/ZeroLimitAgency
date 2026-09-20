import "server-only";

import crypto from "node:crypto";
import { getClientSession } from "@/lib/auth/client-auth";
import { supabaseServerRequest } from "@/lib/supabase/server";
import { ensureProfileForSession } from "@/lib/zero-limit-id/profile";

const KNOWN_ERRORS = new Set([
  "authentication_required", "target_not_member", "owner_protected",
  "insufficient_permission", "invitation_already_used", "invitation_revoked",
  "invitation_expired", "invitation_invalid", "already_removed",
  "cannot_leave_as_owner", "use_leave_team", "invalid_role"
]);

export class TeamManagementError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = "TeamManagementError";
    this.code = code;
    this.status = status;
  }
}

async function callRpc(name, body) {
  const session = await getClientSession();
  if (!session?.accessToken || session.isDemo) throw new TeamManagementError("authentication_required", 401);
  await ensureProfileForSession(session);
  const result = await supabaseServerRequest(`/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body
  });
  if (!result.ok) {
    const message = String(result.data?.message || "");
    const code = [...KNOWN_ERRORS].find((candidate) => message.includes(candidate));
    if (code) throw new TeamManagementError(code, code === "authentication_required" ? 401 : code === "insufficient_permission" || code === "owner_protected" || code === "cannot_leave_as_owner" ? 403 : 400);
    throw new TeamManagementError("unexpected_error", 500);
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
