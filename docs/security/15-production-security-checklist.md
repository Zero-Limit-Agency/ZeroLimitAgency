# 15 — Production security checklist

## Vercel Production

- [ ] `OAUTH_TOKEN_ENCRYPTION_KEY` défini uniquement côté serveur.
- [ ] `RATE_LIMIT_PROVIDER=redis`.
- [ ] `RATE_LIMIT_REDIS_URL` et `RATE_LIMIT_REDIS_TOKEN` configurés.
- [ ] `RATE_LIMIT_FAIL_CLOSED=true` après validation.
- [ ] Previews protégées et ne recevant pas automatiquement les secrets production.
- [ ] Aucun ancien déploiement ne sert `/api/supabase/test`.
- [ ] Headers vérifiés dans le navigateur : CSP, HSTS, nosniff, referrer, permissions.
- [ ] Logs Vercel vérifiés sans token/cookie/password.

## Supabase

- [ ] Appliquer `20260703_google_oauth_token_encryption.sql`.
- [ ] Appliquer `20260703_security_policies_and_entitlements.sql`.
- [ ] Exécuter `scripts/security/verify-supabase-security.sql`.
- [ ] Confirmer RLS activée sur tables sensibles.
- [ ] Confirmer policies owner/admin attendues.
- [ ] Confirmer buckets `post-call-zero` et `client-collaboration` privés.
- [ ] Confirmer `site-assets` ne contient que des assets admin sûrs.
- [ ] Vérifier absence de plaintext OAuth après migration/reconnexion.

## Google OAuth / Drive

- [ ] Redirect URI production exact.
- [ ] Redirect URI preview uniquement si nécessaire.
- [ ] Révocation testée.
- [ ] Reconnexion testée après chiffrement.
- [ ] Scope Drive large accepté temporairement ou plan de réduction validé.

## Tests manuels production non destructifs

- [ ] Anonyme refusé sur admin/API admin.
- [ ] Client refusé sur API admin.
- [ ] Client A refusé sur ressource client B.
- [ ] Admin autorisé sur routes admin.
- [ ] Password reset réponse générique.
- [ ] Rate limit 429 sur environnement de test.
- [ ] Google OAuth fonctionne après migration.
- [ ] Uploads valides acceptés et invalides refusés.
