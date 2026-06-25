# Audit design system Zero Limit — `/learn-youtube`

## Audit complet de l'implémentation `/learn-youtube`

- Le shell `LearnYoutubeShell` ne se limite pas à un fond : il impose une expérience produit complète avec header sticky centré, logo rond, navigation interne, CTA, menu mobile en `details`, badge admin de preview et contenu rendu dans un `<main>` immersif.
- Le JSX de `LearnYoutubeHome` alterne des familles de sections distinctes : hero immersif, rail de réassurance, progression en étapes, packs éditoriaux, aperçu d'interface, formateurs, offres, FAQ et CTA final.
- Les sous-composants locaux structurent la direction artistique : `SectionHeader`, `InterfacePreview`, `CardVisual` et `StepVisual` créent une hiérarchie répétable sans transformer chaque section en grille SaaS uniforme.
- Les données `learnYoutubeNavItems`, `learnYoutubeHighlights`, `learnYoutubeHowItWorks`, `learnYoutubePacks`, `learnYoutubeTrainerSlots`, `learnYoutubeOffers` et `learnYoutubeFaq` alimentent des blocs narratifs courts, faciles à scanner et organisés par intention utilisateur.
- Les visuels ne sont pas des images décoratives réutilisées partout : la page emploie des interfaces simulées, timelines, miniatures, roadmaps, panneaux de leçons et rails de progression qui donnent l'impression d'un produit en cours de conception.

## Ce qui vient du CSS

- Fond : dégradé noir profond `#16090c → #090405`, halos rose sombre et champagne, grille subtile fixe.
- Liquid Glass : surfaces sombres translucides, `backdrop-filter` saturé, bordure fine claire/champagne, reflet interne, ombre noire et halo premium.
- Couleurs : texte crème `#fff8f5`, texte secondaire translucide, champagne officiel `#e2bd82`, champagne clair `#f0d6aa`, champagne profond `#c99f67`.
- Formes : pills pour navigation/CTA/badges, cartes entre 24px et 42px, boutons arrondis à 999px.
- Interactions : hover court avec translation verticale, focus clavier très visible, transitions fluides et respect de `prefers-reduced-motion`.

## Ce qui vient du JSX et de la composition

- Hero très haut, centré verticalement, avec texte limité en largeur et grand visuel produit à côté ou sous le texte selon le viewport.
- Sections non uniformes : certaines sont centrées, d'autres en split asymétrique, d'autres en grands panneaux immersifs.
- Alternance entre contenu éditorial et visuels d'interface : la page raconte d'abord l'expérience, puis détaille les fonctionnalités.
- Les CTA ne sont pas isolés en bas : ils sont intégrés au hero, aux headers de section et au CTA final.
- Les cartes ne sont utilisées que lorsqu'elles hiérarchisent vraiment une information : étapes, packs, offres, FAQ ou état vide.
- La densité visuelle est premium mais respirante : beaucoup d'espace vertical, titres forts, paragraphes courts et rails de micro-informations.

## Principes de composition extraits

- Grandes sections immersives avec halos et grille discrète.
- Titres très visibles et textes limités en largeur.
- Blocs asymétriques et alternance média/texte.
- Visuels produit simulés lorsqu'aucun asset réel adapté n'existe, sans inventer de faux résultat métier.
- Liquid Glass réservé aux panneaux utiles : navigation, formulaires, cartes clés, dashboards et zones légales.
- Composition plus éditoriale que SaaS : rythme de lecture, narration et profondeur avant les petites grilles répétitives.
- Responsive mobile-first : les splits s'empilent, les visuels restent présents et les actions deviennent pleine largeur.

## Tokens globaux créés ou consolidés

- Tokens de fond : `--zl-bg`, `--zl-bg-soft`, `--zl-surface`, `--zl-surface-strong`, `--zl-glass`, `--zl-glass-soft`.
- Tokens texte : `--zl-text`, `--zl-text-muted`, `--zl-text-soft`.
- Tokens champagne : `--zl-gold`, `--zl-gold-light`, `--zl-gold-deep`, avec alias `--accent-gold`, `--zl-beige`, `--zl-beige-light`, `--zl-beige-deep`.
- Tokens structure : `--zl-border`, `--zl-border-strong`, `--zl-radius-*`, `--zl-shadow-*`, `--zl-blur-*`, `--zl-space-*`, `--zl-duration-*`, `--zl-ease`.

## Composants de composition créés

- `EditorialShell` : shell immersif noir/champagne avec grille et halos.
- `EditorialHero` : hero éditorial inspiré de `/learn-youtube`, avec texte fort, CTA, rail de meta et visuel produit.
- `SplitSection` : section asymétrique texte/média.
- `ImmersiveSection` : grande section centrée pour narration ou produit.
- `SectionHeader`, `SectionEyebrow` : hiérarchie de section réutilisable.
- `EditorialGrid`, `GlassFeatureCard` : cartes premium utiles, sans imposer une grille SaaS partout.
- `VisualShowcase`, `ProductInterfaceMock` : fallback visuel élégant pour pages sans image dédiée.
- `LargeCTASection` : CTA final premium.
- `DashboardComposition` : shell dashboard/client/admin avec header éditorial, actions et panneaux.

## Pages restructurées

- Accueil `/` : hero remplacé par une composition éditoriale avec grand visuel produit, meta rail et CTA secondaire vers l'univers Academy.
- Connexion `/connexion` : page transformée en expérience asymétrique avec hero immersif, mockup d'espace client et formulaire dans un panneau Liquid Glass dédié.
- Espace client `/espace-client` : shell restructuré avec `DashboardComposition`, header fort, actions et cartes larges.
- Admin `/admin` : header admin remplacé par une composition dashboard premium adaptée à la gestion, sans modifier la logique métier.
- Discord `/discord` : hero éditorial, visuel produit, split de présentation, étapes, sécurité et CTA légal.
- Pages légales via `LegalPageTemplate` : ajout d'un hero sobre mais cohérent avec meta de mise à jour et visuel document officiel.

## Routes couvertes par la migration

- `/`, `/connexion`, `/espace-client`, `/admin`, `/discord`, `/discord/terms`, `/discord/privacy`, `/discord/support`.
- `/learn-youtube` reste la référence visuelle et son module conserve la palette officielle.
- `/dropmap` était déjà proche de la structure `/learn-youtube` : shell produit, navigation sticky, hero, sections alternées et CTA final. Sa palette a été alignée.

## Nettoyage et limites

- Ancien doré `#d4aa6a` remplacé par les tokens champagne officiels.
- Les nouveaux composants évitent d'ajouter une nouvelle couche massive de CSS global ; la composition vit dans `components/design-system/editorial-compositions.*`.
- Les sélecteurs globaux ajoutés précédemment ont été resserrés pour éviter des règles trop larges sur tous les `input`, `textarea`, `select` ou `button` du site.
- Aucune logique métier, route, authentification, API, upload ou structure de données n'a été modifiée.
- Limite : validation visuelle navigateur complète non réalisée dans cet environnement faute de navigateur headless installé. Le build Next.js valide toutes les routes générées.
