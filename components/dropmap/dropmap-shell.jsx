import Link from "next/link";

import { DropMapAdminPreviewBadge } from "@/components/dropmap/dropmap-admin-preview-badge";

import styles from "./dropmap.module.css";

const visualSteps = [
  "Carte abstraite",
  "Trajectoire de bus illustrative",
  "Panneau de préparation",
  "Moteur en calibration"
];

export function DropMapShell({ mode = "public", isAdminPreview = false }) {
  return (
    <main className={styles.shell}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Zero Limit Lab</p>
            <h1>DropMap</h1>
            <p className={styles.lead}>
              Fondation confidentielle de l'interface DropMap. Le moteur de calcul n'est pas encore actif : cette preview présente uniquement une structure visuelle premium.
            </p>
          </div>
          <div className={styles.headerActions}>
            {isAdminPreview ? <DropMapAdminPreviewBadge mode={mode} /> : null}
            <Link className={styles.secondaryButton} href="/">
              Retour au site
            </Link>
          </div>
        </header>

        <div className={styles.notice} role="note">
          <strong>Aperçu d'interface — données de démonstration</strong>
          <span>Aucun calcul, coefficient, résultat Fortnite ou donnée terrain réelle n'est exposé dans cette phase.</span>
        </div>

        <section className={styles.workspace} aria-label="Aperçu visuel DropMap">
          <div className={styles.mapPanel} aria-label="Zone cartographique abstraite de démonstration">
            <div className={styles.gridOverlay} />
            <div className={styles.terrainLineOne} />
            <div className={styles.terrainLineTwo} />
            <div className={styles.busLine} aria-hidden="true" />
            <div className={`${styles.marker} ${styles.markerStart}`} aria-hidden="true" />
            <div className={`${styles.marker} ${styles.markerEnd}`} aria-hidden="true" />
            <div className={styles.routeArc} aria-hidden="true" />
            <div className={styles.mapLabel}>
              <span>Carte abstraite</span>
              <strong>Moteur en calibration</strong>
            </div>
          </div>

          <aside className={styles.controlPanel} aria-label="Panneau de configuration visuel">
            <div className={styles.panelHeader}>
              <span>Configuration</span>
              <strong>Préparation</strong>
            </div>
            <div className={styles.fieldPreview}>
              <span>Map</span>
              <strong>Non configurée</strong>
            </div>
            <div className={styles.fieldPreview}>
              <span>Mode</span>
              <strong>À définir</strong>
            </div>
            <div className={styles.fieldPreview}>
              <span>Destination</span>
              <strong>Sélection désactivée</strong>
            </div>
            <button className={styles.primaryButton} type="button" disabled>
              Calcul indisponible
            </button>
            <p className={styles.panelNote}>
              Les futures autorisations payantes et le moteur physique seront ajoutés dans des phases séparées.
            </p>
          </aside>
        </section>

        <section className={styles.statusGrid} aria-label="État de la fondation DropMap">
          {visualSteps.map((step, index) => (
            <article className={styles.statusCard} key={step}>
              <small>0{index + 1}</small>
              <strong>{step}</strong>
              <p>État de fondation visuelle, sans donnée sensible ni simulation fonctionnelle.</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
