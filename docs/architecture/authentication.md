# Authentication et Zero Limit ID

## Architecture retenue

Supabase `auth.users` reste l'identité technique et `profiles.id` est l'identité métier stable. Toute nouvelle logique produit suit **cookie HTTP-only → session Supabase vérifiée → auth user → profile**. Email, `applications` et `client_access` ne sont jamais une autorité Zero Limit ID.

`ensureCurrentProfile()` vérifie la session côté serveur, recherche `profiles.auth_user_id`, puis insère un profil provisoire en transmettant le JWT du seul appelant. La RLS impose `auth_user_id = auth.uid()`. En cas de concurrence sur l'unicité, le helper relit la ligne : l'opération est idempotente et répare un signup dont la création de profil avait échoué.

## Sessions et redirections

Les cookies existants sont réutilisés : HTTP-only, `SameSite=Lax`, `Secure` en production, access token à expiration Supabase et refresh token de 30 jours. Le refresh est vérifié côté serveur. Les tokens ne sont pas écrits manuellement dans localStorage.

| État | Destination |
| --- | --- |
| non authentifié | `/connexion` ou `/inscription` |
| authentifié, profil absent | création idempotente serveur |
| onboarding incomplet | `/identite/onboarding` |
| onboarding terminé | `/identite` |

La zone privée et l'onboarding prennent leur décision dans des Server Components. Le logout tente aussi de révoquer la session Supabase, efface tous les cookies, puis utilise une redirection sûre.

## Sécurité et compatibilité

Les endpoints ont validation serveur, erreurs de login/reset génériques et conservent les protections Supabase. Le rate limiting existant est utilisé, sans prétendre remplacer un limiteur distribué ; Turnstile et une protection distribuée restent à prévoir. Aucun mot de passe/token n'est journalisé. Les événements sensibles futurs à auditer sont les changements d'email, mot de passe et langue, fermeture de compte, liaison provider et actions OWNER.

`/connexion` est désormais l’entrée publique Zero Limit ID. L’ancien portail client est migré par compatibilité : les comptes reliés à `client_access` sont orientés côté serveur vers `/espace-client`, et `/connexion/definir-mot-de-passe` reste réservée aux activations historiques. Voir `public-auth-routes.md`. OAuth, MFA et passkeys restent futurs.

## Diagnostic Preview

Les politiques RLS ne donnent pas, à elles seules, les privilèges SQL. La migration corrective `20260828_zero_limit_id_profile_access.sql` accorde explicitement au rôle `authenticated` le `SELECT` et l'`INSERT` sur `profiles`, tout en conservant les updates au niveau des seules colonnes autorisées. Cela évite de dépendre des default grants variables selon la manière dont le projet Supabase a été initialisé.

Le chargement demande explicitement `onboarding_completed_at` et `onboarding_intent`. Si `20260827_zero_limit_id_onboarding.sql` n'est pas appliquée, PostgREST renvoie une erreur de colonne absente avant même que la page puisse décider de sa redirection. Le serveur journalise alors uniquement une catégorie, un statut, une opération et un correlation ID ; le navigateur ne reçoit aucun message SQL.
