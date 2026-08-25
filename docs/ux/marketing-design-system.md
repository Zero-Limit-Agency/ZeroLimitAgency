# Design system marketing Zero Limit

## Intention

La surface marketing associe une narration éditoriale premium à une interface fonctionnelle et calme. **Playfair Display raconte** (titres et chiffres forts), tandis que **Manrope permet d'utiliser** (navigation, corps, labels et actions). L'univers esport est exprimé par la précision, les données et la profondeur plutôt que par des codes RGB.

## Tokens

Les tokens publics sont centralisés dans `components/marketing/marketing.css` sous le préfixe `--zl-` afin de ne pas altérer les écrans historiques.

| Famille | Tokens principaux | Usage |
| --- | --- | --- |
| Couleurs | `--zl-bg`, `--zl-bg-deep`, `--zl-ivory`, `--zl-ink` | fonds et contrastes structurants |
| Accents | `--zl-soft`, `--zl-hot`, `--zl-gold` | hiérarchie, état actif et signature premium |
| Surfaces | `--zl-surface`, `--zl-surface-strong` | cartes translucides et navigation flottante |
| Bordures | `--zl-border`, `--zl-border-bright` | séparation discrète des surfaces |
| Rayons | `--zl-radius-sm` (18 px), `--zl-radius-md` (24 px), `--zl-radius-lg` (36 px), `--zl-pill` | cartes, previews et capsules |
| Profondeur | `--zl-shadow`, `--zl-glow` | élévation et glows bordeaux sobres |
| Layout | `--zl-container`, `--zl-narrow`, `--zl-section`, `--zl-gap` | largeurs, rythme vertical et espacement fluide |

Les tailles éditoriales utilisent `clamp()` et les grilles utilisent des unités fluides. Une valeur structurante nouvelle doit devenir un token avant d'être répétée.

## Composants

- `Button` propose `primary`, `secondary`, `ghost` et `destructive`, les tailles `sm`, `md`, `lg`, ainsi que les états hover, focus et disabled.
- `IconButton` fournit une cible tactile carrée et un libellé accessible obligatoire.
- `Badge`, `SectionHeading` et `Card` portent la hiérarchie commune.
- `FeatureCard`, `StatCard`, `TestimonialCard` et `PricingCard` couvrent les compositions récurrentes.
- `FAQItem` repose sur `details/summary`, donc reste accessible au clavier sans JavaScript.
- `MediaFrame` simule un aperçu produit sans intégrer de texte essentiel dans une image.
- `Navbar` et le footer de la homepage forment la coque marketing. Les icônes SVG outline sont regroupées dans `icons.jsx`.

Les composants n'embarquent pas de logique métier, d'authentification ou de données distantes. Le contenu éditorial est fourni par dictionnaire.

## Responsive

- **Mobile (< 680 px)** : pile verticale, CTA pleine largeur, cartes sur une colonne, preview simplifiée et menu dans un panneau tactile. Les éléments secondaires du mockup sont masqués sans perte de contenu essentiel.
- **Tablette (680–960 px)** : grilles à deux colonnes, hero reflué, preview large sous le récit et navigation en menu.
- **Desktop (> 960 px)** : compositions asymétriques, previews généreuses et grilles de trois colonnes.

Les cibles interactives ont une hauteur minimale de 44 px. Aucun contenu ou contrôle ne dépend du hover.

## Accessibilité et motion

- Un lien d'évitement mène au contenu principal, les zones utilisent `header`, `nav`, `main`, `section` et `footer`, et les titres suivent une hiérarchie `h1` / `h2` / `h3`.
- Les focus visibles emploient l'accent gold avec un décalage suffisant.
- Les images décoratives ont un alt vide ; les aperçus complexes exposent un libellé accessible.
- Les animations se limitent aux transitions d'élévation et de couleur. `prefers-reduced-motion` neutralise transitions et défilement animé.

## FR / EN

Les textes de la homepage sont lus depuis `lib/i18n/dictionaries.js` et le composant accepte une `locale`. Les deux locales déclarées gardent le même contrat de clés ; la copie française sert temporairement de contenu de repli anglais tant que la traduction éditoriale n'est pas validée. Les composants utilisent des largeurs fluides, du wrapping et évitent les hauteurs fixes afin d'accepter des traductions plus longues. Aucun texte essentiel n'est rasterisé.

## Conventions d'utilisation

1. Préfixer les styles marketing par `zl-` et limiter leur portée à `[data-surface="marketing"]` lorsque la règle concerne des éléments HTML globaux.
2. Composer une page avec les primitives plutôt que dupliquer une carte ou un bouton.
3. Ajouter la copie dans les dictionnaires avec des clés identiques pour `fr` et `en`.
4. Ne jamais présenter une donnée de démonstration comme un résultat client. Les prix non finalisés restent « À définir » et les témoignages restent explicitement vides.
5. Vérifier chaque évolution aux largeurs mobile, tablette et desktop, au clavier et avec réduction des animations.

## Workflow Dependency Review

Le workflow dédié `dependency-review.yml` a été supprimé : l'action GitHub Dependency Review échouait systématiquement car la fonctionnalité n'est pas disponible pour ce dépôt. Il n'existe pas de condition GitHub Actions fiable permettant de détecter cette disponibilité avant d'appeler l'action. Le workflow CI principal, son installation par `npm ci` et son build Next.js restent inchangés. Un contrôle de dépendances pourra être réintroduit dès qu'une fonctionnalité compatible sera activée.
