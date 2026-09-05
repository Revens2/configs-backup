# Règles globales — Claude Code

Ce fichier ne contient que des **règles comportementales stables**. Les IP, ports, chemins de déploiement, versions de modèles, services et autres données volatiles vivent dans le Vault/RAG ou dans l'état réel du dépôt/de la machine.

## 1. Autonomie

Décider et exécuter sans confirmation intermédiaire quand l'intention est claire. Poser une question précise uniquement si une ambiguïté change réellement la solution. Ne jamais faire répéter une information déjà présente dans le dépôt, le Vault ou l'état de mission.

Ne jamais inventer un host, une IP, un port, un credential, un chemin ou une stack.

## 2. Sources de vérité

Ordre de priorité :

1. état réel du dépôt ou de la machine ;
2. Vault/RAG Obsidian ;
3. fichiers d'instructions et configuration du projet ;
4. documentation externe à jour ;
5. mémoire de session.

Une information volatile retrouvée dans une vieille note ou un ancien rapport doit être vérifiée avant usage.

## 3. Routage de complexité

Classer la mission avant de dépenser du contexte.

### FAST
Périmètre connu, modification locale/réversible, fichiers déjà identifiés, faible blast radius.

- Exécuter directement.
- Pas de `planificateur`.
- Pas de graphe obligatoire si la localisation et l'impact sont déjà évidents.

### STANDARD
Périmètre partiellement connu, code à localiser ou impact incertain.

- Déléguer uniquement le point d'incertitude au spécialiste adapté.
- Sur du code, `decouverte` peut fournir un brief compact.
- Si ce brief rend l'implémentation évidente, exécuter sans produire de `plan.md`.

### DEEP
Nouvelle fonctionnalité importante, refactor large, migration, audit large, architecture ou travail multi-domaines.

- Lancer `planificateur` en contexte isolé.
- Le planificateur peut déléguer à `decouverte` et aux autres spécialistes.
- Produire `plan.md` + `progress.md` avant l'exécution.
- L'exécution repart d'un contexte propre quand le contexte courant contient beaucoup d'exploration ou d'impasses.

### CRITICAL
Production, sécurité, réseau/SSH, migration irréversible ou action à fort blast radius.

- Même discipline que DEEP.
- État réel en lecture seule avant modification.
- Sauvegarde et rollback explicites.
- Une modification à la fois, puis vérification effective.

Le nombre brut d'étapes ou de fichiers n'est **pas** à lui seul un déclencheur de planification lourde. Le critère principal est l'incertitude, le blast radius et le coût d'une erreur.

## 4. Sous-agents

Autorisation permanente : déléguer sans confirmation quand cela réduit le bruit ou apporte une compétence spécialisée.

| Besoin | Sous-agent |
|---|---|
| Architecture/codebase, symboles, appelants, blast radius | `decouverte` |
| Plan complexe, migration, refactor, architecture | `planificateur` |
| Documentation versionnée d'une lib/API | `docs-fetcher` |
| Recherche web, veille, comparaison, navigation web | `web-researcher` |
| Contexte projet/infra/Vault | `obsidian-context-retriever` |
| Gros fichier, dump, log statique | `triage-contexte` |
| Linux, Docker, PM2, SSH, réseau, VPS | `vps-sysadmin` |
| Diff, PR, CI/CD, revue de code | `github-code-review` |
| Conversion, fixtures, scaffolding, doc passive | `little-tasks` |
| SEO | `seo-expert` |

Le parent connaît **quand** déléguer ; le mode d'emploi détaillé appartient au fichier du sous-agent. Ne recopier aucune procédure spécialisée ici.

Le rapport d'un sous-agent doit être court, auto-suffisant et ne jamais remonter le transcript brut.

## 5. Navigation du code adaptative

Le propriétaire de CodeGraph/Graphify est `decouverte`.

- Architecture, rôle d'un fichier, communautés : Graphify.
- Symboles, appelants, dépendances, impact : CodeGraph.
- Refactor/migration large avec incertitude structurelle : les deux.
- Édition locale dont le fichier et l'impact sont déjà connus : aucun graphe obligatoire.

Ne jamais imposer les deux graphes uniquement parce qu'une tâche dépasse un nombre arbitraire d'étapes.

## 6. Context engineering

Objectif : maintenir une fenêtre de contexte à **signal élevé**, pas la remplir.

### État durable

Pour DEEP/CRITICAL :

- `plan.md` : stratégie stable et critères d'acceptation ;
- `progress.md` : **snapshot compact de l'état courant**, réécrit en place ;
- `errors.md` : historique détaillé des erreurs uniquement quand utile, append-only.

`progress.md` ne doit pas devenir un journal infini. Il contient au maximum : objectif, étape courante, fait, reste à faire, décisions, blocages actifs, validations.

Une nouvelle session ou un second compte Claude reprend avec `plan.md` + `progress.md`, pas avec l'ancien transcript. Lire `errors.md` seulement si un problème correspondant revient.

### Anti lost-in-the-middle

Ne pas réémettre le ToDo complet à chaque réponse. Sur une mission longue, terminer seulement par un micro-ancrage :

`STATE <étape>/<total> | next: <action> | blocker: <aucun|...>`

L'état canonique reste sur disque. À une frontière de phase, après une longue exploration ou quand le contexte devient bruyant, repartir dans un contexte propre et relire uniquement `plan.md` + `progress.md`.

Les gros payloads, logs, sorties d'outils et recherches sont filtrés avant de revenir au parent.

## 7. MCP et recherche externe

- Vault/RAG → `obsidian-context-retriever` et `mcp__vault__*`.
- Documentation versionnée → `docs-fetcher` / Context7.
- Recherche internet → `web-researcher`.

Aucun usage de NotebookLM dans la chaîne active.

Les MCP non nécessaires à un projet doivent rester hors de son contexte quand le runtime permet de les désactiver ou de les limiter en portée.

## 8. Terminal et volume

Utiliser RTK pour les commandes Bash à sortie potentiellement volumineuse. Préférer Grep/Glob/Read ciblés aux dumps de shell. Une sortie déjà massive doit être réduite avant lecture par un modèle fort.

## 9. Git

Sur un dépôt personnel dont je suis le seul auteur, pousser sur `main` si je le demande explicitement ; ne pas créer une branche ou PR uniquement par réflexe. Sur un dépôt partagé ou un workflow qui exige une PR, conserver branche + PR.

Ne jamais commit/push/deploy/merge sans demande explicite.

## 10. Sécurité

- Jamais de secret en clair dans un prompt, un fichier d'état ou un commit.
- Infrastructure : SSH par alias documenté, jamais IP + clé devinées.
- Production/réseau : sauvegarde + rollback avant action risquée.
- Toute validation doit être effective : tests, linter, typecheck, build ou commande d'état adaptée.

## 11. Handoff inter-runtime / inter-compte

Claude Code CLI, Claude Code Desktop, Codex et les autres runtimes ne partagent pas forcément leur mémoire privée. Une mission transférable doit donc vivre dans ses artefacts :

- `plan.md` si plan nécessaire ;
- `progress.md` comme état compact courant ;
- `errors.md` si historique d'erreurs utile.

Le handoff ne transporte jamais un transcript complet si ces artefacts suffisent.