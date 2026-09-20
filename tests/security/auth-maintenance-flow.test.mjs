import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildAuthRedirectUrl, resolveAuthRedirectOrigin } from "../../lib/auth/deployment-url.js";
import { teamInvitationReturnPath } from "../../lib/security/internal-return-url.js";

test("Preview Auth redirects use the trusted Vercel deployment URL without hardcoding", () => {
  const environment = {
    VERCEL_ENV: "preview",
    VERCEL_URL: "z0agency-git-fix-acme.vercel.app",
    NEXT_PUBLIC_APP_URL: "https://zerolimit.agency",
    NODE_ENV: "production"
  };
  assert.equal(resolveAuthRedirectOrigin(environment, "https://evil.example"), "https://z0agency-git-fix-acme.vercel.app");
  assert.equal(buildAuthRedirectUrl("/identite/confirmation?next=%2Fidentite", environment), "https://z0agency-git-fix-acme.vercel.app/identite/confirmation?next=%2Fidentite");
});

test("production Auth redirects keep the configured canonical origin", () => {
  const environment = { VERCEL_ENV: "production", NEXT_PUBLIC_APP_URL: "https://zerolimit.agency", NODE_ENV: "production" };
  assert.equal(resolveAuthRedirectOrigin(environment, "https://evil.example"), "https://zerolimit.agency");
});

test("Auth redirect origin rejects host poisoning and unsafe internal destinations", () => {
  assert.throws(() => resolveAuthRedirectOrigin({ VERCEL_ENV: "preview", VERCEL_URL: "evil.example", NODE_ENV: "production" }, "https://evil.example"));
  assert.throws(() => buildAuthRedirectUrl("//evil.example", { NEXT_PUBLIC_APP_URL: "https://zerolimit.agency", NODE_ENV: "production" }));
  assert.throws(() => buildAuthRedirectUrl("https://evil.example", { NEXT_PUBLIC_APP_URL: "https://zerolimit.agency", NODE_ENV: "production" }));
  assert.equal(teamInvitationReturnPath("https://evil.example"), "/identite");
  assert.equal(teamInvitationReturnPath("//evil.example"), "/identite");
  assert.equal(teamInvitationReturnPath("%2F%2Fevil.example"), "/identite");
});

test("maintenance is page-local and does not intercept the required identity completion routes", () => {
  assert.match(readFileSync("app/page.js", "utf8"), /maintenanceSettings\.enabled/);
  assert.match(readFileSync("app/connexion/page.js", "utf8"), /maintenanceSettings\.enabled/);
  for (const path of ["app/identite/confirmation/page.js", "app/identite/nouveau-mot-de-passe/page.js", "app/invitation/team/[token]/page.js"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /MaintenanceScreen|getMaintenanceModeState/);
  }
  const middleware = readFileSync("middleware.js", "utf8");
  assert.doesNotMatch(middleware, /maintenance/i);
  assert.match(middleware, /matcher: \["\/api\/:path\*"\]/);
});

test("confirmation and reset use the trusted URL resolver and required session endpoints", () => {
  const signup = readFileSync("app/api/id/signup/route.js", "utf8");
  const confirmation = readFileSync("components/identity/confirmation-session.jsx", "utf8");
  const reset = readFileSync("app/api/id/forgot-password/route.js", "utf8");
  assert.match(signup, /buildAuthRedirectUrl\(confirmationPath, process\.env, request\.url\)/);
  assert.match(confirmation, /fetch\("\/api\/id\/session"/);
  assert.match(confirmation, /teamInvitationReturnPath/);
  assert.match(reset, /buildAuthRedirectUrl\("\/identite\/nouveau-mot-de-passe"/);
});
