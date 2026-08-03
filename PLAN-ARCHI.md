# PLAN-ARCHI — orchestrateur nu / workers spécialisés

**Source de vérité de l'avancement.** Ne pas se fier au contexte d'un agent.
Statut : `[ ]` à faire · `[~]` en cours · `[x]` fait (commité + runtime démarre sans erreur).

---

## Étape 0 — Relevé (fait)

### Versions des runtimes

| Runtime | Version | Commande |
|---|---|---|
| Claude Code CLI | 2.1.220 | `claude --version` |
| Claude Code Desktop | même binaire/config partagée (voir Phase 4) | — |
| AGY CLI (Antigravity) | 1.1.10 | `agy --version` |
| OpenCode | 1.18.3 | `opencode --version` |

### Chemins de config réels

| Runtime | Fichiers |
|---|---|
| Claude Code CLI | `~/.claude/CLAUDE.md` (6 771 o), `~/.claude/RTK.md`, `~/.claude/settings.json` (7 017 o), `~/.claude/settings.local.json` (924 o), `~/.claude/agents/*.md` (6), `~/.claude/skills/*` (63), `~/.claude/commands/*` (1), `~/.claude/hooks/` |
| MCP (partagé CLI) | `~/.mcp.json` |
| Claude Code Desktop | `%APPDATA%\Claude\claude_desktop_config.json` (3 703 o), `config.json` |
| AGY / Antigravity | `~/.antigravitycli/` (`mcp/` **vide**, `skills/`), `~/.gemini/GEMINI.md` (7 908 o), `~/.gemini/settings.json` (266 o), `%APPDATA%\Antigravity\` (état app, pas de config MCP) |
| OpenCode | `~/.config/opencode/opencode.jsonc` (502 o), `AGENTS.md` (8 164 o), `agents/`, `plugins/`, `skills/` |

### Dépôt de backup

`C:\Users\Juliann\configs-backup` → `github.com/Revens2/configs-backup` (**privé**).
État à l'ouverture : **propre** (aucune modification non commitée). HEAD = `41c32b3`.
Structure : `antigravity/` (73 f), `claude-code-cli/` (1 442 f), `claude-code-desktop/` (8 f), `opencode/` (10 f).

### Écarts constatés vs énoncé de la mission

1. **`settings.local.json` n'a pas de BOM** — octets de tête `7B 0D 0A`. Phase 1.3 sans objet.
2. **`permissions.deny` est vide** (`~/.claude/settings.json:51`). Il n'y a donc rien à « vérifier » :
   les deny rules obsidian / obsidian-semantic / anytype / notebooklm sont **à créer**, avec leurs
   miroirs `Bash(...)`.
3. **`TodoWrite` n'existe pas dans ce runtime** (Claude Code Desktop). Le suivi passe par ce fichier
   + les outils `TaskCreate`/`TaskUpdate`.
4. **`~/.antigravitycli/mcp/` est vide** : AGY n'a pas de `mcp_config.json` actif en local ; seul le
   dépôt de backup en contient un (`antigravity/mcp_config.json`). À confirmer en Phase 5.

### Secrets — état

| # | Secret | Emplacement | Versionné ? | Action |
|---|---|---|---|---|
| S1 | Clé API Anytype, **ancienne** (préfixe `PLTV…`) | `antigravity/mcp_config.json:10` au commit **`adb1957`** | **OUI — dans l'historique git** | **À RÉVOQUER** |
| S2 | Clé API Anytype, **courante** (préfixe `FOZy…`) | `~/.mcp.json:59` et `%APPDATA%\Claude\claude_desktop_config.json:59` | Non (les copies du dépôt sont rédigées) | Sortir en variable d'env (Phase 1) |

> Valeurs complètes volontairement absentes de ce fichier : il est versionné.
> Les retrouver si besoin : `git -C configs-backup show adb1957:antigravity/mcp_config.json` (S1),
> `~/.mcp.json` ligne 59 (S2).

Le reste des correspondances du scan sont des placeholders de documentation
(`${API_TOKEN}`, `your-api-key`, `ghp_your_github_token`) — sans objet.

---

## Décisions utilisateur (2026-08-04)

- **Arbitrage : (A) — consommation de tokens / limites d'usage.**
  Conséquences sur le reste du plan : délégation réservée aux tâches à fort volume uniquement
  (recherche web, gros logs, exploration de codebase). L'orchestrateur exécute lui-même les tâches
  moyennes et courtes. On ne crée **aucun worker supplémentaire** au-delà des 6 existants ; on les
  resserre. Priorité absolue au poste MCP (77 % du contexte de démarrage, cf. `MESURE-AVANT.md`).
- **Secret S1 : en attente d'arbitrage.** → **Phase 1 GELÉE. Aucune config modifiée.**

---

## PHASE 1 — Assainissement préalable (bloquante)

- [ ] 1.1 Scan credentials sur les 4 arbres de config (fait pour le dépôt ; à refaire sur les fichiers vivants après modification)
- [ ] 1.2 S1 : purge de l'historique git ou rotation de la clé — **décision utilisateur requise**
- [ ] 1.3 S2 : remplacer par `${ANYTYPE_API_KEY}`, créer `.example` sanitisés, `.gitignore` sur le fichier réel
- [ ] 1.4 ~~BOM `settings.local.json`~~ — sans objet (vérifié : pas de BOM)
- [ ] 1.5 Commit `chore(security): sanitize credentials, add example configs`

## PHASE 2 — Orchestrateur nu (Claude Code CLI)

- [ ] 2.1 `~/.claude/CLAUDE.md` ≤ 6 Ko, règles opérationnelles seules, sécurité/commit conservées intégralement — réplication `gemini.md` obligatoire
- [ ] 2.2 Créer les deny rules (obsidian, obsidian-semantic, anytype, notebooklm) + miroirs `Bash(...)`
- [ ] 2.3 Descendre les skills non universels dans les projets → < 20 skills utilisateur (actuel : **63**)
- [ ] 2.4 Réécrire les 6 workers ~1 200 o chacun, `description` = déclencheur précis, MCP du domaine seulement
- [ ] 2.5 Commit par sous-étape

## PHASE 3 — Boucle de plan sur fichier

- [ ] 3.1 Skill `/plan-run` (lire → décider → valider → cocher)
- [ ] 3.2 Format `progress.md` : intitulé, critère d'acceptation, cible, statut, section erreurs append-only
- [ ] 3.3 Réactiver `SessionStart` + `PreCompact` depuis `hooks_disabled`, en `.mjs` via `node`
- [ ] 3.4 Test de compaction réelle

## PHASE 4 — Claude Code Desktop

- [ ] 4.1 Mêmes deny rules, retrait des MCP de domaine
- [ ] 4.2 Documenter partagé vs séparé avec preuve (fichier + chemin)

## PHASE 5 — AGY CLI

- [ ] 5.1 Agent orchestrateur qui instancie ses propres workers
- [ ] 5.2 Confiner chaque MCP à son worker dans `mcp_config.json`
- [ ] 5.3 Documenter la répartition AGY (orchestration multi-niveaux) vs Claude Code (implémentation fine)

## PHASE 6 — OpenCode

- [ ] 6.1 Règles de permission `task` en `deny` (retire le sous-agent de la description de l'outil Task)
- [ ] 6.2 Aligner les 3 workers sur les définitions Claude Code, corriger les noms d'outils MCP
- [ ] 6.3 Nesting 2 niveaux max

## PHASE 7 — Mesure

- [x] 7.1a Mesure **AVANT** — `MESURE-AVANT.md` (2026-08-04, avant toute modification)
- [ ] 7.1b Fiabiliser le poste MCP par relevé réel (`/context`) au lieu de l'estimation
- [ ] 7.2 Mesure **APRÈS** + écriture du delta dans le dépôt

---

## Erreurs rencontrées (append-only)

_(vide)_
