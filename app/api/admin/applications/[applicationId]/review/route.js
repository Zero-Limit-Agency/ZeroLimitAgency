import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import {
  buildApprovalEmail,
  buildRejectionEmail,
  sendZeroLimitEmail
} from "@/lib/emails/zero-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const session = await getClientSession();

    if (!session?.user || !(await isAdminUser(session.user))) {
      return NextResponse.json(
        { success: false, error: "Accès administrateur requis." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "").trim();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action de revue invalide." },
        { status: 400 }
      );
    }

    const applicationId = params.applicationId;
    const adminClient = createSupabaseAdminClient();
    const applicationResult = await adminClient.applications.getById(applicationId);

    if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Requête introuvable." },
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
          { success: false, error: "Impossible de valider cette requête." },
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
        message: !approvalEmailResult.ok && !approvalEmailResult.skipped
          ? application.status === "approved"
            ? "Le client était déjà validé. Le dossier reste disponible dans la section clients, mais l'email n'a pas pu être renvoyé automatiquement."
            : "La demande a été acceptée. Le client peut maintenant se connecter, mais l'email d'acceptation n'a pas pu être envoyé automatiquement."
          : application.status === "approved"
            ? "Le client était déjà validé. Le dossier reste disponible dans la section clients."
            : "La demande a été acceptée. Le client peut maintenant se connecter et verra un espace en préparation jusqu'au déblocage de l'accompagnement."
      });
    }

    const rejectionUpdate = await adminClient.applications.update(applicationId, {
      status: "rejected"
    });

    if (!rejectionUpdate.ok) {
      return NextResponse.json(
        { success: false, error: "Impossible de refuser cette requête." },
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
        ? "La demande a été refusée, retirée des dossiers en attente et l'email de refus a été envoyé."
        : "La demande a été refusée et déplacée vers les refusés. L'email de refus n'a pas pu être envoyé automatiquement."
    });
  } catch (error) {
    console.error("[admin-review] failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant le traitement de la requête."
      },
      { status: 500 }
    );
  }
}
