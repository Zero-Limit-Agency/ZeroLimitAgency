import Link from "next/link";

import { learnYoutubeNavItems } from "@/lib/learn-youtube/home-content";

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
            <div className={styles.anchorNav}>
              {learnYoutubeNavItems.map((item) => (
                <a href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
            {isAdmin ? <span className={styles.modeBadge}>Mode {modeLabel}</span> : null}
            <a className={styles.primaryLink} href="#offres">
              Découvrir les offres
            </a>
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

export function LearnYoutubeErrorState({ title = "Une erreur est survenue.", onRetry = null }) {
  return (
    <main className={styles.shell}>
      <section className={`${styles.frame} ${styles.centerFrame}`}>
        <div className={styles.maintenanceCard}>
          <p className={styles.kicker}>Formation YouTube</p>
          <h1>{title}</h1>
          <p>Cette section n'a pas pu être affichée correctement. Aucun détail technique sensible n'est exposé.</p>
          {onRetry ? (
            <button className={styles.primaryLink} type="button" onClick={onRetry}>
              Réessayer
            </button>
          ) : null}
          <Link className={styles.secondaryButton} href="/">
            Revenir à l'accueil principal
          </Link>
        </div>
      </section>
    </main>
  );
}
