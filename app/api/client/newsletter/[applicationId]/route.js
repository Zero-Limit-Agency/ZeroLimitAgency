import { NextResponse } from "next/server";

import {
  buildUuidParamError,
  isUuidLike,
  requireAuthenticatedApiSession
} from "@/lib/auth/api-guards";
import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function buildForbiddenResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Accès non autorisé."
    },
    { status: 403 }
  );
}

async function loadAuthorizedApplication(sessionUser, applicationId) {
  const authorizedAccess = await getAuthorizedClientAccess(sessionUser);

  if (!authorizedAccess?.application_id || authorizedAccess.application_id !== applicationId) {
    return { ok: false, application: null, adminClient: null };
  }

  const adminClient = createSupabaseAdminClient();
  const applicationResult = await adminClient.applications.getById(applicationId);

  if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
    return { ok: false, application: null, adminClient: null };
  }

  return {
    ok: true,
    application: applicationResult.data[0],
    adminClient
  };
}

export async function PATCH(request, props) {
  const params = await props.params;
  try {
    const rateLimitResponse = await checkRateLimit(request, {
      key: "client-newsletter-toggle",
      limit: 10,
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

    if (!access.ok || !access.application) {
      return buildForbiddenResponse();
    }

    const body = await request.json().catch(() => null);
    const subscribed = Boolean(body?.subscribed);
    const nowIso = new Date().toISOString();

    const applicationUpdate = await access.adminClient.applications.update(applicationId, {
      newsletter_opt_in: subscribed
    });

    if (!applicationUpdate.ok) {
      return NextResponse.json(
        { success: false, error: "Impossible de mettre à jour la newsletter." },
        { status: 500 }
      );
    }

    const newsletterUpsert = await access.adminClient.newsletterSubscriptions.upsert({
      email: access.application.email,
      application_id: applicationId,
      source: "client_space",
      language: access.application.language || null,
      country: access.application.country || null,
      status: subscribed ? "subscribed" : "unsubscribed",
      subscribed_at: subscribed ? nowIso : access.application.created_at || nowIso,
      unsubscribed_at: subscribed ? null : nowIso
    });

    if (!newsletterUpsert.ok) {
      return NextResponse.json(
        { success: false, error: "Impossible de mettre à jour la newsletter." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscribed
    });
  } catch (error) {
    console.error("[client-newsletter] update failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Impossible de mettre à jour la newsletter."
      },
      { status: 500 }
    );
  }
}
