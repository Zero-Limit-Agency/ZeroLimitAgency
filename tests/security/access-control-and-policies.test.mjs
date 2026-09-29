import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const { sanitizeExternalUrl, sanitizeInternalPath } = await import("../../lib/security/urls.js");

test("external URL sanitizer rejects dangerous protocols and credentials", () => {
  assert.equal(sanitizeExternalUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeExternalUrl("https://user:pass@example.com/path"), "");
  assert.equal(sanitizeExternalUrl("https://example.com/path"), "https://example.com/path");
});

test("internal path sanitizer rejects protocol-relative and javascript paths", () => {
  assert.equal(sanitizeInternalPath("//evil.example"), "/");
  assert.equal(sanitizeInternalPath("javascript:alert(1)"), "/");
  assert.equal(sanitizeInternalPath("/admin"), "/admin");
});

test("middleware enforces same-origin mutations and no-store on private APIs", () => {
  const middlewareSource = readFileSync("middleware.js", "utf8");

  assert.match(middlewareSource, /MUTATING_METHODS/);
  assert.match(middlewareSource, /Origine de requête non autorisée/);
  assert.match(middlewareSource, /request\.headers\.get\("referer"\)/);
  assert.match(middlewareSource, /\/api\/billing\/stripe\/webhook/);
  assert.match(middlewareSource, /Cache-Control/);
  assert.match(middlewareSource, /private, no-store/);
});

test("RLS migration creates executable policies and entitlement foundation", () => {
  const sql = readFileSync("supabase/migrations/20260703_security_policies_and_entitlements.sql", "utf8");

  assert.match(sql, /create or replace function public\.is_admin_user/);
  assert.match(sql, /create table if not exists public\.audit_logs/);
  assert.match(sql, /create table if not exists public\.entitlements/);
  assert.match(sql, /applications_self_or_admin_select/);
  assert.match(sql, /client_collaboration_messages_self_or_admin_select/);
  assert.equal(/using \(true\)/i.test(sql), false);
});

test("Supabase verification SQL script exists", () => {
  assert.equal(existsSync("scripts/security/verify-supabase-security.sql"), true);
  const verification = readFileSync("scripts/security/verify-supabase-security.sql", "utf8");
  const executableSql = verification.replace(/--.*$/gm, "").trim();
  const statements = executableSql.split(";").map(statement => statement.trim()).filter(Boolean);
  assert.ok(statements.length > 0);
  for (const statement of statements) assert.match(statement, /^select\b/i);
  assert.doesNotMatch(executableSql, /\b(create|alter|drop|grant|revoke|insert|update|delete|truncate|call)\b/i);
  assert.match(verification, /relrowsecurity/);
  assert.match(verification, /has_function_privilege\('authenticated'/);
  assert.match(verification, /acl\.grantee = 0/);
});
