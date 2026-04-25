import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { normalizeSiteContent } from "@/lib/site-content";
import { formatSupabaseAdminError } from "@/lib/supabase/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
      throw new Error("Le contenu envoyé est invalide.");
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
            "Impossible d'envoyer le visuel dans Supabase Storage. Vérifie le bucket `site-assets`."
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
    const { payload, formData } = await parsePayload(request);
    const settings = await attachUploadedSiteAssets({
      settings: normalizeSiteContent(payload),
      formData
    });
    const adminClient = createSupabaseAdminClient();
    const result = await adminClient.globalSiteSettings.upsert({
      settings,
      updated_by: session.user.id
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
      message: "Le contenu public a bien été enregistré.",
      settings
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Impossible d'enregistrer le contenu public."
      },
      { status: 500 }
    );
  }
}
