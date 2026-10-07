import { NextResponse } from "next/server";

import {
  buildUuidParamError,
  isUuidLike,
  requireAdminApiSession
} from "@/lib/auth/api-guards";
import { revokeClientAccess, triggerClientActivation } from "@/lib/auth/client-activation";

export const runtime = "nodejs";

export async function POST(request, props) {
  const params = await props.params;
  try {
    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "activate").trim();

    if (action === "revoke") {
      const result = await revokeClientAccess(applicationId);

      return NextResponse.json({
        success: true,
        action,
        access: result.access,
        message: "L'acces client a bien ete revoque."
      });
    }

    const normalizedAction = action === "resend" ? "resend" : "activate";
    const result = await triggerClientActivation(applicationId, normalizedAction);

    return NextResponse.json({
      success: true,
      action: normalizedAction,
      access: result.access,
      emailSentTo: result.emailSentTo,
      message: result.message
    });
  } catch (error) {
    console.error("[admin-activation] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue pendant l'activation du client."
      },
      { status: 500 }
    );
  }
}
