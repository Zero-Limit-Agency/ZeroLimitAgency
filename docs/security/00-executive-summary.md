# 00 — Résumé exécutif de l'audit sécurité

Date de l'audit : 2026-07-03.

## Verdict global

Le dépôt présente une base applicative sérieuse : Next.js App Router, routes sensibles majoritairement protégées côté serveur, cookies HttpOnly, validations de fichiers, RLS activée dans les migrations Supabase, et workflows CI existants. Le niveau de risque global reste néanmoins **Élevé avant correction**, principalement à cause de l'exposition de surfaces de diagnostic en production, d'un modèle d'autorisation très dépendant de la service-role Supabase côté serveur, d'un stockage OAuth Google non chiffré dans la base, d'une absence de headers navigateur/CSP explicites et de limites anti-abus non distribuées.

Aucune correction applicative n'a été réalisée pendant cette phase. Seule cette documentation d'audit a été ajoutée.

## Comptage des findings

| Gravité | Nombre |
| --- | ---: |
| Critique | 0 |
| Élevée | 4 |
| Moyenne | 8 |
| Faible | 5 |
| Information | 4 |

## Risques majeurs

1. **Surface de diagnostic Supabase accessible hors production** : la route `/api/supabase/test` interroge des informations sensibles côté admin dès que `NODE_ENV !== production`; une preview ou un environnement mal configuré peut exposer des détails projet et des checks d'administration.
2. **Tokens OAuth Google stockés en clair** : la table `google_oauth_tokens` contient `access_token` et `refresh_token` sans chiffrement applicatif observable.
3. **Headers de sécurité absents** : pas de CSP, frame-ancestors, HSTS, Referrer-Policy ou Permissions-Policy configurés dans `next.config.mjs`.
4. **Rate limiting mémoire et contournable** : les limites utilisent un `Map` local par instance et des headers IP facilement spoofables en environnement non maîtrisé.
5. **Service-role Supabase très centralisée** : les API serveur utilisent largement la clé service-role ; une erreur de garde sur une route future contournerait entièrement la RLS.

## Actifs les plus exposés

- Données personnelles des demandes (`applications`) : identité, email, date de naissance, message brut, statut.
- Comptes clients Supabase Auth et cookies de session.
- Tokens Google Drive OAuth et dossiers/fichiers Drive de prospects.
- Documents post-call Zero et pièces jointes de collaboration.
- Données d'administration : statuts, contenus site, maintenance, DropMap, Learn YouTube.

## Risques bloquant une mise en production ou une extension sensible

- Corriger ou restreindre les endpoints de diagnostic avant toute preview publique.
- Chiffrer/segmenter les tokens OAuth avant d'étendre Google/YouTube.
- Ajouter des headers sécurité et une stratégie CSP compatible Next.js.
- Remplacer le rate limit mémoire par un mécanisme distribué et fiable.
- Compléter les tests d'autorisation pour `/admin`, `/api/admin`, `/espace-client` et `/api/client`.

## Limites principales

L'audit est statique et local. La configuration Vercel réelle, les variables de production, les politiques Supabase effectivement appliquées, les buckets, Google Cloud, Resend, analytics externes et la production n'ont pas été testés dynamiquement.
