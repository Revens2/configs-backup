# Claude Code CLI vs Desktop — ce qui est partagé, ce qui est séparé

Relevé le 2026-08-04, après les phases 1 à 3. Phase 4 du plan.
Chaque ligne est vérifiable : le chemin est donné, rien n'est déduit.

## Partagé — un seul fichier lu par les deux runtimes

| Objet | Chemin | Taille |
|---|---|---:|
| Instructions globales | `~/.claude/CLAUDE.md` | 6 771 o |
| Settings | `~/.claude/settings.json` | 7 017 o |
| Settings locaux | `~/.claude/settings.local.json` | 924 o |
| Workers | `~/.claude/agents/*.md` | 5 |
| Skills | `~/.claude/skills/*/SKILL.md` | 16 |
| Hooks | `~/.claude/hooks/` | 23 fichiers |
| Mémoire auto | `~/.claude/projects/<slug>/memory/` | — |
| État anti-compaction | `~/.claude/state/<slug>/STATE.md` | — |

**Preuve directe :** cette session tourne sous Desktop et a chargé `~/.claude/CLAUDE.md`,
`~/.claude/RTK.md`, `~/CLAUDE.md` et `MEMORY.md` — les mêmes fichiers que le CLI. Toute modification
d'un de ces fichiers vaut pour les deux runtimes ; il n'y a rien à « aligner ».

## Séparé — un fichier par runtime

| Objet | CLI | Desktop |
|---|---|---|
| Déclaration MCP | `~/.mcp.json` | `%APPDATA%\Claude\claude_desktop_config.json` |
| Config applicative | — | `%APPDATA%\Claude\config.json` (4 693 o) |
| Plugins | `~/.claude/plugins/` (1 activé : `frontend-design@claude-plugins-official`) | plugin `anthropic-skills` fourni par l'app, **absent** de `~/.claude/plugins/` |

**État après la phase 2.2, vérifié :** les deux fichiers MCP déclarent exactement le même jeu —
`codegraph, github, obsidian-semantic`. Alignement obtenu en éditant les deux, pas par héritage :
**ils ne se synchronisent pas tout seuls**. Toute modification MCP future doit être portée deux fois.

## Compte-level — ni CLI ni Desktop, mais visible des deux

Les connecteurs claude.ai apparaissent dans `claude mcp list` alors qu'ils ne sont dans aucun fichier
local :

- `MCP Obsidiann Juliann` — `https://<sous-domaine>.ngrok-free.dev/mcp/<jeton>` (cf. S3 dans
  `PLAN-ARCHI.md`, risque assumé)
- `Gmail` — connecté
- `Microsoft 365` — authentification requise

Ils se gèrent **dans l'interface claude.ai**, pas sur le disque. Levier local repéré si besoin :
`disableClaudeAiConnectors` dans le schéma des settings.

## Conséquences pratiques

1. Dégraisser `~/.claude/` profite aux deux runtimes d'un coup — c'est ce qui rend les phases 2.3
   et 2.4 rentables deux fois.
2. Une modification MCP se fait **toujours en double**. Un seul des deux fichiers modifié = les deux
   runtimes divergent silencieusement.
3. `anthropic-skills` (Desktop) double `docx`, `pdf`, `pptx`, `xlsx`, `caveman`, `skill-creator`.
   Ces skills ont été sortis du scope utilisateur en phase 2.3 : côté Desktop ils restent servis par
   le plugin, côté CLI ils sont dans `~/.claude/skills-hors-scope/`. **Asymétrie assumée et connue.**

## Sous-agents : rien de spécifique à Desktop

Claude Desktop n'a **pas** de répertoire d'agents propre. `claude-code-desktop/` ne contient que
des JSON (`claude_desktop_config.json`, `config.json`, `Preferences`, `window-state.json`,
`cowork-enabled-cli-ops.json`) : aucun format de sous-agent Markdown n'y est chargé.

Les sous-agents sont définis une seule fois dans `~/.claude/agents/` et servis aux deux runtimes.
Ajouter un `claude-code-desktop/agents/` serait inventer un schéma qui n'existe pas — à ne pas
faire. C'est le cas de `github-code-review` (2026-08-12) : déployé en CLI, OpenCode et Antigravity,
rien côté Desktop, volontairement.

`code-review-graph` expose bien un serveur MCP (`serve --repo <path>`), qui pourrait un jour être
déclaré dans `mcpServers` des deux fichiers de config. Non fait : ce serait une intégration MCP,
pas un sous-agent, et elle devrait alors être posée **en double** (règle ci-dessus).
