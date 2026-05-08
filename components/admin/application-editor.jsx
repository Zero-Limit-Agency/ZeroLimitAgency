"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DeleteApplicationButton } from "@/components/admin/delete-application-button";
import { CollaborationHub } from "@/components/collaboration/collaboration-hub";
import {
  buildClientWorkspaceFlags,
  CLIENT_VIEW_PREFERENCE_KEYS,
  stripClientViewPreferenceResources
} from "@/lib/applications/client-space";
import { isCollaborationRequestType } from "@/lib/collaboration";

function createResourceDraft(existing = {}) {
  return {
    key: existing.key || "",
    name: existing.name || "",
    kind: existing.kind || "",
    description: existing.description || "",
    url: existing.url || "",
    logo_url: existing.logo_url || ""
  };
}

function createTimelineDraft(existing = {}) {
  return {
    key: existing.key || "",
    label: existing.label || "",
    date: existing.date || "",
    description: existing.description || "",
    tone: existing.tone || "upcoming",
    order: Number.isFinite(Number(existing.order)) ? Number(existing.order) : 0
  };
}

function createCallTaskDraft(existing = {}) {
  return {
    key: existing.key || "",
    label: existing.label || ""
  };
}

function createImportantDateDraft(existing = {}) {
  return {
    key: existing.key || "",
    label: existing.label || "",
    value: existing.value || ""
  };
}

function createCallReportDraft(existing = {}) {
  const report = existing && typeof existing === "object" ? existing : {};

  return {
    call_type: report.call_type || "intro",
    raw_notes: report.raw_notes || "",
    client_summary: report.client_summary || "",
    suggested_email: report.suggested_email || "",
    suggested_timeline_events: Array.isArray(report.suggested_timeline_events)
      ? report.suggested_timeline_events.map(createTimelineDraft)
      : [],
    internal_tasks: Array.isArray(report.internal_tasks) ? report.internal_tasks.map(createCallTaskDraft) : [],
    important_dates: Array.isArray(report.important_dates)
      ? report.important_dates.map(createImportantDateDraft)
      : [],
    status: report.status || "draft"
  };
}

function normalizeTimelineCollection(items) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    ...createTimelineDraft(item),
    key: item?.key || `timeline-${index + 1}`,
    order: index + 1
  }));
}

function buildCallTypeMeta(type) {
  switch (type) {
    case "training":
      return {
        label: "formation",
        nextStep: "une mise en pratique accompagnee"
      };
    case "follow_up":
      return {
        label: "suivi client",
        nextStep: "un point d'avancement sur les actions en cours"
      };
    case "other":
      return {
        label: "echange",
        nextStep: "une suite adaptée à votre dossier"
      };
    default:
      return {
        label: "appel d'introduction",
        nextStep: "un cadrage du projet et des prochaines étapes"
      };
  }
}

function detectImportantDatesFromNotes(notes) {
  const text = String(notes || "");
  const matches = [...text.matchAll(/\b(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)\b/g)];

  return matches.slice(0, 4).map((match, index) => ({
    key: `important-date-detected-${index + 1}`,
    label: `Date reperee ${index + 1}`,
    value: match[1]
  }));
}

function buildCallAssistantDraft(notes, callType) {
  const trimmedNotes = String(notes || "").trim();
  const meta = buildCallTypeMeta(callType);
  const rawLines = trimmedNotes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const fallbackLine = rawLines[0] || "Un échange client a eu lieu.";
  const summaryLines = rawLines.slice(0, 3);
  const actionLines = rawLines.slice(0, 3).map((line, index) => ({
    key: `internal-task-${index + 1}`,
    label: line
  }));
  const detectedDates = detectImportantDatesFromNotes(trimmedNotes);
  const timelineEvents = normalizeTimelineCollection([
    {
      key: "call-report-summary",
      label: "Compte rendu d'appel valide",
      date: "A confirmer",
      description: fallbackLine,
      tone: "done"
    },
    {
      key: "call-report-next-step",
      label: "Prochaine etape définie",
      date: detectedDates[0]?.value || "A planifier",
      description: `Suite prévue après ${meta.label} : ${meta.nextStep}.`,
      tone: "current"
    }
  ]);

  return {
    client_summary:
      summaryLines.length > 0
        ? summaryLines.join("\n")
        : "Résumé client à compléter après l'appel.",
    suggested_email: [
      "Bonjour,",
      "",
      `Merci pour votre ${meta.label}.`,
      summaryLines.length > 0 ? `Voici le resume retenu : ${summaryLines.join(" ")}` : fallbackLine,
      "",
      `Prochaine etape : ${meta.nextStep}.`,
      "",
      "Zero Limit Agency"
    ].join("\n"),
    suggested_timeline_events: timelineEvents,
    internal_tasks:
      actionLines.length > 0
        ? actionLines
        : [
            {
              key: "internal-task-1",
              label: "Compléter les actions internes à partir du compte rendu."
            }
          ],
    important_dates:
      detectedDates.length > 0
        ? detectedDates
        : [
            {
              key: "important-date-1",
              label: "Date à confirmer",
              value: ""
            }
          ]
  };
}

function createPacketForm(existing = {}) {
  const packet = existing && typeof existing === "object" ? existing : {};

  return {
    summary_message: packet.summary_message || "",
    payment_url: packet.payment_url || "",
    status: packet.status === "sent" ? "sent" : "draft",
    welcome_file_name: packet.welcome_file_name || "",
    welcome_storage_path: packet.welcome_storage_path || "",
    quote_file_name: packet.quote_file_name || "",
    quote_storage_path: packet.quote_storage_path || "",
    contract_file_name: packet.contract_file_name || "",
    contract_storage_path: packet.contract_storage_path || ""
  };
}

function formatAdminDate(value) {
  if (!value) {
    return "Non renseigné";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatProjectDate(value) {
  if (!value) {
    return "A définir";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long"
  }).format(date);
}

function buildSpaceStatusLabel(status) {
  return status === "active" ? "Accompagnement débloqué" : "Espace en préparation";
}

function buildDefaultTimeline(application, profile) {
  if (Array.isArray(profile?.timeline_events) && profile.timeline_events.length > 0) {
    return profile.timeline_events.map(createTimelineDraft);
  }

  if (isCollaborationRequestType(application?.request_type)) {
    return [];
  }

  const acceptedDate = formatProjectDate(application?.updated_at || application?.created_at);

  return [
    createTimelineDraft({
      key: "accepted",
      label: "Dossier accepté",
      date: acceptedDate,
      description: "Le dossier a été validé et préparé pour l'accompagnement client.",
      tone: "done"
    }),
    createTimelineDraft({
      key: "call",
      label: "Prise de rendez-vous",
      date: "A planifier",
      description: "Étape prévue pour cadrer le plan, les priorités et les ressources à activer.",
      tone: "current"
    }),
    createTimelineDraft({
      key: "support",
      label: "Accompagnement réel",
      date: "Après validation du plan",
      description: "Le dossier sera enrichi une fois l'espace client débloqué.",
      tone: "upcoming"
    })
  ];
}

export function ApplicationEditor({
  application,
  profile,
  accèss,
  postCallZeroPacket,
  callReport,
  clientSpaceUrl,
  hasPostCallZeroPacket = false,
  collaborationMessages = [],
  supportEmail = "contact@zerolimit.agency",
  discordUrl = ""
}) {
  const router = useRouter();
  const hasCollaborationSpace = isCollaborationRequestType(application?.request_type);
  const workspaceFlags = buildClientWorkspaceFlags(application, profile);
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });
  const [postCallZeroState, setPostCallZeroState] = useState({
    status: "idle",
    message: ""
  });
  const [manualEmailState, setManualEmailState] = useState({
    status: "idle",
    message: ""
  });
  const [callAssistantState, setCallAssistantState] = useState({
    status: "idle",
    message: ""
  });
  const [manualEmailForm, setManualEmailForm] = useState({
    subject: "",
    message: ""
  });
  const [manualEmailFiles, setManualEmailFiles] = useState([]);
  const [callAssistantForm, setCallAssistantForm] = useState(() => createCallReportDraft(callReport));
  const [packetForm, setPacketForm] = useState(() => createPacketForm(postCallZeroPacket));
  const [packetFiles, setPacketFiles] = useState({
    welcome_file: null,
    quote_file: null,
    contract_file: null
  });
  const [form, setForm] = useState({
    first_name: application?.first_name || "",
    last_name: application?.last_name || "",
    pseudo: application?.pseudo || "",
    email: application?.email || "",
    request_type: application?.request_type || "",
    company: application?.company || "",
    country: application?.country || "",
    language: application?.language || "",
    message_rewritten: application?.message_rewritten || application?.message_raw || "",
    drive_folder_url: application?.drive_folder_url || "",
    notion_url: profile?.notion_url || "",
    space_status: profile?.space_status || "preparing",
    market_accèss_enabled: Boolean(profile?.market_accèss_enabled),
    show_preparation: workspaceFlags.showPreparation,
    show_timeline: workspaceFlags.showTimeline,
    resource_links:
      Array.isArray(profile?.resource_links) && profile.resource_links.length > 0
        ? stripClientViewPreferenceResources(profile.resource_links).map(createResourceDraft)
        : [createResourceDraft()],
    timeline_events: normalizeTimelineCollection(buildDefaultTimeline(application, profile))
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateArrayField(field, index, key, value) {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value
            }
          : item
      )
    }));
  }

  function updatePacketField(field, value) {
    setPacketForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updatePacketFile(field, file) {
    setPacketFiles((current) => ({
      ...current,
      [field]: file || null
    }));
  }

  function applyPacket(packet) {
    setPacketForm(createPacketForm(packet));
    setPacketFiles({
      welcome_file: null,
      quote_file: null,
      contract_file: null
    });
  }

  function buildPacketFormData(statusOverride) {
    const body = new FormData();
    body.set("summary_message", packetForm.summary_message);
    body.set("payment_url", packetForm.payment_url);
    body.set("status", statusOverride || packetForm.status || "draft");

    Object.entries(packetFiles).forEach(([field, file]) => {
      if (file instanceof File) {
        body.set(field, file);
      }
    });

    return body;
  }

  function updateManualEmailField(field, value) {
    setManualEmailForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateManualEmailFiles(fileList) {
    setManualEmailFiles(Array.from(fileList || []).filter((file) => file instanceof File));
  }

  function updateCallAssistantField(field, value) {
    setCallAssistantForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateCallAssistantArrayField(field, index, key, value) {
    setCallAssistantForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value
            }
          : item
      )
    }));
  }

  function applyTimelineNormalization(items) {
    setForm((current) => ({
      ...current,
      timeline_events: normalizeTimelineCollection(items)
    }));
  }

  function addResource() {
    setForm((current) => ({
      ...current,
      resource_links: [...current.resource_links, createResourceDraft()]
    }));
  }

  function removeResource(index) {
    setForm((current) => ({
      ...current,
      resource_links: current.resource_links.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addTimelineEvent() {
    applyTimelineNormalization([
      ...form.timeline_events,
      createTimelineDraft({
        key: `timeline-${Date.now()}`,
        label: "",
        date: "",
        description: "",
        tone: "upcoming"
      })
    ]);
  }

  function removeTimelineEvent(index) {
    applyTimelineNormalization(form.timeline_events.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveTimelineEvent(index, direction) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= form.timeline_events.length) {
      return;
    }

    const items = [...form.timeline_events];
    const [item] = items.splice(index, 1);
    items.splice(nextIndex, 0, item);
    applyTimelineNormalization(items);
  }

  function insertTimelineEventAfter(index) {
    const items = [...form.timeline_events];
    items.splice(index + 1, 0, createTimelineDraft({
      key: `timeline-${Date.now()}-${index + 1}`,
      label: "",
      date: "",
      description: "",
      tone: "upcoming"
    }));
    applyTimelineNormalization(items);
  }

  function addCallTask() {
    setCallAssistantForm((current) => ({
      ...current,
      internal_tasks: [
        ...current.internal_tasks,
        createCallTaskDraft({
          key: `internal-task-${Date.now()}`
        })
      ]
    }));
  }

  function removeCallTask(index) {
    setCallAssistantForm((current) => ({
      ...current,
      internal_tasks: current.internal_tasks.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addImportantDate() {
    setCallAssistantForm((current) => ({
      ...current,
      important_dates: [
        ...current.important_dates,
        createImportantDateDraft({
          key: `important-date-${Date.now()}`
        })
      ]
    }));
  }

  function removeImportantDate(index) {
    setCallAssistantForm((current) => ({
      ...current,
      important_dates: current.important_dates.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addCallTimelineSuggestion() {
    setCallAssistantForm((current) => ({
      ...current,
      suggested_timeline_events: normalizeTimelineCollection([
        ...current.suggested_timeline_events,
        createTimelineDraft({
          key: `call-event-${Date.now()}`,
          tone: "upcoming"
        })
      ])
    }));
  }

  function removeCallTimelineSuggestion(index) {
    setCallAssistantForm((current) => ({
      ...current,
      suggested_timeline_events: normalizeTimelineCollection(
        current.suggested_timeline_events.filter((_, itemIndex) => itemIndex !== index)
      )
    }));
  }

  async function saveCallAssistantDraft(nextState) {
    const response = await fetch(`/api/admin/applications/${application.id}/call-assistant`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(nextState)
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      throw new Error(result?.error || "Impossible d'enregistrer le brouillon d'appel.");
    }

    return result;
  }

  async function handleGenerateCallAssistantDraft() {
    const generatedDraft = buildCallAssistantDraft(callAssistantForm.raw_notes, callAssistantForm.call_type);
    const nextDraft = {
      ...callAssistantForm,
      ...generatedDraft,
      status: "draft"
    };

    setCallAssistantState({
      status: "loading",
      message: "Generation du brouillon en cours..."
    });

    try {
      const result = await saveCallAssistantDraft(nextDraft);
      setCallAssistantForm(createCallReportDraft(result.report));
      setCallAssistantState({
        status: "success",
        message: result.message || "Le brouillon d'assistant d'appel a bien été généré."
      });
    } catch (error) {
      setCallAssistantState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Impossible de generer le brouillon d'assistant d'appel."
      });
    }
  }

  async function handleApplyCallAssistant() {
    setCallAssistantState({
      status: "loading",
      message: "Application du brouillon à l'espace client en cours..."
    });

    try {
      await saveCallAssistantDraft(callAssistantForm);
      const response = await fetch(`/api/admin/applications/${application.id}/call-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "apply"
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'appliquer le brouillon à l'espace client.");
      }

      setCallAssistantForm((current) => ({
        ...current,
        status: "applied"
      }));
      setCallAssistantState({
        status: "success",
        message: result.message || "Le brouillon a bien été appliqué à l'espace client."
      });
      router.refresh();
    } catch (error) {
      setCallAssistantState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Impossible d'appliquer le brouillon à l'espace client."
      });
    }
  }

  async function handleSendCallAssistantEmail() {
    setCallAssistantState({
      status: "loading",
      message: "Envoi de l'email propose en cours..."
    });

    try {
      await saveCallAssistantDraft(callAssistantForm);
      const response = await fetch(`/api/admin/applications/${application.id}/call-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "send_email"
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'envoyer l'email propose au client.");
      }

      setCallAssistantForm((current) => ({
        ...current,
        status: "sent"
      }));
      setCallAssistantState({
        status: "success",
        message: result.message || "L'email propose a bien été envoyé au client."
      });
    } catch (error) {
      setCallAssistantState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Impossible d'envoyer l'email propose au client."
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setPostCallZeroState({
      status: "idle",
      message: ""
    });

    setState({
      status: "loading",
      message: "Mise à jour du dossier en cours..."
    });

    try {
      const resourceLinks = [...form.resource_links];

      if (hasCollaborationSpace) {
        if (form.show_preparation) {
          resourceLinks.push(
            createResourceDraft({
              key: CLIENT_VIEW_PREFERENCE_KEYS.showPreparation,
              name: "system",
              kind: "system"
            })
          );
        }

        if (form.show_timeline) {
          resourceLinks.push(
            createResourceDraft({
              key: CLIENT_VIEW_PREFERENCE_KEYS.showTimeline,
              name: "system",
              kind: "system"
            })
          );
        }
      }

      const response = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          application: {
            first_name: form.first_name,
            last_name: form.last_name,
            pseudo: form.pseudo,
            email: form.email,
            request_type: form.request_type,
            company: form.company,
            country: form.country,
            language: form.language,
            message_rewritten: form.message_rewritten,
            drive_folder_url: form.drive_folder_url
          },
          profile: {
            notion_url: form.notion_url,
            space_status: form.space_status,
            market_accèss_enabled: form.market_accèss_enabled,
            resource_links: resourceLinks,
            timeline_events: form.timeline_events
          }
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible de mettre à jour ce dossier.");
      }

      setState({
        status: "success",
        message: result?.message || "Dossier client mis à jour."
      });

      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible de mettre à jour ce dossier."
      });
    }
  }

  async function handleSavePostCallZeroPacket() {
    setState({
      status: "idle",
      message: ""
    });
    setPostCallZeroState({
      status: "loading",
      message: "Enregistrement du pack de démarrage client en cours..."
    });

    try {
      const response = await fetch(`/api/admin/applications/${application.id}/post-call-zero`, {
        method: "PATCH",
        body: buildPacketFormData(packetForm.status)
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'enregistrer le pack de démarrage client.");
      }

      setPostCallZeroState({
        status: "success",
        message: result.message || "Le pack de démarrage client a bien été enregistré."
      });
      applyPacket(result.packet);
      router.refresh();
    } catch (error) {
      setPostCallZeroState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer le pack de démarrage client."
      });
    }
  }

  async function handleSendPostCallZeroEmail() {
    setState({
      status: "idle",
      message: ""
    });
    setPostCallZeroState({
      status: "loading",
      message: "Envoi du pack de démarrage client en cours..."
    });

    try {
      const saveResponse = await fetch(`/api/admin/applications/${application.id}/post-call-zero`, {
        method: "PATCH",
        body: buildPacketFormData("draft")
      });
      const saveResult = await saveResponse.json().catch(() => null);

      if (!saveResponse.ok || !saveResult?.success) {
        throw new Error(saveResult?.error || "Impossible d'enregistrer le pack avant l'envoi.");
      }

      const response = await fetch(`/api/admin/applications/${application.id}/post-call-zero/send`, {
        method: "POST"
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'envoyer le pack de démarrage client.");
      }

      applyPacket({
        ...saveResult.packet,
        status: "sent"
      });
      setPostCallZeroState({
        status: "success",
        message: result.message || "Le pack de démarrage client a bien été envoyé."
      });
      router.refresh();
    } catch (error) {
      setPostCallZeroState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer le pack de démarrage client."
      });
    }
  }

  async function handleSendManualEmail() {
    setState({
      status: "idle",
      message: ""
    });
    setPostCallZeroState({
      status: "idle",
      message: ""
    });
    setManualEmailState({
      status: "loading",
      message: "Envoi de l'email au client en cours..."
    });

    try {
      const body = new FormData();
      body.set("subject", manualEmailForm.subject);
      body.set("message", manualEmailForm.message);
      manualEmailFiles.forEach((file) => {
        body.append("attachments", file, file.name);
      });

      const response = await fetch(`/api/admin/applications/${application.id}/manual-email`, {
        method: "POST",
        body
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'envoyer l'email au client.");
      }

      setManualEmailState({
        status: "success",
        message: result.message || "L'email a bien été envoyé au client."
      });
      setManualEmailForm({
        subject: "",
        message: ""
      });
      setManualEmailFiles([]);
    } catch (error) {
      setManualEmailState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible d'envoyer l'email au client."
      });
    }
  }

  return (
    <form className="admin-editor admin-application-editor" onSubmit={handleSubmit}>
      {application?.drive_transfer_error ? (
        <section className="admin-panel admin-panel-warning">
          <div className="admin-system-warning">
            <small>Alerte Google Drive</small>
            <strong>Fichiers non transférés vers Google Drive</strong>
            <p>
              {application.drive_transfer_error}. L'inscription a bien été enregistrée, mais les fichiers n'ont pas
              été envoyés dans Drive.
            </p>
          </div>
        </section>
      ) : null}

      <section className="admin-panel admin-panel-summary-account">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Compte client</p>
            <h2>État du dossier et accompagnement</h2>
          </div>
          <a className="button button-dark" href={`${clientSpaceUrl}?admin_preview=1`}>
            Voir l'espace client
          </a>
        </div>

        <div className="admin-meta-grid">
          <div className="admin-subpanel">
            <small>État de l'accès</small>
            <strong>{accèss ? "Compte lié" : "Compte non lié"}</strong>
            <p className="admin-inline-note">
              {accèss
                ? "Le compte client est bien lié à ce dossier."
                : "Aucun lien compte/dossier n'a encore été retrouvé pour ce client."}
            </p>
          </div>

          <div className="admin-subpanel">
            <small>Déblocage de l'accompagnement</small>
            <strong>{buildSpaceStatusLabel(form.space_status)}</strong>
            <p className="admin-inline-note">
              {form.space_status === "active"
                ? "Le client voit les ressources réelles et l'accompagnement complet."
                : "Le client voit un espace en préparation et un appel à prise de rendez-vous."}
            </p>
          </div>

          <div className="admin-subpanel">
            <small>Dernière mise à jour</small>
            <strong>{formatAdminDate(application.updated_at)}</strong>
            <p className="admin-inline-note">Le dossier reste modifiable à tout moment depuis cet écran.</p>
          </div>
        </div>

        <label className="admin-toggle-row" htmlFor="space-status-active">
          <div>
            <strong>Débloquer l'espace client</strong>
            <span>Active les ressources réelles après l'appel et le plan d'accompagnement.</span>
          </div>
          <input
            id="space-status-active"
            type="checkbox"
            checked={form.space_status === "active"}
            onChange={(event) => updateField("space_status", event.target.checked ? "active" : "preparing")}
          />
        </label>

        {hasCollaborationSpace ? (
          <>
            <label className="admin-toggle-row" htmlFor="show-préparation-section">
              <div>
                <strong>Afficher la section préparation</strong>
                <span>Par defaut, ce type de dossier reste centre sur les informations et la discussion.</span>
              </div>
              <input
                id="show-préparation-section"
                type="checkbox"
                checked={form.show_preparation}
                onChange={(event) => updateField("show_preparation", event.target.checked)}
              />
            </label>

            <label className="admin-toggle-row" htmlFor="show-timeline-section">
              <div>
                <strong>Afficher le suivi du projet</strong>
                <span>Activez cette frise seulement si vous voulez exposer les étapes au client.</span>
              </div>
              <input
                id="show-timeline-section"
                type="checkbox"
                checked={form.show_timeline}
                onChange={(event) => updateField("show_timeline", event.target.checked)}
              />
            </label>
          </>
        ) : null}

      </section>

      <section className="admin-panel admin-panel-summary-profile">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Identité</p>
            <h2>Profil client</h2>
          </div>
        </div>

        <div className="admin-meta-grid">
          <label className="auth-field">
            <span>Prénom</span>
            <input value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Nom</span>
            <input value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Pseudo</span>
            <input value={form.pseudo} onChange={(event) => updateField("pseudo", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="admin-panel admin-panel-summary-case">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Dossier client</p>
            <h2>Résumé et informations</h2>
          </div>
        </div>

        <div className="admin-meta-grid">
          <label className="auth-field">
            <span>Type de demande</span>
            <input value={form.request_type} onChange={(event) => updateField("request_type", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Société</span>
            <input value={form.company} onChange={(event) => updateField("company", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Pays</span>
            <input value={form.country} onChange={(event) => updateField("country", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Langue</span>
            <input value={form.language} onChange={(event) => updateField("language", event.target.value)} />
          </label>
        </div>

        <label className="auth-field">
          <span>Résumé du dossier</span>
          <textarea
            className="admin-textarea"
            rows={6}
            value={form.message_rewritten}
            onChange={(event) => updateField("message_rewritten", event.target.value)}
          />
        </label>
      </section>

      <section className="admin-panel admin-panel-summary-resources">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Ressources</p>
            <h2>Ressources</h2>
          </div>
        </div>

        <div className="admin-meta-grid">
          <label className="auth-field">
            <span>Dossier Google Drive</span>
            <input
              value={form.drive_folder_url}
              onChange={(event) => updateField("drive_folder_url", event.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>Lien Notion</span>
            <input value={form.notion_url} onChange={(event) => updateField("notion_url", event.target.value)} />
          </label>
        </div>

        <label className="admin-toggle-row" htmlFor="market-accèss-enabled">
          <div>
            <strong>Zero Limit Market</strong>
            <span>Afficher ou masquer le module market dans l'espace client.</span>
          </div>
          <input
            id="market-accèss-enabled"
            type="checkbox"
            checked={form.market_accèss_enabled}
            onChange={(event) => updateField("market_accèss_enabled", event.target.checked)}
          />
        </label>

        {form.drive_folder_url ? (
          <div className="admin-actions admin-actions-inline">
            <a className="button button-dark" href={form.drive_folder_url} target="_blank" rel="noreferrer">
              Ouvrir le dossier Drive
            </a>
          </div>
        ) : null}

        <div className="admin-stack">
          {form.resource_links.map((resource, index) => (
            <div key={`resource-${index}`} className="admin-subpanel">
              <div className="admin-panel-heading admin-panel-heading-tight">
                <div>
                  <small>Outil {index + 1}</small>
                </div>
                {form.resource_links.length > 1 ? (
                  <button
                    className="button button-dark button-compact"
                    type="button"
                    onClick={() => removeResource(index)}
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>

              <div className="admin-subpanel-grid">
                <label className="auth-field">
                  <span>Nom de l'outil</span>
                  <input
                    value={resource.name}
                    onChange={(event) => updateArrayField("resource_links", index, "name", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Catégorie</span>
                  <input
                    value={resource.kind}
                    onChange={(event) => updateArrayField("resource_links", index, "kind", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Lien</span>
                  <input
                    value={resource.url}
                    onChange={(event) => updateArrayField("resource_links", index, "url", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Logo (URL, optionnel)</span>
                  <input
                    value={resource.logo_url}
                    onChange={(event) => updateArrayField("resource_links", index, "logo_url", event.target.value)}
                  />
                </label>
              </div>

              <label className="auth-field">
                <span>Description</span>
                <textarea
                  className="admin-textarea admin-textarea-compact"
                  rows={3}
                  value={resource.description}
                  onChange={(event) =>
                    updateArrayField("resource_links", index, "description", event.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>

        <button className="button button-dark" type="button" onClick={addResource}>
          Ajouter un outil
        </button>
      </section>

      <section className="admin-panel admin-panel-assistant">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Assistant d'appel</p>
            <h2>Préparation post-appel</h2>
          </div>
        </div>

        <p className="admin-inline-note">
          Cette zone reste interne à l'administration. Rien n'est appliqué ni envoyé sans validation manuelle.
        </p>

        <div className="admin-stack admin-stack-tight">
          <div className="admin-subpanel">
            <div className="admin-subpanel-grid">
              <label className="auth-field">
                <span>Type d'appel</span>
                <select
                  className="admin-select"
                  value={callAssistantForm.call_type}
                  onChange={(event) => updateCallAssistantField("call_type", event.target.value)}
                >
                  <option value="intro">Appel d'introduction</option>
                  <option value="training">Formation</option>
                  <option value="follow_up">Suivi client</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <div className="admin-link-card">
                <small>État du brouillon</small>
                <strong>
                  {callAssistantForm.status === "sent"
                    ? "Email envoyé"
                    : callAssistantForm.status === "applied"
                      ? "Appliqué à l'espace client"
                      : "Brouillon"}
                </strong>
              </div>
            </div>

            <label className="auth-field">
              <span>Résumé brut de l'appel</span>
              <textarea
                className="admin-textarea"
                rows={8}
                value={callAssistantForm.raw_notes}
                onChange={(event) => updateCallAssistantField("raw_notes", event.target.value)}
                placeholder="Collez ici votre compte rendu libre de l'appel."
              />
            </label>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Brouillon généré</small>
                <h3>Résultats proposés</h3>
              </div>
            </div>

            <label className="auth-field">
              <span>Résumé client</span>
              <textarea
                className="admin-textarea"
                rows={5}
                value={callAssistantForm.client_summary}
                onChange={(event) => updateCallAssistantField("client_summary", event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Email proposé</span>
              <textarea
                className="admin-textarea"
                rows={7}
                value={callAssistantForm.suggested_email}
                onChange={(event) => updateCallAssistantField("suggested_email", event.target.value)}
              />
            </label>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Timeline suggérée</small>
                <h3>Étapes proposées</h3>
              </div>
              <button className="button button-dark button-compact" type="button" onClick={addCallTimelineSuggestion}>
                Ajouter une étape
              </button>
            </div>

            <div className="admin-stack admin-stack-tight">
              {callAssistantForm.suggested_timeline_events.map((eventItem, index) => (
                <div key={`call-suggested-${index}`} className="admin-subpanel">
                  <div className="admin-panel-heading admin-panel-heading-tight">
                    <div>
                      <small>Étape suggérée {index + 1}</small>
                    </div>
                    <button
                      className="button button-dark button-compact"
                      type="button"
                      onClick={() => removeCallTimelineSuggestion(index)}
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="admin-subpanel-grid">
                    <label className="auth-field">
                      <span>Étape</span>
                      <input
                        value={eventItem.label}
                        onChange={(event) =>
                          updateCallAssistantArrayField("suggested_timeline_events", index, "label", event.target.value)
                        }
                      />
                    </label>
                    <label className="auth-field">
                      <span>Date ou repère</span>
                      <input
                        value={eventItem.date}
                        onChange={(event) =>
                          updateCallAssistantArrayField("suggested_timeline_events", index, "date", event.target.value)
                        }
                      />
                    </label>
                    <label className="auth-field">
                      <span>État visuel</span>
                      <select
                        className="admin-select"
                        value={eventItem.tone}
                        onChange={(event) =>
                          updateCallAssistantArrayField("suggested_timeline_events", index, "tone", event.target.value)
                        }
                      >
                        <option value="done">Terminée</option>
                        <option value="current">En cours</option>
                        <option value="upcoming">À venir</option>
                      </select>
                    </label>
                  </div>

                  <label className="auth-field">
                    <span>Description</span>
                    <textarea
                      className="admin-textarea admin-textarea-compact"
                      rows={3}
                      value={eventItem.description}
                      onChange={(event) =>
                        updateCallAssistantArrayField(
                          "suggested_timeline_events",
                          index,
                          "description",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Tâches internes</small>
                <h3>Actions équipe</h3>
              </div>
              <button className="button button-dark button-compact" type="button" onClick={addCallTask}>
                Ajouter une tâche
              </button>
            </div>

            <div className="admin-stack admin-stack-tight">
              {callAssistantForm.internal_tasks.map((task, index) => (
                <div key={`call-task-${index}`} className="admin-subpanel">
                  <div className="admin-panel-heading admin-panel-heading-tight">
                    <div>
                      <small>Tâche {index + 1}</small>
                    </div>
                    <button
                      className="button button-dark button-compact"
                      type="button"
                      onClick={() => removeCallTask(index)}
                    >
                      Supprimer
                    </button>
                  </div>
                  <label className="auth-field">
                    <span>Action</span>
                    <input
                      value={task.label}
                      onChange={(event) => updateCallAssistantArrayField("internal_tasks", index, "label", event.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Dates importantes</small>
                <h3>Repères</h3>
              </div>
              <button className="button button-dark button-compact" type="button" onClick={addImportantDate}>
                Ajouter une date
              </button>
            </div>

            <div className="admin-stack admin-stack-tight">
              {callAssistantForm.important_dates.map((item, index) => (
                <div key={`important-date-${index}`} className="admin-subpanel">
                  <div className="admin-panel-heading admin-panel-heading-tight">
                    <div>
                      <small>Date {index + 1}</small>
                    </div>
                    <button
                      className="button button-dark button-compact"
                      type="button"
                      onClick={() => removeImportantDate(index)}
                    >
                      Supprimer
                    </button>
                  </div>
                  <div className="admin-subpanel-grid">
                    <label className="auth-field">
                      <span>Libellé</span>
                      <input
                        value={item.label}
                        onChange={(event) => updateCallAssistantArrayField("important_dates", index, "label", event.target.value)}
                      />
                    </label>
                    <label className="auth-field">
                      <span>Date / repère</span>
                      <input
                        value={item.value}
                        onChange={(event) => updateCallAssistantArrayField("important_dates", index, "value", event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-actions admin-actions-inline">
          <button
            className="button button-dark"
            type="button"
            onClick={handleGenerateCallAssistantDraft}
            disabled={callAssistantState.status === "loading"}
          >
            {callAssistantState.status === "loading" ? "Génération..." : "Générer un brouillon"}
          </button>
          <button
            className="button button-dark"
            type="button"
            onClick={handleApplyCallAssistant}
            disabled={callAssistantState.status === "loading"}
          >
            Appliquer à l'espace client
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={handleSendCallAssistantEmail}
            disabled={callAssistantState.status === "loading"}
          >
            Envoyer l'email au client
          </button>
        </div>

        {callAssistantState.message ? (
          <p
            className={`auth-feedback ${
              callAssistantState.status === "error"
                ? "auth-feedback-error"
                : callAssistantState.status === "success"
                  ? "auth-feedback-success"
                  : ""
            }`}
          >
            {callAssistantState.message}
          </p>
        ) : null}
      </section>

      {hasCollaborationSpace ? (
        <CollaborationHub
          applicationId={application.id}
          mode="admin"
          initialMessages={collaborationMessages}
          contactEmail={supportEmail}
          discordUrl={discordUrl}
        />
      ) : null}

        <section className="admin-panel admin-panel-manual-email">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">Email client</p>
            <h2>Envoyer un email manuel</h2>
          </div>
        </div>

        <p className="admin-inline-note">
          L'email sera envoyé automatiquement à <strong>{form.email || "aucune adresse renseignée"}</strong> depuis
          l'adresse configurée dans <code>CLIENT_EMAIL</code>.
        </p>

        <div className="admin-stack admin-stack-tight">
          <div className="admin-subpanel">
            <div className="admin-subpanel-grid">
              <label className="auth-field">
                <span>Sujet</span>
                <input
                  value={manualEmailForm.subject}
                  onChange={(event) => updateManualEmailField("subject", event.target.value)}
                  placeholder="Objet de l'email"
                />
              </label>
              <label className="auth-field">
                <span>Destinataire</span>
                <input value={form.email} readOnly />
              </label>
            </div>

            <label className="auth-field">
              <span>Message</span>
              <textarea
                className="admin-textarea"
                rows={7}
                value={manualEmailForm.message}
                onChange={(event) => updateManualEmailField("message", event.target.value)}
                placeholder="Écrivez ici le message à envoyer au client."
              />
            </label>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Pièces jointes</small>
                <h3>Fichiers optionnels</h3>
              </div>
            </div>

            <label className="auth-field admin-file-card">
              <span>Ajouter des fichiers</span>
              <input
                type="file"
                multiple
                onChange={(event) => updateManualEmailFiles(event.target.files)}
              />
              <small>
                {manualEmailFiles.length > 0
                  ? manualEmailFiles.map((file) => file.name).join(" - ")
                  : "Aucune pièce jointe ajoutee"}
              </small>
            </label>
          </div>
        </div>

        <div className="admin-actions admin-actions-inline">
          <button
            className="button button-primary"
            type="button"
            onClick={handleSendManualEmail}
            disabled={manualEmailState.status === "loading"}
          >
            {manualEmailState.status === "loading" ? "Envoi en cours..." : "Envoyer l'email"}
          </button>
        </div>

        {manualEmailState.message ? (
          <p
            className={`auth-feedback ${
              manualEmailState.status === "error"
                ? "auth-feedback-error"
                : manualEmailState.status === "success"
                  ? "auth-feedback-success"
                  : ""
            }`}
          >
            {manualEmailState.message}
          </p>
        ) : null}
      </section>

      <section className="admin-panel admin-panel-pack">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Pack de démarrage client</p>
            <h2>Préparation du pack</h2>
          </div>
        </div>

        <p className="admin-inline-note">
          Ce pack reste séparé de l'espace client. Les documents sont envoyés en pièces jointes, puis les accès utiles
          sont synchronisés dans le dossier client après l'envoi.
        </p>

        {!hasPostCallZeroPacket ? (
          <div className="admin-system-warning">
            <small>État du pack</small>
            <strong>Pack de démarrage non préparé</strong>
            <p>Vous pouvez commencer avec un brouillon vide, puis enregistrer le pack quand il est prêt.</p>
          </div>
        ) : null}

        <div className="admin-stack admin-stack-tight">
          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Section 1</small>
                <h3>Résumé</h3>
              </div>
              <span className="admin-status-pill">
                {packetForm.status === "sent" ? "Pack envoyé" : "Brouillon"}
              </span>
            </div>

            <label className="auth-field">
              <span>Résumé personnalisé</span>
              <textarea
                className="admin-textarea"
                rows={6}
                value={packetForm.summary_message}
                onChange={(event) => updatePacketField("summary_message", event.target.value)}
              />
            </label>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Section 2</small>
                <h3>Paiement</h3>
              </div>
            </div>

            <div className="admin-meta-grid">
              <label className="auth-field">
                <span>Statut du pack</span>
                <select
                  className="admin-select"
                  value={packetForm.status}
                  onChange={(event) => updatePacketField("status", event.target.value)}
                >
                  <option value="draft">Brouillon</option>
                  <option value="sent">Déjà envoyé</option>
                </select>
              </label>
              <label className="auth-field">
                <span>Lien paiement Stripe</span>
                <input
                  value={packetForm.payment_url}
                  onChange={(event) => updatePacketField("payment_url", event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Section 3</small>
                <h3>Documents</h3>
              </div>
            </div>

            <div className="admin-packet-documents-grid">
              <label className="auth-field admin-file-card">
                <span>Devis (PDF)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => updatePacketFile("quote_file", event.target.files?.[0] || null)}
                />
                <small>{packetFiles.quote_file?.name || packetForm.quote_file_name || "Aucun fichier ajoute"}</small>
              </label>

              <label className="auth-field admin-file-card">
                <span>Contrat (PDF)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => updatePacketFile("contract_file", event.target.files?.[0] || null)}
                />
                <small>
                  {packetFiles.contract_file?.name || packetForm.contract_file_name || "Aucun fichier ajoute"}
                </small>
              </label>

              <label className="auth-field admin-file-card">
                <span>Dossier de bienvenue (PDF ou ZIP)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf,.zip,application/zip,application/x-zip-compressed"
                  onChange={(event) => updatePacketFile("welcome_file", event.target.files?.[0] || null)}
                />
                <small>
                  {packetFiles.welcome_file?.name || packetForm.welcome_file_name || "Aucun fichier ajoute"}
                </small>
              </label>
            </div>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Section 4</small>
                <h3>Liens utiles</h3>
              </div>
            </div>

            <div className="admin-packet-links-grid">
              <div className="admin-link-card">
                <small>Google Drive</small>
                <strong>{form.drive_folder_url ? "Lien disponible" : "Aucun lien ajoute"}</strong>
                {form.drive_folder_url ? (
                  <a className="button button-dark button-compact" href={form.drive_folder_url} target="_blank" rel="noreferrer">
                    Ouvrir Drive
                  </a>
                ) : null}
              </div>
              <div className="admin-link-card">
                <small>Notion</small>
                <strong>{form.notion_url ? "Lien disponible" : "Aucun lien ajoute"}</strong>
                {form.notion_url ? (
                  <a className="button button-dark button-compact" href={form.notion_url} target="_blank" rel="noreferrer">
                    Ouvrir Notion
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-actions admin-actions-inline">
          <button
            className="button button-dark"
            type="button"
            onClick={handleSavePostCallZeroPacket}
            disabled={postCallZeroState.status === "loading"}
          >
            {postCallZeroState.status === "loading" ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={handleSendPostCallZeroEmail}
            disabled={postCallZeroState.status === "loading"}
          >
            {postCallZeroState.status === "loading"
              ? "Envoi en cours..."
              : "Envoyer le pack de démarrage"}
          </button>
        </div>

        {postCallZeroState.message ? (
          <p
            className={`auth-feedback ${
              postCallZeroState.status === "error"
                ? "auth-feedback-error"
                : postCallZeroState.status === "success"
                  ? "auth-feedback-success"
                  : ""
            }`}
          >
            {postCallZeroState.message}
          </p>
        ) : null}
      </section>

      <section className="admin-panel admin-panel-timeline">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Suivi du projet</p>
            <h2>Suivi du projet</h2>
          </div>
        </div>

        <div className="admin-stack">
          {form.timeline_events.map((eventItem, index) => (
            <div key={`timeline-${index}`} className="admin-subpanel">
              <div className="admin-panel-heading admin-panel-heading-tight">
                <div>
                  <small>Etape {index + 1}</small>
                </div>
                <div className="admin-actions admin-actions-inline">
                  <button
                    className="button button-dark button-compact"
                    type="button"
                    onClick={() => moveTimelineEvent(index, -1)}
                    disabled={index === 0}
                  >
                    Monter
                  </button>
                  <button
                    className="button button-dark button-compact"
                    type="button"
                    onClick={() => moveTimelineEvent(index, 1)}
                    disabled={index === form.timeline_events.length - 1}
                  >
                    Descendre
                  </button>
                  <button
                    className="button button-dark button-compact"
                    type="button"
                    onClick={() => insertTimelineEventAfter(index)}
                  >
                    Insérer dessous
                  </button>
                  {form.timeline_events.length > 1 ? (
                    <button
                      className="button button-dark button-compact"
                      type="button"
                      onClick={() => removeTimelineEvent(index)}
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="admin-subpanel-grid">
                <label className="auth-field">
                  <span>Etape</span>
                  <input
                    value={eventItem.label}
                    onChange={(event) => updateArrayField("timeline_events", index, "label", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Date ou repère</span>
                  <input
                    value={eventItem.date}
                    onChange={(event) => updateArrayField("timeline_events", index, "date", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>État visuel</span>
                  <select
                    className="admin-select"
                    value={eventItem.tone}
                    onChange={(event) => updateArrayField("timeline_events", index, "tone", event.target.value)}
                  >
                    <option value="done">Terminée</option>
                    <option value="current">En cours</option>
                    <option value="upcoming">À venir</option>
                  </select>
                </label>
              </div>

              <label className="auth-field">
                <span>Description</span>
                <textarea
                  className="admin-textarea admin-textarea-compact"
                  rows={3}
                  value={eventItem.description}
                  onChange={(event) =>
                    updateArrayField("timeline_events", index, "description", event.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>

        <button className="button button-dark" type="button" onClick={addTimelineEvent}>
          Ajouter une étape
        </button>
      </section>

      <div className="admin-actions">
        <button className="button button-primary" type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer les modifications"}
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

      <section className="admin-panel admin-panel-danger admin-panel-delete">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Zone sensible</p>
            <h2>Suppression définitive</h2>
          </div>
        </div>

        <DeleteApplicationButton applicationId={application.id} />
      </section>
    </form>
  );
}


