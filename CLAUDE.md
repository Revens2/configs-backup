# Backup des Configurations CLI & Desktop (Antigravity, Claude Code CLI, Claude Code Desktop, Open Code)

## Structure du Projet
- `antigravity/` : Configuration Antigravity CLI (skills, hooks, subagents, gemini.md, configs JSON, plugins, sidecars)
- `claude-code-cli/` : Configuration Claude Code CLI (agents, commands, hooks, rules, skills, plugins, statusline, settings)
- `claude-code-desktop/` : Configuration Claude Code Desktop (configs UI/Desktop, preferences, window-state, extensions)
- `opencode/` : Configuration Open Code (AGENTS.md, opencode.jsonc, agents, plugins, skills)

## Règles de Sécurité
- Assainissement strict des tokens API, tokens OAuth et identifiants privés avant chaque validation/push.
