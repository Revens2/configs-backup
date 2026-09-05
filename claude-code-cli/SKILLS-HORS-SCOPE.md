# Skills Claude hors scope (simplification 2026-09-05)

Le 2026-09-05, la bibliothèque de skills utilisateur Claude Code a été réduite de ~50 à 4
skills. L'historique Git du dépôt conserve l'intégralité des versions supprimées ; les copies
actives du poste ont été déplacées (pas supprimées) dans
`~/.claude/archives/skills-hors-scope/2026-09-05-simplification/`.

## Conservés au niveau utilisateur (`~/.claude/skills/`)

| Skill | Raison |
|---|---|
| `caveman` | comportement demandé, plugin/hooks associés |
| `claude-chatgpt-bridge` | intégration ChatGPT ↔ Codex (volet Claude) |
| `dream` | tâche planifiée `\ClaudeDream` exécute `~/.claude/skills/dream/run-nightly.ps1` |
| `plan-run` | exécution de missions longues depuis `progress.md` (harness) |

Les autres spécialités (front, SEO, dev générique, audit, métier, obsidian legacy, etc.)
restent utilisables à la portée d'un projet : copier le skill depuis l'archive ou l'historique
Git dans `<projet>/.claude/skills/` si une mission en a réellement besoin.

## Retirés le 2026-09-05 (liste)

agents-manager, apex, api-reverse-engineer, app-icon, appstore-connect, audit-gbp,
audit-memories, audit-site, audit-skills, auditeur-citations-locales, auditeur-page-locale,
autoresearch, ci-verify, config-sync, content-reviver-local, defuddle, deleg, deslop,
environments-manager, find-skills, graphify, grill-me, harness-doctor, hooks-manager,
impeccable, karpathy-guidelines, keyword-map, knip, reclaude, rules-manager, seo-audit,
seo-expert, seo-internal-linking, seo-metadata, seo-schema, seo-semantic, seo-web-vitals,
simplify, skill-creator, skill-manager, tdd, template-skill, use-style, vps-connect, workflow.
La commande `/save` (`commands/save.md`) a aussi été retirée : l'export des conversations est
automatisé par la tâche planifiée `\ConvIA-Export`, aucun mécanisme `/save` n'est recréé.

Le retrait d'une entrée ici = décision de stack, pas perte : tout est dans l'historique Git.
