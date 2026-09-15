---
description: Relecture marque et conformité des modifications en cours
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(node scripts/verifier.mjs:*), Read, Grep
---
Modifications en cours : !`git diff --stat HEAD`

Lance l'agent relecteur-marque sur `git diff HEAD`.
Rends son rapport tel quel, au format défini dans la section Code Review Rules de CLAUDE.md.
