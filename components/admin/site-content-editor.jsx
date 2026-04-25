"use client";

import { useMemo, useState } from "react";

import { normalizeSiteContent } from "@/lib/site-content";

function createReviewDraft(existing = {}, index = 0) {
  return {
    id: existing.id || `review-${index + 1}`,
    name: existing.name || "",
    message: existing.message || "",
    date: existing.date || "",
    stars: String(existing.stars || 5)
  };
}

function createProjectDraft(existing = {}, index = 0, type = "project") {
  return {
    id: existing.id || `${type}-${index + 1}`,
    image: existing.image || "",
    title: existing.title || "",
    description: existing.description || "",
    date: existing.date || ""
  };
}

function createPartnerDraft(existing = {}, index = 0) {
  return {
    id: existing.id || `partner-${index + 1}`,
    logo: existing.logo || "",
    name: existing.name || "",
    description: existing.description || ""
  };
}

function createFaqDraft(existing = {}, index = 0) {
  return {
    id: existing.id || `faq-${index + 1}`,
    question: existing.question || "",
    answer: existing.answer || ""
  };
}

function createBlockDraft(existing = {}, index = 0) {
  return {
    id: existing.id || `block-${index + 1}`,
    title: existing.title || "",
    text: existing.text || ""
  };
}

function createMediaDraft(existing = {}, index = 0) {
  const fallbackIds = ["trailer", "interview", "market"];
  return {
    id: existing.id || fallbackIds[index] || `media-${index + 1}`,
    title: existing.title || ""
  };
}

function createInitialForm(settings) {
  const content = normalizeSiteContent(settings);

  return {
    hero: { ...content.hero },
    description: {
      title: content.description.title,
      paragraphs: [...content.description.paragraphs]
    },
    blocks: content.blocks.map(createBlockDraft),
    media: content.media.map(createMediaDraft),
    clientArea: {
      ...content.clientArea,
      paragraphs: [...content.clientArea.paragraphs]
    },
    reviews: {
      title: content.reviews.title,
      text: content.reviews.text,
      items: content.reviews.items.map(createReviewDraft)
    },
    projects: {
      title: content.projects.title,
      text: content.projects.text,
      items: content.projects.items.map((item, index) => createProjectDraft(item, index, "project"))
    },
    news: {
      title: content.news.title,
      text: content.news.text,
      items: content.news.items.map((item, index) => createProjectDraft(item, index, "news"))
    },
    partners: {
      title: content.partners.title,
      text: content.partners.text,
      items: content.partners.items.map(createPartnerDraft)
    },
    faq: {
      title: content.faq.title,
      text: content.faq.text,
      items: content.faq.items.map(createFaqDraft)
    },
    footer: { ...content.footer }
  };
}

function SectionHeader({ eyebrow, title, note }) {
  return (
    <div className="admin-panel-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {note ? <p className="admin-inline-note">{note}</p> : null}
      </div>
    </div>
  );
}

export function SiteContentEditor({ initialSettings }) {
  const [state, setState] = useState({ status: "idle", message: "" });
  const [form, setForm] = useState(() => createInitialForm(initialSettings));
  const previewCount = useMemo(
    () =>
      form.reviews.items.length +
      form.projects.items.length +
      form.news.items.length +
      form.partners.items.length,
    [form]
  );

  function updateField(group, field, value) {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value
      }
    }));
  }

  function updateParagraph(group, index, value) {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        paragraphs: current[group].paragraphs.map((item, itemIndex) => (itemIndex === index ? value : item))
      }
    }));
  }

  function updateArrayItem(group, index, field, value) {
    setForm((current) => ({
      ...current,
      [group]: current[group].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    }));
  }

  function updateNestedArrayItem(group, index, field, value) {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        items: current[group].items.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value
              }
            : item
        )
      }
    }));
  }

  function addNestedItem(group) {
    setForm((current) => {
      const nextItems =
        group === "reviews"
          ? [...current[group].items, createReviewDraft({}, current[group].items.length)]
          : group === "projects"
            ? [...current[group].items, createProjectDraft({}, current[group].items.length, "project")]
            : group === "news"
              ? [...current[group].items, createProjectDraft({}, current[group].items.length, "news")]
              : group === "partners"
                ? [...current[group].items, createPartnerDraft({}, current[group].items.length)]
                : [...current[group].items, createFaqDraft({}, current[group].items.length)];

      return {
        ...current,
        [group]: {
          ...current[group],
          items: nextItems
        }
      };
    });
  }

  function removeNestedItem(group, index) {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        items: current[group].items.filter((_, itemIndex) => itemIndex !== index)
      }
    }));
  }

  async function handleSave() {
    setState({
      status: "loading",
      message: "Enregistrement du contenu public en cours..."
    });

    try {
      const response = await fetch("/api/admin/site-content", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'enregistrer le contenu public.");
      }

      setState({
        status: "success",
        message: result.message || "Le contenu public a bien été mis à jour."
      });
      setForm(createInitialForm(result.settings || form));
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer le contenu public."
      });
    }
  }

  return (
    <section className="admin-panel">
      <SectionHeader
        eyebrow="Site public"
        title="Contenu éditorial"
        note="Cette zone pilote les textes et les blocs visibles sur la landing. Les visuels peuvent utiliser une URL externe ou un chemin local de type /assets/..."
      />

      <div className="admin-overview-grid">
        <article className="admin-subpanel">
          <small>Landing</small>
          <strong>Page publique</strong>
          <p className="admin-inline-note">Hero, sections, FAQ et footer.</p>
        </article>
        <article className="admin-subpanel">
          <small>�?léments gérés</small>
          <strong>{previewCount}</strong>
          <p className="admin-inline-note">Avis, projets, actualités et partenaires.</p>
        </article>
        <article className="admin-subpanel">
          <small>Connexion</small>
          <strong>Textes alignés</strong>
          <p className="admin-inline-note">Le wording de connexion a aussi été simplifié côté public.</p>
        </article>
      </div>

      <div className="admin-stack">
        <section className="admin-subpanel">
          <SectionHeader eyebrow="Hero" title="Bloc principal" />
          <div className="admin-meta-grid">
            <label className="auth-field">
              <span>Eyebrow</span>
              <input value={form.hero.eyebrow} onChange={(event) => updateField("hero", "eyebrow", event.target.value)} />
            </label>
            <label className="auth-field admin-field-full">
              <span>Titre</span>
              <input value={form.hero.title} onChange={(event) => updateField("hero", "title", event.target.value)} />
            </label>
            <label className="auth-field admin-field-full">
              <span>Sous-titre</span>
              <textarea className="admin-textarea" rows={4} value={form.hero.subtitle} onChange={(event) => updateField("hero", "subtitle", event.target.value)} />
            </label>
            <label className="auth-field">
              <span>Bouton principal</span>
              <input value={form.hero.button} onChange={(event) => updateField("hero", "button", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="admin-subpanel">
          <SectionHeader eyebrow="Présentation" title="Description & blocs" />
          <div className="admin-meta-grid">
            <label className="auth-field">
              <span>Titre de section</span>
              <input value={form.description.title} onChange={(event) => updateField("description", "title", event.target.value)} />
            </label>
            <div className="admin-field-full admin-stack-tight">
              {form.description.paragraphs.map((paragraph, index) => (
                <label key={`description-${index}`} className="auth-field">
                  <span>Paragraphe {index + 1}</span>
                  <textarea
                    className="admin-textarea admin-textarea-compact"
                    rows={3}
                    value={paragraph}
                    onChange={(event) => updateParagraph("description", index, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="admin-packet-documents-grid">
            {form.blocks.map((block, index) => (
              <div key={block.id} className="admin-link-card">
                <strong>Bloc {index + 1}</strong>
                <label className="auth-field">
                  <span>Titre</span>
                  <input value={block.title} onChange={(event) => updateArrayItem("blocks", index, "title", event.target.value)} />
                </label>
                <label className="auth-field">
                  <span>Texte</span>
                  <textarea className="admin-textarea admin-textarea-compact" rows={4} value={block.text} onChange={(event) => updateArrayItem("blocks", index, "text", event.target.value)} />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-subpanel">
          <SectionHeader eyebrow="Médias" title="Onglets médias" />
          <div className="admin-packet-documents-grid">
            {form.media.map((item, index) => (
              <label key={item.id} className="auth-field admin-link-card">
                <span>Média {index + 1}</span>
                <input value={item.title} onChange={(event) => updateArrayItem("media", index, "title", event.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <section className="admin-subpanel">
          <SectionHeader eyebrow="Espace client" title="Bloc espace membre" />
          <div className="admin-meta-grid">
            <label className="auth-field">
              <span>Titre</span>
              <input value={form.clientArea.title} onChange={(event) => updateField("clientArea", "title", event.target.value)} />
            </label>
            <label className="auth-field">
              <span>Bouton</span>
              <input value={form.clientArea.button} onChange={(event) => updateField("clientArea", "button", event.target.value)} />
            </label>
            <div className="admin-field-full admin-stack-tight">
              {form.clientArea.paragraphs.map((paragraph, index) => (
                <label key={`client-area-${index}`} className="auth-field">
                  <span>Paragraphe {index + 1}</span>
                  <textarea
                    className="admin-textarea admin-textarea-compact"
                    rows={3}
                    value={paragraph}
                    onChange={(event) => updateParagraph("clientArea", index, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <label className="auth-field">
              <span>Titre secondaire</span>
              <input value={form.clientArea.secondaryTitle} onChange={(event) => updateField("clientArea", "secondaryTitle", event.target.value)} />
            </label>
            <label className="auth-field admin-field-full">
              <span>Texte secondaire</span>
              <textarea className="admin-textarea" rows={4} value={form.clientArea.secondaryText} onChange={(event) => updateField("clientArea", "secondaryText", event.target.value)} />
            </label>
          </div>
        </section>

        {[
          { key: "reviews", eyebrow: "Avis", title: "Avis clients" },
          { key: "projects", eyebrow: "Projets", title: "Projets" },
          { key: "news", eyebrow: "Actualités", title: "Actualités" },
          { key: "partners", eyebrow: "Partenaires", title: "Outils & partenaires" },
          { key: "faq", eyebrow: "FAQ", title: "Questions fréquentes" }
        ].map((section) => (
          <section key={section.key} className="admin-subpanel">
            <SectionHeader eyebrow={section.eyebrow} title={section.title} />
            <div className="admin-meta-grid">
              <label className="auth-field">
                <span>Titre</span>
                <input value={form[section.key].title} onChange={(event) => updateField(section.key, "title", event.target.value)} />
              </label>
              <label className="auth-field admin-field-full">
                <span>Texte d'introduction</span>
                <textarea className="admin-textarea admin-textarea-compact" rows={3} value={form[section.key].text} onChange={(event) => updateField(section.key, "text", event.target.value)} />
              </label>
            </div>

            <div className="admin-stack">
              {form[section.key].items.map((item, index) => (
                <div key={item.id} className="admin-link-card">
                  <div className="admin-panel-heading admin-panel-heading-tight">
                    <div>
                      <small>{section.title}</small>
                      <strong>�?lément {index + 1}</strong>
                    </div>
                    {form[section.key].items.length > 1 ? (
                      <button className="button button-dark button-compact" type="button" onClick={() => removeNestedItem(section.key, index)}>
                        Supprimer
                      </button>
                    ) : null}
                  </div>

                  {section.key === "reviews" ? (
                    <div className="admin-subpanel-grid">
                      <label className="auth-field">
                        <span>Nom</span>
                        <input value={item.name} onChange={(event) => updateNestedArrayItem(section.key, index, "name", event.target.value)} />
                      </label>
                      <label className="auth-field">
                        <span>Date</span>
                        <input value={item.date} onChange={(event) => updateNestedArrayItem(section.key, index, "date", event.target.value)} />
                      </label>
                      <label className="auth-field">
                        <span>�?toiles</span>
                        <input type="number" min="1" max="5" value={item.stars} onChange={(event) => updateNestedArrayItem(section.key, index, "stars", event.target.value)} />
                      </label>
                      <label className="auth-field admin-field-full">
                        <span>Message</span>
                        <textarea className="admin-textarea admin-textarea-compact" rows={4} value={item.message} onChange={(event) => updateNestedArrayItem(section.key, index, "message", event.target.value)} />
                      </label>
                    </div>
                  ) : section.key === "projects" || section.key === "news" ? (
                    <div className="admin-subpanel-grid">
                      <label className="auth-field">
                        <span>Image (URL ou /assets/...)</span>
                        <input value={item.image} onChange={(event) => updateNestedArrayItem(section.key, index, "image", event.target.value)} />
                      </label>
                      <label className="auth-field">
                        <span>Date</span>
                        <input value={item.date} onChange={(event) => updateNestedArrayItem(section.key, index, "date", event.target.value)} />
                      </label>
                      <label className="auth-field admin-field-full">
                        <span>Titre</span>
                        <input value={item.title} onChange={(event) => updateNestedArrayItem(section.key, index, "title", event.target.value)} />
                      </label>
                      <label className="auth-field admin-field-full">
                        <span>Description</span>
                        <textarea className="admin-textarea admin-textarea-compact" rows={4} value={item.description} onChange={(event) => updateNestedArrayItem(section.key, index, "description", event.target.value)} />
                      </label>
                    </div>
                  ) : section.key === "partners" ? (
                    <div className="admin-subpanel-grid">
                      <label className="auth-field">
                        <span>Logo (URL ou /assets/...)</span>
                        <input value={item.logo} onChange={(event) => updateNestedArrayItem(section.key, index, "logo", event.target.value)} />
                      </label>
                      <label className="auth-field">
                        <span>Nom</span>
                        <input value={item.name} onChange={(event) => updateNestedArrayItem(section.key, index, "name", event.target.value)} />
                      </label>
                      <label className="auth-field admin-field-full">
                        <span>Description</span>
                        <textarea className="admin-textarea admin-textarea-compact" rows={4} value={item.description} onChange={(event) => updateNestedArrayItem(section.key, index, "description", event.target.value)} />
                      </label>
                    </div>
                  ) : (
                    <div className="admin-subpanel-grid">
                      <label className="auth-field admin-field-full">
                        <span>Question</span>
                        <input value={item.question} onChange={(event) => updateNestedArrayItem(section.key, index, "question", event.target.value)} />
                      </label>
                      <label className="auth-field admin-field-full">
                        <span>Réponse</span>
                        <textarea className="admin-textarea admin-textarea-compact" rows={4} value={item.answer} onChange={(event) => updateNestedArrayItem(section.key, index, "answer", event.target.value)} />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button className="button button-dark" type="button" onClick={() => addNestedItem(section.key)}>
              Ajouter un élément
            </button>
          </section>
        ))}

        <section className="admin-subpanel">
          <SectionHeader eyebrow="Footer" title="Pied de page" />
          <label className="auth-field">
            <span>Email de contact</span>
            <input value={form.footer.email} onChange={(event) => updateField("footer", "email", event.target.value)} />
          </label>
        </section>
      </div>

      <div className="admin-actions">
        <button className="button button-primary" type="button" disabled={state.status === "loading"} onClick={handleSave}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer le contenu public"}
        </button>
      </div>

      {state.message ? (
        <p
          className={`auth-feedback ${
            state.status === "error"
              ? "auth-feedback-error"
              : state.status === "success"
                ? "auth-feedback-success"
                : ""
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
