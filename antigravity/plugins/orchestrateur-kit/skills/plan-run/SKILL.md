---
name: plan-run
description: >-
  Exécute un plan de travail long en le lisant depuis `progress.md` plutôt que depuis le contexte.
  À utiliser dès qu'une tâche dépasse 3 étapes, s'étale sur plusieurs sessions, ou risque une
  compaction — migration, audit, refactoring large, mise en place d'infra. Crée `progress.md` s'il
  n'existe pas, puis boucle : lire → décider → exécuter → vérifier → cocher.
---

# plan-run — boucle de plan sur fichier

Un fichier ne se compacte pas et survit à un crash. **`progress.md` est la source de vérité de
l'avancement, pas ton contexte.** Si les deux divergent, le fichier a raison.

## Boucle

1. **Lire** `progress.md` en entier. Toujours, à chaque tour.
2. **Identifier** la première tâche non cochée (`[ ]` ou `[~]`).
3. **Exécuter** — toi-même. **Antigravity n'a pas de sous-agents** : Rules, Skills, Plugins, Hooks,
   MCP, rien d'autre. Ne cherche pas à déléguer, il n'y a personne.
4. **Vérifier** contre le critère d'acceptation écrit dans la tâche.
5. **Cocher** `[x]` — *seulement* si la vérification est passée. Jamais sur impression.
6. Passer à la suivante. En cas d'échec : consigner dans la section « Erreurs », laisser `[~]`,
   et ne pas rejouer la même approche.

## Le volume se traite par fichier, pas par contexte

Faute de worker à qui déléguer, la règle du ratio bruit/conclusion se joue autrement : **écris la
sortie brute dans un fichier, puis ne relis que l'extrait utile.**

```bash
rtk <commande> > sortie.txt          # RTK compresse déjà à la source
cat gros.log | agy "STRICT: <filtre>" > extrait.md
```

Ne charge jamais un log, un dump ou un balayage complet dans le contexte.

## Format de `progress.md`

```markdown
# <objectif en une ligne>
_maj <date> · arbitrage : (A) tokens_

## Tâches
- [ ] **1. <intitulé>**
      critère : <vérifiable — commande de test, fichier qui existe, service qui répond>
      cible : orchestrateur
- [~] **2. <intitulé>**    ← en cours
- [x] **3. <intitulé>**    ← vérifié, pas seulement fait

## Décisions
- <arbitrage tranché, pour ne pas le rejouer>

## Erreurs (append-only — ne jamais purger)
- <date> tâche N : <message exact> → <ce qui a été tenté> → <ce qu'il ne faut plus refaire>
```

Une tâche = une ligne cochable, sinon la reprise ne sait pas où elle en est. Les lignes `critère :`
et `cible :` sont **indentées sous** la ligne cochable : c'est ce qui permet au hook `plan-pointer`
de les réinjecter avec la tâche.

## Reprise après compaction

**Antigravity n'expose aucun événement de pré-compaction.** Ses cinq événements de cycle de vie sont
`PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop` — rien sur la compaction.

Le relais retenu est `PreInvocation` : le hook `plan-pointer` de ce plugin réinjecte, **avant chaque
invocation du modèle**, un `ephemeralMessage` portant le pointeur vers `progress.md`, le compteur
`n/total` et la tâche `[~]` avec son critère. Une compaction ne peut donc pas faire perdre la ligne
en cours : elle est réécrite au tour suivant.

Ce rappel sert à retrouver le fichier, **pas** à travailler dessus : relire `progress.md` avant
d'agir.

## Interdits

- Cocher une tâche sans vérification effective (test, linter, typecheck, appel réel).
- Tenir le plan en mémoire au lieu du fichier.
- Supprimer une entrée de la section Erreurs.
- Chercher à déléguer : il n'y a pas de sous-agents dans ce runtime.
