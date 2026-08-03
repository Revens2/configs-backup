# Backup Centralisé des Configurations CLI & Desktop

Ce dépôt héberge la sauvegarde consolidated, assainie et structurée de l'ensemble de vos environnements de développement et assistant AI.

---

## 📁 Arborescence du Dépôt

```
configs-backup/
├── antigravity/             # Configurations Antigravity CLI
│   ├── skills/              # Skills personnalisés & builtin (babysit, graphify, deploy, etc.)
│   ├── hooks/               # Configurations des hooks Antigravity
│   ├── subagents/           # Prompts & définitions des sous-agents
│   ├── gemini.md            # Regles d'instructions globales GEMINI.md
│   ├── config.json          # Configuration principale Antigravity
│   ├── mcp_config.json      # Serveurs & outils MCP
│   ├── settings.json        # Paramètres généraux
│   ├── plugins/             # Plugins configurés
│   └── sidecars/            # Configurations sidecars
├── claude-code-cli/         # Configurations Claude Code CLI
│   ├── agents/              # Sous-agents CLI
│   ├── commands/            # Custom slash commands CLI
│   ├── hooks/               # Hooks d'événement CLI
│   ├── rules/               # Règles d'instructions persistent
│   ├── skills/              # Skills CLI
│   ├── plugins/             # Plugins CLI
│   ├── settings.json        # Paramètres CLI
│   ├── claude-statusline.mjs# Personnalisation de la statusline CLI
│   ├── CLAUDE.md            # Fichier d'instruction principal
│   └── .claude.json         # Définition des permissions & projets CLI (anonymisé)
├── claude-code-desktop/     # Configurations Claude Desktop UI (distinct CLI)
│   ├── claude_desktop_config.json # Serveurs MCP & paramètres Desktop
│   ├── config.json          # Options système Desktop
│   ├── Preferences          # Préférences d'interface utilisateur
│   ├── window-state.json    # Layout & état de fenêtre Desktop
│   └── cowork-enabled-cli-ops.json # Permissions inter-processus Desktop
├── opencode/                # Configurations Open Code
│   ├── agents/              # Subagents Open Code (triage, web-researcher, obsidian)
│   ├── plugins/             # Plugins TypeScript (rtk.ts)
│   ├── skills/              # Skills Open Code (caveman)
│   ├── opencode.jsonc       # Options principales Open Code
│   └── AGENTS.md            # Fichier source d'agents Open Code
├── .claudeignore            # Règles de filtrage par défaut
├── .gitignore               # Secrets et fichiers de runtime ignorés
├── GEMINI.md                # Mémoire projet Antigravity
├── CLAUDE.md                # Mémoire projet Claude CLI
└── README.md                # Documentation récapitulative
```

---

## 🔒 Sécurité & Assainissement (Sanitization)
Toutes les clés d'API (Anthropic, OpenAI, Gemini, Groq), tokens OAuth, clés de session et identifiants privés ont été automatiquement censurés (`REDACTED_*`) avant l'archivage dans ce dépôt.
