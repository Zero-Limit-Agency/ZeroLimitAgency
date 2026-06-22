import Link from "next/link";

import {
  learnYoutubeFaq,
  learnYoutubeHighlights,
  learnYoutubeHowItWorks,
  learnYoutubeOffers,
  learnYoutubePacks,
  learnYoutubeTrainerSlots
} from "@/lib/learn-youtube/home-content";

import styles from "./learn-youtube.module.css";

function SectionHeader({ eyebrow, title, description, actionHref, actionLabel }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actionHref && actionLabel ? <a className={styles.primaryLink} href={actionHref}>{actionLabel}</a> : null}
    </div>
  );
}

function InterfacePreview({ compact = false }) {
  return (
    <div className={`${styles.interfacePreview} ${compact ? styles.interfacePreviewCompact : ""}`}>
      <div className={styles.previewTopbar}>
        <span />
        <span />
        <span />
        <strong>Formation YouTube</strong>
      </div>
      <div className={styles.previewBody}>
        <div className={styles.previewPlayer}>
          <span>Aperçu de l'interface en cours de conception</span>
          <div className={styles.playerControls}><i /><b /><b /></div>
        </div>
        <aside className={styles.previewLessons}>
          <strong>Pack Montage</strong>
          <small>Rythme et narration</small>
          <div className={styles.progressTrack}><i /></div>
          <ol>
            <li>Préparer ses rushs</li>
            <li>Construire la timeline</li>
            <li>Affiner le sound design</li>
          </ol>
          <button type="button">Leçon suivante</button>
        </aside>
      </div>
    </div>
  );
}

function CardVisual({ type }) {
  return (
    <div className={styles.cardVisual} data-visual={type}>
      {type === "editing" ? (
        <div className={styles.timelineMock}><span /><span /><i /><i /><i /><b /></div>
      ) : null}
      {type === "design" ? (
        <div className={styles.thumbnailMock}><strong>Miniature</strong><span>Typo · contraste · identité</span></div>
      ) : null}
      {type === "business" ? (
        <div className={styles.businessMock}><span>Proposition</span><span>Tarification</span><span>Partenariat</span></div>
      ) : null}
      {type === "launch" ? (
        <div className={styles.roadmapMock}><span>Idée</span><span>Plan</span><span>Vidéo</span><span>Publication</span></div>
      ) : null}
    </div>
  );
}

function StepVisual({ type }) {
  return (
    <div className={styles.stepVisual} data-step={type}>
      {type === "path" ? <><span /><span /><span /></> : null}
      {type === "modules" ? <><i /><i /><i /><i /></> : null}
      {type === "progress" ? <><b /><strong>Pack → Module → Leçon</strong></> : null}
    </div>
  );
}

export function LearnYoutubeHome() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <section className={styles.hero} id="presentation">
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Formation YouTube</span>
          <h1>Créez, structurez et développez vos projets YouTube.</h1>
          <p>
            Une formation Zero Limit pensée pour réunir montage, graphisme, monétisation et bases stratégiques dans une expérience d'apprentissage premium.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryLink} href="#programme">Découvrir le programme</a>
            <a className={styles.secondaryLink} href="#fonctionnement">Voir l'expérience</a>
          </div>
          <div className={styles.heroProduct}>
            <InterfacePreview compact />
          </div>
        </div>
      </section>

      <section className={styles.reassurance} aria-label="Informations réelles sur la Formation YouTube">
        {learnYoutubeHighlights.map((item) => <span key={item}>{item}</span>)}
      </section>

      <section className={styles.section} id="fonctionnement">
        <SectionHeader
          eyebrow="Comment ça marche"
          title="Une progression claire, dans un espace pensé pour apprendre."
          description="La Formation YouTube reste structurée autour d'un parcours simple : choisir un axe, suivre ses modules, puis avancer leçon après leçon."
          actionHref="#programme"
          actionLabel="Voir le programme"
        />
        <div className={styles.stepsPanel}>
          {learnYoutubeHowItWorks.map((step) => (
            <article className={styles.stepCard} key={step.title}>
              <StepVisual type={step.visual} />
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="programme">
        <SectionHeader
          eyebrow="Programme"
          title="Quatre packs spécialisés, un même système de formation."
          description="Chaque pack dispose d'un grand espace de contenu, de modules dédiés et de ressources associées lorsqu'elles sont prévues."
        />
        <div className={styles.packGrid}>
          {learnYoutubePacks.map((pack) => (
            <article className={styles.packCard} key={pack.title}>
              <CardVisual type={pack.visual} />
              <div className={styles.packContent}>
                <div>
                  <h3>{pack.title}</h3>
                  <strong>{pack.price}</strong>
                </div>
                <p>{pack.description}</p>
                <ul>{pack.themes.map((theme) => <li key={theme}>{theme}</li>)}</ul>
                <span>Inclus dans la Formation complète</span>
                <a href="#fonctionnement">Découvrir le contenu</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="experience">
        <SectionHeader
          eyebrow="Espace de formation"
          title="Un aperçu d'interface conçu comme un vrai produit."
          description="Le panneau ci-dessous montre la direction prévue : lecteur, progression, leçons, formateur, notes, ressources et commentaires."
        />
        <div className={styles.learningPanel}>
          <InterfacePreview />
          <div className={styles.learningMeta}>
            <div>
              <span>Leçon</span>
              <strong>Construire une timeline efficace</strong>
            </div>
            <div>
              <span>Formateur</span>
              <strong>Présentation prochainement</strong>
            </div>
            <nav aria-label="Zones prévues autour de la leçon">
              <span>Notes</span>
              <span>Ressources</span>
              <span>Commentaires</span>
            </nav>
          </div>
        </div>
      </section>

      <section className={styles.section} id="formateurs">
        <SectionHeader
          eyebrow="Formateurs"
          title="Une équipe spécialisée sera présentée lorsque les informations seront validées."
          description="Aucun faux profil n'est affiché : cette section prépare simplement la place pour les photos, noms, spécialités, packs et réseaux."
        />
        <div className={styles.trainerGrid}>
          {learnYoutubeTrainerSlots.map((trainer) => (
            <article className={styles.trainerCard} key={trainer.specialty}>
              <div className={styles.trainerVisual}><span>ZL</span></div>
              <div>
                <h3>Présentation prochainement</h3>
                <p>{trainer.specialty}</p>
                <small>{trainer.pack}</small>
                <span>Réseaux à ajouter</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="offres">
        <SectionHeader
          eyebrow="Offres"
          title="Des accès clairs, sans achat actif pour le moment."
          description="Les offres présentent la structure prévue. Aucun checkout ni paiement n'est connecté à cette page."
        />
        <div className={styles.offersPanel}>
          {learnYoutubeOffers.map((offer) => (
            <article className={`${styles.offerCard} ${offer.highlighted ? styles.offerFeatured : ""}`} key={offer.name}>
              <p>{offer.name}</p>
              <strong>{offer.price}</strong>
              <span>{offer.description}</span>
              <ul>{offer.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <a href="#programme">{offer.cta}</a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="faq">
        <SectionHeader eyebrow="FAQ" title="Les réponses essentielles avant l'ouverture." />
        <div className={styles.faqPanel}>
          {learnYoutubeFaq.map((item) => (
            <details className={styles.faqItem} key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span className={styles.eyebrow}>Zero Limit Agency</span>
          <h2>Donnez une nouvelle dimension à vos projets YouTube.</h2>
          <p>
            Une formation pensée pour réunir les compétences essentielles à la création, à la progression et au développement de votre projet.
          </p>
          <a className={styles.primaryLink} href="#programme">Découvrir le programme</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><strong>Zero Limit Agency</strong><span>Formation YouTube</span></div>
        <nav aria-label="Liens légaux Formation YouTube">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/conditions-generales-de-vente">CGV</Link>
          <Link href="/politique-de-confidentialite">Confidentialité</Link>
          <Link href="/">Retour au site principal</Link>
        </nav>
        <p>© {currentYear} Zero Limit Agency</p>
      </footer>
    </>
  );
}
