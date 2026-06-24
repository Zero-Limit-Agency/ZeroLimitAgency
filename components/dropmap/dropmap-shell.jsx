import Image from "next/image";
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

const highlights = [
  "Maps et modes versionnés",
  "Bus → Saut → Déploiement → Arrivée",
  "Profils Théorique / Compétitif / Sécurisé",
  "Calcul serveur protégé"
];

const whyCards = [
  {
    title: "Lire l'environnement",
    text: "Direction du bus, relief, vallées, surfaces particulières et distances structurent chaque départ avant même le saut.",
    visual: "terrain"
  },
  {
    title: "Construire la trajectoire",
    text: "Les phases de chute, de déploiement et de glide doivent rester cohérentes avec le mode choisi et la destination.",
    visual: "route"
  },
  {
    title: "Préparer l'arrivée",
    text: "DropMap séparera théorie, recommandation et route validée, sans exposer les paramètres internes du moteur.",
    visual: "arrival"
  }
];

const modules = [
  ["Lecture de trajectoire", "En conception", "Bus · relief · angles · routes", ["Trajectoire du bus", "Relief", "Routes validées"]],
  ["Phases de vol", "En calibration", "Saut · chute · deploy · glide · arrivée", ["Auto Deploy", "Early Deploy", "Glider Cut"]],
  ["Profils de décision", "Prototype", "Théorique · Compétitif · Sécurisé", ["Risque contrôlé", "Exécution", "Sécurité"]],
  ["Compatibilité maps", "Prévu", "Battle Royale · Reload · OG", ["Maps versionnées", "Modes séparés", "Mises à jour"]]
];

const methodSteps = [
  ["Préparer", "Choisir la map", "Définir le bus"],
  ["Analyser", "Placer la destination", "Lire le relief"],
  ["Exécuter", "Comparer le profil", "Suivre le drop"]
];

const pipeline = ["Map", "Mode", "Relief", "Moteur serveur", "Calibration", "Route validée"];

const reliability = [
  "Calibration sur des essais réels",
  "Distinction théorie / recommandation",
  "Maps et modes versionnés",
  "Routes contrôlées avant publication"
];

const accessMilestones = [
  ["Fondation interface", "Terminé", "Preview produit isolée et administration de visibilité."],
  ["Calibration moteur", "En cours", "Tests réels et validation des routes avant annonce."],
  ["Ouverture contrôlée", "Prévu", "Accès progressif uniquement lorsque la précision sera validée."]
];

const faq = [
  ["DropMap calcule-t-il déjà de vraies trajectoires ?", "Non. Cette page présente une interface et des interactions visuelles sans moteur de calcul réel."],
  ["Quelles maps seront prises en charge ?", "L'objectif est de travailler avec des maps et modes versionnés, notamment Battle Royale, Reload et OG lorsque les données seront validées."],
  ["Les résultats seront-ils identiques pour tous les modes ?", "Non. Les profils théorique, compétitif et sécurisé sont prévus pour séparer les intentions de route sans révéler de paramètres privés."],
  ["Les calculs seront-ils effectués dans le navigateur ?", "Non. Le futur calcul sensible est prévu côté serveur afin de protéger la logique interne."],
  ["Pourquoi l'accès est-il encore privé ?", "DropMap reste privé tant que la calibration, les tests réels et la précision annoncée ne sont pas validés."],
  ["DropMap est-il affilié à Epic Games ?", "Non. DropMap est un projet indépendant de Zero Limit Agency et n'est pas affilié à Epic Games."]
];

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function MiniVisual({ type }) {
  return (
    <div className={styles.miniVisual} data-visual={type}>
      <span /><span /><span /><i /><b />
    </div>
  );
}

function ProductPreview({ compact = false }) {
  return (
    <div className={`${styles.interfacePreview} ${compact ? styles.interfacePreviewCompact : ""}`}>
      <div className={styles.previewTopbar}>
        <span /><span /><span />
        <strong>DropMap</strong>
      </div>
      <div className={styles.previewBody}>
        <div className={styles.previewMap}>
          <div className={styles.mapMass} />
          <div className={styles.mapRidge} />
          <div className={styles.mapRidgeAlt} />
          <div className={styles.busLine} />
          <div className={styles.routeLine} />
          <span className={styles.jumpPoint}>Saut</span>
          <span className={styles.deployPoint}>Deploy</span>
          <span className={styles.destinationPoint}>Arrivée</span>
          <div className={styles.mapLegend}>Aperçu d'interface — données de démonstration</div>
        </div>
        <aside className={styles.previewPanel}>
          <strong>Préparation</strong>
          <small>Moteur en calibration</small>
          <div className={styles.progressTrack}><i /></div>
          <ol>
            <li>Map non configurée</li>
            <li>Bus prévu</li>
            <li>Analyse désactivée</li>
          </ol>
          <button type="button" disabled>Calcul indisponible</button>
        </aside>
      </div>
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
            <a className={styles.primaryLink} href="#simulation">Preview privée</a>
          </div>

          <details className={styles.mobileMenu}>
            <summary>Menu</summary>
            <nav aria-label="Navigation mobile DropMap">
              {navItems.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
              <a href="#simulation">Preview privée</a>
              <Link href="/">Retour Zero Limit</Link>
            </nav>
          </details>
        </div>
      </header>

      <section className={styles.hero} id="presentation">
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>DropMap · Zero Limit Lab</span>
          <h1>Chaque seconde commence avant l'atterrissage.</h1>
          <p>Analyse le bus, comprends le relief et prépare une trajectoire pensée pour atteindre ton point d'arrivée dans les meilleures conditions.</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryLink} href="#fonctionnement">Découvrir le fonctionnement</a>
            <a className={styles.secondaryLink} href="#simulation">Voir la simulation</a>
          </div>
          <div className={styles.heroProduct}><ProductPreview compact /></div>
        </div>
      </section>

      <section className={styles.reassurance} aria-label="Caractéristiques DropMap">
        {highlights.map((item) => <span key={item}>{item}</span>)}
      </section>

      <section className={styles.section} id="fonctionnement">
        <SectionHeader eyebrow="Pourquoi DropMap" title="Chaque trajectoire commence par des variables que le joueur ne voit pas." description="DropMap prépare une lecture claire de l'environnement sans publier de coefficient, de faux résultat ou de logique sensible." />
        <div className={styles.stepsPanel}>{whyCards.map((card) => <article className={styles.stepCard} key={card.title}><MiniVisual type={card.visual} /><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
      </section>

      <section className={styles.section} id="fonctionnalites">
        <SectionHeader eyebrow="Fonctionnalités" title="Quatre modules, un même système de précision." description="Les blocs ci-dessous décrivent les capacités visées avec des statuts honnêtes, sans activer le futur moteur." />
        <div className={styles.packGrid}>{modules.map(([title, status, description, tags], index) => <article className={styles.packCard} key={title}><MiniVisual type={`module-${index}`} /><div className={styles.packContent}><div><h3>{title}</h3><strong>{status}</strong></div><p>{description}</p><ul>{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul><span>Fondation visuelle DropMap</span><a href="#simulation">Voir l'état</a></div></article>)}</div>
      </section>

      <section className={styles.section}>
        <SectionHeader eyebrow="Méthode" title="Une route claire, de la map jusqu'à l'arrivée." description="La future expérience sera guidée en trois temps : préparer, analyser, puis exécuter le drop." />
        <div className={styles.methodPanel}>{methodSteps.map(([title, first, second], index) => <article className={styles.methodCard} key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{first}</p><p>{second}</p></article>)}</div>
      </section>

      <section className={styles.section} id="simulation">
        <SectionHeader eyebrow="Simulation" title="Une simulation visuelle pensée comme une vraie interface." description="La preview permet de tester la lecture de la carte et les contrôles sans appeler le futur moteur de calcul." />
        <DropMapVisualDemo />
      </section>

      <section className={styles.section} id="technologie">
        <SectionHeader eyebrow="Technologie" title="Une architecture conçue pour rester précise, versionnée et protégée." description="Le pipeline public reste volontairement générique : les calculs sensibles et paramètres internes ne sont pas exposés." />
        <div className={styles.pipelinePanel}>{pipeline.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className={styles.section}>
        <SectionHeader eyebrow="Fiabilité" title="Mesuré avant d'être annoncé." description="Aucune statistique fictive et aucun témoignage inventé : seulement les engagements de validation prévus avant publication." />
        <div className={styles.trustGrid}>{reliability.map((item) => <article key={item}><strong>{item}</strong><p>Engagement de validation avant toute annonce publique.</p></article>)}</div>
      </section>

      <section className={styles.section} id="acces">
        <SectionHeader eyebrow="Accès" title="Un accès contrôlé, sans ouverture publique pour le moment." description="DropMap reste privé pendant la calibration. Aucun prix, abonnement ou achat actif n'est affiché." />
        <div className={styles.offersPanel}>{accessMilestones.map(([name, status, text]) => <article className={styles.offerCard} key={name}><p>{name}</p><strong>{status}</strong><span>{text}</span><a href="#presentation">Consulter</a></article>)}</div>
      </section>

      <section className={styles.section} id="faq">
        <SectionHeader eyebrow="FAQ" title="Les réponses essentielles avant l'ouverture." />
        <div className={styles.faqPanel}>{faq.map(([question, answer]) => <details className={styles.faqItem} key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span className={styles.eyebrow}>Zero Limit Agency</span>
          <h2>Préparer chaque drop avant que la partie commence.</h2>
          <p>DropMap reste en preview privée pendant que l'interface, la calibration et les routes validées se construisent.</p>
          <div className={styles.heroActions}>
            {isAdminPreview ? <Link className={styles.primaryLink} href="/admin/dropmap">Gérer DropMap</Link> : null}
            <Link className={styles.secondaryLink} href="/">Retour à Zero Limit</Link>
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
