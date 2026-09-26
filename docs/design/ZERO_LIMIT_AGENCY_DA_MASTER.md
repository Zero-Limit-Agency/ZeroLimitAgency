# ZERO LIMIT AGENCY — DIRECTION ARTISTIQUE MASTER SPEC

**Version :** 1.0  
**Date :** 21 septembre 2026  
**Périmètre :** site principal Zero Limit Agency, sous-sites, landing pages, pages produit/formation, dashboards marketing et previews publiques.  
**Source visuelle :** analyse de cinq captures d'écran de la landing « Formation YouTube ».  
**Statut :** document de référence à injecter dans les prompts de design et de développement.

> **Règle d'autorité** — Quand ce fichier est fourni dans un prompt, il doit être considéré comme la référence visuelle par défaut de Zero Limit Agency. Une demande explicite du prompt peut modifier ponctuellement une règle ; sinon, préserver cette DA.

---

## 0. Résumé ultra-court à donner à une IA

Zero Limit Agency doit avoir une esthétique **dark premium, éditoriale et très maîtrisée**, à mi-chemin entre un site de maison créative haut de gamme, une interface Apple/macOS sombre et une direction artistique digitale contemporaine. Le fond est presque noir mais jamais noir pur : il tire vers le **bordeaux brun / prune très sombre**, avec des **halos rose-magenta très diffus**. Les textes principaux sont en **blanc cassé chaud**, pas en blanc clinique. Les grands titres utilisent une **serif Didone / éditoriale à fort contraste**, très grande, serrée et spectaculaire. Toute l'interface fonctionnelle utilise une **sans-serif neutre et précise** de type SF Pro / Inter / Geist. Les cartes sont larges, peu nombreuses, respirantes, avec des **coins généreusement arrondis**, des bordures 1 px à faible contraste, des surfaces translucides et des gradients bordeaux/rose subtils. Les boutons principaux sont blanc cassé, texte très sombre, forme capsule. Les micro-accents utilisent le rose-magenta et, exceptionnellement, un **or mat** chaud. L'ensemble doit sembler cher, calme, cinématique, pas « gaming », pas néon, pas surchargé.

---

# 1. ADN VISUEL

## 1.1. Les mots-clés

La DA peut être résumée par les notions suivantes :

- **Premium** : sensation d'objet numérique soigné, peu d'éléments mais tous précis.
- **Editorial** : très grands titres serif, compositions typographiques assumées, hiérarchie proche d'un magazine haut de gamme.
- **Cinematic dark** : grandes zones sombres, halos colorés localisés, profondeur plutôt que couleurs franches.
- **Mac-like / Apple-like** : micro-bordures, verre sombre, contrôles simples, rayons continus, spacing calme, pas d'effets agressifs.
- **Bordeaux + rose** : identité chaude, sophistiquée, organique ; le rose sert à créer de la lumière, pas à transformer toute la page en rose.
- **Soft luxury** : blanc cassé, gris chauds, or mat ponctuel, contraste élevé mais non clinique.
- **Tech créatif** : interfaces et mockups très propres, barres de progression, fenêtres, cartes et métriques abstraites.
- **Confiance** : grands blocs, alignements propres, copy courte, absence de surcharge.

## 1.2. Ce que la DA NE doit PAS devenir

Ne jamais dériver vers :

- un style e-sport agressif / cyberpunk ;
- du rose néon saturé partout ;
- une landing SaaS générique bleu/violet ;
- du glassmorphism très transparent avec reflets arc-en-ciel ;
- des ombres lourdes type material design ;
- des cartes partout en grille 3×N sans respiration ;
- des bordures blanches trop visibles ;
- des titres sans-serif énormes qui supprimeraient le caractère éditorial ;
- du noir `#000000` utilisé comme unique fond ;
- des gradients multicolores ;
- des icônes multicolores ou 3D cartoon ;
- des rayons incohérents d'un composant à l'autre ;
- du texte intégralement blanc pur ;
- une densité d'information de dashboard sur les pages marketing.

---

# 2. PRINCIPES DE COMPOSITION

## 2.1. Répartition visuelle générale

Sur une page marketing Zero Limit, viser approximativement :

- **75–85 %** de surfaces très sombres ;
- **8–15 %** de surfaces bordeaux / verre chaud / panneaux ;
- **4–8 %** de blanc cassé et gris clair, principalement via la typographie et les CTA ;
- **1–3 %** de rose-magenta visible ;
- **< 1 %** d'or chaud, facultatif.

La couleur doit apparaître davantage comme **lumière ambiante** que comme aplats francs.

## 2.2. Rythme vertical

Les captures montrent un design qui laisse volontairement beaucoup de vide. Cette respiration est essentielle :

- un hero peut occuper **85 à 100 vh** ;
- les grandes sections peuvent avoir **140 à 220 px** de marge verticale sur desktop ;
- entre un eyebrow/pill et un H2 : **28–40 px** ;
- entre un H2 et son paragraphe : **18–28 px** ;
- entre la description et un CTA : **28–40 px** ;
- entre un bloc de texte central et une démonstration visuelle : **64–100 px**.

Le site ne doit jamais donner l'impression de « vouloir tout montrer au-dessus de la ligne de flottaison ».

## 2.3. Largeurs

Références recommandées :

- **Container principal** : `min(1280px, calc(100vw - 64px))`.
- **Container étroit texte** : 760–920 px.
- **Hero headline** : 900–1080 px max sur desktop.
- **Paragraphe hero** : 680–820 px.
- **Grande carte / mockup** : 1100–1220 px.
- **Navbar flottante** : 1180–1260 px.

Sur ultra-large écran, ne pas étirer arbitrairement le contenu. Le fond peut remplir l'écran, le contenu reste contenu.

## 2.4. Alignement

La DA supporte deux familles de sections :

1. **Sections centrales éditoriales** : eyebrow, grand titre centré, sous-texte centré, CTA centré, visuel centré.
2. **Sections éditoriales asymétriques** : titre à gauche ou en grille 5/7, mais toujours avec beaucoup d'espace négatif.

Ne pas alterner constamment les structures uniquement pour « faire différent ». La cohérence est plus importante que la variété.

---

# 3. PALETTE DE COULEURS

Les valeurs ci-dessous sont **reconstruites à partir des captures**. Elles doivent être utilisées comme design tokens, puis ajustées légèrement si le rendu réel diffère à cause du navigateur ou d'un écran.

## 3.1. Couleurs fondamentales

| Token | Valeur | Usage |
|---|---:|---|
| `--zl-void` | `#090405` | fond le plus sombre, footer, zones de contraste |
| `--zl-bg` | `#0F0608` | fond global recommandé |
| `--zl-bg-warm` | `#15090B` | fond principal chaud observé |
| `--zl-bg-plum` | `#1C0B10` | variation prune très sombre |
| `--zl-surface-1` | `#211317` | cartes et surfaces légères |
| `--zl-surface-2` | `#2D2325` | verre chaud / UI interne |
| `--zl-surface-3` | `#3E3134` | surbrillance de surface, jamais en masse |
| `--zl-burgundy-900` | `#2A0913` | extrémité sombre des gradients |
| `--zl-burgundy-800` | `#3B0D1B` | panneaux / glows |
| `--zl-burgundy-700` | `#53172A` | gradients modérés |
| `--zl-burgundy-600` | `#6A263C` | zones éclairées |
| `--zl-pink-500` | `#C81C70` | accent rose principal |
| `--zl-pink-400` | `#D82A7D` | hover / highlight court |
| `--zl-pink-soft` | `#AA2460` | rose atténué |
| `--zl-gold` | `#BE965E` | micro-accent chaud optionnel |
| `--zl-ivory` | `#FEFAF7` | texte héro, CTA blanc, contraste principal |
| `--zl-text-1` | `#F3EEEB` | texte standard clair |
| `--zl-text-2` | `#B8AEAD` | paragraphes secondaires |
| `--zl-text-3` | `#8E8384` | labels faibles, métadonnées |
| `--zl-line` | `rgba(255,245,245,.10)` | bordures normales |
| `--zl-line-strong` | `rgba(255,245,245,.16)` | bordures hover / panneaux centraux |

## 3.2. Blancs

Le blanc principal doit être **chaud**. Préférer `#FEFAF7` à `#FFFFFF`.

Pourquoi : le fond est rouge-brun. Un blanc légèrement chaud réduit la sensation « noir et blanc clinique » et renforce l'aspect éditorial/luxe.

`#FFFFFF` peut subsister dans une icône ou un détail minuscule mais ne doit pas être le texte dominant.

## 3.3. Gris

Les gris doivent garder une légère composante chaude. Éviter les gris bleutés comme `#94A3B8`.

Bon spectre :

- `#DAD1CF`
- `#B8AEAD`
- `#A49B9A`
- `#8E8384`
- `#706467`
- `#4B3F42`

## 3.4. Rose

Le rose n'est pas un fond principal. Il sert à :

- éclairer un coin de section ;
- créer une ligne de progression ;
- teinter une carte ;
- créer un focus/hover subtil ;
- identifier une donnée importante ;
- créer un glow sous un mockup ;
- distinguer un état actif.

Un accent rose doit généralement occuper **moins de 10 % du composant**.

## 3.5. Or

Le petit point doré vu dans les pills peut être conservé comme accent secondaire, à condition qu'il reste **mat** et très rare. Le rôle de l'or est éditorial/premium, pas « luxe cliché ».

Éviter : gradients or brillants, textes dorés massifs, bordures or autour de toutes les cartes.

---

# 4. GRADIENTS ET LUMIÈRE

Le gradient Zero Limit est une **lumière diffuse dans un univers sombre**, pas un fond graphique démonstratif.

## 4.1. Background global

```css
background:
  radial-gradient(900px 620px at 30% 78%, rgba(128, 19, 62, .16), transparent 68%),
  radial-gradient(820px 560px at 72% 28%, rgba(107, 31, 54, .10), transparent 72%),
  linear-gradient(180deg, #15090B 0%, #100608 48%, #090405 100%);
```

Le glow doit être presque imperceptible à première vue. Il se remarque surtout parce qu'il empêche le fond d'être plat.

## 4.2. Hero glow

```css
background:
  radial-gradient(700px 440px at 30% 85%, rgba(170, 25, 92, .16), transparent 72%),
  radial-gradient(780px 500px at 65% 30%, rgba(90, 30, 45, .10), transparent 70%);
```

Le glow peut traverser plusieurs composants, il ne doit pas sembler « enfermé » dans un rectangle.

## 4.3. Grand CTA / panneau bordeaux

```css
background:
  radial-gradient(90% 120% at 18% 0%, rgba(255,255,255,.07), transparent 55%),
  linear-gradient(135deg, #6A3540 0%, #65152F 43%, #3A0C1C 72%, #25070F 100%);
```

Ajouter un léger éclairage interne en haut/gauche et une zone plus sombre en bas/droite.

## 4.4. Surface UI premium

```css
background:
  linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.012)),
  rgba(29, 18, 21, .82);
backdrop-filter: blur(22px) saturate(115%);
```

## 4.5. Barre de progression rose

```css
background: linear-gradient(90deg, #D21D73 0%, #C52870 45%, #784252 100%);
```

La fin peut perdre en saturation pour fusionner dans l'UI plutôt que devenir un arc-en-ciel.

## 4.6. Règles de gradient

- 2 à 4 stops maximum ;
- même famille chromatique ;
- saturation faible hors accent ;
- pas de cyan, violet électrique ou bleu dans la DA principale ;
- les halos doivent avoir un grand rayon ;
- éviter les petits spots lumineux très nets ;
- utiliser l'opacité pour obtenir de la profondeur ;
- si le gradient attire plus l'œil que le titre, il est trop fort.

---

# 5. TYPOGRAPHIE

La typographie est l'élément le plus distinctif de cette DA.

## 5.1. Police Display / grands titres

La police exacte ne peut pas être certifiée depuis une capture raster, mais la famille visuelle est clairement une **Didone / Modern Serif éditoriale à fort contraste**, dans un territoire Bodoni / Editorial.

### Choix recommandé pour reproductibilité web

**Bodoni Moda** — recommandation principale si une police libre et simple à déployer est nécessaire.

```css
font-family: "Bodoni Moda", "Times New Roman", serif;
```

Réglages de départ :

```css
font-weight: 500; /* 500 à 600 selon le rendu */
letter-spacing: -0.045em;
line-height: .90;
font-optical-sizing: auto;
```

### Alternatives proches

- **PP Editorial New** : option premium/licenciée, très adaptée à l'intention éditoriale.
- **Bodoni 72 / Bodoni MT** : option système/licenciée selon environnement.
- **Canela** : plus douce et organique, à utiliser si l'on veut une DA plus culture/fashion.
- **Instrument Serif** : plus expressive ; utile pour des pages éditoriales mais légèrement moins stricte.
- **Cormorant Garamond** : alternative gratuite possible mais plus classique, moins « moderne premium ».

### Règle importante

Si le projet existant contient déjà une font display qui produit les mêmes formes et proportions que les captures, **ne pas la remplacer arbitrairement**. Préserver la famille existante et reprendre surtout les règles de taille, tracking, line-height et contraste.

## 5.2. Typographie UI / corps

La sans-serif doit ressembler à une interface Apple moderne : neutre, dense, lisible, sans personnalité excessive.

Ordre recommandé :

```css
font-family:
  Inter,
  Geist,
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Segoe UI",
  sans-serif;
```

**Inter** ou **Geist** offrent le meilleur compromis web. SF Pro peut être utilisé dans des contextes compatibles, mais ne doit pas être supposé disponible partout.

## 5.3. Échelle typographique desktop

### Hero XL

- `font-size: clamp(72px, 7.2vw, 126px)`
- `line-height: .86–.92`
- `letter-spacing: -0.05em`
- `font-weight: 500–600`
- largeur idéale : 900–1100 px
- 2 à 4 lignes maximum

### H2 éditorial

- `font-size: clamp(56px, 5.2vw, 88px)`
- `line-height: .90–.96`
- `letter-spacing: -0.045em`
- 2 à 4 lignes

### H3 éditorial / cartes

- 30–44 px
- `line-height: 1.0–1.08`
- `letter-spacing: -0.025em`

### Body large

- 17–20 px
- `line-height: 1.5–1.65`
- 400/450 weight
- `color: var(--zl-text-2)`

### Body normal

- 15–17 px
- `line-height: 1.5–1.65`

### UI label / nav

- 13–15 px
- 600–700
- tracking : `-0.01em` à `0`

### Eyebrow / pill

- 12–14 px
- 600–700
- pas d'uppercase forcé sauf contexte précis

## 5.4. Comportement mobile

Les titres ne doivent pas devenir minuscules. Sur mobile :

- Hero : 46–58 px en général ;
- H2 : 42–50 px ;
- body : 16–17 px ;
- conserver le contraste serif/sans ;
- line-height du display : environ `.92–.98` ;
- adapter les sauts de lignes à la largeur au lieu de réduire excessivement la taille.

## 5.5. Casse et ponctuation

La DA préfère une écriture éditoriale française naturelle :

- casse phrase, pas de ALL CAPS systématique ;
- ponctuation assumée dans les titres ;
- phrases courtes ;
- pas de jargon marketing artificiel ;
- un point final sur un grand titre peut renforcer l'aspect éditorial.

---

# 6. « STYLE MAC » — DÉFINITION PRÉCISE

Le « style Mac » observé ne doit pas être interprété comme copier macOS au pixel près. Il repose sur les principes suivants :

1. **Fenêtres aux grands rayons** avec cadre fin et profond.
2. **Surfaces sombres semi-translucides**, plus claires que le fond sans devenir grises.
3. **Micro-bordures 1 px** avec très faible contraste.
4. **Petits marqueurs circulaires** / traffic lights décoratifs, très désaturés.
5. **Espacement important** entre éléments.
6. **Contrôles capsule** et boutons très simples.
7. **Pas de shadow cartoon** ; profondeur obtenue par contrastes locaux + blur + lumière.
8. **Typographie sans-serif très neutre** pour l'interface.
9. **Animations courtes et physiques**, jamais rebondissantes.
10. **Hiérarchie claire** : une action principale, le reste s'efface.

---

# 7. SURFACES, CARTES ET VERRE

## 7.1. Carte standard

```css
.zl-card {
  background: rgba(36, 23, 27, .72);
  border: 1px solid rgba(255, 245, 245, .10);
  border-radius: 28px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.025),
    0 30px 90px -60px rgba(0,0,0,.95);
  backdrop-filter: blur(20px) saturate(112%);
}
```

## 7.2. Panneau principal

- radius : 30–36 px ;
- bordure : 1 px, blanc/rose à 10–14 % ;
- padding desktop : 44–64 px ;
- le panneau peut être plus large qu'un container texte mais doit conserver de grandes marges latérales.

## 7.3. Carte interne / vignette

- radius : 18–24 px ;
- fond légèrement plus clair ;
- hauteur stable ;
- illustration abstraite ton-sur-ton ;
- peu ou pas de texte dans la zone visuelle.

## 7.4. Transparence

Le glass effect doit rester discret. Une surface doit encore avoir une **couleur propre**, et ne pas dépendre uniquement de `backdrop-filter`.

---

# 8. BORDURES

Les bordures font partie du langage premium.

### Standard

```css
border: 1px solid rgba(255, 245, 245, .09);
```

### Strong

```css
border-color: rgba(255, 245, 245, .15);
```

### Teinte bordeaux

```css
border-color: rgba(186, 53, 93, .18);
```

### Important

Une bordure ne doit presque jamais être plus forte qu'un texte secondaire. Elle structure sans dessiner brutalement les boîtes.

---

# 9. RAYONS

Utiliser une échelle courte et cohérente :

```css
--radius-sm: 12px;
--radius-md: 18px;
--radius-lg: 24px;
--radius-xl: 30px;
--radius-2xl: 36px;
--radius-pill: 999px;
```

Usage :

- controls simples : 12–18 px ;
- petites cartes : 18–24 px ;
- cartes majeures : 28–36 px ;
- navbar et buttons : pill ou 18–24 px selon taille.

Éviter les coins carrés sauf séparateurs ou éléments techniques internes.

---

# 10. OMBRES ET PROFONDEUR

La DA n'utilise pas d'ombre grise visible. La profondeur se construit en trois niveaux :

1. différence de luminosité entre fond et surface ;
2. bordure 1 px ;
3. ombre noire très large et très diffuse.

Exemple :

```css
box-shadow:
  0 1px 0 rgba(255,255,255,.02) inset,
  0 30px 80px -48px rgba(0,0,0,.95),
  0 0 90px -50px rgba(186,28,103,.22);
```

L'ombre rose est facultative et doit être très faible.

---

# 11. NAVBAR

La navbar observée est une **capsule flottante** centrée, visuellement indépendante du bord de l'écran.

## Structure recommandée

- largeur desktop : 1180–1260 px ;
- hauteur : 64–76 px ;
- margin-top : 18–28 px ;
- fond : `rgba(25, 11, 15, .72)` ;
- blur : 20–28 px ;
- radius : 999 px ou 28–36 px ;
- bordure : 1 px à 8–12 % ;
- logo/brand à gauche ;
- navigation centrale ;
- action secondaire + CTA à droite.

## Brand block

Le logo peut être logé dans un petit cercle/badge bordeaux plus saturé. À côté :

- ligne 1 : « Zero Limit » semi-bold ;
- ligne 2 facultative : produit / contexte en 11–12 px muted.

## Liens

- 13–14 px ;
- weight 600 ;
- couleur muted claire ;
- hover : proche de l'ivory ;
- pas de soulignement lourd.

## CTA navbar

Le CTA blanc doit être très lisible :

- `background: #FEFAF7` ;
- `color: #160A0D` ;
- pill ;
- padding horizontal généreux ;
- pas de gradient dans le bouton principal.

---

# 12. BUTTON SYSTEM

## 12.1. Primary

```css
.zl-button-primary {
  background: #FEFAF7;
  color: #160A0D;
  border: 1px solid rgba(255,255,255,.85);
  border-radius: 999px;
  min-height: 50px;
  padding: 0 24px;
  font: 650 15px/1 Inter, sans-serif;
  letter-spacing: -.015em;
}
```

Hover :

- très légère baisse de luminosité ou translation `translateY(-1px)` ;
- ombre douce ;
- transition 180–220 ms.

## 12.2. Secondary dark

```css
background: rgba(255,255,255,.025);
border: 1px solid rgba(255,255,255,.13);
color: #F3EEEB;
```

## 12.3. Tertiary

Texte seul / lien avec une petite flèche. Ne pas mettre trois boutons pleins côte à côte.

## 12.4. Motion

```css
transition:
  transform 180ms cubic-bezier(.2,.8,.2,1),
  background-color 180ms ease,
  border-color 180ms ease,
  color 180ms ease;
```

Active : `transform: translateY(0) scale(.985)`.

---

# 13. PILLS / EYEBROWS

Le petit badge au-dessus des grands titres est un motif récurrent.

Structure :

- hauteur : 34–40 px ;
- padding : 0 14–16 px ;
- radius : 999 px ;
- fond : `rgba(255,255,255,.035)` ;
- bordure : 1 px `rgba(255,255,255,.10)` ;
- texte : 12–13 px / weight 650 ;
- couleur : `#DAD1CF` ;
- dot facultatif : 6–8 px.

Dot :

- rose pour une DA Zero Limit générique ;
- or chaud pour une catégorie premium/éditoriale ;
- ne jamais multiplier plusieurs couleurs dans la même page sans raison sémantique.

---

# 14. HERO

Le hero doit être **typographique avant d'être illustratif**.

Ordre de lecture :

1. navbar ;
2. beaucoup de respiration ;
3. pill/eyebrow ;
4. headline très grand ;
5. description courte ;
6. 1 à 2 CTA ;
7. mockup/interface ou preuve visuelle plus bas.

## Règles du headline

- texte court ;
- 2 à 4 lignes ;
- largeur contrôlée ;
- serif display ;
- blanc cassé ;
- très fort contraste avec le fond ;
- pas de gradient dans les lettres comme traitement par défaut.

## Sous-titre

Le body sous le hero doit être **nettement plus discret** : 18–20 px, chaud/gris, 1–2 lignes si possible.

## Transition vers le contenu

Un grand mockup partiellement visible sous la ligne de flottaison crée une continuation naturelle. Il n'est pas nécessaire de forcer un motif de vague ou un séparateur décoratif.

---

# 15. MOCKUPS ET INTERFACES DANS LE MARKETING

Le mockup de produit doit ressembler à un logiciel réel mais rester suffisamment abstrait pour ne pas surcharger le hero.

## Frame

- radius 28–34 px ;
- surface `#21161A` à `#3E3134` ;
- border 1 px ;
- top bar 42–54 px ;
- 3 petits dots gris/or ;
- beaucoup d'espace interne.

## Contenu

- panels internes sombres ;
- progress bars ;
- titres courts ;
- lignes UI 1 px ;
- aucune couleur vive sauf accent actif ;
- illustrations abstraites plutôt que screenshots illisibles.

## Règle

Sur une landing, le mockup doit renforcer l'impression de produit. Il ne doit pas ressembler à une image Photoshop plaquée sans cohérence avec le système de design.

---

# 16. CARTES DE PRÉSENTATION / BENTO

Les captures montrent un groupe de trois cartes dans un grand conteneur. Pour reproduire cette logique :

- 3 cartes maximum sur une rangée desktop ;
- un conteneur parent unique avec bordure commune peut être utilisé ;
- illustration abstraite en haut ;
- texte dans la partie basse ;
- petits séparateurs verticaux implicites ;
- surfaces très proches en luminosité.

Les illustrations internes doivent rester dans la palette : barres grises, anneaux de progression, volumes bordeaux, micro-accent or/rose.

---

# 17. FAQ

La FAQ doit être une grande surface calme, pas une liste de cartes séparées.

### Conteneur

- 1100–1220 px ;
- radius 28–34 px ;
- background très sombre chaud ;
- border subtile ;
- padding horizontal 36–44 px.

### Item

- hauteur min : 64–76 px ;
- question weight 600–650 ;
- chevron petit à droite ;
- séparateur très faible ou aucun séparateur si le spacing suffit ;
- animation d'ouverture 180–260 ms ;
- réponse `color: var(--zl-text-2)`.

Éviter les gros `+` agressifs et les boxes indépendantes autour de chaque question.

---

# 18. GRAND CTA DE FIN

Le CTA de fin est un moment plus lumineux, mais doit rester dans la palette.

### Composition

- grand rectangle arrondi ;
- gradient bordeaux/rose profond ;
- eyebrow ;
- H2 serif blanc cassé ;
- description courte ;
- bouton primary ivoire ;
- contenu centré ;
- beaucoup de padding.

### Dimensions desktop

- 1100–1220 px de large ;
- 560–680 px de haut selon contenu ;
- radius 30–36 px ;
- padding vertical 90–120 px.

Ne pas ajouter des illustrations pour remplir le vide si le titre suffit.

---

# 19. FOOTER

Le footer doit être simple et presque invisible :

- ligne supérieure 1 px très faible ;
- brand + contexte à gauche ;
- mentions / legal au centre ou dans une colonne ;
- copyright à droite ;
- 13–14 px ;
- `text-2/text-3` ;
- padding haut 40–56 px ;
- padding bas 44–64 px ;
- pas de gros footer à 5 colonnes si le contenu ne le justifie pas.

---

# 20. GRILLE ET SPACING TOKENS

Base recommandée : 4 px, avec une préférence pour les multiples de 8.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
--space-40: 160px;
--space-48: 192px;
```

Le code peut utiliser des valeurs intermédiaires si nécessaire, mais il faut garder un rythme global stable.

---

# 21. LAYOUT RESPONSIVE

## Desktop ≥ 1280 px

- container 1200–1280 px ;
- navbar flottante complète ;
- H1 92–126 px ;
- grandes respirations ;
- cartes 3 colonnes possibles.

## Laptop 1024–1279 px

- container `calc(100vw - 48px)` ;
- H1 72–96 px ;
- réduire légèrement les paddings mais pas la qualité typographique.

## Tablet 768–1023 px

- nav simplifiée ;
- H1 60–78 px ;
- sections 100–140 px ;
- bento 2+1 ou 1 colonne ;
- grand CTA moins haut.

## Mobile ≤ 767 px

- gutters : 18–24 px ;
- H1 46–58 px ;
- H2 40–50 px ;
- navbar compacte ;
- boutons capables de passer en colonne ;
- cards en 1 colonne ;
- section spacing 84–112 px ;
- radius principaux 22–28 px ;
- CTA final 56–72 px vertical ;
- aucun texte ne doit toucher les bords ;
- conserver les halos mais réduire leur intensité pour éviter un écran saturé.

---

# 22. MOTION DESIGN

L'animation doit donner de la **fluidité**, pas attirer l'attention pour elle-même.

## Durées

- micro interaction : 140–200 ms ;
- button/card hover : 180–240 ms ;
- accordion : 220–300 ms ;
- apparition de section : 450–700 ms ;
- grandes transitions : 600–900 ms maximum.

## Easing

Préférence :

```css
cubic-bezier(.2,.8,.2,1)
```

ou :

```css
cubic-bezier(.22,1,.36,1)
```

## Scroll reveal

- opacity 0 → 1 ;
- translateY 18–32 px → 0 ;
- blur 4–8 px → 0, facultatif ;
- stagger 50–90 ms ;
- éviter les slides horizontaux massifs.

## Parallax

Très léger. Si perceptible immédiatement, il est probablement trop fort.

## Reduced motion

Toujours respecter `prefers-reduced-motion: reduce`.

---

# 23. ICÔNES ET ILLUSTRATIONS

## Icônes

- outline simple ;
- stroke 1.5–2 px ;
- style Lucide / SF Symbols-like ;
- blanc cassé / muted ;
- accent rose seulement pour l'état actif ;
- taille habituelle 16–22 px.

## Illustrations

Privilégier :

- graphismes abstraits ;
- anneaux de progression ;
- histogrammes sans chiffres ;
- fenêtres UI ;
- grands aplats floutés ;
- gradients internes ton-sur-ton.

Éviter les illustrations vectorielles SaaS « personnages qui travaillent ».

---

# 24. IMAGES ET VIDÉOS

Si une page utilise du contenu photo/vidéo :

- grader légèrement vers le chaud / magenta sombre ;
- privilégier les noirs profonds ;
- réduire les couleurs concurrentes ;
- arrondir selon le système de radius ;
- ajouter un overlay subtil si du texte est superposé ;
- pas de cadre blanc ;
- possibilité d'un glow bordeaux derrière le média.

Les images doivent donner la sensation d'appartenir au même monde que l'UI.

---

# 25. ACCESSIBILITÉ

La DA premium ne doit pas sacrifier la lisibilité.

- texte principal sur fond : viser WCAG AA ;
- body secondaire : ne pas descendre trop bas en contraste ;
- focus visible obligatoire, idéalement ring rose clair + offset sombre ;
- zones cliquables min. 44×44 px ;
- FAQ utilisable au clavier ;
- états hover complétés par des états focus ;
- ne pas encoder une information uniquement par la couleur ;
- `prefers-reduced-motion` ;
- éviter les body < 15 px sur desktop et < 16 px sur mobile.

Exemple focus :

```css
outline: 2px solid rgba(216, 42, 125, .82);
outline-offset: 3px;
```

---

# 26. COPY ET TON VISUEL

Même si ce document concerne la DA, le texte influence fortement le résultat visuel.

## Titres

Préférer :

- phrases nettes ;
- verbes d'action ;
- promesse compréhensible ;
- 4 à 12 mots ;
- rythme éditorial ;
- pas de slogans génériques type « Unlock your potential » si une formulation concrète est possible.

## Sous-titres

1 à 3 lignes, informationnels, sans répéter le H1.

## CTA

Actions courtes :

- Découvrir le programme
- Voir l'expérience
- Explorer les talents
- Accéder à l'espace
- Découvrir le projet

Pas de longues phrases dans les boutons.

---

# 27. DIFFÉRENCIATION SITE MARKETING / PRODUIT

## Site marketing

- serif display très présente ;
- sections cinématiques ;
- grands espacements ;
- dégradés et glows ;
- visuels de produit mis en scène.

## Dashboard / logiciel

La même identité doit être conservée mais adaptée :

- sans-serif dominante ;
- serif réservée aux titres importants, welcome states ou grandes pages de contexte ;
- densité plus élevée ;
- plus de surfaces `surface-1/2` ;
- gradients moins fréquents ;
- rose utilisé sémantiquement pour action/active/brand ;
- lisibilité fonctionnelle prioritaire.

Ne pas transformer chaque écran du logiciel en landing page.

---

# 28. SOUS-SITES ZERO LIMIT

Chaque sous-site peut avoir un **micro-accent contextualisé**, mais les fondamentaux restent fixes :

**Fixes :**

- fond warm-black/bordeaux ;
- ivory ;
- serif display ;
- sans UI ;
- radius ;
- spacing ;
- panneaux verre ;
- rose Zero Limit.

**Variables :**

- accent secondaire ;
- composition des illustrations ;
- degré de densité ;
- copy ;
- contenu média.

Ainsi, `learn.`, `talents.`, `tv.`, `ai.`, etc. peuvent être identifiables sans devenir des marques séparées visuellement.

---

# 29. DESIGN TOKENS CSS — BASE PRÊTE À COPIER

```css
:root {
  /* Backgrounds */
  --zl-void: #090405;
  --zl-bg: #0F0608;
  --zl-bg-warm: #15090B;
  --zl-bg-plum: #1C0B10;
  --zl-surface-1: #211317;
  --zl-surface-2: #2D2325;
  --zl-surface-3: #3E3134;

  /* Brand */
  --zl-burgundy-900: #2A0913;
  --zl-burgundy-800: #3B0D1B;
  --zl-burgundy-700: #53172A;
  --zl-burgundy-600: #6A263C;
  --zl-pink-500: #C81C70;
  --zl-pink-400: #D82A7D;
  --zl-pink-soft: #AA2460;
  --zl-gold: #BE965E;

  /* Text */
  --zl-ivory: #FEFAF7;
  --zl-text-1: #F3EEEB;
  --zl-text-2: #B8AEAD;
  --zl-text-3: #8E8384;

  /* Lines */
  --zl-line: rgba(255,245,245,.10);
  --zl-line-strong: rgba(255,245,245,.16);
  --zl-line-brand: rgba(200,28,112,.20);

  /* Radius */
  --zl-radius-sm: 12px;
  --zl-radius-md: 18px;
  --zl-radius-lg: 24px;
  --zl-radius-xl: 30px;
  --zl-radius-2xl: 36px;
  --zl-radius-pill: 999px;

  /* Layout */
  --zl-container: 1240px;
  --zl-text-container: 820px;
  --zl-gutter: clamp(20px, 3.2vw, 48px);

  /* Motion */
  --zl-ease: cubic-bezier(.2,.8,.2,1);
  --zl-ease-out: cubic-bezier(.22,1,.36,1);
  --zl-fast: 180ms;
  --zl-normal: 260ms;
  --zl-slow: 620ms;

  /* Shadows */
  --zl-shadow-card: 0 30px 90px -60px rgba(0,0,0,.95);
  --zl-shadow-glow: 0 0 100px -60px rgba(200,28,112,.30);
}

html {
  background: var(--zl-void);
  color-scheme: dark;
}

body {
  margin: 0;
  color: var(--zl-text-1);
  font-family: Inter, Geist, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
  background:
    radial-gradient(900px 620px at 30% 78%, rgba(128,19,62,.16), transparent 68%),
    radial-gradient(820px 560px at 72% 28%, rgba(107,31,54,.10), transparent 72%),
    linear-gradient(180deg, var(--zl-bg-warm) 0%, var(--zl-bg) 48%, var(--zl-void) 100%);
}

.zl-display {
  font-family: "Bodoni Moda", "Times New Roman", serif;
  font-weight: 550;
  letter-spacing: -.045em;
  line-height: .92;
  color: var(--zl-ivory);
  text-wrap: balance;
}
```

---

# 30. TAILWIND — INTENTION DE CONFIGURATION

Si le projet utilise Tailwind, mapper les tokens au lieu de disperser des couleurs arbitraires :

```ts
// Extrait indicatif
colors: {
  zl: {
    void: '#090405',
    bg: '#0F0608',
    warm: '#15090B',
    plum: '#1C0B10',
    surface1: '#211317',
    surface2: '#2D2325',
    burgundy: '#53172A',
    pink: '#C81C70',
    pinkLight: '#D82A7D',
    gold: '#BE965E',
    ivory: '#FEFAF7',
    text: '#F3EEEB',
    muted: '#B8AEAD',
  }
}
```

Créer des composants utilitaires `zl-panel`, `zl-pill`, `zl-button-primary`, `zl-display` si nécessaire plutôt que recopier 15 classes différentes et laisser la DA dériver.

---

# 31. RÈGLES POUR FIGMA

## Styles à créer

### Color styles

- BG / Void
- BG / Warm
- BG / Plum
- Surface / 1
- Surface / 2
- Surface / 3
- Brand / Burgundy
- Brand / Pink
- Brand / Pink Light
- Accent / Gold
- Text / Primary
- Text / Secondary
- Text / Tertiary
- Border / Default
- Border / Strong

### Text styles

- Display / Hero
- Display / H2
- Display / H3
- Sans / Body Large
- Sans / Body
- Sans / Label
- Sans / Small
- UI / Button
- UI / Nav

### Effects

- Shadow / Card
- Glow / Pink Subtle
- Blur / Glass 20
- Blur / Glass 28

### Components

- Navbar desktop
- Navbar mobile
- Button / Primary / Secondary / Tertiary
- Pill / Rose / Gold
- Card / Standard
- Card / Feature
- Window mockup
- FAQ row
- CTA final
- Footer

## Auto layout

Tout composant doit utiliser Auto Layout. Ne pas placer du texte manuellement au pixel sauf pour une composition exceptionnellement artistique.

---

# 32. CHECKLIST DE VALIDATION VISUELLE

Avant de considérer une page terminée, vérifier :

- [ ] Le fond n'est pas noir pur et possède une chaleur bordeaux/prune.
- [ ] Le rose est une lumière/accent, pas une couleur dominante.
- [ ] Le grand titre est bien en serif éditoriale à fort contraste.
- [ ] Les textes UI sont en sans-serif neutre.
- [ ] Le H1 est réellement grand et possède un line-height serré.
- [ ] Le texte principal est ivoire, pas blanc clinique partout.
- [ ] Les paragraphes secondaires sont assez muted mais restent lisibles.
- [ ] Les sections respirent largement.
- [ ] Les cartes sont peu nombreuses et larges.
- [ ] Les bordures sont fines et presque transparentes.
- [ ] Les coins sont généreusement arrondis et cohérents.
- [ ] Les ombres sont diffuses, jamais « Material ».
- [ ] Les boutons primaires sont simples, clairs et en capsule.
- [ ] Les micro-animations restent courtes et calmes.
- [ ] Le mockup produit fait partie de la DA, il n'est pas plaqué.
- [ ] La version mobile conserve la personnalité typographique.
- [ ] Le contraste et les focus clavier sont corrects.
- [ ] Aucun bleu SaaS/cyan/cyberpunk parasite n'a été introduit.
- [ ] Aucun gradient arc-en-ciel n'a été introduit.
- [ ] Il n'y a pas 6 styles de cartes différents sur la même page.
- [ ] Le résultat semble « premium créatif » avant de sembler « template SaaS ».

---

# 33. ANTI-PATTERNS — À INTERDIRE DANS LES PROMPTS

Lorsqu'une IA génère la page, lui interdire explicitement :

1. d'utiliser un fond noir uniforme ;
2. d'utiliser du violet électrique/bleu comme accent de remplacement ;
3. d'appliquer le rose en texte sur tous les titres ;
4. de mettre des gradients dans chaque bouton ;
5. de créer une grille de 6 cartes parce que « c'est moderne » ;
6. de surutiliser des badges ;
7. d'utiliser une police type Poppins/Montserrat pour les grands titres ;
8. d'avoir un hero trop compact ;
9. d'ajouter des décorations sans fonction ;
10. d'utiliser des blobs colorés trop saturés ;
11. de mettre un box-shadow épais sur chaque carte ;
12. de réduire le H1 mobile au point qu'il perde son impact ;
13. d'utiliser des mots en uppercase partout ;
14. d'utiliser des icônes colorées disparates ;
15. d'introduire plusieurs familles de radius ;
16. d'inventer un style indépendant pour chaque sous-site.

---

# 34. HIÉRARCHIE D'IMPORTANCE POUR UNE IA

Si une contrainte technique oblige à simplifier, préserver dans cet ordre :

1. **Typographie display serif + sans UI**.
2. **Palette dark warm + ivory + rose**.
3. **Grand espace négatif et proportions**.
4. **Grands radius + micro-bordures**.
5. **Gradients/halos subtils**.
6. **Boutons capsule**.
7. **Mockups façon macOS**.
8. **Animations**.
9. **Or secondaire**.

Autrement dit : mieux vaut une page sans animation mais parfaitement typographiée qu'une page très animée avec une typographie générique.

---

# 35. DEGRÉS D'INTENSITÉ PAR TYPE DE PAGE

## Landing principale Zero Limit

- hero très éditorial ;
- DA à 100 % ;
- halos visibles mais doux ;
- une ou deux grandes mises en scène produit.

## Sous-page institutionnelle

- même fond ;
- H1 serif ;
- moins de gradients ;
- davantage de texte et de sections simples.

## Page talent / roster

- conserver la serif ;
- utiliser les photos comme point focal ;
- surfaces plus simples ;
- rose pour états/metadata.

## Page événement

- peut être légèrement plus expressive ;
- couleur secondaire selon événement ;
- conserver le warm black, l'ivory, la typographie et le système de composants.

## Produit / SaaS connecté

- sans dominante ;
- panels plus fonctionnels ;
- rose comme brand/action ;
- serif rare ;
- densité plus élevée.

---

# 36. EXEMPLE DE SECTION « ZERO LIMIT » CORRECTE

```html
<section class="zl-section">
  <div class="zl-copy">
    <div class="zl-pill"><span class="zl-dot"></span>Zero Limit Agency</div>
    <h2 class="zl-display">Donnez une nouvelle dimension à vos projets.</h2>
    <p class="zl-body-lg">
      Un écosystème pensé pour relier les talents, les équipes et les outils dans une expérience cohérente.
    </p>
    <a class="zl-button-primary" href="#">Découvrir Zero Limit</a>
  </div>
</section>
```

Ce pattern fonctionne car il laisse la typographie porter la section, sans ajouter cinq illustrations concurrentes.

---

# 37. PROMPT MASTER À COLLER DANS CODEX / CHATGPT / CLAUDE

Copier le bloc suivant au début ou à la fin d'un prompt lorsque ce fichier complet n'est pas directement joint :

```text
DIRECTION ARTISTIQUE ZERO LIMIT AGENCY — RÈGLE DE PROJET

Respecte la DA Zero Limit Agency existante : dark premium éditorial, fond warm-black/bordeaux très sombre, halos rose-magenta diffus, blanc cassé chaud, grandes surfaces respirantes, grands radius, micro-bordures 1px et glass effect discret. Utilise une serif Didone/Editorial à fort contraste de type Bodoni pour les grands titres et une sans-serif neutre type Inter/Geist/SF Pro pour toute l'UI. Les CTA principaux sont ivoire sur fond sombre, en capsule. Le rose sert d'accent et de lumière, jamais de couleur dominante. Les cartes doivent être peu nombreuses, larges, aérées et cohérentes. Les mockups produit doivent rappeler une interface macOS sombre premium. Évite totalement le look SaaS bleu/violet, le cyberpunk, les gradients multicolores, les ombres lourdes, les grilles de cartes génériques et les titres Poppins/Montserrat.

Palette cible : #090405, #0F0608, #15090B, #1C0B10, #211317, #53172A, #C81C70, #D82A7D, #BE965E (rare), #FEFAF7, #F3EEEB, #B8AEAD.

Pour le layout : container ~1240px, gros spacing vertical (140–220px desktop), H1 clamp(72px, 7.2vw, 126px) avec line-height ~.9 et tracking ~-.045em. Radius de 18 à 36px, pills à 999px. Borders rgba(255,245,245,.10). Motion calme 180–700ms avec cubic-bezier(.2,.8,.2,1).

Si une règle du prompt courant entre explicitement en conflit avec la DA, suis le prompt courant sur ce point précis seulement ; conserve tout le reste de la DA.
```

---

# 38. INSTRUCTION MASTER SI LE FICHIER EST JOINT À UN PROMPT

Utiliser cette phrase :

```text
Le fichier ZERO_LIMIT_AGENCY_DA_MASTER.md joint est la référence visuelle officielle du projet. Lis-le intégralement avant de modifier l'interface. Ne réinterprète pas la DA à partir de tendances génériques : applique ses tokens, sa hiérarchie typographique, ses proportions, son système de surfaces, ses règles responsive et ses anti-patterns. Si le code actuel contient déjà des composants conformes, réutilise-les au lieu de recréer des variantes.
```

---

# 39. CONSIGNES POUR GÉNÉRATION AUTOMATIQUE DE PAGES

Une IA qui reçoit cette DA doit fonctionner ainsi :

1. **Inspecter le code existant** avant d'ajouter des styles.
2. Identifier les tokens déjà présents et mapper la DA dessus.
3. Réutiliser les composants existants conformes.
4. Ne pas introduire une nouvelle librairie de composants sans nécessité.
5. Ne pas écraser une font existante si elle correspond déjà à la serif de référence.
6. Créer les nouvelles couleurs sous forme de variables/tokens.
7. Vérifier desktop + mobile.
8. Contrôler la densité : supprimer un élément si la page devient surchargée.
9. Comparer la page finale aux principes de ce document, pas seulement au contenu fonctionnel.
10. Corriger en priorité typographie, spacing, contrastes et proportions avant les animations.

---

# 40. ANALYSE VISUELLE DES CAPTURES — CE QUI DOIT ÊTRE RETENU

## Capture du hero

Éléments structurants :

- navbar en capsule flottante ;
- fond brun-bordeaux presque noir ;
- halo rose concentré sous/derrière le hero ;
- eyebrow capsule avec point chaud ;
- titre serif gigantesque sur trois lignes ;
- texte sans-serif muted ;
- deux CTA dont un blanc principal ;
- mockup de logiciel qui entre dans le viewport par le bas ;
- absence de décoration inutile.

Ce hero fonctionne grâce au contraste entre une **typographie expressive** et une **UI extrêmement retenue**.

## Capture « progression »

Éléments structurants :

- headline centré, plus étroit que le hero ;
- même serif et mêmes proportions ;
- bloc explicatif très court ;
- CTA unique ;
- grande carte à trois modules ;
- pictogrammes abstraits ton-sur-ton ;
- section très haute, beaucoup de vide.

La leçon principale est que Zero Limit ne doit pas avoir peur du vide.

## Capture FAQ

Éléments structurants :

- le titre reste la pièce visuelle dominante ;
- l'accordéon est un seul grand rectangle ;
- les questions sont espacées, sans séparateurs agressifs ;
- le fond devient légèrement plus noir autour du contenu ;
- aucune animation ou illustration n'est nécessaire.

## Capture CTA final

Éléments structurants :

- la couleur arrive davantage à la fin de page ;
- grand panneau bordeaux en gradient ;
- luminosité plus forte en haut/gauche ;
- headline serif très grande ;
- un seul CTA ;
- footer minimal en dessous.

## Capture mockup

Éléments structurants :

- fenêtre sombre type macOS ;
- bordures arrondies et teinte chaud-gris ;
- écran central en gradient très doux ;
- sidebar noire/brune ;
- barre de progression rose ;
- composant de caractéristiques sous forme de capsule ;
- détails fonctionnels simplifiés.

Le mockup confirme que le « style Mac » doit être traduit par **sobriété, profondeur et proportion**, pas par des copies littérales de Finder ou Safari.

---

# 41. NIVEAU DE CONFIANCE / ÉLÉMENTS INFERÉS

### Très haute confiance

- fond warm-black / bordeaux ;
- ivory comme couleur texte forte ;
- accent rose-magenta ;
- grande serif contrastée ;
- sans-serif neutre UI ;
- grand spacing ;
- surfaces à radius élevés ;
- bordures 1 px faibles ;
- navbar capsule ;
- CTA ivory ;
- style macOS sombre des mockups.

### Haute confiance

- palette token proposée ;
- intensité des bordures ;
- proportions générales des containers ;
- système de glows et gradients ;
- or mat comme micro-accent facultatif.

### Estimation / à valider dans le code source

- famille exacte de la serif ;
- poids exact des fonts ;
- valeurs exactes de blur et d'ombre ;
- couleurs hex au pixel près ;
- tailles exactes selon le breakpoint.

**Important :** si le code de la maquette originale contient les valeurs exactes, ces valeurs doivent remplacer les estimations de ce fichier tout en conservant les mêmes principes.

---

# 42. RÈGLE FINALE

La DA Zero Limit Agency est réussie lorsque le visiteur perçoit simultanément :

- une marque créative et premium ;
- un produit numérique moderne ;
- une composition éditoriale forte ;
- une technologie calme et maîtrisée ;
- une identité bordeaux/rose reconnaissable sans dépendre d'un logo géant.

**Le luxe visuel vient de la retenue, du contraste, de la typographie et de l'espace — pas de l'accumulation d'effets.**

