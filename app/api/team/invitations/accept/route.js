import { NextResponse } from "next/server";
import { acceptTeamInvitation, ProvisioningError } from "@/lib/zero-limit-id/provisioning";
import { checkRateLimit } from "@/lib/security/rate-limit";

const messages = { invitation_invalid: "Cette invitation est invalide.", invitation_expired: "Cette invitation a expiré.", invitation_revoked: "Cette invitation a été révoquée.", invitation_email_mismatch: "Connectez-vous avec l’adresse email qui a reçu l’invitation.", invitation_email_unverified: "Confirmez votre adresse email avant d’accepter cette invitation.", invitation_used: "Cette invitation a déjà été utilisée.", authentication_required: "Connectez-vous pour accepter l’invitation." };
export async function POST(request) {
  const limited = await checkRateLimit(request, { key: "team-invitation-accept", limit: 15, windowMs: 60000 });
  if (limited) return limited;
  const correlationId = crypto.randomUUID();
  try {
    const { token } = await request.json().catch(() => ({}));
    const result = await acceptTeamInvitation(token);
    const response = NextResponse.json({ success: true, spaceId: result.value });
    response.cookies.set("zla_last_space", result.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31536000 });
    return response;
  } catch (error) {
    if (error instanceof ProvisioningError) return NextResponse.json({ success: false, error: messages[error.code] || "Impossible d’accepter cette invitation." }, { status: error.status });
    console.error("[team-invitation] acceptance failure", { correlationId, name: error?.name });
    return NextResponse.json({ success: false, error: "Impossible d’accepter cette invitation.", correlationId }, { status: 500 });
  }
}
