# Récapitulatif complet — chantier « orchestrateur nu / workers spécialisés »

Session du **2026-08-04**, machine Windows 11, 4 runtimes.
Dépôt : `github.com/Revens2/configs-backup` — **public** (vérifié le 2026-08-04 :
`gh repo view --json visibility` → `PUBLIC`). Ce fichier l'a longtemps décrit comme privé ; c'était
faux, et la correction change la lecture de S1 (§6).

Ce fichier est le point d'entrée. Les détails sont dans :
[`PLAN-ARCHI.md`](PLAN-ARCHI.md) (avancement, dette, journal d'erreurs) ·
[`MESURE-AVANT.md`](MESURE-AVANT.md) (mesures) ·
[`TRIAGE-SKILLS.md`](TRIAGE-SKILLS.md) ·
[`CLI-VS-DESKTOP.md`](CLI-VS-DESKTOP.md) ·
[`REPARTITION-RUNTIMES.md`](REPARTITION-RUNTIMES.md).

---

## 1. Le résultat en un tableau

| Runtime | Contexte de démarrage **mesuré** | Départ | Gain |
|---|---:|---:|---:|
| **AGY** (Antigravity 1.1.10) | **9 303 tok** | 21 517 | **−57 %** |
| **OpenCode** 1.18.3 | **~12 800 tok** | ~14 800 | −14 % |
| **Claude Code** 2.1.220 (CLI + Desktop) | **~40 150 tok** | ~40 050 | **aucun** |

> ⚠️ **Correction du 2026-08-04 (session de portage).** La ligne « Claude Code : 16 021 tok, −60 % »
> était **fausse**. Elle ne lisait que `cache_creation_input_tokens`, en ignorant
> `cache_read_input_tokens` : les 24 030 tokens prétendument « coupés » étaient simplement passés en
> cache, toujours envoyés au modèle. Contre-mesure décisive, trois relevés du même jour, total
> `cache_creation + cache_read` du premier tour :
>
> | Configuration | Total réel |
> |---|---:|
> | `deniedMcpServers: []` (tous les connecteurs actifs) | **40 137 tok** |
> | défaut (2 connecteurs refusés) | **40 150 tok** |
> | `--strict-mcp-config --mcp-config '{"mcpServers":{}}'` | **38 863 tok** |
>
> Écart entre les deux premières : **13 tokens**, soit du bruit. **`deniedMcpServers` ne réduit pas le
> contexte.** Les 3 serveurs MCP locaux coûtent en revanche bien ~1 290 tok (ligne 2 − ligne 3),
> cohérent avec les 874 tok relevés la veille. Voir §10 pour la méthode corrigée.

Les gains AGY et OpenCode restent valides : ce sont des **différentiels sur la même métrique**
(présence/absence de `.agents/`), pas des comparaisons de part cachée. OpenCode a en outre été
**réparé** : il ne démarrait pas, puis il répondait vide (voir §5).

---

## 2. Ce qui a été fait, phase par phase

### Phase 1 — Sécurité (bloquante)
Scan des 4 arbres de config. Deux clés Anytype trouvées en clair, révoquées par l'utilisateur,
révocation **vérifiée** (`GET 127.0.0.1:31009/v1/spaces` → HTTP 401 pour les deux). Le bloc `anytype`
a été supprimé plutôt que passé en variable d'environnement : le serveur était mort et n'avait aucun
appel en 18 jours.

### Phase 2 — Claude Code
- **2.1 abandonnée** : `CLAUDE.md` = 3,4 % du contexte. Le dégraisser ne rendait rien.
- **2.2** : `~/.mcp.json` et `claude_desktop_config.json` passés de **7 à 3 serveurs**
  (`codegraph`, `github`, `obsidian-semantic`). Retirés : `anytype` (mort), `canva` (0 appel),
  `notebooklm` (2 appels/18 j), `obsidian` (3 appels/18 j).
- **2.3** : **63 → 15 skills** au niveau utilisateur. Les 47 autres sont dans
  `~/.claude/skills-hors-scope/<bloc>/` — dossier non lu, contenu intact, redéployable en une
  commande. Listing 6 057 → 905 tok.
- **2.4** : `obsidian-context-retriever` bascule sur le système de fichiers du vault +
  `semantic-search` ; `web-researcher` sur `WebSearch`/`WebFetch` ; `anytype-manager` retiré.

### Phase 3 — Boucle de plan sur fichier
Skill **`/plan-run`** : lire `progress.md` → décider (déléguer si fort ratio bruit/conclusion) →
vérifier → cocher. `state-lib.mjs` gagne `planPointer()` : `STATE.md` s'ouvre désormais sur un
pointeur vers `progress.md`, le compteur `n/total` et les 3 prochaines tâches non cochées.

### Phase 4 — Desktop
**Tout `~/.claude/` est partagé** entre CLI et Desktop. Seules la déclaration MCP et les plugins sont
séparés, et **ne se synchronisent pas** : toute modif MCP est à porter deux fois.

### Phase 5 — AGY
MCP global vidé. `obsidian` déplacé dans un plugin **`obsidian-kit`** désactivé par défaut ; nouveau
plugin **`orchestrateur-kit`** portant une règle de conduite de travail long.
`agy plugin enable <kit>` pour activer à la demande.

### Phase 6 — OpenCode
`permission.task` en `deny` sur `general` et `explore`. Les 3 workers réécrits au format OpenCode.
Nesting déjà plafonné à 2 niveaux par défaut.

### Phase 7 — Mesure
Relevé réel, qui a démoli l'estimation (voir §4). Coupure sélective des connecteurs claude.ai :
**−24 030 tok**.

---

## 3. Quatre postulats de la mission, démentis à la vérification

| Énoncé | Réalité |
|---|---|
| « Corriger le BOM UTF-8 de `settings.local.json` » | Pas de BOM. Octets de tête `7B 0D 0A`. |
| « Vérifier que les deny rules couvrent obsidian, anytype… » | `permissions.deny` était **vide**. Et il ne réduit pas le contexte : un serveur refusé reste connecté et ses schémas restent chargés. |
| « Réactiver les hooks `SessionStart`/`PreCompact`, les écrire en `.mjs` » | Déjà actifs, déjà en `.mjs`. Le bloc `hooks_disabled` contient une génération **antérieure en bash `.sh`** — la réactiver aurait été la régression que la mission interdit. |
| « AGY gère nativement les sous-agents et le nesting » | **Faux.** Les types de customisation d'Antigravity sont Rules, Skills, Plugins, Hooks, MCP. Pas de sous-agents. `agy agents` renvoie vide. Le `subagents/` du dépôt était un résidu de lignée Cursor. |

**Le runtime qui a des sous-agents, c'est Claude Code.** Celui qui confine un MCP, c'est AGY, par
plugin. Celui qui retire un sous-agent du contexte, c'est OpenCode, par `task` deny. Aucun n'a les
trois.

---

## 4. Six erreurs de ma part

0. **Le « −60 % » sur Claude Code n'existe pas.** Mesure faite sur `cache_creation_input_tokens`
   seul, « avant » à cache froid et « après » à cache chaud : la soustraction ne mesurait que la
   température du cache. Contre-mesure du 2026-08-04 : `deniedMcpServers` vide → 40 137 tok,
   `deniedMcpServers` avec 2 connecteurs refusés → 40 150 tok. **13 tokens d'écart.** L'action
   présentée comme « la plus rentable du chantier » n'a rien rendu. C'est la même faute que
   l'erreur 1 ci-dessous — annoncer un gain avant de savoir le mesurer — commise une seconde fois,
   après l'avoir écrite noir sur blanc comme leçon.


1. **Estimation du coût MCP à ~200 tok/outil.** Réel : **~12 tok/outil** — Claude Code 2.1.220 charge
   les outils MCP **en différé** (`ToolSearch`), seuls les noms partent. Facteur 17. J'ai annoncé
   ~24 200 tok rendus par les phases 2.2 ; l'ordre de grandeur réel est de **quelques centaines**.
   Les retraits restent justifiés — serveur mort, clé révoquée, 0 appel — mais pas par l'argument
   tokens. *Le plan disait « sans ce chiffre, aucune phase n'est validable » ; j'ai gardé la mesure
   pour la fin.*
2. **« AGY : 0 MCP ».** Je n'avais regardé que `~/.antigravitycli/mcp/` (vide) en ignorant
   `~/.gemini/config/`, la vraie racine — qui portait 3 serveurs **et un troisième exemplaire de la
   clé S1**, non vu aux phases 1 et 2.
3. **« AGY est le plus léger, ~2 000 tok ».** Réel : **21 530**. Même erreur : estimation par taille
   de fichiers, en oubliant le prompt système et les outils intégrés du runtime.
4. **« 3 doublons de skills, 231 tok, risque nul ».** Un seul doublon réel (`frontend-design`,
   64 tok) : un marketplace cloné n'est pas un plugin activé. Supprimer `caveman` et `skill-creator`
   les aurait fait disparaître.
5. **`git rm` sur les skills du dépôt** — aurait détruit la sauvegarde au lieu de la réorganiser.
   Rattrapé par `reset` + `checkout`, refait en `git mv`. Rien de perdu.

---

## 5. Deux bugs trouvés, qui n'étaient pas au programme

- **OpenCode ne démarrait pas.** `Configuration is invalid — Expected object, got "mcp__notebooklm__…"`.
  Les 3 workers avaient `tools:` en chaîne (format Claude Code) au lieu d'un objet. Ils n'avaient
  **jamais** fonctionné.
- **OpenCode répondait vide.** `opencode.jsonc` demandait le modèle `Qwen 3.6 35b MoE`, id qui
  n'existe que sur `:8000` (llama.cpp direct). La gateway `:4002`, celle qui porte le sanitizer de
  tool-calls, expose `qwen-3.6-35b-moe`. La clé d'un modèle dans la config **est** l'id envoyé à
  l'API. Vérifié par `GET :4002/v1/models`, corrigé, OpenCode répond.

---

## 6. Secrets

| # | Quoi | Où | État |
|---|---|---|---|
| S1 | Clé Anytype (ancienne) | historique git `adb1957` · `~/.mcp.json` · **`~/.gemini/config/mcp_config.json`** | **Révoquée** (HTTP 401 vérifié). Purgée des fichiers vivants. **Reste lisible en clair dans le commit `adb1957` d'un dépôt public** — inerte parce que révoquée, pas parce qu'elle serait cachée. |
| S2 | Clé Anytype (courante) | `~/.mcp.json` · `claude_desktop_config.json` | **Révoquée** (HTTP 401 vérifié). Blocs supprimés. |
| S3 | Vault Obsidian exposé par ngrok, secret = chemin d'URL, accès **lecture et écriture** | connecteur claude.ai | Risque **assumé** par l'utilisateur. Depuis la phase 7 il n'est plus chargé dans le contexte, mais **l'endpoint public existe toujours**. |
| S4 | Clé **ref.tools** en **query string** | `~/.cursor/mcp.json` (installation Cursor) | **Vivante** (HTTP 405, pas de rejet d'auth). Hors dépôt. **À faire tourner — action utilisateur.** |

Scan complet du dépôt avant push : aucune correspondance sur `Bearer`, `sk-`, `ghp_`, `AIza`,
`apiKey=`, URL ngrok.

---

## 7. Fichiers modifiés, et comment revenir en arrière

Aucune suppression sèche : tout est sauvegardé.

| Fichier vivant | Sauvegarde |
|---|---|
| `~/.mcp.json` | `.bak.20260804-010257` |
| `~/AppData/Roaming/Claude/claude_desktop_config.json` | `.bak.20260804-010257` |
| `~/.claude/settings.json` | `.bak.20260804-phase7` |
| `~/.claude/hooks/state-lib.mjs` | `.bak.20260804-010257` |
| `~/.gemini/config/mcp_config.json` | `.bak.20260804-010257` |
| `~/.config/opencode/agents/*.md` (3) | `.bak.20260804-010257` |
| `~/.claude/agents/anytype-manager.md` | `agents/retires-20260804/` |
| 47 skills | `~/.claude/skills-hors-scope/<bloc>/` |
| `frontend-design` | `~/.claude/skills-retires-20260803/` |

Créés : `~/.claude/skills/plan-run/` · `~/.gemini/config/plugins/obsidian-kit/` ·
`~/.gemini/config/plugins/orchestrateur-kit/` · `~/.claude/CLAUDE.md.next` + `gemini.md.next`.

---

## 8. Dette ouverte

1. **`~/.claude/CLAUDE.md` est faux** — il référence `anytype-manager` et des MCP supprimés. La
   version corrigée est prête à côté (`.next`, avec `gemini.md.next` identique au hash près). Ta
   règle de cache KV interdit d'éditer `CLAUDE.md` en cours de session, d'où la bascule différée :

   ```bash
   mv ~/.claude/CLAUDE.md ~/.claude/CLAUDE.md.bak.avant-corrections && mv ~/.claude/CLAUDE.md.next ~/.claude/CLAUDE.md && mv ~/.claude/gemini.md ~/.claude/gemini.md.bak.avant-corrections && mv ~/.claude/gemini.md.next ~/.claude/gemini.md
   ```

2. **Bloc `obsidian` (4 skills)** — à déposer dans `<vault>/.claude/skills/`. `G:` n'a été monté à
   aucun moment de la session.
3. **S4** — clé ref.tools à faire tourner.
4. ~~`~/.agents/skills/`~~ — **fait**, voir §11.
5. **Compaction réelle non testée** — le pointeur `progress.md` est validé par exécution directe du
   hook, pas par une compaction, qui ne se provoque pas sur commande.

---

## 9. Les trois leviers de contexte, à ne pas confondre

C'est la leçon centrale du chantier, et ce qui manquait à `CLAUDE.md` :

| Levier | Effet | Gain de contexte |
|---|---|---|
| `permissions.deny` | bloque l'**exécution** | **aucun** — le serveur reste connecté |
| `deniedMcpServers` | bloque l'**admission** | **réel** — et mord aussi sur les connecteurs claude.ai |
| `.mcp.json` de projet | portée | réel — le serveur n'existe que là où il sert |

Et le constat qui borne toute l'architecture : **le confinement MCP par sous-agent n'existe sur aucun
des runtimes Claude Code.** `tools:` ne fait que filtrer une liste déjà chargée.

---

## 10. Comment on mesure, pour ne plus estimer

```bash
claude -p "ok" --output-format json          # cache_creation + cache_read du 1er tour
agy -p "ok" --output-format json             # usage.input_tokens
opencode stats                               # delta Avg Tokens/Session x Sessions
```

**Règle corrigée le 2026-08-04 — la plus importante de ce fichier.** Le contexte réellement envoyé au
modèle est **`cache_creation_input_tokens` + `cache_read_input_tokens`** du premier événement
`assistant`. La sortie `--output-format json` est un **tableau d'événements**, pas un objet : lire le
premier tour, pas l'agrégat final.

Ne regarder que `cache_creation` fait passer **un préfixe déjà mis en cache pour un gain**. C'est
l'erreur qui a produit le « −60 % » de la §1 : le relevé « avant » était à cache froid
(`cache_read = 0`, donc `cache_creation` = tout), le relevé « après » à cache chaud
(`cache_creation ≈ 16 000`, `cache_read ≈ 24 000`). La soustraction des deux ne mesurait que la
température du cache.

Corollaire : un différentiel n'est fiable que si les deux relevés sont **dans le même état de
cache**, ou si l'on compare des **totaux**. Les mesures AGY (`.agents/` présent vs absent) tiennent
parce qu'elles remplissent cette condition ; la mesure Claude Code ne la remplissait pas.

Isoler un poste : rejouer avec `--strict-mcp-config --mcp-config '{"mcpServers":{}}'` et faire la
différence. C'est ainsi que les 25 015 tok des connecteurs claude.ai ont été trouvés — après six
phases passées à optimiser un poste qui en pesait 874.

Pour un poste sans drapeau dédié : le renommer et remesurer. C'est ce qui a chiffré `.agents/`
(renommé en `.agents-off`, mesuré, restauré).

---

## 11. `~/.agents/skills/` — le plus gros levier, trouvé en dernier

Racine de customisation **workspace** d'Antigravity pour `C:\Users\Juliann`, lue par **AGY et
OpenCode**. Découverte par accident : les avertissements « duplicate skill name » du log OpenCode.

Mesure différentielle sur AGY :

| État | Contexte |
|---|---:|
| `.agents/` présent, 20 skills | 21 517 tok |
| `.agents/` renommé (absent) | 9 305 tok |
| **après triage, 4 skills gardés** | **9 303 tok** |

**`.agents/` coûtait 12 212 tokens, soit 57 % du contexte d'AGY.** Les 16 skills sortis
représentaient la totalité de ce coût ; les 4 conservés ne pèsent rien de mesurable.

Conservés : `shell`, `review`, `babysit`, `loop`.
Sortis vers `~/.agents-hors-scope/<bloc>/` (non lu, redéployable) :

| Bloc | Skills |
|---|---|
| `doublons` | `caveman`, `graphify` — présents dans 2 autres racines chacun |
| `meta-agy` | `create-hook`, `create-rule`, `create-skill`, `create-subagent`, `migrate-to-skills`, `statusline`, `update-cli-config`, `update-cursor-settings`, `sdk` |
| `flux-dev` | `review-bugbot`, `review-security`, `split-to-prs`, `deploy` |
| `ui` | `canvas` (84 Ko) |

Effet sur OpenCode : **~14 800 → ~12 800 tok**. Plus faible qu'AGY parce qu'OpenCode ne charge que
les descriptions, là où AGY en charge davantage.

**Classement final : AGY 9 303 < OpenCode ~12 800 < Claude Code ~40 150.**
*(Chiffre Claude Code corrigé le 2026-08-04 : 16 021 était la seule part non cachée du prompt, voir
l'encadré de la §1.)* Quatrième fois que ce classement bouge au cours du chantier. L'ordre ne change
pas, l'écart si : Claude Code est **quatre fois** plus lourd qu'AGY, pas une fois et demie.
