# Routes publiques d’authentification — audit et migration

## Source visuelle

Les écrans publics Auth suivent exclusivement `docs/design/ZERO_LIMIT_AGENCY_DA_MASTER_V2.md` : Playfair Display 600/700 pour l’éditorial, Manrope 400/500/700/800 pour l’interface, fond continu warm-black/bordeaux, surface chaude, ivoire, lumière rose et micro-accent or.

## Audit avant migration

Deux parcours partageaient Supabase Auth et les mêmes cookies HTTP-only, mais présentaient deux interfaces :

- `/identite/*` était le parcours **Zero Limit ID** (création de Profile, onboarding, Spaces, invitations Team) via `/api/id/*` ;
- `/connexion` était l’interface historique **client/application** via `/api/auth/login`, `applications` et `client_access`. Elle orientait aussi les anciens administrateurs vers `/admin` et comportait un bypass visuel de maintenance `admin_access=1` ;
- `/connexion/definir-mot-de-passe` reste le point d’arrivée critique des invitations/activations client et des anciens emails de récupération. `lib/auth/client-activation.js`, `/api/auth/forgot-password` et les modèles Supabase documentés le ciblent encore ;
- les emails Zero Limit ID ciblaient `/identite/confirmation` et `/identite/nouveau-mot-de-passe` via le resolver d’origine de déploiement sécurisé ;
- les pages privées, invitations Team, OWNER et espaces renvoyaient vers `/identite/connexion` ;
- les entrées publiques marketing utilisaient déjà majoritairement `/connexion`, donc elles ouvraient l’ancien écran client au lieu du Zero Limit ID.

## Décision compatible

`/connexion` devient la page canonique Zero Limit ID. Le formulaire utilise toujours l’API serveur, les cookies HTTP-only et le rate limiting existants. Après authentification, `/api/id/login` détecte côté serveur un `client_access` historique valide et conserve sa destination `/espace-client`; sinon le parcours Zero Limit ID continue vers `/identite`. Une invitation `next` validée reste prioritaire.

La route enfant `/connexion/definir-mot-de-passe` et les endpoints `/api/auth/*` sont conservés sans changement de trust boundary pour les emails déjà envoyés et l’activation client. Leur retrait exige une migration séparée des modèles d’email et des comptes historiques.

## Routes canoniques et compatibilité

| Canonique | Ancienne route redirigée |
| --- | --- |
| `/connexion` | `/identite/connexion` |
| `/inscription` | `/identite/inscription` |
| `/mot-de-passe-oublie` | `/identite/mot-de-passe-oublie` |
| `/nouveau-mot-de-passe` | `/identite/nouveau-mot-de-passe` |
| `/confirmation` | `/identite/confirmation` |

Les redirects sont construits par `lib/auth/public-routes.js`. Ils ne conservent que `invitation`, `token`, `code`, `state`, les états d’erreur de confirmation et un `next` interne explicitement validé. Une URL absolue, protocol-relative ou encodée comme destination est rejetée. Les callbacks email sont construits par `buildAuthRedirectUrl`, qui choisit les origines Vercel Preview/configurées et ne fait pas confiance à un Host arbitraire.

## Maintenance et privilèges

Les routes canoniques de finalisation ne sont pas interceptées par un bypass global de maintenance. L’entrée « Accès administrateur » et son paramètre public ont été supprimés. Les guards `/admin` et `/owner`, les rôles, RLS, Billing et Integration Core ne sont pas modifiés : masquer un lien n’est pas une mesure d’autorisation.

## Dette volontaire

- `/identite` et `/identite/onboarding` restent les routes produit privées ; seule l’authentification publique quitte le préfixe.
- `/connexion/definir-mot-de-passe` reste une route legacy explicite jusqu’à migration des activations client historiques.
- Les endpoints `/api/auth/login` et `/api/auth/forgot-password` restent disponibles pour compatibilité, sans affordance publique dédiée.
