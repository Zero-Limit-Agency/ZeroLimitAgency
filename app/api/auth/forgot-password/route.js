import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/security/rate-limit";
import { isValidEmailAddress, normalizeEmailAddress } from "@/lib/security/uploads";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAuthRedirectUrl } from "@/lib/auth/deployment-url";

export const runtime = "nodejs";

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
    await adminClient.auth.sendPasswordRecovery(email, buildAuthRedirectUrl("/connexion/definir-mot-de-passe", process.env, request.url));

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
