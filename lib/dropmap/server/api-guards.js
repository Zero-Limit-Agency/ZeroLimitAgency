import "server-only";

import { NextResponse } from "next/server";

import { getUserRole } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { getDropMapSettings } from "@/lib/dropmap/server/settings";
import { getDropMapVisibilityContext } from "@/lib/dropmap/server/visibility";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function requireDropMapApiVisibility() {
  const adminClient = createSupabaseAdminClient();
  const settings = await getDropMapSettings(adminClient);
  const session = await getClientSession();
  const role = session?.user ? await getUserRole(session.user) : null;
  const context = getDropMapVisibilityContext({
    role,
    settings,
    isDemo: Boolean(session?.isDemo)
  });

  if (context.action === "redirect_home") {
    return {
      ok: false,
      session,
      role,
      context,
      settings,
      response: NextResponse.json(
        {
          success: false,
          error: "Ressource introuvable."
        },
        { status: 404 }
      )
    };
  }

  if (context.action === "show_maintenance") {
    return {
      ok: false,
      session,
      role,
      context,
      settings,
      response: NextResponse.json(
        {
          success: false,
          code: "maintenance",
          error: "Service temporairement indisponible."
        },
        { status: 503 }
      )
    };
  }

  return {
    ok: true,
    session,
    role,
    context,
    settings,
    response: null
  };
}
