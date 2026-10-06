# Codex agent tooling pilot

This document describes the minimal, token-conscious agent setup for Zero Limit Agency.

## Goal

Use ChatGPT for long-form reasoning and Codex for execution. Keep Codex context small and load specialized skills only when relevant.

## Baseline installed by the bootstrap

Run from PowerShell at the repository root:

```powershell
.\scripts\setup-agent-tooling.ps1 -ApplyECC
```

Optional video/motion skill:

```powershell
.\scripts\setup-agent-tooling.ps1 -ApplyECC -WithVideo
```

The bootstrap installs:

- Playwright CLI globally, plus its Agent Skills layout, for token-efficient browser verification.
- Vercel `web-design-guidelines` and `vercel-react-best-practices` globally for Codex.
- ECC core for Codex only when `-ApplyECC` is provided. The script always runs an ECC dry-run first.
- Remotion best practices only when `-WithVideo` is requested.

## Why the setup is intentionally small

Do not install every interesting agent tool into the default environment.

- `npx skills find <query>` can discover a missing skill on demand.
- QMD currently requires Node.js 22, while this repository pins Node 20 through `.nvmrc`. Configure QMD later in a separate Node 22 tool environment instead of changing the app runtime just for search.
- Strix is security-offensive tooling and should be introduced only for an authorized test target.
- Agent Reach interacts with external platforms/accounts and should be connected only when its research capability is needed.
- Third-party model routers should never receive private repository code, secrets, customer data, or internal strategy by default.

## Task routing

### LIGHT

Use for small local changes.

- Read affected files only.
- Do not load the full design/security documentation.
- Run targeted checks.

### STANDARD

Use for normal features and UI changes.

- Read relevant project docs.
- Implement.
- Run relevant tests and `npm run build`.
- Verify meaningful UI changes in the browser.

### DEEP

Use for architecture, auth, database, security, deployment, or broad refactors.

- Read relevant architecture/security docs.
- Run wider verification.
- Record risks and unresolved decisions.

## Design routing

For UI work:

1. Start with `docs/design/WORKSPACE_VISUAL_FOUNDATION.md`.
2. Search `docs/design/ZERO_LIMIT_AGENCY_DA_MASTER_V2.md` for the relevant section only when more detail is needed.
3. Use existing components before inventing new primitives.
4. Browser-check desktop and mobile for meaningful layout changes.

## Human approval gates

Never perform these automatically:

- production deployment,
- destructive production database actions,
- secret rotation,
- production permission changes,
- irreversible external actions or spending.

Everything else should be made as autonomous, testable, and reversible as practical.
