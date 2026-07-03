# 16 — Training, paid tools, YouTube and AI security requirements

## Entitlements serveur

Toute formation, ressource, outil IA ou fonctionnalité premium doit utiliser un contrôle serveur :

```text
session utilisateur -> entitlement actif -> produit/pack autorisé -> ressource résolue côté serveur
```

La fondation `public.entitlements` et `requireEntitlement(user, productKey)` existe pour empêcher une future implémentation basée uniquement sur le frontend.

## Vidéos et ressources privées

- Stockage privé obligatoire.
- URL signée courte durée.
- Le serveur résout le fichier depuis une leçon autorisée; il ne signe jamais un chemin arbitraire fourni par le client.
- Révocation d'entitlement immédiatement prise en compte à la prochaine demande de signature.

## Paiement futur

- Prix calculé côté serveur.
- Produit dans allowlist serveur.
- Webhook signé et idempotent.
- Accès accordé uniquement depuis webhook confirmé.
- Remboursement/révocation met l'entitlement à `revoked`.

## YouTube futur

- OAuth state + PKCE.
- Scopes minimaux/progressifs.
- Tokens chiffrés avec le même modèle que Google OAuth.
- Association unique de chaîne à un compte sauf procédure explicite.
- Aucune publication/commentaire/suppression sans confirmation utilisateur et contrôle serveur.
- Audit log pour action publique.
- Quotas et rate limit par utilisateur.

## IA future

- Prompt injection prise en compte.
- Fichiers non fiables isolés.
- Données utilisateur séparées par session et entitlement.
- Sorties IA validées avant usage structuré.
- Budget/rate limit par utilisateur.
- Aucune action externe directe sans confirmation humaine ou règle serveur explicite.
- Pas de secrets dans prompts/logs.
