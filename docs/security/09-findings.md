# 09 — Findings détaillés

## SEC-001 — Route de diagnostic Supabase disponible hors production

- **Statut phase 1** : Fixed — route supprimée du dépôt; vérification production/preview requise après déploiement.
- **Gravité** : Élevée
- **Confiance** : Confirmée par le code
- **Catégorie** : configuration / exposition d'information
- **Référentiel** : OWASP API3:2023, CWE-200, ASVS configuration
- **Emplacement** : `app/api/supabase/test/route.js`
- **Description** : la route retourne la présence de variables, l'URL projet Supabase et le statut de checks admin dès que `NODE_ENV !== "production"`. Elle est protégée par rôle admin, mais reste dangereuse en preview/staging si des secrets réels y sont injectés.
- **Conditions nécessaires** : session admin valide ou compromise sur un environnement non-production exposé.
- **Scénario** : un attaquant accède à une preview Vercel avec un cookie admin volé et obtient des informations Supabase et checks d'administration.
- **Impact** : reconnaissance accélérée, exposition d'informations internes, préparation d'attaques ciblées.
- **Preuve** : la route ne renvoie 404 qu'en production, puis exécute `adminClient.auth.listUsers()` et `adminClient.rest.openApi()`.
- **Reproduction sûre** : en local avec admin test, appeler `GET /api/supabase/test`.
- **Correction recommandée** : supprimer la route, ou la protéger par flag privé explicite non activé en preview, allowlist IP, journalisation et réponse minimale.
- **Effort estimé** : faible
- **Priorité** : P0 si previews publiques avec secrets réels, sinon P1
- **Risque de régression** : diagnostics Supabase manuels.

## SEC-002 — Tokens OAuth Google stockés sans chiffrement applicatif visible

- **Statut phase 1** : Partially fixed — nouveaux tokens chiffrés côté serveur; anciens tokens plaintext restent lisibles pour migration progressive jusqu’à rotation/migration contrôlée.
- **Gravité** : Élevée
- **Confiance** : Confirmée par le code
- **Catégorie** : secret / OAuth
- **Référentiel** : CWE-922, ASVS secrets, OAuth 2.0 security BCP
- **Emplacement** : `supabase/migrations/20260423_create_google_oauth_tokens.sql`, `lib/google/oauth.js`
- **Description** : les colonnes `access_token` et `refresh_token` sont `text`; le code les stocke directement via service-role.
- **Conditions nécessaires** : accès DB, dump, vulnérabilité service-role ou admin compromis.
- **Scénario** : un dump Supabase expose le refresh token Google Drive, permettant de régénérer un access token.
- **Impact** : accès aux dossiers Drive connectés, exfiltration fichiers prospects, atteinte réputationnelle.
- **Preuve** : migration crée des colonnes token texte; `storeGoogleOAuthTokens` écrit `access_token`/`refresh_token`.
- **Reproduction sûre** : inspection statique uniquement.
- **Correction recommandée** : chiffrement enveloppe côté serveur, rotation, scopes minimaux, stockage séparé, audit de consultation.
- **Effort estimé** : moyen
- **Priorité** : P0/P1 selon données Drive réelles
- **Risque de régression** : connexion Drive, upload contact, refresh OAuth.

## SEC-003 — Absence de headers navigateur de sécurité explicites

- **Statut phase 1** : Mitigated — headers globaux ajoutés; validation navigateur/production encore requise.
- **Gravité** : Élevée
- **Confiance** : Confirmée par le code
- **Catégorie** : configuration
- **Référentiel** : OWASP A05, CWE-693
- **Emplacement** : `next.config.mjs`
- **Description** : aucune configuration de CSP, frame-ancestors/X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options.
- **Conditions nécessaires** : victime visitant le site, injection future ou page encadrée.
- **Scénario** : une injection contenu future devient plus exploitable faute de CSP; une page sensible peut être clickjackée sans frame policy.
- **Impact** : XSS aggravée, clickjacking, fuite referrer, surface navigateur plus large.
- **Preuve** : `next.config.mjs` ne contient que `reactStrictMode`.
- **Reproduction sûre** : vérifier les headers en local après build/start.
- **Correction recommandée** : ajouter headers compatibles Next/Vercel avec CSP progressive report-only puis enforce.
- **Effort estimé** : moyen
- **Priorité** : P1
- **Risque de régression** : images, vidéos, Google, Supabase, styles inline Next.

## SEC-004 — Rate limiting mémoire non distribué et IP spoofable

- **Statut phase 1** : Partially fixed — abstraction Redis distribuée ajoutée avec fallback local documenté; nécessite configuration Vercel Redis/Upstash pour être réellement distribué.
- **Gravité** : Élevée
- **Confiance** : Forte
- **Catégorie** : abus / disponibilité / coût
- **Référentiel** : OWASP API4:2023, CWE-400
- **Emplacement** : `lib/security/rate-limit.js`
- **Description** : limites stockées dans un `Map` local par instance, reset au redémarrage, non partagées entre fonctions serverless; identité fondée sur headers IP.
- **Conditions nécessaires** : bot ou trafic distribué.
- **Scénario** : spam de `/api/contact` réparti sur plusieurs instances ou avec IPs variables, générant comptes Auth, emails et appels Drive.
- **Impact** : coût financier, spam, saturation, réputation email.
- **Preuve** : `rateLimitStore = new Map()` et `x-forwarded-for` utilisé comme première identité.
- **Reproduction sûre** : inspection statique; test local non destructif possible.
- **Correction recommandée** : rate limit distribué (Upstash/Redis/Vercel KV), validation IP trusted proxy, quotas par email/utilisateur, CAPTCHA adaptatif.
- **Effort estimé** : moyen
- **Priorité** : P1
- **Risque de régression** : contact, login, collaboration, uploads admin.

## SEC-005 — Usage massif de Supabase service-role dans les routes serveur

- **Statut phase complète** : Mitigated — RLS migration, entitlement helper and service-role inventory/checklist added; production verification still required.
- **Gravité** : Moyenne
- **Confiance** : Confirmée par le code
- **Catégorie** : architecture / contrôle d'accès
- **Référentiel** : OWASP A01, API1:2023 BOLA
- **Emplacement** : `lib/supabase/admin.js`, `lib/supabase/server.js`, routes `/api/admin`, `/api/client`
- **Description** : la majorité des lectures/écritures DB passe par la service-role. Les gardes serveur sont donc l'unique barrière; RLS ne protège pas contre une route oubliée ou bugguée.
- **Conditions nécessaires** : route vulnérable actuelle ou future, admin/client compromis.
- **Scénario** : une route client future accepte un `applicationId` sans vérifier ownership et lit via service-role.
- **Impact** : IDOR/BOLA inter-clients, exfiltration complète selon endpoint.
- **Preuve** : `supabaseServerRequest(... useServiceRole: true)` dans la lib admin.
- **Reproduction sûre** : revue de code; tests d'autorisation à ajouter.
- **Correction recommandée** : isoler clients Supabase par usage, utiliser anon+RLS lorsque possible, wrappers typés par ressource, tests obligatoires.
- **Effort estimé** : architecture
- **Priorité** : P1/P2
- **Risque de régression** : toutes les API DB.

## SEC-006 — Politiques RLS recommandées non appliquées comme migrations

- **Statut phase complète** : Mitigated — executable RLS policies added; requires Supabase verification script execution.
- **Gravité** : Moyenne
- **Confiance** : Moyenne
- **Catégorie** : base de données / contrôle d'accès
- **Référentiel** : OWASP A01, ASVS access control
- **Emplacement** : `supabase/recommendations/20260429_security_rls_recommendations.sql`
- **Description** : les migrations activent RLS mais ne créent pas de policies; les policies sont dans un dossier recommendations. L'état réel Supabase doit être vérifié.
- **Conditions nécessaires** : accès direct anon/auth à REST Supabase ou policy manquante.
- **Scénario** : une table nécessaire au client reste inaccessible ou, inversement, une policy manuelle trop large existe hors dépôt.
- **Impact** : indisponibilité, accès excessif, dérive infra/code.
- **Preuve** : `alter table ... enable row level security` sans `create policy` dans migrations principales.
- **Reproduction sûre** : requêter `pg_policies` sur environnement autorisé.
- **Correction recommandée** : versionner les policies RLS en migrations, tests RLS par rôle.
- **Effort estimé** : moyen
- **Priorité** : P1
- **Risque de régression** : accès client/admin Supabase.

## SEC-007 — Scope Google Drive trop large

- **Statut phase complète** : Documented — scope reduction deferred until Google Drive behavior can be validated externally.
- **Gravité** : Moyenne
- **Confiance** : Confirmée par le code
- **Catégorie** : OAuth / moindre privilège
- **Référentiel** : OAuth least privilege, ASVS secrets
- **Emplacement** : `lib/google/oauth.js`
- **Description** : le scope `https://www.googleapis.com/auth/drive` donne un accès large au Drive connecté.
- **Conditions nécessaires** : token compromis ou bug app.
- **Scénario** : un refresh token volé permet d'agir bien au-delà du dossier prospects si le compte Google l'autorise.
- **Impact** : exfiltration ou modification Drive plus large.
- **Preuve** : constante `GOOGLE_DRIVE_SCOPE`.
- **Correction recommandée** : étudier `drive.file` ou un modèle de compte de service/dossier dédié; limiter par compte dédié.
- **Effort estimé** : moyen
- **Priorité** : P1
- **Risque de régression** : création/recherche de dossiers existants.

## SEC-008 — Protection CSRF explicite absente sur actions mutantes

- **Statut phase complète** : Mitigated — same-origin middleware added for mutating API requests.
- **Gravité** : Moyenne
- **Confiance** : Forte
- **Catégorie** : CSRF
- **Référentiel** : CWE-352, ASVS session
- **Emplacement** : routes POST/PATCH `/api/admin/**`, `/api/client/**`, `/api/auth/logout`
- **Description** : les cookies SameSite=Lax aident, mais il n'y a pas de token CSRF ni vérification Origin/Referer uniforme.
- **Conditions nécessaires** : navigateur victime authentifié, contexte same-site/sous-domaine ou comportement futur permissif.
- **Impact** : action non voulue admin/client si une condition navigateur/origine le permet.
- **Correction recommandée** : vérifier Origin sur mutating requests, CSRF token pour formulaires sensibles, méthode POST uniquement pour logout.
- **Effort estimé** : moyen
- **Priorité** : P2 sauf actions critiques exposées
- **Risque de régression** : formulaires client/admin.

## SEC-009 — Absence de journal d'audit admin observable

- **Statut phase complète** : Mitigated — audit_logs table/helper and initial admin events added; coverage expansion remains.
- **Gravité** : Moyenne
- **Confiance** : Confirmée par absence de code
- **Catégorie** : traçabilité
- **Référentiel** : ASVS logging, CWE-778
- **Emplacement** : routes `/api/admin/**`
- **Description** : pas de table ou mécanisme d'audit pour modifications admin, OAuth, emails manuels, activation, suppressions.
- **Impact** : détection/forensics faibles après compromission ou erreur interne.
- **Correction recommandée** : journal immuable minimal avec actor, action, ressource, timestamp, diff non sensible.
- **Priorité** : P2

## SEC-010 — Aucune validation centralisée des URLs administrables

- **Statut phase complète** : Mitigated — common URL sanitizer added and applied to support/resource URLs.
- **Gravité** : Moyenne
- **Confiance** : Forte
- **Catégorie** : redirection/liens externes/XSS lien
- **Référentiel** : CWE-601, CWE-79
- **Emplacement** : `app/api/admin/applications/[applicationId]/route.js` et éditeurs de contenu
- **Description** : plusieurs URLs sont normalisées par trim seulement. React échappe le texte, mais les liens externes peuvent conduire à `javascript:`, phishing ou fuite.
- **Impact** : XSS de lien selon rendu, phishing client/admin.
- **Correction recommandée** : helper `sanitizeExternalUrl` autorisant `https:` et domaines attendus; `rel=noopener noreferrer`.
- **Priorité** : P2

## SEC-011 — Route `/api/contact` renvoie `applicationId` à l'appelant anonyme

- **Statut phase complète** : Open — response contract not changed in this security pass to avoid product regression.
- **Gravité** : Moyenne
- **Confiance** : Confirmée par le code
- **Catégorie** : exposition d'information / logique métier
- **Référentiel** : CWE-200
- **Emplacement** : `app/api/contact/route.js`
- **Description** : la réponse d'inscription contient l'UUID `applicationId`. Les API client/admin semblent protégées, mais cet ID peut faciliter reconnaissance et support phishing.
- **Impact** : corrélation d'une demande, tentative IDOR future.
- **Correction recommandée** : ne retourner qu'un statut ou un identifiant public opaque non réutilisable.
- **Priorité** : P2

## SEC-012 — Upload ZIP autorisé sans inspection antivirus/sandbox

- **Statut phase complète** : Partially mitigated — existing upload controls retained; antivirus/quarantine remains external.
- **Gravité** : Moyenne
- **Confiance** : Confirmée par le code
- **Catégorie** : upload / malware
- **Référentiel** : OWASP file upload, CWE-434
- **Emplacement** : `/api/contact`, `lib/security/uploads.js`
- **Description** : les ZIP sont acceptés par extension/MIME/signature et envoyés à Google Drive sans scan observable.
- **Impact** : malware stocké et partagé à l'équipe; coût stockage.
- **Correction recommandée** : antivirus, quarantaine, désactivation ZIP ou extraction contrôlée.
- **Priorité** : P1/P2

## SEC-013 — Avatar stocké en data URL dans la base

- **Statut phase complète** : Open — avatar Storage migration deferred.
- **Gravité** : Faible
- **Confiance** : Confirmée
- **Catégorie** : stockage / disponibilité
- **Référentiel** : CWE-400
- **Emplacement** : `app/api/client/profile/avatar/route.js`
- **Description** : jusqu'à 2 MB image devient base64 en colonne profil; cela gonfle DB et réponses.
- **Impact** : coûts/performance, backups plus lourds.
- **Correction recommandée** : stockage objet privé/public contrôlé + URL.
- **Priorité** : P3

## SEC-014 — Actions GitHub non épinglées par SHA

- **Statut phase complète** : Open — action SHA pinning deferred to CI hardening pass.
- **Gravité** : Faible
- **Confiance** : Confirmée
- **Catégorie** : supply chain
- **Référentiel** : SLSA/GitHub hardening
- **Emplacement** : `.github/workflows/*.yml`
- **Description** : actions référencées par tag majeur.
- **Impact** : risque faible mais réel si tag/action compromis.
- **Correction recommandée** : pin SHA + Dependabot.
- **Priorité** : P3

## SEC-015 — Workflow CI sans permissions explicites minimales

- **Statut phase complète** : Open — CI permissions hardening deferred to workflow pass.
- **Gravité** : Faible
- **Confiance** : Confirmée
- **Catégorie** : CI/CD
- **Référentiel** : GitHub Actions hardening
- **Emplacement** : `.github/workflows/ci.yml`
- **Description** : pas de `permissions: contents: read` explicite dans CI.
- **Correction recommandée** : déclarer permissions minimales.
- **Priorité** : P3

## SEC-016 — `npm outdated` signale des mises à jour importantes

- **Statut phase complète** : Requires registry verification — npm registry remained unavailable in this environment.
- **Gravité** : Faible
- **Confiance** : Confirmée par commande
- **Catégorie** : dépendance
- **Référentiel** : OWASP A06 composants vulnérables
- **Emplacement** : `package.json`, `package-lock.json`
- **Description** : les commandes réseau npm ont été non concluantes dans cet environnement; le risque porte sur la nécessité de maintenir les packages à jour et de relancer les audits dans CI/registry autorisé.
- **Correction recommandée** : planifier upgrades testés, notamment Next.js.
- **Priorité** : P2/P3

## SEC-017 — Pas de tests automatisés sécurité dédiés observés

- **Statut phase complète** : Mitigated — security test suite expanded.
- **Gravité** : Faible
- **Confiance** : Confirmée
- **Catégorie** : tests
- **Référentiel** : ASVS verification
- **Emplacement** : dépôt global
- **Description** : pas de suite test auth/IDOR/webhooks/uploads/RLS observée.
- **Impact** : régressions sécurité plus probables.
- **Correction recommandée** : tests route handlers + E2E rôles + RLS.
- **Priorité** : P2

## SEC-018 — Configuration Vercel réelle non versionnée/non vérifiable

- **Statut phase complète** : Requires production verification — Vercel checklist added.
- **Gravité** : Information
- **Confiance** : Confirmée
- **Catégorie** : déploiement
- **Emplacement** : absence de `vercel.json`
- **Description** : aucun fichier Vercel ne documente headers, redirects, crons, protections preview.
- **Correction recommandée** : documenter environnements, secrets preview/prod, protection preview.

## SEC-019 — Paiements et webhooks absents mais à modéliser avant ajout

- **Statut phase complète** : Documented — entitlement/payment requirements added before future payment integration.
- **Gravité** : Information
- **Catégorie** : paiement / webhook
- **Description** : aucun Stripe/webhook actuel; ne pas réutiliser `/api/contact` ou success pages comme preuve d'achat future.

## SEC-020 — Bot Discord hors dépôt

- **Statut phase complète** : Out of scope — bot repository absent.
- **Gravité** : Information
- **Catégorie** : périmètre
- **Description** : seules pages publiques Discord sont présentes; le bot doit être audité dans son dépôt séparé.

## SEC-021 — Production, Supabase et secrets réels non accessibles

- **Statut phase complète** : Requires external verification — production/Supabase/Google checklist added.
- **Gravité** : Information
- **Catégorie** : limitation
- **Description** : les conclusions sur configuration externe exigent accès Vercel/Supabase/Google/Resend autorisé.
