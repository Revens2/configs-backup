---
name: config-sync
description: "Compare la config agentique active (~/.claude, ~/.agents, ~/.config/opencode, ~/.mcp.json) au dépôt configs-backup et aux trois runtimes, et signale ce qui n'est versionné nulle part. Utiliser après toute modification d'un CLAUDE.md, d'un skill, d'un sous-agent, d'un hook ou d'un settings.json, et avant tout commit de configs-backup."
---

# config-sync — aligner la config active et `configs-backup`

## Pourquoi

La modification se fait toujours dans la config **active**, jamais répercutée dans le dépôt.
Résultat mesuré au 2026-09-01 : 35 skills et 6 sous-agents actifs versionnés nulle part côté
Claude Code — dont `docs-fetcher`, que `~/.claude/CLAUDE.md` désigne comme **seul** consommateur
autorisé de Context7. Perdre ce fichier, c'est perdre le confinement MCP.

## Lancer

```bash
node ~/.claude/skills/config-sync/scripts/config-diff.mjs
node ~/.claude/skills/config-sync/scripts/config-diff.mjs --runtime claude
node ~/.claude/skills/config-sync/scripts/config-diff.mjs --json
```

Lecture seule. Exit `0` aligné · `1` des écarts · `2` erreur interne.

## Lire le rapport

| Catégorie | Sens | Action par défaut |
|---|---|---|
| **ACTIF SEULEMENT** | existe en local, absent du dépôt | **Versionner.** C'est du travail non sauvegardé. |
| **DÉPÔT SEULEMENT** | versionné, pas installé | Réinstaller, **ou** retirer du dépôt s'il est mort. C'était le cas de `vps-connect`. |
| **DIVERGENT** | même nom, contenu différent | Arbitrer **sens par sens**. Ne jamais écraser en masse. |
| **FICHIERS DIVERGENTS** | `settings.json`, `CLAUDE.md`, `.mcp.json`… | Idem, et en dernier — ce sont les plus sensibles. |

## Règles

1. **Le script ne copie rien.** La copie est un acte d'arbitrage : le sens de la synchronisation
   dépend de quel côté est le plus récent, et l'outil ne peut pas le savoir.
2. **`git push` interdit** sans demande explicite. Le commit lui-même n'est proposé qu'après
   accord — règle « ne committer et ne pousser que si je le demande ».
3. **Les écarts intentionnels vivent dans `EXCLUSIONS`**, en tête du script, chacun avec son
   pourquoi. Aujourd'hui :
   - `antigravity:agents` — AGY n'embarque volontairement que 2 sous-agents ; les autres rôles
     y sont inlinés en clair, car nommer un agent inexistant fait échouer l'appel côté AGY.
     **Ne pas « corriger » cette asymétrie.**
   - `*:skills-hors-scope` — rangés à part exprès.
4. **Enchaîner sur `harness-doctor`** après synchronisation : son contrôle 8 vérifie que le
   dépôt est propre et commité.

## Périmètre couvert

| Runtime | Répertoires comparés | Fichiers comparés |
|---|---|---|
| Claude Code | `skills`, `agents`, `hooks`, `commands` | `settings.json`, `CLAUDE.md`, `.mcp.json` |
| OpenCode | `skills`, `agents` | `AGENTS.md`, `opencode.jsonc` |
| Antigravity | `skills`, `agents` (exclu) | — |
