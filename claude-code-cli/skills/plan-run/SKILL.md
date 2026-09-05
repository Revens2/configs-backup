---
name: plan-run
description: >-
  Conduit une mission DEEP/CRITICAL avec `plan.md` comme stratégie stable et `progress.md` comme état courant compact. À utiliser selon l'incertitude, la durée et le blast radius — pas simplement selon le nombre d'étapes.
---

# plan-run — exécution durable à contexte propre

Pour une mission longue :
- `plan.md` = stratégie stable, périmètre et critères de succès ;
- `progress.md` = **snapshot compact courant**, réécrit en place ;
- `errors.md` = historique détaillé uniquement lorsqu'il évite réellement de répéter des échecs.

Le contexte de conversation n'est pas la source de vérité.

## Activation

Utiliser pour DEEP/CRITICAL : architecture, refactor large, migration, audit large, travail multi-domaines, production ou action à fort blast radius.

Ne pas l'activer mécaniquement sur une tâche FAST/STANDARD claire sous prétexte qu'elle contient plusieurs étapes ou plusieurs fichiers.

## Boucle

1. Lire `progress.md`. Lire `plan.md` seulement lorsqu'une décision stratégique est nécessaire.
2. Identifier la première tâche `[ ]` ou `[~]`.
3. Décider : exécution directe si la tâche est ciblée ; délégation si un spécialiste apporte réellement isolation, expertise ou compression de volume.
4. Exécuter puis vérifier contre le critère observable.
5. Réécrire `progress.md` en place avec l'état actuel, `next` et `blocker`.
6. Replanifier seulement si l'évidence invalide une hypothèse ou le rayon d'impact.

## Délégation

Le parent garde la coordination. Les spécialistes absorbent le bruit et rendent uniquement un brief utile :
- découverte/codebase → `decouverte` ;
- documentation versionnée → `docs-fetcher` ;
- web → `web-researcher` ;
- Vault/RAG → `obsidian-context-retriever` ;
- gros fichiers statiques → `triage-contexte` ;
- infra → `vps-sysadmin` ;
- travail répétitif → `little-tasks` ;
- revue de diff → `github-code-review`.

N'instancie pas un worker pour une opération plus courte que le coût de délégation.

## Format de `progress.md`

```markdown
# Progress

## State
next: <action immédiate>
blocker: <aucun|description courte>

## Tasks
- [x] **1. <tâche validée>**
      critère: <preuve observable>
      cible: orchestrateur | <worker>
- [~] **2. <tâche courante>**
      critère: <preuve observable>
      cible: orchestrateur | <worker>
- [ ] **3. <prochaine tâche>**
      critère: <preuve observable>
      cible: orchestrateur | <worker>

## Decisions
- <uniquement les décisions qui changent la suite>
```

Pas de timestamps répétés, de transcript, de logs bruts ou de stack traces complètes dans `progress.md`.

## Erreurs

Si un échec doit rester visible pour éviter une boucle, l'écrire dans `errors.md` en append-only avec : tâche, symptôme, approche tentée, résultat et prochaine hypothèse. Sinon, garder seulement le résumé utile dans `progress.md`.

## Reprise / compaction / changement de compte

Les hooks peuvent réinjecter un pointeur vers l'état. Ce pointeur sert à retrouver les fichiers, pas à recopier tout le plan dans le contexte.

À une frontière de phase, après une compaction, un crash ou un changement de compte Claude : reprendre avec uniquement `plan.md` + `progress.md` et le contexte projet chargé automatiquement.

Message de reprise minimal :

> Lis `plan.md` et `progress.md`, vérifie les préconditions de la tâche courante, puis continue la première tâche non terminée. Mets à jour `progress.md` uniquement après validation effective.

## Interdits

- Cocher sans preuve effective.
- Transformer `progress.md` en journal append-only.
- Réémettre tout le ToDo dans chaque réponse.
- Remonter des sorties brutes d'exploration au parent.
- Deviner des données dynamiques absentes des sources.
