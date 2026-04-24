import { NextResponse } from "next/server";

import {
  clearClientAuthCookies,
  setClientAuthCookies,
  signInClientWithPassword
} from "@/lib/auth/client-auth";
import { getClientWorkspaceContext } from "@/lib/auth/client-access";
import { getUserRole } from "@/lib/auth/admin-access";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();

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
          error: authResult.data?.error_description || authResult.data?.msg || "Connexion impossible."
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur de connexion."
      },
      { status: 500 }
    );
  }
}
