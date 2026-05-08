import Link from "next/link";

export function LegalPageTemplate({ eyebrow, title, placeholderTitle, placeholderBody }) {
  return (
    <main className="legal-page-shell">
      <section className="section legal-page-section">
        <div className="container legal-page-stack">
          <div className="legal-page-header">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="legal-page-lead">
              Cette page est prête à être remplie avec votre contenu définitif. Je pourrai ensuite y
              intégrer le texte juridique exact que vous m’enverrez.
            </p>
          </div>

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

          <div className="legal-page-actions">
            <Link className="button button-secondary" href="/">
              Retour au site
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
