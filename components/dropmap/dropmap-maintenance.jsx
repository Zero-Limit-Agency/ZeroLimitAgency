import Link from "next/link";

import styles from "./dropmap.module.css";

export function DropMapMaintenance({ message }) {
  return (
    <main className={`${styles.shell} ${styles.maintenanceShell}`}>
      <section className={styles.maintenanceCard} aria-labelledby="dropmap-maintenance-title">
        <p className={styles.eyebrow}>Maintenance</p>
        <h1 id="dropmap-maintenance-title">DropMap est temporairement indisponible.</h1>
        <p>{message}</p>
        <Link className={styles.secondaryButton} href="/">
          Retour à l'accueil
        </Link>
      </section>
    </main>
  );
}
