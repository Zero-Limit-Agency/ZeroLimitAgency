# Authentication et Zero Limit ID

## Architecture retenue

Supabase `auth.users` reste l'identité technique et `profiles.id` est l'identité métier stable. Toute nouvelle logique produit suit **cookie HTTP-only → session Supabase vérifiée → auth user → profile**. Email, `applications` et `client_access` ne sont jamais une autorité Zero Limit ID.

`ensureCurrentProfile()` vérifie la session côté serveur, recherche `profiles.auth_user_id`, puis insère un profil provisoire en transmettant le JWT du seul appelant. La RLS impose `auth_user_id = auth.uid()`. En cas de concurrence sur l'unicité, le helper relit la ligne : l'opération est idempotente et répare un signup dont la création de profil avait échoué.

## Sessions et redirections

Les cookies existants sont réutilisés : HTTP-only, `SameSite=Lax`, `Secure` en production, access token à expiration Supabase et refresh token de 30 jours. Le refresh est vérifié côté serveur. Les tokens ne sont pas écrits manuellement dans localStorage.

| État | Destination |
| --- | --- |
| non authentifié | `/identite/connexion` ou inscription |
| authentifié, profil absent | création idempotente serveur |
| onboarding incomplet | `/identite/onboarding` |
| onboarding terminé | `/identite` |

La zone privée et l'onboarding prennent leur décision dans des Server Components. Le logout tente aussi de révoquer la session Supabase, efface tous les cookies, puis utilise une redirection sûre.

## Sécurité et compatibilité

Les endpoints ont validation serveur, erreurs de login/reset génériques et conservent les protections Supabase. Le rate limiting existant est utilisé, sans prétendre remplacer un limiteur distribué ; Turnstile et une protection distribuée restent à prévoir. Aucun mot de passe/token n'est journalisé. Les événements sensibles futurs à auditer sont les changements d'email, mot de passe et langue, fermeture de compte, liaison provider et actions OWNER.

La route historique `/connexion`, l'admin, `applications`, `client_access`, l'activation client et leur démonstration restent en place. Le nouveau parcours est isolé sous `/identite`; il ne dépend pas de ces tables. OAuth, MFA et passkeys restent futurs.
