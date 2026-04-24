import Link from "next/link";
import { redirect } from "next/navigation";

import { GlobalMarketEditor } from "@/components/admin/global-market-editor";
import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { getUserRole, isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { normalizeSiteContent } from "@/lib/site-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Administration | Zero Limit Agency"
};

function buildDisplayName(application) {
  return (
    [application?.first_name, application?.last_name].filter(Boolean).join(" ") ||
    application?.pseudo ||
    application?.email ||
    "Client"
  );
}

function formatApplicationDate(value) {
  if (!value) {
    return "Date non disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function RequestCard({ application, tone }) {
  const badgeLabel = tone === "rejected" ? "RefusÃ©e" : "En attente";

  return (
    <article className="admin-list-card admin-request-card">
      <div className="admin-list-copy">
        <div className="admin-card-topline">
          <small>{application.request_type || "Demande"}</small>
          <span className={`admin-status-badge admin-status-${tone}`}>{badgeLabel}</span>
        </div>
        <h2>{buildDisplayName(application)}</h2>
        <p>
          {application.email || "Email Ã  prÃ©ciser"} Â· {application.language || "Langue Ã  prÃ©ciser"}
        </p>
        <p className="admin-inline-note">ReÃ§ue le {formatApplicationDate(application.created_at)}</p>
      </div>

      <div className="admin-list-actions">
        <Link className="button button-primary" href={`/admin/${application.id}`}>
          Ouvrir la fiche
        </Link>
      </div>
    </article>
  );
}

function ClientCard({ application }) {
  return (
    <article className="admin-list-card admin-client-card">
      <div className="admin-list-copy">
        <div className="admin-card-topline">
          <small>Client</small>
          <span className="admin-status-badge admin-status-approved">Client</span>
        </div>
        <h2>{buildDisplayName(application)}</h2>
        <p>
          {application.company || "Structure Ã  prÃ©ciser"} Â· {application.language || "Langue Ã  prÃ©ciser"}
        </p>
        <p className="admin-inline-note">
          {application.request_type || "Dossier client"} Â· ValidÃ© le {formatApplicationDate(application.updated_at)}
        </p>
      </div>

      <div className="admin-list-actions">
        <Link className="button button-primary" href={`/admin/${application.id}`}>
          GÃ©rer le client
        </Link>
        <Link className="button button-dark" href={`/espace-client/${application.id}`}>
          Voir l'espace client
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ title, description }) {
  return (
    <article className="admin-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </article>
  );
}

function AdminSection({ eyebrow, title, note, items, kind }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="admin-inline-note">{note}</p>
        </div>
      </div>

      <div className="admin-list">
        {items.length > 0 ? (
          items.map((application) =>
            kind === "clients" ? (
              <ClientCard key={application.id} application={application} />
            ) : (
              <RequestCard key={application.id} application={application} tone={kind} />
            )
          )
        ) : kind === "pending_review" ? (
          <EmptyState
            title="Aucune demande en attente."
            description="Les nouvelles inscriptions apparaÃ®tront ici tant qu'elles n'ont pas Ã©tÃ© traitÃ©es."
          />
        ) : kind === "rejected" ? (
          <EmptyState
            title="Aucune demande refusÃ©e."
            description="Les dossiers refusÃ©s sont conservÃ©s ici pour garder un historique propre."
          />
        ) : (
          <EmptyState
            title="Aucun client actif."
            description="Une demande acceptÃ©e quitte immÃ©diatement l'attente pour rejoindre cette section."
          />
        )}
      </div>
    </section>
  );
}

export default async function AdminPage({ searchParams }) {
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
  const result = await adminClient.applications.list();
  const globalMarketResult = await adminClient.globalMarketSettings.get();
  const siteContentResult = await adminClient.globalSiteSettings.get();
  const applications = result.ok && Array.isArray(result.data) ? result.data : [];
  const globalMarketSettings =
    globalMarketResult.ok && Array.isArray(globalMarketResult.data) && globalMarketResult.data.length > 0
      ? globalMarketResult.data[0]?.settings || {}
      : {};
  const globalSiteSettings =
    siteContentResult.ok && Array.isArray(siteContentResult.data) && siteContentResult.data.length > 0
      ? normalizeSiteContent(siteContentResult.data[0]?.settings || {})
      : undefined;
  const activeFilter = ["pending_review", "approved", "rejected"].includes(searchParams?.status)
    ? searchParams.status
    : "all";

  const pendingApplications = applications.filter((application) => application.status === "pending_review");
  const rejectedApplications = applications.filter((application) => application.status === "rejected");
  const approvedApplications = applications.filter((application) => application.status === "approved");

  return (
    <main className="admin-shell">
      <section className="admin-frame">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Demandes, clients et contenus</h1>
            <p className="admin-lead">
              GÃ©rez les inscriptions, les clients actifs, le site public et le Zero Limit Market depuis un
              seul espace.
            </p>
          </div>

          <div className="admin-header-actions">
            <Link className="button button-dark" href="/">
              Retour au site
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="button button-dark" type="submit">
                Se dÃ©connecter
              </button>
            </form>
          </div>
        </header>

        <section className="admin-overview-grid">
          <article className="admin-subpanel">
            <small>En attente</small>
            <strong>{pendingApplications.length}</strong>
            <p className="admin-inline-note">Demandes Ã  traiter avant toute dÃ©cision.</p>
          </article>
          <article className="admin-subpanel">
            <small>RefusÃ©s</small>
            <strong>{rejectedApplications.length}</strong>
            <p className="admin-inline-note">Dossiers refusÃ©s, sortis du traitement actif.</p>
          </article>
          <article className="admin-subpanel">
            <small>Clients</small>
            <strong>{approvedApplications.length}</strong>
            <p className="admin-inline-note">Dossiers validÃ©s et gÃ©rÃ©s comme vrais clients.</p>
          </article>
        </section>

        <nav className="admin-filters" aria-label="Filtres administration">
          <Link className={`admin-filter-chip${activeFilter === "all" ? " is-active" : ""}`} href="/admin">
            Tout afficher
          </Link>
          <Link
            className={`admin-filter-chip${activeFilter === "pending_review" ? " is-active" : ""}`}
            href="/admin?status=pending_review"
          >
            En attente
          </Link>
          <Link
            className={`admin-filter-chip${activeFilter === "rejected" ? " is-active" : ""}`}
            href="/admin?status=rejected"
          >
            RefusÃ©s
          </Link>
          <Link
            className={`admin-filter-chip${activeFilter === "approved" ? " is-active" : ""}`}
            href="/admin?status=approved"
          >
            Clients
          </Link>
        </nav>

        <div className="admin-sections">
          <SiteContentEditor initialSettings={globalSiteSettings} />
          <GlobalMarketEditor initialSettings={globalMarketSettings} />

          {(activeFilter === "all" || activeFilter === "pending_review") && (
            <AdminSection
              eyebrow="En attente"
              title="Demandes Ã  traiter"
              note="Les demandes prÃ©sentes ici sont les seules encore actives cÃ´tÃ© revue."
              items={pendingApplications}
              kind="pending_review"
            />
          )}

          {(activeFilter === "all" || activeFilter === "rejected") && (
            <AdminSection
              eyebrow="RefusÃ©s"
              title="Demandes refusÃ©es"
              note="Ces dossiers restent en base, mais ne doivent plus apparaÃ®tre comme des demandes Ã  traiter."
              items={rejectedApplications}
              kind="rejected"
            />
          )}

          {(activeFilter === "all" || activeFilter === "approved") && (
            <AdminSection
              eyebrow="Clients"
              title="Clients validÃ©s"
              note="Une demande acceptÃ©e quitte l'attente et rejoint cette section comme client."
              items={approvedApplications}
              kind="clients"
            />
          )}
        </div>
      </section>
    </main>
  );
}
