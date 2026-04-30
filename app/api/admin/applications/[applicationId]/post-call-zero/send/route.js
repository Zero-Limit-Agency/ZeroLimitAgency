import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import {
  buildUuidParamError,
  isUuidLike,
  requireAdminApiSession
} from "@/lib/auth/api-guards";
import {
  buildPostCallZeroPacketEmail,
  sendZeroLimitEmail
} from "@/lib/emails/zero-limit";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  downloadStorageObject,
  POST_CALL_ZERO_BUCKET
} from "@/lib/supabase/storage";

export const runtime = "nodejs";

const DOCUMENT_FIELDS = [
  {
    type: "welcome",
    fileNameField: "welcome_file_name",
    pathField: "welcome_storage_path",
    contentTypeField: "welcome_content_type",
    resourceKey: "post-call-zero-welcome",
    resourceName: "Dossier de bienvenue",
    resourceKind: "Onboarding"
  },
  {
    type: "quote",
    fileNameField: "quote_file_name",
    pathField: "quote_storage_path",
    contentTypeField: "quote_content_type",
    resourceKey: "post-call-zero-quote",
    resourceName: "Devis",
    resourceKind: "Document"
  },
  {
    type: "contract",
    fileNameField: "contract_file_name",
    pathField: "contract_storage_path",
    contentTypeField: "contract_content_type",
    resourceKey: "post-call-zero-contract",
    resourceName: "Contrat",
    resourceKind: "Document"
  }
];

function buildClientDocumentUrl(applicationId, documentType) {
  return `/api/client/post-call-zero-files/${applicationId}/${documentType}`;
}

function mergeResources(existingResources, applicationId, packet) {
  const current = Array.isArray(existingResources) ? existingResources : [];
  const map = new Map(current.map((item) => [item.key, item]));

  DOCUMENT_FIELDS.forEach((field) => {
    if (!packet?.[field.pathField]) {
      return;
    }

    map.set(field.resourceKey, {
      key: field.resourceKey,
      name: packet[field.fileNameField] || field.resourceName,
      kind: field.resourceKind,
      description: `${field.resourceName} transmis dans le pack de demarrage client.`,
      url: buildClientDocumentUrl(applicationId, field.type),
      logo_url: ""
    });
  });

  if (packet?.payment_url) {
    map.set("post-call-zero-payment", {
      key: "post-call-zero-payment",
      name: "Paiement",
      kind: "Stripe",
      description: "Lien de paiement du pack de demarrage client.",
      url: packet.payment_url,
      logo_url: ""
    });
  }

  return Array.from(map.values());
}

function mergeTimeline(existingEvents) {
  const current = Array.isArray(existingEvents) ? existingEvents : [];
  const packetEvent = {
    key: "post-call-zero-sent",
    label: "Pack de demarrage envoye",
    date: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long"
    }).format(new Date()),
    description: "Le pack de demarrage client a ete envoye avec les documents et le lien de paiement.",
    tone: "done"
  };

  return [...current.filter((item) => item?.key !== packetEvent.key), packetEvent];
}

async function buildAttachments(packet) {
  const attachments = [];

  for (const field of DOCUMENT_FIELDS) {
    const storagePath = packet?.[field.pathField];
    const fileName = packet?.[field.fileNameField];

    if (!storagePath || !fileName) {
      throw new Error(`Le document ${field.resourceName.toLowerCase()} est manquant.`);
    }

    const download = await downloadStorageObject({
      bucket: POST_CALL_ZERO_BUCKET,
      path: storagePath
    });

    if (!download.ok || !download.data) {
      throw new Error(`Impossible de recuperer ${field.resourceName.toLowerCase()} depuis le stockage.`);
    }

    attachments.push({
      filename: fileName,
      content: Buffer.from(download.data).toString("base64"),
      contentType: packet?.[field.contentTypeField] || download.contentType || "application/octet-stream"
    });
  }

  return attachments;
}

export async function POST(_request, { params }) {
  try {
    const rateLimitResponse = enforceRateLimit(request, {
      key: "admin-post-call-zero-send",
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

    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const adminClient = createSupabaseAdminClient();
    const [applicationResult, packetResult, profileResult] = await Promise.all([
      adminClient.applications.getById(applicationId),
      adminClient.postCallZeroPackets.getByApplicationId(applicationId),
      adminClient.clientProfiles.getByApplicationId(applicationId)
    ]);

    if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Dossier client introuvable." },
        { status: 404 }
      );
    }

    if (!packetResult.ok || !Array.isArray(packetResult.data) || packetResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun pack de demarrage client n'a encore ete prepare pour ce dossier." },
        { status: 404 }
      );
    }

    const application = applicationResult.data[0];
    const packet = packetResult.data[0];
    const profile =
      profileResult.ok && Array.isArray(profileResult.data) && profileResult.data.length > 0
        ? profileResult.data[0]
        : null;

    if (!packet.summary_message || !packet.payment_url) {
      return NextResponse.json(
        {
          success: false,
          error: "Le pack doit contenir un resume personnalise et un lien de paiement avant l'envoi."
        },
        { status: 400 }
      );
    }

    const attachments = await buildAttachments(packet);
    const emailPayload = buildPostCallZeroPacketEmail({
      application,
      packet
    });

    const emailResult = await sendZeroLimitEmail({
      to: application.email,
      from: process.env.CLIENT_EMAIL,
      ...emailPayload,
      attachments
    });

    if (!emailResult.ok) {
      await adminClient.postCallZeroPackets.updateByApplication(applicationId, {
        last_email_error: emailResult.error || "L'email du pack de demarrage n'a pas pu etre envoye."
      });

      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "L'email du pack de demarrage n'a pas pu etre envoye."
        },
        { status: emailResult.skipped ? 400 : 500 }
      );
    }

    const nowIso = new Date().toISOString();

    await adminClient.postCallZeroPackets.updateByApplication(applicationId, {
      status: "sent",
      sent_at: packet.sent_at || nowIso,
      last_sent_at: nowIso,
      last_email_error: null
    });

    await adminClient.clientProfiles.upsertByApplication({
      user_id: profile?.user_id || null,
      application_id: applicationId,
      avatar_data_url: profile?.avatar_data_url || null,
      notion_url: profile?.notion_url || null,
      space_status: profile?.space_status || "preparing",
      market_access_enabled: Boolean(profile?.market_access_enabled),
      resource_links: mergeResources(profile?.resource_links, applicationId, packet),
      timeline_events: mergeTimeline(profile?.timeline_events)
    });

    return NextResponse.json({
      success: true,
      message: "Le pack de demarrage client a bien ete envoye et l'espace client a ete mis a jour."
    });
  } catch (error) {
    console.error(
      "[admin-post-call-zero-send] failed",
      error instanceof Error ? error.message : "unknown"
    );

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue lors de l'envoi du pack de demarrage client."
      },
      { status: 500 }
    );
  }
}
