# Répartition des tâches entre runtimes

Écrit le 2026-08-04, phase 5.3. Fondé sur ce que chaque runtime **sait faire**, vérifié binaire en
main, pas sur ce qu'on lui prête.

## Capacités réelles

| | Claude Code | AGY (Antigravity 1.1.10) | OpenCode 1.18.3 |
|---|---|---|---|
| Sous-agents | **oui** (`~/.claude/agents/*.md`) | **non** | oui |
| MCP par sous-agent | non | — | non |
| MCP par plugin activable | non | **oui** | non |
| Retirer un sous-agent du contexte | non | — | **oui** (`task` deny) |
| Nesting | 1 niveau | — | 2 niveaux |
| Contexte de démarrage **mesuré** | **16 021 tok** | **9 303 tok** | **~12 800 tok** |

> Chiffres au 2026-08-04 après triage de `~/.agents/skills/` (16 skills sortis, −12 212 tok sur AGY,
> −2 000 sur OpenCode). Avant ce triage : AGY 21 517, OpenCode ~14 800.
> **AGY est bien le plus léger — mais seulement une fois `.agents/` dégraissé.**

### Correction : AGY n'est pas le runtime le plus léger

Les chiffres ci-dessus sont des relevés réels, pas des estimations tirées des tailles de fichiers.
`agy -p … --output-format json` renvoie `usage.input_tokens = 21 530`. Ma première estimation
(~2 000 tok, déduite de `GEMINI.md` + `settings.json`) était fausse d'un facteur 10 : elle ignorait
le prompt système d'Antigravity et ses outils intégrés, exactement l'erreur que j'avais commise sur
Claude Code.

**Après coupure des connecteurs claude.ai, Claude Code démarre plus léger qu'AGY** — 16 021 contre
21 530. L'argument « AGY est le runtime le plus léger » tombe. Ce qui reste vrai d'AGY, c'est le
confinement MCP par plugin ; ce n'est pas un argument de contexte de départ.

### OpenCode : mesuré après réparation d'un second bug

Première tentative : réponses vides. Cause trouvée par `GET :4002/v1/models` — la gateway expose le
modèle sous l'id **`qwen-3.6-35b-moe`**, alors que `opencode.jsonc` demandait `Qwen 3.6 35b MoE`,
identifiant qui n'existe que sur `:8000` (llama.cpp direct, sans le sanitizer de tool-calls). La clé
d'un modèle dans la config **est** l'id envoyé à l'API : elle ne correspondait à rien, d'où le
silence. Corrigé, OpenCode répond.

Mesure obtenue par delta sur `opencode stats` : 6 sessions × 489,2 K → 8 sessions × 369,2 K, soit
**~14 800 tokens** pour la session minimale. Cohérent avec la médiane affichée (16,1 K).

**Classement final : OpenCode ~14 800 < Claude Code 16 021 < AGY 21 530.**

### Correction d'un postulat de la mission

L'énoncé affirmait : « AGY gère nativement les sous-agents dynamiques et le nesting, contrairement à
Claude Code. C'est donc lui qui porte l'orchestration profonde. » **C'est faux pour ce build.**

Les types de customisation d'Antigravity sont **Rules, Skills, Plugins, Hooks, MCP Servers** — il n'y
a pas de sous-agents (source : skill intégré `agy-customizations`, `~/.gemini/config/` comme racine
globale). Le dossier `antigravity/subagents/` du dépôt et le skill `create-subagent` (qui documente
`.cursor/agents/`) sont des **résidus de lignée Cursor**, pas des fonctionnalités d'Antigravity.
`agy agents` renvoie une liste vide, y compris après dépôt d'un fichier d'agent aux deux emplacements
candidats.

Le runtime qui a réellement des sous-agents, c'est **Claude Code**. Celui qui sait réellement confiner
un MCP, c'est **AGY — par plugin**. Ce ne sont pas les mêmes leviers, et aucun runtime n'a les deux.

## Répartition retenue

**Claude Code — implémentation fine et travail multi-étapes.**
C'est le seul à avoir des sous-agents. Il porte les 5 workers et le skill `/plan-run`.
MCP racine réduit à `codegraph`, `github`, `obsidian-semantic` ; les autres se déclarent dans le
`.mcp.json` du projet qui en a besoin.

**AGY — quand il faut un MCP de domaine sans le payer partout.**
21 530 tok au démarrage, aucun MCP global actif. Les serveurs de domaine sont packagés en plugins
**désactivés par défaut** :

```bash
agy plugin list
agy plugin enable obsidian-kit      # charge le MCP obsidian, le temps du besoin
agy plugin enable orchestrateur-kit # charge la règle de conduite de travail long
```

C'est la seule confinement per-domaine réel de tout le parc. À privilégier pour : balayage de gros
volumes, tâches longues répétitives, tout ce qui n'a pas besoin de déléguer.

**OpenCode — quand il faut du nesting.**
Deux niveaux, et le seul à pouvoir **retirer un sous-agent du contexte** via les règles de permission
`task` en `deny` (le sous-agent disparaît de la description de l'outil Task). Modèle local
`Qwen 3.6 35B MoE` sur `100.99.75.104:4002`, fenêtre 98 304 tokens — coût marginal nul, donc le
runtime naturel pour ce qui est volumineux mais peu exigeant en raisonnement.

## Règle de décision

1. Besoin de déléguer à un spécialiste → **Claude Code**.
2. Besoin d'un MCP de domaine sans le payer partout → **AGY**, plugin activé le temps du besoin.
3. Besoin d'imbriquer des agents, ou volume énorme sur modèle local → **OpenCode**
   (nécessite Tailscale actif et le VPS `100.99.75.104` en ligne).
4. Sinon → Claude Code : le mieux outillé **et**, depuis la coupure des connecteurs, le plus léger.
