import { NextResponse } from "next/server";
import { buildAbsoluteUrl, sendZeroLimitEmail } from "@/lib/emails/zero-limit";
import { createTeamInvitation, ProvisioningError } from "@/lib/zero-limit-id/provisioning";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { canReturnPreviewInvitationToken } from "@/lib/zero-limit-id/environment";

export async function POST(request) {
  const limited = await checkRateLimit(request, { key: "team-invitation", limit: 10, windowMs: 60000 });
  if (limited) return limited;
  const correlationId = crypto.randomUUID();
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ProvisioningError("invalid_email");
    const invitation = await createTeamInvitation({ organizationId: body.organizationId, email, role: body.role });
    const url = buildAbsoluteUrl(`/invitation/team/${encodeURIComponent(invitation.token)}`);
    const delivery = await sendZeroLimitEmail({
      to: email,
      from: process.env.ZERO_LIMIT_EMAIL_FROM,
      subject: "Invitation à rejoindre une Team Zero Limit",
      text: `Vous êtes invité(e) à rejoindre une Team Zero Limit. Lien valable 7 jours : ${url}`,
      html: `<div style="font-family:Arial,sans-serif;color:#24151b"><h1>Invitation Team</h1><p>Vous êtes invité(e) à rejoindre une Team Zero Limit.</p><p><a href="${url}">Consulter et accepter l’invitation</a></p><p>Ce lien personnel expire dans 7 jours.</p></div>`
    });
    if (!delivery.ok) return NextResponse.json({ success: false, code: "email_delivery_failed", delivery: "failed", mutationApplied: true, error: "Invitation enregistrée, mais l’email n’a pas été envoyé. Réessayez l’envoi ou utilisez le renvoi dans la liste des invitations.", previewUrl: canReturnPreviewInvitationToken() ? url : undefined }, { status: 502 });
    return NextResponse.json({ success: true, delivery: "sent", previewUrl: canReturnPreviewInvitationToken() ? url : undefined });
  } catch (error) {
    if (error instanceof ProvisioningError) {
      const messages = { invalid_email: "Adresse email invalide.", invalid_role: "Rôle invalide.", invitation_forbidden: "Vous ne pouvez pas inviter dans cette Team.", team_space_inactive: "Les invitations sont indisponibles tant que cette Team est inactive.", authentication_required: "Reconnectez-vous pour continuer." };
      return NextResponse.json({ success: false, error: messages[error.code] || "Invitation impossible." }, { status: error.status });
    }
    console.error("[team-invitation] creation failure", { correlationId, name: error?.name });
    return NextResponse.json({ success: false, error: "Invitation impossible.", correlationId }, { status: 500 });
  }
}
