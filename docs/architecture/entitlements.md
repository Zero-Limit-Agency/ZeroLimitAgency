# Entitlements Zero Limit

## Audit et décision

`public.entitlements` (migration `20260703_security_policies_and_entitlements.sql`) est un registre historique attaché à `auth.users`, avec `product_key`, paiement et politiques administrateur. Il accompagne le domaine historique `applications/client_access`. Il ne représente ni un profil Zero Limit ID, ni un Space, ni une Organization et n'est donc ni réutilisé ni modifié.

La migration `20260920_space_provisioning_entitlements.sql` ajoute `public.zero_limit_entitlements`. Chaque ligne porte `key`, `source`, `status`, `starts_at`, `expires_at`, `metadata` et **exactement un** scope parmi `profile_id`, `space_id`, `organization_id` (`num_nonnulls(...) = 1`). Les sources prévues sont `subscription`, `purchase`, `manual`, `promotion`, `migration`, `system`; les statuts sont `active`, `suspended`, `revoked`. Une ligne `active` n'accorde rien avant `starts_at` ni à partir de `expires_at`.

Pour cette phase, `personal_access` et `creator_access` sont scopés au Space; `team_access` est scopé à l'Organization. L'accès Personal exige ownership + `personal_access` actif, Creator exige ownership + `creator_access` actif, et Team exige membership + `team_access` actif sur l'Organization. Le Space Switcher et `requireSpaceAccess` utilisent la même liste filtrée. `hasEntitlement` et `requireEntitlement` résolvent les trois scopes côté serveur. Les contraintes et index uniques sont la dernière défense; RLS ne permet que la lecture des droits accessibles, jamais leur écriture navigateur. Le grant SELECT est limité aux colonnes de résolution et exclut `metadata`. Cette colonne est backend-only et ne doit jamais contenir de secret, token, payload Stripe brut, donnée de paiement ou donnée OWNER sensible.

## Billing futur et révocation

Le provisioning Preview/dev attribue explicitement `source=system`; ce n'est ni un abonnement ni un paiement. À terme: Checkout/Subscription → webhook Stripe signé → validation → entitlement `source=subscription` → même service de provisioning/activation. La résiliation devra suspendre/révoquer le droit selon la politique de conservation, sans confondre suppression du contexte et capacité produit.
