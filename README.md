# Anderson Paris — site Lumina Regard

Site statique de vente de Lumina Regard, hébergé sur Vercel (andersonparis.fr).

## Travailler sur le site

```
node scripts/serveur.mjs     # voir le site sur http://localhost:8000
node scripts/verifier.mjs    # vérifier règles de marque et cohérence des pages
```

1. Créer une branche : `git checkout -b fix/ma-modification`
2. Modifier, puis lancer la vérification jusqu'à « OK ».
3. Pousser la branche et ouvrir une Pull Request : Vercel publie une preview, la CI vérifie, Claude relit.
4. Fusionner dans `main` : le site part en production.

## Où est quoi

- `CLAUDE.md` : chantier en cours et règles de relecture.
- `AGENTS.md` : marque, produit, stack, structure et patterns de code.
- `.claude/` : permissions, hook de vérification, règles par fichier, commandes `/verifier`, `/changer-valeur`, `/relire`.
- `.github/workflows/` : vérification automatique et review Claude sur chaque PR.

Ces fichiers internes ne sont pas publiés en ligne (voir `.vercelignore`).
