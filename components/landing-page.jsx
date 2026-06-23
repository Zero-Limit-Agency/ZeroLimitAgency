"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AnimatedSection, MotionReveal, StaggerContainer, StaggerItem } from "@/components/animations";

import { DEFAULT_SITE_CONTENT, normalizeSiteContent } from "@/lib/site-content";

const languageOptions = ["Français", "Anglais", "Espagnol", "Allemand", "Italien", "Autre"];

const frenchMonthMap = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12
};

function normalizeBirthDateInput(value) {
  return String(value || "")
    .replace(/[^\dA-Za-zÀ-ÿ./\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trimStart();
}

function formatBirthDateTyping(value) {
  const normalized = normalizeBirthDateInput(value);

  if (/[^0-9./\-\s]/.test(normalized)) {
    return normalized;
  }

  const digits = normalized.replace(/\D/g, "").slice(0, 8);
  const first = digits.slice(0, 2);
  const second = digits.slice(2, 4);
  const third = digits.slice(4, 8);

  return [first, second, third].filter(Boolean).join("/");
}

function toValidIsoDate(day, month, year) {
  if (!day || !month || !year || String(year).length !== 4) {
    return "";
  }

  const numericDay = Number(day);
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (
    !Number.isInteger(numericDay) ||
    !Number.isInteger(numericMonth) ||
    !Number.isInteger(numericYear) ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    numericDay < 1 ||
    numericDay > 31
  ) {
    return "";
  }

  const candidate = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

  if (
    candidate.getUTCFullYear() !== numericYear ||
    candidate.getUTCMonth() !== numericMonth - 1 ||
    candidate.getUTCDate() !== numericDay
  ) {
    return "";
  }

  return `${numericYear.toString().padStart(4, "0")}-${numericMonth
    .toString()
    .padStart(2, "0")}-${numericDay.toString().padStart(2, "0")}`;
}

function parseBirthDateValue(value) {
  const normalized = normalizeBirthDateInput(value);

  if (!normalized) {
    return { iso: "", display: "" };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-");
    const iso = toValidIsoDate(day, month, year);

    return {
      iso,
      display: iso ? `${day}/${month}/${year}` : normalized
    };
  }

  const numericMatch = normalized.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{4})$/);

  if (numericMatch) {
    const [, day, month, year] = numericMatch;
    const iso = toValidIsoDate(day, month, year);

    return {
      iso,
      display: `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    };
  }

  const textMatch = normalized
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);

  if (textMatch) {
    const [, day, monthLabel, year] = textMatch;
    const month = frenchMonthMap[monthLabel];
    const iso = month ? toValidIsoDate(day, month, year) : "";

    return {
      iso,
      display: iso ? `${day.padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}` : normalized
    };
  }

  return { iso: "", display: normalized };
}

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
      aria-label={currentUser.ariaLabel || "Accéder à votre espace"}
    >
      <span className="nav-profile-badge">
        {currentUser.avatarUrl ? (
          <img className="nav-profile-avatar" src={currentUser.avatarUrl} alt="" />
        ) : (
          <span className="nav-profile-fallback">{currentUser.initials}</span>
        )}
      </span>
      <span className="nav-profile-copy">
        <strong>{currentUser.label || "Mon espace"}</strong>
        <small>{currentUser.email || "Compte connecté"}</small>
      </span>
    </Link>
  );
}

function renderStars(stars) {
  const safeStars = Math.round(Math.min(Math.max(Number(stars || 5), 1), 5) * 2) / 2;

  return Array.from({ length: 5 }, (_, index) => {
    const fill = safeStars - index;
    const state = fill >= 1 ? "is-filled" : fill >= 0.5 ? "is-half" : "";

    return (
      <span key={`star-${index}`} className={`review-star ${state}`.trim()} aria-hidden="true">
        ★
      </span>
    );
  });
}

function ProjectMedia({ project }) {
  const media = project.image ? (
    <img className="project-media" src={project.image} alt={project.title} />
  ) : (
    <div className="project-visual project-visual-one" />
  );

  if (!project.link) {
    return media;
  }

  return (
    <a className="project-media-link" href={project.link} target="_blank" rel="noreferrer" aria-label={`Voir plus d'informations sur ${project.title}`}>
      {media}
    </a>
  );
}

function FooterSocialLink({ href, label, icon }) {
  if (!href) {
    return null;
  }

  return (
    <a className="social-link" href={href} target="_blank" rel="noreferrer">
      <span className="social-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </a>
  );
}

export function LandingPage({ currentUser = null, content = DEFAULT_SITE_CONTENT }) {
  const siteContent = useMemo(() => normalizeSiteContent(content), [content]);
  const [navOpen, setNavOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [birthDateDisplay, setBirthDateDisplay] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [formState, setFormState] = useState({
    status: "idle",
    message: "Le formulaire est prêt. Votre demande sera traitée par l'équipe Zero Limit Agency."
  });

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const trailerTitle = siteContent.media[0]?.title || "Trailer";

  const activeMediaContent = (
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

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const rawData = new FormData(form);
    const data = new FormData();
    const files = rawData.getAll("files").filter((file) => file instanceof File && file.size > 0);
    const parsedBirthDate = parseBirthDateValue(birthDateDisplay);

    if (!parsedBirthDate.iso) {
      setBirthDateError("Entrez une date valide au format jour/mois/annee.");
      setFormState({ status: "error", message: "Corrigez la date de naissance avant d'envoyer le formulaire." });
      return;
    }

    ["fullName", "username", "email", "password", "company", "language", "request", "message"].forEach(
      (field) => {
        const value = rawData.get(field);

        if (value !== null) {
          data.append(field, value);
        }
      }
    );

    data.append("birthDate", parsedBirthDate.iso);

    if (rawData.get("newsletter")) {
      data.append("newsletter", "on");
    }

    files.forEach((file) => {
      data.append("files", file, file.name);
    });

    setBirthDateError("");
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
          `Le serveur a renvoyé une réponse non JSON (${response.status}). ${
            text.startsWith("<!DOCTYPE") ? "Une page d'erreur Next.js a été renvoyée." : "Réponse inattendue."
          }`
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
      }

      setFormState({
        status: "success",
        message:
          result?.emailDelivery?.ok === false
            ? "Votre demande est bien enregistrée. Nous avons un retard temporaire sur l'envoi des emails de confirmation."
            : result.message || "Votre demande a bien été envoyée."
      });
      form.reset();
      setBirthDateDisplay("");
      setBirthDateError("");

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
    <div className="landing-page">
      <header className={`site-header${headerScrolled ? " is-scrolled" : ""}`}>
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
              Actualités
            </a>
            <a href="#contact" onClick={() => setNavOpen(false)}>
              Inscription
            </a>
            <UserNavButton currentUser={currentUser} closeNav={() => setNavOpen(false)} label="Connexion" />
          </nav>
        </div>
      </header>

      <main id="main" className="public-site">
        <AnimatedSection className="hero section" id="hero">
          <div className="hero-background" aria-hidden="true" />
          <div className="container hero-grid">
            <MotionReveal className="hero-copy" variant="hero">
              <p className="eyebrow">{siteContent.hero.eyebrow}</p>
              <h1>{siteContent.hero.title}</h1>
              <p className="hero-lead">{siteContent.hero.subtitle}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contact">
                  {siteContent.hero.button}
                </a>
              </div>
              <StaggerContainer className="hero-stats">
                {siteContent.blocks.map((block, index) => (
                  <StaggerItem as="article" key={block.id} index={index} className="stat-card hover-lift">
                    <strong>{block.title}</strong>
                    <p>{block.text}</p>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </MotionReveal>
          </div>
        </AnimatedSection>

        <AnimatedSection className="section intro-section" id="about">
          <div className="container split-grid media-layout">
            <div className="section-copy motion-reveal motion-slide-up is-visible">
              <p className="eyebrow">{siteContent.description.title}</p>
              <h2>{siteContent.description.title}</h2>
              {siteContent.description.paragraphs.map((paragraph, index) => (
                <p key={`description-${index}`}>{paragraph}</p>
              ))}
            </div>

            <div className="media-shell motion-reveal motion-slide-up is-visible" id="media">
              <div className="media-tabs" aria-label="Media Zero Limit Agency">
                <div className="media-tab is-active">
                  <span className="tab-dot" />
                  <span>{trailerTitle}</span>
                </div>
              </div>
              <div className="media-panels">{activeMediaContent}</div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="section section-soft" id="portal">
          <div className="container portal-card motion-reveal motion-slide-up is-visible">
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
        </AnimatedSection>

        <AnimatedSection className="section section-soft" id="reviews">
          <div className="container">
            <div className="section-heading section-heading-wide motion-reveal motion-slide-up is-visible">
              <p className="eyebrow">{siteContent.reviews.title}</p>
              <h2>{siteContent.reviews.title}</h2>
              <p>{siteContent.reviews.text}</p>
            </div>
            <StaggerContainer className="reviews-grid">
              {siteContent.reviews.items.map((review, index) => (
                <StaggerItem as="article" key={review.id} index={index} className="review-card hover-lift">
                  <div className="review-stars" aria-label={`${review.stars} étoiles`}>
                    {renderStars(review.stars)}
                  </div>
                  <p className="review-message">{review.message}</p>
                  <div className="review-meta">
                    <strong>{review.name}</strong>
                    <span>{review.date}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimatedSection>

        <AnimatedSection className="section section-dark" id="projects">
          <div className="container">
            <div className="section-heading section-heading-wide motion-reveal motion-slide-up is-visible">
              <p className="eyebrow">{siteContent.projects.title}</p>
              <h2>{siteContent.projects.title}</h2>
              <p>{siteContent.projects.text}</p>
            </div>
            <StaggerContainer className="projects-grid">
              {siteContent.projects.items.map((project, index) => (
                <StaggerItem as="article" key={project.id} index={index} className="project-card hover-lift">
                  <ProjectMedia project={project} />
                  <div className="project-copy">
                    <small>{project.date}</small>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimatedSection>

        <AnimatedSection className="section" id="news">
          <div className="container">
            <div className="section-heading section-heading-wide motion-reveal motion-slide-up is-visible">
              <p className="eyebrow">{siteContent.news.title}</p>
              <h2>{siteContent.news.title}</h2>
              <p>{siteContent.news.text}</p>
            </div>
            <StaggerContainer className="news-grid">
              {siteContent.news.items.map((item, index) => (
                <StaggerItem as="article" key={item.id} index={index} className="news-card hover-lift">
                  {item.image ? (
                    <img className="news-image" src={item.image} alt={item.title} />
                  ) : (
                    <div className="news-media news-media-image">Actualité</div>
                  )}
                  <span>{item.date}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimatedSection>

        <AnimatedSection className="section" id="ecosystem">
          <div className="container">
            <div className="section-heading section-heading-wide motion-reveal motion-slide-up is-visible">
              <p className="eyebrow">{siteContent.partners.title}</p>
              <h2>{siteContent.partners.title}</h2>
              <p>{siteContent.partners.text}</p>
            </div>
            <StaggerContainer className="team-grid">
              {siteContent.partners.items.map((item, index) => (
                <StaggerItem as="article" key={item.id} index={index} className="team-card hover-lift">
                  {item.logo ? (
                    <img className="team-logo" src={item.logo} alt={item.name} />
                  ) : (
                    <div className="avatar-placeholder">{item.name.charAt(0)}</div>
                  )}
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimatedSection>

        <AnimatedSection className="section section-soft" id="faq">
          <div className="container faq-grid">
            <div className="section-copy motion-reveal motion-slide-up is-visible">
              <p className="eyebrow">{siteContent.faq.title}</p>
              <h2>{siteContent.faq.title}</h2>
              <p>{siteContent.faq.text}</p>
            </div>
            <div className="faq-list">
              {siteContent.faq.items.map((item, index) => {
                const isOpen = activeFaq === index;
                return (
                  <article key={item.id} className="faq-item motion-reveal motion-slide-up is-visible">
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
        </AnimatedSection>

        <AnimatedSection className="section contact-section" id="contact">
          <div className="container contact-grid">
            <div className="section-copy motion-reveal motion-slide-up is-visible">
              <p className="eyebrow">Inscription</p>
              <h2>Rejoindre l'agence</h2>
              <p>
                Envoyez votre demande pour présenter votre projet, votre ambition et le type
                d'accompagnement recherché.
              </p>
            </div>
            <form className="contact-form motion-reveal motion-slide-up is-visible" id="contact-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="honeypot-field"
                aria-hidden="true"
              />
              <div className="form-row">
                <label>
                  Nom et prénom
                  <input type="text" name="fullName" placeholder="Votre nom et prénom" required />
                </label>
              </div>
              <div className="form-row form-row-two">
                <label>
                  Date de naissance
                  <input
                    type="hidden"
                    name="birthDate"
                    value={parseBirthDateValue(birthDateDisplay).iso}
                    readOnly
                  />
                  <input
                    type="text"
                    value={birthDateDisplay}
                    autoComplete="bday"
                    placeholder="JJ/MM/AAAA"
                    onChange={(event) => {
                      setBirthDateDisplay(formatBirthDateTyping(event.target.value));
                      if (birthDateError) {
                        setBirthDateError("");
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseBirthDateValue(birthDateDisplay);
                      setBirthDateDisplay(parsed.display);
                    }}
                    aria-describedby="birth-date-help"
                    required
                  />
                  <small className={`contact-field-help${birthDateError ? " is-error" : ""}`} id="birth-date-help">
                    {birthDateError || "Format accepte : 06/09/2001, 6-9-2001 ou 6 septembre 2001."}
                  </small>
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
                  <input type="password" name="password" placeholder="Minimum 8 caractères" minLength={8} required />
                </label>
              </div>
              <div className="form-row form-row-two">
                <label>
                  Société
                  <input type="text" name="company" placeholder="Votre société" />
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
                <span>S'inscrire à la newsletter</span>
              </label>
              <button className="button button-primary" type="submit" disabled={formState.status === "loading"}>
                {formState.status === "loading" ? "Envoi en cours..." : "Envoyer l'inscription"}
              </button>
              <p className={`form-note form-note-${formState.status}`} id="form-note">
                {formState.message}
              </p>
            </form>
          </div>
        </AnimatedSection>

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
              <strong>Réseaux</strong>
              <div className="footer-social-list">
                <FooterSocialLink href={siteContent.support.discordUrl} label="Discord" icon="D" />
                <FooterSocialLink href={siteContent.support.tiktokUrl} label="TikTok" icon="T" />
                <FooterSocialLink href={siteContent.support.xUrl} label="X" icon="X" />
              </div>
              {!siteContent.support.discordUrl &&
              !siteContent.support.tiktokUrl &&
              !siteContent.support.xUrl ? (
                <p>À compléter</p>
              ) : null}
            </div>
            <div className="footer-column">
              <strong>Site</strong>
              <Link href="/mentions-legales">Mentions légales</Link>
              <Link href="/politique-de-confidentialite">Politique de confidentialité</Link>
              <Link href="/conditions-generales-de-vente">Conditions générales de vente (CGV)</Link>
              <Link href="/conditions-generales-d-utilisation">Conditions générales d&apos;utilisation (CGU)</Link>
              <Link href="/politique-de-remboursement">Politique de remboursement</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}


