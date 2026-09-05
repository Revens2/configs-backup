# GEMINI.md — instructions Antigravity / AGY

Ce fichier reste volontairement court. Il ne contient **aucune IP, aucun port, aucune topologie ni version volatile**.

## Sources canoniques

- Architecture globale : [`ENVIRONMENT-MAP.md`](ENVIRONMENT-MAP.md)
- Orchestration AGY : [`antigravity/plugins/orchestrateur-kit/rules/orchestrateur.md`](antigravity/plugins/orchestrateur-kit/rules/orchestrateur.md)
- Context engineering : [`CONTEXT-ENGINEERING.md`](CONTEXT-ENGINEERING.md)
- Routage runtimes : [`REPARTITION-RUNTIMES.md`](REPARTITION-RUNTIMES.md)
- Configuration AGY active sauvegardée : [`antigravity/`](antigravity/)

## Règles

- AGY est un **fallback complet à Claude Code**, pas un runtime volontairement simplifié.
- Pour un projet ou une infra, récupérer les faits dynamiques depuis le Vault/RAG, le dépôt et l'état réel avant d'agir.
- Ne jamais deviner IP, port, chemin, credential, produit VPN, état de service ou flag technique.
- Utiliser uniquement les primitives réellement présentes dans le build : Rules, Skills, Plugins, Hooks, MCP et workers/outils exposés. Ne pas simuler un custom subagent qui n'existe pas.
- Pour DEEP/CRITICAL : `plan.md` + `progress.md` compact ; `errors.md` uniquement si nécessaire ; contexte propre aux frontières de phase.
- Ne pas réémettre un ToDo complet à chaque tour.
- NotebookLM ne fait plus partie de la stack active.