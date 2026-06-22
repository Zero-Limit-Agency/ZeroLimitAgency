import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/api-guards";
import {
  validateYoutubeTrainingSettingsPayload
} from "@/lib/learn-youtube/settings";
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

    const validation = validateYoutubeTrainingSettingsPayload(payload);

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
    const result = await adminClient.youtubeTrainingSettings.upsert({
      settings: validation.settings,
      updated_by: guard.session.user.id
    });

    if (!result.ok) {
      const errorMessage = formatSupabaseAdminError(
        result.data,
        "Impossible d'enregistrer les réglages de la Formation YouTube."
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
      message: "Les réglages de la Formation YouTube ont bien été mis à jour.",
      settings: validation.settings
    });
  } catch (error) {
    console.error("[admin-learn-youtube-settings] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Impossible d'enregistrer les réglages de la Formation YouTube."
      },
      { status: 500 }
    );
  }
}
