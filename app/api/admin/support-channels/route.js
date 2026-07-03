import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/api-guards";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeSiteContent, normalizeSupportSettings } from "@/lib/site-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatSupabaseAdminError } from "@/lib/supabase/errors";

export async function PATCH(request) {
  const rateLimitResponse = await checkRateLimit(request, {
    key: "admin-support-channels",
    limit: 10,
    windowMs: 60 * 1000
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const guard = await requireAdminApiSession();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const payload = await request.json();
    const support = normalizeSupportSettings(payload);
    const adminClient = createSupabaseAdminClient();
    const currentSettingsResult = await adminClient.globalSiteSettings.get();
    const currentSettings =
      currentSettingsResult.ok && Array.isArray(currentSettingsResult.data) && currentSettingsResult.data.length > 0
        ? normalizeSiteContent(currentSettingsResult.data[0]?.settings || {})
        : normalizeSiteContent({});
    const result = await adminClient.globalSiteSettings.upsert({
      settings: {
        ...currentSettings,
        support
      },
      updated_by: guard.session.user.id
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: formatSupabaseAdminError(result.data, "Impossible d'enregistrer les canaux de support.")
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Les canaux de support ont bien été enregistrés.",
      support
    });
  } catch (error) {
    console.error("[admin-support-channels] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Impossible d'enregistrer les canaux de support."
      },
      { status: 500 }
    );
  }
}
