import Link from "next/link";
import { redirect } from "next/navigation";

import { MaintenanceScreen } from "@/components/maintenance-screen";
import { ClientLoginForm } from "@/components/auth/client-login-form";
import { getUserRole } from "@/lib/auth/admin-access";
import { buildClientApplicationUrl, getClientWorkspaceContext } from "@/lib/auth/client-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { DEMO_CLIENT_USER_ID } from "@/lib/auth/demo-client";
import { getMaintenanceModeState } from "@/lib/maintenance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Connexion | Zero Limit Agency"
};

export default async function ConnexionPage({ searchParams }) {
  const session = await getClientSession();
  const role = session?.user ? await getUserRole(session.user) : null;
  const workspace = session?.user ? await getClientWorkspaceContext(session.user) : null;
  const maintenanceSettings = await getMaintenanceModeState(createSupabaseAdminClient());
  const allowAdminAccess = searchParams?.admin_access === "1";

  if (maintenanceSettings.enabled && role !== "admin" && !allowAdminAccess) {
    return <MaintenanceScreen settings={maintenanceSettings} />;
  }

  if (session?.user && !session.isDemo && session.user.id !== DEMO_CLIENT_USER_ID && role === "admin") {
    redirect("/admin");
  }

  if (
    session?.user &&
    !session.isDemo &&
    session.user.id !== DEMO_CLIENT_USER_ID &&
    workspace?.access?.application_id
  ) {
    if (workspace.application?.status === "approved") {
      redirect(buildClientApplicationUrl(workspace.access.application_id));
    }

    redirect("/espace-client");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="auth-copy">
          <p className="eyebrow">Connexion client</p>
          <h1>Accéder à votre espace personnel</h1>
          <p>
            Connectez-vous avec les identifiants fournis par Zero Limit Agency lors de votre inscription
            pour retrouver votre dossier, son statut et toutes les informations liées à votre
            accompagnement.
          </p>
          <div className="auth-copy-note">
            <strong>Accès sécurisé</strong>
            <p>
              Chaque client accède uniquement à son propre espace. Une fois connecté, vous retrouvez
              votre profil, vos ressources et l'état de votre accompagnement.
            </p>
          </div>
          <div className="auth-actions auth-actions-stacked auth-copy-actions">
            <Link className="button button-dark" href="/">
              Retour au site
            </Link>
          </div>
        </div>

        <div className="auth-panel">
          <ClientLoginForm />
        </div>
      </section>
    </main>
  );
}
