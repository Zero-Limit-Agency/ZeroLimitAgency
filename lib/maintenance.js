export const MAINTENANCE_MODE_KEY = "maintenance_mode";

export const DEFAULT_MAINTENANCE_SETTINGS = {
  enabled: false,
  title: "Site en maintenance",
  message:
    "Zero Limit Agency est temporairement en maintenance. Nous revenons très vite avec une version propre et stable.",
  note: "Merci pour votre patience."
};

export function normalizeMaintenanceSettings(source) {
  const settings = source && typeof source === "object" ? source : {};

  return {
    enabled: Boolean(settings.enabled),
    title: String(settings.title || DEFAULT_MAINTENANCE_SETTINGS.title).trim() || DEFAULT_MAINTENANCE_SETTINGS.title,
    message:
      String(settings.message || DEFAULT_MAINTENANCE_SETTINGS.message).trim() ||
      DEFAULT_MAINTENANCE_SETTINGS.message,
    note: String(settings.note || DEFAULT_MAINTENANCE_SETTINGS.note).trim() || DEFAULT_MAINTENANCE_SETTINGS.note
  };
}

export async function getMaintenanceModeState(adminClient) {
  const result = await adminClient.globalMaintenanceSettings.get();

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return DEFAULT_MAINTENANCE_SETTINGS;
  }

  return normalizeMaintenanceSettings(result.data[0]?.settings || {});
}
