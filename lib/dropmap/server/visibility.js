import "server-only";

import { normalizeDropMapSettings } from "@/lib/dropmap/server/settings";

export const DROPMAP_VISIBILITY_ACTIONS = [
  "redirect_home",
  "show_maintenance",
  "show_public_page",
  "show_admin_preview"
];

export function getDropMapVisibilityContext({ role, settings, isDemo = false } = {}) {
  const normalizedSettings = normalizeDropMapSettings(settings);
  const mode = normalizedSettings.visibilityMode;
  const isAdmin = role === "admin";

  if (isAdmin) {
    return {
      mode,
      isAdmin: true,
      isDemo: Boolean(isDemo),
      action: "show_admin_preview",
      canPreview: true,
      canAccessPublicPage: true
    };
  }

  if (mode === "private") {
    return {
      mode,
      isAdmin: false,
      isDemo: Boolean(isDemo),
      action: "redirect_home",
      canPreview: false,
      canAccessPublicPage: false
    };
  }

  if (mode === "maintenance") {
    return {
      mode,
      isAdmin: false,
      isDemo: Boolean(isDemo),
      action: "show_maintenance",
      canPreview: false,
      canAccessPublicPage: true
    };
  }

  return {
    mode: "public",
    isAdmin: false,
    isDemo: Boolean(isDemo),
    action: "show_public_page",
    canPreview: false,
    canAccessPublicPage: true
  };
}
