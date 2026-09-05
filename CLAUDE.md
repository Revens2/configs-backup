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