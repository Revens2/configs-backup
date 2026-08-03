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

## Reste à faire pour la Phase 7

Fiabiliser le poste MCP par un relevé réel (`/context`) au lieu de l'estimation à 200 tok/outil, et
mesurer AGY et OpenCode après leurs phases respectives (5 et 6), non encore exécutées.

**Incertitude assumée :** le poste MCP est une estimation. Pour le fiabiliser il faut lancer chaque
runtime avec un prompt trivial et relever le compteur de contexte réel (`/context` côté CLI).
À faire avant de valider Phase 7 « après ».
