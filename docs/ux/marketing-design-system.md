# Design system marketing Zero Limit

## Intention

La surface marketing associe une narration éditoriale premium à une interface fonctionnelle et calme. **Playfair Display raconte** (titres et chiffres forts), tandis que **Manrope permet d'utiliser** (navigation, corps, labels et actions). L'univers esport est exprimé par la précision, les données et la profondeur plutôt que par des codes RGB.

## Tokens

Les tokens publics sont centralisés dans `components/marketing/marketing.css` sous le préfixe `--zl-` afin de ne pas altérer les écrans historiques.

| Famille | Tokens principaux | Usage |
| --- | --- | --- |
| Couleurs | `--zl-bg`, `--zl-bg-deep`, `--zl-ivory`, `--zl-ink` | fonds et contrastes structurants |
| Accents | `--zl-soft`, `--zl-hot`, `--zl-strong`, `--zl-focus` | hiérarchie rose, magenta et focus |
| Surfaces | `--zl-surface`, `--zl-surface-strong` | cartes translucides et navigation flottante |
| Bordures | `--zl-border`, `--zl-border-bright` | séparation discrète des surfaces |
| Rayons | `--zl-radius-sm` (18 px), `--zl-radius-md` (24 px), `--zl-radius-lg` (36 px), `--zl-pill` | cartes, previews et capsules |
| Profondeur | `--zl-shadow`, `--zl-glow` | élévation et glows bordeaux sobres |
| Layout | `--zl-container`, `--zl-narrow`, `--zl-section`, `--zl-gap` | largeurs, rythme vertical et espacement fluide |

Les tailles éditoriales utilisent `clamp()` et les grilles utilisent des unités fluides. Une valeur structurante nouvelle doit devenir un token avant d'être répétée.


### Palette autorisée et interdite

La hiérarchie marketing repose sur les fonds `#0C0507`, `#12090B` et `#16080D`, les surfaces prune `#2A0C16`, `#3D0E1B` et `#501126`, le rose doux `#B15F73`, le magenta `#D01974` et l’ivoire `#FFF8F5`. Les accents autorisés sont exclusivement **bordeaux, prune, rose, magenta et ivoire**. Le **gold, jaune, ambre, ocre et beige chaud comme accent de marque sont interdits** sur la surface marketing. Le token gold historique peut subsister ailleurs pour compatibilité, mais ne doit pas être appelé ici.

Les textes principaux utilisent l’ivoire et les textes secondaires un ivoire à 70 % minimum sur les fonds sombres. Les bordures ne portent jamais seules une information.

## Composants

- `Button` propose `primary`, `secondary`, `ghost` et `destructive`, les tailles `sm`, `md`, `lg`, ainsi que les états hover, focus et disabled.
- `IconButton` fournit une cible tactile carrée et un libellé accessible obligatoire.
- `Badge`, `SectionHeading` et `Card` portent la hiérarchie commune.
- `FeatureCard`, `StatCard`, `TestimonialCard` et `PricingCard` couvrent les compositions récurrentes.
- `FAQItem` repose sur `details/summary`, donc reste accessible au clavier sans JavaScript.
- `MediaFrame` simule un aperçu produit sans intégrer de texte essentiel dans une image.
- `Navbar` et le footer de la homepage forment la coque marketing. Les icônes SVG outline sont regroupées dans `icons.jsx`.
- `PublicNavbar` et `PublicFooter` prolongent cette coque sur les pages secondaires. Le footer partagé ne contient que des routes publiques vérifiées et expose les groupes Produits, Ressources, Agence et Informations.
- `LegalPageTemplate` compose automatiquement le hero, la date fournie par le document, le sommaire et la colonne de lecture sans modifier le texte juridique.

Les composants n'embarquent pas de logique métier, d'authentification ou de données distantes. Le contenu éditorial est fourni par dictionnaire.


## Placeholders et données de démonstration

Les previews peuvent montrer des états neutres (« Étape 3/5 », « En cours », « Cette semaine »), accompagnés de la mention « Données de démonstration ». Témoignages, études de cas et offres restent visuellement complets pour faciliter la projection, mais portent « Contenu de démonstration — à remplacer avant publication ». Aucun nom de personne, entreprise, résultat chiffré ou citation réaliste ne doit être inventé.

## Responsive

- **Mobile (< 680 px)** : pile verticale, CTA pleine largeur, cartes sur une colonne, preview simplifiée et menu dans un panneau tactile. Les éléments secondaires du mockup sont masqués sans perte de contenu essentiel.
- **Tablette (680–960 px)** : grilles à deux colonnes, hero reflué, preview large sous le récit et navigation en menu.
- **Desktop (> 960 px)** : compositions asymétriques, previews généreuses et grilles de trois colonnes.

Les cibles interactives ont une hauteur minimale de 44 px. Aucun contenu ou contrôle ne dépend du hover.

## Accessibilité et motion

- Un lien d'évitement mène au contenu principal, les zones utilisent `header`, `nav`, `main`, `section` et `footer`, et les titres suivent une hiérarchie `h1` / `h2` / `h3`.
- Les focus visibles emploient un rose clair dédié (`--zl-focus`) avec un décalage suffisant.
- Les images décoratives ont un alt vide ; les aperçus complexes exposent un libellé accessible.
- Les animations se limitent aux transitions d'élévation et de couleur. `prefers-reduced-motion` neutralise transitions et défilement animé.

## FR / EN

Les textes de la homepage sont lus depuis `lib/i18n/dictionaries.js` et le composant accepte une `locale`. Les deux locales déclarées gardent le même contrat de clés ; la copie française sert temporairement de contenu de repli anglais tant que la traduction éditoriale n'est pas validée. Les composants utilisent des largeurs fluides, du wrapping et évitent les hauteurs fixes afin d'accepter des traductions plus longues. Aucun texte essentiel n'est rasterisé.

## Conventions d'utilisation

1. Préfixer les styles marketing par `zl-` et limiter leur portée à `[data-surface="marketing"]` lorsque la règle concerne des éléments HTML globaux.
2. Composer une page avec les primitives plutôt que dupliquer une carte ou un bouton.
3. Ajouter la copie dans les dictionnaires avec des clés identiques pour `fr` et `en`.
4. Ne jamais présenter une donnée de démonstration comme un résultat client. Les prix non finalisés restent « Tarif à venir » et les témoignages de démonstration sont explicitement identifiés.
5. Vérifier chaque évolution aux largeurs mobile, tablette et desktop, au clavier et avec réduction des animations.

## Workflow Dependency Review

Le workflow dédié `dependency-review.yml` a été supprimé : l'action GitHub Dependency Review échouait systématiquement car la fonctionnalité n'est pas disponible pour ce dépôt. Il n'existe pas de condition GitHub Actions fiable permettant de détecter cette disponibilité avant d'appeler l'action. Le workflow CI principal, son installation par `npm ci` et son build Next.js restent inchangés. Un contrôle de dépendances pourra être réintroduit dès qu'une fonctionnalité compatible sera activée.

## Finition du rythme

Les sections produit et les zones de projection (`Espaces`, `Tools`, conférences, Team, Certified, résultats et offres) utilisent `zl-section--compact`, soit une réduction modérée du rythme vertical sans toucher aux sections signature, à Zero Limit AI ou au CTA final. Sous 390 px, le titre du hero utilise un clamp dédié afin de préserver son impact sans monopoliser le premier écran. Les cartes métier partagent leur structure mais disposent chacune d'un pictogramme outline issu de la bibliothèque existante ; cette différenciation n'ajoute aucune couleur.

## Hiérarchie chromatique officielle

**BORDEAUX = BRAND · IVOIRE = CONTRAST · ROSE = ACCENT · MAGENTA = SPARING HIGHLIGHT.** Les surfaces, bordures, icônes et textes informatifs privilégient le bordeaux profond, le prune, `#8F455A`, `#743246`, l'ivoire et les gris rosés atténués. Le magenta fort `#D01974` est réservé à un point focal ponctuel — progression de mockup, état actif important ou lumière de glow — et ne doit jamais devenir la couleur dominante d'une page. Les glows peuvent conserver une faible composante magenta, perçue comme une lumière issue du bordeaux.

## Structure des offres

La structure commerciale présentée sur la homepage est **Personal / Creator / Team**. Personal correspond à un espace spécialisé pour un métier — Coach, Manager / Agent, CEO / Dirigeant ou Community Manager — et un même Zero Limit ID pourra à terme posséder plusieurs espaces Personal distincts. Creator est l'espace séparé des métiers créatifs esport. Team est l'espace organisationnel destiné aux membres, staffs, joueurs, rôles, tâches, calendriers et outils communs. Aucun produit générique « Pro » ne doit être présenté sur la homepage.
