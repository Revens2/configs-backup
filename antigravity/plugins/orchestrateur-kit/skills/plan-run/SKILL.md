---
name: plan-run
description: >-
  Conduit une mission DEEP/CRITICAL avec un plan durable et un état courant compact sur disque.
  Utilise `plan.md` pour la stratégie stable et `progress.md` pour la prochaine action vérifiable.
  À utiliser selon l'incertitude et le blast radius, pas simplement selon le nombre d'étapes.
---

# plan-run — exécution durable à contexte propre

Le contexte n'est pas la source de vérité. Pour une mission longue :

- `plan.md` = stratégie stable, périmètre, décisions et critères de succès ;
- `progress.md` = **snapshot compact courant**, réécrit en place ;
- `errors.md` = historique détaillé des erreurs uniquement lorsqu'il est réellement utile à éviter une boucle.

Si le contexte et ces fichiers divergent, l'état vérifié sur disque prime.

## Activation

Utilise ce skill pour **DEEP** ou **CRITICAL** : architecture, refactor large, migration, audit large, travail multi-domaines, production ou action à fort blast radius.

Ne l'active pas mécaniquement parce qu'une tâche contient plus de trois étapes. Une tâche FAST ou STANDARD dont le périmètre est clair doit rester directe et légère.

## Initialisation

1. Récupérer uniquement le contexte manquant depuis les sources disponibles : Vault/RAG, dépôt, documentation ou état réel.
2. Écrire `plan.md` si la stratégie n'existe pas déjà.
3. Écrire `progress.md` avec les tâches atomiques et leurs critères d'acceptation.
4. Ne jamais coller les explorations, logs ou sorties d'outils dans ces fichiers.

## Boucle

1. Lire `plan.md` si une décision stratégique est nécessaire ; sinon ne pas le relire inutilement.
2. Lire `progress.md` et identifier la première tâche `[ ]` ou `[~]`.
3. Exécuter avec les primitives **réellement disponibles** dans AGY : Rules, Skills, Plugins, Hooks, MCP et outils/workers exposés par le runtime. Ne pas simuler un custom subagent inexistant.
4. Vérifier contre le critère d'acceptation observable.
5. Réécrire `progress.md` en place : `[x]` si validé, `[~]` si bloqué/en cours, puis mettre à jour `next` et `blocker`.
6. Continuer jusqu'à la prochaine frontière de phase ou jusqu'à la fin.

En cas d'erreur : garder dans `progress.md` uniquement le résumé nécessaire à la prochaine décision. Si l'historique détaillé peut éviter de répéter un échec, l'ajouter à `errors.md` en append-only ; sinon ne pas créer de journal pour le principe.

## Volume et contexte

Beaucoup de sortie pour une petite conclusion doit rester hors du contexte du modèle : rediriger vers un fichier, filtrer, puis ne relire que l'extrait utile. Ne jamais charger un log, dump ou balayage complet « au cas où ».

Les plugins/MCP de domaine ne sont activés que lorsqu'ils servent réellement à la phase courante et sont désactivés après usage si le runtime le permet, afin de ne pas payer leurs schémas à chaque tour.

## Format de `progress.md`

Le hook `plan-pointer` s'appuie sur les lignes cochables ; conserve donc ce format minimal :

```markdown
# Progress

## State
next: <action immédiate>
blocker: <aucun|description courte>

## Tasks
- [x] **1. <tâche validée>**
      critère: <preuve observable>
      cible: orchestrateur
- [~] **2. <tâche courante>**
      critère: <preuve observable>
      cible: orchestrateur
- [ ] **3. <prochaine tâche>**
      critère: <preuve observable>
      cible: orchestrateur

## Decisions
- <uniquement les décisions qui changent la suite>
```

Une tâche = une ligne cochable. Pas de timestamps répétés, pas de transcript, pas de stack trace complète, pas de liste historique infinie.

## Reprise / compaction / changement de runtime

Le hook `plan-pointer` peut rappeler le pointeur vers `progress.md` et la tâche courante. Ce rappel sert à **retrouver l'état**, pas à recopier tout le plan dans le contexte.

À une frontière de phase, après une compaction, un crash, un changement de compte Claude/AGY ou un contexte devenu bruyant : reprendre à partir de `plan.md` + `progress.md`. Ne pas transporter l'ancien transcript.

Message de reprise minimal :

> Lis `plan.md` et `progress.md`, vérifie les préconditions de la tâche courante, puis continue la première tâche non terminée. Mets à jour `progress.md` uniquement après validation effective.

## Interdits

- Cocher sans vérification effective.
- Transformer `progress.md` en journal append-only.
- Réémettre tout le ToDo dans chaque réponse.
- Deviner une donnée dynamique absente des sources.
- Activer un plugin/MCP sans besoin réel et le laisser chargé inutilement.
- Prétendre qu'un custom subagent AGY existe sans capacité runtime vérifiée.
