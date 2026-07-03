# 04 — Authentification et contrôle d'accès

## Authentification observée

- Auth Supabase via appels REST `/auth/v1/token`, `/auth/v1/user`, refresh token.
- Cookies `zla_client_access_token`, `zla_client_refresh_token`, `zla_client_demo` : HttpOnly, SameSite=Lax, Secure en production.
- Rôle utilisateur lu depuis table `user_roles` via service-role.
- Démo client codée dans `lib/auth/demo-client.js` et forcée au rôle client.

## Points positifs

- Cookies HttpOnly et Secure en production.
- Vérification serveur sur `/admin` et sur les API admin via `requireAdminApiSession`.
- API client sensibles comparent l'`applicationId` demandé avec l'accès actif de l'utilisateur.
- Identifiants UUID validés par regex sur de nombreuses routes dynamiques.
- Redirection OAuth `next` limitée à `/admin` côté start.

## Points de vigilance

- Pas de protection CSRF explicite sur les actions mutantes utilisant cookies SameSite=Lax; le risque est réduit mais pas nul selon méthodes, sous-domaines et futures intégrations.
- Pas de séparation de rôles admin fine : `admin` semble tout-puissant.
- Pas de journal d'audit admin observable pour changements de statut, rôles, envoi manuel, OAuth ou uploads.
- Les sessions après retrait de rôle dépendent de la relecture de rôle à chaque requête, mais aucune révocation globale Supabase n'est visible.
- Les endpoints OAuth callback exigent encore une session admin; cela peut casser certains flows OAuth si le cookie session admin expire, mais réduit l'attaque cross-user.

## Matrice d'autorisation synthétique

| Ressource | Anonyme | Client propriétaire | Autre client | Formateur | Admin |
| --- | ---: | ---: | ---: | ---: | ---: |
| Site public/pages légales | Lecture | Lecture | Lecture | n/a | Lecture/édition contenu via admin |
| Formulaire contact | Création demande | Création demande | Création demande | n/a | Lecture/traitement |
| Demande `applications` | Création limitée | Lecture via espace si approuvée | Non | n/a | Lecture/écriture |
| Profil client | Non | Lecture/édition avatar | Non | n/a | Lecture/écriture |
| Collaboration messages | Non | Lecture/écriture si propriétaire et type compatible | Non | n/a | Lecture/écriture |
| Pièces jointes collaboration | Non | Téléchargement si propriétaire | Non | n/a | Téléchargement |
| Documents post-call | Non | Téléchargement si propriétaire | Non | n/a | Upload/envoi/téléchargement |
| Paramètres site/market/maintenance | Non | Non | Non | n/a | Écriture |
| Tokens Google OAuth | Non | Non | Non | n/a | Création/rotation via OAuth admin |
| User roles | Non | Non | Non | n/a | Lecture via service-role; modification directe non exposée observée |

## Tests de non-régression recommandés

- Accès `/admin` anonyme/client/admin.
- Appels directs `/api/admin/**` anonyme/client/admin.
- Accès `/espace-client/[applicationId]` propriétaire vs autre client.
- Téléchargement attachments/documents avec `applicationId` modifié.
- Révocation `client_access.status` et changement `user_roles.role` pendant session active.
