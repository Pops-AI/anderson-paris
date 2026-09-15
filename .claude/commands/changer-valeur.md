---
description: Change un prix, délai, durée ou garantie partout où il apparaît
argument-hint: [ce qui change, ex. « prix 139 € » ou « garantie commerciale 60 jours »]
allowed-tools: Bash(node scripts/verifier.mjs:*), Read, Edit, Grep
---
Changement demandé : $ARGUMENTS

1. Cherche toutes les occurrences de l'ancienne valeur, en chiffres ET en lettres
   (« 30 jours », « trente jours »), dans index.html, cgv.html, retractation.html,
   mentions-legales.html, confidentialite.html.
2. Montre la liste des occurrences trouvées avant de modifier quoi que ce soit.
3. Remplace-les toutes, y compris la barre d'achat mobile et les libellés des boutons.
4. Mets à jour l'objet REFERENCE de scripts/verifier.mjs et le passage concerné de AGENTS.md.
5. Pour une page légale modifiée, mets à jour sa date (et la version des CGV).
6. Lance `node scripts/verifier.mjs` et corrige jusqu'à « OK ».
7. Termine par la liste des fichiers modifiés.
