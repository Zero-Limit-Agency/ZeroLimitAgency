import { NextResponse } from "next/server";

import {
  buildUuidParamError,
  isUuidLike,
  requireAdminApiSession
} from "@/lib/auth/api-guards";
import {
  COLLABORATION_ALLOWED_EXTENSIONS,
  COLLABORATION_ALLOWED_MIME_TYPES,
  COLLABORATION_ALLOWED_SIGNATURES,
  isCollaborationRequestType,
  normalizeCollaborationMessage
} from "@/lib/collaboration";
import {
  buildCollaborationClientNotificationEmail,
  sendZeroLimitEmail
} from "@/lib/emails/zero-limit";
import { normalizeSiteContent } from "@/lib/site-content";
import { assertSafeUploadBatch, clampText } from "@/lib/security/uploads";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildClientCollaborationStoragePath,
  CLIENT_COLLABORATION_BUCKET,
  removeStorageObject,
  uploadStorageObject
} from "@/lib/supabase/storage";

export const runtime = "nodejs";

async function loadApplication(adminClient, applicationId) {
  const applicationResult = await adminClient.applications.getById(applicationId);

  if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
    return null;
  }

  const application = applicationResult.data[0];
  return isCollaborationRequestType(application?.request_type) ? application : null;
}

export async function GET(_request, { params }) {
  try {
    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const adminClient = createSupabaseAdminClient();
    const application = await loadApplication(adminClient, applicationId);

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Dossier introuvable." },
        { status: 404 }
      );
    }

    const messagesResult = await adminClient.clientCollaborationMessages.listByApplicationId(applicationId);

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
    console.error("[admin-collaboration] list failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      { success: false, error: "Impossible de charger la discussion." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const rateLimitResponse = await checkRateLimit(request, {
      key: "admin-collaboration-send",
      limit: 20,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const adminClient = createSupabaseAdminClient();
    const application = await loadApplication(adminClient, applicationId);

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Dossier introuvable." },
        { status: 404 }
      );
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

    const createResult = await adminClient.clientCollaborationMessages.create({
      id: messageId,
      application_id: applicationId,
      author_user_id: guard.session.user.id,
      author_role: "admin",
      author_name: "Zero Limit Agency",
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

    const siteContentResult = await adminClient.globalSiteSettings.get();
    const siteContentSettings =
      siteContentResult.ok && Array.isArray(siteContentResult.data) && siteContentResult.data.length > 0
        ? normalizeSiteContent(siteContentResult.data[0]?.settings || {})
        : null;
    const supportEmail =
      siteContentSettings?.support?.contactEmail ||
      process.env.CLIENT_SUPPORT_EMAIL ||
      process.env.CLIENT_EMAIL ||
      "contact@zerolimit.agency";

    if (application.email) {
      const emailPayload = buildCollaborationClientNotificationEmail({
        application,
        message,
        attachmentCount: uploadedAttachments.length
      });

      await sendZeroLimitEmail({
        to: application.email,
        from: process.env.CLIENT_EMAIL,
        replyTo: supportEmail || undefined,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text
      });
    }

    return NextResponse.json({
      success: true,
      messageRecord: normalizeCollaborationMessage(createResult.data[0])
    });
  } catch (error) {
    console.error("[admin-collaboration] send failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      { success: false, error: "Impossible d'envoyer le message." },
      { status: 500 }
    );
  }
}
