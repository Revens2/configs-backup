---
description: Exécute un plan de travail long depuis progress.md — lire, décider, vérifier, cocher. Pour toute tâche de plus de 3 étapes ou qui risque une compaction.
---

# plan-run — boucle de plan sur fichier

Un fichier ne se compacte pas et survit à un crash. **`progress.md` est la source de vérité de
l'avancement, pas ton contexte.** Si les deux divergent, le fichier a raison.

## Boucle

1. **Lire** `progress.md` en entier. Toujours, à chaque tour — y compris juste après une compaction.
2. **Identifier** la première tâche non cochée (`[ ]` ou `[~]`).
3. **Décider** : déléguer à un worker, ou exécuter soi-même (critère ci-dessous).
4. **Exécuter**, puis **vérifier** contre le critère d'acceptation écrit dans la tâche.
5. **Cocher** `[x]` — *seulement* si la vérification est passée. Jamais sur impression.
6. Passer à la suivante. En cas d'échec : consigner dans la section « Erreurs », laisser `[~]`,
   et ne pas rejouer la même approche.

## Critère de découpe : ratio bruit / conclusion

Beaucoup de sortie pour une petite conclusion → **worker**. Recherche web, lecture de logs,
exploration de codebase, balayage de gros fichiers.

Tâche courte et ciblée sur des fichiers connus → **toi-même**. Instancier un worker coûterait plus
cher que la tâche.

Arbitrage en vigueur : **(A) priorité tokens** — déléguer uniquement sur fort volume.

Workers disponibles dans ce runtime (`task`) : `web-researcher`, `obsidian-context-retriever`,
`triage-contexte`. `general` et `explore` sont en `deny` : ils font doublon et ne sont pas chargés.
Ces trois workers **ne peuvent pas eux-mêmes déléguer** — profondeur maximale : toi → un worker.

## Format de `progress.md`

```markdown
# <objectif en une ligne>
_maj <date> · arbitrage : (A) tokens_

## Tâches
- [ ] **1. <intitulé>**
      critère : <vérifiable — commande de test, fichier qui existe, service qui répond>
      cible : orchestrateur | <nom du worker>
- [~] **2. <intitulé>**    ← en cours
- [x] **3. <intitulé>**    ← vérifié, pas seulement fait

## Décisions
- <arbitrage tranché, pour ne pas le rejouer>

## Erreurs (append-only — ne jamais purger)
- <date> tâche N : <message exact> → <ce qui a été tenté> → <ce qu'il ne faut plus refaire>
```

Une tâche = une ligne cochable, sinon la reprise après compaction ne sait pas où elle en est.
Les lignes `critère :` et `cible :` sont **indentées sous** la ligne cochable : c'est ce qui permet
au plugin `plan-pointer` de les faire traverser la compaction avec la tâche.
Un critère d'acceptation **vérifiable** — « ça marche » n'en est pas un.

## Reprise après compaction

Le plugin `~/.config/opencode/plugins/plan-pointer.ts` s'accroche à
`experimental.session.compacting` : le pointeur vers `progress.md`, le compteur `n/total` et la
tâche `[~]` **avec son critère** sont ajoutés au prompt de compaction. Le même pointeur est
réinjecté à chaque requête via `experimental.chat.system.transform`.

Ce résumé sert à retrouver le fichier, **pas** à travailler dessus : relire `progress.md` avant
d'agir.

## Interdits

- Cocher une tâche sans vérification effective (test, linter, typecheck, appel réel).
- Tenir le plan en mémoire au lieu du fichier.
- Supprimer une entrée de la section Erreurs.
- Réécrire l'historique du fichier : on ajoute, on coche, on ne réécrit pas.

---

Si `progress.md` n'existe pas dans le répertoire courant, le créer au format ci-dessus à partir de
la demande, puis démarrer la boucle. Objectif fourni en argument : $ARGUMENTS
