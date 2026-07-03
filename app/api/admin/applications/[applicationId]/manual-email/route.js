import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import {
  buildUuidParamError,
  isUuidLike,
  requireAdminApiSession
} from "@/lib/auth/api-guards";
import {
  buildManualClientEmail,
  sendZeroLimitEmail
} from "@/lib/emails/zero-limit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertSafeUpload } from "@/lib/security/uploads";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 12 * 1024 * 1024;

function normalizeText(value) {
  return String(value || "").trim();
}

export async function POST(request, { params }) {
  try {
    const rateLimitResponse = await checkRateLimit(request, {
      key: "admin-manual-email",
      limit: 5,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const formData = await request.formData();
    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const subject = normalizeText(formData.get("subject"));
    const message = normalizeText(formData.get("message"));

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: "Le sujet et le message sont obligatoires." },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const applicationResult = await adminClient.applications.getById(applicationId);

    if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Dossier client introuvable." },
        { status: 404 }
      );
    }

    const application = applicationResult.data[0];

    if (!normalizeText(application.email)) {
      return NextResponse.json(
        { success: false, error: "Aucune adresse email client n'est disponible pour ce dossier." },
        { status: 400 }
      );
    }

    const files = formData
      .getAll("attachments")
      .filter((value) => value instanceof File && value.size > 0)
      .slice(0, MAX_ATTACHMENTS);

    for (const file of files) {
      await assertSafeUpload(file, {
        label: `piece jointe ${file.name}`,
        maxSizeBytes: MAX_ATTACHMENT_SIZE,
        allowedExtensions: [
          ".pdf",
          ".png",
          ".jpg",
          ".jpeg",
          ".webp",
          ".zip",
          ".doc",
          ".docx",
          ".xls",
          ".xlsx",
          ".txt"
        ],
        allowedMimeTypes: [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/webp",
          "application/zip",
          "application/x-zip-compressed",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain"
        ]
      });
    }

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()).toString("base64"),
        contentType: file.type || "application/octet-stream"
      }))
    );

    const emailPayload = buildManualClientEmail({
      application,
      subject,
      message
    });

    const emailResult = await sendZeroLimitEmail({
      to: application.email,
      from: process.env.CLIENT_EMAIL,
      ...emailPayload,
      attachments
    });

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Impossible d'envoyer l'email au client."
        },
        { status: emailResult.skipped ? 400 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "L'email a bien ete envoye au client."
    });
  } catch (error) {
    console.error("[admin-manual-email] send failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue lors de l'envoi de l'email."
      },
      { status: 500 }
    );
  }
}
