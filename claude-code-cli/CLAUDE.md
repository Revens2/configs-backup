<!-- CODEGRAPH_START -->
## CodeGraph — Codebase Intelligence

CodeGraph is installed. When a `.codegraph/` directory exists in a project, use CodeGraph MCP tools for faster code exploration:

- **Start here:** `codegraph_context` — describe your task, get everything you need in one call
- **Drill down:** `codegraph_callers`, `codegraph_node`, `codegraph_query` — specific lookups
- **Instead of grep/glob:** CodeGraph tools are 10x faster for finding symbols, callers, and dependencies

If `.codegraph/` does NOT exist, suggest: "Run `codegraph init` to enable code intelligence for this project."
<!-- CODEGRAPH_END -->

# Règles globales — comportement des agents

Ce fichier ne contient que du **comportemental**, valable dans tous les projets.
L'infrastructure (VPS, IP, ports, credentials) n'est pas ici : elle vit dans la mémoire
auto (`~/.claude/projects/*/memory/`), l'index mémoire global (`~/.claude/memory/MEMORY.md`)
et dans le vault Obsidian, consultés à la demande.


## Autonomie

Décider et exécuter sans confirmation intermédiaire quand l'intention est claire — ne jamais
me faire répéter. En cas d'ambiguïté réelle, poser une question précise avec options plutôt
qu'avancer à tâtons. Tout processus qui exige une interaction visuelle (login navigateur,
authentification d'un CLI tiers) doit s'ouvrir dans une fenêtre GUI au premier plan (`Start-Process`),
jamais en tâche d'arrière-plan muette.

## Délégation aux sous-agents

Autorisation permanente et globale : ces déclenchements priment sur « ne pas utiliser
d'agent sans demande explicite ». Lancer **immédiatement, sans confirmation**. Le rapport
d'un sous-agent ne m'est pas visible → toujours relayer l'essentiel avant de continuer.

| Déclencheur | Sous-agent |
|---|---|
| Chercher sur internet, veille, état de l'art, doc d'API externe | `web-researcher` |
| Question sur mon vault Obsidian, ou action technique dont le contexte manque (déploiement, config VPS, refactoring, audit, intégration) | `obsidian-context-retriever` |
| Fichier statique volumineux sur disque (log, dump, NDJSON > ~1 000 lignes ou > ~500 Ko) | `triage-contexte` |
| Tâche brute, répétitive, lourde en tokens mais faible en raisonnement | `little-tasks` |
| Administration Linux, Docker, PM2, durcissement, sauvegardes | `vps-sysadmin` |
| Démarrage d'une tâche complexe, refactoring, nouvelle fonctionnalité ou étude d'architecture | `planificateur` |


Précisions :

- **`obsidian-context-retriever`** — interdiction de deviner la stack, la topologie VPS,
  les ports ou les scripts de build ; interdiction de me demander une info qui existe déjà
  dans le vault. Le déclencher même si la mémoire native semble déjà répondre : le vault
  peut être plus complet ou plus à jour. Depuis le 2026-08-04 il travaille le vault
  **par le système de fichiers** (`G:\Mon Drive\Obsidian Vault`) plus `semantic-search` :
  le MCP `obsidian` a été retiré.
- **`triage-contexte`** — seul responsable du triage de logs. Au-delà de 500 Ko il délègue
  le filtrage brut à `agy` (`cat <fichier> | agy "STRICT: ..." > <sortie>`) puis ne lit que
  l'extrait.
- **`little-tasks`** — périmètre : conversion de formats (JSON↔YAML, cURL→`.env.example`,
  table MD↔JSON), mocks/fixtures (JSON, SQL, CSV), documentation passive (JSDoc, README sur
  code existant), scaffolding (`mkdir -p`/`touch`). Il délègue à `agy` et redirige vers un
  fichier ; l'agent principal ne lit jamais la sortie brute, il reprend sur la ligne
  `[little-tasks] … <CHEMIN>`. **Pas** pour le triage de logs.

Exceptions communes : question factuelle triviale, lecture d'une URL unique que je fournis
(`defuddle`/WebFetch suffit), contexte déjà présent dans la conversation ou dans ce fichier,
sorties de commandes terminal (RTK s'en charge).

## Confinement MCP

L'agent principal **n'exécute jamais** ces outils : il instancie le sous-agent dédié et ne
traite que la synthèse.

- `mcp__obsidian-semantic__*` → `obsidian-context-retriever`

Serveurs retirés le 2026-08-04 : `anytype` (mort, clé révoquée), `canva`, `notebooklm`,
`obsidian`. Racine `~/.mcp.json` : `codegraph`, `github`, `obsidian-semantic`. Un serveur
dont on a besoin ponctuellement se déclare dans le `.mcp.json` **du projet**, pas ici.

Trois leviers à ne pas confondre :

- `permissions.deny` — bloque l'**exécution**. Le serveur reste connecté et ses schémas
  restent chargés : **aucun gain de contexte**.
- `deniedMcpServers` (settings) — empêche l'**exécution** côté connecteurs claude.ai.
  **Aucun gain de contexte mesuré** : le 2026-08-04, un relevé avec `deniedMcpServers` vide et un
  relevé avec 2 connecteurs refusés donnent le même total (40 137 vs 40 150 tok). Le gain de
  −24 030 tok annoncé la veille était un artefact de cache — voir la règle de mesure ci-dessous.
- Portée projet (`.mcp.json`) — la bonne façon de n'avoir un serveur que là où il sert.

Le confinement par sous-agent n'existe pas sur Claude Code : `tools:` filtre une liste déjà
chargée. Seul AGY confine réellement, par plugin.

**Règle de mesure du contexte.** Le contexte réellement envoyé au modèle est un **total** :
`cache_creation_input_tokens` **+** `cache_read_input_tokens` du premier tour côté Claude Code,
`usage.input_tokens` **+** `usage.cache_read_tokens` côté AGY. Ne lire que
`cache_creation` fait passer un préfixe déjà mis en cache pour un gain : c'est ainsi qu'un
« −60 % » a été annoncé à tort le 2026-08-04. Aucun gain n'est acquis tant qu'il n'est pas relevé
sur ce total, à cache froid ou en comparant deux totaux.

## RTK — compression des sorties terminal

Le hook `PreToolUse` réécrit automatiquement les commandes en `rtk <cmd>` (0 token
d'overhead). **Portée réelle : l'outil `Bash` uniquement.** Il n'existe pas de matcher
`PowerShell` côté Claude Code — un tel bloc ne se déclenche jamais ; il a été retiré des
settings le 2026-08-08, et `PowerShell` retiré des `tools:` de `little-tasks` et
`triage-contexte`. Corollaire : **passer par `Bash` pour toute commande dont la sortie est
volumineuse** ; PowerShell n'est légitime que pour les cmdlets sans équivalent POSIX, et sa
sortie n'est alors pas compressée. Ne jamais invoquer de sous-agent de filtrage pour une
sortie de terminal. Voir `@RTK.md` pour les méta-commandes (`rtk gain`, `rtk discover`,
`rtk proxy`).

## Navigation du code — CodeGraph **et** Graphify, en paire

Les deux sont **également obligatoires** et ne se remplacent pas. Passer par eux **avant**
`Grep`/`Glob`/lecture exhaustive : une passe au lieu de dix allers-retours.

| Outil | Répond à | Point d'entrée |
|---|---|---|
| **CodeGraph** (`.codegraph/`, MCP `mcp__codegraph__*`) | symboles, appelants/appelés, dépendances, impact, sécurité, données | `codegraph_context "<tâche>"` |
| **Graphify** (`graphify-out/graph.json`, CLI) | architecture, rôle d'un fichier, docs **et** code, communautés, hubs | `graphify query "<question>"` |

Ordre par défaut : `graphify query` pour situer (le *quoi* et le *pourquoi*, docs comprises),
puis `codegraph_context` / `codegraph_callers` pour descendre au symbole (le *où* exact).
Question d'archi ou de contenu de projet → graphify d'abord. Question sur une fonction, un
appelant, un impact de changement → codegraph d'abord. Ne jamais n'en utiliser qu'un seul sur
une tâche de plus de 3 étapes.

Autres commandes graphify : `explain "<noeud>"`, `path "A" "B"`, `god-nodes`,
`affected "X"`. Réindexation incrémentale : `codegraph index` et `graphify update .`.

**Les outils `mcp__codegraph__*` sont différés** : leur schéma n'est pas chargé au démarrage.
Il faut d'abord `ToolSearch` avec `select:mcp__codegraph__codegraph_context,...` (une seule
requête, plusieurs noms séparés par des virgules) avant de pouvoir les appeler. Un appel
direct sans ce chargement échoue en `InputValidationError` — ce n'est pas une panne de
CodeGraph.

## Pipeline standard — brainstorm → plan → exécution déléguée

Chaîne à suivre pour toute tâche non triviale. Elle existe pour contenir le *lost in the
middle* : le plan est un fichier relu à la demande, pas un bloc noyé au milieu du contexte.

1. **Brainstorm** (hors Claude Code, Gem Gemini dédié) — cadrage, options, contraintes.
2. **Plan** — le brief dense est envoyé à Claude Code.
3. **Délégation immédiate** — l'agent principal n'explore pas lui-même : il lance
   `planificateur`, qui explore et écrit `plan.md` **et** `progress.md` à la racine du projet.
4. **Exécution** — l'agent d'exécution lit ces deux fichiers **et rien d'autre** ; le
   transcript d'exploration ne remonte jamais dans le contexte principal.
5. **Recitation** — le bloc todo est réémis en fin de chaque message (§ Niveau 2).

### Déclenchement automatique de `planificateur`

Sans confirmation, dès que **l'une** de ces conditions est vraie au moment où la demande
arrive — évaluer avant d'écrire la moindre ligne :

**A. Un plan a été reçu.** Signal prioritaire, il suffit à lui seul. Le message entrant
ressemble à un plan dès qu'il contient l'un de ces marqueurs :

- une suite d'**étapes numérotées** (`1.` `2.` `3.`, « Étape 1 », « Phase 1 ») ;
- une **liste à puces** de plus de 3 items décrivant des actions à faire ;
- des titres de type `## CONTEXTE & OBJECTIFS`, `## NIVEAU 1/2/3`, `# TASK PROMPT` — c'est
  le gabarit du Gem `Brainstorming Informatique`, donc un plan par construction ;
- une checklist (`- [ ]`), un tableau de tâches, ou un fichier `.md` de prompt collé.

Dans ce cas : **ne pas commencer à exécuter le plan**. Passer le plan tel quel à
`planificateur`, qui explore la codebase, valide ou corrige le plan face au code réel, et
écrit `plan.md` + `progress.md`. C'est la charnière entre le brainstorm Gemini et
l'exécution — c'est là que le contexte se perd si on l'improvise.

**B. Ou bien, à défaut de plan explicite :**

- plus de 3 étapes prévisibles ;
- plus de 2 fichiers à modifier, ou un fichier > 1 000 lignes ;
- refactoring, nouvelle fonctionnalité, migration, audit, mise en place d'infra ;
- la demande contient « plan », « architecture », « refonte », « migrer », « auditer ».

Exceptions : question factuelle, édition d'un seul fichier connu, commande unique à lancer.
Un plan collé n'est **jamais** une exception, même court.

C'est une **règle d'exécution, pas une suggestion** : si les conditions sont réunies et que
`planificateur` n'a pas été lancé, le tour est incorrect. Annoncer le lancement en une ligne,
puis relayer la synthèse — le rapport d'un sous-agent ne m'est pas visible.

## Modèle par sous-agent

Champ `model:` dans le frontmatter de chaque agent. Ordre de résolution :
`CLAUDE_CODE_SUBAGENT_MODEL` (env) > paramètre `model` de l'appel > frontmatter > modèle du
parent. Alias acceptés : `opus`, `sonnet`, `haiku`, `fable`, un ID complet, ou `inherit`
(défaut si omis).

IDs complets, pas d'alias de famille : un alias peut être resolu vers une version différente
selon `availableModels`, alors qu'un ID est stable.

| Agent | Claude Code | AGY / Antigravity | Pourquoi |
|---|---|---|---|
| `planificateur` | **`claude-opus-5`** | Gemini 3.6 Flash | Le raisonnement *est* le livrable. Un plan faux se paie sur toute la chaîne en aval, et il tourne une fois par mission — le surcoût est marginal. |
| `vps-sysadmin` | **`claude-opus-5`** | Gemini 3.6 Flash | Commandes irréversibles sur des machines de prod (UFW, sshd, Docker, PM2). Une erreur coûte un VPS injoignable, pas un rerun. |
| `web-researcher` | **`claude-sonnet-5`** | Gemini 3.6 Flash | Recouper des sources et synthétiser : tâche cadrée, format de sortie imposé. |
| `obsidian-context-retriever` | **`claude-sonnet-5`** | Gemini 3.6 Flash | Recherche sémantique + rédaction d'un brief. Volume modéré, jugement limité. |
| `triage-contexte` | **`claude-sonnet-5`** | Gemini 3.6 Flash | Filtrage de gros volumes. Tâche mécanique, mais sonnet évite les contresens sur du log mal structuré. |
| `little-tasks` | **`claude-sonnet-5`** | Gemini 3.6 Flash | Il ne rédige rien lui-même : il formule une commande `agy` et renvoie un chemin. |

Règle : **opus quand une erreur est irréversible ou quand le raisonnement est le produit ;
sonnet partout ailleurs.** Ne pas monter le modèle d'un agent pour compenser un prompt vague
— corriger le prompt.

Côté AGY, il n'y a pas de `model:` par sous-agent : le modèle est global
(`~/.gemini/antigravity-cli/settings.json`, clé `model`), et vaut **Gemini 3.6 Flash**. La
colonne ci-dessus n'est donc pas un réglage à appliquer agent par agent, c'est un constat :
sur AGY, tous les rôles tournent sur le même modèle, y compris ceux qui méritent opus côté
Claude Code. **Corollaire opérationnel : ne pas confier `planificateur` ni `vps-sysadmin` à
AGY.** Ces deux rôles restent sur Claude Code ; AGY prend l'exécution mécanique.

## Isolation du contexte des sous-agents

**Par défaut, un sous-agent n'hérite PAS du contexte de l'agent principal, et c'est le
comportement voulu.** Il démarre propre avec : son system prompt, le message de tâche, les
`CLAUDE.md` du projet, un snapshot `git status`, et les skills listées dans son frontmatter.
Il ne reçoit **pas** l'historique parent, ni le system prompt du parent, ni l'auto-mémoire.
Rien à configurer : ne pas activer `CLAUDE_CODE_FORK_SUBAGENT`.

C'est précisément ce qui règle une partie du *lost in the middle* : chaque sous-agent
travaille sur un contexte court et dense ; seul son livrable final remonte.

**Le seul mécanisme d'héritage est le `fork`** (`CLAUDE_CODE_FORK_SUBAGENT=1`, ou `/subtask`
en CLI). Un fork hérite de tout l'historique, du system prompt, des outils, du modèle, des
permissions et du cache de prompt du parent. Ses appels d'outils restent isolés ; seul le
résultat final remonte. Un fork ne peut pas en lancer un autre.

### Quand l'héritage servirait vraiment

| Cas | Pour | Contre |
|---|---|---|
| **Exploration longue en cours de session** — 40 tours de debug, on veut fouiller une piste sans polluer le fil | Le fork connaît déjà les hypothèses écartées et les stack traces vues ; le rebrief coûterait plus cher que le fork (cache de prompt partagé). | Le fork hérite aussi de tout le bruit accumulé : c'est le contexte *pollué* qu'on duplique. |
| **Vérification adverse d'une conclusion** — « essaie de réfuter ce qu'on vient de conclure » | Impossible à faire correctement sans le raisonnement qui a mené là. | Un vérificateur qui hérite du raisonnement en hérite aussi des biais. Un agent nommé, briefé sur les faits seuls, réfute mieux. |
| **Continuer une tâche là où elle en est** — reprise après interruption | Zéro rebrief, reprise exacte. | `progress.md` fait le même travail pour bien moins cher, et survit à la compaction. |
| **`planificateur`** — le cas que tu vises | Il gagne à connaître les contraintes énoncées oralement dans la session. | Il hérite d'un contexte déjà long **avant** d'explorer, donc il repart avec le handicap qu'il est censé supprimer. |

**Arbitrage retenu : garder l'isolation partout, `planificateur` compris.** Ce dont il a
besoin se transmet par un brief explicite dans le prompt d'appel (objectif, contraintes,
décisions déjà prises, critère de fin) — 20 lignes denses, pas 40 tours. Un brief écrit est
relisable, versionnable dans `plan.md`, et ne transporte pas les impasses. Le fork n'est
justifié que pour une **exploration ponctuelle en fin de session longue**, où réécrire le
contexte coûterait plus que le partage de cache — cas rare, à décider au coup par coup, et
jamais activé globalement.

## Gestion de contexte — stratégie à 3 niveaux

Bascule **automatique** dès qu'une tâche dépasse 3 étapes, touche des fichiers volumineux
ou enchaîne de multiples appels d'outils.

**Niveau 1 — externaliser.** `progress.md` **à la racine du projet** dès le départ — jamais
dans `~` : un `progress.md` posé dans le répertoire personnel est lu par toutes les sessions
et fait repartir sur une mission close. Résumés et états intermédiaires dans des fichiers
Markdown ; ne garder en mémoire active que les chemins. Déléguer aux sous-agents ci-dessus.

**Mode éphémère.** Toute tâche de plus de 3 étapes démarre par `planificateur`, qui explore
et écrit `plan.md` **et** `progress.md` dans le répertoire du projet. L'agent d'exécution
lit ensuite ces deux fichiers et rien d'autre : le transcript d'exploration ne remonte
jamais dans le contexte principal. Un `progress.md` de mission close est archivé dans
`~/.claude/state/archive-<mission>-<date>.md`, jamais laissé en place.

**Niveau 2 — réciter (append-only).** Sérialiser la checklist complète avant toute
exécution. Réémettre le bloc todo **à la toute fin de chaque message** pour le maintenir
dans la zone d'attention récente. Aucune tâche marquée `completed` sans vérification
effective (test, linter, typecheck). Conserver les erreurs et stack traces passées dans
`progress.md` — les supprimer fait rejouer les mêmes échecs.

**Niveau 3 — préserver le cache KV.** Préfixe strictement immuable : pas de timestamp ni de
donnée volatile en tête, `CLAUDE.md` finalisé **avant** de démarrer et jamais édité en cours
de session (une modification invalide tout le préfixe caché, ×10 sur le coût). Toute
réinjection d'état est un **ajout en fin de contexte**, jamais une édition du préfixe.

**Filet anti-compaction.** Les hooks `PreCompact`/`SessionEnd` (`hooks/state-save.mjs`)
sérialisent l'état vivant dans `~/.claude/state/<projet>/STATE.md` ; `SessionStart`
(`hooks/state-restore.mjs`) le réinjecte via `additionalContext`, y compris sur le matcher
`compact`. Garantie partielle assumée : la réinjection post-compaction n'est pas toujours
traitée de façon fiable.

## Réplication des fichiers d'instructions

Toute écriture d'un `CLAUDE.md` (création, réécriture, simple édition de section) est
**répliquée à l'identique** dans le `gemini.md` du même répertoire, et réciproquement.
Immédiatement, sans confirmation, dans la même réponse. Contenu identique — pas de résumé
ni d'adaptation. Sauvegarder l'ancien fichier (`.bak.<timestamp>`) avant tout écrasement.
Si un `AGENTS.md` existe, le signaler sans y toucher. Si le projet est déployé ailleurs
(VPS, miroir), y propager les deux fichiers.

Raison : je travaille aussi avec Gemini / Antigravity (`agy`) sur les mêmes projets, et
Gemini ne lit que `gemini.md`. Deux fichiers divergents produisent des comportements
arbitraires.

@RTK.md
