import { NextResponse } from "next/server";

import { DEMO_CLIENT_USER_ID } from "@/lib/auth/demo-client";
import { requireAuthenticatedApiSession } from "@/lib/auth/api-guards";
import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSafeUpload } from "@/lib/security/uploads";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_AVATAR_SIZE = 1024 * 1024 * 2;

function buildDataUrl(file, buffer) {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function POST(request) {
  try {
    const rateLimitResponse = await checkRateLimit(request, {
      key: "client-avatar-upload",
      limit: 10,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authAccess = await requireAuthenticatedApiSession();

    if (!authAccess.ok) {
      return authAccess.response;
    }

    const session = authAccess.session;

    if (session.user.id === DEMO_CLIENT_USER_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "La photo de profil n'est pas modifiable dans l'accès de démonstration."
        },
        { status: 403 }
      );
    }

    const clientAccess = await getAuthorizedClientAccess(session.user);

    if (!clientAccess?.application_id) {
      return NextResponse.json(
        { success: false, error: "Aucun dossier actif n'est lié à ce compte." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "Aucune image n'a été envoyée." },
        { status: 400 }
      );
    }

    await assertSafeUpload(file, {
      label: "photo de profil",
      maxSizeBytes: MAX_AVATAR_SIZE,
      allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      allowedSignatures: ["jpeg", "png", "webp"]
    });

    const arrayBuffer = await file.arrayBuffer();
    const avatarDataUrl = buildDataUrl(file, arrayBuffer);
    const adminClient = createSupabaseAdminClient();
    const profileLookup = await adminClient.clientProfiles.getByApplicationId(clientAccess.application_id);
    const existingProfile =
      profileLookup.ok && Array.isArray(profileLookup.data) && profileLookup.data.length > 0
        ? profileLookup.data[0]
        : null;

    const result = await adminClient.clientProfiles.upsertByApplication({
      user_id: session.user.id,
      application_id: clientAccess.application_id,
      avatar_data_url: avatarDataUrl,
      notion_url: existingProfile?.notion_url || null,
      resource_links: existingProfile?.resource_links || [],
      timeline_events: existingProfile?.timeline_events || []
    });

    if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "La photo n'a pas pu être enregistrée." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar_data_url: result.data[0].avatar_data_url
    });
  } catch (error) {
    console.error("[client-avatar] upload failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue lors de l'envoi de la photo."
      },
      { status: 500 }
    );
  }
}
