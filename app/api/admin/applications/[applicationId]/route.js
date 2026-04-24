import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { POST_CALL_ZERO_BUCKET, removeStorageObject } from "@/lib/supabase/storage";

export const runtime = "nodejs";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeResourceLinks(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      key: normalizeText(item?.key) || `resource-${index + 1}`,
      name: normalizeText(item?.name),
      kind: normalizeText(item?.kind),
      description: normalizeText(item?.description),
      url: normalizeText(item?.url),
      logo_url: normalizeText(item?.logo_url)
    }))
    .filter((item) => item.name || item.url || item.description);
}

function normalizeTimelineEvents(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => ({
      key: normalizeText(item?.key) || `timeline-${index + 1}`,
      label: normalizeText(item?.label),
      date: normalizeText(item?.date),
      description: normalizeText(item?.description),
      tone: ["done", "current", "upcoming"].includes(item?.tone) ? item.tone : "upcoming"
    }))
    .filter((item) => item.label || item.description || item.date);
}

async function requireAdminSession() {
  const session = await getClientSession();

  if (!session?.user || !(await isAdminUser(session.user))) {
    return null;
  }

  return session;
}

export async function PATCH(request, { params }) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Acces administrateur requis." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const applicationId = params.applicationId;
    const adminClient = createSupabaseAdminClient();

    const applicationRecord = {
      first_name: normalizeText(body?.application?.first_name),
      last_name: normalizeText(body?.application?.last_name),
      pseudo: normalizeText(body?.application?.pseudo),
      email: normalizeText(body?.application?.email),
      request_type: normalizeText(body?.application?.request_type),
      company: normalizeText(body?.application?.company),
      country: normalizeText(body?.application?.country),
      language: normalizeText(body?.application?.language),
      message_rewritten: normalizeText(body?.application?.message_rewritten),
      drive_folder_url: normalizeText(body?.application?.drive_folder_url)
    };

    const updateApplication = await adminClient.applications.update(applicationId, applicationRecord);

    if (!updateApplication.ok || !Array.isArray(updateApplication.data) || updateApplication.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Impossible de mettre a jour le dossier client." },
        { status: 500 }
      );
    }

    const profileLookup = await adminClient.clientProfiles.getByApplicationId(applicationId);
    const accessLookup = await adminClient.clientAccess.getByApplicationId(applicationId);

    const existingProfile =
      profileLookup.ok && Array.isArray(profileLookup.data) && profileLookup.data.length > 0
        ? profileLookup.data[0]
        : null;

    const linkedAccess =
      accessLookup.ok && Array.isArray(accessLookup.data) && accessLookup.data.length > 0
        ? accessLookup.data[0]
        : null;

    const profileRecord = {
      notion_url: normalizeText(body?.profile?.notion_url),
      space_status: body?.profile?.space_status === "active" ? "active" : "preparing",
      market_access_enabled: Boolean(body?.profile?.market_access_enabled),
      resource_links: normalizeResourceLinks(body?.profile?.resource_links),
      timeline_events: normalizeTimelineEvents(body?.profile?.timeline_events),
      avatar_data_url: existingProfile?.avatar_data_url || null
    };

    let profileResult;

    if (existingProfile) {
      profileResult = await adminClient.clientProfiles.updateByApplication(applicationId, {
        ...profileRecord,
        user_id: existingProfile.user_id || linkedAccess?.user_id || null
      });
    } else {
      profileResult = await adminClient.clientProfiles.upsertByApplication({
        ...profileRecord,
        user_id: linkedAccess?.user_id || null,
        application_id: applicationId
      });
    }

    if (!profileResult?.ok) {
      const rawError =
        profileResult?.error ||
        profileResult?.data?.message ||
        "Le profil enrichi n'a pas pu etre enregistre.";

      return NextResponse.json(
        { success: false, error: rawError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application: updateApplication.data[0],
      message: "Le dossier client et le profil enrichi ont bien ete mis a jour."
    });
  } catch (error) {
    console.error("[admin-application] update failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la mise a jour du dossier."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Acces administrateur requis." },
        { status: 403 }
      );
    }

    const applicationId = params.applicationId;
    const adminClient = createSupabaseAdminClient();

    const applicationLookup = await adminClient.applications.getById(applicationId);

    if (!applicationLookup.ok || !Array.isArray(applicationLookup.data) || applicationLookup.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cette demande est introuvable ou deja supprimee." },
        { status: 404 }
      );
    }

    const accessLookup = await adminClient.clientAccess.getByApplicationId(applicationId);
    const profileLookup = await adminClient.clientProfiles.getByApplicationId(applicationId);
    const packetLookup = await adminClient.postCallZeroPackets.getByApplicationId(applicationId);

    const access =
      accessLookup.ok && Array.isArray(accessLookup.data) && accessLookup.data.length > 0
        ? accessLookup.data[0]
        : null;
    const profile =
      profileLookup.ok && Array.isArray(profileLookup.data) && profileLookup.data.length > 0
        ? profileLookup.data[0]
        : null;
    const packet =
      packetLookup.ok && Array.isArray(packetLookup.data) && packetLookup.data.length > 0
        ? packetLookup.data[0]
        : null;

    const packetPaths = [
      packet?.welcome_storage_path,
      packet?.quote_storage_path,
      packet?.contract_storage_path
    ].filter(Boolean);

    if (packetPaths.length > 0) {
      await Promise.all(
        packetPaths.map((path) =>
          removeStorageObject({
            bucket: POST_CALL_ZERO_BUCKET,
            path
          }).catch(() => null)
        )
      );
    }

    const newsletterResult = await adminClient.newsletterSubscriptions.detachFromApplication(applicationId);

    if (!newsletterResult.ok && newsletterResult.status !== 404) {
      return NextResponse.json(
        { success: false, error: "Impossible de detacher la newsletter avant suppression." },
        { status: 500 }
      );
    }

    const authUserId = access?.user_id || profile?.user_id || null;

    if (authUserId) {
      const deleteUserResult = await adminClient.auth.deleteUser(authUserId);

      if (!deleteUserResult.ok && deleteUserResult.status !== 404) {
        return NextResponse.json(
          {
            success: false,
            error: "Impossible de supprimer le compte de connexion associe a ce dossier."
          },
          { status: 500 }
        );
      }
    }

    const deleteApplicationResult = await adminClient.applications.delete(applicationId);

    if (!deleteApplicationResult.ok) {
      return NextResponse.json(
        { success: false, error: "Impossible de supprimer definitivement ce dossier." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "La demande, le profil client, l'acces client et le compte de connexion associe ont bien ete supprimes."
    });
  } catch (error) {
    console.error("[admin-application] delete failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la suppression definitive du dossier."
      },
      { status: 500 }
    );
  }
}
