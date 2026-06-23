import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/api-guards";
import { getDropMapSettings, validateDropMapSettingsPayload } from "@/lib/dropmap/server/settings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatSupabaseAdminError } from "@/lib/supabase/errors";

export async function PATCH(request) {
  const guard = await requireAdminApiSession();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    let payload;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Le corps de la requête doit être un JSON valide."
        },
        { status: 400 }
      );
    }

    const validation = validateDropMapSettingsPayload(payload);

    if (!validation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error
        },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const result = await adminClient.dropMapSettings.updateDropMapSettings({
      ...validation.databaseRecord,
      updated_by: guard.session.user.id
    });

    if (!result.ok) {
      const errorMessage = formatSupabaseAdminError(
        result.data,
        "Impossible d'enregistrer les réglages DropMap."
      );

      return NextResponse.json(
        {
          success: false,
          error: errorMessage
        },
        { status: result.status || 500 }
      );
    }

    const settings = await getDropMapSettings(adminClient);

    return NextResponse.json({
      success: true,
      message: "Les réglages DropMap ont bien été mis à jour.",
      settings
    });
  } catch (error) {
    console.error("[admin-dropmap-settings] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Impossible d'enregistrer les réglages DropMap."
      },
      { status: 500 }
    );
  }
}
