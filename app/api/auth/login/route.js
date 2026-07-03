import { NextResponse } from "next/server";

import {
  clearClientAuthCookies,
  setClientAuthCookies,
  signInClientWithPassword
} from "@/lib/auth/client-auth";
import { getClientWorkspaceContext } from "@/lib/auth/client-access";
import { getUserRole } from "@/lib/auth/admin-access";
import { checkRateLimit, permanentlyBlockRequestIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const rateLimitResponse = await checkRateLimit(request, {
      key: "auth-login",
      limit: 20,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    const website = String(body?.website || "").trim();

    if (website) {
      permanentlyBlockRequestIp(request, "auth-login-honeypot");
      return NextResponse.json({ success: true, redirectTo: "/espace-client" });
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    const authResult = await signInClientWithPassword({ email, password });

    if (!authResult.ok || !authResult.data?.access_token) {
      return NextResponse.json(
        {
          success: false,
          error: "Connexion impossible."
        },
        { status: authResult.status || 401 }
      );
    }

    const role = await getUserRole(authResult.data.user);

    if (role === "admin") {
      const response = NextResponse.json({
        success: true,
        redirectTo: "/admin"
      });

      setClientAuthCookies(response, authResult.data);
      return response;
    }

    const { access, application } = await getClientWorkspaceContext(authResult.data.user);

    if (!access?.application_id || !application) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Aucun dossier client n'est encore lié à ce compte."
        },
        { status: 403 }
      );

      clearClientAuthCookies(response);
      return response;
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: "/espace-client"
    });

    setClientAuthCookies(response, authResult.data);
    return response;
  } catch (error) {
    console.error("[auth-login] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Erreur de connexion."
      },
      { status: 500 }
    );
  }
}
