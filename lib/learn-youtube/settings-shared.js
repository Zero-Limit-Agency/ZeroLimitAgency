export const YOUTUBE_TRAINING_SETTINGS_KEY = "youtube_training_settings";
export const YOUTUBE_TRAINING_MODES = ["private", "public", "maintenance"];
export const YOUTUBE_TRAINING_MAINTENANCE_MESSAGE_MAX_LENGTH = 240;

export const DEFAULT_YOUTUBE_TRAINING_SETTINGS = {
  mode: "private",
  maintenance_message: "La Formation YouTube est temporairement indisponible.",
  cta_visible: false
};

function normalizeMessage(value) {
  const normalized = String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return DEFAULT_YOUTUBE_TRAINING_SETTINGS.maintenance_message;
  }

  return normalized.slice(0, YOUTUBE_TRAINING_MAINTENANCE_MESSAGE_MAX_LENGTH);
}

export function normalizeYoutubeTrainingSettings(source) {
  const settings = source && typeof source === "object" ? source : {};
  const mode = YOUTUBE_TRAINING_MODES.includes(settings.mode) ? settings.mode : DEFAULT_YOUTUBE_TRAINING_SETTINGS.mode;

  return {
    mode,
    maintenance_message: normalizeMessage(settings.maintenance_message),
    cta_visible: typeof settings.cta_visible === "boolean" ? settings.cta_visible : DEFAULT_YOUTUBE_TRAINING_SETTINGS.cta_visible
  };
}

export function validateYoutubeTrainingSettingsPayload(payload) {
  const mode = String(payload?.mode || "").trim();

  if (!YOUTUBE_TRAINING_MODES.includes(mode)) {
    return {
      ok: false,
      error: "Mode Formation YouTube invalide."
    };
  }

  if (typeof payload?.cta_visible !== "boolean") {
    return {
      ok: false,
      error: "La visibilité du bouton Formation YouTube doit être un booléen."
    };
  }

  const rawMessage = String(payload?.maintenance_message || "");
  const cleanedMessage = rawMessage
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanedMessage.length > YOUTUBE_TRAINING_MAINTENANCE_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Le message de maintenance doit contenir ${YOUTUBE_TRAINING_MAINTENANCE_MESSAGE_MAX_LENGTH} caractères maximum.`
    };
  }

  return {
    ok: true,
    settings: {
      mode,
      maintenance_message: cleanedMessage || DEFAULT_YOUTUBE_TRAINING_SETTINGS.maintenance_message,
      cta_visible: payload.cta_visible
    }
  };
}
