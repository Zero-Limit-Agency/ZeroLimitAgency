# Onboarding Zero Limit ID

## Modèle

La migration additive `20260827_zero_limit_id_onboarding.sql` ajoute `onboarding_completed_at` (état explicite) et `onboarding_intent` (`personal`, `creator`, `team`). Elle ne doit être appliquée que via le processus de migration de l'environnement, jamais directement depuis cette branche.

Le profil provisoire permet la reprise après incident. L'onboarding valide ensuite côté serveur un username normalisé en minuscules (3–32, `[a-z0-9_.-]`, premier caractère alphanumérique), un display name de 1–80 caractères et une locale `fr`/`en`. Les chaînes essentielles sont centralisables dans `lib/i18n/identity.js`, avec fallback français explicite.

L'intention ne crée ni workspace, organisation, permission, entitlement ou abonnement. Pour Personal, la profession n'est volontairement pas collectée/persistée : `spaces.personal_profession` est sa future place canonique lors d'une création de space confirmée. Creator ne crée aucun portfolio. Team ne crée aucune organisation et sera orienté vers un futur choix créer/rejoindre.

## Test Vercel Preview

Pré-requis : variables Supabase Preview, migration appliquée sur la base Preview, URL Preview autorisée dans les Redirect URLs Supabase et template email configuré pour conserver le redirect demandé.

1. Ouvrir `/inscription`, saisir email, mot de passe/confirmation et accepter les documents.
2. Si la confirmation email est active, ouvrir l'email : `/confirmation` établit les cookies. Sinon la session immédiate redirige directement.
3. Compléter identité, langue et orientation ; vérifier l'arrivée sur `/identite`.
4. Vérifier les valeurs affichées et l'absence de workspace/abonnement créé.
5. Se déconnecter, puis vérifier que `/identite` renvoie vers la connexion.
6. Se reconnecter sur `/connexion` et vérifier l'accès direct à la zone privée.
7. Tester « mot de passe oublié », puis le lien et le nouveau mot de passe.

Le parcours ne peut pas être validé réellement sur une Preview sans base Supabase migrée et Redirect URL autorisée. Les tests Node couvrent les invariants applicatifs ; les politiques DB/RLS restent couvertes séparément par `supabase/tests/zero_limit_id_rls.sql`.
