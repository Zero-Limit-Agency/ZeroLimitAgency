import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildPostCallZeroStoragePath,
  POST_CALL_ZERO_BUCKET,
  removeStorageObject,
  uploadStorageObject
} from "@/lib/supabase/storage";

export const runtime = "nodejs";

const DOCUMENTS = [
  {
    type: "welcome",
    fieldName: "welcome_file",
    fileNameField: "welcome_file_name",
    pathField: "welcome_storage_path",
    contentTypeField: "welcome_content_type",
    label: "dossier de bienvenue",
    allowedExtensions: [".pdf", ".zip"],
    allowedMimeTypes: ["application/pdf", "application/zip", "application/x-zip-compressed"]
  },
  {
    type: "quote",
    fieldName: "quote_file",
    fileNameField: "quote_file_name",
    pathField: "quote_storage_path",
    contentTypeField: "quote_content_type",
    label: "devis",
    allowedExtensions: [".pdf"],
    allowedMimeTypes: ["application/pdf"]
  },
  {
    type: "contract",
    fieldName: "contract_file",
    fileNameField: "contract_file_name",
    pathField: "contract_storage_path",
    contentTypeField: "contract_content_type",
    label: "contrat",
    allowedExtensions: [".pdf"],
    allowedMimeTypes: ["application/pdf"]
  }
];

function normalizeText(value) {
  return String(value || "").trim();
}

function hasValidExtension(fileName, allowedExtensions) {
  const lower = String(fileName || "").toLowerCase();
  return allowedExtensions.some((extension) => lower.endsWith(extension));
}

function isAllowedFile(file, document) {
  return (
    hasValidExtension(file?.name, document.allowedExtensions) ||
    document.allowedMimeTypes.includes(String(file?.type || "").toLowerCase())
  );
}

async function uploadPacketDocument(applicationId, document, file, existingPacket) {
  if (!(file instanceof File) || file.size <= 0) {
    return {
      fileName: existingPacket?.[document.fileNameField] || null,
      storagePath: existingPacket?.[document.pathField] || null,
      contentType: existingPacket?.[document.contentTypeField] || null
    };
  }

  if (!isAllowedFile(file, document)) {
    throw new Error(`Le fichier ${document.label} doit etre au format autorise.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const storagePath = buildPostCallZeroStoragePath(applicationId, document.type, file.name);
  const upload = await uploadStorageObject({
    bucket: POST_CALL_ZERO_BUCKET,
    path: storagePath,
    contentType: file.type || "application/octet-stream",
    body: Buffer.from(arrayBuffer)
  });

  if (!upload.ok) {
    throw new Error(`Impossible d'envoyer le fichier ${document.label} dans Supabase Storage.`);
  }

  const previousPath = existingPacket?.[document.pathField];

  if (previousPath && previousPath !== storagePath) {
    await removeStorageObject({
      bucket: POST_CALL_ZERO_BUCKET,
      path: previousPath
    });
  }

  return {
    fileName: file.name,
    storagePath,
    contentType: file.type || "application/octet-stream"
  };
}

export async function PATCH(request, { params }) {
  try {
    const session = await getClientSession();

    if (!session?.user || !(await isAdminUser(session.user))) {
      return NextResponse.json(
        { success: false, error: "Acces administrateur requis." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const applicationId = params.applicationId;
    const adminClient = createSupabaseAdminClient();
    const packetLookup = await adminClient.postCallZeroPackets.getByApplicationId(applicationId);
    const existingPacket =
      packetLookup.ok && Array.isArray(packetLookup.data) && packetLookup.data.length > 0
        ? packetLookup.data[0]
        : null;

    const uploads = await Promise.all(
      DOCUMENTS.map((document) =>
        uploadPacketDocument(applicationId, document, formData.get(document.fieldName), existingPacket)
      )
    );

    const packetRecord = {
      application_id: applicationId,
      summary_message: normalizeText(formData.get("summary_message")),
      payment_url: normalizeText(formData.get("payment_url")),
      status: formData.get("status") === "sent" ? "sent" : "draft",
      last_email_error: null
    };

    DOCUMENTS.forEach((document, index) => {
      packetRecord[document.fileNameField] = uploads[index].fileName;
      packetRecord[document.pathField] = uploads[index].storagePath;
      packetRecord[document.contentTypeField] = uploads[index].contentType;
    });

    const result = await adminClient.postCallZeroPackets.upsertByApplication(packetRecord);

    if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Impossible d'enregistrer le pack de demarrage client." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      packet: result.data[0],
      message: "Le pack de demarrage client a bien ete enregistre."
    });
  } catch (error) {
    console.error("[admin-post-call-zero] save failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'enregistrement du pack de demarrage client."
      },
      { status: 500 }
    );
  }
}
