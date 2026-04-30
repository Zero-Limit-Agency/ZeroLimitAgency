import { NextResponse } from "next/server";

import { getUserRole } from "@/lib/auth/admin-access";
import {
  buildUuidParamError,
  isUuidLike,
  requireAuthenticatedApiSession
} from "@/lib/auth/api-guards";
import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  downloadStorageObject,
  POST_CALL_ZERO_BUCKET
} from "@/lib/supabase/storage";

export const runtime = "nodejs";

const DOCUMENT_FIELDS = {
  welcome: {
    fileNameField: "welcome_file_name",
    pathField: "welcome_storage_path",
    contentTypeField: "welcome_content_type"
  },
  quote: {
    fileNameField: "quote_file_name",
    pathField: "quote_storage_path",
    contentTypeField: "quote_content_type"
  },
  contract: {
    fileNameField: "contract_file_name",
    pathField: "contract_storage_path",
    contentTypeField: "contract_content_type"
  }
};

export async function GET(_request, { params }) {
  try {
    const guard = await requireAuthenticatedApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const session = guard.session;
    const applicationId = String(params?.applicationId || "").trim();
    const documentType = String(params?.documentType || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const role = await getUserRole(session.user);

    if (role !== "admin") {
      const authorizedAccess = await getAuthorizedClientAccess(session.user);

      if (!authorizedAccess?.application_id || authorizedAccess.application_id !== applicationId) {
        return NextResponse.json({ success: false, error: "Acces refuse." }, { status: 403 });
      }
    }

    const document = DOCUMENT_FIELDS[documentType];

    if (!document) {
      return NextResponse.json({ success: false, error: "Document introuvable." }, { status: 404 });
    }

    const adminClient = createSupabaseAdminClient();
    const packetResult = await adminClient.postCallZeroPackets.getByApplicationId(applicationId);

    if (!packetResult.ok || !Array.isArray(packetResult.data) || packetResult.data.length === 0) {
      return NextResponse.json({ success: false, error: "Pack client introuvable." }, { status: 404 });
    }

    const packet = packetResult.data[0];
    const storagePath = packet?.[document.pathField];

    if (!storagePath) {
      return NextResponse.json({ success: false, error: "Fichier indisponible." }, { status: 404 });
    }

    const download = await downloadStorageObject({
      bucket: POST_CALL_ZERO_BUCKET,
      path: storagePath
    });

    if (!download.ok || !download.data) {
      return NextResponse.json(
        { success: false, error: "Impossible de recuperer le fichier demande." },
        { status: 500 }
      );
    }

    return new Response(download.data, {
      status: 200,
      headers: {
        "Content-Type": packet?.[document.contentTypeField] || download.contentType,
        "Content-Disposition": `attachment; filename="${packet?.[document.fileNameField] || "document"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error(
      "[client-post-call-zero-file] failed",
      error instanceof Error ? error.message : "unknown"
    );

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue lors du telechargement du document."
      },
      { status: 500 }
    );
  }
}
