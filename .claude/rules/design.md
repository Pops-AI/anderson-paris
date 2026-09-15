---
description: Design system Anderson Paris (couleurs, typographie, aucun arrondi)
paths:
  - index.html
  - style.css
---
# Design system

## Règle : uniquement les variables de la palette

// MAUVAIS
.garanties strong{color:#B08D57;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.1)}

// CORRECT
.garanties strong{display:block;font-family:var(--serif);font-weight:400;font-size:17px;color:var(--encre);margin-bottom:6px}

Exception existante : les gris de texte secondaire #7E766C, #8A8179, #A69E93, #989086 déjà utilisés.
Ne pas en créer de nouveaux.

## Règle : séparer par un filet, jamais par une boîte

// MAUVAIS
.acte{background:#fff;border-radius:8px;padding:24px}

// CORRECT
.acte{border-top:1px solid var(--ligne);padding-top:22px}

## Règle : un seul point de rupture, 860px
Tout ajustement mobile va dans le bloc `@media (max-width:860px)` existant.
Un élément fixé en bas d'écran ajoute `env(safe-area-inset-bottom,0px)` à son padding.

## Règle : typographie
Titres en `var(--serif)` poids 400. Texte en `var(--sans)` poids 300.
Libellés en capitales : `letter-spacing:.14em` à `.18em`, `font-size:12px` à `13px`.

## Anti-patterns à flag systématiquement
- `border-radius` non nul, `box-shadow`, dégradé
- Couleur hexadécimale nouvelle hors palette
- Police autre que Bodoni Moda / Jost, ou poids gras (600+)
- Nouveau `@media` avec un autre point de rupture
- Animation qui ignore `prefers-reduced-motion`
