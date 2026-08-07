# Audit de la stack IA — tokens, qualité du contexte, auto-activation des sous-agents

Relevé le 2026-08-07 sur `configs-backup`, branche `claude/audit-ia-stack-tokens-s07nb1`.
Périmètre : `claude-code-cli/` (settings, hooks, agents, skills, MCP), plus les runtimes
`antigravity/` et `opencode/` pour comparaison.

Cet audit prolonge le chantier de portage du 2026-08-04 ([`RECAPITULATIF.md`](RECAPITULATIF.md),
[`MESURE-AVANT.md`](MESURE-AVANT.md), [`PLAN-ARCHI.md`](PLAN-ARCHI.md)). Ce chantier avait mesuré
l'axe tokens et conclu, après auto-réfutation, qu'**aucun des trois runtimes n'a gagné de contexte**.
Deux axes n'avaient jamais été audités : la **qualité** du traitement (quel modèle, à quel effort,
avec quelle intégrité du préfixe KV) et le **routage** (les sous-agents partent-ils vraiment).

---

## Verdict en trois lignes

| Axe | Verdict | Défaut dominant |
|---|---|---|
| **Tokens** | ✅ Plancher local atteint | Rien à gagner localement. 62 % du démarrage est hors du dépôt. |
| **Qualité du contexte traité** | ❌ **Gravement dégradée** | `model: "haiku"` + `effortLevel: "low"` sur l'orchestrateur. |
| **Auto-activation des sous-agents** | ⚠️ Partielle, 5 défauts bloquants | Aucun agent n'a de clé `model:`; `planificateur` ne matche pas son propre déclencheur. |

---

## Axe 1 — Tokens

### Ce que ça coûte réellement

Chiffres issus de la contre-mesure validée du 2026-08-04 ([`MESURE-AVANT.md`](MESURE-AVANT.md),
phase 7.1b). Méthode : `cache_creation_input_tokens + cache_read_input_tokens` du **premier**
événement assistant — jamais `cache_creation` seul.

| Poste | Tokens | Part | Levier local ? |
|---|---:|---:|---|
| Connecteurs claude.ai (Gmail, Microsoft 365, MCP Obsidiann Juliann) | ~25 015 | **62 %** | ❌ compte claude.ai |
| `~/.claude/CLAUDE.md` + `@RTK.md` (8 219 + 961 o) | ~2 400 | 6 % | phase 2.1 abandonnée |
| Listing des 16 skills (4 298 o de frontmatter) | ~1 002 | 2,5 % | ✅ déjà traité (63 → 16) |
| **3 serveurs MCP locaux (74 outils)** | **874** | 2 % | négligeable — chargement différé |
| Listing des 6 agents | ~502 | 1,2 % | ✅ déjà traité |
| Reste (prompt système, outils natifs) | ~10 400 | 26 % | ❌ harnais |
| **Total démarrage réel** | **~40 150** | | |

### Trois constats qui ferment le débat

**1. `deniedMcpServers` ne réduit pas le contexte.** Trois relevés sur les totaux :

| Configuration | Tokens |
|---|---:|
| Connecteurs tous actifs | 40 137 |
| Deux connecteurs refusés | 40 150 |
| Aucun MCP | 38 863 |

13 tokens d'écart entre les deux premiers — du bruit. Les deux entrées de
`claude-code-cli/settings.json:269-272` (`"Microsoft 365"`, `"MCP Obsidiann Juliann"`) ne coûtent ni
ne rapportent rien. Le « −60 % » annoncé la veille était un artefact de cache : relevé froid comparé
à un relevé chaud, en ne lisant que `cache_creation_input_tokens`.

**2. Les MCP locaux coûtent ~12 tok/outil, pas 200.** Claude Code 2.1.220 charge les schémas MCP en
**différé** via `ToolSearch`. Les 46 schémas `mcp__codegraph__*` que tout le monde soupçonnait
pèsent des miettes : `codegraph` + `github` + `obsidian-semantic` = 74 outils = **874 tokens au
total**. L'estimation « ~200 tok/outil » de la phase 7 était fausse d'un facteur ~17.

**3. Le seul levier restant est hors du dépôt.** Les connecteurs claude.ai sont **62 % du
démarrage** et ne sont jamais différés. Aucun fichier de `~/.claude/` ne les atteint : ils se
déconnectent au niveau du compte claude.ai. C'est la seule action qui ferait bouger le chiffre.

### Ce qui ne rapportera rien — à ne pas rejouer

| Action tentante | Gain réel | Pourquoi |
|---|---|---|
| Ajouter des entrées à `deniedMcpServers` | **0** | Mesuré : 13 tok de bruit. Bloque l'admission, pas le chargement du prompt. |
| `permissions.deny` | **0** | Bloque l'**exécution**. Le serveur reste connecté, les schémas restent chargés. |
| Tailler `CLAUDE.md` | ~1 000 tok max | 6 % du total. Phase 2.1 abandonnée à juste titre. |
| Sortir les 3 MCP locaux | **874 tok** | 2 % du total, contre la perte de `codegraph`/`github`/vault. Mauvais échange. |
| Trier encore les skills | ~200 tok | 63 → 16 a déjà pris 85 % du gisement. Le reste est du rangement. |

> Rappel de méthode, à appliquer avant toute annonce de gain : le contexte réellement envoyé est un
> **total** (`cache_creation + cache_read`). Ne lire que `cache_creation` fait passer un préfixe déjà
> mis en cache pour un gain. C'est l'erreur qui a produit trois faux résultats le 2026-08-04
> ([`RECAPITULATIF.md`](RECAPITULATIF.md) §4).

### Déchets sans impact contexte (rangement, pas optimisation)

- **`settings.json` `permissions.allow` (l. 3-50)** — 46 entrées `mcp__codegraph__*` énumérées une
  par une. Aucun coût contexte, mais illisible ; un joker suffirait.
- **`skillOverrides` (l. 55-75)** — 19 entrées `"off"`, dont **18 visent des skills déjà déplacés**
  dans `skills-hors-scope/`, donc déjà hors du chemin de chargement. Une seule est utile :
  `template-skill`. Et **`frontend-design` est mis `"off"` alors que `enabledPlugins` (l. 147-149)
  l'active** — contradiction franche entre deux clés du même fichier.
- **`skills/autoresearch/SKILL.md`** — 7 039 o **sans aucun frontmatter YAML** (le fichier commence
  par `# autoresearch`). Jamais enregistré comme skill, jamais déclenchable. Corps mort.
- **`skills-hors-scope/`** — 46 skills, 16,8 Mo dans un dépôt de config. Correctement exclu du
  chargement (imbrication à 3 niveaux : `skills-hors-scope/<bloc>/<skill>/SKILL.md`, là où le
  chargeur ne scanne que `skills/*/SKILL.md`), donc **sans risque contexte** — mais lourd au clone.
  Note : la doc annonce 47 skills et un bloc `divers`, la réalité disque est 46 et pas de `divers`.

---

## Axe 2 — Qualité du contexte traité

### D1 — L'orchestrateur tourne sur haiku en effort minimal 🔴

`claude-code-cli/settings.json:54` → `"model": "haiku"`
`claude-code-cli/settings.json:150` → `"effortLevel": "low"`

C'est le défaut dominant de toute la stack. L'agent principal — celui qui lit `CLAUDE.md`, arbitre
les délégations, décide quoi compacter, choisit les sous-agents — tourne sur le plus petit modèle
disponible, au plus faible niveau d'effort. **Tout le travail d'optimisation du contexte alimente un
modèle qui ne peut pas l'exploiter.**

C'est aussi ce qui rend l'axe 3 pire qu'il n'y paraît : aucun sous-agent n'ayant de clé `model:`
(défaut S1), **les six héritent de haiku**, y compris `planificateur` dont le rôle entier est le
raisonnement architectural.

**Statut : corrigé dans ce commit** (bug non intentionnel confirmé). Voir §Correctif appliqué.

### D2 — `auto-graph-setup.sh` viole ta propre règle de cache KV 🔴

`claude-code-cli/hooks/auto-graph-setup.sh:39-69`, hook **SessionStart**.

Si le marqueur `AUTO_GRAPH_START` est absent, le hook **écrit dans le `CLAUDE.md` du projet** un
bloc de ~1 300 caractères documentant les commandes CodeGraph/Graphify. Deux dégâts :

1. **+350 tokens permanents** dans le préfixe de chaque session future de ce projet.
2. **Invalidation du préfixe caché** au moment même du démarrage.

Ta règle Niveau 3 (`CLAUDE.md:120-124`) dit : « `CLAUDE.md` finalisé **avant** de démarrer et jamais
édité en cours de session (une modification invalide tout le préfixe caché, ×10 sur le coût) ». Le
hook fait exactement l'inverse, automatiquement, dans chaque projet contenant un `CLAUDE.md`.

Le même hook lance aussi en arrière-plan un `codegraph init -y` (timeout 2 400 s), un
`graphify update .` (900 s), puis **un build complet du projet** (`npm/pnpm/yarn/bun run build`,
`cargo build`, `python -m build`, `make`, 1 800 s chacun) — au démarrage de session.

**Correctif proposé** (non appliqué) : supprimer le bloc l. 39-69 et laisser le hook se contenter du
provisionnement en arrière-plan. Le contenu du bloc appartient au `CLAUDE.md` du projet, écrit une
fois à la main, pas à un hook qui s'exécute au démarrage.

### D3 — `sync-mcp.js` ressuscite les serveurs MCP retirés 🟠

`claude-code-cli/sync-mcp.js`, hook **SessionStart** (`settings.json:82`).

Fusion **bidirectionnelle** `claude_desktop_config.json` ↔ `~/.mcp.json`. Tout serveur encore
présent côté Desktop est **réinjecté dans le CLI à chaque session**. Les quatre serveurs sortis le
2026-08-04 — `anytype` (mort, clé révoquée), `canva`, `notebooklm`, `obsidian` — reviennent
silencieusement s'ils survivent dans la config Desktop.

C'est un vecteur de croissance non borné, et il défait la Phase 2.2 sans le dire. Cohérent avec
[`CLI-VS-DESKTOP.md`](CLI-VS-DESKTOP.md) : MCP et plugins ne sont **pas** synchronisés
automatiquement, ce hook a été écrit pour combler ce trou — mais il le comble dans les deux sens.

**Correctif proposé** (non appliqué) : rendre la fusion unidirectionnelle CLI → Desktop, ou ajouter
une liste d'exclusion explicite pour les serveurs retirés.

### D4 — Quatre réglages de permissions qui se contredisent 🟠

| Fichier | Ligne | Clé | Valeur |
|---|---:|---|---|
| `settings.json` | 52 | `permissions.defaultMode` | `"default"` |
| `settings.json` | **268** | `defaultMode` (racine) | **`"bypassPermissions"`** |
| `settings.json` | 152 | `skipDangerousModePermissionPrompt` | `true` |
| `settings.local.json` | 15 | `enableAllProjectMcpServers` | `true` |

La clé racine l'emporte sur le mode déclaré dans `permissions`, donc le `"default"` de la ligne 52
est décoratif. Combinaison effective : **n'importe quel `.mcp.json` de projet est admis sans
prompt**, en mode bypass, sans avertissement en mode dangereux.

C'est à la fois un risque de sécurité et **le seul chemin par lequel du contexte MCP non voulu peut
entrer** — la porte que la Phase 2.2 avait fermée côté global reste ouverte côté projet.

### Ce qui est sain — à ne pas toucher ✅

- **`hooks/state-lib.mjs:9`** — `MAX_STATE_CHARS = 2500`. La boucle PreCompact/SessionEnd →
  SessionStart est correctement bornée : ~800 tokens au pire cas, une fois par session. Les caps
  internes (5 prompts × 180 car., 20 fichiers, 5 erreurs × 200 car., 1 blob todo de 700 car.) sont
  bien calibrés. `bail()` sort toujours en 0 : un hook qui plante ne peut pas bloquer la session.
- **`rtk hook claude`** en PreToolUse sur `Bash` et `PowerShell` — mute `tool_input`, n'injecte
  aucun contexte. 0 token d'overhead, comme annoncé. Seule dépendance : le binaire `rtk` sur le PATH.
- **`hooks/codegraph-wrapper.mjs`** — annonce correctement `{tools: []}` quand
  `.codegraph/codegraph.db` est absent, évitant le « Server disconnected ». (Détail : le
  `setInterval` l. 91-96 ne bascule jamais réellement malgré son commentaire — inoffensif, le stub
  reste sans outils jusqu'à la session suivante.)

### Défauts d'intégrité annexes

- **Réplication `CLAUDE.md` ↔ `gemini.md` violée.** Racine `CLAUDE.md` (8 396 o) et racine
  `GEMINI.md` (8 396 o) sont identiques ✅. Mais `claude-code-cli/gemini.md` diverge de la racine sur
  deux points : le bloc `~/.claude/memory/MEMORY.md` et **la ligne `planificateur` du tableau de
  délégation**. Le sous-agent le plus récent manque donc côté Gemini.
- **`.gitignore` contient des marqueurs de conflit de merge commités** — `<<<<<<< HEAD`, `=======`,
  `>>>>>>> 2cb188f`, avec `*.tmp`/`*.bak`/`*.swp`/`.DS_Store`/`Thumbs.db` piégés dans le bloc et
  `*.log` dupliqué. Git ne râle pas (les marqueurs parsent comme des motifs littéraux) mais le
  fichier est cassé.
- **`RTK.md` absent de la racine du dépôt** alors que la racine `CLAUDE.md:143` fait `@RTK.md`. Il
  n'est sauvegardé qu'à `claude-code-cli/RTK.md` (961 o). La cible d'import de la racine n'est pas
  couverte par la sauvegarde.
- **`hooks_disabled` (settings.json:157-260) n'est pas un mécanisme Claude Code.** C'est une clé
  inconnue du harnais — un parking. Les 11 enregistrements de hooks qu'elle contient ne sont pas
  « désactivés », ils **n'existent pas**. À renommer en commentaire ou à sortir dans un fichier
  séparé pour éviter la fausse impression d'un interrupteur.
- **17 fichiers de hooks morts** : 10 shims CodeGraph (`hooks/*.sh` sauf `auto-graph-setup.sh`),
  5 fichiers `caveman-*`, 2 statuslines orphelines (`claude-statusline.mjs`,
  `claude-statusline-wrapper.mjs` — la `statusLine` de `settings.json:144` pointe sur un asar
  `multi-terms`). Les 10 shims ont **deux défauts qui les rendraient inopérants si on les
  réactivait** : un **BOM UTF-8 avant le shebang**, et un `CODEGRAPH_BIN` en backslashes Windows
  entre guillemets doubles, inexploitable en bash.
- **Deux profils Windows incohérents** : `settings.json`, `.mcp.json` et les hooks pointent
  `C:\Users\Juliann\`, alors que `plugins/installed_plugins.json` et `known_marketplaces.json`
  pointent `C:\Users\julia\` — profil supprimé le 2026-07-17.
- **Le plugin `caveman` est installé mais pas activé** (`enabledPlugins` ne liste que
  `frontend-design`). Caveman ne t'atteint que par le **skill**, pas par ses hooks — ce qui explique
  qu'aucun `caveman-*.js` ne soit enregistré.

---

## Axe 3 — Auto-activation des sous-agents

Claude Code sélectionne un sous-agent en appariant la requête à la chaîne `description:` du
frontmatter. **Ce qui n'est pas dans `description` n'existe pas pour le routeur** — ni le corps du
fichier, ni le tableau de `CLAUDE.md`.

### État des lieux

| Agent | `description` | `tools:` | `model:` | Déclenchable ? |
|---|---|---|---|---|
| `web-researcher` | riche, FR | 6 outils | ❌ | ✅ bon |
| `obsidian-context-retriever` | riche, FR | 2 MCP + 5 | ❌ | ✅ bon, mais collisions |
| `little-tasks` | riche, FR | 6 outils | ❌ | ⚠️ collision + bruit |
| `triage-contexte` | correcte, FR | 5 outils | ❌ | ⚠️ seuils absents, conflit RTK |
| `vps-sysadmin` | correcte, FR | 6 outils | ❌ | ⚠️ formule permissive |
| `planificateur` | **abstraite, FR** | ❌ **absent** | ❌ | 🔴 **le moins déclenchable** |

### S1 — Aucun agent n'a de clé `model:` 🔴

Vérifié : `grep -rn "^model:" claude-code-cli/agents/` ne renvoie **rien** sur les six agents. Ils
héritent tous du modèle de session, donc **haiku aujourd'hui** (défaut D1).

Deux conséquences symétriques :
- `planificateur` fait du raisonnement architectural sur haiku → sous-dimensionné.
- `little-tasks` (« **Zéro raisonnement.** », `little-tasks.md:20`) et `triage-contexte` suivront
  l'orchestrateur en opus une fois D1 corrigé → **surdimensionnés et coûteux**, alors qu'ils
  délèguent déjà le gros à `agy`.

Corriger D1 sans corriger S1 déplace le problème au lieu de le résoudre. **Les deux vont ensemble.**

### S2 — `planificateur` n'a pas de clé `tools:` 🟠

`claude-code-cli/agents/planificateur.md:1-4` — frontmatter de 4 lignes, `name` + `description`
seulement. Il hérite de **tous** les outils, y compris la surface MCP `github` complète. C'est le
seul des six sans cadrage.

Nuance importante, déjà documentée dans `CLAUDE.md:87-88` : `tools:` ne réduit pas le contexte
(il filtre une liste déjà chargée). Le gain ici est du **cadrage de permissions**, pas du token.

### S3 — Descriptions monolingues, sans marqueur proactif 🟠

Les six descriptions sont en français, formule `À utiliser…` / `À déclencher…`. **Zéro**
`use PROACTIVELY`, **zéro** `MUST BE USED`, **zéro** exemple d'invocation.

Conséquence directe : toute requête formulée en anglais — « search the web for the Stripe API
specs », « harden SSH on the VPS », « analyze this 4000-line log » — a un **recouvrement lexical
nul** avec ces chaînes. Aucun agent ne part.

Ce qui compense partiellement : `CLAUDE.md:29-33` porte l'autorisation permanente « Lancer
**immédiatement, sans confirmation** ». Mais cette règle vit dans `CLAUDE.md`, lu par l'agent
principal — elle n'aide pas l'appariement, elle supprime juste la demande de confirmation une fois
que l'appariement a réussi.

### S4 — `planificateur` ne matche pas son propre déclencheur 🔴

`CLAUDE.md:42` promet : « Démarrage d'une tâche complexe, refactoring, nouvelle fonctionnalité **ou
étude d'architecture** ».

`planificateur.md:3` ne contient **pas** « étude d'architecture ». Et « tâche complexe » n'est pas
une phrase qu'un humain tape. Seuls `refactoring` et `nouvelle fonctionnalité` matchent
littéralement. Inversement, sa description vend la génération de `plan.md`/`progress.md`, absente du
tableau `CLAUDE.md`.

Deux références mortes dans son corps : `planificateur.md:24` (« Subagent recherche internet
(NotebookLM) ») et `planificateur.md:40` (« triage, NotebookLM ou Obsidian »). NotebookLM a été
retiré le 2026-08-04.

### S5 — Collisions de déclencheurs non arbitrées 🟠

| Terme | Agents en compétition |
|---|---|
| `refactoring` | `planificateur` **et** `obsidian-context-retriever` |
| `audit` / `config VPS` | `obsidian-context-retriever` **et** `vps-sysadmin` |
| « volumineux » | `little-tasks` (« lourd en tokens ») **et** `triage-contexte` (« fichier volumineux ») |

La preuve que la collision est réelle et connue : `CLAUDE.md:60` **et** `little-tasks.md:16` ont dû
ajouter à la main « **Pas** pour le triage de logs ». Cette exclusion vit dans le corps et dans
`CLAUDE.md` — **jamais dans la `description`**. Le routeur ne la voit pas.

### Deux problèmes supplémentaires

**Conflit franc RTK.** `triage-contexte.md:3` annonce « build output » comme cas d'usage, alors que
`CLAUDE.md:99-102` interdit d'invoquer un sous-agent de filtrage sur une sortie terminal : « RTK
compresse 100 % des sorties de build, test et commandes **à la source** : ne jamais invoquer de
sous-agent de filtrage pour une sortie de terminal ». La description contredit la règle.

**Un agent retiré reste chargeable.** `claude-code-cli/agents/retires-20260804/anytype-manager.md`
est un `.md` valide, frontmatter intact (`name: anytype-manager`, « À déclencher automatiquement »,
`tools:` listant 16 outils `mcp__anytype__*`), **à l'intérieur de l'arbre `agents/`**. Si le
chargeur descend dans les sous-dossiers, une requête « Anytype » peut sélectionner un agent dont
tout l'outillage pointe sur un serveur mort à clé révoquée. Les deux voisins
`.bak.20260804-010257` sont inertes (pas d'extension `.md`) — `anytype-manager.md` est le seul à
risque. **Correctif : le renommer sans `.md`, ou sortir le dossier de `agents/`.**

**Aucune observabilité.** `SubagentStart` est parqué dans `hooks_disabled`, donc jamais exécuté.
Rien ne permet aujourd'hui de savoir quels agents partent réellement et lesquels ne partent jamais.

---

## Frontmatters réécrits — prêts à coller

Principe appliqué : bilingue FR + EN, marqueur proactif explicite, exemples d'invocation, seuils
numériques, **exclusions négatives remontées du corps vers la `description`**, plus `model:` et
`tools:` sur chaque agent.

> ⚠️ Remplacer **uniquement** le bloc entre les deux `---` de chaque fichier. Le corps reste
> inchangé, sauf pour `planificateur` (deux références NotebookLM à purger, l. 24 et 40).

### `agents/planificateur.md`

```yaml
---
name: planificateur
description: |
  Conception de stratégie technique, étude d'architecture, cartographie de codebase, et génération de plan.md / progress.md. MUST BE USED PROACTIVELY avant d'écrire du code pour toute tâche de 3 étapes ou plus.
  Déclencheurs FR : étude d'architecture, choix d'architecture, refactoring large, nouvelle fonctionnalité, « par où commencer », « comment structurer », migration, découpage en étapes, plan de travail.
  Triggers EN : architecture study, design the approach, plan this feature, how should I structure, large refactor, migration plan, break this down.
  Exemples : « fais une étude d'architecture avant de refactorer ce module » · « comment structurer ce service ? » · « prépare un plan pour la migration ».
  PAS pour : lire un fichier volumineux (→ triage-contexte), chercher du contexte projet manquant (→ obsidian-context-retriever), exécuter un plan déjà écrit (→ skill plan-run).
tools: Read, Glob, Grep, Bash, Write, Edit, TodoWrite
model: opus
---
```

### `agents/triage-contexte.md`

```yaml
---
name: triage-contexte
description: |
  Dégrossissement de gros fichiers statiques sur disque. MUST BE USED dès qu'un fichier dépasse ~1 000 lignes ou ~500 Ko : log, dump, NDJSON, JSON/CSV massif, export, transcript. Lit, filtre, et ne renvoie que les extraits pertinents avec chemins et numéros de ligne — jamais le contenu brut.
  Déclencheurs FR : ce log de N lignes, ce dump, analyse ce fichier volumineux, trouve l'erreur dans ce fichier, ce dossier contient trop de fichiers.
  Triggers EN : analyze this large log, parse this dump, find the error in this file, this NDJSON is huge, too many files to read.
  Exemples : « analyse ce log de 4 000 lignes » · « trouve les 500 erreurs dans ce dump » · « qu'est-ce qui casse dans ce NDJSON de 800 Ko ».
  PAS pour : les sorties de commandes terminal (RTK les compresse déjà à la source), ni la conversion de formats (→ little-tasks).
tools: Read, Grep, Glob, Bash
model: haiku
---
```

*(« build output » retiré : conflit avec la règle RTK de `CLAUDE.md:99-102`. `PowerShell` retiré :
ce n'est pas un nom d'outil Claude Code valide.)*

### `agents/little-tasks.md`

```yaml
---
name: little-tasks
description: |
  Micro-exécuteur passif, zéro raisonnement. MUST BE USED pour toute tâche brute, répétitive, volumineuse en tokens mais faible en réflexion. Renvoie un chemin de fichier, jamais le contenu.
  Périmètre FR : conversion de formats (JSON↔YAML, cURL→.env.example, table Markdown↔JSON), génération de mocks et fixtures (JSON, SQL, CSV), documentation passive (JSDoc, PHPDoc, README sur code existant), scaffolding d'arborescence (mkdir -p, touch).
  Triggers EN : convert this JSON to YAML, generate fixtures, scaffold this folder structure, write JSDoc for these functions, turn this curl into an env example.
  Exemples : « convertis ce YAML en JSON » · « génère 200 lignes de fixtures SQL » · « crée l'arborescence du projet ».
  PAS pour : le triage de logs ou de gros fichiers (→ triage-contexte), ni rien qui demande une décision.
tools: Bash, Read, Write, Glob, Grep
model: haiku
---
```

*(« Délègue à agy » retiré de la `description` : détail d'implémentation, bruit pour l'appariement.
Reste dans le corps, l. 16-20. `PowerShell` retiré, même raison que ci-dessus.)*

### `agents/obsidian-context-retriever.md`

```yaml
---
name: obsidian-context-retriever
description: |
  Récupère le contexte technique manquant dans le vault Obsidian (`G:\Mon Drive\Obsidian Vault`) et maintient ce vault. MUST BE USED PROACTIVELY dès qu'une action technique est demandée sans que la stack, la topologie, les IP, les ports, les variables d'env ou les règles projet soient fournis — et sur toute question portant sur le vault. Le déclencher même si la mémoire native semble déjà répondre : le vault est souvent plus à jour.
  Déclencheurs FR : question sur mon vault, mes notes, qu'est-ce que j'avais noté sur, quelle est ma stack pour, sur quel port tourne, quelle IP, quelles règles pour ce projet, déploiement/config/intégration sans contexte fourni.
  Triggers EN : what did I note about, my vault, my notes on, what stack do I use for, which port, project conventions.
  Exemples : « qu'est-ce que j'avais noté sur le déploiement de ce service ? » · « quelle est ma stack pour ce projet ? » · « déploie ce projet » (contexte absent → récupérer d'abord).
  Renvoie un brief structuré, jamais un dump.
  PAS pour : concevoir l'architecture une fois le contexte connu (→ planificateur), ni exécuter des commandes sur le VPS (→ vps-sysadmin).
tools: mcp__obsidian-semantic__semantic-search, mcp__obsidian-semantic__build-semantic-index, Read, Write, Edit, Glob, Grep
model: sonnet
---
```

### `agents/web-researcher.md`

```yaml
---
name: web-researcher
description: |
  Recherche web approfondie via WebSearch + WebFetch. MUST BE USED dès qu'il faut chercher en ligne, se renseigner, faire une veille ou un état de l'art, ou lire la documentation d'une API externe.
  Déclencheurs FR : cherche sur internet, renseigne-toi sur, fais une veille, état de l'art, quelle est la doc de, comment marche l'API de, quoi de neuf sur.
  Triggers EN : search the web for, look up, research, latest docs for, what's the current state of, how does the X API work.
  Exemples : « cherche les dernières specs de l'API Stripe » · « fais un état de l'art des runners CI auto-hébergés » · « renseigne-toi sur les breaking changes de la v3 ».
  Renvoie une synthèse compacte et sourcée, jamais un dump.
  PAS pour : lire une URL unique que je fournis (defuddle/WebFetch suffit).
tools: WebSearch, WebFetch, Read, Write, Glob, Grep
model: sonnet
---
```

### `agents/vps-sysadmin.md`

```yaml
---
name: vps-sysadmin
description: |
  Administrateur système Linux et DevOps. MUST BE USED pour toute opération sur un serveur : gestion de l'OS Ubuntu, durcissement SSH, UFW, fail2ban, conteneurs Docker et Compose, processus PM2, systemd, nginx, certificats, routines de maintenance et de sauvegarde.
  Déclencheurs FR : sur le VPS, durcis SSH, ouvre/ferme le port, redémarre le conteneur, relance pm2, configure nginx, mets en place la sauvegarde, sécurise le serveur, docker compose up.
  Triggers EN : on the VPS, harden SSH, open the firewall port, restart the container, pm2 restart, set up backups, secure the server.
  Exemples : « durcis la config SSH du VPS » · « redémarre le conteneur qui a crashé » · « mets en place une sauvegarde quotidienne ».
  PAS pour : récupérer l'IP, le port ou les credentials du VPS (→ obsidian-context-retriever, d'abord).
tools: Bash, Read, Write, Edit, Glob, Grep
model: sonnet
---
```

### Ce que ces réécritures résolvent

| Défaut | Résolu par |
|---|---|
| S1 (pas de `model:`) | clé `model:` sur les six — haiku pour le grunt, sonnet pour la synthèse, opus pour l'architecture |
| S2 (`tools:` absent) | `tools:` ajouté sur `planificateur` |
| S3 (monolingue, pas de marqueur) | `MUST BE USED` / `MUST BE USED PROACTIVELY` + blocs `Triggers EN` + exemples |
| S4 (`planificateur` ne matche pas) | « étude d'architecture » inscrit, plus les formulations réelles |
| S5 (collisions) | section `PAS pour :` dans chaque description, avec renvoi vers le bon agent |
| Conflit RTK | « build output » retiré de `triage-contexte` |
| Seuils absents | « ~1 000 lignes ou ~500 Ko » inscrits dans `triage-contexte` |

**À faire en complément** (hors frontmatter) :
1. Renommer `agents/retires-20260804/anytype-manager.md` → sans extension `.md`, ou sortir le
   dossier de `agents/`.
2. Purger les deux références NotebookLM dans `planificateur.md:24` et `:40`.
3. Reporter la ligne `planificateur` du tableau de délégation dans `claude-code-cli/gemini.md`.
4. Activer un hook `SubagentStart` pour obtenir enfin de l'observabilité sur les déclenchements.

---

## Correctif appliqué dans ce commit

Un seul, sur demande explicite — `claude-code-cli/settings.json` :

```diff
- "model": "haiku",
+ "model": "opus",
```
```diff
- "effortLevel": "low",
+ "effortLevel": "high",
```

L'alias `"opus"` est utilisé plutôt qu'un identifiant figé : il suit la dernière version d'Opus sans
maintenance, et reste cohérent avec la forme précédente (`"haiku"` était déjà un alias). Si tu veux
épingler une version précise pour la reproductibilité, remplace l'alias par l'identifiant complet du
modèle.

**Rien d'autre n'a été modifié.** `defaultMode`, `enableAllProjectMcpServers`, `skillOverrides`,
`hooks_disabled`, les hooks et les agents sont **documentés ici, pas corrigés**.

---

## Redéploiement

> **Ce dépôt est une sauvegarde de `~/.claude/`, pas la configuration vivante.** Le correctif
> ci-dessus ne prend effet qu'une fois reporté sur la machine Windows.

1. Reporter les deux lignes dans `~/.claude/settings.json` (`model`, `effortLevel`).
2. **Ne pas éditer `~/.claude/CLAUDE.md` pendant une session** — règle Niveau 3, ×10 sur le coût.
   Préparer un `.next` et basculer entre deux sessions.
3. Se rappeler que `~/.claude/` est **partagé entre CLI et Desktop** ([`CLI-VS-DESKTOP.md`](CLI-VS-DESKTOP.md))
   — le correctif modèle vaut donc pour les deux d'un coup.
4. En revanche **MCP et plugins ne sont pas synchronisés** : `~/.mcp.json` (CLI) et
   `claude_desktop_config.json` (Desktop) sont deux fichiers distincts. Toute édition MCP est à
   faire **deux fois** — ou bien via `sync-mcp.js`, avec la réserve du défaut D3.

### Ordre de traitement suggéré

| Priorité | Action | Défaut |
|---|---|---|
| 1 | Reporter `model`/`effortLevel` sur la machine | D1 |
| 2 | Ajouter `model:` aux six agents (sinon D1 rend les agents grunt coûteux) | S1 |
| 3 | Supprimer le bloc `auto-graph-setup.sh:39-69` | D2 |
| 4 | Arbitrer `defaultMode` / `enableAllProjectMcpServers` | D4 |
| 5 | Coller les six frontmatters réécrits | S2-S5 |
| 6 | Neutraliser `anytype-manager.md` | axe 3 |
| 7 | Rendre `sync-mcp.js` unidirectionnel | D3 |
| 8 | Réparer `.gitignore`, resynchroniser `gemini.md`, sauvegarder `RTK.md` à la racine | intégrité |
| — | Déconnecter les connecteurs claude.ai inutilisés | **seul levier tokens restant** |

---

## Dette héritée, toujours ouverte

Reprise de [`RECAPITULATIF.md`](RECAPITULATIF.md) §8 — non traitée par cet audit :

1. **`~/.claude/CLAUDE.md` est factuellement faux** — il référence encore `anytype-manager` et des
   MCP supprimés. La version corrigée (`.next`) est prête à côté, la bascule est différée à cause de
   la règle de cache KV.
2. **Bloc `obsidian` (4 skills)** — à déposer dans `<vault>/.claude/skills/`. `G:` n'a jamais été
   monté pendant la session du 2026-08-04.
3. 🔴 **Clé S4 (ref.tools) toujours vivante**, dans une query string de `~/.cursor/mcp.json`.
   Rotation à faire — **action utilisateur, ce dépôt est public**.
4. **Compaction réelle jamais testée** — le pointeur `progress.md` a été validé par exécution
   directe du hook, pas par une compaction, qui ne se provoque pas sur commande.

Ajouts de cet audit :

5. Les descriptions de sous-agents restent **monolingues** tant que les frontmatters réécrits ne
   sont pas appliqués.
6. **Aucune observabilité** sur les déclenchements de sous-agents (`SubagentStart` non enregistré) —
   toute affirmation sur « quel agent part » reste théorique jusqu'à ce qu'un hook la mesure.

---

## Comment vérifier, plus tard

**Contexte de démarrage** — sur la machine Windows :

```bash
claude -p "ok" --output-format json
```

Relever `cache_creation_input_tokens` **+** `cache_read_input_tokens` du premier événement
assistant. Attendu après le correctif modèle : **~40 150 tok, inchangé** — passer à Opus ne change
pas la taille du préfixe, seulement qui le traite. Un écart significatif signale un effet de bord.

**Auto-activation** — trois requêtes témoins, sans nommer d'agent :

| Requête | Agent attendu | Statut actuel |
|---|---|---|
| « cherche les dernières specs de l'API Stripe » | `web-researcher` | ✅ devrait passer |
| « analyse ce log de 4 000 lignes » | `triage-contexte` | ⚠️ probable, seuils absents |
| « fais une étude d'architecture avant de refactorer ce module » | `planificateur` | 🔴 **échoue** (S4) |
| « search the web for the Stripe API specs » | `web-researcher` | 🔴 **échoue** (S3) |

Les deux dernières lignes sont le test de non-régression des frontmatters réécrits.
