const modes = ["private", "maintenance", "public"];
const defaultSettings = {
  visibilityMode: "private",
  maintenanceMessage:
    "DropMap est temporairement indisponible. Notre équipe effectue actuellement une opération de maintenance. Veuillez réessayer ultérieurement."
};

function normalizeMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  return modes.includes(mode) ? mode : "private";
}

function normalizeSettings(settings) {
  if (!settings || typeof settings !== "object") {
    return defaultSettings;
  }

  const message = String(settings.maintenanceMessage || settings.maintenance_message || "").replace(/\s+/g, " ").trim();

  return {
    visibilityMode: normalizeMode(settings.visibilityMode || settings.visibility_mode),
    maintenanceMessage: message || defaultSettings.maintenanceMessage
  };
}

function getContext({ role, settings, isDemo = false } = {}) {
  const normalized = normalizeSettings(settings);
  const mode = normalized.visibilityMode;
  const isAdmin = role === "admin";

  if (isAdmin) {
    return { mode, isAdmin: true, isDemo: Boolean(isDemo), action: "show_admin_preview" };
  }

  if (mode === "private") {
    return { mode, isAdmin: false, isDemo: Boolean(isDemo), action: "redirect_home" };
  }

  if (mode === "maintenance") {
    return { mode, isAdmin: false, isDemo: Boolean(isDemo), action: "show_maintenance" };
  }

  return { mode: "public", isAdmin: false, isDemo: Boolean(isDemo), action: "show_public_page" };
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

const cases = [
  ["private + visiteur", { settings: { visibilityMode: "private" } }, "redirect_home"],
  ["private + client", { role: "client", settings: { visibilityMode: "private" } }, "redirect_home"],
  ["private + démo", { role: "client", isDemo: true, settings: { visibilityMode: "private" } }, "redirect_home"],
  ["private + admin", { role: "admin", settings: { visibilityMode: "private" } }, "show_admin_preview"],
  ["maintenance + visiteur", { settings: { visibilityMode: "maintenance" } }, "show_maintenance"],
  ["maintenance + client", { role: "client", settings: { visibilityMode: "maintenance" } }, "show_maintenance"],
  ["maintenance + démo", { role: "client", isDemo: true, settings: { visibilityMode: "maintenance" } }, "show_maintenance"],
  ["maintenance + admin", { role: "admin", settings: { visibilityMode: "maintenance" } }, "show_admin_preview"],
  ["public + visiteur", { settings: { visibilityMode: "public" } }, "show_public_page"],
  ["public + client", { role: "client", settings: { visibilityMode: "public" } }, "show_public_page"],
  ["public + admin", { role: "admin", settings: { visibilityMode: "public" } }, "show_admin_preview"]
];

for (const [label, input, expectedAction] of cases) {
  assertEqual(label, getContext(input).action, expectedAction);
}

assertEqual("configuration absente", normalizeSettings(null).visibilityMode, "private");
assertEqual("mode invalide", normalizeSettings({ visibilityMode: "leaked" }).visibilityMode, "private");
assertEqual("erreur de lecture simulée", normalizeSettings(undefined).visibilityMode, "private");
assertEqual("message vide", normalizeSettings({ visibilityMode: "maintenance", maintenanceMessage: "" }).maintenanceMessage, defaultSettings.maintenanceMessage);

console.log("DropMap visibility verification passed.");

const { execFileSync } = await import("node:child_process");

const allowedChangedFilePatterns = [
  /^app\/dropmap\//,
  /^app\/admin\/dropmap\//,
  /^app\/api\/admin\/dropmap\//,
  /^components\/dropmap\//,
  /^components\/admin\/dropmap\//,
  /^lib\/dropmap\//,
  /^supabase\/migrations\/.*dropmap.*$/,
  /^scripts\/.*dropmap.*$/,
  /^lib\/supabase\/admin\.js$/,
  /^app\/admin\/page\.js$/
];

const changedFiles = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" })
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean)
];

const forbiddenChangedFiles = changedFiles.filter(
  (file) => !allowedChangedFilePatterns.some((pattern) => pattern.test(file))
);

if (forbiddenChangedFiles.length > 0) {
  throw new Error(`Forbidden non-DropMap files changed:\n${forbiddenChangedFiles.join("\n")}`);
}

console.log("DropMap scope verification passed.");
