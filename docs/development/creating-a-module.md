# Creating a module

## Exact integration sequence

1. Choose a stable lowercase snake-case key. Never use a translated label or generated ID.
2. Create a module-owned directory/data layer; keep its internals out of Workspace Core.
3. Add one validated manifest to the central array in `lib/workspace/module-registry.js`, including compatibility, canonical route, i18n label, reviewed icon, navigation section/priority, release status, activation default, entitlements only when commercially required, and the minimum core capability.
4. Create `/espace/[spaceId]/modules/<key>` and call `requireModuleAccess(params.spaceId, "<key>")` before reading data or rendering. Convert authentication/access errors consistently; never trust URL, payload, local storage, Discord, AI, or navigation visibility.
5. Implement backend authorization and RLS for every module record. Scope records by `space_id`; Team-shared records may also carry `organization_id` when ownership/query requirements justify it. Verify the authenticated profile can access that scope. Do not use a bucket per module by default.
6. Store files under a non-guessable path such as `spaces/<space-id>/<module-key>/<record-id>/<uuid>-<safe-name>` (or `organizations/<organization-id>/...` for genuinely organization-owned data). Keep buckets private and authorize upload, read, and delete server-side/RLS.
7. Add translations and let `PrivateShell` receive resolver-produced navigation. Do not manually import the module into the shell.
8. Add pure compatibility/activation/capability tests, server guard tests, RLS SQL tests, and cross-space denial tests. Fixtures stay in tests.
9. Document data ownership, settings schema, lifecycle/retention, domain events, observability and rollback.
10. Run `npm test`, `npm run build`, and `git diff --check`.

## Feature completion contract

A module is release-complete only with: a manifest; explicit permissions; authenticated backend; RLS/authz; accessible UI; i18n; tests; developer/product documentation; error/usage observability without secrets; activation and data lifecycle behavior; and verified route/navigation integration. Future billing may supply entitlements, but the module must remain independently guarded. Future Discord and AI consumers call authenticated services and consume purpose-built domain events; neither receives implicit trust. Desktop uses the same service contracts rather than copying React logic.
