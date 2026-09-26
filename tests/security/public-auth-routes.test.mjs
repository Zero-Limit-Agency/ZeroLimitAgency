import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildLegacyAuthRedirect, canonicalAuthRoute, isSafeAuthNext } from "../../lib/auth/public-routes.js";

const routes = {
  "/identite/connexion": "/connexion",
  "/identite/inscription": "/inscription",
  "/identite/mot-de-passe-oublie": "/mot-de-passe-oublie",
  "/identite/nouveau-mot-de-passe": "/nouveau-mot-de-passe",
  "/identite/confirmation": "/confirmation"
};

test("public Auth routes are canonical and every identity route is an explicit redirect", () => {
  for (const [legacy, canonical] of Object.entries(routes)) {
    assert.equal(canonicalAuthRoute(legacy), canonical);
    assert.match(readFileSync(`app${legacy}/page.js`, "utf8"), /buildLegacyAuthRedirect/);
    assert.ok(readFileSync(`app${canonical}/page.js`, "utf8").length > 0);
  }
  assert.match(readFileSync("app/connexion/page.js", "utf8"), /IdentityAuthForm/);
  assert.match(readFileSync("app/connexion/definir-mot-de-passe/page.js", "utf8"), /PasswordSetupForm/);
});

test("legacy redirects preserve required state, filter unknown values and refuse open redirects", () => {
  assert.equal(buildLegacyAuthRedirect("/identite/confirmation", { code: "abc", state: "opaque", next: "/espace" }), "/confirmation?code=abc&state=opaque&next=%2Fespace");
  assert.equal(buildLegacyAuthRedirect("/identite/connexion", { next: "https://evil.example", unwanted: "value" }), "/connexion");
  assert.equal(buildLegacyAuthRedirect("/identite/connexion", { next: "//evil.example" }), "/connexion");
  assert.equal(isSafeAuthNext("/invitation/team/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN"), true);
  assert.equal(isSafeAuthNext("/%2f%2fevil.example"), false);
});

test("public login affordances use the canonical route and expose no admin entry", () => {
  for (const path of ["components/marketing/public-chrome.jsx", "components/marketing/navbar.jsx"]) {
    assert.match(readFileSync(path, "utf8"), /\/connexion/);
    assert.doesNotMatch(readFileSync(path, "utf8"), /\/identite\/connexion/);
  }
  const maintenance = readFileSync("components/maintenance-screen.jsx", "utf8");
  assert.doesNotMatch(maintenance, /admin|owner/i);
});

test("canonical reset and confirmation keep trusted server endpoints", () => {
  assert.match(readFileSync("app/api/id/signup/route.js", "utf8"), /`\/confirmation\?next=/);
  assert.match(readFileSync("app/api/id/forgot-password/route.js", "utf8"), /buildAuthRedirectUrl\("\/nouveau-mot-de-passe"/);
  assert.match(readFileSync("components/identity/confirmation-session.jsx", "utf8"), /\/api\/id\/session/);
});
