import { redirect } from "next/navigation";

import { EditorialHero, ProductInterfaceMock } from "@/components/design-system/editorial-compositions";
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
    <main className="auth-shell auth-shell-editorial">
      <EditorialHero
        eyebrow="Connexion client"
        title="Accéder à votre espace personnel"
        description="Retrouvez votre dossier, son statut et les ressources liées à votre accompagnement dans une expérience privée, structurée et sécurisée."
        primaryAction={{ href: "#connexion", label: "Se connecter" }}
        secondaryAction={{ href: "/", label: "Retour au site" }}
        meta={["Accès privé", "Dossier client", "Ressources sécurisées"]}
        visual={(
          <ProductInterfaceMock title="Espace client" steps={["Connexion sécurisée", "Dossier personnel", "Suivi Zero Limit"]}>
            <span>Portail client premium</span>
          </ProductInterfaceMock>
        )}
      />

      <section className="auth-card auth-card-wide auth-editorial-card" id="connexion">
        <div className="auth-copy">
          <p className="eyebrow">Accès sécurisé</p>
          <h2>Un panneau de connexion clair, relié à l’univers Zero Limit.</h2>
          <p>
            Chaque client accède uniquement à son propre espace. Une fois connecté, vous retrouvez
            votre profil, vos ressources et l'état de votre accompagnement.
          </p>
        </div>

        <div className="auth-panel">
          <ClientLoginForm />
        </div>
      </section>
    </main>
  );
}
