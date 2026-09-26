import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const access = await readFile(new URL("../../lib/owner/access.js", import.meta.url), "utf8");
const apiGuards = await readFile(new URL("../../lib/auth/api-guards.js", import.meta.url), "utf8");
const layout = await readFile(new URL("../../app/owner/layout.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../../supabase/migrations/20260925_owner_core_foundation.sql", import.meta.url), "utf8");
const rlsFixture = await readFile(new URL("../../supabase/tests/zero_limit_id_rls.sql", import.meta.url), "utf8");
const bootstrapDocs = await readFile(new URL("../../docs/architecture/platform-roles.md", import.meta.url), "utf8");

// These regression cases assert every competing authority is absent from the trust decision.
test("OWNER guard derives authority only from Auth -> profile -> platform role", () => {
  assert.match(access, /session\.user\.id/);
  assert.match(access, /getByAuthUserId\(session\.user\.id\)/);
  assert.match(access, /getRole\(profile\.id\)/);
  assert.match(access, /platformRole\.role !== PLATFORM_OWNER_ROLE/);
  for (const escalationSource of ["email ===", "profession", "organization", "membership", "header", "cookie", "discord"]) assert.doesNotMatch(access.toLowerCase(), new RegExp(escalationSource));
});

test("unauthenticated, demo and non-OWNER sessions fail closed while exact OWNER succeeds", () => {
  assert.match(access, /!session\?\.user\?\.id \|\| session\.isDemo/);
  assert.match(access, /throw new OwnerAccessError\(OWNER_ERROR_CODES\.REQUIRED, 401\)/);
  assert.match(access, /!profile\?\.id \|\| profile\.auth_user_id !== session\.user\.id/);
  assert.match(access, /platformRole\?\.profile_id !== profile\.id \|\| platformRole\.role !== PLATFORM_OWNER_ROLE/);
  assert.match(access, /return Object\.freeze/);
});

test("OWNER API and route are protected server-side", () => {
  assert.match(apiGuards, /export async function requireOwnerApiSession/);
  assert.match(apiGuards, /resolveOwnerSession\(session\)/);
  assert.match(layout, /await requireOwnerSession\(\)/);
  assert.match(layout, /redirect\(error\.status === 401/);
});

test("platform_roles preflight validates canonical columns, PK, and both FKs", () => {
  for (const value of ["'profile_id', 'uuid', 'NO'", "'role', 'text', 'NO'", "'granted_at', 'timestamp with time zone', 'NO'", "'granted_by', 'uuid', 'YES'"]) assert.ok(migration.includes(value));
  assert.match(migration, /contype = 'p'[\s\S]*conkey = array\[profile_attnum\]/);
  assert.match(migration, /confrelid = 'public\.profiles'::regclass[\s\S]*confdeltype = 'c'/);
  assert.match(migration, /confrelid = 'auth\.users'::regclass[\s\S]*confdeltype = 'n'/);
});

test("role check migration recognizes only historical, final, or absent state", () => {
  assert.match(migration, /normalized not in \('checkrole=platform_owner', 'checkrole=owner'\)/);
  assert.match(migration, /item\.conname <> 'platform_roles_role_check'/);
  assert.match(migration, /incompatible platform_roles role check/);
  assert.match(migration, /set role = 'owner' where role = 'platform_owner'/);
  assert.match(migration, /where role is distinct from 'owner'/);
  assert.match(migration, /unknown platform role value/);
});

test("browser and PUBLIC have no platform role privileges", () => {
  assert.match(migration, /revoke all on public\.platform_roles from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on public\.platform_roles to service_role/);
  assert.doesNotMatch(migration, /create policy .*platform_roles/);
});

test("last OWNER deletion and future demotion are serialized while owner-preserving updates pass", () => {
  assert.match(migration, /set search_path = pg_catalog, public/);
  assert.match(migration, /revoke all on function public\.protect_last_platform_owner\(\) from public, anon, authenticated/);
  assert.match(migration, /before delete or update of role/);
  assert.match(migration, /tg_op = 'UPDATE' and new\.role is not distinct from 'owner'/);
  assert.ok(migration.indexOf("lock table public.platform_roles") < migration.indexOf("select count(*)"));
  assert.match(migration, /owner_count <= 1/);
  assert.match(migration, /owner_last_owner_protected/);
});

test("audit columns and same-named indexes are compatible or fail closed", () => {
  assert.match(migration, /incompatible audit_logs\.actor_profile_id/);
  assert.match(migration, /audit_logs\.actor_profile_id FK must reference profiles\(id\) on delete set null/);
  assert.match(migration, /incompatible audit_logs\.correlation_id/);
  assert.match(migration, /c\.relkind, i\.indisvalid, pg_catalog\.pg_get_indexdef/);
  assert.match(migration, /incompatible audit index/);
  assert.match(migration, /create index audit_logs_actor_profile_id_idx/);
  assert.match(migration, /create index audit_logs_correlation_id_idx[\s\S]*where correlation_id is not null/);
});

test("final SQL fixture uses owner and never the retired platform_owner value", () => {
  assert.match(rlsFixture, /platform_roles \(profile_id, role\)[\s\S]*'owner'/);
  assert.doesNotMatch(rlsFixture, /'platform_owner'/);
});

test("bootstrap is explicit, transactional, correlated, and audited without an endpoint", async () => {
  assert.match(bootstrapDocs, /begin;[\s\S]*insert into public\.platform_roles[\s\S]*owner_role_granted[\s\S]*commit;/);
  assert.match(bootstrapDocs, /actor_profile_id[\s\S]*correlation_id/);
  assert.match(bootstrapDocs, /'platform_role'/);
  assert.doesNotMatch(migration, /insert into public\.platform_roles/);
  const apiRoot = new URL("../../app/api/", import.meta.url);
  const entries = await readdir(apiRoot, { recursive: true });
  assert.equal(entries.some((entry) => /owner.*(grant|revoke)|(?:grant|revoke).*owner/i.test(entry)), false);
});
