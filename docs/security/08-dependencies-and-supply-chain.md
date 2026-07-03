# 08 — Dépendances, chaîne d'approvisionnement et CI/CD

## Package manager et lockfile

- npm avec `package-lock.json` présent.
- Pas de dépendances Git/URL observées dans `package.json`.
- Scripts npm : `dev`, `build`, `start`, `ci`, `verify:dropmap`.
- Aucun `preinstall`/`postinstall` applicatif observé dans `package.json`.

## Résultats npm

- `npm audit` : non concluant dans cet environnement, le registre npm a répondu `403 Forbidden` sur l'endpoint advisories.
- `npm audit --omit=dev` : non concluant pour la même raison (`403 Forbidden`).
- `npm outdated` : non concluant dans cet environnement, le registre npm a répondu `403 Forbidden` sur `GET https://registry.npmjs.org/react`.

## GitHub Actions

- CI : build sur push main/master et PR, `npm ci`, `npm run build`.
- Dependency Review : action officielle.
- Dependabot : npm et GitHub Actions hebdomadaire.

## Risques CI/CD

- Actions utilisées par tag majeur (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/dependency-review-action@v4`) et non par SHA immuable.
- Permissions explicites sur Dependency Review, mais pas de bloc `permissions` explicite dans CI build.
- CI utilise des placeholders de secrets, bon point, mais vérifier que Vercel previews ne reçoivent pas des secrets production.

## Recommandations futures

- Épingler les actions par SHA ou adopter une politique Renovate/Dependabot dédiée.
- Déclarer `permissions: contents: read` dans le workflow CI.
- Ajouter tests sécurité automatisés avant merge.
- Planifier montée Next.js après lecture changelog et tests de régression.
