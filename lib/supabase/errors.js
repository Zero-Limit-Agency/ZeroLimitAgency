export function formatSupabaseAdminError(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error) && error.length > 0) {
    return formatSupabaseAdminError(error[0], fallbackMessage);
  }

  const message = typeof error.message === "string" ? error.message.trim() : "";
  const details = typeof error.details === "string" ? error.details.trim() : "";
  const hint = typeof error.hint === "string" ? error.hint.trim() : "";
  const code = typeof error.code === "string" ? error.code.trim() : "";

  const parts = [message, details, hint].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  if (code === "PGRST205") {
    return "La table globale de configuration n'existe pas encore en base. Exécute la migration SQL `20260425_global_site_settings.sql`.";
  }

  return fallbackMessage;
}
