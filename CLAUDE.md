# Anderson Paris — Contexte Claude Code

@AGENTS.md

## Chantier en cours

Livraison étendue au Luxembourg (confirmé).
- Fait : hero de index.html, article 3 des CGV.
- Reste : délai Luxembourg dans le tableau de l'article 5 des CGV (délai à obtenir, ne pas l'inventer).
- Reste : FAQ « Quels sont les délais de livraison ? » de index.html alignée sur le tableau CGV, pays par pays.

À compléter avant la première vente (valeurs à demander, jamais à inventer) :
- Pied de page de index.html : « SIREN [à compléter] — [adresse à compléter] ». Les vraies valeurs sont dans mentions-legales.html.
- mentions-legales.html : téléphone, adresse Vercel, médiateur de la consommation, IDU DEEE et IDU batteries.
- cgv.html article 5 : entrepôt d'expédition réel.

## Règles de contenu — non négociables

- Aucune preuve sociale inventée : pas d'avis, pas de « X clientes »,
  pas d'étude clinique. Zéro cliente à ce jour.
- Aucune allégation de fabrication ni de conception. Le produit est sourcé.
- Jamais « maison parisienne » : le siège est à Toulouse.
- Résultats annoncés : éclat immédiat temporaire, poches 3-6 semaines,
  fermeté 8-12 semaines. Jamais mieux.
- Toujours rappeler : produit de beauté, pas un dispositif médical.
- Visuels d'ambiance générés par IA : mention obligatoire en pied de page.

## Cohérence à maintenir

Toute modification du prix, des délais, de la durée du rituel ou des
garanties doit être répercutée sur index.html ET cgv.html ET
retractation.html ET mentions-legales.html.
Mettre aussi à jour l'objet REFERENCE en tête de scripts/verifier.mjs.
Commande dédiée : /changer-valeur.

## Boucle de vérification

Après toute modification : `node scripts/verifier.mjs` doit afficher « OK ».
Les lignes « A COMPLETER » sont des avertissements, pas des erreurs.
Un hook lance déjà la vérification après chaque Edit/Write sur une page :
si le hook renvoie une erreur, la corriger avant de passer à la suite.
Pour un changement visuel, lancer `node scripts/serveur.mjs` et contrôler
la page à 400 px et à 1280 px de large.

## Code Review Rules (session + CI)

### Bloquant
- Violation d'une règle de contenu ci-dessus -> BLOQUANT
- Mention de Lumina Pro, 630 nm, 8000 RPM ou du visage entier -> BLOQUANT
- Prix, délai, durée du rituel ou garantie modifié sur une page sans les autres -> BLOQUANT
- `border-radius` non nul, couleur hors palette, police autre que Bodoni Moda / Jost -> BLOQUANT
- Framework, dépendance npm, script tiers ou tracker ajouté -> BLOQUANT
- Lien de paiement Stripe modifié ou supprimé -> CRITICAL, à signaler explicitement
- Clé, token ou secret en clair -> CRITICAL
- `node scripts/verifier.mjs` en erreur -> BLOQUANT

### À signaler
- Texte signé d'un prénom, tutoiement de la cliente, anglicisme évitable
- Image sans `alt`, sans `width`/`height`, ou hors de /images/
- Plus d'une idée par section sur index.html
- Style inline nouveau alors qu'une classe existe déjà
- Valeur « [à compléter] » inventée au lieu d'être demandée

### Format de réponse
- Violation -> commentaire inline + correction proposée
- Tout conforme -> « [OK] RAS - conforme aux standards du projet. »
- Direct. Pas de blabla. En français.
