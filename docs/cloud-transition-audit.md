# Audit de transition GitHub/Codex Cloud

Objectif : faire de GitHub et de l'environnement cloud la base principale du projet, tout en gardant le local utilisable en secondaire.

## État actuel

Le projet est une application Next.js compatible Vercel avec :

- routes API Next.js ;
- Supabase côté serveur et navigateur ;
- envoi d'emails via Resend ;
- stockage et accès Google Drive via OAuth ;
- espace admin et espace client ;
- workflows GitHub Actions ajoutés pour vérifier le build.

## Dépendances encore liées au local

### Documentation locale

Le README contient encore des instructions `localhost` pour le développement, les tests OAuth et les callbacks Google locaux.

Statut : acceptable.

Adaptation : le local reste un mode secondaire. Les valeurs production doivent être configurées dans Vercel.

### Variables `.env.local`

Le projet utilise `.env.local` en développement.

Statut : acceptable.

Adaptation : les vraies variables doivent être configurées dans Vercel. GitHub Actions utilise uniquement des placeholders de build.

### Route de test dev-only

La route `/api/dev/auth-session-test` sert à simuler des sessions en développement.

Statut : acceptable.

Protection existante : la route retourne `404` en production.

### Fallbacks `localhost`

Certains helpers utilisent `http://localhost:3000` si `NEXT_PUBLIC_APP_URL` est absent.

Statut : acceptable en développement, à surveiller en production.

Adaptation recommandée : garder `NEXT_PUBLIC_APP_URL` obligatoire dans Vercel.

### Fichiers locaux

`node_modules`, `.next`, `.env.local`, `.env` et `.vercel` sont ignorés par git.

Statut : correct.

Adaptation ajoutée : règles `.gitignore` renforcées pour éviter les fichiers d'environnement accidentels.

## Fichiers cloud ajoutés

- `.github/workflows/ci.yml` : build Next.js sur GitHub Actions.
- `.github/dependabot.yml` : suivi des dépendances npm et GitHub Actions.
- `.github/pull_request_template.md` : checklist PR orientée sécurité/cloud.
- `.nvmrc` : runtime Node 20.
- `AGENTS.md` : règles pour Codex/GitHub Cloud.
- `docs/cloud-deployment.md` : guide de déploiement cloud.

## Risques connus

### Mise à jour Next.js

`npm audit` signale des vulnérabilités liées à `next`.

La correction automatique proposée monte vers Next 16, ce qui est une migration majeure. Elle doit être traitée dans une PR dédiée avec test complet.

### Secrets

Les secrets ne doivent jamais être ajoutés dans GitHub. Ils doivent vivre dans :

- Vercel Environment Variables ;
- éventuellement GitHub Actions Secrets si un workflow doit appeler un service réel.

Le workflow CI actuel n'utilise pas de vrais secrets.

## Prochaines étapes recommandées

1. Configurer les variables de production dans Vercel.
2. Connecter le repo GitHub à Vercel si ce n'est pas déjà fait.
3. Activer les checks GitHub Actions comme protection de branche.
4. Créer une PR dédiée pour la migration Next.js de sécurité.
5. Garder les changements futurs sur branches + pull requests.
