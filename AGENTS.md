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

## Security

- Never commit secrets.
- Never expose Supabase service role keys to client code.
- Keep service-role access server-side only.
- Keep `.env.local` and real environment files out of git.
- Use Vercel environment variables for production secrets.

## Before finishing changes

- Run `npm run build`.
- Check that GitHub Actions workflows remain valid.
- Keep changes scoped and compatible with GitHub -> Vercel deployment.
