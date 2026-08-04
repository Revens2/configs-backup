# Skills AGY hors scope

Déplacés ici le 2026-08-04. Ils venaient de `~/.agents/skills/`, la racine de customisation
**workspace** d'Antigravity pour `C:\Users\Juliann` — lue par **AGY et par OpenCode**.

## Pourquoi

Mesure différentielle sur AGY (`agy -p "ok" --output-format json`, lecture de `usage.input_tokens`) :

| État | Contexte |
|---|---:|
| `.agents/` présent, 20 skills | 21 517 tok |
| `.agents/` renommé (absent) | 9 305 tok |
| **après triage, 4 skills gardés** | **9 303 tok** |

`.agents/` coûtait **12 212 tokens, 57 % du contexte de démarrage d'AGY**. Les 16 skills sortis
représentaient la totalité de ce coût : les 4 conservés ne pèsent rien de mesurable.

## Conservés dans `~/.agents/skills/`

`shell` · `review` · `babysit` · `loop` — génériques et peu coûteux.

## Blocs sortis

| Bloc | Skills | Raison |
|---|---|---|
| `doublons` | `caveman`, `graphify` | présents ailleurs : `caveman` dans `~/.claude/skills` et `~/.config/opencode/skills` ; `graphify` dans `~/.claude/skills` et `~/.antigravitycli/skills`. Le log OpenCode les signalait en « duplicate skill name ». |
| `meta-agy` | `create-hook`, `create-rule`, `create-skill`, `create-subagent`, `migrate-to-skills`, `statusline`, `update-cli-config`, `update-cursor-settings`, `sdk` | ne servent qu'à modifier AGY lui-même |
| `flux-dev` | `review-bugbot`, `review-security`, `split-to-prs`, `deploy` | flux de code, portée projet |
| `ui` | `canvas` | 84 Ko, ne sert qu'à construire des UI canvas |

## Remettre un skill en service

Dans le projet qui en a besoin — portée correcte :

```bash
mkdir -p <projet>/.agents/skills && cp -r ~/.agents-hors-scope/<bloc>/<skill> <projet>/.agents/skills/
```

Au niveau du workspace personnel malgré tout :

```bash
mv ~/.agents-hors-scope/<bloc>/<skill> ~/.agents/skills/
```

## Note sur `create-subagent`

Ce skill documente `.cursor/agents/` — un emplacement de **Cursor**. Antigravity n'a pas de
sous-agents : ses types de customisation sont Rules, Skills, Plugins, Hooks, MCP. C'est un résidu de
lignée, sans usage sur ce runtime.
