# Backup centralisé des configurations IA

Ce dépôt archive les configurations réutilisables et assainies de Claude Code, Antigravity/AGY, OpenCode, Codex et Freebuff.

## Documentation canonique

Les fichiers à lire en priorité sont :

- [`PROMPT-BRAINSTORMING.md`](PROMPT-BRAINSTORMING.md) — comportement du Brainstormer ChatGPT et bootstrap `@RAG` + `@GitHub`.
- [`ENVIRONMENT-MAP.md`](ENVIRONMENT-MAP.md) — carte logique de la stack et sources de vérité.
- [`CONTEXT-ENGINEERING.md`](CONTEXT-ENGINEERING.md) — gestion du contexte, lost-in-the-middle, handoff et artefacts de mission.
- [`REPARTITION-RUNTIMES.md`](REPARTITION-RUNTIMES.md) — choix entre Claude, ChatGPT/Codex, AGY, Freebuff et OpenCode.
- [`SKILLS.md`](SKILLS.md) — index léger vers les répertoires de skills ; les `SKILL.md` réels restent la source de vérité.

Les fichiers racine `CLAUDE.md`, `AGENTS.md` et `GEMINI.md` sont de simples **pointeurs courts** vers ces sources et vers les règles propres à chaque runtime.

## Configurations par runtime

- `claude-code-cli/` — settings, MCP, sous-agents, hooks, skills et plugins Claude Code.
- `claude-code-desktop/` — configuration spécifique Desktop lorsqu'elle diffère du CLI.
- `antigravity/` — configuration, Rules, Agents, Skills, Plugins, Hooks et MCP d'AGY.
  Depuis AGY 1.2.x les **subagents Markdown existent réellement** : `~/.gemini/config/agents/<nom>.md`,
  invocation par `invoke_subagent`, sélection comme agent primaire selon `mainAgent`. `agents/` porte les
  11 spécialistes et `rules/agents-routage.md` la table de délégation. Ne pas déduire cette capacité d'un
  ancien fichier historique : elle se vérifie avec `agy agents` et le roster de subagents rendu au modèle.
- `codex/` — configuration Codex, agents, hooks et règles.
- `opencode/` — configuration, agents/plugins/skills OpenCode.
- `freebuff/` — skills réutilisables Freebuff.

## Politique de contexte

Les données dynamiques (IP, ports, topologie, état de service, chemins de déploiement, décisions projet récentes) ne sont pas figées dans les prompts globaux. Elles sont récupérées juste à temps depuis le Vault/RAG, le dépôt et l'état réel.

Les artefacts `plan.md`, `progress.md` et `errors.md` appartiennent à une mission active : ils ne sont pas de la configuration durable et restent hors Git.

Les audits, plans de migration et mesures ponctuelles datés ne sont pas conservés comme gouvernance active une fois remplacés : **l'historique Git est l'archive**.

## Restaurer

Copier uniquement les fichiers nécessaires dans le répertoire du runtime correspondant, puis adapter les chemins locaux, versions de modèles et variables d'environnement. Les credentials doivent être recréés dans le coffre d'authentification local, jamais restaurés depuis ce dépôt.

## Sécurité et exclusions

Ce dépôt est public. Ne sont pas versionnés :

- `auth.json`, `.credentials.json`, `.env*`, tokens, mots de passe, clés SSH et clés privées ;
- historiques, transcripts, sessions, caches, telemetry, bases SQLite et fichiers WAL/SHM ;
- états d'interface, identifiants personnels, UUID de projet et métadonnées de workspace ;
- rapports d'exécution, `plan.md`, `progress*.md`, `errors.md` et journaux de mission ;
- fichiers `.bak*` et autres sauvegardes locales ;
- chemins runtime/IPC spécifiques à une machine lorsqu'ils n'ont pas de valeur de restauration.

Les URL MCP et noms de variables d'environnement peuvent être conservés lorsqu'ils ne contiennent pas de secret. Les valeurs sensibles sont remplacées par des noms de variables ou `REDACTED_*`.