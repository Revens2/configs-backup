# Skills AGY hors scope (simplification 2026-09-05)

Le 2026-09-05, les racines de skills AGY ont été réduites aux seuls skills réellement actifs.
Les versions supprimées restent dans l'historique Git du dépôt et dans les archives locales du
poste (voir ci-dessous). Ne pas réimporter en bloc : un skill ne revient qu'à la portée d'un
projet qui en a besoin (`<projet>/.agents/skills/`).

## Racines AGY et état actuel

| Racine | Contenu conservé |
|---|---|
| `~/.agents/skills/` (workspace `C:\Users\Juliann`, lu par AGY) | `shell`, `review`, `loop`, `babysit` |
| `~/.gemini/config/skills/` (global AGY) | `rds` |
| `~/.antigravitycli/skills/` | vide (skills archivés) |
| Plugins AGY | `orchestrateur-kit` (actif, embarque son `plan-run`), `chrome-devtools-plugin` (actif) ; `obsidian-kit` retiré (obsolète, remplacé par `vault-mcp`) |

### Archives locales (2026-09-05)

- `~/.agents/skills-hors-scope-2026-09-05/` — 85 skills précédemment importés en bloc.
- `~/.antigravitycli/skills-hors-scope-2026-09-05/` — anciens skills obsidian/graphique AGY CLI.
- `~/.claude/archives/skills-hors-scope/2026-09-05-simplification/` — skills Claude retirés.

## Remarques

- AGY n'a pas de sous-agents : les définitions de « spécialistes » (`~/.agents/agents/`,
  `~/.gemini/config/agents/`) ont été archivées le 2026-09-05 comme résidus sans chargeur.
- `impeccable` (frontend générique) et les builtins applicatifs (`antigravity_guide`,
  `permissioned-github`) ne sont pas versionnés ici : les builtins sont fournis et mis à jour
  par l'application AGY elle-même.
