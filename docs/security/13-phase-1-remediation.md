# 13 — Phase 1 remediation P0/P1

Date : 2026-07-03.

## Synthèse

Cette phase corrige uniquement les risques ciblés par la première vague : SEC-001, SEC-002, headers HTTP de sécurité et rate limiting. Elle ne corrige pas l'ensemble des 21 findings.

| Finding | Statut phase 1 | Résumé |
| --- | --- | --- |
| SEC-001 | Fixed + requires production verification | Route `/api/supabase/test` supprimée du dépôt. |
| SEC-002 | Partially fixed | Nouveaux tokens Google OAuth chiffrés AES-256-GCM côté serveur; lecture legacy conservée pour migration progressive. |
| SEC-003 | Mitigated + requires production verification | Headers de sécurité globaux ajoutés via Next.js. |
| SEC-004 | Partially fixed | Interface de rate limiting avec provider Redis REST distribué et fallback local documenté. |

## SEC-001 — Diagnostic Supabase

### Changements

- Suppression de `app/api/supabase/test/route.js`.
- Recherche complémentaire effectuée sur `/test`, `/debug`, `/diagnostic`, `/health`, `/preview`, `bypass`, `ENABLE_`.
- Routes similaires restantes :
  - `/api/dev/auth-session-test` : reste limitée à `NODE_ENV !== production`; usage local uniquement, à ne pas exposer en preview avec secrets réels.
  - `/api/status` : health check public minimal ne retournant que `online`, `maintenance` ou `offline`.

### Tests

- Test automatisé vérifiant l'absence du fichier route Supabase diagnostic.
- `npm run build` vérifie que la route n'apparaît plus dans la cartographie Next.js.

### Risque résiduel

- Vérifier dans Vercel qu'aucune ancienne fonction `/api/supabase/test` n'est encore servie par un déploiement précédent.

## SEC-002 — Tokens OAuth Google

### Changements

- Ajout de `lib/security/oauth-token-encryption.js` avec AES-256-GCM, IV aléatoire 96 bits, tag d'authentification, format versionné `zla-oauth-token:v1:<iv>:<tag>:<ciphertext>`.
- Ajout d'une migration non destructive `supabase/migrations/20260703_google_oauth_token_encryption.sql`.
- Ajout de colonnes `access_token_encrypted`, `refresh_token_encrypted`, `token_encryption_version`, `encrypted_at`.
- `access_token` legacy devient nullable pour permettre les nouveaux enregistrements sans plaintext.
- `storeGoogleOAuthTokens` écrit désormais les nouveaux tokens dans les colonnes chiffrées et met les colonnes legacy à `null`.
- `getValidGoogleDriveAccessToken` lit d'abord le format chiffré puis conserve un fallback legacy plaintext pour migration progressive.
- Ajout d'une fonction serveur de déconnexion/révocation locale `disconnectGoogleOAuthToken` qui efface les valeurs tokenisées en base.

### Déploiement recommandé

1. Appliquer la migration Supabase.
2. Configurer `OAUTH_TOKEN_ENCRYPTION_KEY` côté serveur dans Vercel Production/Preview/Development selon besoin.
3. Déployer le code compatible legacy/chiffré.
4. Forcer une reconnexion Google ou un refresh contrôlé pour réécrire les tokens au format chiffré.
5. Après validation complète, planifier une phase séparée pour supprimer définitivement les colonnes plaintext legacy.

### Génération de clé

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Stocker la valeur uniquement dans une variable serveur `OAUTH_TOKEN_ENCRYPTION_KEY`. Ne jamais utiliser `NEXT_PUBLIC_*`.

### Rotation et révocation

- Rotation : déployer une phase dédiée avec support multi-clé (`kid`) ou migration applicative contrôlée; la phase actuelle introduit un format versionné mais pas encore multi-clé.
- Révocation Google : révoquer le token côté Google Cloud/compte Google, puis appeler la logique serveur de suppression locale ou supprimer les tokens via procédure admin contrôlée.
- Déconnexion : utiliser `disconnectGoogleOAuthToken` côté serveur dans une future route admin protégée si une action UI est ajoutée.
- Token invalide : les erreurs de refresh restent contrôlées par les handlers existants; aucune valeur token n'est loggée.

### Risque résiduel

- Les anciens tokens déjà présents en clair restent lisibles jusqu'à migration/reconnexion.
- La console Supabase doit être vérifiée pour confirmer l'application de la migration et l'absence de plaintext après migration progressive.

## SEC-003 — Headers HTTP de sécurité

### Changements

- Ajout de `lib/security/headers.mjs`.
- Application globale via `next.config.mjs`.
- Headers ajoutés :
  - `Content-Security-Policy` ;
  - `Strict-Transport-Security` ;
  - `X-Content-Type-Options` ;
  - `Referrer-Policy` ;
  - `Permissions-Policy` ;
  - `Cross-Origin-Opener-Policy` ;
  - `Cross-Origin-Resource-Policy`.

### CSP

La CSP bloque au minimum `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, évite `unsafe-eval`, et limite les connexions/images/styles aux domaines observés : application, Supabase, Google Fonts, Google APIs/OAuth/Drive.

### Risque résiduel

- Validation navigateur nécessaire sur Vercel Production/Preview, notamment OAuth Google, médias, fonts et pages admin/client.
- `script-src 'unsafe-inline'` et `style-src 'unsafe-inline'` restent tolérés pour compatibilité Next.js/styles existants et doivent être durcis ultérieurement avec nonce/hash.

## SEC-004 — Rate limiting distribué

### Changements

- `lib/security/rate-limit.js` expose désormais `checkRateLimit` asynchrone.
- Provider `redis` via API REST compatible Upstash/Vercel Redis : `RATE_LIMIT_PROVIDER=redis`, `RATE_LIMIT_REDIS_URL`, `RATE_LIMIT_REDIS_TOKEN`.
- Fallback local conservé uniquement pour développement ou absence de provider.
- Les clés stockées sont hashées en SHA-256 et ne contiennent pas directement d'email/token.
- Les headers IP génériques `x-forwarded-for` / `x-real-ip` ne sont utilisés que si `TRUST_PROXY_IP_HEADERS=true` ou `VERCEL=1`; `x-vercel-forwarded-for` est prioritaire en environnement Vercel.
- Les routes existantes utilisant le rate limit ont été migrées vers `await checkRateLimit`.

### Routes couvertes par le rate limit existant après migration

- `/api/auth/login`
- `/api/auth/forgot-password`
- `/api/auth/password-setup`
- `/api/contact`
- `/api/client/profile/avatar`
- `/api/client/newsletter/[applicationId]`
- `/api/client/collaboration/[applicationId]`
- plusieurs routes `/api/admin/**` sensibles déjà protégées par limite.

### Risque résiduel

- Le rate limiting n'est réellement distribué qu'après configuration d'un backend Redis REST dans Vercel.
- Le fallback local ne protège pas plusieurs instances serverless et reste explicitement documenté comme tel.

## Variables Vercel à créer

### Production

- `OAUTH_TOKEN_ENCRYPTION_KEY` : obligatoire avant nouvelle connexion/refresh Google chiffré.
- `RATE_LIMIT_PROVIDER=redis` recommandé.
- `RATE_LIMIT_REDIS_URL` et `RATE_LIMIT_REDIS_TOKEN` si Redis/Upstash activé.
- `RATE_LIMIT_FAIL_CLOSED=true` recommandé pour endpoints coûteux après validation.
- `TRUST_PROXY_IP_HEADERS=false` sauf besoin explicite hors Vercel.

### Preview

- Ne pas hériter automatiquement de secrets production sauf nécessité.
- Configurer `OAUTH_TOKEN_ENCRYPTION_KEY` uniquement si Google OAuth/Drive est testé en preview.
- Utiliser un Redis séparé ou `RATE_LIMIT_KEY_PREFIX` distinct.

### Development

- `RATE_LIMIT_PROVIDER=local` acceptable.
- `OAUTH_TOKEN_ENCRYPTION_KEY` nécessaire pour tester une nouvelle connexion Google chiffrée.

## Tests ajoutés

- `tests/security/oauth-token-encryption.test.mjs`
- `tests/security/rate-limit.test.mjs`
- `tests/security/headers-and-diagnostics.test.mjs`

Couverture : chiffrement/déchiffrement, IV unique, altération détectée, fallback legacy, clé absente, diagnostic supprimé, headers requis, CSP sans wildcard global ni `unsafe-eval`, rate limit 429, séparation route/utilisateur, non-confiance par défaut dans `x-forwarded-for`.

## Rollback

- Code : revert de la PR possible sans perte de données, car la migration est additive et non destructive.
- Base : conserver les colonnes ajoutées en cas de rollback applicatif; elles sont ignorées par l'ancien code.
- Tokens : ne pas supprimer les colonnes legacy avant une phase ultérieure validée.
