# La boucle de plan sur fichier, portée sur trois runtimes

Référence produite le **2026-08-04**. Suivi de mission : [`PLAN-PORTAGE.md`](PLAN-PORTAGE.md).
Runtimes : Claude Code 2.1.220 (CLI + Desktop) · AGY / Antigravity 1.1.10 · OpenCode 1.18.3.

Le principe est le même partout : **`progress.md` est la source de vérité de l'avancement, pas le
contexte de l'agent.** Un fichier ne se compacte pas et survit à un crash. Ce qui change d'un
runtime à l'autre, c'est uniquement *comment* le pointeur vers ce fichier traverse une compaction.

---

## 1. Format unique de `progress.md`

Un seul format, lu à l'identique par les trois runtimes.

```markdown
# <objectif en une ligne>
_maj <AAAA-MM-JJ> · arbitrage : (A) tokens_

## Tâches
- [x] **1. <intitulé>**
      critère : <vérifiable — commande de test, fichier qui existe, service qui répond>
      cible : orchestrateur
- [~] **2. <intitulé>**
      critère : …
      cible : <worker> | orchestrateur
- [ ] **3. <intitulé>**
      critère : …
      cible : …

## Décisions
- <arbitrage tranché, pour ne pas le rejouer>

## Erreurs (append-only — ne jamais purger)
- <date> tâche N : <message exact> → <ce qui a été tenté> → <ce qu'il ne faut plus refaire>
```

### Les cinq règles de forme, et pourquoi

| Règle | Raison |
|---|---|
| Une tâche = **une** ligne cochable `- [ ]` / `- [~]` / `- [x]` | C'est ce que les trois lecteurs cherchent en `^\s*[-*]\s*\[[ x~]\]`. Une tâche sur deux lignes cochables se compte double. |
| `critère :` et `cible :` **indentés sous** la ligne cochable | Les trois lecteurs remontent les lignes de continuation indentées et les rattachent à la tâche. Non indentées, elles sont perdues à la compaction. |
| Le critère est **vérifiable par un tiers** | « ça marche » n'est pas un critère. Une commande, un fichier, un code de retour. |
| `[~]` = en cours, jamais `[x]` sans vérification | Le pointeur reprend la **première** tâche non cochée : c'est elle qui redémarre après compaction. |
| Section `Erreurs` **append-only** | La purger fait rejouer les mêmes échecs — c'est arrivé trois fois sur ce chantier. |

### Vérifié

Les trois implémentations ont été exécutées sur le **même** fichier de test (3 tâches, la 1ʳᵉ
cochée, la 2ᵉ en cours). Résultat identique dans les trois cas : `1/3 cochées`, tâche 2 restituée
**avec son critère et sa cible**, tâche 3 annoncée comme suivante. Seul l'habillage du message
diffère.

---

## 2. Ce qui est porté nativement, émulé, ou impossible

| Capacité | Claude Code | AGY 1.1.10 | OpenCode 1.18.3 |
|---|---|---|---|
| **Sous-agents / délégation** | **natif** — `Task`, 5 workers | **IMPOSSIBLE** — les types de customisation sont Rules, Skills, Plugins, Hooks, MCP. `agy agents` renvoie vide. | **natif** — `task`, 3 workers |
| **Retirer un sous-agent du contexte** | **IMPOSSIBLE** — `tools:` ne fait que filtrer une liste déjà chargée | sans objet | **natif** — `permission.task: deny` |
| **Nesting** | 1 niveau (un worker ne peut pas déléguer) | sans objet | 2 niveaux max, plafond injecté par défaut |
| **Hook de pré-compaction** | **natif** — `PreCompact` | **IMPOSSIBLE** — les 5 événements sont `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop` | **natif** — `experimental.session.compacting` |
| **Réinjection après compaction** | **natif** — `SessionStart` matcher `compact` | **émulé** — `PreInvocation` réécrit le pointeur à chaque tour | **natif** — `experimental.compaction.autocontinue`, plus `experimental.chat.system.transform` à chaque requête |
| **Forme de `/plan-run`** | Skill (`~/.claude/skills/plan-run/`) | Skill de plugin (`orchestrateur-kit/skills/plan-run/`) | Commande (`~/.config/opencode/command/plan-run.md`) |
| **Confinement d'un MCP** | **IMPOSSIBLE** par sous-agent ; seule la portée projet (`.mcp.json`) marche | **natif** — par plugin, `agy plugin enable/disable` — **mais non vérifié par la mesure**, voir §4 | par config de projet |
| **Activation/désactivation à chaud d'un bundle** | plugins | **natif** — renommage `plugin.json` ↔ `plugin.json.disabled` | — |
| **Mesure du contexte de démarrage** | `claude -p --output-format json`, `cache_creation + cache_read` | `agy -p --output-format json`, `input_tokens + cache_read_tokens` | **aucun compteur de tokens** — capture du prompt système par hook, mesure en caractères |

### Quatre pièges d'OpenCode, découverts en testant

- **`opencode run --command <nom>` se bloque au démarrage.** Le journal s'arrête sur `init` : aucune
  session, aucun appel au modèle, stdout vide, mort au timeout. Les deux voies qui marchent sont la
  **TUI** et la route API `POST /session/{id}/command` avec
  `{"command":"<nom>","arguments":"…"}` — c'est ainsi que la boucle `plan-run` a été validée.
- **`opencode run "/nom …"` n'expande pas la commande.** Le `/nom` arrive au modèle comme du texte.
  Sur l'essai, il a confondu `/plan-run` avec le skill `loop` et annoncé une exécution « toutes les
  5 minutes » sans rien faire. Une commande ne s'invoque pas par le message.

- **`opencode run --agent <sous-agent>` ne fait pas ce qu'on croit.** Il avertit
  `is a subagent, not a primary agent. Falling back to default agent` et exécute la tâche avec
  l'agent par défaut. Un sous-agent ne s'invoque **que** par l'outil `task`, depuis un agent
  primaire. Pour le tester en ligne de commande, demander explicitement la délégation.
- **En headless, une permission `ask` suspend le sous-agent jusqu'au timeout.** Il n'y a personne
  pour répondre. Un worker dont le terrain de travail est hors du projet a besoin d'une règle
  `external_directory: allow` **scopée à son répertoire**, dans son propre frontmatter :

  ```yaml
  permission:
    external_directory:
      "G:/Mon Drive/**": allow
  ```

  La forme carte-de-motifs n'apparaît pas dans le type généré du SDK, mais le runtime l'accepte —
  `opencode agent list` restitue les règles. Penser au **répertoire parent** : sans lui, le worker
  bute dès qu'il remonte d'un cran pour vérifier l'existence de sa cible.

### Les cases « impossible », en clair

- **Ne jamais demander de sous-agents à AGY.** Il n'en a pas. Le `subagents/` du dépôt de backup et
  le skill `create-subagent` sont des résidus de lignée Cursor. Sur AGY, le volume se traite en
  écrivant la sortie brute dans un fichier et en ne relisant que l'extrait.
- **Ne jamais compter sur `tools:` pour alléger un sous-agent Claude Code.** La liste d'outils est
  déjà chargée ; `tools:` filtre l'usage, pas le contexte.
- **Ne jamais attendre un `PreCompact` d'AGY.** Il n'existe pas, et aucune version de ce build ne
  l'expose. `PreInvocation` est le seul relais, au prix d'une réécriture à chaque tour.

---

## 3. Où vit chaque pièce

| Runtime | Boucle | Persistance |
|---|---|---|
| Claude Code | `~/.claude/skills/plan-run/SKILL.md` | `~/.claude/hooks/state-save.mjs` (`PreCompact`, `SessionEnd`) → `~/.claude/state/<projet>/STATE.md` → `state-restore.mjs` (`SessionStart`, matchers `startup\|resume\|compact`) |
| AGY | `~/.gemini/config/plugins/orchestrateur-kit/skills/plan-run/SKILL.md` | `orchestrateur-kit/hooks.json` → `plan-pointer-hook.mjs` (`PreInvocation`, `ephemeralMessage`) |
| OpenCode | `~/.config/opencode/command/plan-run.md` | `~/.config/opencode/plugins/plan-pointer.ts` (`experimental.session.compacting` + `experimental.chat.system.transform`) |

---

## 4. Mesures finales

**Métrique : le total envoyé au modèle.** Ne lire que la part non cachée fait passer un préfixe déjà
en cache pour un gain — c'est l'erreur qui a produit les « −60 % » et « −57 % » de
`RECAPITULATIF.md`, tous deux réfutés le 2026-08-04.

| Runtime | Contexte de démarrage | Méthode | Coût ajouté par la boucle |
|---|---:|---|---:|
| **Claude Code** | **~40 150 tok** | `cache_creation + cache_read`, 1ᵉʳ tour | pointeur écrit dans `STATE.md`, hors prompt tant qu'il n'y a pas compaction |
| **AGY** | **~21 520 tok** | `input_tokens + cache_read_tokens` | **+292 tok** statiques (`orchestrateur-kit`) **+161 tok** par invocation |
| **OpenCode** | **28 348 caractères** de prompt système | capture par `experimental.chat.system.transform` | **+639 car** par requête ; la commande `plan-run` coûte **0** |

### Comparaison avec `MESURE-AVANT.md`

Elle n'est **pas possible**, et le dire est plus utile que de fabriquer un pourcentage :

- `MESURE-AVANT.md` estimait par taille de fichiers (`tokens ≈ octets / 4`), en ignorant le prompt
  système et les outils intégrés du runtime. Il donnait AGY à ~2 000 tok ; le réel est **dix fois**
  plus. Il donnait Claude Code à ~50 400 ; le réel est ~40 150. Deux méthodes, deux échelles.
- Le seul « avant » en unités réelles date d'**après** les phases 1 à 6 du chantier précédent. Il
  n'existe aucun relevé réel de l'état initial. Toute variation annoncée entre les deux serait un
  artefact de méthode.

**Conclusion honnête : aucun gain de contexte n'est démontré sur aucun des trois runtimes.** Ce qui
est acquis est ailleurs — deux bugs OpenCode réparés, une clé révoquée et purgée de trois
emplacements, quatre serveurs MCP morts retirés, et la boucle de plan sur fichier effectivement
portée et vérifiée sur les trois.

### Non mesuré, et pourquoi

- ~~Les 3 workers OpenCode n'ont jamais tourné.~~ **Fait le 2026-08-04**, VPS rallumé. Les trois
  démarrent, utilisent leurs outils et rendent un résultat non vide. `obsidian-context-retriever`
  était cassé et a été réparé — détail en [`PLAN-PORTAGE.md`](PLAN-PORTAGE.md) B.2.
- **Le confinement MCP d'AGY.** `obsidian-kit` porte `mcpvault.cmd "G:\Mon Drive\Obsidian Vault"` ;
  `G:` n'est pas monté, le serveur ne démarre pas, ses outils ne sont jamais chargés. Activer ou
  désactiver le kit change le contexte de 3 tokens — ce qui ne mesure rien. La thèse « AGY est le
  seul du parc à confiner réellement un MCP » reste **plausible et non vérifiée**.
- **Une compaction réelle**, sur aucun des trois. Les chaînes sont vérifiées de bout en bout par
  exécution directe des hooks et par trace en exécution réelle ; l'événement lui-même ne se provoque
  pas en ligne de commande.
