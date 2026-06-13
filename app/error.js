"use client";

import Link from "next/link";

export default function ErrorPage({ reset }) {
  return (
    <main className="error-page-shell">
      <section className="error-page-card" aria-labelledby="error-page-title">
        <img className="error-page-logo" src="/assets/zero-limit-logo.png" alt="Zero Limit Agency" />
        <p className="eyebrow">Erreur</p>
        <h1 id="error-page-title">Une erreur est survenue.</h1>
        <p>
          La page n&apos;a pas pu être chargée correctement. Vous pouvez réessayer ou revenir sur le site Zero Limit Agency.
        </p>
        <div className="error-page-actions">
          <button className="button button-dark" type="button" onClick={() => reset()}>
            Réessayer
          </button>
          <Link className="button button-primary error-page-button" href="/">
            Revenir sur le site
          </Link>
        </div>
      </section>
    </main>
  );
}
