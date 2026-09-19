export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
export const LOCALES = ["fr", "en"];
export const ONBOARDING_INTENTS = ["personal", "creator", "team"];

export function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function validateUsername(value) {
  const username = normalizeUsername(value);
  return USERNAME_PATTERN.test(username)
    ? { ok: true, value: username }
    : { ok: false, error: "Utilisez 3 à 32 caractères : lettres minuscules, chiffres, point, tiret ou underscore." };
}

export function validateDisplayName(value) {
  const displayName = String(value || "").trim().replace(/\s+/g, " ");
  return displayName.length >= 1 && displayName.length <= 80
    ? { ok: true, value: displayName }
    : { ok: false, error: "Le nom affiché doit contenir entre 1 et 80 caractères." };
}

export function validateLocale(value) {
  return LOCALES.includes(value) ? { ok: true, value } : { ok: false, error: "Langue non prise en charge." };
}

export function validateIntent(value) {
  return ONBOARDING_INTENTS.includes(value) ? { ok: true, value } : { ok: false, error: "Orientation non prise en charge." };
}
