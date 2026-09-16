# Contexte — Équipe Hermes sur anderson-paris

Ce dépôt est piloté à la fois par toi (Claude Code / CI) et par l'équipe Hermes
locale. Ce fichier ne remplace pas `AGENTS.md` ni `CLAUDE.md` : il dit **qui fait
quoi** et **ce que l'équipe Hermes n'a pas le droit de faire**.

## Dépôt

- GitHub : `Pops-AI/anderson-paris` (public)
- Branche de production : `main` — **tout push sur `main` part en ligne**
- Clone de travail Hermes : `C:/Users/waser/hermes-commerce/workspaces/anderson-paris`
- Board Kanban associé : `anderson-paris`

## Règle absolue pour les agents Hermes

**Aucun agent ne pousse sur `main`. Jamais.**

Le cycle imposé, identique à celui du README :

1. `git checkout -b type/description` (ex. `fix/robots-sitemap`)
2. modifier
3. `node scripts/verifier.mjs` → doit afficher `OK — aucune erreur.`
4. commit en français, à l'impératif, une modification par commit
5. push de la branche + Pull Request vers `main`
6. Vercel publie une preview, la CI vérifie, Claude relit
7. **C'est le gérant qui fusionne.** Pas l'agent.

Un agent qui ne peut pas satisfaire le vérificateur s'arrête et explique pourquoi.

## Qui fait quoi

| Profil Hermes | Droits sur ce dépôt |
|---|---|
| `code` | branche + commit + PR. Jamais de merge, jamais de push sur `main`. |
| `seo` | **lecture seule.** Il décrit le patch, `code` l'applique. |
| `analytics` | **lecture seule.** |
| `social`, `sav`, `manager` | aucun accès en écriture. |

## Avant toute modification

Lire `AGENTS.md` (marque, stack, patterns, interdits) et `CLAUDE.md` (chantier en cours).
Les interdits du projet s'appliquent intégralement aux agents Hermes :

- pas de framework, bundler, `package.json`, dépendance npm, CDN
- pas de tracker sans bandeau de consentement **et** mise à jour de `confidentialite.html`
- pas de nouvelle couleur, police, `border-radius` ni ombre portée
- pas d'image hors `/images/` ou sans `alt`
- **jamais de valeur légale ou commerciale inventée** (SIREN, délai, médiateur, IDU)

## Champs `[à compléter]` — ne pas les remplir

`node scripts/verifier.mjs` liste 10 champs à compléter. Ce sont des informations
que **seul le gérant** possède (numéro de téléphone, IDU DEEE, IDU batteries,
médiateur de la consommation, réglages fournisseur).

Un agent ne les invente pas, ne les devine pas, ne les supprime pas.
Il les signale, c'est tout.

## Chantier SEO connu (audit du 15/09/2026)

Constats vérifiés par l'agent `seo`, dans l'ordre de priorité :

1. `/guide-rituel` est en `noindex` alors que c'est la seule page éditoriale de fond
2. `robots.txt` et `sitemap.xml` absents (404)
3. `ID_GOOGLE_ANALYTICS = "A_REMPLACER"` dans `suivi.js` → GA4 ne se déclenche jamais
4. aucun `<link rel="canonical">`
5. aucun JSON-LD `Product` / `Offer` / `FAQPage`
6. aucune balise Open Graph ; 1 image sur 6 sans `alt`

Détail complet et actions correctives :
`C:/Users/waser/hermes-commerce/deliverables/seo-audit-initial.md`

**Attention sur le point 5** : le site déclare explicitement « aucun avis client ».
Ajouter un `aggregateRating` serait un faux avis et une violation des règles Google.
Interdit.
