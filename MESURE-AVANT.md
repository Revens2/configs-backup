# Mesure « AVANT » — contexte de démarrage par runtime

Relevé le 2026-08-04, **avant toute modification**. Phase 7 du plan.
Méthode : taille réelle en octets des artefacts chargés au démarrage ; conversion `tokens ≈ octets / 4`
(anglais + markdown, ratio usuel). Les postes marqués *(est.)* ne sont pas mesurables hors exécution
et sont estimés — la méthode d'estimation est donnée.

---

## Claude Code CLI

| Poste | Octets | ~Tokens | Note |
|---|---:|---:|---|
| `~/.claude/CLAUDE.md` | 6 771 | 1 693 | cible Phase 2.1 : ≤ 6 Ko |
| `~/.claude/RTK.md` (importé par `@RTK.md`) | 990 | 248 | |
| `~/CLAUDE.md` (projet) | 3 646 | 912 | |
| `memory/MEMORY.md` | 3 754 | 938 | index auto-mémoire |
| Listing des **skills** (62 frontmatters `name` + `description`) | 24 227 | **6 057** | **poste n°1 des statiques** |
| Listing des **agents** (6 workers : description + tools) | 3 451 | 863 | |
| Commands (1) | 2 817 | 704 | |
| **Sous-total statique** | **45 656** | **11 415** | |
| Schémas d'outils **MCP** *(est.)* | — | **~39 000** | 7 serveurs, ~195 outils × ~200 tok/outil |
| **TOTAL démarrage** | — | **~50 400** | |

Décomposition MCP (nombre d'outils exposés, relevé en session) :

| Serveur | Outils |
|---|---:|
| anytype | 50 |
| codegraph | 46 |
| notebooklm | ~45 |
| github | 26 |
| obsidian | 15 |
| canva | 11 |
| obsidian-semantic | 2 |
| **Total** | **~195** |

**Lecture :** les MCP pèsent ~77 % du contexte de démarrage, le listing des skills ~12 %, les
instructions ~7 %. Les deux leviers de Phase 2 (retirer les MCP de domaine de l'orchestrateur,
descendre les skills dans les projets) attaquent donc ~89 % du total. Dégraisser `CLAUDE.md`
seul ne rendrait que ~1 700 tokens.

---

## Claude Code Desktop

`%APPDATA%\Claude\claude_desktop_config.json` déclare **exactement les mêmes 7 serveurs MCP** que
`~/.mcp.json` (anytype, canva, codegraph, github, notebooklm, obsidian, obsidian-semantic).
Preuve : `claude_desktop_config.json:mcpServers` vs `~/.mcp.json:mcpServers`, listes identiques.

| Poste | ~Tokens |
|---|---:|
| MCP *(est.)* | ~39 000 |
| Instructions (partagées avec le CLI : `~/.claude/CLAUDE.md`, `~/CLAUDE.md`, `MEMORY.md`, skills, agents) | ~11 400 |
| **TOTAL** | **~50 400** |

Différence CLI/Desktop constatée à ce stade : **aucune** sur le contexte. `TodoWrite` absent côté
Desktop, outils MCP servis en mode *deferred* (noms seuls tant que `ToolSearch` n'est pas appelé) —
à confirmer si ce comportement existe aussi côté CLI, ce qui changerait radicalement le chiffre MCP.

---

## AGY CLI (Antigravity 1.1.10)

| Poste | Octets | ~Tokens |
|---|---:|---:|
| `~/.gemini/GEMINI.md` | 7 908 | 1 977 |
| `~/.gemini/settings.json` | 266 | 67 |
| Skills `~/.antigravitycli/skills/` (10) | — | *(non listés au démarrage — à confirmer)* |
| MCP | 0 | 0 |
| **TOTAL mesurable** | **8 174** | **~2 044** |

`~/.antigravitycli/mcp/` est **vide** : aucun MCP chargé côté AGY aujourd'hui. Le
`antigravity/mcp_config.json` du dépôt de backup n'a pas d'équivalent actif sur la machine.

---

## OpenCode 1.18.3

| Poste | Octets | ~Tokens |
|---|---:|---:|
| `~/.config/opencode/AGENTS.md` | 8 164 | 2 041 |
| `opencode.jsonc` | 502 | 126 |
| Agents (3 : obsidian-context-retriever, triage-contexte, web-researcher) | 10 621 | 2 655 |
| Skills (1) | — | négligeable |
| MCP | 0 | 0 |
| **TOTAL** | **19 287** | **~4 822** |

Modèle : `vps-ia/Qwen 3.6 35b MoE` via `http://100.99.75.104:4002/v1`, contexte 98 304 tokens.
Le contexte de démarrage consomme donc **~5 %** de la fenêtre — mais les 3 agents sont chargés
**en entier** (pas seulement leur description), ce qui est le levier de Phase 6.1.

---

## Récapitulatif

| Runtime | Contexte démarrage (~tok) | Poste dominant |
|---|---:|---|
| Claude Code CLI | ~50 400 | MCP (77 %) |
| Claude Code Desktop | ~50 400 | MCP (77 %) |
| OpenCode | ~4 800 | agents chargés en entier (55 %) |
| AGY CLI | ~2 000 | `GEMINI.md` |

---

# Mesure « APRÈS » — 2026-08-04, phases 1, 2.2, 2.3, 2.4 exécutées

Même méthode, mêmes postes. Le poste MCP reste une estimation à ~200 tok/outil.

## Claude Code CLI / Desktop

| Poste | Avant | Après | Delta |
|---|---:|---:|---:|
| `~/.claude/CLAUDE.md` | 1 693 | 1 693 | 0 — phase 2.1 abandonnée |
| `~/.claude/RTK.md` | 248 | 248 | 0 |
| `~/CLAUDE.md` (projet) | 912 | 912 | 0 |
| `memory/MEMORY.md` | 938 | 938 | 0 |
| Listing skills | 6 057 | **905** | **−5 152** |
| Listing agents | 863 | **502** | **−361** |
| Commands | 704 | 704 | 0 |
| Sous-total statique | 11 415 | **5 902** | −5 513 |
| Schémas MCP *(est.)* | ~39 000 | **~14 800** | **−24 200** |
| **TOTAL** | **~50 400** | **~20 700** | **−29 700 (−59 %)** |

Détail des postes travaillés :

| | avant | après |
|---|---:|---:|
| Serveurs MCP | 7 | 3 (`codegraph`, `github`, `obsidian-semantic`) |
| Outils MCP exposés | ~195 | ~74 |
| Skills au niveau utilisateur | 63 | **15** |
| Workers | 6 | 5 |

## Ce que ça a coûté en capacité

- `anytype` : rien. Serveur en panne, 0 appel en 18 jours, clé révoquée.
- `canva` : rien. 0 appel en 18 jours.
- `notebooklm` : `web-researcher` perd le corpus persistant, garde `WebSearch`/`WebFetch`. 2 appels en 18 j.
- `obsidian` : `obsidian-context-retriever` perd l'écriture par MCP, **garde la lecture** via le système
  de fichiers et `semantic-search`. 3 appels en 18 j.
- 47 skills : aucun perdu. Déplacés dans `~/.claude/skills-hors-scope/<bloc>/`, redéployables dans un
  projet en une commande (`claude-code-cli/SKILLS-HORS-SCOPE.md`).

---

# Phase 7.1b — RELEVÉ RÉEL, et démenti de l'estimation

Méthode : `claude -p "…" --output-format json` depuis `C:\Users\Juliann`, lecture de
`usage.cache_creation_input_tokens` du premier tour — c'est le contexte réellement envoyé au modèle.
Trois exécutions, seule la configuration MCP varie.

| Configuration | Commande | Contexte réel |
|---|---|---:|
| Aucun MCP | `--strict-mcp-config --mcp-config '{"mcpServers":{}}'` | **14 162 tok** |
| 3 serveurs locaux seuls | `--strict-mcp-config --mcp-config ~/.mcp.json` | **15 036 tok** |
| Configuration par défaut | *(rien)* | **40 051 tok** |

Décomposition qui en découle :

| Poste | Coût réel | Part |
|---|---:|---:|
| Base Claude Code + instructions + skills + agents | 14 162 | 35 % |
| **3 serveurs MCP locaux** (74 outils) | **874** | **2 %** |
| **Connecteurs claude.ai** (Gmail, Microsoft 365, MCP Obsidian ngrok) | **25 015** | **62 %** |
| **TOTAL** | **40 051** | |

## Ce que ça démolit

**Mon estimation à ~200 tok/outil était fausse d'un facteur ~17.** Les 74 outils des 3 serveurs
locaux coûtent 874 tokens, soit **~12 tok/outil** — parce que Claude Code 2.1.220 charge les outils
MCP en **différé** (mécanisme `ToolSearch` / `toolSearchEnabled`, repéré dans le binaire) : seuls les
noms sont envoyés, les schémas complets sont récupérés à la demande.

Conséquence directe : **le poste MCP local n'a jamais été le problème.** Les phases 2.2a et 2.2b —
retrait d'`anytype`, `canva`, `notebooklm`, `obsidian` — n'ont pas rendu les ~24 200 tokens annoncés.
L'ordre de grandeur réel est de quelques centaines de tokens. Ces retraits restent justifiés
(serveur mort, clé révoquée, 0 appel en 18 jours), mais **pas** par l'argument tokens.

En revanche la phase 2.3 (skills : 6 057 → 905 tok) porte sur des instructions envoyées en clair dans
le prompt système, non différées : ce gain-là est réel et se lit dans les 14 162 tokens de base.

## Le vrai levier, non exploité

**Les connecteurs claude.ai pèsent 25 015 tokens, 62 % du contexte de démarrage.** Ils ne sont pas
différés. Ils ne sont dans aucun fichier local — ils se gèrent dans l'interface claude.ai, ou se
coupent en bloc par `disableClaudeAiConnectors` dans les settings.

Trois connecteurs pour ce prix : `Gmail`, `Microsoft 365` (qui demande une authentification et ne
fonctionne donc même pas), et `MCP Obsidiann Juliann` — celui de S3, l'endpoint ngrok public.

Les couper ferait passer le démarrage de **40 051 à ~15 036 tokens (−62 %)**, et supprimerait S3 par
la même occasion. C'est, de loin, l'action la plus rentable de tout ce chantier — et elle n'a pas été
faite, faute d'avoir mesuré avant d'optimiser.

## Coupure sélective des connecteurs — exécutée et mesurée

Arbitrage : couper `Microsoft 365` et `MCP Obsidiann Juliann`, **garder `Gmail`**.

`disableClaudeAiConnectors` est tout-ou-rien : inutilisable ici. Le levier qui marche est
**`deniedMcpServers`** dans `~/.claude/settings.json` — il fusionne depuis toutes les sources de
settings et mord aussi sur les connecteurs claude.ai, ce que rien ne documentait :

```json
"deniedMcpServers": ["Microsoft 365", "MCP Obsidiann Juliann"]
```

| | Contexte réel |
|---|---:|
| Avant coupure | 40 051 tok |
| **Après coupure** | **16 021 tok** |
| **Gain** | **−24 030 tok (−60 %)** |

> ⚠️ **CE TABLEAU EST FAUX — réfuté le 2026-08-04, voir la section « Contre-mesure » en fin de
> fichier.** Les 16 021 tok ne sont que `cache_creation_input_tokens` ; les 24 030 « gagnés » sont
> passés en `cache_read_input_tokens` et continuent d'être envoyés au modèle. Le contexte réel n'a
> pas bougé. Le tableau est conservé tel quel : le purger ferait rejouer l'erreur.

Décomposition finale :

| Poste | Coût |
|---|---:|
| Base Claude Code + instructions + skills + agents | 14 162 |
| 3 serveurs MCP locaux (74 outils, différés) | 874 |
| Connecteur `Gmail` (conservé) | ~985 |
| **TOTAL** | **16 021** |

Les deux connecteurs coupés pesaient donc à eux seuls **24 030 tokens**, contre ~985 pour Gmail.

Note : `claude mcp list` continue de les afficher comme connectés — la commande liste ce qui est
*déclaré*, pas ce qui est *chargé dans le contexte*. C'est le compteur de tokens qui fait foi.

## Limite de cette mesure

Le chiffre « avant chantier » en unités réelles **n'existe pas** : le premier relevé réel a été fait
après les phases 1 à 6. Les 40 051 tok ci-dessus sont un *après-phases-1-à-6, avant-coupure*, pas un
état initial. Toute comparaison avec les ~50 400 tok estimés en tête de ce document mélangerait deux
méthodes et n'aurait pas de sens.

## Reste à faire

- Mesurer AGY et OpenCode par une méthode équivalente (leurs CLI n'exposent pas le même compteur).

**Incertitude assumée :** le poste MCP est une estimation. Pour le fiabiliser il faut lancer chaque
runtime avec un prompt trivial et relever le compteur de contexte réel (`/context` côté CLI).
À faire avant de valider Phase 7 « après ».

---

# Contre-mesure du 2026-08-04 (session de portage) — le gain de 60 % n'existe pas

## Ce qui a été mesuré

Trois exécutions de `claude -p "ok" --output-format json` depuis `C:\Users\Juliann`, le même jour, à
quelques minutes d'intervalle, ne variant que par la configuration. Métrique corrigée : **total du
premier tour = `cache_creation_input_tokens` + `cache_read_input_tokens`**.

| Configuration | `cache_creation` | `cache_read` | **TOTAL réel** |
|---|---:|---:|---:|
| `--settings '{"deniedMcpServers":[]}'` — tous les connecteurs actifs | 15 861 | 24 276 | **40 137** |
| défaut — `deniedMcpServers: ["Microsoft 365","MCP Obsidiann Juliann"]` | 15 874 | 24 276 | **40 150** |
| `--strict-mcp-config --mcp-config '{"mcpServers":{}}'` | 14 587 | 24 276 | **38 863** |

## Ce que ça établit

1. **`deniedMcpServers` ne réduit pas le contexte.** Refuser deux connecteurs ou n'en refuser aucun
   donne le même total à **13 tokens près** — du bruit. Le « −24 030 tok / −60 % » annoncé la veille
   était un artefact : le relevé « avant » était à cache froid (`cache_read = 0`), le relevé
   « après » à cache chaud. On comparait deux états de cache, pas deux contextes.
2. **`cache_read` est constant à 24 276 dans les trois variantes.** Ce bloc est identique quelle que
   soit la config MCP : il ne dépend ni des serveurs locaux, ni de `deniedMcpServers`.
3. **Les 3 serveurs MCP locaux coûtent ~1 287 tok** (40 150 − 38 863), cohérent avec les 874 tok
   relevés la veille et avec le chargement différé (`ToolSearch`) : quelques centaines à ~1 300
   tokens, pas des dizaines de milliers.
4. **Le contexte de démarrage réel de Claude Code est ~40 150 tok**, et non 16 021.

## Méthode à appliquer désormais

`--output-format json` renvoie un **tableau d'événements**. Prendre le **premier** événement
`assistant` et sommer `cache_creation_input_tokens + cache_read_input_tokens`. Ne jamais comparer un
relevé froid à un relevé chaud. Un différentiel n'est valide que sur des totaux, ou à état de cache
identique.

Les mesures AGY (`.agents/` présent 21 517 → absent 9 305 → après triage 9 303) remplissent cette
condition : ce sont des totaux sur la même métrique. Elles restent valides.

## Ce qui reste vrai du chantier de la veille

- Le triage de `~/.agents/skills/` : **−57 % sur AGY**, différentiel valide.
- La phase 2.3 (63 → 15 skills utilisateur) : instructions envoyées en clair, non différées.
- Les retraits MCP restent justifiés — serveur mort, clé révoquée, 0 appel en 18 jours — mais leur
  gain en tokens est de l'ordre du millier, pas de la dizaine de milliers.

## Ce qui n'a pas été retesté

L'effet de `deniedMcpServers` sur le **Desktop** (interface claude.ai) n'a pas été remesuré : la
contre-mesure porte sur le CLI headless. Le réglage est laissé en place — il bloque l'exécution, ce
qui reste un effet utile — mais il ne doit plus être présenté comme un levier de contexte.
