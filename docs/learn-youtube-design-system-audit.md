# Audit design system Zero Limit — `/learn-youtube`

## Audit CSS actuel

- `/learn-youtube` porte l'identité la plus aboutie du site : noir profond, champagne chaud, surfaces translucides, blur fort, bordures fines, halos discrets et grille décorative.
- Le reste du site utilisait déjà des bases proches, mais avec des variantes dispersées : ancien doré `#d4aa6a`, panneaux légèrement différents, boutons secondaires hétérogènes et styles de formulaires répétés.
- Le CSS global contenait des styles redondants pour les zones marketing, auth, client, admin, pages légales et DropMap. La migration a donc été faite par consolidation de tokens et par couche de composants globale, sans copier le module CSS de `/learn-youtube` dans chaque page.

## Caractéristiques extraites de `/learn-youtube`

- Fond : dégradé noir profond `#16090c → #090405`, halos rose sombre et champagne, grille subtile fixe.
- Liquid Glass : surfaces sombres translucides, `backdrop-filter` saturé, bordure fine claire/champagne, reflet interne, ombre noire et halo premium.
- Couleurs : texte crème `#fff8f5`, texte secondaire translucide, champagne officiel `#e2bd82`, champagne clair `#f0d6aa`, champagne profond `#c99f67`.
- Formes : pills pour navigation/CTA/badges, cartes entre 24px et 32px, boutons arrondis à 999px.
- Interactions : hover court avec translation verticale, focus clavier très visible, transitions fluides et respect de `prefers-reduced-motion`.
- Hiérarchie : titres serif premium, corps Manrope, grands titres, eyebrows en capsules, cartes espacées.

## Tokens globaux créés ou consolidés

- Tokens de fond : `--zl-bg`, `--zl-bg-soft`, `--zl-surface`, `--zl-surface-strong`, `--zl-glass`, `--zl-glass-soft`.
- Tokens texte : `--zl-text`, `--zl-text-muted`, `--zl-text-soft`.
- Tokens champagne : `--zl-gold`, `--zl-gold-light`, `--zl-gold-deep`, avec alias `--accent-gold`, `--zl-beige`, `--zl-beige-light`, `--zl-beige-deep`.
- Tokens structure : `--zl-border`, `--zl-border-strong`, `--zl-radius-*`, `--zl-shadow-*`, `--zl-blur-*`, `--zl-space-*`, `--zl-duration-*`, `--zl-ease`.

## Composants et familles harmonisés

- Navigation publique : `.site-header`, `.nav-shell`, `.nav-cta`.
- Boutons : `.button`, `.button-primary`, `.button-dark`, `.button-secondary`, boutons de formulaires.
- Cartes/verre : cartes marketing, légales, auth, client, admin et panneaux principaux.
- Formulaires : inputs, textareas, selects, labels, placeholders, focus et disabled.
- Badges/états : `.eyebrow`, `.status-pill`, `.client-status-pill`, `.auth-kicker`.
- Animations/accessibilité : hover lift commun, focus visible global, `prefers-reduced-motion` global.

## Routes migrées par la couche globale

- Accueil : `/`.
- Référence visuelle conservée : `/learn-youtube`.
- Auth : `/connexion`, `/connexion/definir-mot-de-passe`.
- DropMap : `/dropmap`, `/admin/dropmap`.
- Client : `/espace-client`, `/espace-client/[applicationId]`.
- Admin : `/admin`, `/admin/[applicationId]`.
- Discord : `/discord`, `/discord/terms`, `/discord/privacy`, `/discord/support`.
- Légal : `/mentions-legales`, `/conditions-generales-d-utilisation`, `/conditions-generales-de-vente`, `/politique-de-confidentialite`, `/politique-de-remboursement`.

## Nettoyage et limites

- Ancien doré `#d4aa6a` remplacé par les tokens champagne officiels.
- Les conflits visuels majeurs sont traités via tokens et couche de composants commune.
- Aucune logique métier, route, authentification, API, upload ou structure de données n'a été modifiée.
- Limite : validation visuelle navigateur complète non réalisée dans cet environnement faute de navigateur headless installé. Le build Next.js valide toutes les routes générées.
