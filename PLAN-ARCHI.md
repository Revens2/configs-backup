# PLAN-ARCHI — orchestrateur nu / workers spécialisés

**Source de vérité de l'avancement.** Ne pas se fier au contexte d'un agent.
Statut : `[ ]` à faire · `[~]` en cours · `[x]` fait (commité + runtime démarre sans erreur).

---

## Étape 0 — Relevé (fait)

### Versions des runtimes

| Runtime | Version | Commande |
|---|---|---|
| Claude Code CLI | 2.1.220 | `claude --version` |
| Claude Code Desktop | même binaire/config partagée (voir Phase 4) | — |
| AGY CLI (Antigravity) | 1.1.10 | `agy --version` |
| OpenCode | 1.18.3 | `opencode --version` |

### Chemins de config réels

| Runtime | Fichiers |
|---|---|
| Claude Code CLI | `~/.claude/CLAUDE.md` (6 771 o), `~/.claude/RTK.md`, `~/.claude/settings.json` (7 017 o), `~/.claude/settings.local.json` (924 o), `~/.claude/agents/*.md` (6), `~/.claude/skills/*` (63), `~/.claude/commands/*` (1), `~/.claude/hooks/` |
| MCP (partagé CLI) | `~/.mcp.json` |
| Claude Code Desktop | `%APPDATA%\Claude\claude_desktop_config.json` (3 703 o), `config.json` |
| AGY / Antigravity | `~/.antigravitycli/` (`mcp/` **vide**, `skills/`), `~/.gemini/GEMINI.md` (7 908 o), `~/.gemini/settings.json` (266 o), `%APPDATA%\Antigravity\` (état app, pas de config MCP) |
| OpenCode | `~/.config/opencode/opencode.jsonc` (502 o), `AGENTS.md` (8 164 o), `agents/`, `plugins/`, `skills/` |

### Dépôt de backup

`C:\Users\Juliann\configs-backup` → `github.com/Revens2/configs-backup` (**privé**).
État à l'ouverture : **propre** (aucune modification non commitée). HEAD = `41c32b3`.
Structure : `antigravity/` (73 f), `claude-code-cli/` (1 442 f), `claude-code-desktop/` (8 f), `opencode/` (10 f).

### Écarts constatés vs énoncé de la mission

1. **`settings.local.json` n'a pas de BOM** — octets de tête `7B 0D 0A`. Phase 1.3 sans objet.
2. **`permissions.deny` est vide** (`~/.claude/settings.json:51`). Il n'y a donc rien à « vérifier » :
   les deny rules obsidian / obsidian-semantic / anytype / notebooklm sont **à créer**, avec leurs
   miroirs `Bash(...)`.
3. **`TodoWrite` n'existe pas dans ce runtime** (Claude Code Desktop). Le suivi passe par ce fichier
   + les outils `TaskCreate`/`TaskUpdate`.
4. **`~/.antigravitycli/mcp/` est vide** : AGY n'a pas de `mcp_config.json` actif en local ; seul le
   dépôt de backup en contient un (`antigravity/mcp_config.json`). À confirmer en Phase 5.

### Secrets — état

| # | Secret | Emplacement | Versionné ? | Action |
|---|---|---|---|---|
| S1 | Clé API Anytype, **ancienne** (préfixe `PLTV…`) | `antigravity/mcp_config.json:10` au commit **`adb1957`** | **OUI — dans l'historique git** | **À RÉVOQUER** |
| S2 | Clé API Anytype, **courante** (préfixe `FOZy…`) | `~/.mcp.json:59` et `%APPDATA%\Claude\claude_desktop_config.json:59` | Non (les copies du dépôt sont rédigées) | Sortir en variable d'env (Phase 1) |

| S3 | Endpoint MCP Obsidian exposé publiquement via ngrok, **le secret est le chemin de l'URL** (`…ngrok-free.dev/mcp/<jeton>`), vault en lecture **et écriture** | Connecteur claude.ai « MCP Obsidiann Juliann », **configuré côté claude.ai** — absent des fichiers locaux et du dépôt | Non | **Risque assumé par l'utilisateur (2026-08-04). Ne pas y revenir.** Tunnel hors ligne au moment du relevé (HTTP 503). L'URL complète s'imprime à chaque `claude mcp list` → présente dans les transcripts locaux. |

> Valeurs complètes volontairement absentes de ce fichier : il est versionné.
> Les retrouver si besoin : `git -C configs-backup show adb1957:antigravity/mcp_config.json` (S1),
> `~/.mcp.json` ligne 59 (S2).

Le reste des correspondances du scan sont des placeholders de documentation
(`${API_TOKEN}`, `your-api-key`, `ghp_your_github_token`) — sans objet.

---

## Décisions utilisateur (2026-08-04)

- **Arbitrage : (A) — consommation de tokens / limites d'usage.**
  Conséquences sur le reste du plan : délégation réservée aux tâches à fort volume uniquement
  (recherche web, gros logs, exploration de codebase). L'orchestrateur exécute lui-même les tâches
  moyennes et courtes. On ne crée **aucun worker supplémentaire** au-delà des 6 existants ; on les
  resserre. Priorité absolue au poste MCP (77 % du contexte de démarrage, cf. `MESURE-AVANT.md`).
- **Secret S1 : direction donnée** — révoquer la clé côté Anytype (action utilisateur), puis repartir
  d'un **dépôt neuf** plutôt que de réécrire l'historique. `filter-repo` sur 3 commits de config n'en vaut
  pas le coût ; l'historique n'a pas de valeur ici.
  **Bloquant restant : la révocation n'est pas faite.** Phase 1 reste gelée, aucune config modifiée.

---

## PHASE 1 — Assainissement préalable — **DÉGELÉE ET CLOSE le 2026-08-04**

- [x] 1.1 Scan credentials sur les 4 arbres de config
- [x] 1.2 S1 **révoquée par l'utilisateur**. Vérifié : `GET 127.0.0.1:31009/v1/spaces` → **HTTP 401**.
      L'historique git n'est pas réécrit (décision assumée) : la clé y reste, mais inerte.
- [x] 1.3 S2 **révoquée également** (même vérification → HTTP 401). Traitement retenu :
      **suppression du bloc `anytype`** des deux configs plutôt qu'indirection par variable d'env —
      le serveur ne démarrait pas et n'avait aucun appel en 18 jours, une `${ANYTYPE_API_KEY}`
      n'aurait fait que déplacer un secret inutile. Plus aucune occurrence de `Bearer` dans
      `~/.mcp.json` ni `claude_desktop_config.json`.
- [x] 1.4 ~~BOM `settings.local.json`~~ — sans objet (vérifié : pas de BOM)
- [x] 1.5 Commit

## PHASE 2 — Orchestrateur nu (Claude Code CLI) — **révisée 2026-08-04**

- [~] 2.1 **ABANDONNÉE.** `CLAUDE.md` = 1 693 tok, soit 3,4 % du démarrage. Le dégraisser ne rend rien.
  Fichier laissé en l'état.
- [ ] 2.2 **LA phase.** Retirer les serveurs de `~/.mcp.json` — **ne pas** passer par `permissions.deny` :
  un serveur dont les outils sont refusés est quand même connecté et envoie quand même ses schémas.
  `permissions.deny` gouverne l'exécution, pas le chargement.
  - Usage réel mesuré sur 121 transcripts / 87 Mo / 18 j (17-07 → 04-08) :
    github 13 · obsidian-semantic 5 · obsidian 3 · codegraph 2 · notebooklm 2 · **anytype 0** · **canva 0**
    = **25 appels pour ~39 000 tok/session**. À comparer : claude-in-chrome (hors `.mcp.json`) = 265 appels.
  - Cible : `~/.mcp.json` de la racine `C:\Users\Juliann` vidé de tout serveur de domaine. Chaque serveur
    redescend dans le `.mcp.json` du projet qui l'utilise (portée projet native de Claude Code).
  - Leviers confirmés dans le binaire 2.1.220 (schéma des settings) :
    `enabledMcpjsonServers` / `disabledMcpjsonServers` (approbation des serveurs d'un `.mcp.json`),
    `allowedMcpServers` / `deniedMcpServers` (admission, fusion entre sources de settings),
    `disableClaudeAiConnectors` (connecteurs claude.ai).
  - **anytype** : 0 appel en 18 jours **et** serveur en panne (`claude mcp list` → `× Failed to connect,
    -32000: Connection closed`). Candidat à la suppression pure, pas au déplacement.

#### 2.2a — premier retrait, exécuté le 2026-08-04

`anytype` (50 outils, 0 appel, serveur mort, clé révoquée) et `canva` (11 outils, 0 appel) retirés de
`~/.mcp.json` **et** de `claude_desktop_config.json`. Sauvegardes `.bak.20260804-010257` conservées.
Vérifié : les deux fichiers restent du JSON valide, `claude mcp list` démarre sans erreur, les 5
serveurs restants se connectent.

| | avant | après |
|---|---:|---:|
| Serveurs `.mcp.json` | 7 | **5** |
| Outils MCP exposés | ~195 | **~134** |
| Coût MCP estimé | ~39 000 tok | **~26 800 tok** |

Gain : **~12 200 tok/session**, sans perte de capacité (aucun des deux serveurs n'avait servi).

#### 2.2b — second retrait, exécuté le 2026-08-04

Arbitrage utilisateur : sortir `notebooklm` et `obsidian`, garder `obsidian-semantic`.
Retirés des deux runtimes.

| | départ | après 2.2a | après 2.2b |
|---|---:|---:|---:|
| Serveurs | 7 | 5 | **3** |
| Outils MCP | ~195 | ~134 | **~74** |
| Coût MCP estimé | ~39 000 tok | ~26 800 tok | **~14 800 tok** |

Restent : `codegraph`, `github`, `obsidian-semantic`. **Gain cumulé ~24 200 tok/session (−62 %).**
Vérifié : JSON valide sur les deux fichiers, `claude mcp list` démarre, les 3 serveurs se connectent.

#### 2.4 — workers réalignés sur les MCP réellement disponibles

| Worker | Avant | Après | Traitement |
|---|---:|---:|---|
| `obsidian-context-retriever` | 3 591 o | **2 564 o** | 15 outils `mcp__obsidian__*` retirés ; accède désormais au vault par le système de fichiers (`Glob`/`Grep`/`Read`/`Write` sur `G:\Mon Drive\Obsidian Vault`) + `semantic-search`. Capacité de lecture intacte. |
| `web-researcher` | 3 428 o | **2 256 o** | 11 outils `mcp__notebooklm__*` retirés ; bascule sur `WebSearch`/`WebFetch`. |
| `anytype-manager` | 4 044 o | — | **retiré** vers `~/.claude/agents/retires-20260804/` : ses 16 outils avaient tous disparu avec le serveur. |

Listing des agents : 863 → **502 tok**. Sauvegardes `.bak` dans le dossier `retires-20260804/`.

**Dette ouverte — `~/.claude/CLAUDE.md` non modifié.** Ta règle « niveau 3 : `CLAUDE.md` finalisé avant
de démarrer, jamais édité en cours de session » l'interdit. Trois passages sont désormais faux :
la ligne `anytype-manager` du tableau de délégation, la ligne `mcp__anytype__* → anytype-manager` du
confinement MCP, et `mcp__obsidian__*` / `mcp__notebooklm__*` qui ne référencent plus rien.
**À corriger en début de prochaine session, avec réplication dans `gemini.md`.**
- [x] 2.3 **FAIT le 2026-08-04.** 63 → **15 skills** au niveau utilisateur. Listing 6 057 → **905 tok**
  (**−5 152**). Triage : [`TRIAGE-SKILLS.md`](TRIAGE-SKILLS.md).
  Les 47 skills déplacés vont dans `~/.claude/skills-hors-scope/<bloc>/` — dossier non lu par Claude
  Code, donc coût nul, contenu intact et redéployable en une commande (voir
  [`SKILLS-HORS-SCOPE.md`](claude-code-cli/SKILLS-HORS-SCOPE.md)).
  Blocs : `outillage-dev` 14 · `front-ui` 10 · `ckm-claudekit` 7 · `metier` 6 · `bureautique` 6 ·
  `obsidian` 4 · `divers` 7 (skills `google-agents-cli-*` présents seulement dans le dépôt, résidus
  d'avant la réinstallation du PC).
  **Aucun projet de destination réel n'existe sur la machine** pour les blocs CKM et métier — les
  skills `ckm:*` viennent du bundle claudekit, ils ne correspondent à aucun projet. Le bloc `obsidian`
  n'a pas pu être déposé dans le vault : `G:` n'était pas monté au moment de l'opération.
- [ ] 2.4 Réécrire les 6 workers ~1 200 o chacun, `description` = déclencheur précis.
  **Réserve : voir « limite structurelle » ci-dessous** — « déclarer les MCP de son domaine » n'est pas
  implémentable sur Claude Code.
- [ ] 2.5 Commit par sous-étape

### Limite structurelle de Claude Code (constat, pas une opinion)

Le binaire 2.1.220 n'expose **aucune clé MCP par sous-agent** : le frontmatter d'un agent accepte
`description` / `tools` / `model`, pas de `mcpServers`. Le contrôle des serveurs est *settings-scoped*
(`allowedMcpServers`, `deniedMcpServers`, `enabledMcpjsonServers`) ou *project-scoped* (`.mcp.json`),
jamais *agent-scoped*. Les sous-agents partagent les connexions MCP du processus ; `tools:` ne fait que
filtrer une liste déjà chargée.

Conséquence sur le principe directeur de la mission — « chaque worker ne porte que les MCP de son
domaine » : **non implémentable sur Claude Code**, implémentable sur AGY (nesting natif + `mcp_config`
par worker) et partiellement sur OpenCode (`task` deny retire le sous-agent de la description de l'outil).

Réorientation qui en découle : **AGY porte l'orchestration profonde** (déjà le runtime le plus léger,
~2 000 tok, zéro MCP), **Claude Code fait l'implémentation fine** avec un `.mcp.json` racine quasi vide
et des serveurs déclarés par projet.

## PHASE 3 — Boucle de plan sur fichier

- [ ] 3.1 Skill `/plan-run` (lire → décider → valider → cocher)
- [ ] 3.2 Format `progress.md` : intitulé, critère d'acceptation, cible, statut, section erreurs append-only
- [ ] 3.3 Réactiver `SessionStart` + `PreCompact` depuis `hooks_disabled`, en `.mjs` via `node`
- [ ] 3.4 Test de compaction réelle

## PHASE 4 — Claude Code Desktop

- [ ] 4.1 Mêmes deny rules, retrait des MCP de domaine
- [ ] 4.2 Documenter partagé vs séparé avec preuve (fichier + chemin)

## PHASE 5 — AGY CLI

- [ ] 5.1 Agent orchestrateur qui instancie ses propres workers
- [ ] 5.2 Confiner chaque MCP à son worker dans `mcp_config.json`
- [ ] 5.3 Documenter la répartition AGY (orchestration multi-niveaux) vs Claude Code (implémentation fine)

## PHASE 6 — OpenCode

- [ ] 6.1 Règles de permission `task` en `deny` (retire le sous-agent de la description de l'outil Task)
- [ ] 6.2 Aligner les 3 workers sur les définitions Claude Code, corriger les noms d'outils MCP
- [ ] 6.3 Nesting 2 niveaux max

## PHASE 7 — Mesure

- [x] 7.1a Mesure **AVANT** — `MESURE-AVANT.md` (2026-08-04, avant toute modification)
- [ ] 7.1b Fiabiliser le poste MCP par relevé réel (`/context`) au lieu de l'estimation
- [ ] 7.2 Mesure **APRÈS** + écriture du delta dans le dépôt

---

## Erreurs rencontrées (append-only)

_(vide)_
