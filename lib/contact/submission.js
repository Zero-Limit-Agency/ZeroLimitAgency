export function normalizeContactPayload(payload) {
  return {
    fullName: String(payload.fullName || "").trim(),
    birthDate: String(payload.birthDate || "").trim(),
    username: String(payload.username || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    company: String(payload.company || "").trim(),
    country: String(payload.country || "").trim(),
    language: String(payload.language || "").trim(),
    request: String(payload.request || "contact").trim(),
    message: String(payload.message || "").trim(),
    newsletter: Boolean(payload.newsletter),
    files: Array.isArray(payload.files)
      ? payload.files.map((file) => ({
          name: String(file?.name || "").trim(),
          size: Number(file?.size || 0),
          type: String(file?.type || "").trim()
        }))
      : []
  };
}

export function splitFullName(fullName) {
  const normalized = String(fullName || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return {
      firstName: "",
      lastName: ""
    };
  }

  const [firstName, ...lastNameParts] = normalized.split(" ");

  return {
    firstName,
    lastName: lastNameParts.join(" ")
  };
}

export function buildApplicationInsert(payload) {
  const { firstName, lastName } = splitFullName(payload.fullName);

  return {
    first_name: firstName,
    last_name: lastName,
    pseudo: payload.username || null,
    email: payload.email,
    birth_date: payload.birthDate,
    company: payload.company || null,
    country: payload.country,
    language: payload.language,
    request_type: payload.request || "contact",
    message_raw: payload.message,
    message_rewritten: null,
    status: "pending_review",
    newsletter_opt_in: payload.newsletter,
    drive_folder_id: null,
    drive_folder_url: null
  };
}

export function buildNewsletterSubscriptionInsert(payload, applicationId = null) {
  return {
    email: payload.email,
    status: "subscribed",
    source: "contact_form",
    language: payload.language || null,
    country: payload.country || null,
    application_id: applicationId
  };
}

export function validateContactPayload(payload) {
  const missingFields = [];

  if (!payload.fullName) missingFields.push("fullName");
  if (!payload.birthDate) missingFields.push("birthDate");
  if (!payload.email) missingFields.push("email");
  if (!payload.country) missingFields.push("country");
  if (!payload.language) missingFields.push("language");
  if (!payload.message) missingFields.push("message");

  if (missingFields.length) {
    return {
      valid: false,
      error: `Champs obligatoires manquants : ${missingFields.join(", ")}`
    };
  }

  return { valid: true };
}
