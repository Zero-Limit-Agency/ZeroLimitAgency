import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { getUserRole } from "@/lib/auth/admin-access";
import { buildClientApplicationUrl, getClientWorkspaceContext } from "@/lib/auth/client-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { getMaintenanceModeState } from "@/lib/maintenance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Espace client | Zero Limit Agency"
};

function buildStatusContent(application) {
  if (!application) {
    return {
      title: "Votre espace client n'est pas encore disponible",
      description:
        "Votre dossier n'est pas encore relié à un espace client utilisable. Contactez Zero Limit Agency si besoin.",
      tone: "neutral"
    };
  }

  if (application.status === "rejected") {
    return {
      title: "Votre inscription a été refusée par l'équipe",
      description:
        "Pour toute question complémentaire, vous pouvez nous contacter par email afin d'échanger sur votre demande.",
      tone: "rejected"
    };
  }

  return {
    title: "Votre demande est en cours d'analyse",
    description:
      "Nous étudions actuellement votre inscription. Vous pourrez accéder à votre espace client complet dès validation par l'équipe.",
    tone: "pending"
  };
}

export default async function ClientSpaceIndexPage() {
  const session = await getClientSession();
  const role = session?.user ? await getUserRole(session.user) : null;
  const maintenanceSettings = await getMaintenanceModeState(createSupabaseAdminClient());

  if (role === "admin") {
    redirect("/admin");
  }

  if (maintenanceSettings.enabled) {
    return <MaintenanceScreen settings={maintenanceSettings} />;
  }

  if (!session?.user) {
    return (
      <main className="client-hub-shell">
        <section className="client-hub-frame">
          <div className="client-hub-copy">
            <p className="eyebrow">Espace client</p>
            <h1>Un espace privé pour suivre votre dossier.</h1>
            <p>
              Votre espace client est séparé du site public. Une fois connecté, vous accédez uniquement
              à votre dossier, à ses ressources utiles et au suivi de votre accompagnement.
            </p>
          </div>

          <div className="client-hub-grid">
            <article className="client-hub-card">
              <strong>Accès personnel</strong>
              <p>Chaque client se connecte avec l'email et le mot de passe définis à l'inscription.</p>
            </article>
            <article className="client-hub-card">
              <strong>Validation humaine</strong>
              <p>Le dossier est relu par l'équipe avant d'ouvrir l'accompagnement réel.</p>
            </article>
            <article className="client-hub-card">
              <strong>Suivi structuré</strong>
              <p>Le dossier peut ensuite être enrichi avec Drive, Notion, ressources et suivi du projet.</p>
            </article>
          </div>

          <div className="client-hub-actions">
            <Link className="button button-primary" href="/connexion">
              Accéder à la connexion client
            </Link>
            <Link className="button button-dark" href="/">
              Retour au site public
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { access, application } = await getClientWorkspaceContext(session.user);

  if (access?.application_id && application?.status === "approved") {
    redirect(buildClientApplicationUrl(access.application_id));
  }

  const statusContent = buildStatusContent(application);

  return (
    <main className="client-hub-shell">
      <section className={`client-hub-frame client-hub-frame-${statusContent.tone}`}>
        <div className="client-hub-copy">
          <p className="eyebrow">Espace client</p>
          <h1>{statusContent.title}</h1>
          <p>{statusContent.description}</p>
        </div>

        <div className="client-hub-grid">
          <article className="client-hub-card">
            <strong>Dossier</strong>
            <p>
              {application
                ? `${application.request_type || "Demande"} · ${application.language || "Langue non renseignée"}`
                : "Aucune demande exploitable n'a encore été retrouvée pour ce compte."}
            </p>
          </article>
          <article className="client-hub-card">
            <strong>Statut actuel</strong>
            <p>
              {application?.status === "rejected"
                ? "Refusé"
                : application?.status === "pending_review"
                  ? "En cours d'analyse"
                  : "En attente"}
            </p>
          </article>
          <article className="client-hub-card">
            <strong>Contact</strong>
            <p>contact@zerolimit.agency</p>
          </article>
        </div>

        <div className="client-hub-actions">
          <Link className="button button-dark" href="/">
            Retour au site public
          </Link>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
