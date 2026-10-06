# Zero Limit Agency - Agent Guide

This repository contains the Zero Limit Agency website and web app.

## Scope

- Work only on the website/app repository.
- Do not add Discord bot code here.
- Keep the Discord bot in its separate repository.

## Cloud-first workflow

- Treat GitHub as the source of truth.
- Use dedicated branches for changes.
- Open pull requests for review.
- Do not push directly to `main` unless explicitly requested.
- Keep Vercel compatibility for deployment.
- Keep local development working, but do not rely on a local machine being online.

## Runtime

- Node.js 20 is the target runtime.
- Next.js App Router is the application framework.
- Use `npm ci` in CI and cloud environments.
- Use `npm run build` as the required build verification.

## Context and token discipline

- Start with the smallest useful context. Do not read large documentation trees by default.
- Search for the relevant file/section first, then read only what is needed.
- For UI or visual work, read `docs/design/WORKSPACE_VISUAL_FOUNDATION.md` first. Consult `docs/design/ZERO_LIMIT_AGENCY_DA_MASTER_V2.md` only when deeper design-system detail is necessary.
- For security-sensitive work, start with the relevant file in `docs/security/`; do not load the entire security audit unless the task requires it.
- For implementation patterns, inspect the nearest existing component/module before inventing a new abstraction.
- Reuse installed tools/skills when relevant, but do not invoke every available tool for every task.

## Task depth

Choose the lightest workflow that can safely finish the task:

- LIGHT: small, local change. Inspect only affected files; run the narrowest relevant verification.
- STANDARD: normal feature or UI change. Inspect related docs/components, implement, run tests/build as relevant, and visually verify user-facing changes.
- DEEP: architecture, auth, database, security, deployment, or broad refactor. Read the relevant architecture/security docs, run wider verification, and document material risks.

Escalate from LIGHT to STANDARD or DEEP only when the task actually needs it.

## UI and browser verification

- For meaningful user-facing changes, verify the rendered result in a browser when browser/computer-use tooling is available.
- Check at least one desktop and one mobile viewport for layout-sensitive changes.
- Inspect console/runtime errors when relevant.
- Prefer targeted visual checks over crawling the whole site after every small change.
- Follow the Zero Limit design docs; do not replace the project aesthetic with generic SaaS styling.

## Security

- Never commit secrets.
- Never expose Supabase service role keys to client code.
- Keep service-role access server-side only.
- Keep `.env.local` and real environment files out of git.
- Use Vercel environment variables for production secrets.
- Treat auth, permissions, payments, database migrations, RLS, webhooks, and external writes as security-sensitive work.
- Never delete production data, rotate secrets, change production permissions, or deploy to production without explicit user approval.

## Dependency and tool changes

- Do not add a dependency, MCP, plugin, or external service when the existing stack can reasonably solve the task.
- If a new dependency/tool is justified, explain its purpose in the change summary.
- Prefer project-local, reproducible configuration over machine-specific setup.
- Do not send private code, secrets, or internal strategy to untrusted third-party model routers/services.

## Before finishing changes

- Run the narrowest relevant tests during implementation.
- Run `npm run test` when the change can affect tested security behavior.
- Run `npm run build` before declaring a code change complete.
- Check that GitHub Actions workflows remain valid.
- For meaningful UI changes, perform a browser/visual verification when available.
- Keep changes scoped and compatible with GitHub -> Vercel deployment.
- Summarize: what changed, what was verified, what was not verified, and any user decision still required.
