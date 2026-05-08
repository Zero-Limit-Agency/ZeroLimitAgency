"use client";

import { useMemo, useRef, useState } from "react";

import {
  buildCollaborationDownloadUrl,
  normalizeCollaborationMessage
} from "@/lib/collaboration";

function formatDateTime(value) {
  if (!value) {
    return "À l'instant";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "À l'instant";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function buildEndpoint(mode, applicationId) {
  if (mode === "admin") {
    return `/api/admin/applications/${applicationId}/collaboration`;
  }

  return `/api/client/collaboration/${applicationId}`;
}

function buildSupportLinks(contactEmail, discordUrl) {
  return {
    emailHref: contactEmail ? `mailto:${contactEmail}` : "",
    discordHref: discordUrl || ""
  };
}

export function CollaborationHub({
  applicationId,
  mode = "client",
  initialMessages = [],
  contactEmail = "contact@zerolimit.agency",
  discordUrl = "",
  readOnly = false
}) {
  const composerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState(() =>
    Array.isArray(initialMessages) ? initialMessages.map(normalizeCollaborationMessage) : []
  );
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });

  const endpoint = useMemo(() => buildEndpoint(mode, applicationId), [mode, applicationId]);
  const supportLinks = useMemo(() => buildSupportLinks(contactEmail, discordUrl), [contactEmail, discordUrl]);
  const isAdmin = mode === "admin";
  const panelClassName = `${isAdmin ? "admin-panel" : "client-panel"} collaboration-panel collaboration-panel-${mode}`;
  const headingClassName = `${isAdmin ? "admin-panel-heading" : "client-panel-heading"} collaboration-panel-heading`;
  const noteClassName = isAdmin ? "admin-inline-note" : "client-panel-note";

  function focusComposer() {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateFiles(fileList) {
    setFiles(Array.from(fileList || []).filter((file) => file instanceof File));
  }

  async function handleSubmit() {
    if (readOnly || state.status === "loading") {
      return;
    }

    const trimmedMessage = String(message || "").trim();

    if (!trimmedMessage && files.length === 0) {
      setState({
        status: "error",
        message: "Ajoutez un message ou au moins un fichier."
      });
      return;
    }

    setState({
      status: "loading",
      message: ""
    });

    try {
      const body = new FormData();
      body.set("message", trimmedMessage);

      files.forEach((file) => {
        body.append("attachments", file);
      });

      const response = await fetch(endpoint, {
        method: "POST",
        body
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success || !payload?.messageRecord) {
        throw new Error(payload?.error || "Impossible d'envoyer le message.");
      }

      setMessages((current) => [...current, normalizeCollaborationMessage(payload.messageRecord)]);
      setMessage("");
      setFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setState({
        status: "success",
        message: isAdmin ? "La réponse a bien été envoyée." : "Votre message a bien été envoyé."
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible d'envoyer le message."
      });
    }
  }

  return (
    <section className={panelClassName}>
      <div className={headingClassName}>
        <div>
          <p className="eyebrow">Collaboration</p>
          <h2>{isAdmin ? "Canaux de discussion du client" : "Choisissez votre canal de discussion"}</h2>
        </div>
        <p className={noteClassName}>
          {isAdmin
            ? "Répondez au client ici, ou redirigez-le vers Discord et l'e-mail selon le contexte."
            : "Vous pouvez écrire ici directement, ouvrir Discord pour un ticket ou passer par e-mail."}
        </p>
      </div>

      <div className="collaboration-actions-grid">
        <button type="button" className="collaboration-action-card" onClick={focusComposer}>
          <small>Sur le site</small>
          <strong>Discussion directe</strong>
          <span>Envoyer un message, joindre des fichiers et suivre les réponses dans votre dossier.</span>
        </button>

        {supportLinks.discordHref ? (
          <a className="collaboration-action-card" href={supportLinks.discordHref} target="_blank" rel="noreferrer">
            <small>Discord</small>
            <strong>Ouvrir un ticket</strong>
            <span>Basculer vers Discord pour discuter en temps réel avec l'équipe.</span>
          </a>
        ) : (
          <div className="collaboration-action-card collaboration-action-card-disabled">
            <small>Discord</small>
            <strong>Configuration requise</strong>
            <span>Ajoutez l'URL Discord de support pour activer ce canal.</span>
          </div>
        )}

        {supportLinks.emailHref ? (
          <a className="collaboration-action-card" href={supportLinks.emailHref}>
            <small>E-mail</small>
            <strong>Contacter par mail</strong>
            <span>Ouvrir votre application e-mail avec l'adresse de contact pré-remplie.</span>
          </a>
        ) : (
          <div className="collaboration-action-card collaboration-action-card-disabled">
            <small>E-mail</small>
            <strong>Adresse manquante</strong>
            <span>Ajoutez une adresse de support pour activer ce canal.</span>
          </div>
        )}
      </div>

      <div className="collaboration-thread">
        <div className="collaboration-thread-header">
          <div>
            <strong>{isAdmin ? "Conversation avec le client" : "Discussion sur le site"}</strong>
            <span>{messages.length > 0 ? `${messages.length} message${messages.length > 1 ? "s" : ""}` : "Aucun message pour le moment"}</span>
          </div>
          <button type="button" className="button button-dark" onClick={focusComposer}>
            {isAdmin ? "Répondre ici" : "Écrire un message"}
          </button>
        </div>

        <div className="collaboration-message-list">
          {messages.length > 0 ? (
            messages.map((messageRecord) => (
              <article
                key={messageRecord.id}
                className={`collaboration-message-card collaboration-message-card-${messageRecord.author_role}`}
              >
                <div className="collaboration-message-topline">
                  <strong>{messageRecord.author_name}</strong>
                  <span>{formatDateTime(messageRecord.created_at)}</span>
                </div>
                <p>{messageRecord.message || "Message sans texte."}</p>

                {messageRecord.attachments.length > 0 ? (
                  <div className="collaboration-attachments">
                    {messageRecord.attachments.map((attachment, attachmentIndex) => (
                      <a
                        key={`${messageRecord.id}-${attachment.path}`}
                        className="collaboration-attachment-chip"
                        href={buildCollaborationDownloadUrl({
                          mode,
                          applicationId,
                          messageId: messageRecord.id,
                          attachmentIndex
                        })}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>{attachment.name}</span>
                        <small>{attachment.size > 0 ? `${Math.ceil(attachment.size / 1024)} Ko` : "Fichier"}</small>
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="collaboration-empty">
              <strong>Aucune discussion ouverte pour le moment.</strong>
              <span>
                {isAdmin
                  ? "Le client pourra écrire ici, et vous pourrez lui répondre directement depuis cette fiche."
                  : "Commencez la discussion ici si vous préférez la centraliser dans votre espace client."}
              </span>
            </div>
          )}
        </div>
      </div>

      <div ref={composerRef} className="collaboration-composer">
        <label className="auth-field">
          <span>{isAdmin ? "Votre réponse" : "Votre message"}</span>
          <textarea
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
              isAdmin
                ? "Écrivez ici votre réponse pour le client."
                : "Expliquez votre besoin, envoyez vos retours ou joignez vos fichiers ici."
            }
            disabled={readOnly || state.status === "loading"}
          />
        </label>

        <label className="auth-field">
          <span>Fichiers</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(event) => updateFiles(event.target.files)}
            disabled={readOnly || state.status === "loading"}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.docx,.xlsx,.pptx"
          />
        </label>

        {files.length > 0 ? (
          <div className="collaboration-selected-files">
            {files.map((file) => (
              <span key={`${file.name}-${file.size}`}>{file.name}</span>
            ))}
          </div>
        ) : null}

        {readOnly ? (
          <div className="auth-feedback auth-feedback-info">
            Cette discussion n'est pas disponible dans ce mode.
          </div>
        ) : null}

        {state.message ? (
          <div className={`auth-feedback auth-feedback-${state.status === "success" ? "success" : state.status === "error" ? "error" : "info"}`}>
            {state.message}
          </div>
        ) : null}

        {!readOnly ? (
          <div className="admin-actions">
            <button type="button" className="button button-primary" disabled={state.status === "loading"} onClick={handleSubmit}>
              {state.status === "loading" ? "Envoi..." : isAdmin ? "Envoyer la réponse" : "Envoyer le message"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}


