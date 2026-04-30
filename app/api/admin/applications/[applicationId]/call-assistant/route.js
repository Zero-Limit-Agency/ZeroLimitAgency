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
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeImportantDates(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      key: normalizeText(item?.key) || `important-date-${index + 1}`,
      label: normalizeText(item?.label),
      value: normalizeText(item?.value)
    }))
    .filter((item) => item.label || item.value);
}

function normalizeInternalTasks(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      key: normalizeText(item?.key) || `internal-task-${index + 1}`,
      label: normalizeText(item?.label)
    }))
    .filter((item) => item.label);
}

function normalizeTimelineEvents(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      key: normalizeText(item?.key) || `call-event-${index + 1}`,
      label: normalizeText(item?.label),
      date: normalizeText(item?.date),
      description: normalizeText(item?.description),
      tone: ["done", "current", "upcoming"].includes(item?.tone) ? item.tone : "upcoming",
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1
    }))
    .filter((item) => item.label || item.description || item.date)
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({
      ...item,
      order: index + 1
    }));
}

function mergeTimelineEvents(existingEvents, suggestedEvents) {
  const current = Array.isArray(existingEvents) ? existingEvents : [];
  const normalizedCurrent = current
    .map((item, index) => ({
      key: normalizeText(item?.key) || `timeline-${index + 1}`,
      label: normalizeText(item?.label),
      date: normalizeText(item?.date),
      description: normalizeText(item?.description),
      tone: ["done", "current", "upcoming"].includes(item?.tone) ? item.tone : "upcoming",
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1
    }))
    .filter((item) => item.label || item.description || item.date);

  const offset = normalizedCurrent.length;
  const normalizedSuggested = normalizeTimelineEvents(suggestedEvents).map((item, index) => ({
    ...item,
    key: item.key || `call-suggested-${index + 1}`,
    order: offset + index + 1
  }));

  return [...normalizedCurrent, ...normalizedSuggested].map((item, index) => ({
    ...item,
    order: index + 1
  }));
}

export async function PATCH(request, { params }) {
  try {
    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const body = await request.json();
    const adminClient = createSupabaseAdminClient();

    const reportRecord = {
      application_id: applicationId,
      call_type: ["intro", "training", "follow_up", "other"].includes(body?.call_type)
        ? body.call_type
        : "intro",
      raw_notes: normalizeText(body?.raw_notes),
      client_summary: normalizeText(body?.client_summary),
      suggested_email: normalizeText(body?.suggested_email),
      suggested_timeline_events: normalizeTimelineEvents(body?.suggested_timeline_events),
      internal_tasks: normalizeInternalTasks(body?.internal_tasks),
      important_dates: normalizeImportantDates(body?.important_dates),
      status: ["draft", "applied", "sent"].includes(body?.status) ? body.status : "draft"
    };

    const result = await adminClient.clientCallReports.upsertByApplication(reportRecord);

    if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Impossible d'enregistrer le brouillon d'appel." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report: result.data[0],
      message: "Le brouillon d'assistant d'appel a bien ete enregistre."
    });
  } catch (error) {
    console.error("[call-assistant] save failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue lors de l'enregistrement du brouillon."
      },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    const body = await request.json();
    const action = normalizeText(body?.action);
    const adminClient = createSupabaseAdminClient();

    const [applicationResult, profileResult, reportResult] = await Promise.all([
      adminClient.applications.getById(applicationId),
      adminClient.clientProfiles.getByApplicationId(applicationId),
      adminClient.clientCallReports.getByApplicationId(applicationId)
    ]);

    if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Dossier client introuvable." },
        { status: 404 }
      );
    }

    if (!reportResult.ok || !Array.isArray(reportResult.data) || reportResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun brouillon d'assistant d'appel n'est disponible pour ce dossier." },
        { status: 404 }
      );
    }

    const application = applicationResult.data[0];
    const profile =
      profileResult.ok && Array.isArray(profileResult.data) && profileResult.data.length > 0
        ? profileResult.data[0]
        : null;
    const report = reportResult.data[0];

    if (action === "apply") {
      const profileResultUpdate = await adminClient.clientProfiles.upsertByApplication({
        user_id: profile?.user_id || null,
        application_id: applicationId,
        avatar_data_url: profile?.avatar_data_url || null,
        notion_url: profile?.notion_url || null,
        space_status: profile?.space_status || "preparing",
        market_access_enabled: Boolean(profile?.market_access_enabled),
        resource_links: Array.isArray(profile?.resource_links) ? profile.resource_links : [],
        timeline_events: mergeTimelineEvents(profile?.timeline_events, report.suggested_timeline_events)
      });

      if (!profileResultUpdate.ok) {
        return NextResponse.json(
          { success: false, error: "Impossible d'appliquer le brouillon a l'espace client." },
          { status: 500 }
        );
      }

      await adminClient.applications.update(applicationId, {
        message_rewritten:
          normalizeText(report.client_summary) || application.message_rewritten || application.message_raw
      });

      await adminClient.clientCallReports.updateByApplication(applicationId, {
        status: "applied"
      });

      return NextResponse.json({
        success: true,
        message: "Le brouillon a bien ete applique a l'espace client."
      });
    }

    if (action === "send_email") {
      if (!normalizeText(application.email)) {
        return NextResponse.json(
          { success: false, error: "Aucune adresse email client n'est disponible pour ce dossier." },
          { status: 400 }
        );
      }

      const emailPayload = buildManualClientEmail({
        application,
        subject: `Suite a votre ${report.call_type === "training" ? "formation" : "appel"} Zero Limit Agency`,
        message: normalizeText(report.suggested_email) || normalizeText(report.client_summary)
      });

      const emailResult = await sendZeroLimitEmail({
        to: application.email,
        from: process.env.CLIENT_EMAIL,
        ...emailPayload
      });

      if (!emailResult.ok) {
        return NextResponse.json(
          { success: false, error: emailResult.error || "Impossible d'envoyer l'email au client." },
          { status: emailResult.skipped ? 400 : 500 }
        );
      }

      await adminClient.clientCallReports.updateByApplication(applicationId, {
        status: "sent"
      });

      return NextResponse.json({
        success: true,
        message: "L'email propose a bien ete envoye au client."
      });
    }

    return NextResponse.json(
      { success: false, error: "Action d'assistant d'appel non reconnue." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[call-assistant] action failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue lors du traitement de l'assistant d'appel."
      },
      { status: 500 }
    );
  }
}
