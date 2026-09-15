---
description: Vérifie tout le site et corrige jusqu'au vert
allowed-tools: Bash(node scripts/verifier.mjs:*), Read, Edit, Grep
---
Résultat actuel : !`node scripts/verifier.mjs`

Pour chaque ligne ERREURS : lis le fichier à la ligne indiquée, applique la correction minimale
qui respecte CLAUDE.md, puis relance `node scripts/verifier.mjs`. Recommence jusqu'à « OK ».

Ne corrige jamais une erreur en inventant une valeur (délai, SIRET, médiateur…) :
dans ce cas, arrête-toi et demande la valeur.
Les lignes A COMPLETER ne bloquent pas : liste-les simplement à la fin.
