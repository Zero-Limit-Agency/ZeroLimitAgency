# 03 — Surface d'attaque et modèle de menaces

## Actifs prioritaires

- Comptes administrateurs et clients.
- Données personnelles des demandes : identité, email, date de naissance, message, statut.
- Tokens OAuth Google et accès Drive.
- Fichiers prospects, documents post-call, pièces jointes collaboration.
- Contenus de formation et settings Learn YouTube/DropMap.
- Réputation de l'agence, capacité d'envoi email, coûts API/stockage.

## Profils d'attaquants réalistes

| Profil | Objectifs probables |
| --- | --- |
| Visiteur anonyme | Spam contact, création de comptes, upload coûteux, découverte endpoints |
| Bot automatisé | Envoi massif formulaire/auth, énumération emails, coût Resend/Drive |
| Client authentifié | Accès à un autre dossier par `applicationId`, téléchargement non autorisé |
| Ancien client/suspendu | Réutiliser session ou URL pour accéder aux ressources |
| Admin compromis | Exfiltrer données, modifier contenus, connecter Drive malveillant |
| Attaquant preview Vercel | Exploiter endpoints non-production avec secrets preview |
| Dépendance npm compromise | Exécution en CI/install/build |
| Service tiers compromis | Google/Resend/Supabase/OpenAI selon intégrations |

## Scénarios d'attaque principaux

1. **Preview mal configurée** : un déploiement Vercel preview avec secrets réels et `NODE_ENV` non production expose `/api/supabase/test` à un admin compromis ou une session volée.
2. **Vol DB Supabase** : des tokens OAuth Google stockés en clair permettent d'accéder aux dossiers Drive liés aux prospects.
3. **Contournement rate limit** : un bot distribué ou spoofant `x-forwarded-for` spamme `/api/contact`, crée des comptes, fichiers Drive et emails.
4. **Régression d'autorisation future** : une nouvelle route admin oublie `requireAdminApiSession`; la service-role donne un accès total malgré RLS.
5. **Clickjacking/XSS tiers** : absence de CSP/frame-ancestors facilite l'exploitation d'une injection future ou l'encapsulation de pages sensibles.
6. **OAuth account linking** : si Google OAuth est élargi à YouTube/clients sans PKCE/association stricte, un compte ou une chaîne peut être lié au mauvais utilisateur.

## Zones d'attaque par fonctionnalité

- Auth : login, reset, password setup, cookies, redirections.
- API anonyme : contact, status.
- API client : collaboration, fichiers, avatar, newsletter.
- API admin : applications, activation, emails manuels, settings, uploads.
- OAuth : start/callback Google Drive.
- Stockage : Supabase Storage privé/public, Google Drive.
- CI/CD : Actions non pinées par SHA, previews Vercel non inspectées.
