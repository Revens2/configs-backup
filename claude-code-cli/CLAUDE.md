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
auto (`~/.claude/projects/*/memory/`) et dans le vault Obsidian, consultés à la demande.

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
d'overhead). RTK compresse 100 % des sorties de build, test et commandes **à la source** :
ne jamais invoquer de sous-agent de filtrage pour une sortie de terminal. Voir `@RTK.md`
pour les méta-commandes (`rtk gain`, `rtk discover`, `rtk proxy`).

## Gestion de contexte — stratégie à 3 niveaux

Bascule **automatique** dès qu'une tâche dépasse 3 étapes, touche des fichiers volumineux
ou enchaîne de multiples appels d'outils.

**Niveau 1 — externaliser.** `progress.md` à la racine dès le départ ; résumés et états
intermédiaires dans des fichiers Markdown ; ne garder en mémoire active que les chemins.
Déléguer aux sous-agents ci-dessus.

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
