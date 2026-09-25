# GENERATION.md — source unique → miroirs par runtime

> 2026-09-25 v1 : le dépôt est la source canonique. Les homes (`~/.codex`,
> `~/.config/opencode`) sont des miroirs déployés, jamais édités comme source.

## Canonique (éditer ici)

| Objet | Fichier canonique |
|---|---|
| Règles du dépôt, routage, catégories | `AGENTS.md`, `ENVIRONMENT-MAP.md`, `SKILLS.md`, `REPARTITION-RUNTIMES.md` |
| Socle OpenCode (+12 agents) | `opencode/AGENTS.md`, `opencode/agents/*.md` |
| Socle Codex (+12 agents) | `codex/AGENTS.md`, `codex/agents/*.toml` |
| Rôles logiques partagés | `ENVIRONMENT-MAP.md` § Spécialistes (12 Codex/OpenCode, 11 AGY) |

## Miroirs (générés/déployés, ne pas diverger à la main)

| Miroir live | Source | Sens |
|---|---|---|
| `~/.config/opencode/AGENTS.md` | `opencode/AGENTS.md` | source → live |
| `~/.config/opencode/agents/*.md` | `opencode/agents/*.md` | source → live |
| `~/.codex/AGENTS.md` | `codex/AGENTS.md` | live fait foi le 2026-09-25 (aligné ce jour) |
| `~/.codex/agents/*.toml` | `codex/agents/*.toml` | source → live (`opus-seconde-passe.toml` déployé le 2026-09-25) |
| `~/.codex/skills/use-browser/SKILL.md` | `codex/skills/use-browser/SKILL.md` | live fait foi (miroir créé ce jour) |

## Adaptations par runtime (pas de copie naïve)

- Agents : fiche logique commune → habillage `.md` (OpenCode, frontmatter riche)
  vs `.toml` Codex (`name/description/model/model_reasoning_effort/developer_instructions`).
- `opus-seconde-passe` côté Codex = réflexion pure sans `opus_think`
  (pas d'outil distant exposé) — voir `codex/agents/opus-seconde-passe.toml`.
- AGY reste à 11 agents (`opus-seconde-passe` non porté — GEMINI/AGY a son propre
  découpage à 7 sous-agents, voir `GEMINI.md`).

## Changements 2026-09-25 (v1)

1. `~/.codex/config.toml` (live, hors dépôt) : prune 11 `[projects.*]` morts
   (datés one-shot, System32, watchy disparu, temp pytest) → 4 conservés
   (home, `codex-with-chatgpt-e2e`, `arion`, `orch-workspaces/e2e`).
   Backup : `~/.codex/config.toml.bak-20260925-projects-prune`.
2. `codex/agents/opus-seconde-passe.toml` créé (12e agent Codex, adapté de
   `opencode/agents/opus-seconde-passe.md`) + déployé en live.
3. `codex/AGENTS.md` aligné sur le live (9 règles, délégation parcimonieuse, RTK).
4. `opencode/AGENTS.md` : bloc Tailscale en dur retiré (live fait foi,
   routing VPN via `vps-sysadmin`).
5. `codex/skills/use-browser/SKILL.md` : miroir du live (comble le trou).
6. `ENVIRONMENT-MAP.md` : 11 → 12 rôles (AGY reste à 11, documenté).
7. `tests/verifier-parite.sh` : 12 attendus Codex/OpenCode, 11 AGY ; 12 agents
   OpenCode via `debug config`.

## Vérifications

```bash
bash configs-backup/tests/verifier-parite.sh
```

Exclusions : jamais `auth.json`, `*.sqlite*`, `.env`, tokens/placeholders
(`VAULT_MCP_TOKEN`, `CONTEXT7_API_KEY`), `node_modules/`, état machine.
Voir `.gitignore` + `AGENTS.md` (pas de push sans périmètre explicite).
