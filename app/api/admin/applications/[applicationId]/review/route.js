import { NextResponse } from "next/server";

import {
  buildUuidParamError,
  isUuidLike,
  requireAdminApiSession
} from "@/lib/auth/api-guards";
import {
  buildApprovalEmail,
  buildRejectionEmail,
  sendZeroLimitEmail
} from "@/lib/emails/zero-limit";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const rateLimitResponse = enforceRateLimit(request, {
      key: "admin-application-review",
      limit: 10,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "").trim();
    const applicationId = String(params?.applicationId || "").trim();

    if (!isUuidLike(applicationId)) {
      return buildUuidParamError("Identifiant de dossier invalide.");
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action de revue invalide." },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const applicationResult = await adminClient.applications.getById(applicationId);

    if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Requete introuvable." },
        { status: 404 }
      );
    }

    const application = applicationResult.data[0];

    if (action === "approve") {
      const statusUpdate = await adminClient.applications.update(applicationId, {
        status: "approved"
      });

      if (!statusUpdate.ok) {
        return NextResponse.json(
          { success: false, error: "Impossible de valider cette requete." },
          { status: 500 }
        );
      }

      const authLookup = await adminClient.auth.findUserByEmail(application.email);
      const authUserId = authLookup.ok && authLookup.data?.id ? authLookup.data.id : null;

      if (authUserId) {
        await adminClient.clientAccess.upsertByApplication({
          user_id: authUserId,
          application_id: applicationId,
          email: application.email,
          role: "client",
          status: "active",
          revoked_at: null,
          last_email_error: null
        });

        await adminClient.userRoles.upsert({
          user_id: authUserId,
          role: "client"
        });
      }

      const existingProfileResult = await adminClient.clientProfiles.getByApplicationId(applicationId);
      const existingProfile =
        existingProfileResult.ok &&
        Array.isArray(existingProfileResult.data) &&
        existingProfileResult.data.length > 0
          ? existingProfileResult.data[0]
          : null;

      await adminClient.clientProfiles.upsertByApplication({
        user_id: existingProfile?.user_id || authUserId || null,
        application_id: applicationId,
        avatar_data_url: existingProfile?.avatar_data_url || null,
        notion_url: existingProfile?.notion_url || null,
        space_status: existingProfile?.space_status || "preparing",
        market_access_enabled: Boolean(existingProfile?.market_access_enabled),
        resource_links: Array.isArray(existingProfile?.resource_links) ? existingProfile.resource_links : [],
        timeline_events: Array.isArray(existingProfile?.timeline_events) ? existingProfile.timeline_events : []
      });

      const approvalEmail = buildApprovalEmail({
        application: {
          ...application,
          status: "approved"
        }
      });
      const approvalEmailResult = await sendZeroLimitEmail({
        to: application.email,
        from: process.env.INSCRIPTIONS_EMAIL,
        ...approvalEmail
      });

      return NextResponse.json({
        success: true,
        action,
        application: statusUpdate.data?.[0] || null,
        message:
          !approvalEmailResult.ok && !approvalEmailResult.skipped
            ? application.status === "approved"
              ? "Le client etait deja valide. Le dossier reste disponible dans la section clients, mais l'email n'a pas pu etre renvoye automatiquement."
              : "La demande a ete acceptee. Le client peut maintenant se connecter, mais l'email d'acceptation n'a pas pu etre envoye automatiquement."
            : application.status === "approved"
              ? "Le client etait deja valide. Le dossier reste disponible dans la section clients."
              : "La demande a ete acceptee. Le client peut maintenant se connecter et verra un espace en preparation jusqu'au deblocage de l'accompagnement."
      });
    }

    const rejectionUpdate = await adminClient.applications.update(applicationId, {
      status: "rejected"
    });

    if (!rejectionUpdate.ok) {
      return NextResponse.json(
        { success: false, error: "Impossible de refuser cette requete." },
        { status: 500 }
      );
    }

    const rejectionEmail = buildRejectionEmail({ application });
    const emailResult = await sendZeroLimitEmail({
      to: application.email,
      from: process.env.INSCRIPTIONS_EMAIL,
      ...rejectionEmail
    });

    return NextResponse.json({
      success: true,
      action,
      application: rejectionUpdate.data?.[0] || null,
      message: emailResult.ok
        ? "La demande a ete refusee, retiree des dossiers en attente et l'email de refus a ete envoye."
        : "La demande a ete refusee et deplacee vers les refuses. L'email de refus n'a pas pu etre envoye automatiquement."
    });
  } catch (error) {
    console.error("[admin-review] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue pendant le traitement de la requete."
      },
      { status: 500 }
    );
  }
}
