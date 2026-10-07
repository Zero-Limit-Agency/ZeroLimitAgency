# Audit des dépendances avant lancement — 7 octobre 2026

## Décision Next.js

- Version auditée sur `main` : Next.js 14.2.35.
- Version minimale qui corrige toutes les vulnérabilités applicables aux Server
  Actions et React Server Components de ce projet : Next.js 15.5.21.
- Version retenue : Next.js 15.5.27, épinglée exactement. C'est la dernière
  version 15.x publiée et la version Maintenance LTS recommandée par l'éditeur
  dans la mise à jour de sécurité du 30 septembre 2026.
- Next.js 14.x n'est plus supporté et n'a reçu aucun backport pour les avis
  applicables ci-dessous. Rester en 14.2.35 n'est donc pas sûr.

Le projet utilise l'App Router, des React Server Components et trois Server
Actions dans `app/learn-youtube/espace/actions.js`. Ces actions réauthentifient
l'utilisateur et contrôlent l'accès à la leçon dans leur propre frontière.

### Avis qui imposent la migration

| Avis | Applicabilité | Première version 15.5 corrigée |
| --- | --- | --- |
| GHSA-h25m-26qc-wcjf | App Router / Server Functions : déni de service par désérialisation | 15.5.10 |
| GHSA-q4gf-8mx6-v5v3 | React Server Components : déni de service CPU | 15.5.15 |
| GHSA-8h8q-6873-q5fj | React Server Components : déni de service CPU | 15.5.16 |
| GHSA-vfv6-92ff-j949 | Réponses RSC : empoisonnement de cache | 15.5.16 |
| GHSA-wfc6-r584-vfw7 | Réponses RSC : confusion HTML/RSC et empoisonnement de cache | 15.5.16 |
| GHSA-m99w-x7hq-7vfj | App Router avec Server Actions : déni de service CPU | 15.5.21 |
| GHSA-955p-x3mx-jcvp | App Router avec Server Actions : divulgation des identifiants de fonctions | 15.5.21 |

La borne technique issue de ces préconditions est 15.5.21. La version 15.5.27
est retenue car elle cumule ces correctifs et les deux publications de sécurité
d'août et septembre, tout en restant sur la majeure 15 supportée. Next 16 n'est
pas requis.

### Avis Next.js non exploitables dans la configuration actuelle

Les avis suivants ont aussi été contrôlés dans les publications officielles de
l'éditeur et dans le code du dépôt :

- `GHSA-9g9p-9gw9-jx7f` et `GHSA-cjq9-62q9-8jv4` nécessitent
  `images.remotePatterns`; cette option n'est pas configurée.
- `GHSA-3x4c-7xq6-9pq8` et `GHSA-h64f-5h5j-jqjh` concernent le cache disque ou
  la mémoire de l'optimiseur d'images auto-hébergé. Le déploiement cible est
  Vercel et les deux usages de `next/image` chargent le même PNG local borné.
- `GHSA-2xp9-vwfh-vxw4` nécessite l'optimisation d'images AVIF. Aucun AVIF et
  aucun format AVIF ne sont configurés dans le projet.
- `GHSA-p293-qw3h-jr36` nécessite un serveur hébergé sur un système de fichiers
  Windows. Le runtime de production Vercel est Linux.
- `GHSA-ggv3-7p47-pfv8` et `GHSA-p9j2-gv94-2wf4` nécessitent des réécritures
  externes; `next.config.mjs` n'en définit aucune.
- `GHSA-89xv-2m56-2m9x` concerne les Server Actions sur un serveur personnalisé
  dont l'en-tête hôte n'est pas fixé. Le projet utilise Vercel ou `next start`,
  sans serveur personnalisé.
- `GHSA-4c39-4ccg-62r3` nécessite une Server Action en runtime Edge. Les trois
  actions utilisent le runtime Node par défaut.
- `GHSA-68g3-v927-f742` et `GHSA-4633-3j49-mh5q` nécessitent des appels `fetch`
  serveur avec corps et cache dans des formes précises. Les appels serveur avec
  corps du projet utilisent `cache: "no-store"` et ne construisent pas une
  `Request` avec un second `init` divergent.
- `GHSA-3g8h-86w9-wvmq` nécessite une redirection produite par le middleware et
  mise en cache. Le middleware API ne produit aucune redirection.
- `GHSA-36qx-fr4f-26g5` nécessite Pages Router, i18n et une autorisation portée
  uniquement par le middleware. Le projet utilise App Router, sans i18n Next.
- `GHSA-6gpp-xcg3-4w24` nécessite le chemin Turbopack/single-locale concerné et
  une autorisation de pages dans le middleware. Le build de production utilise
  webpack et le middleware ne protège que les mutations API par leur origine.
- `GHSA-ffhc-5mcf-pf4q` nécessite des nonces CSP; la CSP n'utilise aucun nonce.
- `GHSA-gx5p-jg67-6x7h` nécessite un script `beforeInteractive` alimenté par une
  entrée non fiable; le projet n'utilise pas `next/script`.
- Les avis du 30 septembre sur SSG/ISR Pages Router, route catch-all racine,
  images de métadonnées dynamiques, Cache Components, `use cache` et Draft Mode
  ne rencontrent aucune de ces préconditions dans le dépôt. L'avis MCP ne vise
  que `next dev`, jamais la production. Ils sont néanmoins corrigés ou hors de
  portée de Next.js 15.5.27 selon l'avis éditeur.

## Alertes npm conservées après migration

`npm audit` signale 8 paquets (4 high, 4 moderate, 0 critical). L'agrégation
classe aussi `next` à cause de son PostCSS transitif; elle ne signale plus de
vulnérabilité propre à Next.js 15.5.27.

| Paquet | Chemin / usage réel | Justification de l'exception |
| --- | --- | --- |
| `postcss@8.4.31` | transitif de Next.js, compilation CSS | Les avis exigent du CSS contrôlé par un attaquant traité par PostCSS. Seuls les fichiers CSS versionnés sont compilés; aucun endpoint n'accepte ni ne transforme du CSS utilisateur. |
| `nanoid@3.3.11` | PostCSS appelle `nanoid/non-secure` avec la taille littérale `6` | Les trois avis nécessitent une taille négative, nulle ou supérieure à 2^31 contrôlée par l'attaquant. Cette valeur est fixe dans PostCSS. |
| `source-map-js@1.2.1` | transitif de PostCSS à la compilation | Le déni de service nécessite une source map indexée hostile. Le build ne consomme que les sources versionnées et aucune source map utilisateur à l'exécution. |
| `resend@6.12.2` → `svix@1.90.0` → `uuid@10.0.0` | envoi d'e-mails; Svix génère une clé d'idempotence avec `uuid.v4()` | L'avis `uuid` ne concerne que `v3`, `v5` et `v6` avec un tampon ou décalage invalide. Le chemin installé appelle uniquement `v4()` sans tampon. |
| `ws@8.20.0` | transitif de `@supabase/realtime-js` | L'application n'expose aucun serveur WebSocket et n'utilise pas Realtime. Les scénarios exigent un pair WebSocket hostile, ou un appel local explicite à `close()` avec une vue typée; aucun de ces chemins n'est accessible. |

Ces exceptions ne masquent ni ne suppriment les alertes. Elles doivent être
réévaluées lors d'une mise à jour Next.js, Supabase ou Resend, ou si le produit
commence à accepter du CSS, des source maps, des images distantes/AVIF ou des
connexions Realtime.

## Périmètre de la migration

Les adaptations applicatives sont limitées aux incompatibilités observées avec
Next.js 15 :

- les `params`, `searchParams` et `cookies()` des pages et Route Handlers sont
  désormais attendus avant lecture, conformément à l'API asynchrone de Next 15;
- la confirmation laisse `router.replace()` retirer le fragment contenant les
  jetons, sans écraser au préalable l'état d'historique géré par l'App Router;
- les mutations de réglages et de membres/invitations invalident explicitement
  les pages concernées. Les composants mettent à jour leur état après une
  mutation confirmée afin que l'interface ne dépende pas d'un payload RSC mis en
  cache; le titre, le statut et le formulaire de réglages partagent le même état
  confirmé par l'API.

Aucune Server Action métier, règle de rate limiting, migration ou schéma
Supabase, logique Auth serveur, billing ou module n'est modifié. Le runtime Node
20 reste inchangé pour isoler cette migration; son remplacement est traité
séparément.
