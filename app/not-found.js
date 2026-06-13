import Link from "next/link";

export const metadata = {
  title: "Page introuvable - Zero Limit Agency"
};

export default function NotFound() {
  return (
    <main className="error-page-shell">
      <section className="error-page-card" aria-labelledby="error-page-title">
        <img className="error-page-logo" src="/assets/zero-limit-logo.png" alt="Zero Limit Agency" />
        <p className="eyebrow">Erreur 404</p>
        <h1 id="error-page-title">Cette page est introuvable.</h1>
        <p>
          Le lien demandé n&apos;existe pas ou n&apos;est plus disponible. Retournez sur le site Zero Limit Agency pour
          continuer votre navigation.
        </p>
        <Link className="button button-primary error-page-button" href="/">
          Revenir sur le site
        </Link>
      </section>
    </main>
  );
}
