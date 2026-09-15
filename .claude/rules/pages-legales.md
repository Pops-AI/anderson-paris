---
description: Pages légales (CGV, rétractation, mentions, confidentialité)
paths:
  - cgv.html
  - retractation.html
  - mentions-legales.html
  - confidentialite.html
  - style.css
---
# Pages légales

## Règle : une valeur inconnue ne s'invente jamais
SIRET, délais, médiateur, IDU, entrepôt, téléphone : si la valeur n'est pas fournie, on la marque et on la demande.

// MAUVAIS
<tr><th>Luxembourg</th><td>4 à 8 jours ouvrés</td></tr>   (délai supposé)

// CORRECT
<tr><th>Luxembourg</th><td><span class="aremplir">[délai à compléter]</span></td></tr>

## Règle : chaque modification juridique met à jour la date de la page

// AVANT
<p class="maj">Dernière mise à jour : 15 septembre 2026</p>

// APRÈS (CGV : on incrémente aussi la version)
<p class="maj">Version 1.1 — en vigueur au 2 octobre 2026</p>

## Règle : les quatre pages partagent le même pied de page
Toute modification de `<footer>` se reporte à l'identique sur les quatre fichiers.
```html
<p>Anderson Paris — nom commercial de Mohamed-Rayane BAROUDI EI — SIRET 993 868 421 00013 — © 2026.</p>
```

## Règle : les chiffres suivent index.html
Prix 129 €, garantie commerciale 30 jours, rétractation 14 jours, garantie constructeur 2 ans,
pays France / Belgique / Luxembourg / Suisse. Toute divergence avec index.html est une erreur.

## Règle : style.css ne sert que les pages légales
Les styles de la landing restent dans le `<style>` de index.html.

## Anti-patterns à flag systématiquement
- Valeur plausible inventée à la place d'un `aremplir`
- Pied de page différent d'une page à l'autre
- Page légale sans `<meta name="robots" content="noindex">`
- Mention de « dispositif médical » retirée de cgv.html ou mentions-legales.html
- Adresse autre que Toulouse
