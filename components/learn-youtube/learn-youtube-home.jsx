import Link from "next/link";

import {
  learnYoutubeFaq,
  learnYoutubeLearningFeatures,
  learnYoutubeOffers,
  learnYoutubePacks,
  learnYoutubeSteps
} from "@/lib/learn-youtube/home-content";

import styles from "./learn-youtube.module.css";

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className={styles.sectionHeading}>
      <p className={styles.kicker}>{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function LearnYoutubeHome() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <section className={styles.hero} id="presentation">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Formation YouTube par Zero Limit Agency</p>
          <h1>Développez vos compétences pour créer sur YouTube</h1>
          <p>
            Une formation structurée autour du montage, du graphisme, de la monétisation et des bases essentielles pour
            construire et faire évoluer un projet YouTube.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryLink} href="#packs">
              Découvrir les packs
            </a>
            <a className={styles.secondaryButton} href="#fonctionnement">
              Voir le fonctionnement
            </a>
          </div>
        </div>

        <aside className={styles.heroVisual} aria-label="Aperçu abstrait de la structure Formation YouTube">
          <div className={styles.videoFrame}>
            <span className={styles.playMark} aria-hidden="true" />
            <div>
              <strong>Formation YouTube</strong>
              <small>Pack → Module → Leçon</small>
            </div>
          </div>
          <div className={styles.visualGrid} aria-hidden="true">
            <span>Montage</span>
            <span>Graphisme</span>
            <span>Monétisation</span>
            <span>Les bases</span>
          </div>
        </aside>
      </section>

      <section className={styles.contentSection} id="packs">
        <SectionHeading
          eyebrow="Les quatre packs"
          title="Choisissez une thématique ou avancez avec la formation complète"
          description="Chaque pack correspond à un axe de travail précis. Les packs sont aussi inclus dans les offres complètes prévues."
        />
        <div className={styles.packGrid}>
          {learnYoutubePacks.map((pack) => (
            <article className={styles.packCard} key={pack.title}>
              <div className={styles.cardTopline}>
                <h3>{pack.title}</h3>
                <span>{pack.price}</span>
              </div>
              <p>{pack.description}</p>
              <ul className={styles.tagList}>
                {pack.themes.map((theme) => (
                  <li key={theme}>{theme}</li>
                ))}
              </ul>
              <p className={styles.includedLabel}>Inclus dans la formation complète</p>
              <a className={styles.disabledAction} href="#fonctionnement" aria-label={`Voir la structure prévue pour le pack ${pack.title}`}>
                Voir le programme prévu
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contentSection} id="fonctionnement">
        <SectionHeading
          eyebrow="Fonctionnement"
          title="Une progression simple : Pack → Module → Leçon"
          description="L'espace de formation est conçu pour réunir les contenus, la progression et les ressources autour d'un parcours lisible."
        />
        <div className={styles.flowCard} aria-label="Hiérarchie de la formation">
          <span>Formation YouTube</span>
          <strong>Pack</strong>
          <strong>Module</strong>
          <strong>Leçon</strong>
        </div>
        <div className={styles.stepGrid}>
          {learnYoutubeSteps.map((step, index) => (
            <article className={styles.stepCard} key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.splitSection} aria-labelledby="apprendre-title">
        <div>
          <p className={styles.kicker}>Pensée pour apprendre</p>
          <h2 id="apprendre-title">Un futur espace clair pour suivre vos leçons</h2>
          <p>
            Votre futur espace de formation réunira les outils nécessaires pour suivre les vidéos, retrouver les
            ressources utiles et garder le fil de votre progression.
          </p>
        </div>
        <ul className={styles.featureList}>
          {learnYoutubeLearningFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className={styles.contentSection} id="offres">
        <SectionHeading
          eyebrow="Offres prévues"
          title="Trois formats d'accès, sans achat actif pour le moment"
          description="Les offres sont présentées pour clarifier la structure prévue. Aucun bouton ne crée de commande à cette étape."
        />
        <div className={styles.offerGrid}>
          {learnYoutubeOffers.map((offer) => (
            <article className={`${styles.offerCard} ${offer.highlighted ? styles.highlightedOffer : ""}`.trim()} key={offer.name}>
              <p className={styles.offerName}>{offer.name}</p>
              <strong>{offer.price}</strong>
              <p>{offer.description}</p>
              <ul>
                {offer.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <span className={styles.disabledAction}>{offer.cta}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.previewSection} aria-labelledby="interface-title">
        <div className={styles.sectionHeading}>
          <p className={styles.kicker}>Aperçu de l'espace client</p>
          <h2 id="interface-title">Une interface en cours de conception</h2>
          <p>
            Cette représentation est un aperçu statique. Elle ne correspond pas encore à un dashboard fonctionnel.
          </p>
        </div>
        <div className={styles.dashboardMock}>
          <div className={styles.mockHeader}>
            <span>Aperçu de l'interface en cours de conception</span>
            <strong>Progression globale</strong>
          </div>
          <div className={styles.progressBar} aria-hidden="true">
            <span />
          </div>
          <div className={styles.mockGrid}>
            <article>
              <small>Leçon à reprendre</small>
              <strong>Structurer son projet YouTube</strong>
            </article>
            <article>
              <small>Packs disponibles</small>
              <strong>4 thématiques</strong>
            </article>
            <article>
              <small>Prochaine étape</small>
              <strong>Mettre en pratique</strong>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.contentSection} id="questions">
        <SectionHeading
          eyebrow="Questions fréquentes"
          title="Les points importants avant l'ouverture"
          description="Ces réponses décrivent le fonctionnement prévu sans annoncer de fonctionnalité déjà disponible."
        />
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
        <p className={styles.kicker}>Prochaine ouverture</p>
        <h2>La Formation YouTube se prépare chez Zero Limit.</h2>
        <p>
          Les accès, les packs et les contenus seront ouverts progressivement lorsque la partie formation sera prête.
        </p>
        <div className={styles.heroActions}>
          <a className={styles.primaryLink} href="#packs">
            Revoir les packs
          </a>
          <Link className={styles.secondaryButton} href="/">
            Retour à Zero Limit Agency
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>Zero Limit Agency</strong>
          <span>Formation YouTube</span>
        </div>
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
