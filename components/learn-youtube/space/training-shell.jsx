import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";

import styles from "./training-space.module.css";

export function TrainingShell({ children }) {
  return (
    <main className={styles.shell}>
      <div className={styles.frame}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>Zero Limit · Formation</div>
          <nav className={styles.nav} aria-label="Navigation formation">
            <Link href="/learn-youtube/espace">Accueil</Link>
            <Link href="/learn-youtube/espace#packs">Mes packs</Link>
            <Link href="/learn-youtube/espace#favoris">Favoris</Link>
            <Link href="/learn-youtube/espace#notes">Notes</Link>
            <Link href="/espace-client">Profil</Link>
            <Link href="/">Site principal</Link>
          </nav>
          <div style={{ marginTop: 12 }}>
            <LogoutButton className={styles.logout} />
          </div>
        </aside>
        <div className={styles.main}>{children}</div>
      </div>
    </main>
  );
}

export { styles };
