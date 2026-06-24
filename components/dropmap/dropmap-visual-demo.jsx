"use client";

import { useMemo, useState } from "react";

import styles from "./dropmap.module.css";

const MODES = [
  { id: "theory", label: "Théorique", rotation: -9, destination: 58 },
  { id: "competitive", label: "Compétitif", rotation: 13, destination: 70 },
  { id: "safe", label: "Sécurisé", rotation: -20, destination: 46 }
];

export function DropMapVisualDemo() {
  const [modeId, setModeId] = useState(MODES[0].id);
  const [destination, setDestination] = useState(58);
  const mode = MODES.find((item) => item.id === modeId) || MODES[0];

  const style = useMemo(
    () => ({
      "--demo-rotation": `${mode.rotation}deg`,
      "--demo-destination": `${destination}%`,
      "--demo-route": `${mode.destination}%`
    }),
    [destination, mode]
  );

  function resetDemo() {
    setModeId(MODES[0].id);
    setDestination(MODES[0].destination);
  }

  return (
    <div className={styles.learningPanel} style={style}>
      <div className={styles.interfacePreview}>
        <div className={styles.previewTopbar}>
          <span /><span /><span />
          <strong>Démonstration visuelle — aucun calcul réel</strong>
        </div>
        <div className={styles.previewBody}>
          <div className={styles.previewMap}>
            <div className={styles.mapMass} />
            <div className={styles.mapRidge} />
            <div className={styles.mapRidgeAlt} />
            <div className={styles.demoBusLine} />
            <div className={styles.demoRoute} />
            <span className={styles.jumpPoint}>Saut</span>
            <span className={styles.deployPoint}>Deploy</span>
            <span className={styles.demoDestination}>Destination</span>
            <div className={styles.mapLegend}>Lecture visuelle uniquement · données de démonstration</div>
          </div>
          <aside className={styles.previewPanel}>
            <strong>Contrôles</strong>
            <small>Aucun appel API moteur</small>
            <div className={styles.modeControls}>
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === mode.id}
                  className={item.id === mode.id ? styles.modeActive : ""}
                  onClick={() => setModeId(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className={styles.rangeControl}>
              <span>Position destination</span>
              <input type="range" min="34" max="78" value={destination} onChange={(event) => setDestination(Number(event.target.value))} />
            </label>
            <button type="button" onClick={resetDemo}>Réinitialiser</button>
          </aside>
        </div>
      </div>
      <div className={styles.learningMeta}>
        <div><span>Mode</span><strong>{mode.label}</strong></div>
        <div><span>Statut</span><strong>En calibration</strong></div>
        <nav aria-label="Légende de simulation DropMap"><span>Bus</span><span>Destination</span><span>Route illustrative</span></nav>
      </div>
    </div>
  );
}
