# 01 — Périmètre et méthodologie

## Périmètre inspecté

- Dépôt local `/workspace/z0agency`.
- Application Next.js App Router sous `app/`.
- Composants React sous `components/`.
- Bibliothèques serveur sous `lib/`.
- Migrations et recommandations Supabase sous `supabase/`.
- Workflows GitHub Actions sous `.github/`.
- Configuration Next.js, npm, lockfile et variables exemples.
- Historique Git accessible localement, par recherche non destructive.

## Hors périmètre

- Production et previews Vercel réelles.
- Variables Vercel réelles et secrets externes.
- Console Supabase, politiques RLS effectivement appliquées, données réelles et buckets réels.
- Console Google Cloud/OAuth/Drive.
- Console Resend.
- Dépôt du bot Discord, absent de ce dépôt.
- Tests destructifs, brute force, transactions réelles, upload vers production, envoi massif d'emails.

## Référentiels utilisés

- OWASP ASVS 5.0 : contrôle d'accès, session, validation, stockage, API.
- OWASP Top 10 Web 2025 : contrôle d'accès, erreurs de configuration, composants vulnérables, intégrité.
- OWASP API Security Top 10 2023 : BOLA, auth cassée, exposition excessive, absence de rate limit.
- CWE : CWE-200, CWE-287, CWE-352, CWE-400, CWE-522, CWE-601, CWE-693, CWE-922.
- Bonnes pratiques Next.js App Router, Supabase, Vercel, OAuth Google et Resend.

## Méthode

1. Inventaire du dépôt, des routes et des dépendances.
2. Inspection statique des frontières serveur/client, routes API, pages, lib serveur, migrations.
3. Recherche de motifs dangereux et de secrets sans afficher de valeurs complètes.
4. Exécution de commandes non destructives : build, audit npm, outdated, vérification Git.
5. Classification des risques avec preuve issue du code et priorisation.

## Commandes principales

Voir `12-testing-limitations.md` pour le détail et les sorties synthétiques.
