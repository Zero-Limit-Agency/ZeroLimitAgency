import Link from "next/link";

import styles from "./learn-youtube.module.css";

const MODE_LABELS = {
  private: "Privée",
  public: "Publique",
  maintenance: "Maintenance"
};

export function LearnYoutubeShell({ children, settings, isAdmin }) {
  const modeLabel = MODE_LABELS[settings.mode] || MODE_LABELS.private;

  return (
    <main className={styles.shell}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Zero Limit Agency</p>
            <strong className={styles.brand}>Formation YouTube</strong>
          </div>

          <nav className={styles.nav} aria-label="Navigation Formation YouTube">
            {isAdmin ? <span className={styles.modeBadge}>Mode {modeLabel}</span> : null}
            <Link className={styles.secondaryLink} href="/">
              Retour au site principal
            </Link>
          </nav>
        </header>

        {isAdmin && settings.mode === "private" ? (
          <div className={styles.notice} role="status">
            Preview administrateur : la Formation YouTube est privée et invisible pour les visiteurs et clients.
          </div>
        ) : null}

        {isAdmin && settings.mode === "maintenance" ? (
          <div className={styles.warningNotice} role="status">
            Preview administrateur : la Formation YouTube est en maintenance pour le public.
          </div>
        ) : null}

        {children}
      </section>
    </main>
  );
}

export function LearnYoutubeMaintenance({ message }) {
  return (
    <main className={styles.shell}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={`${styles.frame} ${styles.centerFrame}`}>
        <div className={styles.maintenanceCard}>
          <p className={styles.kicker}>Zero Limit Agency</p>
          <span className={styles.modeBadge}>Formation YouTube</span>
          <h1>Formation YouTube temporairement indisponible</h1>
          <p>{message}</p>
          <Link className={styles.primaryLink} href="/">
            Revenir à l'accueil principal
          </Link>
        </div>
      </section>
    </main>
  );
}

export function LearnYoutubeStatusCard() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>Plateforme en préparation</p>
        <h1>La nouvelle Formation YouTube arrive dans un espace dédié.</h1>
        <p>
          Cette page temporaire valide la fondation technique de la Formation YouTube. L'espace réunira plus tard les
          packs Montage, Graphisme, Monétisation et Se lancer / Les bases, sans exposer de faux contenu de cours à ce
          stade.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryLink} href="/">
            Retour au site principal
          </Link>
        </div>
      </div>

      <aside className={styles.previewCard}>
        <span className={styles.previewEyebrow}>Fondation technique</span>
        <h2>Preview contrôlée côté serveur</h2>
        <ul>
          <li>Route isolée dans l'application Next.js.</li>
          <li>Layout dédié pour protéger les futures sous-routes.</li>
          <li>Réglages indépendants : privée, publique ou maintenance.</li>
          <li>Aucun prix, paiement, pack, module ou lecteur vidéo dans cette étape.</li>
        </ul>
      </aside>
    </section>
  );
}

export function LearnYoutubeErrorState({ title = "Une erreur est survenue." }) {
  return (
    <main className={styles.shell}>
      <section className={`${styles.frame} ${styles.centerFrame}`}>
        <div className={styles.maintenanceCard}>
          <p className={styles.kicker}>Formation YouTube</p>
          <h1>{title}</h1>
          <p>Cette section n'a pas pu être affichée correctement. Aucun détail technique sensible n'est exposé.</p>
          <Link className={styles.primaryLink} href="/">
            Revenir à l'accueil principal
          </Link>
        </div>
      </section>
    </main>
  );
}
