# Fondation d’implémentation

## État retenu

Le dépôt reste une application Next.js App Router unique, déployable sur Vercel et ciblant Node.js 20. Cette phase conserve les routes, composants et services existants : elle ajoute seulement des frontières explicites sur lesquelles les évolutions pourront s’appuyer.

```text
app/                         routes et layouts Next.js existants
components/
  shared/                    primitives UI sans logique métier
  marketing/                 composition du site public
  workspace/                 composition des futurs espaces authentifiés
  admin/, auth/, client/…    fonctionnalités historiques conservées
lib/
  i18n/                      locales, résolution et dictionnaires
  applications/              candidatures uniquement (système historique)
  auth/, security/…          services serveur existants
```

Les composants `MarketingShell` et `WorkspaceShell` matérialisent les futures surfaces sans déplacer les routes actuelles. `Container` est la première primitive partagée et reste compatible avec la classe globale historique du même nom. Aucun de ces composants n’est branché à une page pendant cette phase afin de ne provoquer aucune refonte visuelle implicite.

## Conventions

- Les composants de route orchestrent l’affichage ; la logique métier importante vit dans `lib/` et les contrôles d’autorisation définitifs s’exécutent côté serveur.
- `components/shared` ne dépend d’aucun domaine produit. Les composants propres à une surface restent dans `components/marketing` ou `components/workspace`.
- Les données du navigateur et des utilisateurs sont non fiables. Discord et les fonctionnalités AI sont des intégrations, jamais des sources de vérité.
- Le répertoire historique `lib/applications` reste exclusivement consacré aux candidatures. Il ne doit pas modéliser les identités, organisations, équipes ou workspaces futurs.
- Les nouveaux modules privilégient des contrats indépendants de l’UI afin de rester réutilisables par une future application desktop.
- Les imports applicatifs peuvent utiliser l’alias `@/` déjà employé par le dépôt. Les noms techniques restent en anglais.

## Séparation marketing / app

Le site public et l’application partagent les primitives visuelles, mais pas leurs navigations, layouts ni règles d’accès. Les nouveaux écrans publics seront composés sous la frontière `marketing`; les futurs espaces Personal, Creator et Team sous la frontière `workspace`. Un futur déplacement vers des groupes de routes tels que `(marketing)` et `(workspace)` ne devra être fait qu’avec un inventaire des URL, métadonnées et redirections, pour préserver les fonctionnalités actuelles.

Les routes `admin`, `connexion`, `espace-client`, `learn-youtube`, `dropmap`, les pages légales et les API existantes restent en place. Le layout racine demeure le socle documentaire commun ; le layout `admin` conserve aujourd’hui son contrôle serveur dédié.

## Stratégie responsive

- Concevoir mobile-first, puis introduire les adaptations tablette et desktop selon le contenu plutôt que selon un appareil précis.
- Utiliser des largeurs fluides, `minmax`, `clamp` et la primitive `Container`; éviter les dimensions fixes pour les zones structurantes.
- Tester au minimum les états de navigation, formulaires, tableaux et contenus longs aux trois familles de largeur.
- Garder les interactions utilisables au clavier et au tactile, respecter le zoom et les préférences de réduction des animations.

Le CSS global actuel contient à la fois des tokens, des règles de base et de nombreux styles de pages. Il peut rester pour préserver le rendu, mais devra être séparé progressivement en fondations globales, tokens et styles colocaux lors de la modification des écrans concernés.

## Stratégie i18n

`lib/i18n/config.js` définit `fr` comme locale de repli et déclare dès maintenant `fr` et `en`. `lib/i18n/dictionaries.js` fournit une interface minimale de dictionnaire, sans imposer prématurément une bibliothèque ou une stratégie d’URL.

Tout nouveau texte d’interface réutilisable doit provenir d’un dictionnaire et conserver les mêmes clés dans les deux langues. Le contenu éditorial ou distant sera traité séparément des libellés d’interface. Avant d’ajouter des routes localisées, il faudra décider et documenter la détection de langue, la persistance de préférence, la forme des URL et les métadonnées SEO (`hreflang`, canonical et sitemap).

## Limites de cette phase

- Aucun écran, homepage ou parcours d’authentification n’est créé ou remanié.
- Zero Limit ID, Personal, Creator, Team, billing, Orbits et OWNER ne sont pas implémentés.
- Aucun schéma, client, secret ou environnement Supabase n’est modifié ; aucune migration locale ou distante n’est exécutée.
- Les chaînes françaises historiques ne sont pas migrées en masse.
- Aucun choix définitif de bibliothèque UI ou i18n n’est fait. Les dépendances UI restent actuellement React et le CSS natif ; aucune nouvelle dépendance n’est nécessaire.
- Zero Limit TV et Zero Limit Talents restent hors périmètre.

## Risques et dette observés

- Les surfaces marketing, authentifiées et d’administration cohabitent encore directement sous `app/`; les déplacer sans cartographie préalable pourrait casser des URL ou des redirections.
- `app/globals.css` porte des responsabilités très larges, ce qui augmente le risque de régressions visuelles lors de futures évolutions.
- Le layout racine fixe encore la langue du document à `fr` et charge les polices depuis Google ; la future intégration i18n devra rendre l’attribut `lang` cohérent avec la locale résolue et évaluer la stratégie de polices pour la robustesse du build et la confidentialité.
- Les noms historiques `client` et `applications` peuvent encourager un couplage avec le futur modèle de workspace. Le nouveau modèle devra disposer de frontières et d’entités distinctes.

## Prochaines étapes

1. Cartographier les routes et responsabilités existantes avant tout déplacement, puis définir les groupes de routes marketing et workspace en préservant les URL.
2. Définir les entités et contrats serveur de Zero Limit ID et des workspaces indépendamment de `applications`, sans encore modifier Supabase.
3. Choisir la stratégie d’URL et de négociation de locale, puis connecter les dictionnaires au layout sans migrer aveuglément les contenus historiques.
4. Extraire progressivement les tokens et primitives du CSS global à l’occasion des changements d’écran, avec tests responsive et accessibilité.
5. Traiter ensuite l’authentification et la homepage dans des lots séparés et revus.
