# Skills hors scope utilisateur

Déplacés ici le 2026-08-04 (Phase 2.3 de `configs-backup/PLAN-ARCHI.md`).

Claude Code ne charge que `~/.claude/skills/`. Ce dossier n'est **pas** lu : ces skills ne coûtent
plus rien au démarrage, et restent intacts et immédiatement redéployables.

## Remettre un skill en service

Dans le projet qui en a besoin — c'est la portée correcte, pas le niveau utilisateur :

```bash
mkdir -p <projet>/.claude/skills && cp -r ~/.claude/skills-hors-scope/<bloc>/<skill> <projet>/.claude/skills/
```

Pour le remettre au niveau utilisateur malgré tout (il repèsera sur toutes les sessions) :

```bash
mv ~/.claude/skills-hors-scope/<bloc>/<skill> ~/.claude/skills/
```

## Blocs

| Bloc | Skills | Destination naturelle |
|---|---:|---|
| `outillage-dev` | 14 | le projet de dev concerné |
| `front-ui` | 10 | projets front |
| `ckm-claudekit` | 7 | bundle claudekit autonome — aucun projet CKM sur la machine |
| `bureautique` | 6 | à déposer là où on produit des documents |
| `metier` | 6 | fiscaliste, notaire, syndic, comptable, commissaire-aux-comptes, controleur-fiscal |
| `obsidian` | 4 | **à déposer dans `<vault>/.claude/skills/`** — non fait : `G:` n'était pas monté |

## Notes

- `frontend-design` n'est pas ici : il était un vrai doublon du plugin
  `frontend-design@claude-plugins-official`, retiré vers `~/.claude/skills-retires-20260803/`.
- `notebooklm` et `notebooklm-py` sont dans `outillage-dev` : leur MCP a été retiré des runtimes le
  2026-08-04, ces skills ne sont plus opérants sans le réinstaller dans un `.mcp.json` de projet.
