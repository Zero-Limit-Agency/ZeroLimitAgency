# 07 — Intégrations, webhooks, paiements, OAuth et IA

## Stripe/paiements

Aucune dépendance Stripe, webhook Stripe, création Checkout ou page paiement n'a été observée dans le dépôt actuel. Les risques paiement sont donc **hors périmètre actuel**, à traiter avant toute future intégration.

## Google OAuth / Drive

- OAuth Google Drive admin avec `state` cookie HttpOnly.
- Scope observé : `https://www.googleapis.com/auth/drive` très large.
- `access_token` et `refresh_token` stockés en base Supabase via service-role.
- Pas de chiffrement applicatif visible.
- Pas de PKCE observé; pour une app web confidentielle avec client secret, ce n'est pas toujours obligatoire, mais recommandé pour durcissement.
- Les dossiers Drive sont créés sous un root folder configuré; les noms incluent date, identité partielle, pseudo/email local-part et court ID.

## Discord

- Variables publiques Discord et pages légales/support observées.
- Aucun bot Discord ni OAuth Discord côté serveur dans ce dépôt.
- Le dépôt bot doit rester hors périmètre et audité séparément.

## YouTube

- Pages et settings Learn YouTube observés.
- Pas d'OAuth YouTube ni appels API YouTube réels observés.
- Toute future connexion YouTube doit ajouter state, PKCE, scopes minimaux, chiffrement refresh tokens et tests d'association de chaîne.

## Email/Resend

- Resend est utilisé pour notifications internes et confirmations.
- Risques : coût/spam via `/api/contact`, fuite de données dans contenu email, réputation d'envoi.
- Les clés Resend ne sont pas exposées dans `.env.example`.

## IA/OpenAI

- Package `openai` présent et route admin `call-assistant` observée.
- À vérifier avant production : données envoyées au modèle, prompts, logs, limites de coût, rendu de sortie, validation JSON, prompt injection.
- Les findings incluent un point d'attention car l'intégration IA est une surface coûteuse et sensible.

## Webhooks

Aucun webhook entrant Stripe/Discord/Google/YouTube n'a été observé. Toute future route webhook devra vérifier signature, timestamp, anti-rejeu, idempotence et taille de payload.
