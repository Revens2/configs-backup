---
name: harness-doctor
description: "Vérifie l'intégrité du harness agentique : lien CLAUDE.md/AGENTS.md, hooks orphelins, skills prescrits mais absents, progress.md de mission close à la racine du home, résidus .bak et gemini.md, dérive entre la config active et configs-backup, serveurs MCP non documentés, doublons entre les deux magasins de skills. Utiliser sur « audit du harness », « vérifie ma config », après toute modification de skill/hook/agent, et avant tout commit de configs-backup."
---

# harness-doctor — audit d'intégrité du harness

## Principe

**Lecture seule.** Le script rapporte, il ne corrige jamais. Un doctor qui répare est un doctor
qu'on n'ose plus lancer : la correction se fait à la main, sur rapport, en connaissance de cause.

Il existe parce que l'audit manuel du 2026-08-28 n'a pas tenu — la moitié des dérives corrigées
ce jour-là étaient revenues au 2026-09-01. Une correction non outillée ne tient pas.

## Lancer

```bash
node ~/.claude/skills/harness-doctor/scripts/harness-doctor.mjs
node ~/.claude/skills/harness-doctor/scripts/harness-doctor.mjs --json   # pour un traitement
node ~/.claude/skills/harness-doctor/scripts/harness-doctor.mjs --home /autre/racine
```

Node stdlib uniquement, aucune dépendance. Sortie : `0` tout vert · `1` au moins un échec ·
`2` erreur interne.

## Les 10 contrôles

| # | Contrôle | Dérive visée |
|---|---|---|
| 1 | `CLAUDE.md` ⇄ `AGENTS.md` sont le même fichier (lien ou inode) | Deux fichiers divergents, règle « un seul fichier, deux noms » rompue |
| 2 | Chaque `command:` de `settings.json.hooks` pointe sur un fichier existant | Hook cassé, silencieux |
| 3 | Aucun script orphelin dans `.claude/hooks` | Scripts morts qui font croire à un comportement actif |
| 4 | Tout skill prescrit par un `CLAUDE.md` est installé | Le cas `vps-connect` : la doc prescrit un skill absent |
| 5 | Tout `scripts/*` cité dans un `SKILL.md` existe | Le cas `ensure-netbird.ps1` : script jamais écrit |
| 6 | Pas de `progress.md`/`plan.md` à la racine du home | Réinjecté par `SessionStart` dans **toutes** les sessions |
| 7 | Aucun résidu `.bak` ni `gemini.md` égaré | Encombrement, fichiers de sauvegarde à côté d'un lien |
| 8 | `configs-backup` propre et commité | Config active non versionnée |
| 9 | Serveurs `.mcp.json` ⇄ liste documentée dans `~/.claude/CLAUDE.md` | Serveurs ajoutés sans être documentés |
| 10 | Aucun skill en copie réelle dans les deux magasins | Deux versions qui divergent |

## Lire le rapport

- **FAIL** appelle une correction manuelle. Le détail nomme le fichier exact.
- **SKIP** = contrôle non évaluable (chemin absent). Ce n'est pas un succès.
- Le contrôle 8 échoue légitimement pendant une session de travail sur la config : il devient
  vert au commit.

## Exclusions volontaires

- `~/.gemini/GEMINI.md` n'est **pas** un résidu : c'est le fichier d'instructions actif du
  runtime Gemini/AGY.
- `.claude/backups/` et `.claude/state/archive-*` sont les destinations d'archivage : y trouver
  un `.bak` ou un `gemini.md` est le comportement voulu.
- Le contrôle 5 ne regarde que `scripts/`. Les `references/` sont couramment citées en exemple
  pédagogique dans un `SKILL.md` (`skill-creator`, `graphify`) et noieraient le signal.
- Contrôle 10 : `caveman`, `graphify` et `impeccable` divergent volontairement entre les deux
  magasins. Ils restent signalés tant que l'arbitrage n'est pas rendu.
