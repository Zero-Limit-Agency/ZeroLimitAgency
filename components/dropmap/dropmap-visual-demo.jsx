"use client";

import { useMemo, useState } from "react";

import styles from "./dropmap.module.css";

const VISUAL_MODES = [
  { id: "theory", label: "Théorique", busRotation: -8, markerX: 62, markerY: 42 },
  { id: "competitive", label: "Compétitif", busRotation: 14, markerX: 72, markerY: 56 },
  { id: "safe", label: "Sécurisé", busRotation: -22, markerX: 48, markerY: 64 }
];

export function DropMapVisualDemo() {
  const [modeId, setModeId] = useState(VISUAL_MODES[0].id);
  const [marker, setMarker] = useState(58);
  const mode = VISUAL_MODES.find((item) => item.id === modeId) || VISUAL_MODES[0];

  const visualStyle = useMemo(
    () => ({
      "--demo-bus-rotation": `${mode.busRotation}deg`,
      "--demo-marker-x": `${Math.max(16, Math.min(84, marker))}%`,
      "--demo-marker-y": `${mode.markerY}%`,
      "--demo-route-x": `${mode.markerX}%`
    }),
    [marker, mode]
  );

  return (
    <section className={styles.demoSection} id="simulation" aria-labelledby="dropmap-demo-title">
      <div className={styles.sectionIntro}>
        <p className={styles.eyebrow}>Simulation</p>
        <h2 id="dropmap-demo-title">Démonstration visuelle — aucun calcul réel</h2>
        <p>
          Ajuste la trajectoire illustrative et le point de destination pour comprendre l'interface prévue. Cette démonstration reste locale au navigateur, sans appel API, sans résultat réel et sans stockage de donnée.
        </p>
      </div>

      <div className={styles.demoLayout} style={visualStyle}>
        <div className={styles.demoMap} aria-label="Démonstration abstraite interactive">
          <div className={styles.gridOverlay} />
          <div className={styles.demoReliefOne} />
          <div className={styles.demoReliefTwo} />
          <div className={styles.demoBusLine} aria-hidden="true" />
          <div className={styles.demoRoute} aria-hidden="true" />
          <div className={styles.demoStart} aria-label="Point de saut illustratif" />
          <div className={styles.demoMarker} aria-label="Destination illustrative" />
          <div className={styles.demoLabel}>
            <span>État</span>
            <strong>En calibration</strong>
          </div>
        </div>

        <aside className={styles.demoControls} aria-label="Contrôles de démonstration visuelle">
          <div>
            <span className={styles.controlLabel}>Mode visuel</span>
            <div className={styles.segmentedControls}>
              {VISUAL_MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.segmentedButton}${item.id === mode.id ? ` ${styles.segmentedButtonActive}` : ""}`}
                  aria-pressed={item.id === mode.id}
                  onClick={() => setModeId(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className={styles.rangeControl}>
            <span className={styles.controlLabel}>Position du marqueur</span>
            <input
              type="range"
              min="22"
              max="78"
              value={marker}
              onChange={(event) => setMarker(Number(event.target.value))}
            />
          </label>

          <div className={styles.demoDisclosure}>
            <strong>Désactivé</strong>
            <p>Aucune recommandation n'est produite dans cette phase. Les lignes évoluent uniquement pour valider la lisibilité de l'interface.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
