import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApplicationEditor } from "@/components/admin/application-editor";
import { ApplicationReview } from "@/components/admin/application-review";
import { LogoutButton } from "@/components/auth/logout-button";
import { getUserRole, isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
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
  const session = await getClientSession();

  if (!session?.user) {
    redirect("/connexion");
  }

  const role = await getUserRole(session.user);

  if (!(await isAdminUser(session.user))) {
    if (role === "client") {
      redirect("/espace-client");
    }

    redirect("/connexion");
  }

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

  const isClientFolder = application.status === "approved";

  return (
    <main className="admin-shell">
      <section className="admin-frame">
        <header className="admin-header admin-header-compact">
          <div>
            <p className="eyebrow">{isClientFolder ? "Client" : "Requête"}</p>
            <h1>
              {[application.first_name, application.last_name].filter(Boolean).join(" ") ||
                application.pseudo ||
                application.email}
            </h1>
            <p className="admin-lead">
              {isClientFolder
                ? "Gérez le profil client, ses ressources utiles et la progression du dossier."
                : "Relisez la demande, puis acceptez-la pour en faire un client ou refusez-la sans perdre l'historique."}
            </p>
          </div>

          <div className="admin-header-actions">
            <Link className="button button-dark" href="/admin">
              Retour à l'administration
            </Link>
            <LogoutButton label="Se déconnecter" />
          </div>
        </header>

        {isClientFolder ? (
          <ApplicationEditor
            application={application}
            profile={profile}
            access={access}
            postCallZeroPacket={safePostCallZeroPacket}
            hasPostCallZeroPacket={Boolean(postCallZeroPacket)}
            callReport={safeCallReport}
            clientSpaceUrl={`/espace-client/${params.applicationId}`}
          />
        ) : (
          <ApplicationReview application={application} />
        )}
      </section>
    </main>
  );
}
