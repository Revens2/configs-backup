# Antigravity / AGY — configuration et parité

Ce dossier archive la configuration **assainie** d'AGY (Antigravity CLI / 2.0) telle
qu'elle est réellement active sur le poste.

## Contenu

| Fichier | Rôle live |
|---|---|
| `config.json` | plugins activés + `userSettings` (`~/.gemini/config/config.json`) |
| `mcp_config.json` | serveurs MCP déclarés (`~/.gemini/config/mcp_config.json`) — token Context7 remplacé par `${CONTEXT7_API_KEY}` |
| `settings.json` | réglages Antigravity 2.0 (modèle, workspaces de confiance) |
| `settings-cli.json` | réglages du CLI (`~/.gemini/antigravity-cli/settings.json`) |
| `agents/` | les **11 subagents** (`~/.gemini/config/agents/<nom>.md`) |
| `rules/` | règles globales, dont `agents-routage.md` (table de délégation) |
| `skills/` | skills hors périmètre, voir `SKILLS-HORS-SCOPE.md` |
| `hooks/` | hook RTK (`rtk-hook-gemini.sh` + sha256) |
| `plugins/` | `chrome-devtools-plugin`, `obsidian-kit`, `orchestrateur-kit` |

## Subagents AGY (règle de vérité)

AGY découvre les subagents Markdown dans `~/.gemini/config/agents/<nom>.md` (ou
`<nom>/agent.md`), ainsi que dans `<workspace>/.agents/agents/` et `plugins/<plugin>/agents/`.
L'invocation se fait par l'outil `invoke_subagent` ; `mainAgent: true` rend l'agent
sélectionnable comme agent primaire.

Frontmatter attendu : `name`, `description` (obligatoires), `tools`, `subagent`, `mainAgent`,
`model` (`inherit|flash|pro`), `commandExecutionPolicy`, `enable_mcp_tools`, `skills`.

**Piège connu** : un nom d'outil mal orthographié dans `tools` peut faire **planter** le
subagent au lieu d'échouer proprement. Les noms utilisés ici sont : `view_file`, `write_file`,
`replace_file_content`, `run_command`, `grep_search`, `find_by_name`, `list_dir`,
`invoke_subagent`, `search_web`, `read_url_content`, `read_browser_page`.

### Contrôles

```bash
# 1. agents sélectionnables comme agent primaire (mainAgent: true)
agy agents

# 2. roster réel des subagents rendu au modèle (preuve de découverte)
agy -p "Liste uniquement les noms exacts des subagents que tu peux invoquer avec invoke_subagent."
#    attendu : self, research (built-ins) + les 11 rôles

# 3. serveurs MCP
agy mcp list
```

## Serveurs MCP

Socle commun aux runtimes : `vault`, `context7`, `chrome-devtools`, `codegraph`.
Propres à AGY : `broker` (identité `broker_antigravity`, liée à la clé côté VPS).

`github` a été retiré partout le 2026-09-22 : le paquet `@modelcontextprotocol/server-github`
exige `GITHUB_PERSONAL_ACCESS_TOKEN`, absent de l'environnement. Les opérations Git passent par
`git`/`gh` CLI.

## Restaurer

Copier les fichiers voulus dans `~/.gemini/config/` (agents, rules, hooks) et
`~/.gemini/antigravity-cli/` (settings du CLI), puis recréer les valeurs sensibles
(`CONTEXT7_API_KEY`, identités broker) dans l'environnement local — jamais depuis ce dépôt.
