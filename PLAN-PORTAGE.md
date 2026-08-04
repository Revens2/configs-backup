# PLAN-PORTAGE — porter la boucle de plan sur fichier vers AGY et OpenCode

**Source de vérité de l'avancement de cette mission.** Ne pas se fier au contexte d'un agent.
Statut : `[ ]` à faire · `[~]` en cours · `[x]` fait (commité + runtime démarre sans erreur + mesure relevée).

Mission ouverte le **2026-08-04**, suite du chantier « orchestrateur nu / workers spécialisés »
([`RECAPITULATIF.md`](RECAPITULATIF.md), [`PLAN-ARCHI.md`](PLAN-ARCHI.md), [`MESURE-AVANT.md`](MESURE-AVANT.md)).

---

## Étape 0 — Relevé (fait)

### Versions vérifiées ce jour

| Runtime | Version | Commande |
|---|---|---|
| Claude Code CLI | **2.1.220** | `claude --version` |
| AGY (Antigravity) | **1.1.10** | `agy --version` |
| OpenCode | **1.18.3** | `opencode --version` |

Inchangées depuis `PLAN-ARCHI.md` § Étape 0.

### Chemins de config réels

| Runtime | Racines |
|---|---|
| Claude Code CLI + Desktop | `~/.claude/` (CLAUDE.md 7 450 o, RTK.md, settings.json, `agents/`, `skills/`, `hooks/`, `commands/`) · MCP : `~/.mcp.json` (CLI) et `%APPDATA%\Claude\claude_desktop_config.json` (Desktop), **non synchronisés** |
| AGY | `~/.gemini/` (`GEMINI.md` 7 908 o, `settings.json`, `config/mcp_config.json`, `config/plugins/`) · `~/.antigravitycli/` (`mcp/` vide, `skills/`) · `~/.agents/skills/` (racine workspace, lue **aussi** par OpenCode) |
| OpenCode | `~/.config/opencode/` (`opencode.jsonc`, `AGENTS.md` 8 164 o, `agents/` (3), `plugins/`, `skills/`) |

### État git du dépôt à l'ouverture

`C:\Users\Juliann\configs-backup` → `github.com/Revens2/configs-backup`.
**Arbre propre**, branche `main`, **aucun commit non poussé**. HEAD = `1d83a20`.
Visibilité réelle vérifiée par `gh repo view --json visibility` : **PUBLIC** — corrigé en A.4.

### Écarts constatés vs énoncé de la mission

1. **A.1 est déjà à moitié faite.** `~/.claude/CLAUDE.md` porte déjà le contenu corrigé
   (sha256 identique à `gemini.md.next`). Seul `~/.claude/gemini.md` est resté sur l'ancienne
   version — il référence encore `anytype-manager`, `mcp__anytype__*`, `mcp__notebooklm__*`,
   `mcp__obsidian__*`. C'est donc **AGY** qui lit des instructions fausses, pas Claude Code.

---

## PHASE A — Fermer la dette Claude Code

- [x] **A.1 Bascule `gemini.md.next` → `gemini.md`** — fait le 2026-08-04
      critère : `sha256(CLAUDE.md) == sha256(gemini.md)` **et** aucun composant retiré cité
      → **vérifié** : sha256 identiques (`4df16382…`). Seule occurrence restante d'un composant
      retiré = la ligne « Serveurs retirés le 2026-08-04 », qui est la trace du retrait, pas une
      instruction de l'utiliser. La mention `notebooklm login` en exemple d'authentification GUI a
      été remplacée par « authentification d'un CLI tiers » dans les deux fichiers.
      **Écart avec l'énoncé :** `CLAUDE.md` était déjà basculé ; seul `gemini.md` était resté en
      arrière. C'est AGY, pas Claude Code, qui lisait les instructions fausses.
      sauvegardes : `CLAUDE.md.bak.20260804-112xxx`, `gemini.md.bak.avant-corrections`
- [~] **A.2 Tester une compaction réelle** — chaîne validée, compaction réelle **en attente**
      critère : après compaction, l'agent reprend la tâche `[~]` sans qu'on la lui rappelle
      → **fait** : chaîne `PreCompact → STATE.md → SessionStart(source=compact)` rejouée de bout en
      bout avec un payload valide ; `STATE.md` porte bien `déclencheur : PreCompact (auto)`, le
      pointeur `progress.md`, le compteur `0/4` et la tâche `[~]`.
      → **deux défauts corrigés au passage** (§ Correctifs A.2 ci-dessous).
      → **reste à faire** : une vraie compaction. Elle ne se provoque pas en ligne de commande —
      `claude --help` n'expose aucun drapeau de compaction. `autoCompactEnabled: true`, donc elle
      surviendra en session longue ; sinon `/compact` côté utilisateur.
- [x] **A.3 Rappeler S4 à l'utilisateur** — rappel émis dans la réponse du 2026-08-04
      clé `ref.tools` en query string dans `~/.cursor/mcp.json`, vivante. **Action utilisateur.**
- [x] **A.4 Corriger `RECAPITULATIF.md`** : dépôt décrit « privé », il est **public**
      → vérifié par `gh repo view --json visibility` → `PUBLIC`. Corrigé dans `RECAPITULATIF.md`
      (en-tête + ligne S1 du §6) et dans `PLAN-ARCHI.md` § Étape 0.
- [x] **A.5 (hors énoncé, bloquant) — le « −60 % » sur Claude Code n'existe pas**
      critère : contre-mesure reproductible, docs corrigées, règle de mesure inscrite
      → trois relevés `cache_creation + cache_read` du premier tour :
      `deniedMcpServers=[]` → **40 137** · défaut → **40 150** · sans MCP local → **38 863**.
      13 tokens d'écart entre les deux premiers ⇒ **`deniedMcpServers` ne réduit pas le contexte**.
      Le « −24 030 tok » de la veille comparait un relevé à cache froid à un relevé à cache chaud.
      → corrigé dans `RECAPITULATIF.md` (§1, §4, §10, §11), `MESURE-AVANT.md` (encadré + section
      « Contre-mesure »), `~/.claude/CLAUDE.md` et `~/.claude/gemini.md` (règle des trois leviers +
      règle de mesure).

### Correctifs A.2 apportés aux hooks

| Défaut | Correctif | Fichier |
|---|---|---|
| Le pointeur ne reprenait que **l'intitulé** des tâches — sans critère d'acceptation, une reprise à froid ne sait pas quand s'arrêter | `planPointer` lit désormais la tâche **et ses lignes de continuation indentées** ; la 1ʳᵉ non cochée est reprise en entier, les 2 suivantes en titre seul | `~/.claude/hooks/state-lib.mjs` (`.bak.20260804-112220`) |
| L'en-tête réinjecté après compaction ne demandait pas de **reprendre** — il décrivait, sans instruire | En-tête `source === 'compact'` complété : « rouvre le progress.md […] et reprends la tâche marquée `[~]` […] sans attendre qu'on te la rappelle » | `~/.claude/hooks/state-restore.mjs` (`.bak.20260804-112xxx`) |

`node --check` OK sur les trois hooks après patch.

## PHASE B — Portage sur OpenCode

- [~] **B.1 Tester les 3 workers réparés** — **BLOQUÉ, cause externe**
      critère : chacun démarre, utilise un outil, retourne un résultat non vide
      → **impossible aujourd'hui** : OpenCode n'a qu'un seul provider, `vps-ia`
      (`http://100.99.75.104:4002/v1`), et cette machine est **hors ligne**
      (`tailscale status` → « offline, last seen 25m ago » ; `tailscale ping` → 2× timeout).
      `opencode auth list` → **0 credentials** : aucun provider de repli.
      Ce n'est pas un défaut de configuration : le modèle est injoignable, point.
      **Ce qui a pu être vérifié sans modèle** : `opencode agent list` démarre sans erreur et liste
      les 3 workers en `subagent` — la réparation de la veille (`tools:` en objet) tient.
      **Reste à faire, VPS revenu** : une tâche minimale réelle par worker.
- [ ] **B.2 Réparer tout worker en échec** — sans objet tant que B.1 n'a pas tourné
- [x] **B.3 `/plan-run` au format OpenCode** — livré en **commande**, pas en agent
      `~/.config/opencode/command/plan-run.md` (répertoire `command/`, **au singulier**).
      → **vérifié** : `opencode serve` + `GET /command` renvoie bien `plan-run` avec sa description.
      Le format `Command` du SDK (`{name, description?, agent?, model?, template, subtask?}`) a été
      lu dans `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts:1270`.
- [x] **B.4 Persistance : équivalent `PreCompact` — RÉPONSE : OUI, il existe**
      preuve : `node_modules/@opencode-ai/plugin/dist/index.d.ts`, interface `Hooks` —
      `experimental.session.compacting` (l. 283, *« Called before session compaction starts »*,
      `output.context: string[]` ajouté au prompt de compaction) et
      `experimental.compaction.autocontinue` (l. 296, après compaction).
      Plus `experimental.chat.system.transform` (l. 265) qui injecte à **chaque** requête.
      → **le fallback « l'agent réécrit progress.md » n'a pas été nécessaire.**
      Livré : `~/.config/opencode/plugins/plan-pointer.ts`, accroché aux deux hooks.
      → **vérifié en exécution réelle** : `opencode run "ok"` avec `OPENCODE_PLAN_POINTER_TRACE`
      produit `plugin.charge pointeur=oui` puis 4× `chat.system.transform pointeur=oui`.
      → **vérifié au typage** : `npx tsc --strict --noEmit` sur `plugins/*.ts` → exit 0.
      → **non vérifié** : `session.compacting` ne s'est pas déclenché — la session de test est trop
      courte pour compacter. Même limite que côté Claude Code (A.2).
- [x] **B.5 Mesure du contexte OpenCode** — méthode nouvelle, exacte
      La méthode de la veille (`opencode stats`, delta `Avg Tokens/Session`) mélange usage et
      démarrage. Remplacée par une **capture du prompt système réellement assemblé** via le hook
      `experimental.chat.system.transform` : il s'exécute **avant** l'appel API, donc il mesure même
      modèle injoignable. Sonde : `~/.config/opencode/plugins/zz-ctx-probe.ts`, inerte sans la
      variable `OPENCODE_CTX_PROBE_OUT`.

| Mesure OpenCode (cwd `C:\Users\Juliann`) | Caractères | ~tokens |
|---|---:|---:|
| Prompt système assemblé, **sans** les ajouts de la phase B | 28 348 | ~7 090 |
| Prompt système assemblé, **avec** `command/plan-run.md` | **28 348** | ~7 090 |
| Bloc pointeur ajouté par `plan-pointer` à chaque requête | +639 | ~+160 |
| Bloc pointeur ajouté au prompt de compaction | +855 | ~+214 |

**Coût réel de la phase B sur OpenCode : +639 caractères par requête, soit ~+2,3 %.**
La commande `plan-run` elle-même coûte **0** : les commandes ne sont pas injectées dans le prompt
système, seulement les *skills*. La conversion tokens est en caractères/4 — c'est le seul point
approximatif, le comptage de caractères, lui, est exact.

> Un premier relevé donnait un écart de 3 576 caractères. Il était faux : les deux exécutions
> n'étaient pas parties du même répertoire, donc ni le même `AGENTS.md` ni le même bloc `<env>`.
> Refait à `cwd` identique : delta **0**.

## PHASE C — Portage sur AGY

- [ ] **C.1 Acter la boucle mono-agent** (AGY n'a pas de sous-agents — postulat déjà démenti en Phase 5)
      critère : la Skill ne contient aucune instruction de délégation
      cible : orchestrateur
- [ ] **C.2 Implémenter `/plan-run` en Skill AGY**
      critère : la skill apparaît dans le listing d'AGY et se déclenche sur un `progress.md` de test
      cible : orchestrateur
- [ ] **C.3 Persistance : AGY expose-t-il un événement de pré-compaction ?**
      critère : réponse **binaire avec preuve** (`agy hooks`, doc locale, config des hooks existants)
      cible : orchestrateur
- [ ] **C.4 Vérifier `agy plugin enable/disable` sur `obsidian-kit` et `orchestrateur-kit`**
      critère : bascule effective **et** delta de contexte mesuré dans les deux sens
      cible : orchestrateur

## PHASE D — Homogénéisation

- [ ] **D.1 Format unique de `progress.md`** (intitulé · critère vérifiable · cible · statut · erreurs append-only)
      critère : un même `progress.md` est consommé par les 3 runtimes sans adaptation
      cible : orchestrateur
- [ ] **D.2 Tableau porté nativement / émulé / impossible, par runtime**
      critère : les cases « impossible » sont explicites et justifiées
      cible : orchestrateur
- [ ] **D.3 Mesure finale des 3 runtimes**, comparée à `MESURE-AVANT.md`
      critère : 3 chiffres relevés, méthode citée
      cible : orchestrateur

---

## Mesures relevées

**Métrique : `cache_creation_input_tokens` + `cache_read_input_tokens` du premier tour.**
Lire `cache_creation` seul fait passer un préfixe caché pour un gain — c'est l'erreur A.5.

| Runtime | Référence antérieure | Relevé du 2026-08-04 | Méthode |
|---|---:|---:|---|
| Claude Code | 16 021 tok *(faux — cache_creation seul)* | **40 150 tok** | `claude -p "ok" --output-format json`, 1ᵉʳ événement `assistant`, `cc + cr` |
| AGY | 9 303 tok | *non mesuré* | `agy -p "ok" --output-format json` |
| OpenCode | ~12 800 tok | *non mesuré* | `opencode stats` |

Variantes Claude Code relevées le 2026-08-04 :

| Configuration | `cache_creation` | `cache_read` | **TOTAL** |
|---|---:|---:|---:|
| `--settings '{"deniedMcpServers":[]}'` | 15 861 | 24 276 | **40 137** |
| défaut (2 connecteurs refusés) | 15 874 | 24 276 | **40 150** |
| `--strict-mcp-config --mcp-config '{"mcpServers":{}}'` | 14 587 | 24 276 | **38 863** |

## Décisions

- `progress.md` reste la **seule** source d'état d'exécution. `PLAN-PORTAGE.md` est le suivi de
  mission versionné ; `~/progress.md` en est le miroir opérationnel lu par les hooks.
- Aucune affirmation de gain sans relevé. Une estimation n'est pas un résultat.

## Erreurs (append-only — ne jamais purger)

- 2026-08-04 B.1 : `vps-ia` (100.99.75.104) **hors ligne** — `tailscale status` « offline, last seen
  25m ago », `tailscale ping` 2× timeout. Le pair est déclaré hors ligne par le coordinateur :
  changer de compte Tailscale ou de clé SSH n'y changerait rien, et boucler risque un blacklistage.
  → Ne pas rejouer avant que la machine soit revenue. `opencode auth list` = 0 credentials, donc
  aucun modèle de repli local : les workers ne peuvent pas être testés autrement.
- 2026-08-04 B.5 : première mesure différentielle faussée — les deux exécutions d'`opencode run`
  ne partaient pas du même répertoire (l'une depuis `~/.config/opencode`), ce qui change le bloc
  `<env>` et le `AGENTS.md` chargé. Delta annoncé 3 576 car, réel 0.
  → Toujours fixer `cwd` explicitement avant les deux branches d'un différentiel.
- 2026-08-04 A.2 : `state-save.mjs` alimenté par un `echo` de JSON depuis bash → les antislashs de
  `"C:\Users\..."` sont mangés par les couches de quoting, `JSON.parse` échoue, le hook retombe
  silencieusement sur `process.cwd()` et affiche `déclencheur : manuel`. Ce n'est pas un bug du hook.
  → Passer les charges utiles de test **par un fichier**, jamais par `echo`.
- 2026-08-04 (harnais de test) : `fs.existsSync('C:\\Users\\…')` renvoie `false` dans un
  `node -e` lancé depuis bash, alors que la même vérification en `C:/Users/…` renvoie `true`.
  Artefact de quoting, pas un défaut du code testé.
  → Dans les harnais de test, écrire les chemins Windows avec des barres obliques.
