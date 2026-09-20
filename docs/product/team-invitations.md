# Invitations Team

Le serveur génère 32 octets aléatoires, transmet le secret dans le lien et ne conserve que son SHA-256. Le token n'est jamais journalisé. L'invitation expire après sept jours, est mono-usage, peut donner `admin` ou `member` (jamais owner) et seul le propriétaire canonique ou un admin peut l'émettre. Une invitation pending pour le même email normalisé et la même organisation est remplacée atomiquement.

À l'acceptation, la RPC verrouille la ligne, charge l'email canonique depuis `auth.users`, exige `email_confirmed_at`, puis vérifie hash, expiration, révocation, usage et égalité après `trim + lowercase` avec l'email de transport. Aucun traitement Gmail des points ou `+alias` n'est effectué. Ce contrôle sécurise uniquement l'acceptation initiale: le membership durable référence `profile.id`, jamais l'email. L'insertion membership est unique/idempotente, l'invitation est marquée acceptée et le Team Space est retourné dans la même transaction.

Un utilisateur déconnecté reçoit des liens connexion/inscription conservant uniquement une URL `/invitation/team/<token>` validée; toute autre destination retombe sur `/identite`. Resend est utilisé si `RESEND_API_KEY` et `ZERO_LIMIT_EMAIL_FROM` existent. Le lien brut est retourné si `VERCEL_ENV=preview`, ou en local sans `VERCEL_ENV` quand `NODE_ENV!=production`; il ne l'est jamais si `VERCEL_ENV=production`. Aucun token n'est écrit dans les logs.

Les cas invalide, expiré, révoqué, déjà utilisé, email différent et accès interdit ont des messages dédiés. La révocation UI, le transfert de propriété et la suppression complète seront des workflows futurs.
