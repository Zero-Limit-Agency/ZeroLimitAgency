"use client";

import { useMemo, useState } from "react";

import styles from "./dropmap.module.css";

const PROFILES = [
  { id: "theory", label: "Théorique", rotation: -10, destination: 58, route: 62 },
  { id: "competitive", label: "Compétitif", rotation: 12, destination: 70, route: 72 },
  { id: "safe", label: "Sécurisé", rotation: -22, destination: 46, route: 52 }
];

const LAYERS = ["Bus", "Relief", "Saut", "Déploiement", "Approche"];

export function DropMapVisualDemo() {
  const [profileId, setProfileId] = useState(PROFILES[1].id);
  const [destination, setDestination] = useState(64);
  const [bus, setBus] = useState(12);
  const [showRelief, setShowRelief] = useState(true);
  const profile = PROFILES.find((item) => item.id === profileId) || PROFILES[1];

  const style = useMemo(
    () => ({
      "--demo-rotation": `${bus + profile.rotation / 3}deg`,
      "--demo-destination": `${destination}%`,
      "--demo-route": `${profile.route}%`
    }),
    [bus, destination, profile]
  );

  return (
    <div className={styles.demoShell} style={style}>
      <div className={styles.demoStage} data-relief={showRelief ? "visible" : "hidden"}>
        <div className={styles.toolTopbar}><span /><span /><span /><strong>Interface de démonstration</strong></div>
        <div className={styles.demoGrid}>
          <div className={styles.demoMap}>
            <div className={styles.mapMass} />
            <div className={styles.mapRidge} />
            <div className={styles.mapRidgeAlt} />
            <div className={styles.demoBusLine} />
            <div className={styles.demoRouteLine} />
            <div className={styles.demoAltRoute} />
            <span className={styles.jumpPoint}>Saut</span>
            <span className={styles.deployPoint}>Deploy</span>
            <span className={styles.demoDestination}>Arrivée</span>
          </div>
          <aside className={styles.demoControls}>
            <div className={styles.profileSwitch}>
              {PROFILES.map((item) => (
                <button key={item.id} type="button" aria-pressed={item.id === profile.id} onClick={() => setProfileId(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <label><span>Ligne de bus</span><input type="range" min="-24" max="24" value={bus} onChange={(event) => setBus(Number(event.target.value))} /></label>
            <label><span>Destination</span><input type="range" min="34" max="78" value={destination} onChange={(event) => setDestination(Number(event.target.value))} /></label>
            <button type="button" onClick={() => setShowRelief((value) => !value)}>{showRelief ? "Masquer le relief" : "Afficher le relief"}</button>
          </aside>
        </div>
      </div>
      <div className={styles.layerRail}>{LAYERS.map((layer) => <span key={layer}>{layer}</span>)}</div>
    </div>
  );
}
