# Produit — Membres d’une Team

## Écran

La route `/espace/[spaceId]/membres` présente des groupes compacts Propriétaire, Admins et Membres. Tous les membres de la Team peuvent voir le nom public, le username, le rôle, l’indicateur propriétaire et la date d’arrivée des membres de leur propre Team. Aucun email de membre, identifiant Auth ou résultat d’une recherche globale n’est affiché.

Le propriétaire peut promouvoir/rétrograder et retirer tout non-propriétaire. Un admin peut uniquement retirer un membre simple ; il ne peut modifier aucun rôle ni gérer un autre admin. Un membre n’a aucune action de gestion. Les non-propriétaires peuvent quitter eux-mêmes la Team. Le propriétaire reçoit l’explication qu’un futur transfert sera requis.

Les retraits et départs prennent effet immédiatement. Les actions destructrices demandent confirmation. Les retours succès/erreur sont annoncés, les boutons ont une cible minimale de 44 px et les listes restent empilables à 768, 430, 390, 375 et 320 px, tout en restant compactes à 960, 1280 et 1440 px.

## États et erreurs

Les états « propriétaire seul », « aucun autre admin », « aucun membre simple » sont explicites et n’inventent aucune donnée. Les erreurs produit traduisent les codes stables : cible absente, owner protégé, permission insuffisante, accès déjà retiré et owner incapable de quitter. Une erreur inattendue affiche un correlation ID sans relayer SQL/PostgREST.

## Hors périmètre

Le transfert de propriété, la suppression d’organisation, les sièges, le billing et les modules métier Team ne font pas partie de cet écran.
