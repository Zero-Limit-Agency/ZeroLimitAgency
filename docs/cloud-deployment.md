# Déploiement cloud

Ce repo est prévu pour fonctionner avec une source de vérité GitHub et un déploiement automatique vers Vercel.

## Flux recommandé

1. Les changements sont poussés sur GitHub.
2. GitHub Actions lance le workflow `CI`.
3. La CI installe les dépendances avec `npm ci`.
4. La CI vérifie que le projet compile avec `npm run build`.
5. Vercel déploie automatiquement le projet depuis GitHub.

## Runtime

- Node.js : version `20`, définie dans `.nvmrc`.
- Framework : Next.js App Router.
- Package manager : npm avec `package-lock.json`.

## Variables d'environnement

Les vraies valeurs doivent être configurées dans Vercel, pas dans le repo.

Variables attendues :

```env
NEXT_PUBLIC_APP_URL=https://zerolimit.agency
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
PUBLIC_CONTACT_EMAIL=contact@zerolimit.agency
INSCRIPTIONS_EMAIL=inscription@zerolimit.agency
CLIENT_EMAIL=client@zerolimit.agency
CLIENT_SUPPORT_EMAIL=contact@zerolimit.agency
CLIENT_DISCORD_URL=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://zerolimit.agency/api/google/oauth/callback
GOOGLE_DRIVE_LEADS_ROOT_FOLDER_ID=
```

## Redirects Supabase Auth en Preview

Les emails de confirmation Zero Limit ID redirigent vers le domaine du déploiement Vercel courant en Preview, vers `NEXT_PUBLIC_APP_URL` en production, et vers localhost en développement. `VERCEL_URL` est fourni par Vercel : l'application n'accepte pas le header `Host` comme origine de confiance en production ou en Preview.

Dans **Supabase Authentication > URL Configuration**, conserver le domaine canonique comme Site URL et ajouter aux Redirect URLs :

- `https://zerolimit.agency/confirmation` ;
- `https://zerolimit.agency/nouveau-mot-de-passe` ;
- `https://zerolimit.agency/connexion/definir-mot-de-passe` ;
- les mêmes chemins pour les domaines Preview Vercel approuvés du projet (ou un glob Supabase limité au préfixe et au scope Vercel de ce projet, jamais un wildcard global `*.vercel.app`).

Si une URL Preview n'est pas autorisée dans Supabase, GoTrue confirme éventuellement l'email mais retombe sur la Site URL canonique. Lorsque le site canonique est en maintenance, cela ressemble à tort à un blocage du callback. Mettre à jour cette allowlist fait donc partie du déploiement Preview.

## GitHub Actions

Le workflow `.github/workflows/ci.yml` utilise des valeurs factices pour les secrets afin de compiler l'application sans exposer de données sensibles.

Ces valeurs servent uniquement au build CI. Les routes qui nécessitent de vrais secrets doivent être exécutées sur Vercel avec les variables réelles.

## Règles importantes

- Ne pas dépendre d'un terminal local ouvert.
- Ne pas stocker de secrets dans GitHub.
- Ne pas commiter `.env.local`.
- Garder les tâches récurrentes ou automatisées côté Vercel, GitHub Actions ou services cloud.
- Pour la production, `NEXT_PUBLIC_APP_URL` doit pointer vers le domaine public final.
