# Anderson Paris — Contexte Claude Code

@AGENTS.md

## Chantier en cours

Livraison étendue au Luxembourg : terminé (hero, FAQ, CGV articles 3 et 5).
Délai retenu pour les quatre pays : 4 à 7 jours ouvrés (Suisse : hors dédouanement). Décision définitive.

Suivi des ventes pour les publicités : code prêt, en attente de configuration.
- Bandeau de consentement (index.html) + Google Analytics + pixel Meta (suivi.js).
- Page /merci : achat envoyé à Google Analytics uniquement.
- Achats vers Meta : application Stripe installée par la gérance. Ne jamais renvoyer l'événement Purchase
  à Meta depuis le site (double comptage).
À fournir, jamais à inventer :
- Pixel Meta actif (ID 1660164462081161, le même que celui relié à l'application Stripe).
- `ID_GOOGLE_ANALYTICS` dans suivi.js (vaut « A_REMPLACER » : rien ne se charge). À l'activation, réafficher
  la case « Mesure d'audience » du bandeau et remettre Google Analytics dans confidentialite.html et le texte du bandeau.
- Nom de l'application Stripe, données qu'elle transmet à Meta et respect du refus des cookies :
  à reporter dans confidentialite.html (ligne « Mesure des achats publicitaires »).
- Stripe (après mise en ligne de /merci) : redirection du lien de paiement vers
  https://andersonparis.fr/merci?session_id={CHECKOUT_SESSION_ID}.

Mis de côté volontairement : téléphone, adresse Vercel, médiateur, IDU (mentions-legales.html) et entrepôt d'expédition (CGV article 5, ne pas le mentionner).

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
retractation.html ET mentions-legales.html ET merci.html.
Le prix est aussi dans suivi.js (`PRIX`, valeur envoyée à Meta et Google).
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
- Framework, dépendance npm ou script tiers ajouté -> BLOQUANT
- Tracker chargé hors du bandeau de consentement, ou sans mise à jour de confidentialite.html -> BLOQUANT
- Donnée envoyée à Meta ou Google depuis le site sans consentement -> BLOQUANT
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
