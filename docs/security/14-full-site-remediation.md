# 14 — Full-site security remediation

Date : 2026-07-03.

## Verdict

Risque avant audit/corrections : **Élevé**. Risque après les corrections réalisables dans le dépôt : **Moyen**, avec des points restant explicitement en vérification externe : Vercel, Supabase réelle, Google Cloud/OAuth, Redis distribué et migration des anciens tokens OAuth.

## Findings et statuts

| Finding | Ancien statut | Nouveau statut | Preuve | Risque résiduel |
| --- | --- | --- | --- | --- |
| SEC-001 | Fixed phase 1 | Fixed in code — Requires production verification | Route supprimée, test d'absence, build sans route | Ancien déploiement Vercel à invalider |
| SEC-002 | Partially fixed | Partially fixed — Requires data migration | AES-GCM serveur + migration chiffrée | Anciens tokens plaintext jusqu'à migration/reconnexion |
| SEC-003 | Mitigated | Mitigated — Requires browser verification | Headers globaux + tests CSP | `unsafe-inline` à durcir par nonce/hash plus tard |
| SEC-004 | Partially fixed | Partially fixed — Requires Redis in Vercel | Provider Redis + tests 429 | Fallback local non distribué |
| SEC-005 | Open | Mitigated | Inventaire service-role, helpers d'entitlement, RLS exécutable | Service-role encore nécessaire côté serveur admin/système |
| SEC-006 | Open | Mitigated — Requires Supabase verification | Migration RLS exécutable + script de vérification | État réel Supabase non vérifié dans cette session |
| SEC-007 | Open | Documented — Requires Google validation | Scope actuel documenté; réduction non appliquée pour ne pas casser Drive | Scope Drive large tant que modèle Drive non revu |
| SEC-008 | Open | Mitigated | Middleware same-origin sur mutations API | CSRF token dédié possible en durcissement futur |
| SEC-009 | Open | Mitigated | Table `audit_logs` + helper + premiers événements admin | Couverture complète audit log à étendre |
| SEC-010 | Open | Mitigated | Validateur URL commun appliqué aux URLs support/ressources client | Revue UI liens externes à poursuivre |
| SEC-011 | Open | Open | Non corrigé pour éviter changement produit/API | `applicationId` public à traiter séparément si UI dépendante |
| SEC-012 | Open | Partially mitigated | Uploads déjà signés/validés; exigences documentées | Antivirus/quarantaine ZIP externe non implémenté |
| SEC-013 | Open | Open | Documenté | Avatar base64 à migrer ultérieurement vers Storage |
| SEC-014 | Open | Open | Documenté checklist CI/CD | Pin SHA actions non appliqué pour éviter maintenance lourde immédiate |
| SEC-015 | Open | Open | Documenté checklist CI/CD | Permissions CI à durcir dans workflow dédié |
| SEC-016 | Open | Requires registry verification | `npm audit/outdated` relancés mais 403 | Registre npm inaccessible ici |
| SEC-017 | Open | Mitigated | Tests sécurité ajoutés/étendus | E2E réels rôles/Supabase à ajouter avec environnement test |
| SEC-018 | Open | Requires console verification | Checklist Vercel créée | État Vercel réel hors dépôt |
| SEC-019 | Informational | Documented | Exigences paiement/entitlements documentées | Paiement absent; à appliquer avant Stripe |
| SEC-020 | Informational | Out of scope | Bot Discord absent | Audit dépôt bot séparé requis |
| SEC-021 | Informational | Requires external verification | Checklists production/Supabase/Google | Consoles externes non accessibles |

## Contrôles d'accès et IDOR/BOLA

Routes dynamiques client/admin auditées : `/api/client/collaboration/[applicationId]`, attachments, post-call files, newsletter, avatar, `/espace-client/[applicationId]`, `/api/admin/applications/[applicationId]` et sous-routes. Les routes client vérifient l'accès actif via `getAuthorizedClientAccess` avant lecture/téléchargement. Les routes admin continuent d'utiliser `requireAdminApiSession`.

Ajouts :

- middleware same-origin pour mutations API ;
- cache `private, no-store` sur APIs auth/client/admin ;
- validateur URL commun ;
- fondation `requireEntitlement` côté serveur pour futurs contenus payants ;
- migration RLS executable pour owner/admin select sur ressources sensibles.

Limite : les tests ajoutés sont statiques/unitaires dans ce dépôt. Les tests E2E avec vrais comptes propriétaire/autre client/admin nécessitent un environnement Supabase de test.

## Supabase et service-role

La service-role reste utilisée pour les opérations serveur système/admin, mais le risque est réduit par :

- garde admin/client avant les accès ;
- policies RLS versionnées en migration ;
- script SQL de vérification ;
- table `audit_logs` ;
- table `entitlements` pour futurs accès premium.

## APIs, entrées et contenus

- CSRF/same-origin : middleware global sur mutations `/api/*`.
- URLs : `sanitizeExternalUrl` et `sanitizeInternalPath` bloquent `javascript:`, protocol-relative et credentials.
- Uploads : les contrôles existants extension/MIME/signature restent en place; antivirus/quarantaine ZIP reste externe.
- Logs : les nouveaux audit logs filtrent clés/tokens/password/cookies dans les métadonnées.
- Cache : APIs privées reçoivent `Cache-Control: private, no-store`.

## Migrations ajoutées dans cette phase

1. `20260703_google_oauth_token_encryption.sql` — colonnes chiffrées OAuth.
2. `20260703_security_policies_and_entitlements.sql` — RLS policies, audit logs, entitlements.

## Tests ajoutés/étendus

- OAuth token encryption.
- Rate limiting.
- Headers/diagnostics.
- URL sanitizer, middleware, RLS migration, verification SQL.

## Risques nécessitant une validation externe

- Configuration Vercel Production/Preview.
- Application effective des migrations Supabase.
- État réel des policies/buckets Storage.
- Migration progressive des anciens tokens OAuth.
- Configuration Redis/Upstash et fail-closed.
- Google OAuth scopes et révocation.
