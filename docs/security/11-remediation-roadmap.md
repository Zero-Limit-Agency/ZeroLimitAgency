# 11 — Plan de correction futur

## P0 — Immédiat si previews/staging utilisent des données ou secrets réels

1. Supprimer/restreindre `/api/supabase/test` et tout endpoint diagnostic.
2. Auditer Vercel : secrets par environnement, protection previews, domaines OAuth autorisés.
3. Rotation des tokens Google si exposition DB possible; chiffrement avant nouvel usage.
4. Vérifier Supabase réel : policies RLS, buckets privés/publics, service-role jamais client.

Tests nécessaires : admin/client/anonyme sur endpoints diagnostics; test preview; vérification absence d'information sensible.

## P1 — Avant nouvelles fonctionnalités sensibles

1. Chiffrement des tokens OAuth Google et réduction scope Drive.
2. Rate limiting distribué sur contact/auth/uploads/IA/email.
3. Headers sécurité Next/Vercel : CSP progressive, frame-ancestors, HSTS, Referrer, Permissions.
4. Versionner les policies RLS en migrations et écrire tests RLS.
5. Durcir uploads ZIP et fichiers sensibles : antivirus/quarantaine/quota.
6. Tests d'autorisation IDOR/BOLA sur toutes routes client/admin.

Tests nécessaires : E2E rôles, appels directs API, upload types, quotas, headers.

## P2 — Durcissement structurant

1. CSRF/Origin checks pour POST/PATCH/DELETE sensibles.
2. Journal d'audit admin et alertes sur actions critiques.
3. Validation centralisée des URLs externes administrables.
4. Ne plus retourner `applicationId` brut au formulaire public.
5. Ajouter tests sécurité automatisés dans CI.
6. Planifier upgrade Next.js/dépendances.

Tests nécessaires : formulaires admin/client, logout, OAuth, rendu liens externes, CI complète.

## P3 — Maturité long terme

1. Pin SHA GitHub Actions et permissions minimales.
2. Documentation Vercel/Supabase/Google/Resend avec runbooks incident.
3. Threat modeling continu pour paiements, YouTube, Discord, IA.
4. Pentest externe avant lancement formation/espace paiement.
5. Exercices de rotation secrets et révocation OAuth.


## Phase complète 2026-07-03

- Vague A : RLS exécutable, audit logs, entitlement foundation, middleware no-store/same-origin.
- Vague B : URL sanitizer commun, tests de politiques, exigences uploads/XSS/SSRF documentées.
- Vague C : checklists Vercel/Supabase/Google, vérification npm limitée par registre 403.
- Vague D : exigences formations, outils payants, YouTube et IA documentées avant développement produit.

Les éléments dépendant des consoles externes restent marqués `Requires production verification` plutôt que `Fixed`.
