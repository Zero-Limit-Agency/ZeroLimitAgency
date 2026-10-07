import { NextResponse } from "next/server";

import {
  buildUuidParamError,
  isUuidLike,
  requireAdminApiSession
} from "@/lib/auth/api-guards";
import { isCollaborationRequestType, normalizeCollaborationAttachments } from "@/lib/collaboration";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CLIENT_COLLABORATION_BUCKET, downloadStorageObject } from "@/lib/supabase/storage";

export const runtime = "nodejs";

function buildDownloadHeaders(attachment, contentType) {
  const safeName = encodeURIComponent(String(attachment?.name || "piece-jointe"));

  return {
    "Content-Type": contentType || attachment?.content_type || "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
    "Cache-Control": "private, no-store"
  };
}

export async function GET(_request, props) {
  const params = await props.params;
  try {
    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const applicationId = String(params?.applicationId || "").trim();
    const messageId = String(params?.messageId || "").trim();
    const attachmentIndex = Number(params?.attachmentIndex);

    if (!isUuidLike(applicationId) || !isUuidLike(messageId)) {
      return buildUuidParamError("Identifiant de piece jointe invalide.");
    }

    if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
      return NextResponse.json(
        { success: false, error: "Piece jointe introuvable." },
        { status: 404 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const applicationResult = await adminClient.applications.getById(applicationId);

    if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Piece jointe introuvable." },
        { status: 404 }
      );
    }

    const application = applicationResult.data[0];

    if (!isCollaborationRequestType(application?.request_type)) {
      return NextResponse.json(
        { success: false, error: "Piece jointe introuvable." },
        { status: 404 }
      );
    }

    const messageResult = await adminClient.clientCollaborationMessages.getById(messageId);

    if (!messageResult.ok || !Array.isArray(messageResult.data) || messageResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Piece jointe introuvable." },
        { status: 404 }
      );
    }

    const messageRecord = messageResult.data[0];

    if (String(messageRecord?.application_id || "").trim() !== applicationId) {
      return NextResponse.json(
        { success: false, error: "Piece jointe introuvable." },
        { status: 404 }
      );
    }

    const attachments = normalizeCollaborationAttachments(messageRecord.attachments);
    const attachment = attachments[attachmentIndex];

    if (!attachment?.path) {
      return NextResponse.json(
        { success: false, error: "Piece jointe introuvable." },
        { status: 404 }
      );
    }

    const downloadResult = await downloadStorageObject({
      bucket: CLIENT_COLLABORATION_BUCKET,
      path: attachment.path
    });

    if (!downloadResult.ok || !(downloadResult.data instanceof ArrayBuffer)) {
      return NextResponse.json(
        { success: false, error: "Piece jointe introuvable." },
        { status: 404 }
      );
    }

    return new NextResponse(Buffer.from(downloadResult.data), {
      status: 200,
      headers: buildDownloadHeaders(attachment, downloadResult.contentType)
    });
  } catch (error) {
    console.error("[admin-collaboration] attachment download failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      { success: false, error: "Impossible de telecharger la piece jointe." },
      { status: 500 }
    );
  }
}
