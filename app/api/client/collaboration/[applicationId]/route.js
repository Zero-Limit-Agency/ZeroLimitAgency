import { NextResponse } from "next/server";

import {
  buildClientCollaborationDisplayName,
  COLLABORATION_ALLOWED_EXTENSIONS,
  COLLABORATION_ALLOWED_MIME_TYPES,
  COLLABORATION_ALLOWED_SIGNATURES,
  isCollaborationRequestType,
  normalizeCollaborationMessage
} from "@/lib/collaboration";
import {
  buildUuidParamError,
  isUuidLike,
  requireAuthenticatedApiSession
} from "@/lib/auth/api-guards";
import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { assertSafeUploadBatch, clampText } from "@/lib/security/uploads";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildClientCollaborationStoragePath,
  CLIENT_COLLABORATION_BUCKET,
  removeStorageObject,
  uploadStorageObject
} from "@/lib/supabase/storage";

export const runtime = "nodejs";

function buildForbiddenResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Acces non autorise."
    },
    { status: 403 }
  );
}

async function loadAuthorizedApplication(sessionUser, applicationId) {
  const authorizedAccess = await getAuthorizedClientAccess(sessionUser);

  if (!authorizedAccess?.application_id || authorizedAccess.application_id !== applicationId) {
    return { ok: false, application: null };
  }

  const adminClient = createSupabaseAdminClient();
  const applicationResult = await adminClient.applications.getById(applicationId);

  if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
    return { ok: false, application: null };
  }

  const application = applicationResult.data[0];

  if (!isCollaborationRequestType(application?.request_type)) {
    return { ok: false, application: null };
  }

  return {
    ok: true,
    application,
    adminClient
  };
}

export async function GET(_request, { params }) {
  try {
    const guard = await requireAuthenticatedApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const access = await loadAuthorizedApplication(guard.session.user, applicationId);

    if (!access.ok) {
      return buildForbiddenResponse();
    }

    const messagesResult = await access.adminClient.clientCollaborationMessages.listByApplicationId(applicationId);

    if (!messagesResult.ok || !Array.isArray(messagesResult.data)) {
      return NextResponse.json(
        { success: false, error: "Impossible de charger la discussion." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messagesResult.data.map(normalizeCollaborationMessage)
    });
  } catch (error) {
    console.error("[client-collaboration] list failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      { success: false, error: "Impossible de charger la discussion." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const rateLimitResponse = enforceRateLimit(request, {
      key: "client-collaboration-send",
      limit: 15,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const guard = await requireAuthenticatedApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const access = await loadAuthorizedApplication(guard.session.user, applicationId);

    if (!access.ok) {
      return buildForbiddenResponse();
    }

    const formData = await request.formData();
    const message = clampText(formData.get("message"), 5000);
    const attachmentFiles = formData
      .getAll("attachments")
      .filter((item) => item instanceof File && item.size > 0);

    if (!message && attachmentFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ajoutez un message ou un fichier." },
        { status: 400 }
      );
    }

    await assertSafeUploadBatch(attachmentFiles, {
      label: "piece jointe",
      maxFiles: 5,
      maxTotalBytes: 25 * 1024 * 1024,
      maxSizeBytes: 10 * 1024 * 1024,
      allowedExtensions: COLLABORATION_ALLOWED_EXTENSIONS,
      allowedMimeTypes: COLLABORATION_ALLOWED_MIME_TYPES,
      allowedSignatures: COLLABORATION_ALLOWED_SIGNATURES,
      required: false
    });

    const messageId = crypto.randomUUID();
    const uploadedAttachments = [];

    for (const file of attachmentFiles) {
      const storagePath = buildClientCollaborationStoragePath(applicationId, messageId, file.name);
      const uploadResult = await uploadStorageObject({
        bucket: CLIENT_COLLABORATION_BUCKET,
        path: storagePath,
        contentType: file.type || "application/octet-stream",
        body: Buffer.from(await file.arrayBuffer()),
        upsert: false
      });

      if (!uploadResult.ok) {
        await Promise.all(
          uploadedAttachments.map((attachment) =>
            removeStorageObject({
              bucket: CLIENT_COLLABORATION_BUCKET,
              path: attachment.path
            }).catch(() => null)
          )
        );

        return NextResponse.json(
          { success: false, error: "Impossible d'envoyer les fichiers." },
          { status: 500 }
        );
      }

      uploadedAttachments.push({
        name: file.name,
        path: storagePath,
        content_type: file.type || "application/octet-stream",
        size: file.size
      });
    }

    const authorName = buildClientCollaborationDisplayName(access.application);
    const createResult = await access.adminClient.clientCollaborationMessages.create({
      id: messageId,
      application_id: applicationId,
      author_user_id: guard.session.user.id,
      author_role: "client",
      author_name: authorName,
      message,
      attachments: uploadedAttachments
    });

    if (!createResult.ok || !Array.isArray(createResult.data) || createResult.data.length === 0) {
      await Promise.all(
        uploadedAttachments.map((attachment) =>
          removeStorageObject({
            bucket: CLIENT_COLLABORATION_BUCKET,
            path: attachment.path
          }).catch(() => null)
        )
      );

      return NextResponse.json(
        { success: false, error: "Impossible d'envoyer le message." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageRecord: normalizeCollaborationMessage(createResult.data[0])
    });
  } catch (error) {
    console.error("[client-collaboration] send failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      { success: false, error: "Impossible d'envoyer le message." },
      { status: 500 }
    );
  }
}
