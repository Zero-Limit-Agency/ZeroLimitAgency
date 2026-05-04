export const COLLABORATION_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".zip",
  ".docx",
  ".xlsx",
  ".pptx"
];

export const COLLABORATION_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

export const COLLABORATION_ALLOWED_SIGNATURES = ["pdf", "png", "jpeg", "webp", "zip"];

export function normalizeCollaborationAttachments(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      name: String(item?.name || "").trim().slice(0, 180),
      path: String(item?.path || "").trim(),
      content_type: String(item?.content_type || "application/octet-stream").trim(),
      size: Number.isFinite(Number(item?.size)) ? Number(item.size) : 0
    }))
    .filter((item) => item.name && item.path);
}

export function normalizeCollaborationMessage(record) {
  const source = record && typeof record === "object" ? record : {};

  return {
    id: String(source.id || "").trim(),
    application_id: String(source.application_id || "").trim(),
    author_user_id: String(source.author_user_id || "").trim() || null,
    author_role: source.author_role === "admin" ? "admin" : "client",
    author_name: String(source.author_name || "").trim() || "Utilisateur",
    message: String(source.message || "").trim(),
    attachments: normalizeCollaborationAttachments(source.attachments),
    created_at: source.created_at || null
  };
}

export function buildCollaborationDownloadUrl({ mode, applicationId, messageId, attachmentIndex }) {
  const safeIndex = Number.isFinite(Number(attachmentIndex)) ? Number(attachmentIndex) : 0;

  if (mode === "admin") {
    return `/api/admin/applications/${applicationId}/collaboration/attachments/${messageId}/${safeIndex}`;
  }

  return `/api/client/collaboration/${applicationId}/attachments/${messageId}/${safeIndex}`;
}

export function buildClientCollaborationDisplayName(application) {
  const firstName = String(application?.first_name || "").trim();
  const lastName = String(application?.last_name || "").trim();
  const pseudo = String(application?.pseudo || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return fullName || pseudo || "Client";
}

export function isCollaborationRequestType(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return normalized === "contact" || normalized === "collaboration" || normalized === "partnership";
}
