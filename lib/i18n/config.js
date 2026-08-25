export const defaultLocale = "fr";
export const supportedLocales = Object.freeze(["fr", "en"]);

export function isSupportedLocale(locale) {
  return supportedLocales.includes(locale);
}

export function resolveLocale(locale) {
  return isSupportedLocale(locale) ? locale : defaultLocale;
}
