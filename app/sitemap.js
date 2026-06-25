const BASE_URL = "https://zerolimit.agency";

const routes = [
  "",
  "/discord",
  "/discord/terms",
  "/discord/privacy",
  "/discord/support",
  "/mentions-legales",
  "/politique-de-confidentialite",
  "/conditions-generales-de-vente",
  "/conditions-generales-d-utilisation",
  "/politique-de-remboursement"
];

export default function sitemap() {
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith("/discord") ? "monthly" : "yearly",
    priority: route === "" ? 1 : route === "/discord" ? 0.8 : 0.5
  }));
}
