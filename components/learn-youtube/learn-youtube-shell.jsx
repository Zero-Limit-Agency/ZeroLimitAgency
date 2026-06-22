import Image from "next/image";
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

      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <Link className={styles.identity} href="/" aria-label="Retour à Zero Limit Agency">
            <span className={styles.logoMark}><Image src="/assets/zero-limit-logo.png" alt="" width={28} height={28} /></span>
            <span><strong>Zero Limit</strong><small>Formation YouTube</small></span>
          </Link>

          <nav className={styles.nav} aria-label="Navigation Formation YouTube">
            {learnYoutubeNavItems.map((item) => (
              <a href={item.href} key={item.href}>{item.label}</a>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <Link className={styles.ghostLink} href="/">Retour Zero Limit</Link>
            <a className={styles.primaryLink} href="#offres">Ouverture prochainement</a>
          </div>

          <details className={styles.mobileMenu}>
            <summary>Menu</summary>
            <nav aria-label="Navigation mobile Formation YouTube">
              {learnYoutubeNavItems.map((item) => (
                <a href={item.href} key={item.href}>{item.label}</a>
              ))}
              <a href="#offres">Ouverture prochainement</a>
              <Link href="/">Retour Zero Limit</Link>
            </nav>
          </details>
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
          <span className={styles.eyebrow}>Zero Limit Agency</span>
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
          <span className={styles.eyebrow}>Formation YouTube</span>
          <h1>{title}</h1>
          <p>Cette section n'a pas pu être affichée correctement. Aucun détail technique sensible n'est exposé.</p>
          {onRetry ? (
            <button className={styles.primaryLink} type="button" onClick={onRetry}>Réessayer</button>
          ) : null}
          <Link className={styles.secondaryLink} href="/">
            Revenir à l'accueil principal
          </Link>
        </div>
      </section>
    </main>
  );
}
