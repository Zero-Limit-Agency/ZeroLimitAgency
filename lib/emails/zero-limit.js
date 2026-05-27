import "server-only";

import { Resend } from "resend";

const TRANSIENT_EMAIL_ERROR_PATTERNS = [
  "timeout",
  "timed out",
  "rate limit",
  "too many requests",
  "temporar",
  "try again",
  "service unavailable",
  "internal server error",
  "connection reset",
  "econnreset",
  "econnrefused",
  "etimedout"
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientEmailError(error) {
  const message = String(error?.message || "").toLowerCase();
  const statusCode = Number(error?.statusCode || error?.status || 0);

  if (statusCode >= 500 || statusCode === 429 || statusCode === 408) {
    return true;
  }

  return TRANSIENT_EMAIL_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

function extractEmailErrorReason(error) {
  if (!error) {
    return "Unknown email error";
  }

  const message = String(error?.message || "").trim();
  const rawBody = error?.response?.data || error?.response?.body || error?.body || null;
  const details = Array.isArray(rawBody?.errors)
    ? rawBody.errors.map((entry) => entry?.message).filter(Boolean).join("; ")
    : "";

  return [message, details].filter(Boolean).join(" | ") || "Unknown email error";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toParagraphs(value) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function buildDisplayName(application) {
  return (
    [application?.first_name, application?.last_name].filter(Boolean).join(" ") ||
    application?.pseudo ||
    application?.email ||
    "Client"
  );
}

function buildGreetingName(application) {
  return application?.first_name || application?.pseudo || "Bonjour";
}

export function buildAbsoluteUrl(path = "") {
  const base = normalizeText(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000").replace(/\/$/, "");

  if (!path) {
    return base;
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildAdminApplicationUrl(applicationId) {
  return buildAbsoluteUrl(`/admin/${applicationId}`);
}

export function buildClientApplicationUrl(applicationId) {
  return buildAbsoluteUrl(`/espace-client/${applicationId}`);
}

function formatDate(value) {
  if (!value) {
    return "Date non disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(date);
}

function createBulletList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return `
    <ul style="margin:0; padding-left:18px; color:#43333b; line-height:1.7;">
      ${items.map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function createDataRows(rows) {
  return rows
    .filter((row) => row && row.value !== undefined && row.value !== null && String(row.value).trim() !== "")
    .map(
      (row) => `
        <tr>
          <td style="padding:9px 0; vertical-align:top; color:#cab7be; font-size:13px; font-weight:700; width:180px;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:9px 0; vertical-align:top; color:#24151b; font-size:14px; line-height:1.6;">
            ${row.html || escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("");
}

function createButton(button, variant = "primary") {
  if (!button?.href || !button?.label) {
    return "";
  }

  const styles =
    variant === "secondary"
      ? "background:#f4ecef; color:#2b1a21; border:1px solid rgba(43,26,33,0.1);"
      : "background:#6f1834; color:#fff8f5; border:1px solid #6f1834;";

  return `
    <a
      href="${escapeHtml(button.href)}"
      style="
        display:inline-block;
        padding:14px 20px;
        border-radius:999px;
        text-decoration:none;
        font-weight:700;
        font-size:14px;
        ${styles}
      "
      target="_blank"
      rel="noreferrer"
    >
      ${escapeHtml(button.label)}
    </a>
  `;
}

function createSection(title, content) {
  return `
    <section style="padding:22px 24px; border-radius:22px; background:#fbf7f8; border:1px solid rgba(111,24,52,0.08);">
      <p style="margin:0 0 10px; color:#6f1834; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
        ${escapeHtml(title)}
      </p>
      ${content}
    </section>
  `;
}

function buildEmailLayout({
  preheader,
  eyebrow = "Zero Limit Agency",
  title,
  intro,
  sections = [],
  primaryButton,
  secondaryButton,
  footer = ""
}) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0; padding:0; background:#f3edef; font-family:Arial, Helvetica, sans-serif; color:#24151b;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
          ${escapeHtml(preheader || title)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3edef; padding:24px 12px;">
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="max-width:680px; background:#fffdfd; border-radius:30px; overflow:hidden; border:1px solid rgba(111,24,52,0.08); box-shadow:0 20px 50px rgba(28,10,16,0.12);"
              >
                <tr>
                  <td style="padding:32px 28px; background:radial-gradient(circle at top right, rgba(212,170,106,0.22), transparent 34%), linear-gradient(135deg, #2a1119, #511428 62%, #6f1834); color:#fff8f5;">
                    <p style="margin:0 0 14px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#f0c98f;">
                      ${escapeHtml(eyebrow)}
                    </p>
                    <h1 style="margin:0 0 14px; font-size:32px; line-height:1.04; letter-spacing:-0.03em; color:#fff8f5;">
                      ${escapeHtml(title)}
                    </h1>
                    <p style="margin:0; font-size:15px; line-height:1.7; color:#fff4ef;">
                      ${intro}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 20px 10px;">
                    <div style="display:grid; gap:14px;">
                      ${sections.join("")}
                    </div>
                  </td>
                </tr>
                ${
                  primaryButton || secondaryButton
                    ? `
                <tr>
                  <td style="padding:6px 20px 4px;">
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                      ${createButton(primaryButton, "primary")}
                      ${createButton(secondaryButton, "secondary")}
                    </div>
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  footer
                    ? `
                <tr>
                  <td style="padding:20px 24px 28px; color:#7a6570; font-size:12px; line-height:1.7;">
                    ${footer}
                  </td>
                </tr>
                `
                    : ""
                }
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendZeroLimitEmail({ to, subject, html, text, replyTo, attachments, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = normalizeText(to);
  const sender = normalizeText(from);

  if (!apiKey || !recipient || !sender) {
    return {
      ok: false,
      skipped: true,
      error: "Configuration email absente."
    };
  }

  const resend = new Resend(apiKey);

  const maxAttempts = Math.max(Number(process.env.EMAIL_RETRY_ATTEMPTS || 3), 1);
  const baseDelayMs = Math.max(Number(process.env.EMAIL_RETRY_BASE_DELAY_MS || 500), 100);
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = Date.now();

    try {
      const response = await resend.emails.send({
        from: sender,
        to: recipient,
        subject,
        html,
        text,
        reply_to: normalizeText(replyTo) || undefined,
        attachments: Array.isArray(attachments) && attachments.length > 0 ? attachments : undefined
      });

      const durationMs = Date.now() - startedAt;
      console.info("[email] send success", {
        provider: "resend",
        to: recipient,
        attempt,
        durationMs,
        emailId: response?.data?.id || response?.id || null
      });

      return { ok: true, provider: "resend", attempt, durationMs };
    } catch (error) {
      lastError = error;
      const durationMs = Date.now() - startedAt;
      const transient = isTransientEmailError(error);
      const reason = extractEmailErrorReason(error);

      console.error("[email] resend send error", {
        provider: "resend",
        to: recipient,
        attempt,
        maxAttempts,
        transient,
        durationMs,
        reason
      });

      if (!transient || attempt >= maxAttempts) {
        break;
      }

      const retryDelayMs = baseDelayMs * 2 ** (attempt - 1);
      await wait(retryDelayMs);
    }
  }

  return {
    ok: false,
    skipped: false,
    provider: "resend",
    error: extractEmailErrorReason(lastError) || "Impossible d'envoyer cet email.",
    transient: isTransientEmailError(lastError)
  };
}

export function buildInternalNewApplicationEmail({ application }) {
  const adminUrl = buildAdminApplicationUrl(application.id);
  const driveUrl = application.drive_folder_url || application.files_folder_url || null;
  const fullName = buildDisplayName(application);
  const createdAt = formatDate(application.created_at);
  const pseudo = normalizeText(application.pseudo, "Non renseigné");

  const html = buildEmailLayout({
    preheader: `Nouvelle inscription reçue de ${fullName}`,
    eyebrow: "Nouvelle inscription",
    title: "Une nouvelle demande vient d'arriver",
    intro: `Un nouveau dossier a été enregistré pour <strong>${escapeHtml(fullName)}</strong>. Vous pouvez le traiter immédiatement depuis l'administration.`,
    sections: [
      createSection(
        "Informations principales",
        `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${createDataRows([
          { label: "Nom complet", value: fullName },
          { label: "Prénom", value: application.first_name || "Non renseigné" },
          { label: "Nom", value: application.last_name || "Non renseigné" },
          { label: "Pseudo", value: pseudo },
          { label: "Email", value: application.email || "Non renseigné" },
          { label: "Date de naissance", value: application.birth_date || "Non renseignée" },
          { label: "Société", value: application.company || "Non renseignée" },
          { label: "Pays", value: application.country || "Non renseigné" },
          { label: "Langue", value: application.language || "Non renseignée" },
          { label: "Type de demande", value: application.request_type || "Non renseigné" },
          { label: "Newsletter", value: application.newsletter_opt_in ? "Oui" : "Non" },
          { label: "Date d'inscription", value: createdAt },
          { label: "Identifiant", value: application.id }
        ])}</table>`
      ),
      createSection(
        "Message brut",
        `<p style="margin:0; color:#43333b; line-height:1.75;">${toParagraphs(application.message_raw || "Aucun message transmis.")}</p>`
      )
    ],
    primaryButton: {
      href: adminUrl,
      label: "Voir la demande dans l'admin"
    },
    secondaryButton: driveUrl
      ? {
          href: driveUrl,
          label: "Ouvrir le dossier Drive"
        }
      : null,
    footer: `Accès direct : <a href="${escapeHtml(adminUrl)}" style="color:#6f1834;">${escapeHtml(adminUrl)}</a>`
  });

  return {
    subject: `Nouvelle inscription - ${fullName}`,
    html,
    text: [
      "Nouvelle inscription Zero Limit Agency",
      "",
      `Nom complet : ${fullName}`,
      `Pseudo : ${pseudo}`,
      `Email : ${application.email || "Non renseigné"}`,
      `Pays : ${application.country || "Non renseigné"}`,
      `Langue : ${application.language || "Non renseignée"}`,
      `Type de demande : ${application.request_type || "Non renseigné"}`,
      `Date : ${createdAt}`,
      `Admin : ${adminUrl}`,
      driveUrl ? `Drive : ${driveUrl}` : null,
      "",
      application.message_raw || ""
    ]
      .filter(Boolean)
      .join("\n")
  };
}

export function buildSignupConfirmationEmail({ application }) {
  const greetingName = buildGreetingName(application);
  const publicUrl = buildAbsoluteUrl("/");

  const html = buildEmailLayout({
    preheader: "Votre inscription a bien été reçue par Zero Limit Agency.",
    eyebrow: "Inscription confirmée",
    title: "Votre demande a bien été reçue",
    intro: `${escapeHtml(greetingName)}, votre demande est bien enregistrée chez Zero Limit Agency. Elle est maintenant en cours d’analyse par notre équipe.`,
    sections: [
      createSection(
        "Ce qui se passe maintenant",
        createBulletList([
          "Votre dossier est en cours d’analyse par notre équipe.",
          "Nous revenons vers vous rapidement après étude de votre demande.",
          "Vous recevrez un nouvel email dès qu’une décision ou une prochaine étape sera précisée."
        ])
      ),
      createSection(
        "Information",
        `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${createDataRows([
          { label: "Prénom", value: application.first_name || "Client" },
          { label: "Pseudo", value: application.pseudo || "Non renseigné" },
          { label: "Email", value: application.email || "Non renseigné" },
          { label: "Statut", value: "Demande en cours d'analyse" }
        ])}</table>`
      )
    ],
    primaryButton: {
      href: publicUrl,
      label: "Revenir sur le site"
    }
  });

  return {
    subject: "Confirmation de votre inscription - Zero Limit Agency",
    html,
    text: [
      "Votre demande a bien été reçue par Zero Limit Agency.",
      "",
      `Bonjour ${greetingName},`,
      "Votre demande est en cours d’analyse. Nous revenons vers vous rapidement."
    ].join("\n")
  };
}

export function buildRejectionEmail({ application }) {
  const contactEmail = normalizeText(process.env.PUBLIC_CONTACT_EMAIL, "contact@zerolimit.agency");
  const greetingName = buildGreetingName(application);

  const html = buildEmailLayout({
    preheader: "Retour sur votre demande Zero Limit Agency.",
    eyebrow: "Retour sur votre demande",
    title: "Votre inscription n'a pas été retenue",
    intro: `${escapeHtml(greetingName)}, merci pour votre prise de contact. Après étude de votre dossier, nous ne donnons pas suite à cette demande pour le moment.`,
    sections: [
      createSection(
        "Information",
        `<p style="margin:0; color:#43333b; line-height:1.75;">
          Votre demande reste enregistrée dans notre suivi interne. Si votre situation évolue ou si vous souhaitez
          nous apporter des éléments complémentaires, vous pouvez nous écrire à
          <a href="mailto:${escapeHtml(contactEmail)}" style="color:#6f1834;">${escapeHtml(contactEmail)}</a>.
        </p>`
      )
    ]
  });

  return {
    subject: "Retour sur votre demande - Zero Limit Agency",
    html,
    text: [
      `Bonjour ${greetingName},`,
      "",
      "Après étude de votre demande, nous ne donnons pas suite à ce dossier pour le moment.",
      `Pour toute question : ${contactEmail}`
    ].join("\n")
  };
}

export function buildApprovalEmail({ application }) {
  const loginUrl = buildAbsoluteUrl("/connexion");
  const clientUrl = buildClientApplicationUrl(application.id);
  const greetingName = buildGreetingName(application);

  const html = buildEmailLayout({
    preheader: "Votre accès client est ouvert chez Zero Limit Agency.",
    eyebrow: "Demande acceptée",
    title: "Votre accès client est maintenant ouvert",
    intro: `${escapeHtml(greetingName)}, votre demande a été acceptée. Vous pouvez dès maintenant accéder à votre espace client avec les identifiants choisis lors de l'inscription.`,
    sections: [
      createSection(
        "Ce que vous allez trouver",
        createBulletList([
          "Un espace client déjà actif pour suivre votre dossier.",
          "Une première version de votre espace en mode préparation.",
          "Les prochaines étapes avant le démarrage complet de l'accompagnement."
        ])
      ),
      createSection(
        "À savoir",
        `<p style="margin:0; color:#43333b; line-height:1.75;">
          Certaines ressources resteront encore en préparation tant que le cadrage n’a pas été finalisé.
          Vous pourrez néanmoins suivre l’état du dossier et retrouver les informations essentielles depuis votre espace client.
        </p>`
      )
    ],
    primaryButton: {
      href: clientUrl,
      label: "Accéder à mon espace"
    },
    secondaryButton: {
      href: loginUrl,
      label: "Se connecter"
    }
  });

  return {
    subject: "Votre dossier a été accepté - Zero Limit Agency",
    html,
    text: [
      `Bonjour ${greetingName},`,
      "",
      "Votre demande a été acceptée. Vous pouvez maintenant vous connecter à votre espace client.",
      `Connexion : ${loginUrl}`,
      `Espace client : ${clientUrl}`
    ].join("\n")
  };
}

export function buildPostCallZeroEmail({ application, packet }) {
  return buildPostCallZeroPacketEmail({ application, packet });
}

export function buildPostCallZeroPacketEmail({ application, packet }) {
  const greetingName = buildGreetingName(application);
  const clientUrl = buildClientApplicationUrl(application.id);
  const welcomeFileName = normalizeText(packet?.welcome_file_name, "Dossier de bienvenue");
  const quoteFileName = normalizeText(packet?.quote_file_name, "Devis");
  const contractFileName = normalizeText(packet?.contract_file_name, "Contrat");
  const paymentUrl = normalizeText(packet?.payment_url);
  const summary = normalizeText(
    packet?.summary_message || application?.message_rewritten || application?.request_type,
    "Le cadre d'accompagnement défini pendant l'appel 0 est maintenant prêt à démarrer."
  );

  const html = buildEmailLayout({
    preheader: "Tout est prêt pour démarrer votre accompagnement Zero Limit Agency.",
    eyebrow: "Pack de démarrage client",
    title: "Bienvenue, votre accompagnement peut démarrer",
    intro: `${escapeHtml(greetingName)}, voici votre pack de démarrage client pour lancer l'accompagnement avec Zero Limit Agency.`,
    sections: [
      createSection(
        "Résumé de l'accompagnement",
        `<p style="margin:0; color:#43333b; line-height:1.75;">${toParagraphs(summary)}</p>`
      ),
      createSection(
        "Documents joints",
        createBulletList([
          `Dossier de bienvenue joint : ${welcomeFileName}`,
          `Devis joint : ${quoteFileName}`,
          `Contrat joint : ${contractFileName}`
        ])
      ),
      createSection(
        "Paiement",
        paymentUrl
          ? `<p style="margin:0; color:#43333b; line-height:1.75;">
              Votre lien de paiement est prêt. Une fois le règlement valide, nous pourrons enclencher les prochaines étapes du dispositif.
            </p>`
          : `<p style="margin:0; color:#43333b; line-height:1.75;">
              Le lien de paiement Stripe n'a pas encore été ajouté. Vous pouvez néanmoins retrouver le reste des éléments dans votre espace client.
            </p>`
      ),
      createSection(
        "Prochaines étapes",
        createBulletList([
          "Consulter les documents joints à cet email.",
          paymentUrl
            ? "Finaliser le paiement via le lien principal."
            : "Attendre l'ajout du lien de paiement ou revenir vers l'équipe.",
          "Retrouver votre espace client pour suivre les ressources et l'avancement du dossier.",
          "Nous revenons ensuite vers vous pour lancer l'exécution opérationnelle."
        ])
      )
    ],
    primaryButton: paymentUrl
      ? {
          href: paymentUrl,
          label: "Accéder au paiement"
        }
      : {
          href: clientUrl,
          label: "Ouvrir mon espace client"
        },
    secondaryButton: {
      href: clientUrl,
      label: "Voir l'espace client"
    }
  });

  return {
    subject: "Bienvenue - démarrage de votre accompagnement Zero Limit Agency",
    html,
    text: [
      `Bonjour ${greetingName},`,
      "",
      "Voici votre pack de démarrage client après l'appel 0.",
      `Dossier de bienvenue joint : ${welcomeFileName}`,
      `Devis joint : ${quoteFileName}`,
      `Contrat joint : ${contractFileName}`,
      `Paiement : ${paymentUrl || "a ajouter"}`,
      `Espace client : ${clientUrl}`
    ].join("\n")
  };
}

export function buildManualClientEmail({ application, subject, message }) {
  const greetingName = buildGreetingName(application);
  const clientUrl = buildClientApplicationUrl(application.id);
  const safeSubject = normalizeText(subject, "Message Zero Limit Agency");
  const safeMessage = normalizeText(
    message,
    "Bonjour, nous vous contactons depuis votre dossier client Zero Limit Agency."
  );

  const html = buildEmailLayout({
    preheader: safeSubject,
    eyebrow: "Message client",
    title: safeSubject,
    intro: `${escapeHtml(greetingName)}, voici un message envoyé depuis votre dossier client Zero Limit Agency.`,
    sections: [
      createSection(
        "Message",
        `<p style="margin:0; color:#43333b; line-height:1.75;">${toParagraphs(safeMessage)}</p>`
      ),
      createSection(
        "Espace client",
        `<p style="margin:0; color:#43333b; line-height:1.75;">
          Vous pouvez retrouver votre dossier et vos ressources à tout moment depuis votre espace client.
        </p>`
      )
    ],
    primaryButton: {
      href: clientUrl,
      label: "Ouvrir mon espace client"
    }
  });

  return {
    subject: safeSubject,
    html,
    text: [
      `Bonjour ${greetingName},`,
      "",
      safeMessage,
      "",
      `Espace client : ${clientUrl}`
    ].join("\n")
  };
}

export function buildCollaborationAdminNotificationEmail({
  application,
  authorName,
  message,
  attachmentCount = 0
}) {
  const adminUrl = buildAdminApplicationUrl(application.id);
  const clientUrl = buildClientApplicationUrl(application.id);
  const displayName = buildDisplayName(application);
  const safeAuthor = normalizeText(authorName, "Client");
  const safeMessage = normalizeText(message, "Un nouveau message a été déposé dans la discussion.");
  const attachmentLine =
    attachmentCount > 0 ? `Pièces jointes ajoutées : ${attachmentCount}.` : "Aucune pièce jointe envoyée.";

  const html = buildEmailLayout({
    preheader: `Nouveau message client sur le dossier ${displayName}.`,
    eyebrow: "Notification discussion",
    title: "Nouveau message client",
    intro: `${escapeHtml(safeAuthor)} a envoyé un nouveau message depuis l'espace client du dossier <strong>${escapeHtml(displayName)}</strong>.`,
    sections: [
      createSection(
        "Message",
        `<p style="margin:0; color:#43333b; line-height:1.75;">${toParagraphs(safeMessage)}</p>`
      ),
      createSection(
        "Contexte",
        `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${createDataRows([
          { label: "Client", value: displayName },
          { label: "Email", value: application.email || "Non renseigné" },
          { label: "Type de demande", value: application.request_type || "Non renseigné" },
          { label: "Pièces jointes", value: attachmentLine }
        ])}</table>`
      )
    ],
    primaryButton: {
      href: adminUrl,
      label: "Ouvrir la fiche admin"
    },
    secondaryButton: {
      href: clientUrl,
      label: "Voir l'espace client"
    }
  });

  return {
    subject: `Nouveau message client - ${displayName}`,
    html,
    text: [
      "Nouveau message client",
      "",
      `Client : ${displayName}`,
      `Auteur : ${safeAuthor}`,
      `Message : ${safeMessage}`,
      attachmentLine,
      `Admin : ${adminUrl}`,
      `Espace client : ${clientUrl}`
    ].join("\n")
  };
}

export function buildCollaborationClientNotificationEmail({
  application,
  message,
  attachmentCount = 0
}) {
  const clientUrl = buildClientApplicationUrl(application.id);
  const greetingName = buildGreetingName(application);
  const safeMessage = normalizeText(
    message,
    "Nous avons lu votre message et vous répondons depuis votre dossier client."
  );
  const attachmentLine =
    attachmentCount > 0
      ? `Cette réponse contient ${attachmentCount} pièce(s) jointe(s).`
      : "Cette réponse ne contient pas de pièce jointe.";

  const html = buildEmailLayout({
    preheader: "Une nouvelle réponse vous attend dans votre espace client.",
    eyebrow: "Discussion client",
    title: "Nouvelle réponse de Zero Limit Agency",
    intro: `${escapeHtml(greetingName)}, nous avons lu votre message et une nouvelle réponse a été ajoutée dans votre discussion client.`,
    sections: [
      createSection(
        "Réponse",
        `<p style="margin:0; color:#43333b; line-height:1.75;">${toParagraphs(safeMessage)}</p>`
      ),
      createSection(
        "À savoir",
        `<p style="margin:0; color:#43333b; line-height:1.75;">${escapeHtml(attachmentLine)}</p>`
      )
    ],
    primaryButton: {
      href: clientUrl,
      label: "Ouvrir mon espace client"
    }
  });

  return {
    subject: "Nouvelle réponse sur votre dossier - Zero Limit Agency",
    html,
    text: [
      `Bonjour ${greetingName},`,
      "",
      "Une nouvelle réponse a été ajoutée dans votre discussion client.",
      safeMessage,
      attachmentLine,
      `Espace client : ${clientUrl}`
    ].join("\n")
  };
}
