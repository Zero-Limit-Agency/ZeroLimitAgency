import Link from "next/link";

import { DropMapAdminPreviewBadge } from "@/components/dropmap/dropmap-admin-preview-badge";
import { DropMapVisualDemo } from "@/components/dropmap/dropmap-visual-demo";

import styles from "./dropmap.module.css";

const navItems = [
  ["Présentation", "#presentation"],
  ["Fonctionnalités", "#fonctionnalites"],
  ["Simulation", "#simulation"],
  ["Technologie", "#technologie"],
  ["Accès", "#acces"]
];

const featureGroups = [
  {
    title: "Lecture du départ",
    status: "En conception",
    items: ["Trajectoire du bus", "Types de spawn", "Fenêtre de saut"]
  },
  {
    title: "Environnement",
    status: "Prévu",
    items: ["Relief 3D", "Surfaces spéciales", "Arrivées eau / tyrolienne"]
  },
  {
    title: "Exécution",
    status: "En calibration",
    items: ["Auto Deploy", "Early Deploy", "Glider Cut", "Redeploy"]
  },
  {
    title: "Décision joueur",
    status: "Prototype",
    items: ["Profils théorique", "Compétitif", "Sécurisé", "Routes vérifiées"]
  }
];

const processSteps = [
  ["01", "Choisir la map et le mode", "La page préparera des profils distincts pour Battle Royale, Reload, OG et les variantes futures."],
  ["02", "Définir la trajectoire", "Le départ restera paramétrable sans exposer les règles internes du moteur."],
  ["03", "Sélectionner la destination", "Le joueur cible une arrivée, puis l’analyse serveur préparera une route exploitable."],
  ["04", "Lancer l’analyse", "Les calculs sensibles resteront côté serveur et ne seront pas envoyés au navigateur."],
  ["05", "Lire la route", "Le résultat distinguera théorie, compétition et sécurité quand le moteur sera validé."]
];

const foundations = [
  "Maps versionnées",
  "Profils de modes",
  "Moteur générique",
  "Calcul serveur",
  "Calibration terrain",
  "Validation par tests réels"
];

export function DropMapShell({ mode = "public", isAdminPreview = false }) {
  return (
    <main className={styles.shell}>
      <div className={styles.topographicVeil} aria-hidden="true" />

      <header className={styles.localHeader}>
        <Link className={styles.brand} href="/" aria-label="Retour à Zero Limit Agency">
          <span className={styles.brandMark}>ZL</span>
          <span><strong>Zero Limit</strong><small>DropMap Lab</small></span>
        </Link>

        <nav className={styles.localNav} aria-label="Navigation locale DropMap">
          {navItems.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>

        <div className={styles.headerActions}>
          {isAdminPreview ? <DropMapAdminPreviewBadge mode={mode} /> : null}
          <Link className={styles.ghostButton} href="/admin/dropmap">Configuration</Link>
        </div>
      </header>

      <section className={styles.hero} id="presentation">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Outil esport en préparation</p>
          <h1>Chaque seconde commence avant l’atterrissage.</h1>
          <p className={styles.heroLead}>
            DropMap prépare une lecture premium du bus, du relief et des phases de drop afin d’aider les joueurs à comprendre la route la plus pertinente avant même de sauter.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#simulation">Voir la démonstration</a>
            <Link className={styles.secondaryButton} href="/admin/dropmap">Continuer vers la configuration</Link>
          </div>
          <div className={styles.statusStrip} aria-label="État actuel DropMap">
            <span>Accès actuellement privé</span>
            <span>Moteur en calibration</span>
            <span>Aperçu administrateur</span>
          </div>
        </div>

        <ProductScene />
      </section>

      <section className={styles.problemSection}>
        <div>
          <p className={styles.eyebrow}>Pourquoi DropMap</p>
          <h2>Le drop n’est pas une ligne droite. C’est une suite de décisions.</h2>
        </div>
        <div className={styles.problemGrid}>
          <p>La trajectoire du bus change l’ouverture possible. Le relief influence le déploiement. Les longueurs de trajet peuvent transformer une bonne route en retard décisif.</p>
          <p>Early Deploy, Glider Cut, redéploiement, eau, tyroliennes ou glide cancel devront être traités comme des contextes d’exécution, pas comme de simples icônes sur une carte.</p>
        </div>
      </section>

      <section className={styles.featureSection} id="fonctionnalites">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Fonctionnalités prévues</p>
          <h2>Une architecture pensée pour évoluer sans reconstruire le moteur.</h2>
          <p>Les blocs ci-dessous décrivent la vision produit. Ils ne sont pas présentés comme des fonctions actives tant que le moteur n’est pas validé.</p>
        </div>
        <div className={styles.featureMosaic}>
          {featureGroups.map((group, index) => (
            <article className={`${styles.featureCard} ${index === 1 ? styles.featureCardTall : ""}`} key={group.title}>
              <span>{group.status}</span>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.processSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Comment cela fonctionnera</p>
          <h2>Une progression claire, du bus à la route recommandée.</h2>
        </div>
        <div className={styles.processRail}>
          {processSteps.map(([number, title, text]) => (
            <article className={styles.processStep} key={number}>
              <small>{number}</small>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.demoSection} id="simulation">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Simulation visuelle</p>
          <h2>Manipuler l’interface sans déclencher de calcul.</h2>
          <p>Cette zone sert uniquement à valider le langage d’interaction. Elle ne contacte aucun moteur, ne produit aucun résultat réel et n’expose aucune logique sensible.</p>
        </div>
        <DropMapVisualDemo />
      </section>

      <section className={styles.techSection} id="technologie">
        <div className={styles.techPanel}>
          <p className={styles.eyebrow}>Fondations techniques</p>
          <h2>Calcul serveur, données protégées, calibration mesurable.</h2>
          <p>DropMap est pensé autour d’un moteur générique, de maps versionnées et de profils de modes. Les paramètres internes, calibrations et fichiers terrain resteront côté serveur.</p>
        </div>
        <div className={styles.foundationGrid}>
          {foundations.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className={styles.trustSection}>
        <div>
          <p className={styles.eyebrow}>Confiance</p>
          <h2>Conçu pour être mesuré, pas seulement impressionnant.</h2>
        </div>
        <div className={styles.promiseGrid}>
          <article><strong>Aucune fausse précision</strong><p>Les résultats devront être qualifiés avec difficulté, tolérance et fiabilité.</p></article>
          <article><strong>Validation terrain</strong><p>Les prédictions seront comparées à des tests réels avant d’être considérées comme exploitables.</p></article>
          <article><strong>À venir</strong><p>Emplacements réservés pour routes validées, partenaires et retours joueurs réels.</p></article>
        </div>
      </section>

      <section className={styles.accessSection} id="acces">
        <div>
          <p className={styles.eyebrow}>Accès</p>
          <h2>Preview privée aujourd’hui. Page publique demain, seulement quand le produit sera prêt.</h2>
          <p>Aucun prix, pack ou abonnement n’est défini dans cette phase. La visibilité reste séparée des futurs accès payants.</p>
        </div>
        <div className={styles.accessActions}>
          <Link className={styles.primaryButton} href="/admin/dropmap">Continuer vers la configuration</Link>
          <Link className={styles.secondaryButton} href="/admin">Retour à l’administration</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>Zero Limit Agency</strong>
          <p>DropMap est une fondation produit indépendante en préparation. DropMap n’est pas affilié à Epic Games.</p>
        </div>
        <nav aria-label="Liens légaux DropMap">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/politique-de-confidentialite">Confidentialité</Link>
          <Link href="/conditions-generales-d-utilisation">CGU</Link>
          <Link href="/">Contact</Link>
        </nav>
      </footer>
    </main>
  );
}

function ProductScene() {
  return (
    <aside className={styles.productScene} aria-label="Aperçu abstrait du produit DropMap">
      <div className={styles.sceneToolbar}>
        <span>Aperçu d’interface — données de démonstration</span>
        <strong>Moteur en calibration</strong>
      </div>
      <div className={styles.sceneMap}>
        <div className={styles.sceneGrid} />
        <div className={styles.sceneContourOne} />
        <div className={styles.sceneContourTwo} />
        <div className={styles.sceneBus} />
        <div className={styles.sceneRoute} />
        <span className={`${styles.sceneMarker} ${styles.sceneMarkerJump}`}>Saut</span>
        <span className={`${styles.sceneMarker} ${styles.sceneMarkerDeploy}`}>Deploy</span>
        <span className={`${styles.sceneMarker} ${styles.sceneMarkerEnd}`}>Arrivée</span>
      </div>
      <div className={styles.scenePanels}>
        <div><span>Map</span><strong>Non configurée</strong></div>
        <div><span>Profil</span><strong>Compétitif · prévu</strong></div>
        <div><span>Résultat</span><strong>Désactivé</strong></div>
      </div>
    </aside>
  );
}
