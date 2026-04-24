import { NextResponse } from "next/server";

import { getUserRole } from "@/lib/auth/admin-access";
import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { getClientSession } from "@/lib/auth/client-auth";
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
    const session = await getClientSession();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Connexion requise." }, { status: 401 });
    }

    const role = await getUserRole(session.user);
    const applicationId = params.applicationId;

    if (role !== "admin") {
      const authorizedAccess = await getAuthorizedClientAccess(session.user);

      if (!authorizedAccess?.application_id || authorizedAccess.application_id !== applicationId) {
        return NextResponse.json({ success: false, error: "Acces refuse." }, { status: 403 });
      }
    }

    const document = DOCUMENT_FIELDS[params.documentType];

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
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    console.error("[client-post-call-zero-file] failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors du telechargement du document."
      },
      { status: 500 }
    );
  }
}
