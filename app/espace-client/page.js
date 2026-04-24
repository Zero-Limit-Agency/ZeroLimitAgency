import Link from "next/link";
import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/auth/admin-access";
import {
  buildClientApplicationUrl,
  getClientWorkspaceContext
} from "@/lib/auth/client-access";
import { getClientSession } from "@/lib/auth/client-auth";

export const metadata = {
  title: "Espace client | Zero Limit Agency"
};

function buildStatusContent(application) {
  if (!application) {
    return {
      title: "Votre espace client n'est pas encore disponible",
      description:
        "Votre dossier n'est pas encore relie a un espace client utilisable. Contactez Zero Limit Agency si besoin.",
      tone: "neutral"
    };
  }

  if (application.status === "rejected") {
    return {
      title: "Votre inscription a ete refusee par l'equipe",
      description:
        "Pour toute question complementaire, vous pouvez nous contacter par email afin d'echanger sur votre demande.",
      tone: "rejected"
    };
  }

  return {
    title: "Votre demande est en cours d'analyse",
    description:
      "Nous etudions actuellement votre inscription. Vous pourrez acceder a votre espace client complet des validation par l'equipe.",
    tone: "pending"
  };
}

export default async function ClientSpaceIndexPage() {
  const session = await getClientSession();
  const role = session?.user ? await getUserRole(session.user) : null;

  if (role === "admin") {
    redirect("/admin");
  }

  if (!session?.user) {
    return (
      <main className="client-hub-shell">
        <section className="client-hub-frame">
          <div className="client-hub-copy">
            <p className="eyebrow">Espace client</p>
            <h1>Un espace prive pour suivre votre dossier.</h1>
            <p>
              Votre espace client est separe du site public. Une fois connecte, vous accedez
              uniquement a votre dossier, a ses ressources utiles et au suivi de votre accompagnement.
            </p>
          </div>

          <div className="client-hub-grid">
            <article className="client-hub-card">
              <strong>Acces personnel</strong>
              <p>Chaque client se connecte avec l'email et le mot de passe definis a l'inscription.</p>
            </article>
            <article className="client-hub-card">
              <strong>Validation humaine</strong>
              <p>Le dossier est relu par l'equipe avant d'ouvrir l'accompagnement reel.</p>
            </article>
            <article className="client-hub-card">
              <strong>Suivi evolutif</strong>
              <p>Le dossier peut ensuite etre enrichi avec Drive, Notion, timeline et suivi projet.</p>
            </article>
          </div>

          <div className="client-hub-actions">
            <Link className="button button-primary" href="/connexion">
              Acceder a la connexion client
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
                ? `${application.request_type || "Demande"} • ${application.country || "Pays non renseigne"}`
                : "Aucune demande exploitable n'a encore ete retrouvee pour ce compte."}
            </p>
          </article>
          <article className="client-hub-card">
            <strong>Statut actuel</strong>
            <p>
              {application?.status === "rejected"
                ? "Refuse"
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
          <form action="/api/auth/logout" method="post">
            <button className="button button-dark" type="submit">
              Se deconnecter
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
