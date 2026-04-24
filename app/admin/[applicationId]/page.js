import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApplicationEditor } from "@/components/admin/application-editor";
import { ApplicationReview } from "@/components/admin/application-review";
import { getUserRole, isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return {
    title: `Administration dossier ${params.applicationId} | Zero Limit Agency`
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

  const isClientFolder = application.status === "approved";

  return (
    <main className="admin-shell">
      <section className="admin-frame">
        <header className="admin-header admin-header-compact">
          <div>
            <p className="eyebrow">{isClientFolder ? "Client" : "Requete"}</p>
            <h1>
              {[application.first_name, application.last_name].filter(Boolean).join(" ") ||
                application.pseudo ||
                application.email}
            </h1>
            <p className="admin-lead">
              {isClientFolder
                ? "Gerez le profil client, ses ressources utiles et la progression du dossier."
                : "Relisez la demande, puis acceptez-la pour en faire un client ou refusez-la sans perdre l'historique."}
            </p>
          </div>

          <div className="admin-header-actions">
            <Link className="button button-dark" href="/admin">
              Retour a l'administration
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="button button-dark" type="submit">
                Se deconnecter
              </button>
            </form>
          </div>
        </header>

        {isClientFolder ? (
          <ApplicationEditor
            application={application}
            profile={profile}
            access={access}
            postCallZeroPacket={postCallZeroPacket}
            clientSpaceUrl={`/espace-client/${params.applicationId}`}
          />
        ) : (
          <ApplicationReview application={application} />
        )}
      </section>
    </main>
  );
}
