# Workspace Visual Foundation

## Périmètre et audit initial

Cette fondation couvre le shell privé et les routes génériques `/espace`, `/espace/[spaceId]`, `/settings`, `/membres`, `/preparation/[kind]` et l'activation existante. Avant cette phase, le shell reposait sur une topbar unique, un switcher central et une navigation de modules conditionnelle. Les pages employaient directement des classes globales pour leurs titres, formulaires, cartes, listes, états vides et retours. Les réglages et membres conservaient déjà leurs contrôles d'autorité côté serveur et leurs actions métier côté client.

La phase ne modifie ni route, modèle, registry, permission, entitlement, membership, lifecycle, provisioning, Billing, Integration Core, Auth, ni OWNER. L'activation reste une route serveur inchangée.

## Architecture visuelle

Le Workspace hérite de la DA Master V2, avec une interprétation produit plus dense et calme :

- **surface 0** : fond continu warm-black/bordeaux avec micro-grille et une lumière ambiante faible ;
- **surface 1** : panel principal chaud et opaque, sans glass blur systématique ;
- **surface 2** : carte secondaire très légère ;
- **surface 3** : inset et état interactif ;
- **accent** : rose pour l'actif, gold uniquement pour l'identité Team/Owner ;
- **typographie** : Manrope pour toute l'UI, Playfair seulement pour les titres de page.

Les styles sont isolés dans `app/espace/workspace.css` sous `.workspace-root` afin de ne pas faire grossir `globals.css` et de ne pas affecter Auth ou OWNER.

## Shell et navigation

Le shell distingue trois niveaux courts :

1. la barre globale Zero Limit (marque, switcher, profil et déconnexion) ;
2. la barre de contexte du Space (aperçu, modules existants, membres Team, paramètres et état) ;
3. le header propre à la page (contexte, titre, statut, description, actions).

Le switcher conserve sa logique et ses URLs. Il expose désormais visuellement le type du Space, sa profession ou son rôle Team, son nom et l'espace actif. Échap ferme toujours le menu et rend le focus au déclencheur.

## Composants

`PageHeader` normalise les titres et actions. `StatusBadge` limite les statuts aux tons neutre, rose actif, gold et destructif. Les boutons ont quatre intentions visuelles : primary ivoire, secondary chaud, ghost et destructive. Les formulaires réutilisent les proportions DA V2 (labels Manrope, champs 48 px, focus rose, aide atténuée).

Les settings sont organisés en résumé, sections de champs et zone dangereuse isolée. Les membres sont présentés en lignes plutôt qu'en mosaïque de cards ; Owner, admin, member et « vous » restent lisibles sans changer leurs permissions. Les états vides gardent un message réel et ne créent aucune fausse donnée.

### Polish Preview

- les métadonnées Settings forment une bande légère avec dividers, sans card par propriété ;
- les formulaires restent dans un seul panel et utilisent spacing et séparateurs pour leurs sections ;
- le type visible est toujours écrit au singulier « Team » ;
- le slug est présenté comme un « Identifiant d’URL », avec une aide compréhensible ;
- les groupes membres vides sont compactés, tandis que les groupes remplis conservent leurs lignes ;
- les cartes de l’index affichent type, nom, profession éventuelle et statut sans couleur propre par Space ;
- le CTA Settings du contenu a été retiré puisque la navigation du Space fournit déjà exactement cette destination.

## Responsive et accessibilité

- large desktop : shell aligné sur le container produit ;
- laptop/tablet : grilles 3 → 2 et profil condensé ;
- mobile : topbar sur deux rangées, contexte horizontal scrollable, actions empilées, listes membres recomposées ;
- gutters minimum de 16 px sur les plus petits écrans ;
- cibles principales d'au moins 44 px, focus visible, labels et headings sémantiques ;
- `aria-expanded`, `aria-current`, rôles menu/status/alert existants conservés ;
- transitions brèves et neutralisées avec `prefers-reduced-motion`.

## Dette volontaire

Cette phase ne fournit pas de nouvelles pages métier, illustrations, analytics, tabs ou skeletons. Les modules existants pourront adopter ces primitives progressivement. Une revue visuelle sur Preview avec données réelles reste requise avant de sortir la PR du mode Draft.
