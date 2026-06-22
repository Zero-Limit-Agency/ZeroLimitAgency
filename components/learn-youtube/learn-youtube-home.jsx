import Link from "next/link";

import {
  learnYoutubeFaq,
  learnYoutubeLearningFeatures,
  learnYoutubeOffers,
  learnYoutubePacks
} from "@/lib/learn-youtube/home-content";

import styles from "./learn-youtube.module.css";

function PackVisual({ type }) {
  if (type === "thumbnail") {
    return <div className={styles.thumbVisual}><span>HOOK</span><strong>MINIATURE</strong><em>Contraste · Typo · Identité</em></div>;
  }
  if (type === "monetization") {
    return <div className={styles.monetizationVisual}><span>Offre</span><span>Partenaire</span><span>Tarif</span><span>Process</span></div>;
  }
  if (type === "launch") {
    return <div className={styles.launchVisual}><strong>Positionnement</strong><span>Idée</span><span>Script</span><span>Tournage</span><span>Publication</span></div>;
  }
  return <div className={styles.timelineVisual}><i /><i /><i /><b /><b /><b /></div>;
}

function SectionIntro({ eyebrow, title, children }) {
  return (
    <div className={styles.sectionIntro}>
      <p className={styles.kicker}>{eyebrow}</p>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function LearnYoutubeHome() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <section className={styles.hero} id="presentation">
        <div className={styles.heroMedia} aria-hidden="true">
          <div className={styles.heroStoryboard}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.heroTimeline}>
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Formation YouTube par Zero Limit Agency</p>
          <h1>Maîtrisez la création sur YouTube.</h1>
          <p>
            Montage, graphisme, monétisation et stratégie : développez les compétences nécessaires pour donner une vraie dimension à vos projets.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryLink} href="#programme">Découvrir le programme</a>
            <a className={styles.secondaryButton} href="#experience">Voir l'expérience</a>
          </div>
          <div className={styles.heroProof} aria-label="Résumé du programme">
            <span>4 grands axes</span>
            <span>Pack → Module → Leçon</span>
            <span>Espace dédié en conception</span>
          </div>
        </div>
      </section>

      <section className={styles.transitionBand} aria-label="Couverture de la Formation YouTube">
        <strong>Formation YouTube</strong>
        <span>4 grands axes</span>
        <span>Pack → Module → Leçon</span>
        <span>Plusieurs expertises formatrices</span>
      </section>

      <section className={styles.program} id="programme">
        <SectionIntro
          eyebrow="Programme"
          title="Une formation construite autour des compétences qui font réellement la différence sur YouTube."
        >
          Chaque axe est présenté comme un univers de travail : montage, image, modèle économique et direction de projet.
        </SectionIntro>

        <div className={styles.packStories}>
          {learnYoutubePacks.map((pack, index) => (
            <article className={`${styles.packStory} ${index % 2 ? styles.packStoryReverse : ""}`} key={pack.title}>
              <div className={styles.packVisual} data-visual={pack.visual}>
                <PackVisual type={pack.visual} />
              </div>
              <div className={styles.packText}>
                <span className={styles.packNumber}>{pack.number}</span>
                <p className={styles.kicker}>{pack.price} · {pack.label}</p>
                <h3>{pack.title}</h3>
                <p>{pack.description}</p>
                <ul>
                  {pack.themes.map((theme) => <li key={theme}>{theme}</li>)}
                </ul>
                <a className={styles.textLink} href="#structure">Voir la logique pédagogique</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.structureSection} id="structure">
        <SectionIntro eyebrow="Structure pédagogique" title="Pack → Module → Leçon, une hiérarchie lisible dès l'ouverture.">
          La représentation ci-dessous prépare l'expérience finale sans annoncer de fonctionnalité déjà disponible.
        </SectionIntro>
        <div className={styles.learningMap}>
          <aside>
            <strong>Pack ouvert</strong>
            <span>Montage</span>
            <span>Graphisme</span>
            <span>Monétisation</span>
            <span>Se lancer / Les bases</span>
          </aside>
          <div className={styles.modulePath}>
            <div><small>Pack</small><strong>Montage</strong></div>
            <div><small>Module</small><strong>Rythme et narration</strong></div>
            <div><small>Leçon</small><strong>Construire une timeline efficace</strong></div>
          </div>
          <ul className={styles.futureFeatures}>
            {learnYoutubeLearningFeatures.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        </div>
      </section>

      <section className={styles.showreelSection} aria-labelledby="showreel-title">
        <div>
          <p className={styles.kicker}>Démonstration</p>
          <h2 id="showreel-title">Un espace prévu pour une bande-annonce, un showreel ou une présentation vidéo.</h2>
        </div>
        <div className={styles.showreelPlaceholder}>
          <span>Média Zero Limit à intégrer prochainement</span>
        </div>
      </section>

      <section className={styles.trainingExperience} id="experience">
        <SectionIntro eyebrow="Expérience" title="Un aperçu plus crédible de l'espace de formation.">
          Aperçu de l'interface en cours de conception : lecteur, leçons, progression, notes et ressources réunis autour du cours.
        </SectionIntro>
        <div className={styles.courseMockup}>
          <div className={styles.playerMock}><span>Aperçu de l'interface en cours de conception</span></div>
          <aside className={styles.lessonPanel}>
            <strong>Pack Montage</strong>
            <span className={styles.progressLine}><i /></span>
            <button type="button">Leçon suivante</button>
            <ol>
              <li>Préparer ses rushs</li>
              <li>Construire la timeline</li>
              <li>Affiner rythme et sound design</li>
            </ol>
          </aside>
          <div className={styles.notesPanel}><strong>Notes privées</strong><p>Zone prévue pour conserver les idées, ressources et points à reprendre.</p></div>
          <div className={styles.resourcePanel}><strong>Ressources</strong><p>Fichiers et supports liés à la leçon lorsqu'ils sont prévus.</p></div>
        </div>
      </section>

      <section className={styles.trainersSection} id="formateurs">
        <SectionIntro eyebrow="Formateurs" title="Plusieurs expertises pour couvrir chaque pack avec sérieux.">
          La formation est pensée autour de formateurs spécialisés par axe : montage, graphisme, monétisation et bases stratégiques.
        </SectionIntro>
        <div className={styles.trainerFrame}>
          <div className={styles.trainerSlots} aria-hidden="true"><span /><span /><span /></div>
          <div>
            <h3>Les formateurs seront présentés prochainement.</h3>
            <p>Cette zone accueillera les photos, noms, spécialités, packs et biographies courtes lorsque les informations finales seront validées.</p>
          </div>
        </div>
      </section>

      <section className={styles.pricingSection} id="offres">
        <SectionIntro eyebrow="Offres" title="Trois formats d'accès, sans checkout actif pour le moment.">
          Les offres clarifient la structure prévue. Aucun bouton ne lance de paiement à cette étape.
        </SectionIntro>
        <div className={styles.pricingTable}>
          {learnYoutubeOffers.map((offer) => (
            <article className={offer.highlighted ? styles.featuredOffer : ""} key={offer.name}>
              <p>{offer.name}</p>
              <strong>{offer.price}</strong>
              <span>{offer.description}</span>
              <ul>{offer.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <a href={offer.highlighted ? "#programme" : "#programme"}>{offer.cta}</a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.faqSection} id="faq">
        <SectionIntro eyebrow="FAQ" title="Les points importants avant l'ouverture." />
        <div className={styles.faqList}>
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
          <p className={styles.kicker}>Prochaine ouverture</p>
          <h2>La Formation YouTube se prépare chez Zero Limit.</h2>
          <p>Une page plus immersive est prête pour la preview administrateur. Les vrais médias pourront être intégrés dès validation.</p>
          <a className={styles.primaryLink} href="#programme">Revoir le programme</a>
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
