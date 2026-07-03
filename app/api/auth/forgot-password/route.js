import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/security/rate-limit";
import { isValidEmailAddress, normalizeEmailAddress } from "@/lib/security/uploads";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function buildPasswordResetRedirectUrl() {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${appUrl}/connexion/definir-mot-de-passe`;
}

export async function POST(request) {
  try {
    const rateLimitResponse = await checkRateLimit(request, {
      key: "auth-forgot-password",
      limit: 3,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    const email = normalizeEmailAddress(body?.email || "");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Renseignez votre adresse email pour recevoir un nouveau lien." },
        { status: 400 }
      );
    }

    if (!isValidEmailAddress(email)) {
      return NextResponse.json(
        { success: false, error: "L'adresse email saisie n'est pas valide." },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    await adminClient.auth.sendPasswordRecovery(email, buildPasswordResetRedirectUrl());

    return NextResponse.json({
      success: true,
      message:
        "Si un compte existe avec cette adresse, un email de reinitialisation vient d'etre envoye."
    });
  } catch (error) {
    console.error("[auth-forgot-password] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Impossible d'envoyer le lien de reinitialisation pour le moment."
      },
      { status: 500 }
    );
  }
}
