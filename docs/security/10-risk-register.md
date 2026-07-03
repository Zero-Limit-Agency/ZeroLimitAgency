# 10 — Registre des risques

| ID | Gravité | Confiance | Zone | Résumé | Exploitable maintenant | Priorité |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | Élevée | Confirmée | Diagnostic | `/api/supabase/test` expose des checks Supabase hors production | Oui si preview/staging avec session admin | P0/P1 |
| SEC-002 | Élevée | Confirmée | OAuth/secrets | Tokens Google OAuth stockés sans chiffrement applicatif | Oui en cas d'accès DB/service-role | P0/P1 |
| SEC-003 | Élevée | Confirmée | Headers | CSP/frame/HSTS/referrer/permissions absents | Oui comme aggravant | P1 |
| SEC-004 | Élevée | Forte | Abuse | Rate limit mémoire non distribué/IP spoofable | Oui sur endpoints publics | P1 |
| SEC-012 | Moyenne | Confirmée | Upload | ZIP sans antivirus avant Drive | Oui via contact | P1/P2 |
| SEC-006 | Moyenne | Moyenne | Supabase | RLS policies non versionnées en migrations | À vérifier dynamiquement | P1 |
| SEC-007 | Moyenne | Confirmée | OAuth | Scope Google Drive trop large | Oui si token compromis | P1 |
| SEC-005 | Moyenne | Confirmée | Architecture | Service-role centralise les accès DB | Surtout risque de régression/future route | P1/P2 |
| SEC-008 | Moyenne | Forte | CSRF | Pas de CSRF/Origin check uniforme | Conditionnel | P2 |
| SEC-009 | Moyenne | Confirmée | Logs | Pas de journal d'audit admin | Exploitable post-incident | P2 |
| SEC-010 | Moyenne | Forte | Liens | URLs admin non validées centralement | Selon rendu des liens | P2 |
| SEC-011 | Moyenne | Confirmée | Info leak | `applicationId` renvoyé à l'anonyme | Oui, faible prérequis | P2 |
| SEC-017 | Faible | Confirmée | Tests | Pas de tests sécurité dédiés | Indirect | P2 |
| SEC-016 | Faible | Confirmée | Dépendances | Packages à revérifier dans un registre autorisé | Indirect | P2/P3 |
| SEC-013 | Faible | Confirmée | Stockage | Avatar base64 en DB | Oui mais impact limité | P3 |
| SEC-014 | Faible | Confirmée | CI/CD | Actions non pinées SHA | Faible probabilité | P3 |
| SEC-015 | Faible | Confirmée | CI/CD | Permissions CI non minimisées explicitement | Faible | P3 |
| SEC-018 | Information | Confirmée | Vercel | Config externe non vérifiable | n/a | P3 |
| SEC-019 | Information | Confirmée | Paiement | Stripe/webhooks absents aujourd'hui | n/a | P3 |
| SEC-020 | Information | Confirmée | Discord | Bot hors périmètre | n/a | P3 |
| SEC-021 | Information | Confirmée | Limitation | Production/secrets réels non accessibles | n/a | P3 |
