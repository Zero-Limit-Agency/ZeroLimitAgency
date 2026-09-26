# ZERO LIMIT AGENCY — DIRECTION ARTISTIQUE MASTER SPEC V2

**Version :** 2.0  
**Date :** 26 septembre 2026  
**Statut :** source de vérité visuelle officielle de Zero Limit Agency  
**Périmètre :** site principal, sous-sites, pages marketing, authentification, espaces connectés, OWNER, previews publiques, futurs produits Zero Limit.  

> **Règle d’autorité** — Ce document définit la direction artistique cible de Zero Limit Agency.  
> La page `/learn-youtube` est la référence visuelle principale ayant servi à consolider ce système, mais ses défauts techniques, valeurs hardcodées, breakpoints improvisés et incohérences ne deviennent pas automatiquement des règles de marque.  
> Toujours distinguer :
> - **CURRENT REFERENCE** : ce qui existe réellement dans `/learn-youtube`;
> - **TARGET DESIGN SYSTEM** : ce qui devient la règle officielle pour la suite du projet.

---

# 0. RÉSUMÉ ULTRA-COURT

Zero Limit Agency doit avoir une esthétique **dark premium, éditoriale, chaude et maîtrisée**.

Le langage visuel repose sur :

- fonds warm-black / bordeaux / prune ;
- ivoire chaud pour les textes et CTA principaux ;
- rose-magenta comme accent lumineux ;
- or chaud comme accent secondaire récurrent à faible surface ;
- grands titres en **Playfair Display** ;
- UI en **Manrope** ;
- beaucoup d’espace négatif ;
- surfaces chaudes semi-translucides ;
- grands radius ;
- micro-bordures très faibles ;
- ombres noires larges et diffuses ;
- glows subtils ;
- navbar flottante en capsule ;
- boutons ivoire en capsule ;
- mockups produit inspirés d’une sobriété macOS ;
- animations courtes, calmes et fonctionnelles.

Zero Limit doit paraître :

**premium créatif + produit numérique moderne + éditorial fort + technologie calme**.

Jamais :

- SaaS bleu/violet générique ;
- cyberpunk ;
- gaming RGB ;
- néon ;
- gradient arc-en-ciel ;
- dashboard rempli de cartes ;
- gold dominant ;
- rose dominant ;
- suranimation.

---

# 1. ADN VISUEL OFFICIEL

## 1.1. Mots-clés

- Premium
- Editorial
- Cinematic dark
- Warm glass
- Bordeaux / prune
- Ivory
- Rose light
- Gold micro-accent
- Mac-like restraint
- Spacious
- Precise
- Calm technology
- Creative product
- High-end digital

## 1.2. Hiérarchie de marque

La hiérarchie chromatique officielle est :

**BORDEAUX = BRAND**  
**IVOIRE = CONTRAST**  
**ROSE = LIGHT / ACTIVE / BRAND ACCENT**  
**GOLD = SECONDARY MICRO-ACCENT**

Le gold fait partie de l’identité, mais il ne doit jamais rivaliser avec le bordeaux, l’ivoire ou le rose.

---

# 2. RÉFÉRENCE ACTUELLE — `/learn-youtube`

La page `/learn-youtube` constitue la référence visuelle principale.

## 2.1. Polices réellement utilisées

### Display

```css
font-family: "Playfair Display", Georgia, serif;
```

Poids actuellement chargés :

- 600
- 700

Le code actuel demande parfois `800`, qui est synthétisé par le navigateur.  
**Ce comportement n’est pas officialisé.**

### UI / Body

```css
font-family: "Manrope", "Segoe UI", sans-serif;
```

Poids actuellement chargés :

- 400
- 500
- 700
- 800

Le code actuel demande parfois `900` ou `950`, synthétisés depuis 800.  
**Ce comportement n’est pas officialisé.**

## 2.2. Palette réellement utilisée

### Warm backgrounds

```css
#16090c
#12090b
#0f0608
#090405
```

### Pink

```css
#d01974
#b15f73
```

### Ivory

```css
#fff8f5
```

### Dark ink

```css
#190d10
```

### Gold

```css
#d4aa6a
```

## 2.3. Ce qui est conservé

- navbar capsule ;
- warm-black/burgundy atmosphere ;
- Playfair + Manrope ;
- ivory CTA ;
- rose glows ;
- gold micro-accent ;
- grandes surfaces arrondies ;
- mockup Mac-like ;
- CTA final bordeaux ;
- beaucoup d’espace ;
- faible densité ;
- motion courte.

## 2.4. Ce qui n’est PAS officialisé

- poids synthétiques ;
- gutters mobiles trop faibles ;
- breakpoints uniquement `1120px` / `720px` ;
- passage brutal `3 colonnes → 1 colonne` ;
- dizaines de valeurs hardcodées ;
- blobs lumineux locaux trop visibles en dézoomant ;
- easing `ease` partout ;
- absence d’un vrai design token system ;
- incohérences de radius ;
- certains alignements issus du brouillon initial.

---

# 3. TYPOGRAPHIE OFFICIELLE

## 3.1. Display

Police officielle :

```css
font-family: "Playfair Display", Georgia, serif;
```

Utilisation :

- héros marketing ;
- H1 majeurs ;
- H2 éditoriaux ;
- CTA de fin ;
- grandes pages de contexte ;
- quelques états d’accueil premium.

Ne pas utiliser Playfair partout dans les dashboards.

### Poids officiels

Recommandés :

```css
600
700
```

Si un futur écran nécessite 800, charger explicitement la graisse correspondante avant de l’utiliser.

## 3.2. UI / Body

Police officielle :

```css
font-family: "Manrope", "Segoe UI", sans-serif;
```

Poids officiels :

```css
400
500
700
800
```

Ne pas utiliser volontairement des poids synthétiques 900/950.

## 3.3. Échelle cible

### Hero XL

```css
font-size: clamp(3.4rem, 8vw, 8.2rem);
line-height: .90;
letter-spacing: -.05em;
font-weight: 700;
```

### H2 editorial

```css
font-size: clamp(2.8rem, 5.4vw, 5.7rem);
line-height: .94;
letter-spacing: -.045em;
font-weight: 700;
```

### H3

```css
font-size: clamp(1.5rem, 2.3vw, 2rem);
line-height: 1.05;
letter-spacing: -.025em;
font-weight: 700;
```

### Body large

```css
font-size: clamp(1.05rem, 1.6vw, 1.25rem);
line-height: 1.65;
font-weight: 400;
```

### Body

```css
font-size: 1rem;
line-height: 1.6;
font-weight: 400;
```

### UI label

```css
font-size: .875rem;
font-weight: 700;
```

### Eyebrow

```css
font-size: .8125rem;
font-weight: 800;
```

## 3.4. Règles

- Pas de Poppins.
- Pas de Montserrat.
- Pas d’Arial comme choix visuel principal.
- Pas d’uppercase systématique.
- Les titres restent éditoriaux, naturels et courts.
- Conserver des line-heights serrés sur les grands titres.
- Ne pas casser la personnalité de la serif sur mobile.

---

# 4. PALETTE OFFICIELLE V2

```css
:root {
  --zl-void: #090405;
  --zl-bg: #0f0608;
  --zl-bg-soft: #12090b;
  --zl-bg-warm: #16090c;

  --zl-pink-hot: #d01974;
  --zl-pink-soft: #b15f73;

  --zl-gold: #d4aa6a;

  --zl-ivory: #fff8f5;
  --zl-ink: #190d10;

  --zl-text-primary: rgba(255, 245, 243, .92);
  --zl-text-secondary: rgba(255, 245, 243, .68);
  --zl-text-tertiary: rgba(255, 245, 243, .54);

  --zl-line: rgba(255, 245, 243, .10);
  --zl-line-strong: rgba(255, 245, 243, .16);
}
```

## 4.1. Gold

Gold officiel :

```css
#d4aa6a
```

Rôle :

- dots ;
- eyebrows ;
- petits marqueurs ;
- progressions ;
- détails d’illustrations ;
- halo chaud très faible ;
- signal premium secondaire.

Interdits :

- H1 gold ;
- CTA gold ;
- gros backgrounds gold ;
- borders gold partout ;
- gradients gold luxueux ;
- look casino/luxe cliché.

---

# 5. BACKGROUND GLOBAL

## 5.1. Règle principale

Le background doit former **un environnement continu**.

Ne pas concevoir la page comme :

> une section = un blob rose.

Le fond doit conserver sa cohérence même à :

- 100 % zoom ;
- 75 % ;
- 50 % ;
- 25 %.

Le zoom navigateur n’est pas un breakpoint, mais la composition globale ne doit pas révéler des ronds indépendants grossiers.

## 5.2. Architecture recommandée

```text
root warm gradient
+
fixed ambient light
+
fixed subtle grid/noise
+
rare local component glow
```

## 5.3. Exemple cible

```css
body {
  background:
    linear-gradient(
      180deg,
      #16090c 0%,
      #0f0608 48%,
      #090405 100%
    );
}
```

Puis une couche ambient fixe :

```css
.zl-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;

  background:
    radial-gradient(
      70rem 50rem at 20% 15%,
      rgba(208,25,116,.12),
      transparent 72%
    ),
    radial-gradient(
      70rem 52rem at 80% 72%,
      rgba(177,95,115,.09),
      transparent 74%
    ),
    radial-gradient(
      54rem 44rem at 52% 45%,
      rgba(212,170,106,.035),
      transparent 76%
    );
}
```

## 5.4. Grid

Très discrète.

```css
background-image:
  linear-gradient(rgba(255,245,243,.02) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,245,243,.014) 1px, transparent 1px);

background-size: 88px 88px;
```

La grille ne doit jamais devenir une texture dominante.

---

# 6. LUMIÈRE ET GLOWS

Les glows doivent sembler être de la lumière ambiante.

## Autorisé

- rose diffus ;
- bordeaux ;
- gold ultra-faible ;
- très grandes zones ;
- blur important ;
- opacité faible.

## Interdit

- spot net ;
- cercle lumineux évident ;
- un glow par card ;
- petits blobs saturés ;
- gradient multicolore.

Si le glow attire plus l’œil que le contenu, il est trop fort.

---

# 7. GRID / LAYOUT

## 7.1. Containers

```css
--zl-container: 1220px;
--zl-container-wide: 1320px;
--zl-text-container: 820px;
--zl-copy-narrow: 680px;
```

## 7.2. Gutters

### Desktop

```css
32px à 48px
```

### Tablet

```css
24px à 32px
```

### Mobile

```css
18px à 24px
```

**Ne jamais revenir à ~10 px de gutter principal.**

## 7.3. Rythme vertical

### Marketing desktop

```css
120px à 200px
```

### Product

```css
48px à 96px
```

### Mobile marketing

```css
80px à 112px
```

---

# 8. RESPONSIVE

Le système cible doit être plus raffiné que la version actuelle.

## Breakpoints conceptuels

```text
Large desktop
Desktop
Tablet
Mobile
```

Exemple technique possible :

```css
>= 1440px
1200–1439px
768–1199px
< 768px
```

Les valeurs finales peuvent dépendre du composant.

## Grids

Préférer :

```text
3 → 2 → 1
```

ou :

```text
4 → 2 → 1
```

lorsque pertinent.

Éviter les passages brutaux :

```text
3 → 1 à 1120px
```

sans justification.

---

# 9. SURFACES

## 9.1. Surface majeure

```css
background:
  linear-gradient(
    145deg,
    rgba(255,255,255,.07),
    rgba(255,255,255,.02)
  ),
  rgba(18,9,11,.52);

border: 1px solid rgba(255,245,243,.10);
border-radius: 34px;

backdrop-filter:
  blur(24px)
  saturate(135%);

box-shadow:
  inset 0 1px 0 rgba(255,255,255,.08),
  0 24px 80px rgba(0,0,0,.42),
  0 0 70px rgba(208,25,116,.06);
```

## 9.2. Mobile

```css
border-radius: 26px;
backdrop-filter: blur(14px) saturate(120%);
```

---

# 10. RADIUS SYSTEM

Normaliser les radius.

```css
--zl-radius-sm: 12px;
--zl-radius-md: 18px;
--zl-radius-lg: 24px;
--zl-radius-xl: 30px;
--zl-radius-panel: 34px;
--zl-radius-pill: 999px;
```

Éviter :

- 22 / 24 / 26 / 28 / 30 / 32 / 34 / 44 px mélangés arbitrairement.

---

# 11. BORDURES

```css
--zl-border-soft: rgba(255,245,243,.08);
--zl-border: rgba(255,245,243,.10);
--zl-border-strong: rgba(255,245,243,.16);
```

Les bordures structurent sans dessiner des boîtes agressives.

---

# 12. OMBRES

Pas d’ombre grise Material Design.

```css
--zl-shadow-panel:
  0 24px 80px rgba(0,0,0,.42);

--zl-shadow-glow:
  0 0 70px rgba(208,25,116,.06);
```

---

# 13. NAVBAR OFFICIELLE

La navbar flottante de `/learn-youtube` devient un motif officiel.

## Forme

- capsule ;
- sticky ;
- centrée ;
- warm glass ;
- micro-border ;
- blur ;
- brand gauche ;
- nav centre ;
- actions droite.

## Cible desktop

```css
width: min(1220px, calc(100% - 32px));
min-height: 70px;
border-radius: 999px;
padding: .6rem .75rem;
```

## Surface

```css
background:
  linear-gradient(
    145deg,
    rgba(28,12,17,.78),
    rgba(18,8,11,.54)
  );

backdrop-filter: blur(24px) saturate(135%);
```

## Mobile

- conserver la capsule ;
- réduire légèrement sa hauteur ;
- navigation desktop masquée ;
- menu mobile clair ;
- surface cohérente ;
- pas de header générique plein écran.

---

# 14. BUTTON SYSTEM

## Primary

```css
background: #fff8f5;
color: #190d10;

min-height: 46px;
padding: .8rem 1.2rem;

border-radius: 999px;
border: 1px solid rgba(255,245,243,.16);

font-family: "Manrope", "Segoe UI", sans-serif;
font-weight: 800;
```

## Secondary

```css
background: rgba(255,245,243,.055);
color: #fff8f5;
border: 1px solid rgba(255,245,243,.13);
```

## Tertiary

Texte simple.

Pas de troisième gros bouton plein.

## Hover

```css
transform: translateY(-2px);
```

Éviter les mouvements trop forts.

## Focus

```css
outline: 3px solid rgba(255,248,245,.78);
outline-offset: 4px;
```

---

# 15. PILLS / EYEBROWS

## Structure

```css
display: inline-flex;
align-items: center;
gap: .45rem;

padding: .55rem .82rem;

border-radius: 999px;
border: 1px solid rgba(255,245,243,.11);

background: rgba(255,245,243,.045);
```

## Dot

Default branded:

```css
background: #d4aa6a;
box-shadow: 0 0 16px rgba(212,170,106,.40);
```

Le rose peut être utilisé si la sémantique le justifie.

---

# 16. CARDS

Ne pas remplir les pages de cartes.

Une section ne doit pas automatiquement devenir une grille de 6 cards.

Préférer :

- 1 grande surface ;
- 2–3 cartes fortes ;
- composition éditoriale ;
- visuels internes simples.

Les cartes restent :

- warm ;
- rounded ;
- bordered ;
- aérées ;
- peu nombreuses.

---

# 17. PRODUCT MOCKUPS

Le mockup doit rappeler un vrai produit sans être une capture illisible.

## Langage

- frame large ;
- titlebar ;
- trois dots ;
- panels sombres ;
- progress bars ;
- contrôles capsules ;
- surfaces internes ;
- contenu abstrait.

## Mac-like signifie

- sobriété ;
- profondeur ;
- proportion ;
- spacing ;
- border fine ;
- blur ;
- micro-reflet.

Pas une copie littérale de macOS.

---

# 18. CTA FINAL

Le grand CTA final devient un motif officiel Zero Limit.

## Composition

- grand rectangle arrondi ;
- gradient bordeaux ;
- lumière ivory top-left ;
- rose subtil ;
- H2 Playfair très grand ;
- body muted ;
- CTA ivory ;
- beaucoup de vide.

## Exemple de fond

```css
background:
  radial-gradient(
    circle at 18% 0%,
    rgba(255,248,245,.14),
    transparent 24rem
  ),
  radial-gradient(
    circle at 86% 8%,
    rgba(208,25,116,.24),
    transparent 22rem
  ),
  linear-gradient(
    135deg,
    rgba(125,29,47,.62),
    rgba(22,8,12,.72)
  );
```

Ce motif peut être réutilisé sur plusieurs produits, avec copy différente.

---

# 19. FOOTER

Minimal.

- brand ;
- quelques liens utiles ;
- legal ;
- copyright ;
- pas de mega-footer inutile.

```css
border-top: 1px solid rgba(255,245,243,.10);
```

---

# 20. MOTION SYSTEM

La page actuelle montre qu’une bonne DA peut fonctionner avec peu d’animations.

## Philosophie

Motion :

- courte ;
- calme ;
- lisible ;
- fonctionnelle ;
- premium.

## Tokens cibles

```css
--zl-duration-fast: 180ms;
--zl-duration-medium: 320ms;
--zl-duration-slow: 620ms;

--zl-ease-quick: cubic-bezier(.2,.8,.2,1);
--zl-ease-premium: cubic-bezier(.16,1,.3,1);
```

## Hover

```css
translateY(-1px à -3px)
```

## Scroll reveal

Autorisé mais rare.

Exemple :

```css
opacity: 0 → 1;
translateY: 20px → 0;
```

Pas de reveal sur chaque card.

## Interdit

- parallax massif ;
- bounce ;
- loops ;
- glow pulsant permanent ;
- rotation décorative ;
- animation gratuite.

## Reduced motion

Toujours respecter :

```css
prefers-reduced-motion: reduce
```

Y compris pour le smooth scroll.

---

# 21. ICON SYSTEM

Deux familles.

## SYSTEM ICONS

Pour :

- arrows ;
- menus ;
- settings ;
- controls ;
- close ;
- add ;
- search ;
- status.

Style :

- outline ;
- simple ;
- cohérent ;
- neutre.

## ZERO LIMIT BRAND ICONS

Set propriétaire pour :

- Spaces ;
- produits ;
- catégories ;
- futures features majeures ;
- modules importants ;
- identités produit.

Ne pas customiser chaque petite icône fonctionnelle.

---

# 22. MARKETING VS PRODUCT

## Marketing

- Playfair dominante ;
- grands espaces ;
- lumière ;
- gros headings ;
- panels cinématiques ;
- mockups ;
- CTA narratifs.

## Product / Dashboard

- Manrope dominante ;
- Playfair rare ;
- densité supérieure ;
- backgrounds plus stables ;
- moins de glows ;
- cards plus fonctionnelles ;
- priorité à l’information.

Un dashboard ne doit jamais ressembler à une landing page complète.

---

# 23. AUTH UI

Auth doit être premium mais extrêmement simple.

## Principes

- une action principale ;
- très peu de distractions ;
- Playfair possible pour le titre ;
- Manrope pour champs/labels ;
- warm background ;
- lumière discrète ;
- formulaire propre ;
- pas de SaaS auth générique ;
- pas de gros side panel inutile sauf vraie valeur visuelle.

## Important

Aucun élément utilisateur normal ne doit exposer :

- “admin login” ;
- “owner login” ;
- raccourci privilégié visible ;
- rôle technique.

L’autorité est serveur, jamais une affordance UI publique.

---

# 24. PRODUCT / WORKSPACE UI

## Règles

- Manrope dominante ;
- cards moins grandes ;
- serif réservée aux moments importants ;
- nav claire ;
- spacing régulier ;
- accent rose pour active/action ;
- gold très rare ;
- background plus calme.

Ne pas utiliser un glow décoratif derrière chaque module.

---

# 25. OWNER UI

OWNER doit rester premium mais plus technique.

- Manrope dominante ;
- Playfair seulement sur grandes entrées ;
- environnement clairement visible ;
- status sécurité clair ;
- dangerous actions lisibles ;
- peu de décor ;
- pas de faux analytics ;
- pas de mode “hacker/admin”.

---

# 26. FORMS

## Inputs

```css
background: rgba(255,245,243,.035);
border: 1px solid rgba(255,245,243,.10);
color: #fff8f5;

border-radius: 16px;
min-height: 48px;
```

## Focus

```css
border-color: rgba(208,25,116,.45);
box-shadow: 0 0 0 3px rgba(208,25,116,.10);
```

## Labels

```css
font-family: Manrope;
font-size: .875rem;
font-weight: 700;
```

---

# 27. SPACING TOKENS

```css
--zl-space-1: 4px;
--zl-space-2: 8px;
--zl-space-3: 12px;
--zl-space-4: 16px;
--zl-space-5: 20px;
--zl-space-6: 24px;
--zl-space-8: 32px;
--zl-space-10: 40px;
--zl-space-12: 48px;
--zl-space-16: 64px;
--zl-space-20: 80px;
--zl-space-24: 96px;
--zl-space-32: 128px;
--zl-space-40: 160px;
```

---

# 28. DESIGN TOKENS V2 — BASE

```css
:root {
  /* Background */
  --zl-void: #090405;
  --zl-bg: #0f0608;
  --zl-bg-soft: #12090b;
  --zl-bg-warm: #16090c;

  /* Brand */
  --zl-pink-hot: #d01974;
  --zl-pink-soft: #b15f73;
  --zl-gold: #d4aa6a;

  /* Text */
  --zl-ivory: #fff8f5;
  --zl-ink: #190d10;
  --zl-text-primary: rgba(255,245,243,.92);
  --zl-text-secondary: rgba(255,245,243,.68);
  --zl-text-tertiary: rgba(255,245,243,.54);

  /* Surfaces */
  --zl-surface: rgba(18,9,11,.52);
  --zl-surface-soft: rgba(255,245,243,.035);

  /* Borders */
  --zl-line-soft: rgba(255,245,243,.08);
  --zl-line: rgba(255,245,243,.10);
  --zl-line-strong: rgba(255,245,243,.16);

  /* Radius */
  --zl-radius-sm: 12px;
  --zl-radius-md: 18px;
  --zl-radius-lg: 24px;
  --zl-radius-xl: 30px;
  --zl-radius-panel: 34px;
  --zl-radius-pill: 999px;

  /* Layout */
  --zl-container: 1220px;
  --zl-container-wide: 1320px;
  --zl-text-container: 820px;

  /* Motion */
  --zl-duration-fast: 180ms;
  --zl-duration-medium: 320ms;
  --zl-duration-slow: 620ms;
  --zl-ease-quick: cubic-bezier(.2,.8,.2,1);
  --zl-ease-premium: cubic-bezier(.16,1,.3,1);

  /* Shadows */
  --zl-shadow-panel: 0 24px 80px rgba(0,0,0,.42);
  --zl-shadow-glow: 0 0 70px rgba(208,25,116,.06);
}
```

---

# 29. ACCESSIBILITÉ

Toujours :

- WCAG AA lorsque possible ;
- focus visible ;
- zone cliquable ≥ 44×44 px ;
- body mobile ≥ 16 px ;
- couleur jamais seule pour transmettre l’information ;
- reduced motion ;
- keyboard navigation ;
- contrastes suffisamment forts.

Premium ≠ faible lisibilité.

---

# 30. COPY

## Titres

- courts ;
- clairs ;
- éditoriaux ;
- naturels ;
- peu de jargon SaaS ;
- pas de slogans vagues.

## CTA

Courts :

- Se connecter
- Découvrir
- Voir l’espace
- Explorer
- Continuer
- Accéder au programme

---

# 31. ANTI-PATTERNS

Interdire :

1. fond noir uniforme ;
2. SaaS bleu/violet ;
3. cyberpunk ;
4. rose dominant ;
5. gold dominant ;
6. gradient multicolore ;
7. H1 en sans-serif générique ;
8. Poppins/Montserrat en display ;
9. grille de 6 cards par défaut ;
10. background composé de blobs visibles en dézoomant ;
11. gutter mobile minuscule ;
12. poids synthétiques utilisés volontairement ;
13. 15 radius différents ;
14. une animation différente par composant ;
15. gros parallax ;
16. icônes disparates ;
17. boutons multicolores ;
18. box-shadow lourdes ;
19. titres entièrement gold ;
20. texte blanc pur partout ;
21. dashboard transformé en landing ;
22. copy “admin” visible sur une interface utilisateur publique ;
23. CTA avec trois actions principales concurrentes ;
24. gradients dans tous les boutons ;
25. glassmorphism arc-en-ciel.

---

# 32. CHECKLIST VISUELLE

Avant validation :

- [ ] Playfair utilisée pour les vrais titres éditoriaux.
- [ ] Manrope utilisée pour l’UI.
- [ ] Warm-black/bordeaux dominant.
- [ ] Ivory chaude.
- [ ] Rose utilisé comme lumière/active.
- [ ] Gold présent mais secondaire.
- [ ] Background continu même en dézoomant.
- [ ] Aucun gros cercle de glow évident.
- [ ] Containers alignés.
- [ ] Gutters suffisants.
- [ ] Mobile respirant.
- [ ] Radius cohérents.
- [ ] Border 1 px discrète.
- [ ] Cards peu nombreuses.
- [ ] Navbar capsule conforme.
- [ ] CTA principal ivory.
- [ ] Motion calme.
- [ ] Focus visibles.
- [ ] Aucun SaaS bleu/violet.
- [ ] Aucun cyberpunk.
- [ ] Aucun poids synthétique non maîtrisé.
- [ ] Aucun contenu admin exposé publiquement.
- [ ] UI produit plus fonctionnelle que marketing.

---

# 33. RÈGLES POUR CODEX

Avant toute modification visuelle :

1. lire ce fichier intégralement ;
2. auditer le code existant ;
3. réutiliser les composants conformes ;
4. ne pas inventer de nouvelle DA ;
5. mapper les couleurs vers les tokens ;
6. corriger les défauts du code actuel sans perdre l’ADN ;
7. vérifier desktop / tablet / mobile ;
8. vérifier 100 %, 75 %, 50 % et 25 % de zoom pour la composition générale ;
9. ne pas traiter le zoom comme un breakpoint ;
10. vérifier le background global ;
11. supprimer les hardcodes redondants lorsqu’un token existe ;
12. ne pas remplacer Playfair ou Manrope arbitrairement ;
13. ne pas réintroduire un bouton admin visible publiquement ;
14. toujours préserver l’autorisation côté serveur ;
15. tester reduced motion.

---

# 34. CURRENT VS TARGET

## CURRENT `/learn-youtube`

- Playfair Display + Manrope ;
- warm dark ;
- gold global ;
- rose ;
- ivory ;
- navbar capsule ;
- mockup Mac-like ;
- CTA final ;
- nombreuses valeurs hardcodées ;
- breakpoints simples ;
- glows localisés ;
- poids synthétiques ;
- mobile gutters faibles.

## TARGET ZERO LIMIT

Même identité, mais :

- tokens centralisés ;
- vraie grille ;
- background global fixe ;
- responsive raffiné ;
- poids correctement chargés ;
- radius normalisés ;
- spacing cohérent ;
- icon system ;
- accessibility renforcée ;
- motion tokenisée ;
- product UI moins marketing.

---

# 35. HIÉRARCHIE D’IMPORTANCE

Si une contrainte oblige à simplifier :

1. Playfair + Manrope
2. Warm-black / burgundy / ivory
3. Composition / spacing
4. Navbar / surfaces
5. Rose lighting
6. Gold micro-accent
7. Radius / borders
8. Mockup Mac-like
9. Motion
10. décor

Mieux vaut une page statique bien composée qu’une page animée mais générique.

---

# 36. RÈGLE FINALE

Zero Limit Agency est visuellement réussi lorsque le visiteur perçoit simultanément :

- une marque créative premium ;
- une plateforme numérique sérieuse ;
- une forte sensibilité éditoriale ;
- une technologie calme ;
- une identité bordeaux/rose/or reconnaissable ;
- une interface moderne sans ressembler à un template SaaS.

**Le luxe visuel vient de la retenue, de la typographie, de la lumière, du contraste et de l’espace.**
