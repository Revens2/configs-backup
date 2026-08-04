# Récapitulatif complet — chantier « orchestrateur nu / workers spécialisés »

Session du **2026-08-04**, machine Windows 11, 4 runtimes.
Dépôt : `github.com/Revens2/configs-backup` (privé) — **17 commits, poussés**.

Ce fichier est le point d'entrée. Les détails sont dans :
[`PLAN-ARCHI.md`](PLAN-ARCHI.md) (avancement, dette, journal d'erreurs) ·
[`MESURE-AVANT.md`](MESURE-AVANT.md) (mesures) ·
[`TRIAGE-SKILLS.md`](TRIAGE-SKILLS.md) ·
[`CLI-VS-DESKTOP.md`](CLI-VS-DESKTOP.md) ·
[`REPARTITION-RUNTIMES.md`](REPARTITION-RUNTIMES.md).

---

## 1. Le résultat en un tableau

| Runtime | Contexte de démarrage **mesuré** | État |
|---|---:|---|
| **OpenCode** 1.18.3 | **~14 800 tok** | réparé (ne démarrait pas), le plus léger |
| **Claude Code** 2.1.220 (CLI + Desktop) | **16 021 tok** | −24 030 tok sur la session |
| **AGY** (Antigravity 1.1.10) | **21 530 tok** | MCP global vidé, confinés en plugins |

Claude Code : **40 051 → 16 021 tok, −60 %**, mesuré, pas estimé.

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

## 4. Cinq erreurs de ma part

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
| S1 | Clé Anytype (ancienne) | historique git `adb1957` · `~/.mcp.json` · **`~/.gemini/config/mcp_config.json`** | **Révoquée** (HTTP 401 vérifié). Purgée des fichiers vivants. Reste dans l'historique git, inerte. |
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
4. **`~/.agents/skills/` : 20 skills jamais inspectés**, lus par **AGY et OpenCode**, avec des
   doublons de `caveman` et `graphify` (3 exemplaires de `caveman` au total côté OpenCode). C'est
   l'équivalent de la phase 2.3 pour ces deux runtimes, **non fait**. Piste la plus rentable qui
   reste.
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
claude -p "ok" --output-format json          # usage.cache_creation_input_tokens
agy -p "ok" --output-format json             # usage.input_tokens
opencode stats                               # delta Avg Tokens/Session x Sessions
```

Isoler un poste : rejouer avec `--strict-mcp-config --mcp-config '{"mcpServers":{}}'` et faire la
différence. C'est ainsi que les 25 015 tok des connecteurs claude.ai ont été trouvés — après six
phases passées à optimiser un poste qui en pesait 874.
