import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { buildAbsoluteUrl, sendZeroLimitEmail } from "@/lib/emails/zero-limit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { canReturnPreviewInvitationToken } from "@/lib/zero-limit-id/environment";
import {
  leaveTeam, removeTeamMember, resendTeamInvitation, revokeTeamInvitation,
  TeamManagementError, updateTeamMemberRole
} from "@/lib/zero-limit-id/team-management";

const actions = {
  updateRole: ({ organizationId, membershipId, role }) => updateTeamMemberRole(organizationId, membershipId, role),
  removeMember: ({ organizationId, membershipId }) => removeTeamMember(organizationId, membershipId),
  leaveTeam: ({ organizationId }) => leaveTeam(organizationId),
  revokeInvitation: ({ organizationId, invitationId }) => revokeTeamInvitation(organizationId, invitationId)
};

export async function POST(request) {
  const limited = await checkRateLimit(request, { key: "team-management", limit: 30, windowMs: 60000 });
  if (limited) return limited;
  const correlationId = crypto.randomUUID();
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "resendInvitation") {
      const invitation = await resendTeamInvitation(body.organizationId, body.invitationId);
      revalidatePath(`/espace/${encodeURIComponent(String(body.spaceId || ""))}/membres`);
      const url = buildAbsoluteUrl(`/invitation/team/${encodeURIComponent(invitation.token)}`);
      const delivery = await sendZeroLimitEmail({
        to: invitation.email,
        from: process.env.ZERO_LIMIT_EMAIL_FROM,
        subject: "Invitation à rejoindre une Team Zero Limit",
        text: `Votre invitation Team a été renouvelée. Ce nouveau lien est valable 7 jours : ${url}`,
        html: `<div style="font-family:Arial,sans-serif;color:#24151b"><h1>Invitation Team</h1><p>Votre invitation a été renouvelée.</p><p><a href="${url}">Consulter et accepter l’invitation</a></p><p>Ce nouveau lien personnel expire dans 7 jours. L’ancien lien n’est plus valide.</p></div>`
      });
      if (!delivery.ok) return NextResponse.json({ success: false, code: "email_delivery_failed", delivery: "failed", mutationApplied: true, previewUrl: canReturnPreviewInvitationToken() ? url : undefined }, { status: 502 });
      return NextResponse.json({ success: true, delivery: "sent", previewUrl: canReturnPreviewInvitationToken() ? url : undefined });
    }
    const action = actions[body.action];
    if (!action) throw new TeamManagementError("invalid_action");
    await action(body);
    revalidatePath(`/espace/${encodeURIComponent(String(body.spaceId || ""))}/membres`);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TeamManagementError) {
      return NextResponse.json({ success: false, code: error.code, correlationId: error.correlationId }, { status: error.status });
    }
    console.error("[team-management] mutation failure", { correlationId, name: error?.name });
    return NextResponse.json({ success: false, code: "unexpected_error", correlationId }, { status: 500 });
  }
}
