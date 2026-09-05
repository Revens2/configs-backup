# Règle — orchestration Antigravity / AGY

AGY est un **runtime de substitution complet** quand Claude Code n'est pas disponible ou que son quota est contraint. Une mission complexe ne doit jamais être volontairement simplifiée ou “dégradée” parce qu'elle tourne sur AGY : seul le mécanisme d'orchestration change.

Antigravity orchestre avec les capacités réellement disponibles dans ce build : Rules, Skills, Plugins, Hooks, MCP et workers/outils exposés par la session. Ne simule jamais un sous-agent inexistant ; reproduis plutôt sa **fonction logique** sous forme de phase isolée, skill, plugin, fichier intermédiaire ou worker disponible.

## Routage de complexité

### FAST
Périmètre connu, modification locale/réversible, faible incertitude → exécuter directement puis vérifier.

### STANDARD
Périmètre à localiser ou impact incertain → faire une exploration ciblée et matérialiser uniquement le brief nécessaire avant exécution.

### DEEP
Nouvelle fonctionnalité importante, refactor large, migration, audit large, architecture, tâche multi-domaines → planification explicite sur disque avant exécution.

### CRITICAL
Production, sécurité, réseau/SSH, migration irréversible ou fort blast radius → DEEP + état read-only initial + sauvegarde/rollback + vérification après chaque changement.

## État durable et contexte propre

Pour DEEP/CRITICAL :

- `plan.md` : stratégie stable, étapes atomiques et critères d'acceptation ;
- `progress.md` : **snapshot compact de l'état courant**, réécrit en place ;
- `errors.md` : historique détaillé des erreurs seulement si utile, append-only.

`progress.md` n'est pas un journal infini. Il contient seulement : objectif, étape courante, fait, reste à faire, décisions, blocages actifs et validations.

Ne réémets jamais le ToDo complet à chaque réponse. Si un ancrage de récence est utile, termine par une ligne :

`STATE <étape>/<total> | next: <action> | blocker: <aucun|...>`

À une frontière de phase ou après une exploration bruyante, reprendre depuis `plan.md` + `progress.md` plutôt que conserver du contexte devenu inutile.

## Principe d'externalisation

Beaucoup de matière pour une petite conclusion doit être traitée hors du contexte principal :

- logs/dumps → filtrage déterministe ou worker économique avant synthèse ;
- documentation/API → outil ou skill de documentation ciblé ;
- Vault/RAG → plugin/MCP seulement quand nécessaire ;
- exploration code → graphes/recherche ciblée, résultat matérialisé en brief ;
- rapports longs → fichier, puis seulement une synthèse dans le fil.

Le parent ne lit jamais un dump brut “pour voir”.

## Plugins / MCP

N'activer un plugin de domaine que lorsqu'il est nécessaire. Le désactiver après usage si son chargement permanent ajoute des schémas inutiles au contexte.

Aucun usage de NotebookLM dans la chaîne active.

## Validation

Une tâche n'est terminée qu'après une vérification adaptée : tests, linter, typecheck, build, endpoint réel ou commande d'état. Ne jamais cocher sur impression.

## Interdits

- Deviner une stack, une IP, un port, un credential ou un chemin.
- Réduire l'ambition d'une mission complexe simplement parce qu'elle tourne sur AGY.
- Charger des plugins/outils inutiles “au cas où”.
- Garder dans `progress.md` des dumps ou stack traces complètes.
- Conserver une exploration périmée en contexte quand un handoff propre suffit.