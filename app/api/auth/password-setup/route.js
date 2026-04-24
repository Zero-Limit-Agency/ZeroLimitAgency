import { NextResponse } from "next/server";

import { activateClientAccessFromRecovery } from "@/lib/auth/client-activation";
import {
  clearClientAuthCookies,
  getSupabaseUserFromAccessToken,
  setClientAuthCookies
} from "@/lib/auth/client-auth";
import { buildClientApplicationUrl } from "@/lib/auth/client-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const accessToken = String(body?.accessToken || "").trim();
    const refreshToken = String(body?.refreshToken || "").trim();
    const password = String(body?.password || "").trim();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, error: "Le lien d'activation est incomplet, invalide ou expiré." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const updatePassword = await adminClient.auth.updateUserPassword(accessToken, password);

    if (!updatePassword.ok) {
      const rawError =
        updatePassword.data?.msg ||
        updatePassword.data?.error_description ||
        updatePassword.data?.error ||
        "";

      const normalizedError = String(rawError).toLowerCase();
      const friendlyError =
        normalizedError.includes("expired") || normalizedError.includes("invalid")
          ? "Le lien d'activation a expiré ou n'est plus valide. Demandez un nouvel email d'accès."
          : normalizedError.includes("same password")
            ? "Choisissez un mot de passe différent de l'ancien."
            : rawError || "Impossible de définir le mot de passe.";

      return NextResponse.json(
        {
          success: false,
          error: friendlyError
        },
        { status: updatePassword.status || 400 }
      );
    }

    const userResult = await getSupabaseUserFromAccessToken(accessToken);

    if (!userResult.ok || !userResult.data?.id) {
      return NextResponse.json(
        { success: false, error: "Impossible de récupérer le compte client après activation." },
        { status: 500 }
      );
    }

    const access = await activateClientAccessFromRecovery(userResult.data);
    const redirectTo = buildClientApplicationUrl(access.application_id);
    const response = NextResponse.json({
      success: true,
      redirectTo
    });

    clearClientAuthCookies(response);
    setClientAuthCookies(response, {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    console.error("[auth-password-setup] failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant l'activation du mot de passe."
      },
      { status: 500 }
    );
  }
}
