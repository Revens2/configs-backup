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

- [x] **C.1 Boucle mono-agent actée**
      La Skill livrée ne contient aucune instruction de délégation ; elle dit explicitement
      « ne cherche pas à déléguer, il n'y a personne », et remplace le critère bruit/conclusion par
      sa version mono-agent : **écrire la sortie brute dans un fichier, ne relire que l'extrait**.
- [x] **C.2 `/plan-run` en Skill AGY**
      `~/.gemini/config/plugins/orchestrateur-kit/skills/plan-run/SKILL.md`
      → **vérifié** : `agy plugin validate ~/.gemini/config/plugins/orchestrateur-kit` →
      `[ok]  ✔ skills : 1 processed  ✔ hooks : 1 processed`.
- [x] **C.3 Pré-compaction AGY — RÉPONSE : NON, aucun événement**
      preuve : `~/.gemini/antigravity-cli/builtin/skills/agy-customizations/docs/hooks.md`,
      § « Supported Event Types » — la liste **complète** est `PreToolUse`, `PostToolUse`,
      `PreInvocation`, `PostInvocation`, `Stop`. Rien sur la compaction.
      Il n'existe pas non plus de sous-commande `agy hooks` : `agy --help` liste
      `agent(s)`, `changelog`, `help`, `install`, `models`, `plugin(s)`, `update`. Les hooks se
      déclarent dans un `hooks.json` déposé à une racine de customisation, ou dans un plugin.
      **Relais retenu, meilleur que le fallback prévu** : `PreInvocation`, qui accepte un
      `ephemeralMessage` injecté **avant chaque appel au modèle**. Au lieu de sauvegarder l'état
      avant la perte, on le réécrit à chaque tour — une compaction ne peut pas faire perdre la ligne
      en cours. Le message est éphémère, il ne s'accumule pas dans l'historique.
      Livré : `plugins/orchestrateur-kit/hooks.json` + `plan-pointer-hook.mjs`.
      → **vérifié en exécution réelle** : `agy -p "ok"` avec `AGY_PLAN_POINTER_TRACE` écrit
      `PreInvocation racines=C:\Users\Juliann pointeur=oui`. Le pointeur mesure **643 car (~161 tok)**.
      → **effet de bord constaté** : le pointeur fonctionne assez bien pour que le modèle tente
      aussitôt de lire `progress.md` — ce que le mode headless refuse faute de règle
      `permissions.allow: read_file`. En session interactive, c'est le comportement voulu.
- [x] **C.4 `agy plugin enable/disable` — fonctionne, y compris sur les plugins auto-découverts**
      → **`agy plugin list` ment** : il affiche « No imported plugins » alors que les deux kits de
      `~/.gemini/config/plugins/` sont bien chargés. Il ne liste que les plugins *importés*
      (`agy plugin import/install`), pas ceux découverts dans une racine de customisation.
      → **la bascule est réelle**, prouvée par le déclenchement du hook et non par ce listing :
      après `disable`, aucune trace ; après `enable`, trace présente.
      → **mécanisme trouvé** : aucun `plugins.json` n'est écrit. `agy plugin disable <nom>` **renomme
      le manifeste** `plugin.json` → `plugin.json.disabled` dans le répertoire du plugin ; `enable`
      fait l'inverse. C'est donc versionnable, inspectable, et réversible à la main.
      État laissé en fin de mission : `orchestrateur-kit` **activé**, `obsidian-kit` **désactivé**.
      → **les plugins ne sont pas exclusifs** : les deux kits actifs en même temps, le hook
      d'`orchestrateur-kit` se déclenche quand même.

### Mesures AGY — et deuxième artefact de cache, identique au premier

**Métrique corrigée pour AGY : `usage.input_tokens` + `usage.cache_read_tokens`.** Le total est
stable quel que soit l'état du cache ; `input_tokens` seul ne l'est pas.

Preuve, quatre exécutions consécutives, **configuration strictement identique** :

| Exécution | `input_tokens` | `cache_read_tokens` | **TOTAL** |
|---|---:|---:|---:|
| 1ʳᵉ (cache froid) | 21 519 | 0 | **21 519** |
| 2ᵉ | 9 302 | 12 217 | **21 519** |
| 3ᵉ | 9 307 | 12 217 | **21 524** |
| 4ᵉ | 9 304 | 12 217 | **21 521** |

`input_tokens` passe de 21 519 à 9 303 **sans qu'aucun fichier ne change**. C'est exactement le
chiffre annoncé comme « gain du triage de `~/.agents/skills/` » dans `RECAPITULATIF.md` §11.

Différentiel `.agents/`, refait sur les totaux :

| État de `~/.agents/` | **TOTAL** |
|---|---:|
| absent | 21 520 |
| 1 skill vide | 21 524 |
| `rules/` seul | 21 524 |
| `skills/` seuls (4) | 21 522 |
| complet (rules + 4 skills) | 21 519 |

**Écart maximal : 5 tokens.** `~/.agents/` ne coûte rien. Le « −57 % sur AGY » et les « 12 212
tokens rendus » de `RECAPITULATIF.md` §11 sont **le même artefact de cache** que le « −60 % » de
Claude Code : un relevé froid comparé à un relevé chaud. Le triage des 16 skills vers
`~/.agents-hors-scope/` n'a rien gagné.

Delta réel des plugins, mesuré sur les totaux, `cwd` fixe, sans `progress.md` (pour que le hook
n'injecte rien et que seule la charge statique compte) :

| État | TOTAL (2 exécutions) | Delta |
|---|---:|---:|
| `orchestrateur-kit` désactivé | 21 487 · 21 491 | — |
| `orchestrateur-kit` activé | 21 783 · 21 779 | **+292 tok** |
| + `obsidian-kit` activé | 21 785 | **+3 tok** |

Coût dynamique en plus, quand un `progress.md` existe : **+161 tok par invocation** (le pointeur).

> **`obsidian-kit` : coût non isolable.** Son serveur MCP est `mcpvault.cmd "G:\Mon Drive\Obsidian
> Vault"`, et `G:` n'est pas monté sur cette machine. Le serveur ne démarre pas, ses outils ne sont
> jamais chargés — les +3 tok mesurés ne disent donc **rien** du coût réel d'un MCP confiné par
> plugin. La thèse « AGY est le seul du parc à confiner un MCP » reste **non vérifiée par la mesure**.

> **Une exécution aberrante non expliquée** : un relevé isolé à 21 030 (au lieu de ~21 780 attendu)
> dans la série `obsidian-kit`. Non reproduit sur les 5 exécutions suivantes. Consigné plutôt
> qu'écarté.

## PHASE D — Homogénéisation

- [x] **D.1 Format unique de `progress.md`** — [`PORTAGE-RUNTIMES.md`](PORTAGE-RUNTIMES.md) §1
      → **vérifié par exécution** : les trois lecteurs (`state-lib.mjs` planPointer,
      `plan-pointer.ts`, `plan-pointer-hook.mjs`) lancés sur le **même** fichier de test
      (3 tâches, 1ʳᵉ cochée, 2ᵉ en cours) renvoient tous `1/3 cochées`, la tâche 2 **avec son
      critère et sa cible**, et la tâche 3 en suivante. Seul l'habillage du message diffère.
- [x] **D.2 Tableau natif / émulé / impossible** — [`PORTAGE-RUNTIMES.md`](PORTAGE-RUNTIMES.md) §2
      Trois « impossible » explicités : pas de sous-agents sur AGY · pas de confinement par
      sous-agent sur Claude Code · pas de pré-compaction sur AGY.
- [x] **D.3 Mesure finale** — [`PORTAGE-RUNTIMES.md`](PORTAGE-RUNTIMES.md) §4
      Claude Code **~40 150 tok** · AGY **~21 520 tok** · OpenCode **28 348 car** de prompt système.
      **La comparaison avec `MESURE-AVANT.md` est impossible** et c'est dit comme tel : ce document
      estimait par taille de fichiers (AGY à ~2 000 tok, réel ~21 520 — facteur dix), et le seul
      relevé réel « avant » date d'après les phases 1 à 6 du chantier précédent.

---

## Mesures relevées

**Métrique : `cache_creation_input_tokens` + `cache_read_input_tokens` du premier tour.**
Lire `cache_creation` seul fait passer un préfixe caché pour un gain — c'est l'erreur A.5.

| Runtime | Référence antérieure | Relevé du 2026-08-04 | Méthode |
|---|---:|---:|---|
| Claude Code | 16 021 tok *(faux — cache_creation seul)* | **40 150 tok** | `claude -p "ok" --output-format json`, 1ᵉʳ événement `assistant`, `cc + cr` |
| AGY | 9 303 tok *(faux — input_tokens seul)* | **~21 520 tok** | `agy -p "ok" --output-format json`, `input_tokens + cache_read_tokens` |
| OpenCode | ~12 800 tok *(méthode abandonnée)* | **28 348 car** de prompt système | capture par `experimental.chat.system.transform` — pas de compteur de tokens disponible |

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
