import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const DROPMAP_VISIBILITY_MODES = ["private", "maintenance", "public"];
export const DROPMAP_DEFAULT_VISIBILITY_MODE = "private";
export const DROPMAP_MAINTENANCE_MESSAGE_MAX_LENGTH = 320;
export const DROPMAP_DEFAULT_MAINTENANCE_MESSAGE =
  "DropMap est temporairement indisponible. Notre équipe effectue actuellement une opération de maintenance. Veuillez réessayer ultérieurement.";

export const DEFAULT_DROPMAP_SETTINGS = {
  visibilityMode: DROPMAP_DEFAULT_VISIBILITY_MODE,
  maintenanceMessage: DROPMAP_DEFAULT_MAINTENANCE_MESSAGE
};

export function normalizeDropMapVisibilityMode(value) {
  const mode = String(value || "").trim().toLowerCase();

  return DROPMAP_VISIBILITY_MODES.includes(mode) ? mode : DROPMAP_DEFAULT_VISIBILITY_MODE;
}

function normalizeMaintenanceMessage(value) {
  const message = String(value || "").replace(/\s+/g, " ").trim();

  if (!message) {
    return DROPMAP_DEFAULT_MAINTENANCE_MESSAGE;
  }

  return message.slice(0, DROPMAP_MAINTENANCE_MESSAGE_MAX_LENGTH);
}

export function normalizeDropMapSettings(settings) {
  if (!settings || typeof settings !== "object") {
    return DEFAULT_DROPMAP_SETTINGS;
  }

  return {
    visibilityMode: normalizeDropMapVisibilityMode(settings.visibilityMode || settings.visibility_mode),
    maintenanceMessage: normalizeMaintenanceMessage(settings.maintenanceMessage || settings.maintenance_message)
  };
}

export function validateDropMapSettingsPayload(payload) {
  const visibilityMode = normalizeDropMapVisibilityMode(payload?.visibilityMode || payload?.visibility_mode);
  const requestedMode = String(payload?.visibilityMode || payload?.visibility_mode || "").trim().toLowerCase();

  if (!DROPMAP_VISIBILITY_MODES.includes(requestedMode)) {
    return {
      ok: false,
      error: "Le mode DropMap sélectionné est invalide."
    };
  }

  const rawMaintenanceMessage = String(payload?.maintenanceMessage || payload?.maintenance_message || "").trim();

  if (rawMaintenanceMessage.length > DROPMAP_MAINTENANCE_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Le message de maintenance ne peut pas dépasser ${DROPMAP_MAINTENANCE_MESSAGE_MAX_LENGTH} caractères.`
    };
  }

  return {
    ok: true,
    settings: {
      visibilityMode,
      maintenanceMessage: normalizeMaintenanceMessage(rawMaintenanceMessage)
    },
    databaseRecord: {
      visibility_mode: visibilityMode,
      maintenance_message: rawMaintenanceMessage || null
    }
  };
}

export async function getDropMapSettings(adminClient = createSupabaseAdminClient()) {
  try {
    const result = await adminClient.dropMapSettings.getDropMapSettings();

    if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      return DEFAULT_DROPMAP_SETTINGS;
    }

    return normalizeDropMapSettings(result.data[0]);
  } catch {
    return DEFAULT_DROPMAP_SETTINGS;
  }
}
