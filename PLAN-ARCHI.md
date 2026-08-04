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

`C:\Users\Juliann\configs-backup` → `github.com/Revens2/configs-backup` (**public** — relevé initial
erroné, corrigé le 2026-08-04 par `gh repo view --json visibility`).
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

| S4 | Clé API **ref.tools** en clair **dans une query string** : `https://api.ref.tools/mcp?apiKey=ref-…` | `~/.cursor/mcp.json` (installation **Cursor**, distincte d'AGY) | Non — hors dépôt, vérifié | **Vivante** (`HTTP 405`, pas de rejet d'auth). **À révoquer / faire tourner côté ref.tools.** Une clé en query string fuit dans les logs de proxy et l'historique. |

> S1 avait un **troisième** emplacement, découvert seulement en phase 5 :
> `~/.gemini/config/mcp_config.json` (AGY). Supprimé le 2026-08-04. La clé était déjà révoquée.
>
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

## PHASE 3 — Boucle de plan sur fichier — **exécutée le 2026-08-04**

- [x] 3.1 Skill `/plan-run` créé (`~/.claude/skills/plan-run/SKILL.md`) : boucle lire → décider →
  vérifier → cocher, critère bruit/conclusion, arbitrage (A) inscrit, liste des workers disponibles.
  16ᵉ skill utilisateur, listing 905 → 1 002 tok.
- [x] 3.2 Format `progress.md` spécifié dans le skill : une tâche = une ligne cochable, critère
  d'acceptation **vérifiable**, cible (orchestrateur ou worker), section `Décisions`, section
  `Erreurs` **append-only**.
- [x] 3.3 **Rien à réactiver — l'énoncé était périmé.** `SessionStart` (matchers `startup|resume|compact`
  → `state-restore.mjs`) et `PreCompact` (→ `state-save.mjs`) sont **déjà actifs** dans le bloc `hooks`,
  **déjà en `.mjs` appelés par `node`**, exactement la forme demandée.
  Le bloc `hooks_disabled` contient une **génération antérieure en `bash *.sh`** (`session-start.sh`,
  `pre-compact.sh`, `stop.sh`, …). La réactiver serait une **régression** : c'est précisément le
  `.sh` sous Windows que la mission interdit. Bloc laissé en place, inerte.
  Modification réellement utile apportée à la place : `state-lib.mjs` gagne `planPointer(cwd)` et
  `renderState` écrit désormais en tête de `STATE.md` un **pointeur vers `progress.md`**, le compteur
  `n/total` et les **3 prochaines tâches non cochées** — pour que la reprise post-compaction reparte
  de la bonne ligne. Sauvegarde `state-lib.mjs.bak.20260804-010257`.
- [~] 3.4 **Testé partiellement.** `node --check` OK sur les 3 hooks ; `state-save.mjs` exécuté de bout
  en bout avec une charge utile `PreCompact` synthétique sur un répertoire contenant un `progress.md`
  → `STATE.md` correctement généré avec le pointeur et les 3 tâches suivantes ; ré-exécuté sur un
  répertoire **sans** `progress.md` → aucune régression, `{"continue":true}`.
  **Non testé : une compaction réelle.** Elle ne se provoque pas à la demande. À valider en usage.

## PHASE 4 — Claude Code Desktop — **exécutée le 2026-08-04**

- [x] 4.1 MCP de domaine retirés en même temps que ceux du CLI (phases 2.2a et 2.2b). Vérifié :
  les deux fichiers déclarent le même jeu `codegraph, github, obsidian-semantic`.
  **Pas de deny rules** : elles ne réduisent pas le contexte (un serveur refusé est quand même
  connecté), le retrait des serveurs les rend inutiles ici.
- [x] 4.2 [`CLI-VS-DESKTOP.md`](CLI-VS-DESKTOP.md) — partagé vs séparé, chemin par chemin.
  Fait notable : **tout `~/.claude/` est partagé** (CLAUDE.md, settings, agents, skills, hooks,
  mémoire, state). Il n'y avait donc rien à « aligner » de ce côté : les phases 2.3 et 2.4 ont
  profité aux deux runtimes d'un coup.
  Séparés : la déclaration MCP (`~/.mcp.json` vs `claude_desktop_config.json`, **aucune
  synchronisation automatique** — toute modif est à porter deux fois) et les plugins.

## PHASE 5 — AGY CLI — **exécutée le 2026-08-04, avec correction du postulat**

- [x] 5.1 **Postulat de la mission faux.** « AGY gère nativement les sous-agents dynamiques et le
  nesting » ne tient pas pour ce build : les types de customisation d'Antigravity sont **Rules,
  Skills, Plugins, Hooks, MCP Servers** — **pas de sous-agents** (source : skill intégré
  `agy-customizations`). `agy agents` renvoie vide même après dépôt d'un fichier d'agent aux deux
  emplacements candidats. `antigravity/subagents/` du dépôt et le skill `create-subagent` (qui
  documente `.cursor/agents/`) sont des résidus de lignée Cursor.
  Livré à la place : plugin **`orchestrateur-kit`** (`~/.gemini/config/plugins/orchestrateur-kit/`)
  portant une **règle** de conduite de travail long — plan sur disque, critère bruit/conclusion,
  vérification avant de cocher — activable par `agy plugin enable orchestrateur-kit`.
- [x] 5.2 **Confinement MCP par plugin — le seul réel de tout le parc.**
  Correction d'une erreur de ma mesure initiale : j'avais annoncé « AGY : 0 MCP » en ne regardant que
  `~/.antigravitycli/mcp/` (vide). La vraie racine est `~/.gemini/config/`, qui contenait bien un
  `mcp_config.json` avec `anytype`, `obsidian` et `kicad-gui-bridge`.
  - `anytype` **supprimé** : serveur mort, et il contenait **la clé S1 en clair** — troisième
    emplacement de ce secret, non repéré aux phases 1 et 2. Sauvegarde
    `mcp_config.json.bak.20260804-010257`.
  - `obsidian` **déplacé** dans le plugin `obsidian-kit`, donc inactif par défaut.
  - `kicad-gui-bridge` laissé, déjà `"disabled": true`.
  - Global restant : **aucun serveur actif**. AGY démarre nu.
- [x] 5.3 [`REPARTITION-RUNTIMES.md`](REPARTITION-RUNTIMES.md) — capacités réelles comparées et règle
  de décision. Résumé : **Claude Code** est le seul à avoir des sous-agents (implémentation fine et
  délégation) · **AGY** est le seul à confiner un MCP (volume, contexte minuscule) · **OpenCode** est
  le seul à pouvoir retirer un sous-agent du contexte et à nester sur 2 niveaux.

## PHASE 6 — OpenCode — **exécutée le 2026-08-04**

> **Constat de départ : OpenCode ne démarrait pas.**
> `opencode agent list` → `Error: Configuration is invalid at agents/web-researcher.md — Expected
> object | undefined, got "mcp__notebooklm__…" tools`.
> Les 3 workers avaient été copiés depuis Claude Code avec `tools:` en **chaîne** ; OpenCode attend un
> **objet** `outil: booléen`. **Ils n'avaient donc jamais fonctionné** — la « divergence de noms
> d'outils MCP » de l'énoncé était en réalité une config cassée.

- [x] 6.1 Règles `permission.task` en `deny` sur `general` et `explore`. Vérifié : les règles sont
  parsées et appliquées à l'ensemble des agents
  (`{"permission":"task","pattern":"general","action":"deny"}`). Sur `deny`, le sous-agent est retiré
  de la description de l'outil Task — **seul levier du parc qui retire vraiment un sous-agent du
  contexte**. Les 3 workers spécialisés couvrent le besoin ; `general` et `explore` font doublon avec
  eux et avec l'orchestrateur.
- [x] 6.2 Les 3 workers réécrits au format OpenCode : `mode: subagent` + `tools:` en objet, outils en
  minuscules (`read`, `grep`, `glob`, `bash`, `webfetch`, `websearch`, `write`, `edit` — liste
  autoritative extraite du binaire). Tous les `mcp__*` retirés : **aucun serveur MCP n'est déclaré
  dans `opencode.jsonc`**, ces outils n'existaient pas. Sauvegardes `.bak.20260804-010257`.
  Vérifié : `opencode agent list` démarre et liste les 10 agents.
- [x] 6.3 Nesting 2 niveaux — **déjà garanti par défaut, rien à ajouter.** Le binaire injecte
  `{permission:"task", pattern:"*", action:"deny"}` dans tout sous-agent qui ne déclare pas lui-même
  la permission `task`. Nos 3 workers ne la déclarent pas : ils ne peuvent pas engendrer de
  sous-agents. Profondeur maximale = primaire → sous-agent.

Effet mesuré : 19 287 → **18 975 o** de config (~4 822 → **~4 744 tok**), plus le retrait de 2
sous-agents de la description de l'outil Task (non chiffrable statiquement).

**Effet de bord favorable :** `opencode agent list` révèle qu'OpenCode lit aussi `~/.claude/skills/`
(une règle `external_directory` par skill). La phase 2.3 a donc allégé OpenCode aussi, sans que ce
soit prévu.

## PHASE 7 — Mesure

- [x] 7.1a Mesure **AVANT** — `MESURE-AVANT.md` (2026-08-04, avant toute modification)
- [x] 7.1b **Relevé réel fait — il dément l'estimation.** Méthode : `claude -p --output-format json`,
  lecture de `usage.cache_creation_input_tokens`, trois exécutions ne variant que par la config MCP.
  - aucun MCP : **14 162 tok** · 3 serveurs locaux : **15 036 tok** · défaut : **40 051 tok**
  - → 3 serveurs locaux (74 outils) = **874 tok**, soit **~12 tok/outil**, pas 200.
    Claude Code 2.1.220 charge les outils MCP **en différé** (`ToolSearch`) : seuls les noms partent.
  - → **connecteurs claude.ai = 25 015 tok, 62 % du démarrage.** Non différés.
  - **Conséquence : les phases 2.2a et 2.2b n'ont pas rendu les ~24 200 tok annoncés** (ordre de
    grandeur réel : quelques centaines). Ces retraits restent justifiés — serveur mort, clé révoquée,
    0 appel en 18 jours — mais pas par l'argument tokens. La phase 2.3 (skills), elle, porte sur des
    instructions non différées : son gain est réel.
- [x] 7.2 Delta écrit dans `MESURE-AVANT.md`. **Non fait : mesure d'AGY et d'OpenCode** par une
  méthode équivalente — leurs CLI n'exposent pas de compteur de contexte comparable.

### Action la plus rentable du chantier — **exécutée le 2026-08-04**

Arbitrage utilisateur : couper `Microsoft 365` et `MCP Obsidiann Juliann`, garder `Gmail`.

`disableClaudeAiConnectors` étant tout-ou-rien, le levier retenu est **`deniedMcpServers`** dans
`~/.claude/settings.json` — il fusionne depuis toutes les sources et **mord aussi sur les connecteurs
claude.ai**, comportement non documenté, établi par la mesure.

| | Contexte réel |
|---|---:|
| Avant coupure | 40 051 tok |
| **Après** | **16 021 tok** |
| **Gain** | **−24 030 tok (−60 %)** |

Les deux connecteurs coupés pesaient 24 030 tok à eux seuls ; Gmail, conservé, ~985.
Sauvegarde `settings.json.bak.20260804-phase7`.

**Effet sur S3 :** le connecteur ngrok du vault n'est plus chargé dans le contexte. Il reste
**déclaré et joignable** côté claude.ai — l'endpoint public existe toujours. S3 est neutralisé pour
Claude Code, pas supprimé à la source.

---

## Dette ouverte — à solder en début de prochaine session

### 1. `~/.claude/CLAUDE.md` — correction **préparée**, pas appliquée

Le fichier référence encore `anytype-manager` et des MCP supprimés. Ta règle de niveau 3 interdit de
l'éditer en cours de session (invalidation du préfixe caché). La version corrigée est donc **prête à
côté**, avec sa réplication `gemini.md` à l'identique (mêmes octets, vérifié par hash) :

```powershell
Move-Item ~\.claude\CLAUDE.md ~\.claude\CLAUDE.md.bak.avant-corrections -Force
Move-Item ~\.claude\CLAUDE.md.next ~\.claude\CLAUDE.md -Force
Move-Item ~\.claude\gemini.md ~\.claude\gemini.md.bak.avant-corrections -Force
Move-Item ~\.claude\gemini.md.next ~\.claude\gemini.md -Force
```

Contenu des corrections : ligne `anytype-manager` retirée du tableau de délégation · section
« Confinement MCP » réécrite (seul `mcp__obsidian-semantic__*` subsiste) · note sur l'accès
filesystem du vault · **distinction des trois leviers** `permissions.deny` (exécution, aucun gain de
contexte) / `deniedMcpServers` (admission, gain réel) / portée projet · mention que le confinement
par sous-agent n'existe pas sur Claude Code. 6 771 → 7 450 o.

### 2. Bloc `obsidian` (4 skills) — en attente du montage de `G:`

`G:\Mon Drive\Obsidian Vault` n'était monté à aucun moment de la session. Les skills attendent dans
`~/.claude/skills-hors-scope/obsidian/`.

```powershell
New-Item -ItemType Directory -Force -Path 'G:\Mon Drive\Obsidian Vault\.claude\skills'
Copy-Item ~\.claude\skills-hors-scope\obsidian\* 'G:\Mon Drive\Obsidian Vault\.claude\skills\' -Recurse
```

### 3. Secret S4 — action utilisateur

Clé `ref.tools` vivante, en query string, dans `~/.cursor\mcp.json`. Hors dépôt. À faire tourner.

### 4. Mesure d'OpenCode — impossible ce jour

Son modèle est sur `100.99.75.104:4002`, injoignable (Tailscale inactif). À refaire VPN actif.

### 5. Compaction réelle — à observer en usage

Le pointeur `progress.md` dans `STATE.md` est testé par exécution directe du hook, pas par une
compaction réelle, qui ne se provoque pas sur commande.

---

## Erreurs rencontrées (append-only)

- **Estimation du coût MCP à ~200 tok/outil.** Réel : ~12 tok/outil, Claude Code chargeant les outils
  MCP en différé. Facteur 17. A conduit à survendre les phases 2.2a/2.2b (~24 200 tok annoncés,
  quelques centaines en réalité) et à traiter le mauvais poste pendant l'essentiel du chantier.
  *Leçon : mesurer avant d'optimiser — le plan le disait en phase 7, je l'ai gardée pour la fin.*
- **« AGY : 0 MCP ».** Faux : je n'avais regardé que `~/.antigravitycli/mcp/` (vide) en ignorant
  `~/.gemini/config/`, la vraie racine, qui portait 3 serveurs **et un troisième exemplaire de la
  clé S1**. *Leçon : une racine de config vide ne prouve pas l'absence de config.*
- **« AGY est le runtime le plus léger, ~2 000 tok ».** Réel : 21 530 tok. Même erreur que sur Claude
  Code — estimation à partir des tailles de fichiers, en oubliant le prompt système et les outils
  intégrés du runtime.
- **« 3 doublons de skills, gain 231 tok, risque nul ».** Un seul doublon réel (`frontend-design`,
  64 tok) : un marketplace cloné n'est pas un plugin activé. Supprimer `caveman` et `skill-creator`
  les aurait fait disparaître.
- **`git rm` sur les skills du dépôt** — aurait détruit la sauvegarde au lieu de la réorganiser.
  Rattrapé par `reset` + `checkout`, refait en `git mv`. Rien de perdu.
