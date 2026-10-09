<!-- Fusionne depuis CLAUDE.md (C:\Users\Juliann\configs-backup) le 2026-10-09 - AGENTS.md reste canonique -->

# CLAUDE.md — pointeur du dépôt de configuration

Ce dépôt est un **backup assaini** de plusieurs runtimes. Ce fichier racine reste volontairement court pour éviter de dupliquer des règles et des données volatiles.

## Sources canoniques

- Comportement Claude Code : [`claude-code-cli/CLAUDE.md`](claude-code-cli/CLAUDE.md)
- Carte globale de la stack : [`ENVIRONMENT-MAP.md`](ENVIRONMENT-MAP.md)
- Politique contexte/tokens/handoff : [`CONTEXT-ENGINEERING.md`](CONTEXT-ENGINEERING.md)
- Routage entre runtimes : [`REPARTITION-RUNTIMES.md`](REPARTITION-RUNTIMES.md)

## Règles de ce dépôt

- Ne jamais stocker ici de secret, credential, session, transcript ou état runtime.
- Ne jamais figer ici d'IP, port, chemin de déploiement, état de service ou flag technique susceptible de vieillir : ces données se récupèrent depuis le Vault/RAG et l'état réel.
- Les fichiers de chaque runtime sont autoritaires uniquement pour ce runtime.
- Les audits/plans historiques appartiennent à l'historique Git, pas à la gouvernance active.
- `plan.md`, `progress.md` et `errors.md` sont des artefacts de mission locaux et ne sont pas des fichiers de configuration à conserver dans ce dépôt.

---

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
