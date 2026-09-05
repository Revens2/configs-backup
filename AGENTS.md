# AGENTS.md — instructions du dépôt

Ce dépôt archive les configurations réutilisables de plusieurs runtimes IA. Il n'est pas la mémoire d'une mission en cours.

## Sources canoniques

- [`ENVIRONMENT-MAP.md`](ENVIRONMENT-MAP.md) — rôle de chaque runtime et sources de vérité.
- [`CONTEXT-ENGINEERING.md`](CONTEXT-ENGINEERING.md) — stratégie de contexte, tokens et handoff.
- [`REPARTITION-RUNTIMES.md`](REPARTITION-RUNTIMES.md) — routage actuel.
- Les sous-répertoires `claude-code-cli/`, `codex/`, `antigravity/`, `opencode/`, `freebuff/` — configuration propre à chaque runtime.

## Discipline

- Préserver les changements non liés.
- Ne jamais ajouter credentials, tokens, clés privées, `.env`, sessions, transcripts ou état runtime.
- Ne pas copier de topologie/infrastructure volatile dans les fichiers globaux : la récupérer depuis le Vault/RAG et l'état réel.
- Vérifier les changements avec les tests/checks adaptés.
- Ne pas pousser, déployer, merger ou effectuer d'action externe sans le périmètre demandé.
- Les artefacts de mission (`plan.md`, `progress.md`, `errors.md`) ne sont pas de la configuration durable et restent hors Git.