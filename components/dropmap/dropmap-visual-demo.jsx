"use client";

import { useState } from "react";

import styles from "./dropmap.module.css";

const demoModes = [
  {
    key: "competitive",
    label: "Compétitif",
    note: "Route illustrative plus directe, sans résultat réel."
  },
  {
    key: "safe",
    label: "Sécurisé",
    note: "Lecture visuelle plus tolérante, sans calcul moteur."
  },
  {
    key: "theory",
    label: "Théorique",
    note: "Variation de démonstration, non exploitable en match."
  }
];

export function DropMapVisualDemo() {
  const [activeMode, setActiveMode] = useState(demoModes[0]);

  return (
    <div className={`${styles.demoStage} ${styles[`demoStage${activeMode.key}`] || ""}`.trim()}>
      <div className={styles.demoMap} aria-label="Démonstration visuelle abstraite DropMap">
        <div className={styles.demoGrid} />
        <div className={styles.demoBusLine} />
        <div className={styles.demoRouteLine} />
        <span className={`${styles.demoPoint} ${styles.demoPointBus}`}>Bus</span>
        <span className={`${styles.demoPoint} ${styles.demoPointJump}`}>Saut</span>
        <span className={`${styles.demoPoint} ${styles.demoPointDeploy}`}>Deploy</span>
        <span className={`${styles.demoPoint} ${styles.demoPointLanding}`}>Arrivée</span>
      </div>

      <div className={styles.demoControls}>
        <p className={styles.demoKicker}>Démonstration visuelle — aucun calcul réel</p>
        <div className={styles.demoModeButtons} aria-label="Variantes de démonstration visuelle">
          {demoModes.map((mode) => (
            <button
              key={mode.key}
              type="button"
              className={mode.key === activeMode.key ? styles.demoModeActive : ""}
              onClick={() => setActiveMode(mode)}
              aria-pressed={mode.key === activeMode.key}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p>{activeMode.note}</p>
      </div>
    </div>
  );
}
