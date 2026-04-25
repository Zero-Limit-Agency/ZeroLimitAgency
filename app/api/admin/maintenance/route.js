import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { normalizeMaintenanceSettings } from "@/lib/maintenance";
import { formatSupabaseAdminError } from "@/lib/supabase/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request) {
  const session = await getClientSession();

  if (!session?.user || !(await isAdminUser(session.user))) {
    return NextResponse.json(
      {
        success: false,
        error: "Accès administrateur requis."
      },
      { status: 403 }
    );
  }

  try {
    const payload = await request.json();
    const settings = normalizeMaintenanceSettings(payload);
    const adminClient = createSupabaseAdminClient();
    const result = await adminClient.globalMaintenanceSettings.upsert({
      settings,
      updated_by: session.user.id
    });

    if (!result.ok) {
      const errorMessage = formatSupabaseAdminError(
        result.data,
        "Impossible d'enregistrer le mode maintenance."
      );

      return NextResponse.json(
        {
          success: false,
          error: errorMessage
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: settings.enabled
        ? "Le mode maintenance est activé."
        : "Le mode maintenance est désactivé.",
      settings
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Impossible d'enregistrer le mode maintenance."
      },
      { status: 500 }
    );
  }
}
