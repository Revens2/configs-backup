# Backup centralisé des configurations IA

Ce dépôt archive les configurations réutilisables de Claude Code, Antigravity, OpenCode,
Codex et Freebuff. Les fichiers sont conservés sous forme texte et assainie.

## Contenu

- `claude-code-cli/` — settings, MCP, agents, hooks, skills et plugins Claude Code.
- `antigravity/` — configuration, MCP, agents, hooks, plugins et skills Antigravity.
- `opencode/` — configuration, agents, plugins et skills OpenCode.
- `codex/` — configuration Codex, hooks, règles, agents et skill ChatGPT.
- `freebuff/global-skills/` — skills réutilisables installés pour Freebuff.
- `CLAUDE.md`, `AGENTS.md`, `SKILLS.md` — instructions et inventaires partagés.

## Restaurer

Copier uniquement les fichiers de configuration nécessaires dans le répertoire du runtime
correspondant, puis adapter les chemins locaux, les versions de modèles et les variables
d'environnement. Les credentials doivent être recréés dans le coffre d'authentification local,
jamais dans ce dépôt.

## Sécurité et exclusions

Ce dépôt est public. Ne sont pas versionnés :

- `auth.json`, `.credentials.json`, `.env*`, tokens, mots de passe, clés SSH et clés privées ;
- historiques, transcripts, sessions, caches, telemetry, bases SQLite et fichiers WAL/SHM ;
- états d'interface, identifiants personnels, UUID de projet et métadonnées de workspace ;
- rapports d'exécution, `plan.md`, `progress*.md` et journaux de mission ;
- chemins de runtime, pipes nommés et listes de confiance propres à une machine.

Les URL MCP publiques ou privées et les noms de variables d'environnement peuvent être conservés
lorsqu'ils ne contiennent pas de secret. Les valeurs sensibles sont remplacées par des noms de
variables ou `REDACTED_*`.
