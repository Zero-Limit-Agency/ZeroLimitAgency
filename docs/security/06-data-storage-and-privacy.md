# 06 — Stockage, Supabase, confidentialité et conservation

## Tables Supabase observées dans les migrations

| Table | Données | RLS dans migration | Politiques dans migrations | Risque |
| --- | --- | ---: | ---: | --- |
| `applications` | demandes, identité, email, date naissance, message | Oui | Non dans migrations principales | Accès via service-role uniquement côté app; vérifier politiques prod |
| `user_roles` | rôle admin/client | Oui | Non | Critique pour autorisation |
| `client_access` | lien user/application, statut | Oui | Non | Base de l'accès client |
| `client_profiles` | profil, avatar, liens, timeline | Oui | Non | Données privées client |
| `newsletter_subscriptions` | email, statut, source | Oui | Non | Données marketing |
| `google_oauth_tokens` | access/refresh tokens Google | Oui | Non | Secrets OAuth en clair |
| `post_call_zero_packets` | chemins documents, statut email | Oui | Non | Documents privés |
| `client_call_reports` | rapports d'appel | Oui | Non | Données privées |
| `client_collaboration_messages` | messages/attachments | Oui | Non | Données privées |
| `global_market_settings`, `global_site_settings`, `dropmap_settings` | config site | Oui | Non | Intégrité du site |

Un fichier `supabase/recommendations/20260429_security_rls_recommendations.sql` propose des politiques RLS, mais n'est pas une migration appliquée automatiquement. Il faut vérifier la base réelle.

## Buckets Supabase observés

- `post-call-zero` : créé public=false.
- `client-collaboration` : créé public=false.
- `site-assets` : référencé dans le code; recommandation indique public uniquement si images trusted admin.

## Données sensibles et flux

| Donnée | Origine | Stockage | Affichage | Tiers |
| --- | --- | --- | --- | --- |
| Identité/date naissance/email | `/api/contact` | `applications`, Auth user metadata | Admin/client selon statut | Resend, Google Drive metadata |
| Mot de passe initial | `/api/contact` | Supabase Auth | Jamais affiché | Supabase Auth |
| Messages demande | `/api/contact` | `applications.message_raw` | Admin | Resend notification interne |
| Fichiers prospect | `/api/contact` | Google Drive | Admin via Drive | Google |
| Newsletter | contact/client API | `newsletter_subscriptions` | Admin | Resend potentiel |
| Avatar | client upload | `client_profiles.avatar_data_url` | Espace client/admin | Aucun tiers direct |
| Collaboration | client/admin | DB + Supabase Storage | Client/admin | Supabase |
| Tokens Google OAuth | admin OAuth | `google_oauth_tokens` | Non affichés normalement | Google/Supabase |

## Confidentialité/conservation

- Aucune durée de rétention automatique n'est observable dans le code.
- Aucune suppression/export de compte client automatisée n'est observable.
- Les pages légales existent, mais leur adéquation juridique avec les traitements réels doit être validée séparément.
- Les logs `console.error` évitent généralement les payloads complets mais peuvent contenir IDs application et erreurs fournisseur.
