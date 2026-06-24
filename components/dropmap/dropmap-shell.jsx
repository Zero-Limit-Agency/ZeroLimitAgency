import Image from "next/image";
import Link from "next/link";

import { DropMapAdminPreviewBadge } from "@/components/dropmap/dropmap-admin-preview-badge";
import { DropMapVisualDemo } from "@/components/dropmap/dropmap-visual-demo";

import styles from "./dropmap.module.css";

const navItems = [
  ["Pourquoi", "#pourquoi"],
  ["Analyse", "#analyse"],
  ["Profils", "#profils"],
  ["Modes", "#modes"],
  ["FAQ", "#faq"]
];

const problemFactors = [
  "Distance réelle depuis le bus",
  "Hauteur du terrain",
  "Moment du saut",
  "Angle de chute",
  "Déploiement automatique",
  "Phase de planeur",
  "Dernier mouvement avant l'arrivée"
];

const routeLayers = ["Bus", "Relief", "Point de saut", "Déploiement", "Approche finale"];

const playerOutputs = [
  "Quand quitter le bus",
  "Quelle direction suivre",
  "Quand modifier l'inclinaison",
  "Où déployer",
  "Quelle route d'approche utiliser",
  "Quel profil choisir",
  "Quelles contraintes surveiller"
];

const profiles = [
  ["Théorique", "Priorité au temps minimum absolu, pour comparer la route la plus directe possible."],
  ["Compétitif", "Priorité à une route rapide mais répétable sous pression, avec une exécution réaliste."],
  ["Sécurisé", "Priorité à la régularité, aux marges d'erreur et à une arrivée plus stable."]
];

const scenarios = [
  "Relief élevé",
  "Vallée",
  "Bord de falaise",
  "Eau",
  "Tyrolienne",
  "Redeploy",
  "Early Deploy",
  "Glider Cut",
  "Glide Cancel",
  "Battle Royale / Reload / OG"
];

const modeCards = [
  ["Battle Royale", "Hauteur, bus, planeur, saisons et surfaces évoluent avec la map principale."],
  ["Reload", "Distances plus compactes, rythme accéléré et décisions de drop plus fréquentes."],
  ["OG", "Lecture spécifique des anciennes maps, des reliefs et des règles de déplacement associées."]
];

const useCases = [
  ["Préparer un tournoi", "Comparer les options de drop avant une session compétitive."],
  ["Travailler un dropspot", "Répéter une trajectoire jusqu'à obtenir une ouverture stable."],
  ["Comparer deux routes", "Choisir entre vitesse, répétabilité et marge d'erreur."],
  ["Adapter une mise à jour", "Réévaluer une route lorsque la map, le bus ou le mode change."],
  ["Transmettre à une équipe", "Partager une lecture claire avec les joueurs qui exécutent le plan."]
];

const accessBenefits = ["Sauvegarde des drops", "Comparaison des routes", "Historique", "Partage", "Accès aux maps", "Mises à jour"];

const faq = [
  ["Comment DropMap détermine-t-il le meilleur moment pour sauter ?", "DropMap croise la position du bus, la destination, le relief et le profil choisi pour proposer une lecture de route exploitable."],
  ["Le relief de la map est-il pris en compte ?", "Oui. La hauteur du terrain, les vallées, les falaises et les surfaces particulières font partie des contraintes qui influencent une trajectoire."],
  ["Quelle différence entre une route théorique, compétitive et sécurisée ?", "La route théorique recherche le minimum absolu, la compétitive privilégie une exécution rapide et répétable, la sécurisée garde plus de marge d'erreur."],
  ["DropMap fonctionne-t-il pour Battle Royale, Reload et OG ?", "L'approche produit sépare les modes afin de respecter leurs règles, leurs maps et leurs conditions de déplacement."],
  ["Les routes sont-elles adaptées après les mises à jour Fortnite ?", "Une route utile doit être recalibrée lorsque la map, les déplacements ou les règles du mode évoluent."],
  ["Puis-je sauvegarder et partager mes drops ?", "L'expérience est pensée pour conserver, comparer et transmettre des routes à un joueur ou à une équipe."],
  ["DropMap fonctionne-t-il pour une destination personnalisée ?", "Oui, le principe central est de partir d'un point d'arrivée choisi et d'en déduire une trajectoire lisible."],
  ["Les calculs et paramètres sensibles sont-ils visibles publiquement ?", "Non. Les calculs sont exécutés côté serveur et seuls les résultats utiles sont envoyés à l'interface."]
];

function RoutePreview({ variant = "optimized" }) {
  return (
    <div className={`${styles.routePreview} ${styles[`routePreview${variant}`] || ""}`}>
      <div className={styles.mapMass} />
      <div className={styles.mapRidge} />
      <div className={styles.mapRidgeAlt} />
      <div className={styles.busLine} />
      <div className={styles.routeLine} />
      <div className={styles.altRouteLine} />
      <span className={styles.jumpPoint}>Saut</span>
      <span className={styles.deployPoint}>Deploy</span>
      <span className={styles.destinationPoint}>Arrivée</span>
    </div>
  );
}

function SectionIntro({ eyebrow, title, description, align = "center" }) {
  return (
    <div className={`${styles.sectionIntro} ${align === "left" ? styles.sectionIntroLeft : ""}`}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function DropMapShell({ mode = "public", isAdminPreview = false }) {
  const currentYear = new Date().getFullYear();

  return (
    <main className={styles.shell}>
      {isAdminPreview ? <DropMapAdminPreviewBadge mode={mode} /> : null}

      <header className={styles.headerWrap}>
        <div className={styles.header}>
          <Link className={styles.identity} href="/" aria-label="Retour à Zero Limit Agency">
            <span className={styles.logoMark}><Image src="/assets/zero-limit-logo.png" alt="" width={28} height={28} /></span>
            <span><strong>Zero Limit</strong><small>DropMap</small></span>
          </Link>
          <nav className={styles.nav} aria-label="Navigation DropMap">
            {navItems.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
          </nav>
          <div className={styles.headerActions}>
            <Link className={styles.ghostLink} href="/">Retour Zero Limit</Link>
            <a className={styles.primaryLink} href="#analyse">Voir l'analyse</a>
          </div>
          <details className={styles.mobileMenu}>
            <summary>Menu</summary>
            <nav aria-label="Navigation mobile DropMap">
              {navItems.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
              <Link href="/">Retour Zero Limit</Link>
            </nav>
          </details>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>DropMap · Optimisation de drop</span>
          <h1>Ton drop ne commence pas quand tu sautes. Il commence quand tu comprends la route.</h1>
          <p>DropMap transforme la trajectoire du bus, le relief et ton point d'arrivée en une route de drop claire, répétable et adaptée au mode joué.</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryLink} href="#analyse">Voir comment DropMap analyse une route</a>
            <a className={styles.secondaryLink} href="#demo">Explorer l'interface</a>
          </div>
        </div>
        <div className={styles.heroTool} aria-label="Aperçu cartographique DropMap">
          <div className={styles.toolTopbar}><span /><span /><span /><strong>DropMap Route Lab</strong></div>
          <RoutePreview />
          <aside className={styles.toolResultCard}>
            <span>Route recommandée</span>
            <strong>Profil compétitif</strong>
            <p>Quitter le bus, stabiliser la chute, préparer le déploiement puis verrouiller l'approche finale.</p>
          </aside>
        </div>
      </section>

      <section className={styles.problemSection} id="pourquoi">
        <div className={styles.problemCopy}>
          <SectionIntro eyebrow="Le problème réel" title="Deux joueurs visent le même point. Un seul arrive prêt à jouer." description="Un drop se joue sur une suite de micro-décisions que les outils classiques résument trop souvent à une distance à vol d'oiseau." align="left" />
          <ul className={styles.factorList}>{problemFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
        </div>
        <div className={styles.comparisonPanel}>
          <article><span>Route intuitive</span><RoutePreview variant="intuitive" /><p>Une ligne simple peut ignorer la hauteur, l'angle et la phase de planeur.</p></article>
          <article><span>Route optimisée</span><RoutePreview variant="optimized" /><p>Une route lisible sépare bus, saut, déploiement et approche finale.</p></article>
        </div>
      </section>

      <section className={styles.analysisSection} id="analyse">
        <SectionIntro eyebrow="Analyse d'une route" title="DropMap lit une trajectoire par couches, pas comme un simple trait sur une carte." description="Chaque couche raconte une partie du drop : où passe le bus, comment le terrain s'élève, quand quitter la trajectoire, où préparer le planeur et comment finir l'approche." />
        <div className={styles.layerScene}>
          <RoutePreview />
          <div className={styles.layerRail}>{routeLayers.map((layer) => <span key={layer}>{layer}</span>)}</div>
        </div>
      </section>

      <section className={styles.resultSection}>
        <div className={styles.resultInterface}>
          <div className={styles.toolTopbar}><span /><span /><span /><strong>Route joueur</strong></div>
          <div className={styles.resultBody}>
            <RoutePreview />
            <ol>{playerOutputs.map((output) => <li key={output}>{output}</li>)}</ol>
          </div>
        </div>
        <SectionIntro eyebrow="Ce que reçoit le joueur" title="Une instruction exploitable, pas une carte décorative." description="La valeur de DropMap est de transformer les variables du départ en indications concrètes que le joueur peut répéter en partie." align="left" />
      </section>

      <section className={styles.profileSection} id="profils">
        <SectionIntro eyebrow="Profils de route" title="Même destination, trois façons de construire le drop." description="Le meilleur choix dépend du niveau de risque accepté, de la régularité recherchée et du contexte de la partie." />
        <div className={styles.profileMap}><RoutePreview />{profiles.map(([name, text], index) => <article className={styles.profileCard} data-profile={index} key={name}><h3>{name}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.scenarioSection}>
        <SectionIntro eyebrow="Situations complexes" title="Les bons drops changent quand le terrain, les règles ou les mouvements changent." description="DropMap est pensé pour analyser des scénarios de jeu, pas pour empiler des modules abstraits." align="left" />
        <div className={styles.scenarioGrid}>{scenarios.map((scenario) => <span key={scenario}>{scenario}</span>)}</div>
      </section>

      <section className={styles.gestureSection}>
        <div className={styles.gesturePanel}>
          <RoutePreview />
          <div className={styles.gestureSteps}><span>01 · Trace le bus</span><span>02 · Place ton point</span><span>03 · Suis la route</span></div>
        </div>
        <SectionIntro eyebrow="Utilisation" title="Trois gestes pour passer d'une intention à une route." description="L'interface garde le joueur concentré sur ce qui compte : la ligne du bus, le point d'arrivée et la route à exécuter." align="left" />
      </section>

      <section className={styles.demoSection} id="demo">
        <SectionIntro eyebrow="Interface de démonstration" title="Compare les profils, déplace la destination et observe la route évoluer." description="Cette scène montre la logique d'utilisation : la carte reste centrale, les contrôles sont proches et la recommandation reste lisible." />
        <DropMapVisualDemo />
      </section>

      <section className={styles.modesSection} id="modes">
        <SectionIntro eyebrow="Modes et maps" title="Chaque environnement impose ses propres contraintes de drop." description="Battle Royale, Reload et OG n'ont pas la même hauteur, le même rythme, les mêmes règles de déplacement ni les mêmes saisons de map." />
        <div className={styles.modeGrid}>{modeCards.map(([name, text]) => <article key={name}><RoutePreview /><h3>{name}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.reliabilitySection}>
        <SectionIntro eyebrow="Fiabilité" title="Une route utile doit fonctionner en partie, pas seulement sur le papier." description="DropMap distingue le meilleur temps théorique d'une route compétitive, conserve la version de la map et adapte ses recommandations aux changements importants." align="left" />
        <div className={styles.reliabilityPanel}><span>Conditions réelles</span><span>Recalibration après mise à jour</span><span>Niveau de confiance</span><span>Version map et mode</span></div>
      </section>

      <section className={styles.useCaseSection}>
        <SectionIntro eyebrow="Cas d'usage" title="Un outil pour préparer, comparer et transmettre un drop." description="DropMap sert autant au joueur solo qui travaille son spot qu'à une équipe qui veut aligner son plan d'ouverture." />
        <div className={styles.useCaseGrid}>{useCases.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.accessSection}>
        <SectionIntro eyebrow="Accès" title="Un accès pensé pour les joueurs et les équipes." description="Le produit peut évoluer vers plusieurs niveaux d'usage sans afficher de prix non validé : individuel, équipe et analyse avancée." align="left" />
        <div className={styles.accessBenefits}>{accessBenefits.map((benefit) => <span key={benefit}>{benefit}</span>)}</div>
      </section>

      <section className={styles.faqSection} id="faq">
        <SectionIntro eyebrow="FAQ" title="Les questions utiles avant de préparer une route." />
        <div className={styles.faqPanel}>{faq.map(([question, answer]) => <details className={styles.faqItem} key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span className={styles.eyebrow}>Zero Limit Agency</span>
          <h2>Prépare ton drop avant que la partie ne commence.</h2>
          <p>Choisis une destination, comprends la route et transforme ton ouverture en avantage reproductible.</p>
          <div className={styles.heroActions}>
            {isAdminPreview ? <Link className={styles.primaryLink} href="/admin/dropmap">Gérer DropMap</Link> : <a className={styles.primaryLink} href="#demo">Ouvrir DropMap</a>}
            <a className={styles.secondaryLink} href="#analyse">Découvrir les routes</a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><strong>Zero Limit Agency</strong><span>DropMap</span></div>
        <nav aria-label="Liens légaux DropMap">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/politique-de-confidentialite">Confidentialité</Link>
          <Link href="/#contact">Contact</Link>
          <Link href="/">Retour site principal</Link>
        </nav>
        <p>© {currentYear} Zero Limit Agency · Projet indépendant non affilié à Epic Games.</p>
      </footer>
    </main>
  );
}
