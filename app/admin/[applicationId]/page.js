import { notFound } from "next/navigation";

import { ApplicationEditor } from "@/components/admin/application-editor";
import { ApplicationReview } from "@/components/admin/application-review";
import { normalizeCollaborationMessage } from "@/lib/collaboration";
import { normalizeSiteContent } from "@/lib/site-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return {
    title: `Administration dossier ${params.applicationId} | Zero Limit Agency`
  };
}

function createEmptyPostCallZeroPacket() {
  return {
    summary_message: "",
    payment_url: "",
    status: "draft",
    welcome_file_name: null,
    quote_file_name: null,
    contract_file_name: null,
    welcome_storage_path: null,
    quote_storage_path: null,
    contract_storage_path: null
  };
}

function createEmptyCallReport() {
  return {
    call_type: "intro",
    raw_notes: "",
    client_summary: "",
    suggested_email: "",
    suggested_timeline_events: [],
    internal_tasks: [],
    important_dates: [],
    status: "draft"
  };
}

export default async function AdminApplicationPage({ params }) {
  const adminClient = createSupabaseAdminClient();
  const applicationResult = await adminClient.applications.getById(params.applicationId);

  if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
    notFound();
  }

  const application = applicationResult.data[0];
  const profileResult = await adminClient.clientProfiles.getByApplicationId(params.applicationId);
  const accessResult = await adminClient.clientAccess.getByApplicationId(params.applicationId);
  const postCallZeroPacketResult = await adminClient.postCallZeroPackets.getByApplicationId(params.applicationId);
  const callReportResult = await adminClient.clientCallReports.getByApplicationId(params.applicationId);
  const collaborationResult = await adminClient.clientCollaborationMessages.listByApplicationId(params.applicationId);
  const siteContentResult = await adminClient.globalSiteSettings.get();

  const profile =
    profileResult.ok && Array.isArray(profileResult.data) && profileResult.data.length > 0
      ? profileResult.data[0]
      : null;
  const access =
    accessResult.ok && Array.isArray(accessResult.data) && accessResult.data.length > 0
      ? accessResult.data[0]
      : null;
  const postCallZeroPacket =
    postCallZeroPacketResult.ok &&
    Array.isArray(postCallZeroPacketResult.data) &&
    postCallZeroPacketResult.data.length > 0
      ? postCallZeroPacketResult.data[0]
      : null;
  const safePostCallZeroPacket = postCallZeroPacket || createEmptyPostCallZeroPacket();
  const callReport =
    callReportResult.ok && Array.isArray(callReportResult.data) && callReportResult.data.length > 0
      ? callReportResult.data[0]
      : null;
  const safeCallReport = callReport || createEmptyCallReport();
  const collaborationMessages =
    collaborationResult.ok && Array.isArray(collaborationResult.data)
      ? collaborationResult.data.map(normalizeCollaborationMessage)
      : [];
  const siteContentSettings =
    siteContentResult.ok && Array.isArray(siteContentResult.data) && siteContentResult.data.length > 0
      ? normalizeSiteContent(siteContentResult.data[0]?.settings || {})
      : null;
  const supportEmail =
    siteContentSettings?.support?.contactEmail ||
    process.env.CLIENT_SUPPORT_EMAIL ||
    process.env.CLIENT_EMAIL ||
    "contact@zerolimit.agency";
  const discordUrl =
    siteContentSettings?.support?.discordUrl ||
    process.env.CLIENT_DISCORD_URL ||
    process.env.NEXT_PUBLIC_CLIENT_DISCORD_URL ||
    "";

  const isClientFolder = application.status === "approved";

  return isClientFolder ? (
          <ApplicationEditor
            application={application}
            profile={profile}
            access={access}
            postCallZeroPacket={safePostCallZeroPacket}
            hasPostCallZeroPacket={Boolean(postCallZeroPacket)}
            callReport={safeCallReport}
            clientSpaceUrl={`/espace-client/${params.applicationId}`}
            collaborationMessages={collaborationMessages}
            supportEmail={supportEmail}
            discordUrl={discordUrl}
          />
  ) : (
    <ApplicationReview application={application} />
  );
}
