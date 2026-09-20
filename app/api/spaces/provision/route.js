import { NextResponse } from "next/server";
import { ProvisioningError, ProvisioningInfrastructureError, provisionCreatorSpace, provisionPersonalSpace, provisionTeam, requireInteractiveProvisioningEnabled } from "@/lib/zero-limit-id/provisioning";
import { checkRateLimit } from "@/lib/security/rate-limit";

const messages = { invalid_profession: "Profession invalide.", slug_taken: "Ce slug est déjà utilisé.", invalid_slug: "Le slug doit contenir 3 à 63 caractères minuscules, chiffres ou tirets.", invalid_organization_name: "Nom d’organisation invalide.", authentication_required: "Reconnectez-vous pour continuer.", provisioning_disabled: "Le provisioning interactif n’est pas disponible dans cet environnement.", unexpected_error: "Impossible de préparer cet espace pour le moment." };

export async function POST(request) {
  const limited = await checkRateLimit(request, { key: "space-provisioning", limit: 10, windowMs: 60000 });
  if (limited) return limited;
  const correlationId = crypto.randomUUID();
  try {
    requireInteractiveProvisioningEnabled();
    const body = await request.json().catch(() => ({}));
    const result = body.kind === "personal" ? await provisionPersonalSpace(body.profession) : body.kind === "creator" ? await provisionCreatorSpace() : body.kind === "team" ? await provisionTeam({ name: body.name, slug: body.slug }) : (() => { throw new ProvisioningError("invalid_kind"); })();
    const response = NextResponse.json({ success: true, spaceId: result.value });
    response.cookies.set("zla_last_space", result.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31536000 });
    return response;
  } catch (error) {
    if (error instanceof ProvisioningError) return NextResponse.json({ success: false, error: messages[error.code] || messages.unexpected_error }, { status: error.status });
    if (error instanceof ProvisioningInfrastructureError) {
      console.error("[space-provisioning] infrastructure failure", { correlationId, category: error.category, upstreamStatus: error.upstreamStatus, upstreamCode: error.upstreamCode, upstreamMessage: error.upstreamMessage });
      return NextResponse.json({ success: false, error: messages.unexpected_error, correlationId, category: error.category }, { status: error.status });
    }
    console.error("[space-provisioning] failure", { correlationId, name: error?.name, message: error?.message });
    return NextResponse.json({ success: false, error: messages.unexpected_error, correlationId, category: "unexpected_server" }, { status: 500 });
  }
}
