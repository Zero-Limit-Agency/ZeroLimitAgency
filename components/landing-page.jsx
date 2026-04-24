"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DEFAULT_SITE_CONTENT, normalizeSiteContent } from "@/lib/site-content";

const languageOptions = ["FranÃ§ais", "Anglais", "Espagnol", "Allemand", "Italien", "Autre"];

function UserNavButton({ currentUser, closeNav, label }) {
  if (!currentUser) {
    return (
      <Link className="nav-cta" href="/connexion" onClick={closeNav}>
        {label}
      </Link>
    );
  }

  return (
    <Link
      className="nav-profile-link"
      href={currentUser.href}
      onClick={closeNav}
      aria-label={currentUser.ariaLabel || "AccÃ©der Ã  votre espace"}
    >
      {currentUser.avatarUrl ? (
        <img className="nav-profile-avatar" src={currentUser.avatarUrl} alt="" />
      ) : (
        <span className="nav-profile-fallback">{currentUser.initials}</span>
      )}
    </Link>
  );
}

function renderStars(stars) {
  const safeStars = Math.min(Math.max(Number(stars || 5), 1), 5);

  return Array.from({ length: 5 }, (_, index) => (
    <span key={`star-${index}`} className={`review-star${index < safeStars ? " is-filled" : ""}`}>
      â˜…
    </span>
  ));
}

export function LandingPage({ currentUser = null, content = DEFAULT_SITE_CONTENT }) {
  const siteContent = useMemo(() => normalizeSiteContent(content), [content]);
  const [navOpen, setNavOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeMedia, setActiveMedia] = useState("trailer");
  const [formState, setFormState] = useState({
    status: "idle",
    message: "Le formulaire est prÃªt. Votre demande sera traitÃ©e par l'Ã©quipe Zero Limit Agency."
  });

  const activeMediaEntry =
    siteContent.media.find((item) => item.id === activeMedia) || siteContent.media[0] || { id: "trailer", title: "Trailer" };

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
            <strong>{activeMediaEntry.title}</strong>
            <p>Bloc prÃªt pour intÃ©grer une interview, une vidÃ©o ou une prise de parole liÃ©e Ã  l'agence.</p>
          </div>
        </article>
      );
    }

    return (
      <article className="media-panel" id="market-panel">
        <div className="media-placeholder media-placeholder-alt">
          <strong>{activeMediaEntry.title}</strong>
          <p>Bloc prÃªt pour prÃ©senter le Zero Limit Market ou un autre contenu mÃ©dia stratÃ©gique.</p>
        </div>
      </article>
    );
  }, [activeMedia, activeMediaEntry.title]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const rawData = new FormData(form);
    const data = new FormData();
    const files = rawData.getAll("files").filter((file) => file instanceof File && file.size > 0);

    ["fullName", "birthDate", "username", "email", "password", "company", "language", "request", "message"].forEach(
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
          `Le serveur a renvoyÃ© une rÃ©ponse non JSON (${response.status}). ${
            text.startsWith("<!DOCTYPE") ? "Une page d'erreur Next.js a Ã©tÃ© renvoyÃ©e." : "RÃ©ponse inattendue."
          }`
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
      }

      setFormState({
        status: "success",
        message: result.message || "Votre demande a bien Ã©tÃ© envoyÃ©e."
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
            <a href="#about" onClick={() => setNavOpen(false)}>
              En savoir plus
            </a>
            <a href="#reviews" onClick={() => setNavOpen(false)}>
              Avis
            </a>
            <a href="#projects" onClick={() => setNavOpen(false)}>
              Projets
            </a>
            <a href="#news" onClick={() => setNavOpen(false)}>
              ActualitÃ©s
            </a>
            <a href="#contact" onClick={() => setNavOpen(false)}>
              Inscription
            </a>
            <UserNavButton currentUser={currentUser} closeNav={() => setNavOpen(false)} label="Connexion" />
          </nav>
        </div>
      </header>

      <main id="main" className="public-site">
        <section className="hero section" id="hero">
          <div className="hero-background" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy reveal is-visible">
              <p className="eyebrow">{siteContent.hero.eyebrow}</p>
              <h1>{siteContent.hero.title}</h1>
              <p className="hero-lead">{siteContent.hero.subtitle}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contact">
                  {siteContent.hero.button}
                </a>
              </div>
              <div className="hero-stats">
                {siteContent.blocks.map((block) => (
                  <article key={block.id} className="stat-card reveal is-visible">
                    <strong>{block.title}</strong>
                    <p>{block.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section intro-section" id="about">
          <div className="container split-grid media-layout">
            <div className="section-copy reveal is-visible">
              <p className="eyebrow">{siteContent.description.title}</p>
              <h2>{siteContent.description.title}</h2>
              {siteContent.description.paragraphs.map((paragraph, index) => (
                <p key={`description-${index}`}>{paragraph}</p>
              ))}
            </div>

            <div className="media-shell reveal is-visible" id="media">
              <div className="media-tabs" role="tablist" aria-label="MÃ©dias Zero Limit Agency">
                {siteContent.media.map((item) => (
                  <button
                    key={item.id}
                    className={`media-tab${activeMedia === item.id ? " is-active" : ""}`}
                    type="button"
                    onClick={() => setActiveMedia(item.id)}
                  >
                    <span className="tab-dot" />
                    <span>{item.title}</span>
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
              <p className="eyebrow">{siteContent.clientArea.title}</p>
              <h2>{siteContent.clientArea.title}</h2>
              {siteContent.clientArea.paragraphs.map((paragraph, index) => (
                <p key={`client-area-${index}`}>{paragraph}</p>
              ))}
            </div>

            <div className="portal-panel">
              <div className="portal-box">
                <strong>{siteContent.clientArea.secondaryTitle}</strong>
                <p>{siteContent.clientArea.secondaryText}</p>
                <Link className="button button-dark" href={currentUser?.href || "/connexion"}>
                  {currentUser ? "Ouvrir mon espace" : siteContent.clientArea.button}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-soft" id="reviews">
          <div className="container">
            <div className="section-heading section-heading-wide reveal is-visible">
              <p className="eyebrow">{siteContent.reviews.title}</p>
              <h2>{siteContent.reviews.title}</h2>
              <p>{siteContent.reviews.text}</p>
            </div>
            <div className="reviews-grid">
              {siteContent.reviews.items.map((review) => (
                <article key={review.id} className="review-card reveal is-visible">
                  <div className="review-stars" aria-label={`${review.stars} Ã©toiles`}>
                    {renderStars(review.stars)}
                  </div>
                  <p>"{review.message}"</p>
                  <div className="review-meta">
                    <strong>{review.name}</strong>
                    <span>{review.date}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-dark" id="projects">
          <div className="container">
            <div className="section-heading section-heading-wide reveal is-visible">
              <p className="eyebrow">{siteContent.projects.title}</p>
              <h2>{siteContent.projects.title}</h2>
              <p>{siteContent.projects.text}</p>
            </div>
            <div className="projects-grid">
              {siteContent.projects.items.map((project) => (
                <article key={project.id} className="project-card reveal is-visible">
                  {project.image ? (
                    <img className="project-media" src={project.image} alt={project.title} />
                  ) : (
                    <div className="project-visual project-visual-one" />
                  )}
                  <div className="project-copy">
                    <small>{project.date}</small>
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
              <p className="eyebrow">{siteContent.news.title}</p>
              <h2>{siteContent.news.title}</h2>
              <p>{siteContent.news.text}</p>
            </div>
            <div className="news-grid">
              {siteContent.news.items.map((item) => (
                <article key={item.id} className="news-card reveal is-visible">
                  {item.image ? (
                    <img className="news-image" src={item.image} alt={item.title} />
                  ) : (
                    <div className="news-media news-media-image">ActualitÃ©</div>
                  )}
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
              <p className="eyebrow">{siteContent.partners.title}</p>
              <h2>{siteContent.partners.title}</h2>
              <p>{siteContent.partners.text}</p>
            </div>
            <div className="team-grid">
              {siteContent.partners.items.map((item) => (
                <article key={item.id} className="team-card reveal is-visible">
                  {item.logo ? (
                    <img className="team-logo" src={item.logo} alt={item.name} />
                  ) : (
                    <div className="avatar-placeholder">{item.name.charAt(0)}</div>
                  )}
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-soft" id="faq">
          <div className="container faq-grid">
            <div className="section-copy reveal is-visible">
              <p className="eyebrow">{siteContent.faq.title}</p>
              <h2>{siteContent.faq.title}</h2>
              <p>{siteContent.faq.text}</p>
            </div>
            <div className="faq-list">
              {siteContent.faq.items.map((item, index) => {
                const isOpen = activeFaq === index;
                return (
                  <article key={item.id} className="faq-item reveal is-visible">
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
              <h2>Rejoindre l'agence</h2>
              <p>
                Envoyez votre demande pour prÃ©senter votre projet, votre ambition et le type
                d'accompagnement recherchÃ©.
              </p>
            </div>
            <form className="contact-form reveal is-visible" id="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  Nom et prÃ©nom
                  <input type="text" name="fullName" placeholder="Votre nom et prÃ©nom" required />
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
                  Adresse email
                  <input type="email" name="email" placeholder="vous@email.com" required />
                </label>
                <label>
                  Mot de passe
                  <input type="password" name="password" placeholder="Minimum 8 caractÃ¨res" minLength={8} required />
                </label>
              </div>
              <div className="form-row form-row-two">
                <label>
                  SociÃ©tÃ©
                  <input type="text" name="company" placeholder="Votre sociÃ©tÃ©" />
                </label>
                <label>
                  Langue
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
                Type de demande
                <select name="request" defaultValue="contact">
                  <option value="contact">Prise de contact</option>
                  <option value="inscription_devis">Inscription avec devis</option>
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
                <span>S'inscrire Ã  la newsletter</span>
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
              <p>Agence e-sport, marketing, design et accompagnement de projets.</p>
            </div>
            <div className="footer-column">
              <strong>Contact</strong>
              <a href={`mailto:${siteContent.footer.email}`}>{siteContent.footer.email}</a>
            </div>
            <div className="footer-column">
              <strong>RÃ©seaux</strong>
              <p>Ã€ complÃ©ter</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

