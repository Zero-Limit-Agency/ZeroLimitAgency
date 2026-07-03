import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const { SECURITY_HEADERS } = await import("../../lib/security/headers.mjs");

test("Supabase diagnostic route was removed", () => {
  assert.equal(existsSync("app/api/supabase/test/route.js"), false);
});

test("security headers include required browser protections", () => {
  const headers = Object.fromEntries(SECURITY_HEADERS.map((header) => [header.key, header.value]));

  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Content-Security-Policy"], /base-uri 'self'/);
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.equal(headers["Strict-Transport-Security"].includes("max-age="), true);
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["Permissions-Policy"].includes("camera=()"), true);
});

test("CSP avoids wildcard and unsafe-eval", () => {
  const csp = SECURITY_HEADERS.find((header) => header.key === "Content-Security-Policy")?.value || "";

  assert.equal(/(^|\s)\*(;|\s|$)/.test(csp), false);
  assert.equal(csp.includes("unsafe-eval"), false);
});

test("next.config applies security headers globally", () => {
  const config = readFileSync("next.config.mjs", "utf8");

  assert.match(config, /SECURITY_HEADERS/);
  assert.match(config, /source: "\/:path\*"/);
});
