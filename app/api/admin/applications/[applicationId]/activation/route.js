import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { revokeClientAccess, triggerClientActivation } from "@/lib/auth/client-activation";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const session = await getClientSession();

    if (!session?.user || !(await isAdminUser(session.user))) {
      return NextResponse.json(
        { success: false, error: "Accès administrateur requis." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "activate").trim();

    if (action === "revoke") {
      const result = await revokeClientAccess(params.applicationId);

      return NextResponse.json({
        success: true,
        action,
        access: result.access,
        message: "L'accès client a bien été révoqué."
      });
    }

    const normalizedAction = action === "resend" ? "resend" : "activate";
    const result = await triggerClientActivation(params.applicationId, normalizedAction);

    return NextResponse.json({
      success: true,
      action: normalizedAction,
      access: result.access,
      emailSentTo: result.emailSentTo,
      message: result.message
    });
  } catch (error) {
    console.error("[admin-activation] failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant l'activation du client."
      },
      { status: 500 }
    );
  }
}
