# Zero Limit Agency — 20-day launch plan

Target: ship a stable public product in 20 days without reopening broad redesign or security scopes.

## Ground rules

- GitHub `main` is the source of truth.
- One scoped branch/PR per launch concern.
- No direct production DB mutation to close a code-only PR.
- No new large feature unless it is required for launch.
- Every merge must preserve auth/access-control behavior and pass the repository test/build gates.
- Visual work follows `docs/design/ZERO_LIMIT_AGENCY_DA_MASTER_V2.md`.

## P0 — first 48 hours

### 1. Reconcile the security review with GitHub
The security review supplied on 2026-09-29 references commit `e596c59` and files:
- `docs/security/17-full-security-review-2026-09-29.md`
- `docs/security/18-pre-merge-validation-2026-09-29.md`
- `scripts/security/verify-supabase-security.sql`
- session/contact/CSRF changes and related tests.

At the time this plan was written, the connected GitHub repository does not expose commit `e596c59`, and current `main` is `ef1611387d40b3043f0c600eb1fa226288e260be`.

**Gate:** locate/push the reviewed security branch before treating those fixes as part of the repository. Do not recreate security-sensitive changes from the prose summary alone.

### 2. Ship the icon/metadata integration
Branch: `launch/master-icon-system`.

Included:
- root metadata icon declarations;
- PWA manifest;
- official vector favicon;
- Safari pinned-tab mask.

Remaining before merge:
- add the approved PNG/ICO assets from the generated master icon pack;
- run `npm test`, `npm run build`, and `git diff --check`;
- preview-check Chrome, Safari desktop, iOS Add to Home Screen and Android maskable crop.

### 3. Freeze launch scope
Must ship:
- public homepage and legal pages;
- canonical public auth;
- private workspace shell and core account/organization flows;
- required contact/application flows;
- production-safe configuration.

Can slip after launch:
- experimental sub-products;
- broad redesigns outside DA V2;
- nonessential analytics/tooling;
- product expansions not needed by the core launch path.

## Days 3–7 — core product QA

- Homepage: desktop/mobile/tablet visual pass.
- Auth: login, logout, passwordless/recovery, session import, redirect behavior.
- Workspace: space switcher, navigation, role/permission boundaries, empty/error/loading states.
- Forms/APIs: CSRF/origin validation, validation errors, success/failure UX.
- Legal/privacy/refund pages: links, copy completeness, footer discoverability.
- SEO: title/description, canonical behavior, sitemap/robots, social previews.
- Accessibility smoke pass: keyboard focus, labels, contrast, reduced-motion behavior.

## Days 8–12 — pre-production security and infrastructure

- Create a separate Supabase staging project.
- Run the read-only runtime security verification against staging.
- Validate passwordless/recovery expiration, single-use and resend behavior in staging.
- Re-run dependency vulnerability checks from a network that can reach the advisory endpoint.
- Validate distributed rate limiting is fail-closed where required.
- Validate upload scanning path.
- Review production secrets and redirect allowlists.
- Validate AAL2 gate before sensitive OWNER mutations.
- Decide and document legacy Google OAuth isolation/removal.

## Days 13–16 — release candidate

- Create release-candidate branch/tag.
- Full test + production build.
- Manual browser/device matrix.
- Validate email deliverability and templates.
- Validate analytics only if retained for launch.
- Verify no demo/test data leaks into production paths.
- Verify maintenance mode and rollback path.

## Days 17–19 — content and operational readiness

- Final public copy and bilingual readiness for launch-critical pages.
- Verify support/contact inbox flow.
- Verify social redirects.
- Prepare launch communications and links.
- Prepare incident/rollback owner and checklist.
- Freeze noncritical code 24 hours before launch.

## Day 20 — launch

- Final release-candidate checks.
- Production deployment.
- Smoke-test public pages, auth, workspace, forms and critical owner/admin paths.
- Monitor deployment/runtime errors.
- Do not introduce feature work on launch day unless it fixes a launch blocker.

## Current known residual gates

- Supabase runtime drift: NOT VERIFIED until staging exists.
- Dependency vulnerability status: NOT VERIFIED until advisory access succeeds.
- Legacy SECURITY DEFINER search_path hardening: deferred pre-production defense-in-depth.
- Passwordless/recovery runtime behavior: needs safe-environment verification.
- Distributed rate limiting, upload scan, OAuth isolation, deploy secrets/redirects and AAL2: pre-production gates.
