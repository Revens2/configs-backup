# Environment Map — source de routage

Ce fichier décrit **la topologie logique stable** de la stack IA. Il ne contient volontairement ni IP, ni port, ni credential, ni version de modèle supposée durable.

## Principe

- **ChatGPT / Brainstorming** : cerveau de cadrage, architecture, recherche, routage et génération de prompts d'exécution.
- **Claude Code CLI + Claude Code Desktop** : runtimes d'exécution principaux pour le code, l'architecture et l'infra complexe. Deux comptes peuvent se relayer ; le handoff passe par l'état versionné/écrit sur disque, jamais par la mémoire privée d'un compte.
- **Codex** : runtime d'exécution complet et multi-agent, alternative de premier rang à Claude Code et bras local de ChatGPT quand c'est pertinent.
- **Antigravity / AGY** : **fallback complet** quand le quota Claude est épuisé. Il doit recevoir le même niveau d'exigence qu'une mission Claude. Son mécanisme d'orchestration peut différer (rules / skills / plugins / hooks / capacités effectivement disponibles), mais le prompt ne doit jamais être volontairement “dégradé”.
- **Freebuff** : worker économique pour rapports, transformations et tâches textuelles peu risquées. Ne pas lui envoyer inutilement toute la stack.
- **OpenCode + Qwen local** : runtime local/expérimental, utile pour tâches simples, gros volume à coût marginal faible ou essais ; pas le chemin critique par défaut.

## Sources de vérité

Ordre à utiliser pour décider, sans confondre faits stables et état dynamique :

1. **État réel du dépôt / de la machine**, quand il est accessible.
2. **Vault / RAG Obsidian** pour le contexte projet, infra, décisions et topologie dynamique.
3. **Configuration runtime actuelle** (`claude-code-cli/`, `codex/`, `antigravity/`, `opencode/`, `freebuff/`).
4. **Fichier propre d'un agent / skill / plugin** pour connaître son périmètre exact.
5. **Ce fichier** pour le routage global et la place de chaque runtime.
6. Audits, plans, récapitulatifs et mesures datés : **historiques**, jamais autorité supérieure à une config actuelle.

Ne jamais déduire qu'une capacité est active uniquement parce qu'un fichier historique ou un dossier au nom d'agent existe.

## Vault / RAG

Le Vault humain sur Google Drive est la mémoire documentaire principale. Un miroir VPS alimente `vault-mcp` et son index. Le miroir et l'index peuvent avoir un délai ; pour une information très récente, préférer la source live disponible.

`vault-mcp` est le moteur de recherche sémantique actuel. `obsidian-semantic` et l'ancien usage NotebookLM ne font plus partie de la chaîne active.

### Politique de récupération

- Chercher d'abord par requête ciblée.
- Retourner peu de résultats à fort signal.
- Lire ensuite seulement les passages retenus.
- Ne jamais charger des notes entières “au cas où”.
- Ne jamais inventer une IP, un port, un chemin, un service ou une stack absents des sources.

## Niveaux d'exécution

### FAST

Périmètre connu, modification locale et réversible, 1 à 3 fichiers ciblés, faible incertitude.

- Pas de planificateur.
- Pas de graphe si l'emplacement et l'impact sont évidents.
- Exécuter, vérifier, terminer.

### STANDARD

Périmètre partiellement connu ou rayon d'impact incertain.

- Appeler uniquement le spécialiste nécessaire.
- Sur code : `decouverte` peut localiser/mesurer l'impact puis rendre un brief compact.
- Pas de `plan.md` si le plan est déjà évident après cette découverte.

### DEEP

Nouvelle fonctionnalité importante, refactor large, migration, architecture, audit large ou tâche multi-domaines.

- Planification isolée.
- `plan.md` = plan stable et relisible.
- `progress.md` = **snapshot compact de l'état courant**, pas journal infini.
- `errors.md` = historique détaillé des erreurs uniquement si utile.
- Les sous-agents / spécialistes absorbent le bruit ; seuls leurs briefs remontent.

### CRITICAL

Production, sécurité, réseau/SSH, migration irréversible ou action à fort blast radius.

- Même discipline que DEEP.
- État réel en lecture seule avant modification.
- Sauvegarde et rollback explicites.
- Une modification à la fois, puis vérification effective.

## Context engineering

Le but n'est pas de remplir la fenêtre de contexte : c'est d'y maintenir **le minimum d'information à signal maximal**.

- Préfixes d'instructions stables ; données dynamiques en fin de flux ou récupérées juste à temps.
- Gros payloads filtrés avant lecture par un modèle fort.
- Résultats d'outils et explorations brutes ne remontent pas au parent.
- Les décisions importantes sont sérialisées sur disque.
- Sur travail long, la fin de réponse peut contenir un **micro-ancrage** d'une ligne : `STATE <étape>/<total> | next: <action> | blocker: <aucun|...>`.
- Ne jamais réémettre le ToDo complet à chaque tour : l'état canonique est `progress.md`.
- À une frontière de phase ou quand le contexte est pollué, repartir dans un contexte propre avec un handoff structuré (`plan.md` + `progress.md`).

## Artifacts de mission

Dans un dépôt actif :

- `plan.md` — stratégie stable, seulement pour DEEP/CRITICAL.
- `progress.md` — état courant compact et réécrit en place.
- `errors.md` — historique d'erreurs détaillé, append-only si nécessaire.
- Rapports longs / documents réutilisables — emplacement documentaire durable du projet, pas `progress.md`.

Une session qui reprend une mission lit `plan.md` + `progress.md` ; elle n'importe pas l'ancien transcript. `errors.md` n'est relu que si le problème correspondant revient.

## Spécialistes Claude / Codex

Capacités logiques à conserver entre runtimes quand elles existent :

- `decouverte` — codebase, architecture, symboles, appelants, blast radius.
- `planificateur` — stratégie DEEP/CRITICAL et plan d'exécution.
- `triage-contexte` — gros fichiers/dumps/logs statiques.
- `docs-fetcher` — documentation versionnée via Context7.
- `web-researcher` — recherche web/veille et navigation si nécessaire.
- `obsidian-context-retriever` — contexte Vault/RAG.
- `vps-sysadmin` — état machine et infra Linux/DevOps.
- `github-code-review` — revue de diff/PR et risques.
- `little-tasks` — travail répétitif à faible raisonnement.
- `seo-expert` — SEO.

Le parent ne doit connaître que **quand** déléguer. Le mode d'emploi détaillé reste dans le fichier du spécialiste.

## Outillage code adaptatif

- Question sur architecture, rôle de fichier, communautés : **Graphify**.
- Question sur symbole, appelants, dépendances ou impact : **CodeGraph**.
- Refactor/migration large avec incertitude structurelle : **les deux**.
- Édition locale dont le fichier et l'impact sont déjà connus : **aucun graphe obligatoire**.

La complexité en nombre d'étapes n'est pas un motif suffisant pour payer les deux graphes.

## Règle de routage runtime

1. Besoin de qualité maximale / fondation / code complexe / infra risquée → **Claude Code** en priorité.
2. Claude indisponible ou quota contraint → **AGY comme fallback complet**, sans réduire l'ambition de la mission.
3. Besoin d'un second runtime fort, multi-agent, ou exécution issue de ChatGPT → **Codex**.
4. Rapport/transformation/tâche textuelle peu risquée → **Freebuff ou worker économique**.
5. Besoin local/offline/expérimental ou volume peu exigeant → **OpenCode/Qwen**.

Le choix doit aussi tenir compte de la disponibilité réelle, des outils nécessaires et du coût de contexte ; il n'est jamais basé sur une ancienne mesure figée.