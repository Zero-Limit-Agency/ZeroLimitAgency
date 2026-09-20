# Provisioning Team

Le parcours Team sépare création et jonction par invitation. Nom et slug modifiable sont validés serveur; le slug est globalement unique. `provision_team` garantit l'atomicité Organization + membership admin déclenché + Team Space principal + `team_access`. Le propriétaire vient exclusivement de `organizations.owner_profile_id`.

Un double clic avec le même nom/slug récupère le résultat initial; un slug occupé par un autre contexte est refusé. Les admins/propriétaires voient ensuite le formulaire d'invitation. Aucun code organisation générique et aucune recherche globale de profils ne sont exposés.
