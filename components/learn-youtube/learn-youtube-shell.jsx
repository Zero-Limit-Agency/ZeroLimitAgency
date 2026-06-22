import Link from "next/link";

import { learnYoutubeNavItems } from "@/lib/learn-youtube/home-content";

import styles from "./learn-youtube.module.css";

export function LearnYoutubeShell({ children, settings, isAdmin }) {
  const previewLabel = settings.mode === "maintenance"
    ? "Preview administrateur — maintenance visible pour le public"
    : settings.mode === "private"
      ? "Preview administrateur — Formation privée"
      : null;

  return (
    <main className={styles.shell}>
      {isAdmin && previewLabel ? (
        <div className={styles.adminPreviewBadge} role="status">
          <span>{previewLabel}</span>
          <Link href="/admin">Gérer</Link>
        </div>
      ) : null}

      <header className={styles.header}>
        <Link className={styles.identity} href="/" aria-label="Retour à Zero Limit Agency">
          <span>Zero Limit</span>
          <strong>Formation YouTube</strong>
        </Link>

        <details className={styles.mobileMenu}>
          <summary>Menu</summary>
          <nav aria-label="Navigation mobile Formation YouTube">
            {learnYoutubeNavItems.map((item) => (
              <a href={item.href} key={item.href}>{item.label}</a>
            ))}
            <a href="#offres">Ouverture prochainement</a>
            <Link href="/">Zero Limit Agency</Link>
          </nav>
        </details>

        <nav className={styles.nav} aria-label="Navigation Formation YouTube">
          {learnYoutubeNavItems.map((item) => (
            <a href={item.href} key={item.href}>{item.label}</a>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <Link className={styles.ghostLink} href="/">Zero Limit Agency</Link>
          <a className={styles.primaryLink} href="#offres">Ouverture prochainement</a>
        </div>
      </header>

      {children}
    </main>
  );
}

export function LearnYoutubeMaintenance({ message }) {
  return (
    <main className={styles.shell}>
      <section className={styles.centerFrame}>
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
      <section className={styles.centerFrame}>
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
