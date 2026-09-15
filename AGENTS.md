# Anderson Paris — Stack, structure et patterns

## Équipe et langue
- Projet solo, non développeur : expliquer les choix simplement, en français.
- Langue du site, des commentaires et des commits : français.
- Vouvoiement de la cliente. Signature « Anderson Paris » ou « nous », jamais un prénom.
- Commentaires : rares, seulement quand le code ne se suffit pas (ex. le lien Stripe).

## La marque
DNVB beauty-tech française. Maison anonyme, aucun fondateur incarné.
Esthétique : Vogue clinique suisse. Références Aesop, Byredo, Augustinus Bader.
Cible : femmes 35-55 ans, France, Belgique, Luxembourg, Suisse.

## Le produit
Lumina Regard — appareil de soin du CONTOUR DES YEUX (jamais visage entier).
129 €, achat unique. LED 660 nm, micro-courant, chaleur 36-40 °C,
vibration, tête articulée à 270°. 4 modes. Rituel 6 min/jour.
Ne pas confondre avec « Lumina Pro », ancien produit abandonné
(630 nm, visage entier, 8000 RPM) — toute mention est une erreur.

## Stack
| Couche | Choix |
|---|---|
| Pages | HTML statique, aucun framework, aucune dépendance |
| Styles | CSS inline dans index.html ; style.css partagé par les pages légales |
| Script | `suivi.js` (PostHog, Google Analytics et pixel Meta, soumis au consentement) + un `<script>` en bas de index.html (lien Stripe, bandeau, barre d'achat mobile) et de merci.html (achat) |
| Polices | Google Fonts : Bodoni Moda (titres), Jost 300 (texte) |
| Paiement | Stripe Payment Link, retour sur /merci. Pas de panier, pas de back-end. Achats transmis à Meta par une application Stripe |
| Hébergement | Vercel, `cleanUrls` (/cgv sert cgv.html), déploiement auto à chaque push |
| Outillage | Node (scripts/*.mjs), sans package.json ni node_modules |

## Environnements
| Env | Adresse | Déclencheur |
|---|---|---|
| Production | www.andersonparis.fr | push sur `main` |
| Preview | URL Vercel de la branche | push sur toute autre branche |
| Local | http://localhost:8000 | `node scripts/serveur.mjs` |

Le domaine canonique est **`www.andersonparis.fr`** : l'apex `andersonparis.fr` renvoie
un `308` permanent vers `www`, et le certificat TLS ne couvre que `www`. Toute URL
absolue publiée (canonical, sitemap, robots.txt, Open Graph) porte donc le `www.` ;
l'écrire sans préfixe pointerait vers une redirection au lieu du contenu.

## Structure
```
anderson-paris/
├── index.html              Landing Lumina Regard (CSS inline, CTA Stripe)
├── cgv.html                Conditions générales de vente
├── retractation.html       Rétractation, retours, formulaire type
├── mentions-legales.html   Éditeur, hébergeur, DEEE, médiation
├── confidentialite.html    RGPD
├── merci.html              Confirmation après paiement Stripe (même squelette que les pages légales)
├── guide-rituel.html       Guide d'utilisation, lien envoyé par les emails Klaviyo (même squelette, noindex)
├── guide-serums.html       Guide des sérums compatibles (même squelette, noindex)
├── calendrier-rituel.html  Calendrier des 12 semaines à imprimer (même squelette, noindex)
├── api/stripe-webhook.js   Transmet chaque commande Stripe à Klaviyo (flow « Commande Passée »)
├── suivi.js                Traceurs soumis au consentement, partagés par index.html et merci.html
├── style.css               Styles des pages légales et de merci.html
├── images/                 Toutes les images du site
├── vercel.json             cleanUrls
├── .vercelignore           Fichiers internes jamais publiés
├── scripts/verifier.mjs    Vérification : règles de marque + cohérence
├── scripts/serveur.mjs     Serveur local avec cleanUrls
├── Makefile                Raccourcis (CI Linux ; sous Windows, lancer node directement)
├── CLAUDE.md               Chantier en cours + règles de review
├── AGENTS.md               Ce fichier
├── .claude/                settings, rules, commands, agents
└── .github/workflows/      Vérification + review Claude sur les PR
```

## Commandes
| Action | Commande |
|---|---|
| Vérifier le site | `node scripts/verifier.mjs` (ou `make verifier`) |
| Voir le site en local | `node scripts/serveur.mjs` (ou `make dev`) |

## Design system
```css
--albatre:#F5F0EB;  --papier:#FBF9F6;  --rose:#C9A87C;   /* rose-gold */
--anthracite:#3A3A3A;  --encre:#232323;  --ligne:#DDD5CB;
--serif:"Bodoni Moda",Georgia,serif;  --sans:"Jost",-apple-system,Helvetica,Arial,sans-serif;
```
Aucun arrondi, nulle part. Style éditorial, beaucoup de blanc, une seule idée par section.
Séparations par filets `1px solid var(--ligne)`, jamais d'ombre. Point de rupture mobile unique : 860px.

## Patterns

### Section de landing (index.html)
Une section = un `<h2>` = une idée. Le texte courant tient dans `.col` (60ch).
```html
<section>
  <div class="wrap">
    <div class="col"><h2>Le rituel tient en trois actes.</h2>
    <p>Six minutes, une fois par jour. La photobiomodulation fonctionne par accumulation cellulaire : la régularité prime sur l'intensité.</p></div>
    <div class="rituel">
      <div class="acte">
        <h3>Préparer</h3>
        <p>Peau nettoyée, puis eau thermale ou sérum hydratant.</p>
      </div>
    </div>
  </div>
</section>
```

### Grille éditoriale avec mesure (index.html)
```html
<div class="tech">
  <div class="item">
    <div class="mesure">660 nanomètres</div>
    <h3>Lumière LED rouge</h3>
    <p>La photobiomodulation stimule la synthèse de collagène de type I et d'élastine.</p>
  </div>
</div>
```

### Bouton d'achat (index.html)
Tout lien d'achat porte `data-cta` : le script remplace son `href` par le lien Stripe.
Ne jamais coller l'URL Stripe dans le HTML ; elle vit uniquement dans `LIEN_PAIEMENT`.
```html
<a class="cta" data-cta href="#offre">Commencer le rituel</a>
<span class="sous-cta">Paiement sécurisé · 30 jours pour changer d'avis</span>
```

### Page légale (cgv.html, retractation.html, mentions-legales.html, confidentialite.html)
Même squelette pour les quatre pages : `noindex`, style.css, en-tête avec retour, date de mise à jour, pied de page commun.
```html
<header><div class="bar">
<a class="marque" href="/">Anderson Paris<span>Maison de beauty-tech</span></a>
<a class="retour" href="/">Retour à la boutique</a>
</div></header>
<main><div class="wrap">
<h1>Rétractation et retours</h1>
<p class="maj">Dernière mise à jour : 15 septembre 2026</p>
<h2 style="border-top:none;padding-top:0">Deux possibilités de retour</h2>
<table>
<tr><th>Rétractation légale</th><td>14 jours à compter de la réception.</td></tr>
</table>
</div></main>
```

### Information manquante
Une valeur inconnue ne s'invente jamais : elle se marque, puis se demande.
```html
<span class="aremplir">[numéro à compléter]</span>
```

## Git
- `main` = production. Tout push sur `main` part en ligne.
- Travail sur une branche `type/description` (ex. `fix/faq-livraison`, `feat/barre-achat`), puis PR vers `main` : Vercel crée une preview, la CI vérifie et Claude relit.
- Commits en français, à l'impératif, une modification par commit : « Ajoute le Luxembourg aux pays livrés ».
- Jamais de `push --force` sur `main`.

## Interdits
- Framework, bundler, package.json, dépendance npm, CDN de scripts.
- Tracker ou pixel sans bandeau de consentement et mise à jour de confidentialite.html.
- Nouvelle couleur, nouvelle police, `border-radius`, ombre portée.
- Images hors de /images/ ou sans `alt`.
- Valeur légale ou commerciale inventée (SIREN, délai, médiateur, IDU…).
