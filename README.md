# Zero Limit Agency - Next.js Base

Base Next.js propre et compatible Vercel pour faire évoluer le site public vers une vraie application.

## Stack actuelle

- Next.js App Router
- React
- CSS global réutilisé depuis la landing statique
- route API `app/api/contact/route.js`
- structure prête pour Supabase, auth et espace client
- intégration Supabase côté navigateur et côté serveur via `fetch`
- Google Drive via OAuth utilisateur

## Lancer le projet en local

1. Installer les dépendances

```bash
npm install
```

2. Lancer le serveur de développement

```bash
npm run dev
```

3. Ouvrir `http://localhost:3000`

## Déployer sur Vercel

1. pousser le repo sur GitHub
2. importer le repo dans Vercel
3. laisser Vercel détecter Next.js automatiquement
4. ajouter les variables d'environnement dans le dashboard Vercel
5. lancer le déploiement

## Structure posée

- `app/page.js` : landing publique
- `app/connexion/page.js` : point d'entrée simple pour connecter Google Drive
- `app/espace-client/page.js` : base future pour l'espace client
- `app/api/contact/route.js` : point d'entrée backend du formulaire
- `app/api/google/oauth/start/route.js` : démarrage OAuth Google
- `app/api/google/oauth/callback/route.js` : callback OAuth Google
- `components/landing-page.jsx` : version React de la landing
- `lib/contact/submission.js` : normalisation et validation du formulaire
- `lib/google/oauth.js` : flow OAuth Google et gestion des tokens
- `lib/google/drive.js` : création de dossier et upload Drive
- `lib/supabase/` : helpers Supabase
- `public/assets/` : assets publics du site

## Variables d'environnement

Remplir ces variables dans `.env.local` en local puis dans Vercel :

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CONTACT_FORWARD_EMAIL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_DRIVE_LEADS_ROOT_FOLDER_ID`

Exemple :

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CONTACT_FORWARD_EMAIL=z0agency.contact@gmail.com
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
GOOGLE_DRIVE_LEADS_ROOT_FOLDER_ID=
```

## Supabase

### Tester la connexion Supabase

1. remplir `.env.local`
2. lancer le projet
3. ouvrir `http://localhost:3000/api/supabase/test`

La route doit répondre avec `success: true`.

### Migrations actuelles

- `supabase/migrations/20260423_create_applications.sql`
- `supabase/migrations/20260423_applications_newsletter_and_drive_refs.sql`
- `supabase/migrations/20260423_create_google_oauth_tokens.sql`

## Tables métier actuelles

### `applications`

Stocke les demandes envoyées depuis le formulaire public.

### `newsletter_subscriptions`

Stocke proprement les abonnés newsletter.

### `google_oauth_tokens`

Stocke côté serveur le token d'accès Google, le refresh token et la date d'expiration pour ton Drive personnel.

SQL de la table :

```sql
create table if not exists public.google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  provider text not null unique,
  google_email text,
  google_display_name text,
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  last_refreshed_at timestamptz not null default timezone('utc', now())
);

create index if not exists google_oauth_tokens_google_email_idx
  on public.google_oauth_tokens (google_email);

drop trigger if exists set_google_oauth_tokens_updated_at on public.google_oauth_tokens;

create trigger set_google_oauth_tokens_updated_at
before update on public.google_oauth_tokens
for each row
execute function public.set_updated_at();

alter table public.google_oauth_tokens enable row level security;
```

## Google Drive V1 avec OAuth utilisateur

Le formulaire envoie les vraies pièces jointes en `multipart/form-data` vers `app/api/contact/route.js`.

La logique serveur :

1. crée l'application dans Supabase
2. gère la newsletter si besoin
3. lit un token OAuth Google stocké côté serveur
4. crée ou retrouve un dossier lead dans ton Google Drive personnel
5. upload les fichiers dans ce dossier
6. met à jour `applications.drive_folder_id` et `applications.drive_folder_url`

## Configuration Google restante à faire

1. créer un projet Google Cloud
2. activer l'API Google Drive
3. créer un client OAuth Web
4. ajouter l'URI de redirection :

```text
http://localhost:3000/api/google/oauth/callback
```

5. récupérer le `client_id` et le `client_secret`
6. créer ou choisir le dossier racine des leads dans ton Google Drive personnel
7. récupérer l'ID de ce dossier
8. remplir `.env.local`
9. redémarrer `npm run dev`

## Tester localement le flow OAuth + Drive

1. exécuter les migrations Supabase
2. remplir `.env.local`
3. lancer `npm run dev`
4. ouvrir :

```text
http://localhost:3000/api/google/oauth/start?next=/connexion
```

5. terminer la connexion Google
6. vérifier que tu reviens sur `/connexion?google=connected`
7. vérifier dans Supabase qu'une ligne est présente dans `public.google_oauth_tokens`
8. envoyer le formulaire avec une vraie pièce jointe
9. vérifier :

- `drive.requested: true`
- `drive.saved: true`
- `drive.folder_id`
- `drive.folder_url`

10. vérifier ensuite :

- le dossier dans Google Drive
- les fichiers dedans
- `applications.drive_folder_id`
- `applications.drive_folder_url`

## Prochaines étapes recommandées

1. sécuriser davantage le flux Drive avec des limites de taille et de type de fichiers
2. créer une table `application_files` si un suivi fichier par fichier devient nécessaire
3. ajouter une réécriture métier de la demande dans `message_rewritten`
4. créer les tables `profiles` et `client_access`
5. brancher l'authentification client

## Important

La base Next.js est prête à évoluer, mais les briques suivantes ne sont pas encore branchées :

- espace client complet
- Stripe
- Google Calendar
- IA / traduction automatique
