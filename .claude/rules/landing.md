---
description: Rédaction et structure de la landing Lumina Regard
paths:
  - index.html
---
# Landing — index.html

## Règle : les résultats ne dépassent jamais le calendrier réel
Éclat immédiat mais temporaire, poches 3 à 6 semaines, fermeté 8 à 12 semaines.

// MAUVAIS
<p>Des rides visiblement réduites dès la première semaine.</p>

// CORRECT (texte actuel, section franchise)
<li>Un contour plus ferme et des rides d'expression légères adoucies entre la huitième et la douzième semaine</li>

## Règle : aucune preuve sociale tant qu'il n'y a pas de cliente

// MAUVAIS
<p class="sous-cta">★★★★★ Déjà 2 000 clientes conquises</p>

// CORRECT
<span class="sous-cta">Paiement sécurisé · 30 jours pour changer d'avis</span>

## Règle : tout bouton d'achat passe par data-cta

// MAUVAIS
<a class="cta" href="https://buy.stripe.com/eVq6oH3x56J77n1bNH7ok00">Commander</a>

// CORRECT
<a class="cta" data-cta href="#offre">Commander — 129 €</a>

## Règle : une section = une idée
Un nouveau sujet crée une nouvelle `<section>` avec son propre `<h2>`, jamais un second `<h2>` dans une section existante.

## Règle : les délais de la FAQ recopient le tableau de l'article 5 des CGV

// MAUVAIS
<p>Livraison en 4 à 10 jours ouvrés en France métropolitaine, en Belgique et en Suisse.</p>   (Luxembourg oublié, pas de dédouanement)

// CORRECT
<p>Expédition sous 48 heures ouvrées, livraison en 4 à 10 jours ouvrés en France métropolitaine, en Belgique, au Luxembourg et en Suisse (hors délais de dédouanement).</p>

## Anti-patterns à flag systématiquement
- Prix écrit ailleurs qu'en 129 € (ou modifié sans les CGV)
- « clientes », « avis », étoiles, « testé cliniquement », « conçu par nos équipes »
- Promesse sur le visage entier ou sur les cernes pigmentaires
- URL Stripe en dur dans un `href`
- `<img>` sans `alt`, `width`, `height`, ou hors de /images/
- Style inline alors qu'une classe (`.sous-cta`, `.prix`, `.col`) existe
