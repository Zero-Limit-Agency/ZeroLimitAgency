import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/api-guards";
import { normalizeMaintenanceSettings } from "@/lib/maintenance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatSupabaseAdminError } from "@/lib/supabase/errors";

export async function PATCH(request) {
  const guard = await requireAdminApiSession();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const payload = await request.json();
    const settings = normalizeMaintenanceSettings(payload);
    const adminClient = createSupabaseAdminClient();
    const result = await adminClient.globalMaintenanceSettings.upsert({
      settings,
      updated_by: guard.session.user.id
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
        ? "Le mode maintenance est active."
        : "Le mode maintenance est desactive.",
      settings
    });
  } catch (error) {
    console.error("[admin-maintenance] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Impossible d'enregistrer le mode maintenance."
      },
      { status: 500 }
    );
  }
}
