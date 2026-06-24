import Link from "next/link";

import { DropMapAdminPreviewBadge } from "@/components/dropmap/dropmap-admin-preview-badge";
import { DropMapVisualDemo } from "@/components/dropmap/dropmap-visual-demo";

import styles from "./dropmap.module.css";

const NAV_ITEMS = [
  ["Présentation", "presentation"],
  ["Fonctionnalités", "fonctionnalites"],
  ["Simulation", "simulation"],
  ["Technologie", "technologie"],
  ["Accès", "acces"]
];

const challengeItems = [
  "Direction variable du bus",
  "Relief 3D, montagnes et vallées",
  "Déploiement automatique",
  "Early Deploy, Glider Cut et Redeploy",
  "Glide Cancel",
  "Eau, tyroliennes et surfaces spéciales",
  "Différences Battle Royale, Reload et OG"
];

const featureColumns = [
  {
    title: "Lecture de trajectoire",
    status: "En conception",
    items: ["Trajectoire du bus", "Maps 3D", "Calcul des angles", "Routes validées"]
  },
  {
    title: "Phases de vol",
    status: "En calibration",
    items: ["Auto Deploy", "Early Deploy", "Glider Cut", "Redeploy", "Glide Cancel"]
  },
  {
    title: "Profils de décision",
    status: "Prototype",
    items: ["Théorique", "Compétitif", "Sécurisé", "Arrivées spéciales"]
  },
  {
    title: "Compatibilité maps",
    status: "Prévu",
    items: ["Battle Royale", "Reload", "OG", "Versions adaptées aux mises à jour"]
  }
];

const workflow = [
  "Choisir la map et le mode",
  "Définir la trajectoire du bus",
  "Sélectionner la destination",
  "Lancer l'analyse",
  "Exécuter la route recommandée"
];

const technologyItems = [
  "Moteur générique exécuté côté serveur",
  "Profils de modes séparés de l'interface",
  "Maps versionnées et données de terrain contrôlées",
  "Calibration et tests réels avant publication",
  "Confidentialité des paramètres internes"
];

export function DropMapShell({ mode = "public", isAdminPreview = false }) {
  return (
    <main className={styles.shell}>
      <section className={styles.frame}>
        <nav className={styles.localNav} aria-label="Navigation DropMap">
          <Link className={styles.brandLink} href="/">
            Zero Limit Agency
          </Link>
          <div className={styles.navLinks}>
            {NAV_ITEMS.map(([label, anchor]) => (
              <a href={`#${anchor}`} key={anchor}>
                {label}
              </a>
            ))}
          </div>
        </nav>

        <header className={styles.hero} id="presentation">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Zero Limit Lab · DropMap</p>
            <h1>Chaque seconde commence avant l'atterrissage.</h1>
            <p className={styles.lead}>
              Analyse le bus, comprends le relief et prépare la trajectoire la plus rapide vers ton point d'arrivée.
            </p>
            <div className={styles.heroBadges} aria-label="Statut DropMap">
              <span>Accès actuellement privé</span>
              <span>Moteur en calibration</span>
              {isAdminPreview ? <span>Aperçu administrateur</span> : null}
            </div>
          </div>
          <div className={styles.headerActions}>
            {isAdminPreview ? <DropMapAdminPreviewBadge mode={mode} /> : null}
            <Link className={styles.secondaryButton} href="#acces">
              Voir le statut
            </Link>
          </div>
        </header>

        <div className={styles.notice} role="note">
          <strong>Aperçu d'interface — données de démonstration</strong>
          <span>Aucun calcul, angle, score, temps ou résultat Fortnite réel n'est exposé dans cette phase.</span>
        </div>

        <section className={styles.productScene} aria-label="Grande scène produit DropMap">
          <div className={styles.mapPanel} aria-label="Zone cartographique abstraite de démonstration">
            <div className={styles.gridOverlay} />
            <div className={styles.terrainLineOne} />
            <div className={styles.terrainLineTwo} />
            <div className={styles.terrainLineThree} />
            <div className={styles.busLine} aria-hidden="true" />
            <div className={`${styles.marker} ${styles.markerJump}`} aria-label="Point de saut illustratif" />
            <div className={`${styles.marker} ${styles.markerDeploy}`} aria-label="Point de déploiement illustratif" />
            <div className={`${styles.marker} ${styles.markerDestination}`} aria-label="Destination illustrative" />
            <div className={styles.routeArc} aria-hidden="true" />
            <div className={styles.timelinePanel}>
              <span>Timeline</span>
              <ol>
                <li>Bus · Prévu</li>
                <li>Saut · Non configurée</li>
                <li>Déploiement · Désactivé</li>
                <li>Arrivée · En calibration</li>
              </ol>
            </div>
            <div className={styles.mapLabel}>
              <span>Carte abstraite</span>
              <strong>Moteur en calibration</strong>
            </div>
          </div>

          <aside className={styles.controlPanel} aria-label="Panneau de préparation visuel">
            <div className={styles.panelHeader}>
              <span>Préparation</span>
              <strong>Désactivé</strong>
            </div>
            <div className={styles.fieldPreview}>
              <span>Map</span>
              <strong>Non configurée</strong>
            </div>
            <div className={styles.fieldPreview}>
              <span>Mode</span>
              <strong>Prévu</strong>
            </div>
            <div className={styles.fieldPreview}>
              <span>Destination</span>
              <strong>En calibration</strong>
            </div>
            <button className={styles.primaryButton} type="button" disabled>
              Analyse désactivée
            </button>
            <p className={styles.panelNote}>
              Cette scène valide l'expérience produit uniquement. Les paramètres privés et le moteur de calcul restent absents du frontend.
            </p>
          </aside>
        </section>

        <section className={styles.whySection} aria-labelledby="dropmap-why-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Pourquoi DropMap</p>
            <h2 id="dropmap-why-title">L'atterrissage parfait dépend de détails invisibles à l'œil nu.</h2>
            <p>
              DropMap est pensé pour structurer ces contraintes sans révéler de coefficient, de paramètre privé ou de logique métier sensible.
            </p>
          </div>
          <div className={styles.challengeRibbon}>
            {challengeItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className={styles.featureSection} id="fonctionnalites" aria-labelledby="dropmap-features-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Fonctionnalités</p>
            <h2 id="dropmap-features-title">Une interface technique, calibrée pour rester honnête avant le moteur.</h2>
          </div>
          <div className={styles.featureMosaic}>
            {featureColumns.map((feature, index) => (
              <article className={`${styles.featureCard} ${index === 0 ? styles.featureCardLarge : ""}`} key={feature.title}>
                <span>{feature.status}</span>
                <h3>{feature.title}</h3>
                <ul>
                  {feature.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.workflowSection} aria-labelledby="dropmap-workflow-title">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Méthode</p>
            <h2 id="dropmap-workflow-title">Comment cela fonctionnera.</h2>
          </div>
          <ol className={styles.workflowList}>
            {workflow.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </section>

        <DropMapVisualDemo />

        <section className={styles.techTrustGrid} id="technologie" aria-label="Technologie et confiance DropMap">
          <article className={styles.deepPanel}>
            <p className={styles.eyebrow}>Technologie</p>
            <h2>Architecture confidentielle, interface lisible.</h2>
            <ul>
              {technologyItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.deepPanel}>
            <p className={styles.eyebrow}>Confiance</p>
            <h2>Pas de chiffres inventés, pas de promesse artificielle.</h2>
            <p>
              Les résultats seront annoncés uniquement lorsqu'ils auront été mesurés. DropMap distinguera toujours théorie, recommandation et route validée avant publication.
            </p>
          </article>
        </section>

        <section className={styles.accessSection} id="acces" aria-labelledby="dropmap-access-title">
          <div>
            <p className={styles.eyebrow}>Accès et statut</p>
            <h2 id="dropmap-access-title">Accès actuellement privé.</h2>
            <p>
              Preview réservée aux administrateurs. Moteur en cours de calibration. Aucun prix, pack, abonnement ou liste d'attente publique n'est affiché à ce stade.
            </p>
          </div>
          <div className={styles.accessStatus}>
            <span>Accès actuellement privé</span>
            <span>Preview réservée aux administrateurs</span>
            <span>Moteur en cours de calibration</span>
          </div>
        </section>

        <footer className={styles.footer}>
          <strong>Zero Limit Agency · DropMap</strong>
          <div>
            <Link href="/">Retour accueil</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/politique-de-confidentialite">Confidentialité</Link>
            <Link href="/#contact">Contact</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
