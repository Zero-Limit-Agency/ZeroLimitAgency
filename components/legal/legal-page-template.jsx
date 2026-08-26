import { Children, cloneElement, isValidElement } from "react";
import { Badge, Button } from "@/components/marketing/ui";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PublicFooter, PublicNavbar } from "@/components/marketing/public-chrome";
import "@/components/marketing/marketing.css";

export function LegalPageTemplate({
  eyebrow,
  title,
  lead,
  lastUpdated,
  placeholderTitle,
  placeholderBody,
  children
}) {
  const resolvedLastUpdated = lastUpdated || null;
  const hasCustomContent = Boolean(children);
  const sections = Children.toArray(children).map((child, index) => {
    const heading = isValidElement(child) ? Children.toArray(child.props.children).find((item) => isValidElement(item) && item.type === "h2") : null;
    const label = heading ? Children.toArray(heading.props.children).join("") : `Section ${index + 1}`;
    return { id: `section-${index + 1}`, label, child };
  });

  return (
    <MarketingShell><a className="zl-skip" href="#main">Aller au contenu</a><PublicNavbar />
    <main className="legal-page-shell" id="main">
      <section className="legal-page-section">
        <div className="zl-container legal-page-stack">
          <div className="legal-page-header">
            <Badge>{eyebrow}</Badge>
            <h1>{title}</h1>
            <p className="legal-page-lead">
              {lead ||
                "Cette page est prête à être remplie avec votre contenu définitif. Je pourrai ensuite y intégrer le texte juridique exact que vous m’enverrez."}
            </p>
            {resolvedLastUpdated && <p className="legal-page-updated">
              <strong>Dernière mise à jour :</strong> {resolvedLastUpdated}
            </p>}
          </div>

          {hasCustomContent ? (
            <div className="legal-page-layout">
              <nav className="legal-toc" aria-label="Sommaire"><strong>Sommaire</strong><ol>{sections.map(({ id, label }) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol></nav>
              <div className="legal-page-content">{sections.map(({ id, child }) => isValidElement(child) ? cloneElement(child, { id, key: id }) : child)}</div>
            </div>
          ) : (
            <>
              <article className="legal-page-card">
                <h2>{placeholderTitle}</h2>
                <p>{placeholderBody}</p>
              </article>

              <article className="legal-page-card legal-page-note">
                <h2>Contenu à compléter</h2>
                <p>
                  Vous pouvez me transmettre ici plus tard les informations exactes à afficher sur cette
                  page : identité de l’éditeur, hébergeur, traitement des données, clauses, exclusions,
                  remboursements ou toute autre mention légale utile.
                </p>
              </article>
            </>
          )}

          <div className="legal-page-actions">
            <Button variant="secondary" href="/">Retour à l’accueil</Button>
          </div>
        </div>
      </section>
    </main><PublicFooter /></MarketingShell>
  );
}
