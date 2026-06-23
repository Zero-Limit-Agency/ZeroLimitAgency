"use client";

import Link from "next/link";

import styles from "@/components/dropmap/dropmap.module.css";

export default function DropMapError() {
  return (
    <main className={`${styles.shell} ${styles.maintenanceShell}`}>
      <section className={styles.maintenanceCard}>
        <p className={styles.eyebrow}>Indisponible</p>
        <h1>Cette page est temporairement indisponible.</h1>
        <p>Veuillez réessayer ultérieurement ou revenir à l'accueil.</p>
        <Link className={styles.secondaryButton} href="/">
          Retour à l'accueil
        </Link>
      </section>
    </main>
  );
}
