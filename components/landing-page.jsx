"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const reviews = [
  {
    quote:
      "On avait besoin d'une image plus solide et d'un message plus clair. Le repositionnement a immediatement change la perception.",
    author: "Retour a confirmer",
    role: "Fondateur"
  },
  {
    quote:
      "Le site et les assets crees nous ont donne une presence plus premium et plus coherente sur tous nos supports.",
    author: "Retour a confirmer",
    role: "Directeur de marque"
  },
  {
    quote:
      "Le plus fort, c'est le melange entre vision creative et vraie logique metier. Rien n'est decoratif pour rien.",
    author: "Retour a confirmer",
    role: "Entrepreneur"
  }
];

const projects = [
  {
    visualClass: "project-visual-one",
    label: "Projet / accompagnement 01",
    title: "Formation metier et structuration de posture",
    description:
      "Accompagnement d'un profil pour clarifier ses objectifs, sa relation client et sa valeur sur le long terme."
  },
  {
    visualClass: "project-visual-two",
    label: "Projet / accompagnement 02",
    title: "Logo et identite visuelle pour une structure",
    description:
      "Creation d'un univers graphique fort pour renforcer la presence d'une equipe ou d'une marque."
  },
  {
    visualClass: "project-visual-three",
    label: "Projet / accompagnement 03",
    title: "Support marketing, montage, 3D ou site web",
    description:
      "Production d'assets utiles pour rendre une structure plus claire, plus attractive et plus professionnelle."
  }
];

const news = [
  {
    mediaClass: "news-media-image",
    mediaLabel: "Image / video",
    date: "Avril 2026",
    title: "Lancement du nouveau site Zero Limit Agency",
    description:
      "Une base pensee pour evoluer avec les projets, les cas clients et les futures annonces."
  },
  {
    mediaClass: "news-media-video",
    mediaLabel: "Image / video",
    date: "Bientot",
    title: "Ajout des vraies actualites, articles et sorties",
    description:
      "Chaque news pourra accueillir une date, un titre, une description et un media."
  }
];

const ecosystem = [
  {
    type: "Outil",
    letter: "N",
    title: "Notion",
    description: "Organisation, suivi, documentation et pilotage des projets."
  },
  {
    type: "Outil",
    letter: "D",
    title: "Discord",
    description: "Communication, communaute et coordination operationnelle."
  },
  {
    type: "Partenaire",
    letter: "P",
    title: "Partenaires",
    description: "Zone a completer avec les marques et structures mises en avant."
  }
];

const faqItems = [
  {
    question: "Comment s'inscrire ?",
    answer:
      "L'inscription se fait directement sur le site via le formulaire prevu a cet effet. Il suffit de remplir les informations demandees puis d'envoyer la demande."
  },
  {
    question: "Y a-t-il un engagement lorsqu'on rejoint l'agence ?",
    answer:
      "Cela depend de l'accompagnement choisi et de ce qui sera precise dans le contrat. La duree, les modalites et le cadre de collaboration sont definis au moment du devis et de la signature."
  },
  {
    question: "Peut-on etre rembourse ?",
    answer:
      "Une fois l'inscription validee et l'accompagnement commence, il n'y a pas de remboursement possible. Pour toute situation particuliere, vous pouvez toujours nous contacter par mail ou sur X pour avoir plus d'informations."
  },
  {
    question: "Quels services peut-on demander ?",
    answer:
      "Nous pouvons intervenir sur le graphisme, le montage, la 3D, le web, le marketing, le management et l'accompagnement professionnel selon les besoins du projet."
  },
  {
    question: "Comment vous contacter si j'ai encore une question ?",
    answer:
      "Vous pouvez utiliser le formulaire d'inscription, nous ecrire par mail ou nous contacter sur X pour une demande rapide."
  }
];

const mediaEntries = {
  trailer: { label: "Media 1" },
  interview: { label: "Media 2" },
  gallery: { label: "Media 3" }
};

const countryOptions = [
  "France",
  "Belgique",
  "Suisse",
  "Luxembourg",
  "Espagne",
  "Royaume-Uni",
  "Canada",
  "Etats-Unis",
  "Autre"
];

const languageOptions = ["Francais", "Anglais", "Espagnol", "Allemand", "Italien", "Autre"];

function UserNavButton({ currentUser, closeNav }) {
  if (!currentUser) {
    return (
      <Link className="nav-cta" href="/connexion" onClick={closeNav}>
        Connexion
      </Link>
    );
  }

  return (
    <Link
      className="nav-profile-link"
      href={currentUser.href}
      onClick={closeNav}
      aria-label={currentUser.ariaLabel || "Acceder a votre espace"}
    >
      {currentUser.avatarUrl ? (
        <img className="nav-profile-avatar" src={currentUser.avatarUrl} alt="" />
      ) : (
        <span className="nav-profile-fallback">{currentUser.initials}</span>
      )}
    </Link>
  );
}

export function LandingPage({ currentUser = null }) {
  const [navOpen, setNavOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeMedia, setActiveMedia] = useState("trailer");
  const [formState, setFormState] = useState({
    status: "idle",
    message: "Le formulaire est pret. Vos demandes sont maintenant traitees dans un vrai espace applicatif."
  });

  const activeMediaContent = useMemo(() => {
    if (activeMedia === "trailer") {
      return (
        <article className="media-panel is-active" id="trailer-panel">
          <video
            className="trailer-video"
            src="/assets/zero-limit-trailer.mov"
            controls
            muted
            playsInline
            preload="metadata"
          />
        </article>
      );
    }

    if (activeMedia === "interview") {
      return (
        <article className="media-panel" id="interview-panel">
          <div className="media-placeholder">
            <strong>Media 2</strong>
            <p>Bloc pret pour une interview, une presentation ou une video complementaire.</p>
          </div>
        </article>
      );
    }

    return (
      <article className="media-panel" id="gallery-panel">
        <div className="media-placeholder media-placeholder-alt">
          <strong>Media 3</strong>
          <p>Bloc pret pour une image, une bande-annonce secondaire ou un autre support.</p>
        </div>
      </article>
    );
  }, [activeMedia]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const rawData = new FormData(form);
    const data = new FormData();
    const files = rawData.getAll("files").filter((file) => file instanceof File && file.size > 0);

    ["fullName", "birthDate", "username", "email", "password", "company", "country", "language", "request", "message"].forEach(
      (field) => {
        const value = rawData.get(field);

        if (value !== null) {
          data.append(field, value);
        }
      }
    );

    if (rawData.get("newsletter")) {
      data.append("newsletter", "on");
    }

    files.forEach((file) => {
      data.append("files", file, file.name);
    });

    setFormState({ status: "loading", message: "Envoi en cours..." });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: data
      });

      const contentType = response.headers.get("content-type") || "";
      let result = null;

      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          `Le serveur a renvoye une reponse non JSON (${response.status}). ${
            text.startsWith("<!DOCTYPE") ? "Une page d'erreur Next.js a ete renvoyee." : "Reponse inattendue."
          }`
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
      }

      setFormState({
        status: "success",
        message: result.message || "Votre demande a bien ete envoyee."
      });
      form.reset();

      if (result.client_space_url) {
        window.setTimeout(() => {
          window.location.assign(result.client_space_url);
        }, 1200);
      }
    } catch (error) {
      setFormState({
        status: "error",
        message: error.message || "Une erreur est survenue lors de l'envoi."
      });
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="container nav-shell">
          <a className="brand" href="#hero" aria-label="Accueil Zero Limit Agency">
            <span className="brand-badge">
              <img src="/assets/zero-limit-logo.png" alt="Logo Zero Limit Agency" />
            </span>
            <span className="brand-text">
              <strong>Zero Limit Agency</strong>
            </span>
          </a>

          <button
            className="nav-toggle"
            type="button"
            aria-expanded={navOpen}
            aria-controls="site-nav"
            onClick={() => setNavOpen((value) => !value)}
          >
            Menu
          </button>

          <nav
            className={`site-nav${navOpen ? " is-open" : ""}`}
            id="site-nav"
            aria-label="Navigation principale"
          >
            <a href="#hero" onClick={() => setNavOpen(false)}>
              Accueil
            </a>
            <a href="#reviews" onClick={() => setNavOpen(false)}>
              Avis
            </a>
            <a href="#showcase" onClick={() => setNavOpen(false)}>
              Projet & client
            </a>
            <a href="#news" onClick={() => setNavOpen(false)}>
              News
            </a>
            <a href="#ecosystem" onClick={() => setNavOpen(false)}>
              Outils & collaborateurs
            </a>
            <UserNavButton currentUser={currentUser} closeNav={() => setNavOpen(false)} />
          </nav>
        </div>
      </header>

      <main id="main" className="public-site">
        <section className="hero section" id="hero">
          <div className="hero-background" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy reveal is-visible">
              <p className="eyebrow">E-sport x Management x Marketing x Design</p>
              <h1>On aide les projets e-sport a devenir plus clairs, plus forts et plus memorables.</h1>
              <p className="hero-lead">
                Zero Limit Agency accompagne les talents, managers, equipes, structures et createurs
                avec une approche melant image, execution, accompagnement et strategie.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contact">
                  Faire une inscription
                </a>
              </div>
              <div className="hero-stats">
                <article className="stat-card reveal is-visible">
                  <strong>E-sport</strong>
                  <p>Equipes, joueurs, structures et dynamique competitive.</p>
                </article>
                <article className="stat-card reveal is-visible">
                  <strong>Creation</strong>
                  <p>Graphisme, montage, 3D, branding, contenus et sites web.</p>
                </article>
                <article className="stat-card reveal is-visible">
                  <strong>Accompagnement</strong>
                  <p>Objectifs, posture, relation client et progression professionnelle.</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="section intro-section" id="about">
          <div className="container split-grid media-layout">
            <div className="section-copy reveal is-visible">
              <p className="eyebrow">Description</p>
              <h2>Une agence construite pour renforcer l'image, la structure et la valeur percue.</h2>
              <p>
                Zero Limit Agency evolue entre e-sport, management, marketing et design avec une
                logique simple : aider un projet a mieux se presenter, mieux s'organiser et mieux
                progresser.
              </p>
              <p>
                On peut intervenir sur du graphisme, du montage, de la 3D, des sites web, mais aussi
                sur l'accompagnement de managers, graphistes, monteurs ou profils en developpement dans
                leur vie professionnelle.
              </p>
            </div>

            <div className="media-shell reveal is-visible" id="trailer">
              <div className="media-tabs" role="tablist" aria-label="Medias Zero Limit Agency">
                {Object.entries(mediaEntries).map(([key, value]) => (
                  <button
                    key={key}
                    className={`media-tab${activeMedia === key ? " is-active" : ""}`}
                    type="button"
                    onClick={() => setActiveMedia(key)}
                  >
                    <span className="tab-dot" />
                    <span>{value.label}</span>
                  </button>
                ))}
              </div>
              <div className="media-panels">{activeMediaContent}</div>
            </div>
          </div>
        </section>

        <section className="section section-soft" id="portal">
          <div className="container portal-card reveal is-visible">
            <div className="portal-copy">
              <p className="eyebrow">Connexion client</p>
              <h2>Un espace membre operationnel pour acceder aux fichiers, au suivi et aux ressources du dossier.</h2>
              <p>
                Une fois connecte, le client retrouve son profil, son resume de dossier, ses liens
                utiles, son espace Drive et la timeline de l'accompagnement.
              </p>
            </div>
            <div className="portal-panel">
              <div className="portal-box">
                <strong>Espace client en ligne</strong>
                <p>
                  La connexion client, les acces utiles, les ressources projet et le suivi du dossier
                  sont deja relies dans l'application.
                </p>
                <Link className="button button-dark" href={currentUser?.href || "/connexion"}>
                  {currentUser ? "Ouvrir mon espace" : "Se connecter"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-soft" id="reviews">
          <div className="container">
            <div className="section-heading section-heading-wide reveal is-visible">
              <p className="eyebrow">Avis clients</p>
              <h2>Des retours qui installent la preuve sociale des la page d'accueil.</h2>
            </div>
            <div className="reviews-grid">
              {reviews.map((review) => (
                <article key={review.quote} className="review-card reveal is-visible">
                  <p>"{review.quote}"</p>
                  <div className="review-meta">
                    <strong>{review.author}</strong>
                    <span>{review.role}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-dark" id="showcase">
          <div className="container">
            <div className="section-heading section-heading-wide reveal is-visible">
              <p className="eyebrow">Projet & client</p>
              <h2>Un seul espace pour montrer les projets livres et les profils accompagnes.</h2>
              <p>
                Cette zone peut raconter aussi bien une identite creee pour une equipe qu'un
                accompagnement metier pour un manager, un graphiste ou un monteur.
              </p>
            </div>
            <div className="projects-grid">
              {projects.map((project) => (
                <article key={project.title} className="project-card reveal is-visible">
                  <div className={`project-visual ${project.visualClass}`} />
                  <div className="project-copy">
                    <small>{project.label}</small>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="news">
          <div className="container">
            <div className="section-heading section-heading-wide reveal is-visible">
              <p className="eyebrow">News</p>
              <h2>Un espace pour montrer la vie de l'agence, les lancements et les coulisses.</h2>
            </div>
            <div className="news-grid">
              {news.map((item) => (
                <article key={item.title} className="news-card reveal is-visible">
                  <div className={`news-media ${item.mediaClass}`}>{item.mediaLabel}</div>
                  <span>{item.date}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="ecosystem">
          <div className="container">
            <div className="section-heading section-heading-wide reveal is-visible">
              <p className="eyebrow">Outils & collaborateurs</p>
              <h2>Les outils, partenaires et marques qui accompagnent l'agence au quotidien.</h2>
            </div>
            <div className="team-grid">
              {ecosystem.map((item) => (
                <article key={item.title} className="team-card reveal is-visible">
                  <span className="team-badge">
                    <span className="badge-dot" />
                    {item.type}
                  </span>
                  <div className="avatar-placeholder">{item.letter}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-soft" id="faq">
          <div className="container faq-grid">
            <div className="section-copy reveal is-visible">
              <p className="eyebrow">FAQ</p>
              <h2>Des reponses simples aux questions que les gens se posent avant de s'inscrire.</h2>
            </div>
            <div className="faq-list">
              {faqItems.map((item, index) => {
                const isOpen = activeFaq === index;
                return (
                  <article key={item.question} className="faq-item reveal is-visible">
                    <button
                      className="faq-trigger"
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                    >
                      {item.question}
                    </button>
                    <div className="faq-panel" style={{ maxHeight: isOpen ? "240px" : null }}>
                      <p>{item.answer}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div className="container contact-grid">
            <div className="section-copy reveal is-visible">
              <p className="eyebrow">Inscription</p>
              <h2>Le point d'entree pour les prises de contact, les devis et les partenariats.</h2>
              <p>
                Le formulaire est desormais branche a l'application. Les demandes sont enregistrees et
                peuvent ensuite etre traitees proprement cote administration.
              </p>
            </div>
            <form className="contact-form reveal is-visible" id="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  Nom et prenom
                  <input type="text" name="fullName" placeholder="Votre nom et prenom" required />
                </label>
              </div>
              <div className="form-row form-row-two">
                <label>
                  Date de naissance
                  <input type="date" name="birthDate" required />
                </label>
                <label>
                  Pseudo
                  <input type="text" name="username" placeholder="Votre pseudo" />
                </label>
              </div>
              <div className="form-row form-row-two">
                <label>
                  Email
                  <input type="email" name="email" placeholder="vous@email.com" required />
                </label>
                <label>
                  Mot de passe
                  <input type="password" name="password" placeholder="Minimum 8 caracteres" minLength={8} required />
                </label>
                <label>
                  Societe
                  <input type="text" name="company" placeholder="Votre societe" />
                </label>
              </div>
              <div className="form-row form-row-two">
                <label>
                  Pays
                  <select name="country" required defaultValue="">
                    <option value="" disabled>
                      Choisir un pays
                    </option>
                    {countryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Langue principale
                  <select name="language" required defaultValue="">
                    <option value="" disabled>
                      Choisir une langue
                    </option>
                    {languageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Demande
                <select name="request" defaultValue="contact">
                  <option value="contact">Prise de contact</option>
                  <option value="inscription_devis">Inscription (avec devis)</option>
                  <option value="partnership">Demande de partenariat</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <label>
                Fichiers
                <input type="file" name="files" multiple />
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  rows="5"
                  placeholder="Expliquez votre besoin, votre objectif ou votre projet."
                  required
                />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" name="newsletter" />
                <span className="custom-check" aria-hidden="true" />
                <span>S'inscrire a la newsletter</span>
              </label>
              <button className="button button-primary" type="submit" disabled={formState.status === "loading"}>
                {formState.status === "loading" ? "Envoi en cours..." : "Envoyer l'inscription"}
              </button>
              <p className={`form-note form-note-${formState.status}`} id="form-note">
                {formState.message}
              </p>
            </form>
          </div>
        </section>

        <footer className="site-footer">
          <div className="container footer-grid footer-grid-compact">
            <div className="footer-column">
              <strong>Zero Limit Agency</strong>
              <p>Agence e-sport, management, marketing et design.</p>
            </div>
            <div className="footer-column">
              <strong>Contact</strong>
              <a href="mailto:contact@zerolimit.agency">contact@zerolimit.agency</a>
            </div>
            <div className="footer-column">
              <strong>Reseaux</strong>
              <div className="social-links">
                <a className="social-link" href="https://x.com/z0agency" target="_blank" rel="noreferrer">
                  <span className="social-icon">X</span>
                  <span>@z0agency</span>
                </a>
                <a className="social-link" href="https://tiktok.com/@z0agency" target="_blank" rel="noreferrer">
                  <span className="social-icon">T</span>
                  <span>@z0agency</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

