import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function buildPasswordResetRedirectUrl() {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${appUrl}/connexion/definir-mot-de-passe`;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Renseignez votre adresse email pour recevoir un nouveau lien." },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    await adminClient.auth.sendPasswordRecovery(email, buildPasswordResetRedirectUrl());

    return NextResponse.json({
      success: true,
      message:
        "Si un compte existe avec cette adresse, un email de réinitialisation vient d'être envoyé."
    });
  } catch (error) {
    console.error("[auth-forgot-password] failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer le lien de réinitialisation pour le moment."
      },
      { status: 500 }
    );
  }
}
