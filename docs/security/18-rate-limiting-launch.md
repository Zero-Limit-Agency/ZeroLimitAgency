# Rate limiting / Redis — qualification avant lancement

Audit du 6 octobre 2026, depuis `main` à `85a8925` (Auth #84 incluse).
La branche de référence `security/runtime-launch-qualification` est absente des
refs distantes et aucune PR correspondante n'a été trouvée. Elle n'a été ni
modifiée ni mergée ; les corrections sont justifiées par le code de `main`.
Ce document remplace les recommandations rate limiting des revues 13 et 17.

## Risques constatés et corrections

- Le provider local par défaut et le repli Redis en mémoire permettaient de
  répartir les requêtes entre instances serverless pour contourner la limite.
- `INCR`, `PEXPIRE`, `PTTL` séparés pouvaient laisser un compteur sans expiration.
  Une seule commande `EVAL` exécute désormais l'incrément et l'expiration ; un
  compteur sans TTL est réparé. Les refus ne prolongent pas la fenêtre.
- `x-vercel-forwarded-for` était cru hors Vercel. Sans IP, changer le User-Agent
  recréait un quota. Désormais aucun header client ne crée une identité hors
  proxy explicitement approuvé ; sans IP fiable, quota anonyme commun par action.
- Pas de délai Redis borné, et certaines réponses malformées étaient acceptées.
  Délai de 1,5 s (lecture de réponse comprise), validation stricte compteur/TTL.
- `/api/id/update-password` appelait Auth sans limite : ajout de 5/minute avant
  lecture du body/appels Auth. L'autorité bearer et les callbacks sont inchangés.

## Inventaire des flux

Toutes les limites sont des fenêtres fixes de 60 s par IP fiable, sauf `userKey`
explicitement fourni par un appelant serveur (jamais un champ client brut).

| Flux | Limite / décision |
| --- | --- |
| POST `/api/id/signup` | 5/min, existante |
| POST `/api/id/login` | 10/min, existante |
| POST `/api/auth/login` (historique) | 20/min, existante ; quota distinct du login ID, budget combiné fini de 30/min |
| POST `/api/id/forgot-password`, `/api/auth/forgot-password` | 3/min chacune, existantes ; budget combiné 6/min |
| POST `/api/auth/password-setup` | 5/min, existante |
| POST `/api/id/update-password` | 5/min, ajoutée |
| POST `/api/contact` | 15/min, existante, avant envoi email/persistance |
| POST `/api/team/invitations/accept` | 15/min, existante ; validation session/invitation supplémentaire |
| Provisioning, invitations, management | 10, 10, 30/min, existantes ; auth/permissions conservées |
| Mutations client/admin déjà limitées | Limites existantes conservées, même politique Redis |
| `/api/id/session`, confirmations et callbacks Auth/OAuth | Validation de tokens/session/state existante ; pas de limite ajoutée au parcours de callback (contrainte de périmètre). Risque résiduel de volume d'appels Auth ; ne pas confondre avec un endpoint d'envoi email ou de login par mot de passe |
| Google OAuth start | Session admin requise |
| Stripe webhook | Signature et idempotence existantes ; ne pas limiter arbitrairement les retries légitimes |
| Logout, status | Pas d'ajout : sortie de session et diagnostic doivent rester disponibles |
| `/api/dev/auth-session-test` | 404 avec NODE_ENV=production, y compris Preview |
| Autres API admin/client/Spaces | Session/permissions existantes ; pas d'élargissement global des quotas dans cette PR |

Les appels directs à Supabase ne passent pas par ce limiteur : conserver les
protections Auth natives (quotas email/login) et RLS. Les quotas IP ne sont ni
une protection DDoS ni une défense complète contre un botnet. Les blocages
honeypot dits « permanents » restent locaux au processus ; la protection
partagée repose sur Redis, pas sur cette blacklist. Les IP NAT partagent un
quota ; les alias historiques ont des budgets distincts explicités ci-dessus.

## Politique retenue

| Environnement | Redis absent | Redis configuré mais en panne | Redis OK |
| --- | --- | --- | --- |
| Local/dev | Mémoire par processus | Repli mémoire, log borné | Redis si sélectionné/configuré |
| Vercel Preview | Mémoire par instance, Preview utilisable | Repli mémoire, log borné | Redis si sélectionné/configuré |
| Production | 503 sur les seules routes utilisant le limiteur | 503, aucun repli local | Compteur partagé, dépassement = 429 |

`VERCEL_ENV=preview` ou `development` autorise le mode non-production, même si
`NODE_ENV=production` (cas normal d'un build Preview). `VERCEL_ENV=production`,
une valeur inconnue, `VERCEL=1` sans environnement connu, ou `NODE_ENV=production`
sans environnement explicite impose Redis. Ne jamais redéfinir les variables
système Vercel pour contourner cette politique. Un `next start` local peut être
qualifié avec `VERCEL_ENV=development`.

En production, `RATE_LIMIT_PROVIDER=local`, une faute de frappe ou l'ancien
`RATE_LIMIT_FAIL_CLOSED=false` ne désactive pas Redis. Ce dernier flag est
obsolète et ignoré partout ; `true` ne doit pas casser Preview.
En dev/Preview, provider `redis` tente Redis, provider absent utilise Redis si
une variable Redis est présente, provider `local` utilise la mémoire.

Une panne rend temporairement indisponibles **toutes les mutations déjà
limitées**, y compris certaines actions Core/admin ; les lectures, pages et
routes non limitées ne dépendent pas de Redis. C'est un compromis explicite :
une mémoire serverless ne fournit aucune borne globale fiable. Pas de nouvel
achat ou service provisionné dans ce chantier ; réutiliser un Redis REST
compatible existant si disponible. Ne pas lancer Production sans qualification.

## Configuration externe exacte

Dans Vercel, scope **Production**, variables serveur uniquement :

- `RATE_LIMIT_REDIS_URL` : URL **HTTPS** de l'API REST Redis (pas `redis://`, pas
  une URL TCP). Le POST JSON doit accepter la commande `EVAL` et renvoyer
  `{"result":[compteur,ttl_ms]}` avec deux nombres entiers.
- `RATE_LIMIT_REDIS_TOKEN` : token Bearer autorisé à exécuter `EVAL` et les
  commandes `INCR`, `PTTL`, `PEXPIRE` sur le préfixe concerné. Token en secret.
- `RATE_LIMIT_PROVIDER=redis` : explicite/recommandé, mais la production exige
  Redis même si cette variable manque.
- `RATE_LIMIT_KEY_PREFIX=zla:rate-limit` : facultatif. Choisir un préfixe unique
  par application si le Redis est partagé. L'environnement est automatiquement
  ajouté au préfixe, donc Preview ne consomme jamais le quota Production.

Preview : ne pas recopier les secrets Production. Aucun Redis n'est requis.
Si l'on qualifie Redis en Preview, utiliser des credentials dédiés ; le suffixe
Preview isole les compteurs mais ne constitue pas une isolation d'accès Redis.
Les déploiements Preview peuvent partager leurs quotas si le préfixe est commun.

Vercel : `VERCEL=1` doit être exposé par la plateforme. Seul
`x-forwarded-for` est utilisé, comme IP unique validée, conformément au
[contrat documenté de Vercel](https://vercel.com/docs/headers/request-headers)
qui écrase ce header pour éviter le spoofing. `x-vercel-forwarded-for`,
`x-real-ip`, `cf-connecting-ip` sont ignorés. Si un proxy de confiance Enterprise
est activé en amont de Vercel, qualifier également sa configuration : cette
option peut modifier le traitement de X-Forwarded-For.
Hors Vercel : laisser `TRUST_PROXY_IP_HEADERS=false` sauf si l'ingress **écrase**
`x-forwarded-for` avec une seule IP validée et interdit tout accès direct au
serveur. Les listes, ports, adresses invalides et zones IPv6 sont refusés.
Une IP fiable absente utilise un quota commun, jamais un bypass ; vérifier
l'ingress avant lancement pour éviter des 429 partagés entre utilisateurs.

## Panne et exploitation

- Redis manquant, erreur HTTP/JSON/réseau, résultat invalide, timeout : 503,
  `Retry-After: 30`, `Cache-Control: no-store` en production. Pas d'appel métier
  après le refus. Rétablissement automatique à la prochaine requête valide.
- Quota dépassé : 429, `Retry-After` dérivé du TTL (minimum 1 s), remaining=0.
- Message `[rate-limit] Redis unavailable` au plus une fois/minute/processus ;
  aucun token, URL, IP, corps de réponse ou exception fournisseur n'est loggé.
  Surveiller ces logs et les 503/429 dans l'observabilité existante.
- Vérifier avant promotion les flux normaux de login/signup/recovery/contact
  et Core sur le déploiement, puis dépasser un quota avec un compte de test.
  Vérifier les headers IP derrière le vrai ingress et le rétablissement Redis.
  Ne pas simuler une panne sur la production active.
- Les clés changent de namespace : le déploiement repart avec des quotas neufs.
  D'anciennes clés sans TTL peuvent rester dans Redis ; les nettoyer séparément
  après vérification, jamais par un FLUSH global.

## Validation reproductible

Node 20, `npm ci`, puis `npm test` et `npm run build`.
Pour inclure le test Redis réel :
`REDIS_TEST_BIN_DIR=/chemin/vers/redis/bin npm test` (Redis 7+, serveur isolé sur
socket Unix, pas de connexion externe ; sans variable ce seul test est ignoré).
Le test exécute le vrai Lua avec 40 requêtes concurrentes (7 acceptées), quota,
TTL, réparation d'une clé persistante, expiration et séparation Preview/Prod.
Le transport REST fournisseur reste simulé ; sa compatibilité doit être
confirmée sur le Redis du déploiement.

Les tests du limiteur couvrent dev/Preview/production, absence/config partielle,
erreurs HTTP/JSON/provider/réseau/timeout, réponses invalides, reprise, 429/503,
headers IP falsifiés, User-Agent tournant et expiration locale. Les tests Auth
exercent le vrai handler et vérifient qu'aucun appel Auth ne suit un 429/503.
Les tests E2E Core/entrée compte utilisent le vrai Next et un backend HTTP
Supabase de fixture : ils ne prouvent pas RLS, la délivrabilité email ou la
configuration du déploiement.

Résultats de cette qualification : Node **20.20.2**, `npm ci` réussi,
**231/231 tests réussis, aucun ignoré** avec Redis **7.2.7** isolé.
E2E Core et entrée compte réussis en **1440 px et 390 px** avec Chromium système.
Les fixtures écrasent X-Forwarded-For et attribuent une IP distincte à chaque
client desktop/mobile ; elles ne dépendent plus d'un changement de User-Agent
pour réinitialiser le quota. Le parcours Production sans Redis confirme un
503 avant mutation et l'accès conservé à un Space existant. La mutation de mot
de passe avec Redis sain en production est également couverte au niveau handler.
Build Node 20 réussi ; seul avertissement : téléchargement de police Google
indisponible pour l'optimisation. Aucun changement Next, dépendances/lockfile,
callbacks Auth, schéma Supabase ou CI globale.

Fichiers du chantier : `lib/security/rate-limit.js`,
`app/api/id/update-password/route.js`, `.env.example`, ce runbook,
`docs/security/15-production-security-checklist.md`,
`tests/security/rate-limit.test.mjs`, `tests/security/rate-limit-redis.test.mjs`,
`tests/security/auth-gotrue-corrections.test.mjs`,
`tests/e2e/core-reliability.mjs`, `tests/e2e/account-space-entry.mjs`.

**Verdict : launch-blocking tant que le Redis Production et le vrai ingress
n'ont pas été configurés/qualifiés.** Les vérifications repo réussissent, mais
ne constituent pas une preuve de configuration Vercel ni de disponibilité du
Redis externe. Aucun secret déployé n'a été consulté ou changé et aucun service
payant n'a été créé. La branche exploratoire reste à comparer si elle est fournie.
