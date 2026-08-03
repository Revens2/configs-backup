---
name: plan-run
description: Exécute un plan de travail long en le lisant depuis `progress.md` plutôt que depuis le contexte. À utiliser dès qu'une tâche dépasse 3 étapes, s'étale sur plusieurs sessions, ou risque une compaction — migration, audit, refactoring large, mise en place d'infra. Crée `progress.md` s'il n'existe pas, puis boucle : lire → décider (déléguer ou exécuter) → vérifier → cocher.
---

# plan-run — boucle de plan sur fichier

Un fichier ne se compacte pas et survit à un crash. **`progress.md` est la source de vérité de
l'avancement, pas ton contexte.** Si les deux divergent, le fichier a raison.

## Boucle

1. **Lire** `progress.md` en entier. Toujours, à chaque tour — y compris juste après une compaction.
2. **Identifier** la première tâche non cochée (`[ ]` ou `[~]`).
3. **Décider** : déléguer ou exécuter soi-même (critère ci-dessous).
4. **Exécuter**, puis **vérifier** contre le critère d'acceptation écrit dans la tâche.
5. **Cocher** `[x]` — *seulement* si la vérification est passée. Jamais sur impression.
6. Passer à la suivante. En cas d'échec : consigner dans la section « Erreurs », laisser `[~]`,
   et ne pas rejouer la même approche.

## Critère de découpe : ratio bruit / conclusion

Beaucoup de sortie pour une petite conclusion → **worker**. Recherche web, lecture de logs,
exploration de codebase, balayage de gros fichiers.

Tâche courte et ciblée sur des fichiers connus → **orchestrateur lui-même**. Instancier un worker
coûterait plus cher que la tâche.

Arbitrage en vigueur : **(A) priorité tokens** — déléguer uniquement sur fort volume ; l'orchestrateur
fait les tâches moyennes et courtes lui-même. Workers disponibles : `web-researcher`,
`obsidian-context-retriever`, `triage-contexte`, `little-tasks`, `vps-sysadmin`.

## Format de `progress.md`

```markdown
# <objectif en une ligne>
_maj <date> · arbitrage : (A) tokens_

## Tâches
- [ ] **1. <intitulé>**
      critère : <vérifiable — commande de test, fichier qui existe, service qui répond>
      cible : orchestrateur | <nom du worker>
- [~] **2. <intitulé>**    ← en cours
      critère : …
      cible : …
- [x] **3. <intitulé>**    ← vérifié, pas seulement fait

## Décisions
- <arbitrage tranché, pour ne pas le rejouer>

## Erreurs (append-only — ne jamais purger)
- <date> tâche N : <message exact> → <ce qui a été tenté> → <ce qu'il ne faut plus refaire>
```

Règles de forme : une tâche = une ligne cochable, sinon la reprise après compaction ne sait pas où
elle en est. Un critère d'acceptation **vérifiable** par tous — « ça marche » n'en est pas un.
La section Erreurs est **append-only** : la purger fait rejouer les mêmes échecs.

## Reprise après compaction

Le hook `PreCompact` (`~/.claude/hooks/state-save.mjs`) écrit dans
`~/.claude/state/<projet>/STATE.md` un pointeur vers `progress.md` et les 3 prochaines tâches non
cochées. `SessionStart` (matchers `startup|resume|compact`) le réinjecte. Ce résumé sert à retrouver
le fichier, **pas** à travailler dessus : relire `progress.md` avant d'agir.

## Interdits

- Cocher une tâche sans vérification effective (test, linter, typecheck, appel réel).
- Tenir le plan en mémoire au lieu du fichier.
- Supprimer une entrée de la section Erreurs.
- Réécrire l'historique du fichier : on ajoute, on coche, on ne réécrit pas.
