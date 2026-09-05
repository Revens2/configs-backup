# Context Engineering — stratégie canonique

Objectif : maximiser la qualité de décision avec le minimum de contexte actif, limiter le *lost in the middle*, survivre aux compactions et permettre un handoff propre entre comptes/runtimes.

## Ce que l'on conserve de l'ancienne stratégie

- isolation des explorations et gros volumes ;
- état durable sur disque ;
- préfixe d'instructions stable ;
- validation effective avant de marquer une étape terminée ;
- handoff vers un contexte propre quand une phase a produit beaucoup de bruit.

## Ce que l'on retire

- réémission du ToDo complet à la fin de chaque message ;
- historique complet des stack traces dans `progress.md` ;
- planificateur déclenché uniquement par un seuil arbitraire de nombre d'étapes/fichiers ;
- CodeGraph + Graphify systématiques sur toute tâche code ;
- chargement de documentation ou d'outils “au cas où”.

## Pourquoi

Le travail « Lost in the Middle » (Liu et al., TACL 2024) montre que la position de l'information dans un long contexte affecte fortement les performances : les extrémités sont souvent mieux exploitées que le milieu. La bonne réponse n'est cependant pas de recopier un gros bloc à chaque tour, car cela augmente à son tour la longueur et le bruit du transcript.

Référence : https://aclanthology.org/2024.tacl-1.9/

Les pratiques modernes de context engineering convergent vers la récupération *just in time*, les références légères (chemins, liens, IDs), les sous-agents/contextes isolés et les artefacts persistants plutôt qu'un contexte monolithique.

Références :
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://openai.com/index/harness-engineering/

## Modèle de mission

### FAST
Direct. Pas de plan ni de graphe si le périmètre est déjà connu.

### STANDARD
Résoudre uniquement l'incertitude : spécialiste ciblé / graphe adapté / doc ciblée, puis exécuter.

### DEEP
`plan.md` + `progress.md`, exploration isolée, exécution propre.

### CRITICAL
DEEP + état read-only, rollback, changement atomique et validation immédiate.

## Artifacts

### `plan.md`
Plan stable. Ne change que si la stratégie change réellement.

### `progress.md`
Snapshot compact, réécrit en place :

```md
# Mission state
## Objectif
...
## Étape courante
3/7 — ...
## Fait
- ...
## À faire
- ...
## Décisions
- ...
## Blocages actifs
- aucun
## Validation
- ...
```

### `errors.md`
Optionnel. Historique détaillé append-only : erreur, cause probable, tentative, résultat. Ne pas le relire à chaque tour.

## Recency anchor

Sur une mission longue, une seule ligne en fin de réponse :

`STATE <étape>/<total> | next: <action> | blocker: <aucun|...>`

Ce micro-ancrage maintient l'état immédiat proche de la fin du contexte sans recopier tout le plan.

## Handoff

À une frontière de phase, après une exploration lourde, ou lorsqu'un autre compte/runtime reprend :

1. écrire/mettre à jour `plan.md` et `progress.md` ;
2. ouvrir un contexte propre ;
3. relire uniquement ces deux fichiers ;
4. récupérer le code/doc/infra juste à temps selon la prochaine étape.

Ne jamais transférer un transcript complet si les artefacts suffisent.

## Retrieval

- chemins/IDs/références > gros payloads ;
- top-k faible et pertinent ;
- fetch du passage retenu seulement ;
- gros fichier → filtrage déterministe ou spécialiste ;
- web/doc → question précise ;
- Vault → recherche ciblée puis lecture sélective.

## Graphes

- Graphify : architecture et rôle.
- CodeGraph : symboles et impact.
- Les deux : seulement lorsque la question exige les deux vues.
- Aucun : quand le fichier et le blast radius sont déjà connus.

## Mesure

Toute optimisation de contexte doit être mesurée avec un scénario reproductible :

- tokens d'entrée totaux ;
- nombre d'appels d'outils ;
- nombre de relances/relectures ;
- taux de réussite du premier coup ;
- erreurs répétées ;
- durée de mission.

Optimiser le nombre de tokens au détriment du taux de réussite est un faux gain.