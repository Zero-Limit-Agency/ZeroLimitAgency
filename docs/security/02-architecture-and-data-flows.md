# 02 — Architecture, inventaire technique et flux de données

## Stack réelle observée

| Élément | Observation |
| --- | --- |
| Framework | Next.js `^14.2.0`, App Router |
| Runtime cible | Node.js `>=20 <23` dans `package.json`; GitHub Actions utilise `.nvmrc` |
| Gestionnaire | npm avec `package-lock.json` |
| UI | React `^18.2.0` / `react-dom` |
| Base et auth | Supabase via REST/Auth/Storage et `@supabase/supabase-js` |
| Email | Resend |
| IA | OpenAI package présent; route admin call-assistant à inspecter avant usage production |
| OAuth | Google OAuth Drive pour stockage de dossiers prospects |
| Paiements | Aucune intégration Stripe/paiement observée dans le dépôt actuel |
| Bot Discord | Pages publiques Discord uniquement; dépôt bot hors périmètre |
| Uploads | Contact vers Google Drive; site assets, post-call et collaboration vers Supabase Storage; avatar en data URL DB |
| Analytics/CDN | Aucun SDK analytics dédié observé; CDN Vercel implicite |

## Dépendances de production

- `@supabase/supabase-js`
- `next`
- `openai`
- `react`
- `react-dom`
- `resend`

Aucune dépendance de développement explicite dans `package.json`.

## Variables d'environnement utilisées/attendues

- Publiques : `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, variables publiques Discord.
- Privées : `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, emails de contact/support, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_DRIVE_LEADS_ROOT_FOLDER_ID`.
- Aucune valeur réelle n'a été committée dans le rapport; `.env.example` contient des placeholders.

## Cartographie des routes pages

| Route | Type | Sensibilité | Contrôle observé |
| --- | --- | --- | --- |
| `/` | Page publique | Site public | Public, maintenance potentielle via composants |
| `/learn-youtube` | Page publique/future formation | Sensible futur | Public avec settings admin |
| `/dropmap` | Produit public/privé selon settings | Sensible futur | Visibilité via lib DropMap |
| `/discord`, `/discord/privacy`, `/discord/support`, `/discord/terms` | Pages légales/produit | Public | Public |
| `/connexion`, `/connexion/definir-mot-de-passe` | Auth | Sensible | Formulaires client |
| `/espace-client` | Client | Sensible | Session + rôle; redirection selon accès |
| `/espace-client/[applicationId]` | Client dynamique | Très sensible | Autorisation propriétaire/admin preview à vérifier en détail |
| `/admin` | Admin | Très sensible | Session + rôle admin serveur |
| `/admin/[applicationId]` | Admin dynamique | Très sensible | Session + rôle admin serveur |
| `/admin/dropmap` | Admin | Sensible | À confirmer par page/layout |
| Pages légales | Légal | Public | Public |

## Cartographie des routes API

| Route | Méthodes | Catégorie | Auth observée | Notes |
| --- | --- | --- | --- | --- |
| `/api/contact` | POST | Formulaire + création compte + Drive + email | Anonyme + rate limit | Utilise service-role; crée user Auth et application |
| `/api/auth/login` | POST | Auth | Anonyme | Cookies HttpOnly |
| `/api/auth/logout` | GET/POST selon implémentation | Auth | Cookie clear | Vérifier CSRF/GET logout |
| `/api/auth/forgot-password` | POST | Auth | Anonyme | Service-role pour recovery |
| `/api/auth/password-setup` | POST | Auth | Token | Validation token/password |
| `/api/client/profile/avatar` | POST | Client | Session client | Avatar stocké en data URL DB |
| `/api/client/newsletter/[applicationId]` | PATCH/POST | Client | Session + owner attendu | Préférences newsletter |
| `/api/client/collaboration/[applicationId]` | GET/POST | Client | Session + owner | Messages + uploads |
| `/api/client/collaboration/.../attachments/...` | GET | Client | Session + owner | Téléchargement privé |
| `/api/client/post-call-zero-files/[applicationId]/[documentType]` | GET | Client | Session + owner | Téléchargement privé |
| `/api/admin/**` | GET/POST/PATCH | Admin | `requireAdminApiSession` attendu | Large usage service-role |
| `/api/google/oauth/start` | GET | OAuth admin | Admin | state cookie + next limité `/admin` |
| `/api/google/oauth/callback` | GET | OAuth admin | Admin + state | Stocke tokens Google |
| `/api/supabase/test` | GET | Diagnostic | Admin + non-production | Surface sensible en preview |
| `/api/dev/auth-session-test` | POST | Test dev | Non-production uniquement | Manipule cookies de test |
| `/api/status` | GET | Health | Public | À limiter aux infos non sensibles |

## Flux de données principaux

```text
Visiteur anonyme -> /api/contact -> Supabase Auth admin createUser
                         |-> table applications / newsletter_subscriptions
                         |-> Google Drive dossier + fichiers
                         |-> Resend emails interne + confirmation
                         |-> réponse JSON avec applicationId

Client connecté -> cookies HttpOnly -> Supabase Auth /auth/v1/user
                 -> service-role serveur lit client_access/applications/profiles
                 -> pages /espace-client et API client
                 -> Supabase Storage pour fichiers privés via proxy API

Admin connecté -> cookies HttpOnly -> requireAdminApiSession
                -> service-role serveur lit/écrit applications, profils, settings, storage
                -> OAuth Google admin -> tokens en DB -> Drive API

Composants client -> fetch API interne -> routes serveur -> Supabase/Drive/Resend/OpenAI potentiels
```

## Frontières de confiance

- Navigateur non fiable : formulaires, query strings, fichiers, cookies envoyés.
- Routes Next.js serveur : première frontière d'authentification/validation.
- Supabase service-role : frontière critique qui contourne RLS.
- Supabase Storage/DB : stockage de données sensibles.
- Google Drive/Resend/OpenAI : sous-traitants externes, coûts et confidentialité.
- Vercel Preview/Production : frontières d'environnement non observables depuis le dépôt.
