import { NextResponse } from "next/server";

import { activateClientAccessFromRecovery } from "@/lib/auth/client-activation";
import {
  clearClientAuthCookies,
  refreshClientSession,
  getSupabaseUserFromAccessToken,
  setClientAuthCookies
} from "@/lib/auth/client-auth";
import { buildClientApplicationUrl } from "@/lib/auth/client-access";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, {
      key: "auth-password-setup",
      limit: 5,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const accessToken = String(body?.accessToken || "").trim();
    const refreshToken = String(body?.refreshToken || "").trim();
    const password = String(body?.password || "").trim();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, error: "Le lien d'activation est incomplet, invalide ou expire." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Le mot de passe doit contenir au moins 8 caracteres." },
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
          ? "Le lien d'activation a expire ou n'est plus valide. Demandez un nouvel email d'acces."
          : normalizedError.includes("same password")
            ? "Choisissez un mot de passe different de l'ancien."
            : "Impossible de definir le mot de passe.";

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
        { success: false, error: "Impossible de recuperer le compte client apres activation." },
        { status: 500 }
      );
    }

    const refreshedSession = await refreshClientSession(refreshToken);
    const refreshedUserId = refreshedSession.data?.user?.id || null;

    if (!refreshedSession.ok || !refreshedSession.data?.access_token || !refreshedSession.data?.refresh_token) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de finaliser l'activation du compte."
        },
        { status: 400 }
      );
    }

    if (refreshedUserId && refreshedUserId !== userResult.data.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de finaliser l'activation du compte."
        },
        { status: 400 }
      );
    }

    const access = await activateClientAccessFromRecovery(userResult.data);
    const redirectTo = buildClientApplicationUrl(access.application_id);
    const response = NextResponse.json({
      success: true,
      redirectTo
    });

    clearClientAuthCookies(response);
    setClientAuthCookies(response, refreshedSession.data);

    return response;
  } catch (error) {
    console.error("[auth-password-setup] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue pendant l'activation du mot de passe."
      },
      { status: 500 }
    );
  }
}
