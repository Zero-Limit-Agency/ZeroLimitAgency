import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AvatarUploader } from "@/components/client/avatar-uploader";
import { ZeroLimitMarket } from "@/components/client/zero-limit-market";
import { getUserRole } from "@/lib/auth/admin-access";
import {
  buildClientDetailItems,
  buildClientResourceItems,
  buildClientSummary,
  buildDashboardTimeline,
  buildLeadDisplayName,
  buildLeadInitials,
  buildLeadIdentity,
  buildZeroLimitMarketData
} from "@/lib/applications/client-space";
import { createDemoApplication, createDemoProfile, DEMO_CLIENT_APPLICATION_ID } from "@/lib/auth/demo-client";
import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return {
    title: `Dossier ${params.applicationId} | Zero Limit Agency`
  };
}

function buildContextLine(application) {
  const company = application?.company?.trim();
  const requestType = application?.request_type?.trim();

  if (company && requestType) {
    return `${requestType} pour ${company}`;
  }

  return requestType || company || "Suivi personnalisé du dossier client";
}

export default async function ClientApplicationPage({ params, searchParams }) {
  const session = await getClientSession();
  const isDemoSpace = params.applicationId === DEMO_CLIENT_APPLICATION_ID;

  if (!isDemoSpace && !session?.user) {
    redirect(`/connexion?next=/espace-client/${params.applicationId}`);
  }

  const role = session?.user ? await getUserRole(session.user) : null;
  const isAdminPreview = searchParams?.admin_preview === "1" && role === "admin";

  if (role === "admin" && !isAdminPreview) {
    redirect("/admin");
  }

  if (!isDemoSpace && !isAdminPreview) {
    const authorizedAccess = await getAuthorizedClientAccess(session.user);

    if (!authorizedAccess?.application_id) {
      redirect("/connexion");
    }

    if (authorizedAccess.application_id !== params.applicationId) {
      redirect(`/espace-client/${authorizedAccess.application_id}`);
    }
  }

  let application;
  let profile = null;
  let globalMarketSettings = null;

  if (isDemoSpace) {
    application = createDemoApplication();
    profile = createDemoProfile();
  } else {
    const adminClient = createSupabaseAdminClient();
    const result = await adminClient.applications.getById(params.applicationId);

    if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      notFound();
    }

    application = result.data[0];

    if (!isAdminPreview && application.status !== "approved") {
      redirect("/espace-client");
    }

    const profileResult = await adminClient.clientProfiles.getByApplicationId(params.applicationId);
    const marketResult = await adminClient.globalMarketSettings.get();
    profile =
      profileResult.ok && Array.isArray(profileResult.data) && profileResult.data.length > 0
        ? profileResult.data[0]
        : null;
    globalMarketSettings =
      marketResult.ok && Array.isArray(marketResult.data) && marketResult.data.length > 0
        ? marketResult.data[0]?.settings || null
        : null;
  }

  const displayName = buildLeadDisplayName(application);
  const identity = buildLeadIdentity(application);
  const initials = buildLeadInitials(application);
  const summary = buildClientSummary(application);
  const details = buildClientDetailItems(application);
  const resources = buildClientResourceItems(application, profile);
  const timeline = buildDashboardTimeline(application, profile);
  const contextLine = buildContextLine(application);
  const marketData = profile?.market_access_enabled ? buildZeroLimitMarketData(globalMarketSettings) : null;
  const isWorkspaceReady = isDemoSpace || profile?.space_status === "active";
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL || process.env.BOOKING_URL || "";

  return (
    <main className="client-dashboard-shell">
      <div className="client-dashboard-bg" aria-hidden="true" />

      <section className="client-dashboard-frame client-profile-frame">
        {isDemoSpace ? (
          <div className="client-demo-banner">
            <strong>Mode démonstration</strong>
            <span>
              Cette page présente un dossier fictif pour visualiser l'expérience client sans utiliser
              un vrai compte.
            </span>
          </div>
        ) : null}

        {isAdminPreview ? (
          <div className="client-demo-banner client-admin-preview-banner">
            <strong>Prévisualisation admin</strong>
            <span>Vous consultez la fiche client dans son rendu normal, sans les outils d'édition.</span>
          </div>
        ) : null}

        <header className="client-dashboard-header client-profile-header">
          <div className="client-profile-main">
            <p className="client-kicker">Espace client</p>
            <div className="client-profile-card">
              <AvatarUploader
                initialAvatar={profile?.avatar_data_url || ""}
                initials={initials}
                disabled={isDemoSpace || isAdminPreview}
              />

              <div className="client-profile-copy">
                <div className="client-profile-topline">
                  <span className="client-identity-chip">
                    {isWorkspaceReady ? "Dossier actif" : "Dossier accepté"}
                  </span>
                  <span className="client-identity-chip client-identity-chip-soft">{contextLine}</span>
                </div>

                <h1>{displayName}</h1>

                <div className="client-profile-meta">
                  <span>
                    <strong>Prénom</strong>
                    {identity.firstName}
                  </span>
                  <span>
                    <strong>Nom</strong>
                    {identity.lastName}
                  </span>
                  <span>
                    <strong>Alias</strong>
                    {identity.pseudo}
                  </span>
                  <span>
                    <strong>Dossier accepté le</strong>
                    {identity.openedAt}
                  </span>
                </div>

                <div className="client-summary-box">
                  <p className="eyebrow">Résumé du dossier</p>
                  <p className="client-summary">{summary}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="client-overview-card">
            <p className="eyebrow">Vue rapide</p>
            <h2>{isWorkspaceReady ? "Accompagnement en cours" : "Espace en préparation"}</h2>
            <p>
              {isWorkspaceReady
                ? "Cet espace regroupe les éléments utiles au suivi de votre dossier, vos ressources associées et les prochaines étapes du projet."
                : "Votre dossier a été accepté. L'espace complet sera débloqué après le rendez-vous de cadrage avec l'équipe."}
            </p>
            {!isDemoSpace && !isAdminPreview && isWorkspaceReady ? (
              <p className="client-panel-note">
                Vous pouvez aussi ajouter votre photo de profil directement depuis ce tableau de bord.
              </p>
            ) : null}
            <div className="client-overview-points">
              <span>Accès personnel</span>
              <span>{isWorkspaceReady ? "Suivi centralisé" : "Plan à cadrer"}</span>
              <span>{isWorkspaceReady ? "Ressources évolutives" : "Ressources en attente"}</span>
            </div>
          </aside>
        </header>

        <section className="client-dashboard-grid client-dashboard-grid-refined">
          {!isWorkspaceReady ? (
            <article className="client-panel client-panel-preparation">
              <div className="client-panel-heading">
                <p className="eyebrow">Préparation</p>
                <h2>Veuillez prendre rendez-vous pour le plan.</h2>
              </div>
              <p className="client-panel-note">
                Votre espace client existe déjà, mais les accès Drive, Notion et le suivi complet seront
                débloqués après l'appel de cadrage.
              </p>
              <div className="client-overview-points">
                <span>Dossier accepté</span>
                <span>Plan à définir</span>
                <span>Accompagnement à débloquer</span>
              </div>
              {bookingUrl ? (
                <a className="button button-primary" href={bookingUrl} target="_blank" rel="noreferrer">
                  Prendre rendez-vous
                </a>
              ) : (
                <div className="client-resource-placeholder">
                  <strong>Prise de rendez-vous à configurer</strong>
                  <span>Lien Google Agenda / booking à ajouter dans la configuration du projet.</span>
                </div>
              )}
            </article>
          ) : null}

          <article className="client-panel client-panel-details">
            <div className="client-panel-heading">
              <p className="eyebrow">Détails du dossier</p>
              <h2>Informations principales</h2>
            </div>

            <div className="client-info-grid client-info-grid-refined">
              {details.map((item) => (
                <div key={item.label} className="client-info-card">
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="client-panel client-panel-resources">
            <div className="client-panel-heading">
              <p className="eyebrow">Outils & ressources</p>
              <h2>Accès utiles du dossier</h2>
            </div>

            <div className="client-resource-list">
              {resources.map((resource) => (
                <div key={resource.key} className="client-resource-card">
                  <div className="client-resource-topline">
                    <span className="client-resource-logo" aria-hidden="true">
                      {resource.logoUrl ? (
                        <img className="client-resource-logo-image" src={resource.logoUrl} alt="" />
                      ) : (
                        resource.name.charAt(0)
                      )}
                    </span>
                    <div>
                      <small>{resource.kind}</small>
                      <strong>{resource.name}</strong>
                    </div>
                  </div>

                  <p>{resource.description}</p>

                  {resource.url && isWorkspaceReady ? (
                    <a className="button button-primary" href={resource.url} target="_blank" rel="noreferrer">
                      {resource.cta}
                    </a>
                  ) : (
                    <div className="client-resource-placeholder">
                      <strong>{isWorkspaceReady ? resource.cta : "Disponible après le rendez-vous"}</strong>
                      <span>
                        {isWorkspaceReady
                          ? "Emplacement prêt pour ajouter un outil, son logo et son lien depuis l'administration."
                          : "Les accès réels seront activés une fois le plan validé avec l'équipe."}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </article>

          <article className="client-panel client-panel-timeline">
            <div className="client-panel-heading client-panel-heading-split">
              <div>
                <p className="eyebrow">Timeline</p>
                <h2>Suivi temporel du projet</h2>
              </div>
              <p className="client-panel-note">
                Cette frise peut accueillir les paiements, jalons, deadlines et étapes d'accompagnement.
              </p>
            </div>

            <div className="client-timeline">
              {timeline.map((step) => (
                <div key={step.key} className={`client-timeline-item is-${step.tone}`}>
                  <div className="client-timeline-rail" aria-hidden="true">
                    <span className="client-timeline-dot" />
                  </div>
                  <div className="client-timeline-content">
                    <div className="client-timeline-topline">
                      <strong>{step.label}</strong>
                      <span>{step.date}</span>
                    </div>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {marketData ? <ZeroLimitMarket market={marketData} /> : null}
        </section>

        <footer className="client-dashboard-footer client-dashboard-footer-refined">
          <Link className="button button-dark" href={isAdminPreview ? `/admin/${params.applicationId}` : "/"}>
            {isAdminPreview ? "Retour à la gestion client" : "Retour au site public"}
          </Link>

          {!isDemoSpace && !isAdminPreview ? (
            <form action="/api/auth/logout" method="post">
              <button className="button button-dark" type="submit">
                Se déconnecter
              </button>
            </form>
          ) : null}
        </footer>
      </section>
    </main>
  );
}
