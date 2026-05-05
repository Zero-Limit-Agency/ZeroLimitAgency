import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/api-guards";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSafeUpload } from "@/lib/security/uploads";
import { normalizeSiteContent } from "@/lib/site-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatSupabaseAdminError } from "@/lib/supabase/errors";
import {
  buildSiteAssetStoragePath,
  getPublicStorageUrl,
  SITE_ASSETS_BUCKET,
  uploadStorageObject
} from "@/lib/supabase/storage";

async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawPayload = formData.get("payload");

    if (typeof rawPayload !== "string") {
      throw new Error("Le contenu envoye est invalide.");
    }

    return {
      payload: JSON.parse(rawPayload),
      formData
    };
  }

  return {
    payload: await request.json(),
    formData: null
  };
}

async function attachUploadedSiteAssets({ settings, formData }) {
  if (!formData) {
    return settings;
  }

  const nextSettings = {
    ...settings,
    projects: {
      ...settings.projects,
      items: settings.projects.items.map((item) => ({ ...item }))
    },
    news: {
      ...settings.news,
      items: settings.news.items.map((item) => ({ ...item }))
    }
  };

  for (const section of ["projects", "news"]) {
    for (const [index, item] of nextSettings[section].items.entries()) {
      const file = formData.get(`${section}-${index}-image`);

      if (!(file instanceof File) || file.size <= 0) {
        continue;
      }

      await assertSafeUpload(file, {
        label: "visuel",
        maxSizeBytes: 8 * 1024 * 1024,
        allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
        allowedSignatures: ["png", "jpeg", "webp"]
      });

      const path = buildSiteAssetStoragePath(section, item.id, file.name);
      const upload = await uploadStorageObject({
        bucket: SITE_ASSETS_BUCKET,
        path,
        contentType: file.type || "application/octet-stream",
        body: Buffer.from(await file.arrayBuffer())
      });

      if (!upload.ok) {
        throw new Error(
          upload.error ||
            "Impossible d'envoyer le visuel dans Supabase Storage. Verifiez le bucket `site-assets`."
        );
      }

      item.image = getPublicStorageUrl({
        bucket: SITE_ASSETS_BUCKET,
        path
      });
    }
  }

  return nextSettings;
}

export async function PATCH(request) {
  const rateLimitResponse = enforceRateLimit(request, {
    key: "admin-site-content",
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
    const { payload, formData } = await parsePayload(request);
    const adminClient = createSupabaseAdminClient();
    const currentSettingsResult = await adminClient.globalSiteSettings.get();
    const currentSettings =
      currentSettingsResult.ok && Array.isArray(currentSettingsResult.data) && currentSettingsResult.data.length > 0
        ? normalizeSiteContent(currentSettingsResult.data[0]?.settings || {})
        : normalizeSiteContent({});
    const settings = await attachUploadedSiteAssets({
      settings: {
        ...normalizeSiteContent(payload),
        support: payload?.support ? normalizeSiteContent({ support: payload.support }).support : currentSettings.support
      },
      formData
    });
    const result = await adminClient.globalSiteSettings.upsert({
      settings,
      updated_by: guard.session.user.id
    });

    if (!result.ok) {
      const errorMessage = formatSupabaseAdminError(
        result.data,
        "Impossible d'enregistrer le contenu public."
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
      message: "Le contenu public a bien ete enregistre.",
      settings
    });
  } catch (error) {
    console.error("[admin-site-content] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Impossible d'enregistrer le contenu public."
      },
      { status: 500 }
    );
  }
}
