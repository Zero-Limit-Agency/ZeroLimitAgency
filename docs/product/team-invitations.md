# Produit — Invitations Team

## Cycle de vie

Un propriétaire ou admin invite une adresse email avec le rôle `admin` ou `member`. Le serveur génère un token aléatoire, n’en stocke que le hash et limite le lien à sept jours. L’acceptation exige une session dont l’email vérifié correspond, verrouille l’invitation, crée la membership de la bonne organisation et conserve les audits `team_invitation_created` / `team_invitation_accepted`.

Seuls owner/admin voient les invitations actives (email de transport, rôle, création, expiration et éventuel nom public de l’invitant). Un membre simple ne voit pas ces emails. La table source n’est jamais rendue librement sélectionnable et les read models n’exposent ni token, ni `token_hash`.

## Renvoyer et révoquer

Renvoyer génère un nouveau token côté serveur, verrouille la même invitation pending, remplace atomiquement l’ancien hash et l’expiration, puis envoie le nouveau lien. L’ancien lien devient immédiatement inutilisable et il n’existe jamais deux tokens valides concurrents pour cette invitation. L’événement `team_invitation_resent` ne contient aucun token.

Révoquer renseigne `revoked_at` sous verrou. L’opération répétée est idempotente, l’acceptation ultérieure échoue et `team_invitation_revoked` est audité. Une invitation déjà acceptée ne peut être révoquée ou renvoyée.

Les mutations accept/revoke/resend se sérialisent sur la ligne d’invitation. La première transaction validée détermine l’état que la suivante revalide. Les confirmations protègent la révocation accidentelle.

## Évolutions futures

Le nombre d’invitations ou membres pourra alimenter un futur calcul de sièges au niveau de l’abonnement Organization. Aucun modèle de siège, abonnement, paiement ou Stripe n’est introduit ici.
