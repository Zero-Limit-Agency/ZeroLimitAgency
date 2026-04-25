import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import {
  buildManualClientEmail,
  sendZeroLimitEmail
} from "@/lib/emails/zero-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 12 * 1024 * 1024;

function normalizeText(value) {
  return String(value || "").trim();
}

async function requireAdminSession() {
  const session = await getClientSession();

  if (!session?.user || !(await isAdminUser(session.user))) {
    return null;
  }

  return session;
}

export async function POST(request, { params }) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Acces administrateur requis." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const applicationId = params.applicationId;
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
      if (file.size > MAX_ATTACHMENT_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `Le fichier ${file.name} depasse la taille maximale autorisee.`
          },
          { status: 400 }
        );
      }
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
    console.error("[admin-manual-email] send failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'envoi de l'email."
      },
      { status: 500 }
    );
  }
}
