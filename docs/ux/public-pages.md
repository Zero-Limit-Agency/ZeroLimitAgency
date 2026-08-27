# Surfaces publiques secondaires

## Périmètre

La coque publique secondaire couvre la maintenance globale, la page 404 et les documents publics suivants : mentions légales, politique de confidentialité, CGV, CGU et politique de remboursement. Les pages Discord restent une surface produit autonome et ne sont pas refondues dans ce chantier.

## Maintenance et 404

Ces deux pages emploient `MarketingShell`, les tokens `--zl-*`, `Badge` et `Button`. La maintenance conserve exactement le titre, le message et la note configurés côté serveur. Elle n'annonce ni délai ni état technique inventé ; le seul contact proposé est l'adresse publique existante. L'accès administrateur demeure discret mais accessible.

Leur shell d'état est une unique colonne flexible à hauteur minimale de viewport : le contenu principal absorbe seulement l'espace disponible et le footer suit immédiatement. Aucune hauteur de viewport supplémentaire n'est appliquée au `main`. Sur la maintenance, l'accès administrateur appartient à la carte, sous un séparateur discret, plutôt que de flotter sur la page.

La 404 adopte une composition éditoriale ouverte, sans carte fermée : message autonome, retour prioritaire vers l'accueil, accès secondaire au contact et grand « 404 » complet en arrière-plan. Sa metadata interdit l'indexation et le suivi ; la compréhension ne dépend pas du décor.

## Layout légal

`LegalPageTemplate` est la source unique du shell légal. Le hero compact utilise Playfair Display pour le titre et Manrope pour le texte long. La date n'est affichée que si le document en fournit déjà une. Les articles originaux sont conservés sans reformulation et reçoivent uniquement des ancres stables pour le sommaire.

La colonne éditoriale est limitée à 760 px. Les sections forment un document quasi transparent, guidé par un filet latéral, des séparateurs fins et le rythme typographique plutôt que par une succession de cartes. Sur desktop, le sommaire compact est sticky ; sous 960 px, il repasse dans le flux et devient une grille ; sous 680 px, il tient sur une colonne. `overflow-wrap: anywhere` protège les emails et URL longues, et les sections gardent une largeur minimale de zéro pour éviter tout débordement horizontal.

## Navigation, footer et réutilisation

Les pages secondaires réutilisent `PublicNavbar` et `PublicFooter`. `PublicNavbar` est volontairement la variante compacte des surfaces publiques secondaires ; elle complète la navbar marketing principale sans la remplacer sur la homepage. Les ancres de homepage sont toujours préfixées par `/`, afin de fonctionner depuis toute route. Le footer regroupe Zero Limit, Produits, Ressources, Agence et Informations, affiche la locale `FR` et ne publie aucun lien social générique ou placeholder.

Avant de créer une primitive publique, privilégier `Button`, `Badge`, `Card`, `Container`, `MarketingShell`, `PublicNavbar`, `PublicFooter` et `LegalPageTemplate`. Les styles supplémentaires doivent rester dans `components/marketing/marketing.css` et employer les tokens marketing existants.

## Accessibilité, responsive et SEO

Toutes les surfaces offrent un skip link, un `main` identifié, un `h1` unique, des landmarks explicites, des focus visibles et des cibles tactiles d'au moins 44 px. Le sommaire possède un nom accessible. Les effets sont décoratifs et les règles globales `prefers-reduced-motion` restent applicables.

Les points de contrôle sont 1440, 1280, 960, 768, 430, 390, 375 et 320 px. Pour les documents, vérifier en priorité les longues URL, les listes imbriquées et la navigation au sommaire. Les pages légales conservent des titres spécifiques ; la 404 est `noindex, nofollow`. Le mode maintenance conserve son comportement HTTP existant : aucune règle serveur ou canonical globale n'est ajoutée ici.
