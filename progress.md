# progress.md — Mission `github-code-review`

Projet : `C:\Users\Juliann\configs-backup`
Plan de référence : `C:\Users\Juliann\configs-backup\plan.md`
⚠️ Ne pas confondre avec `C:\Users\Juliann\progress.md` (mission close, hors dépôt, à ignorer).

Règle : **append-only**. On coche, on ajoute en fin de fichier ; on ne réécrit pas l'historique.
Aucune case cochée sans vérification effective (commande lancée, sortie constatée).

---

## TODO

- [x] **Étape 0 — Cartographie**
  - [x] Arborescence du dépôt relevée (4 runtimes)
  - [x] Absence de `.codegraph/` et `graphify-out/` constatée → pas d'indexation
  - [x] Format de frontmatter relevé pour CLI / OpenCode / Antigravity
  - [x] Claude Desktop : aucun répertoire d'agents (JSON seulement)
  - [x] Fichiers d'instructions inventoriés
  - [x] Toolchain vérifiée (Python 3.11.9, pip 24.0, node 24.18, gh 2.96, git 2.55 ; pipx absent)
  - [x] README de `code-review-graph` récupéré via `web-researcher`
  - [x] `plan.md` écrit
- [ ] **Étape 1 — Installer et vérifier `code-review-graph`** (plan §4.1)
  - [ ] 1.1 `pip index versions code-review-graph` — existence et version réelle confirmées
  - [ ] 1.2 venv `C:\Tools\crg-venv` créé + paquet installé
  - [ ] 1.3 `code-review-graph.exe --version` et `--help` OK, sous-commandes réelles relevées
  - [ ] 1.4 Test fonctionnel `build` + `detect-changes --brief` sur un repo de code réel
  - [ ] 1.5 `code-review-graph install` **non exécuté** (interdit)
- [ ] **Étape 2 — Prompt système commun rédigé** (brouillon `.agent-draft-github-code-review.md`)
  - [ ] Garde-fou `gh pr comment` = confirmation explicite, formulé verbatim
- [ ] **Étape 3 — Déclinaison par runtime**
  - [ ] 3.1 `claude-code-cli/agents/github-code-review.md`
  - [ ] 3.2 `opencode/agents/github-code-review.md`
  - [ ] 3.3 `antigravity/agents/github-code-review.md`
  - [ ] 3.4 Desktop : option (a) ou (b) tranchée avec l'utilisateur
- [ ] **Étape 4 — Fichiers d'instructions**
  - [ ] 4.1 `claude-code-cli/CLAUDE.md` (+ `.bak`)
  - [ ] 4.2 `claude-code-cli/gemini.md` réplique byte-identique
  - [ ] 4.3 `opencode/AGENTS.md`
  - [ ] 4.4 `antigravity/gemini.md`
  - [ ] 4.5 `CLAUDE.md` + `GEMINI.md` racine (résorber la divergence 76/75 lignes)
  - [ ] 4.6 `README.md` (+ corriger `subagents/` et `opencode/skills/`)
- [ ] **Étape 5 — Vérification**
  - [ ] 5.1 Frontmatter YAML parsé sans exception sur les 3 agents
  - [ ] 5.2 UTF-8 sans BOM, fins de ligne cohérentes
  - [ ] 5.3 Simulation à blanc sur un diff de test → rapport à 5 sections
  - [ ] 5.4 Aucun secret introduit (`git diff --staged` relu)
  - [ ] 5.5 Brouillon `.agent-draft-*.md` supprimé
- [ ] **Étape 6 — Commit** (`git add` ciblé, après accord explicite)
- [ ] **Étape 6bis — Activation réelle** (copie vers les emplacements vivants) — optionnelle, à proposer

---

## Gating

Une étape ne passe à `[x]` que si :
- la commande de vérification associée a été **lancée** et sa sortie constatée ;
- pour les fichiers d'agents : parsing YAML sans exception (plan §5.1) ;
- pour les paires `CLAUDE.md`/`gemini.md` : `git diff --no-index` **vide** ;
- pour toute action sortante (`gh pr comment`, `git push`) : accord utilisateur dans le fil.

---

## Décisions prises

- Pas d'indexation CodeGraph/Graphify : dépôt de configs, pas de code source.
- `code-review-graph` installé en **venv dédié**, pas en `--user` (pipx absent).
- `code-review-graph install` **interdit** : effet de bord sur 15 configs IA non versionnées.
- Claude Desktop ne reçoit **pas** de fichier d'agent : le format n'existe pas.
- Mode dégradé prévu si l'outil s'avère non installable — la mission ne se bloque pas dessus.

---

## Erreurs rencontrées

_(vide — consigner ici chaque échec avec la commande exacte, la sortie et la cause ;
ne jamais supprimer une entrée, sous peine de rejouer le même échec)_

---

## Journal d'exécution — 2026-08-12

### Étape 1 — `code-review-graph` : **installé, fonctionnel**
- [x] 1.1 `pip index versions code-review-graph` → paquet réel, **2.3.7** confirmée (la version annoncée par `web-researcher` était donc exacte ; le doute du plan §3 est levé).
- [x] 1.2 venv `C:\Tools\crg-venv` créé, paquet + deps installés (tree-sitter, fastmcp, networkx…).
- [x] 1.3 `code-review-graph.exe --version` → `code-review-graph 2.3.7`. `--help` relevé : **33 sous-commandes**, dont `impact` (« Analyze the blast radius of changes ») que le plan ne mentionnait pas.
- [x] 1.4 Test fonctionnel sur clone jetable de `dom-reader-mcp` (scratchpad, aucun dépôt réel touché) : `build` → 1 fichier, 2 nœuds, 22 arêtes. `update --base main --brief` → risque 0.30, 1 test gap, économie 285 tok (~42 %).
- [x] 1.5 `code-review-graph install` **non exécuté**.

**Correctifs au plan constatés à l'exécution :**
- `impact` existe et prend `--files/--depth/--base/--repo` ; sortie **JSON verbeuse**, à ne pas recopier telle quelle. `detect-changes --brief` reste la bonne sortie de lecture.
- `update --brief` fait re-parse **et** résumé de risque en une commande — c'est l'appel par défaut retenu dans le prompt système.

### Étape 2+3 — Sous-agent
- [x] Corps du prompt système rédigé une seule fois, décliné en 3 frontmatters distincts. Pas de fichier `.agent-draft-*` : sans valeur ajoutée, le corps est identique par construction (généré par `awk` depuis la version CLI).
- [x] 3.1 `claude-code-cli/agents/github-code-review.md` — `name/description/model/tools`, `claude-sonnet-5`.
- [x] 3.2 `opencode/agents/github-code-review.md` — `mode: subagent`, `tools` en mapping booléen, `edit: false`.
- [x] 3.3 `antigravity/agents/github-code-review.md` — frontmatter à 2 clés.
- [x] 3.4 Desktop : option **(a)** retenue par l'utilisateur → documenté dans `CLI-VS-DESKTOP.md`, aucun `claude-code-desktop/agents/` inventé.

### Étape 4 — Fichiers d'instructions
- [x] 4.1 `claude-code-cli/CLAUDE.md` : ligne de délégation, précision de comportement, ligne du tableau « Modèle par sous-agent ».
- [x] 4.2 `claude-code-cli/gemini.md` : réplique par `cp`, `diff` vide.
- [x] 4.3 `opencode/AGENTS.md` : section « ### 4. `github-code-review` ».
- [x] 4.4 `antigravity/gemini.md` : aligné sur le `CLAUDE.md` racine, `diff` vide.
- [x] 4.5 `CLAUDE.md` + `GEMINI.md` racine : section « Revue de code, branches et PR ». **La divergence 76/75 lignes annoncée par le plan n'existait pas** — `diff` déjà vide avant édition.
- [x] 4.6 `README.md` : `antigravity/subagents/` → `agents/` (erreur réelle) + mentions de l'agent. **`opencode/skills/` existe bien** — la 2ᵉ erreur annoncée par le plan est fausse, rien retiré.

### Étape 5 — Vérification
- [x] 5.1 YAML parsé sans exception sur les 3 agents ; clés conformes au voisin de chaque répertoire.
- [x] 5.2 UTF-8 sans BOM ; **CRLF** appliqué pour coller aux voisins (le plan ne le précisait pas, les 3 voisins de référence sont en CRLF).
- [x] 5.3 Simulation à blanc : branche `test/crg-sim`, rapport à 5 sections écrit dans le `progress.md` du clone jetable. Aucune PR, aucun `gh pr comment`.
- [x] 5.4 Aucun secret introduit — les fichiers écrits ne contiennent que des chemins et des noms de commandes.
- [x] 5.5 Sans objet : aucun brouillon créé.

### Étape 6bis — Activation réelle (accord utilisateur donné)
- [x] `~\.claude\agents\github-code-review.md`
- [x] `~\.config\opencode\agents\github-code-review.md`
- [x] `~\.gemini\config\agents\github-code-review.md` (répertoire réel d'Antigravity — ce n'est ni `.gemini\agents` ni `antigravity-cli\agents`)
- [x] `~\.config\opencode\AGENTS.md`, `~\.gemini\GEMINI.md`, `~\gemini.md` synchronisés depuis le dépôt (`diff` vide dans les 3 cas ; sauvegardes `.bak.20260812-000` prises, miroirs vérifiés identiques avant écrasement)
- [ ] **Reste à faire, hors session** : `~\.claude\CLAUDE.md` et `C:\Users\Juliann\CLAUDE.md`. Ces deux fichiers sont dans le préfixe de cache de la session Claude Code en cours ; les éditer maintenant invalide le préfixe (×10 sur le coût). À copier depuis `configs-backup\claude-code-cli\CLAUDE.md` et `configs-backup\CLAUDE.md` **entre deux sessions**.

---

## Erreurs rencontrées

- `Permission to use Bash ... has been denied` — commande combinant `mkdir -p` et `rm -rf` sur le scratchpad. Cause : le `rm -rf` déclenche le refus. Parade : cloner sans pré-nettoyage. Non rejoué.
