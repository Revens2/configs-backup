# Configuration OpenCode — Juliann

## Délégation systématique aux subagents — règle absolue (anti context-bloat)

> L'agent principal NE FAIT JAMAIS de context gathering volumineux lui-même. Il DÉLÈGUE TOUJOURS via Task. L'utilisateur ne doit jamais avoir à le demander — c'est automatique, dès le premier tour.

**INTERDICTIONS agent principal :**
- INTERDIT de lire >3 fichiers, de lancer glob/grep large, de lire logs/dumps volumineux, de lister un dossier volumineux, d'explorer une codebase, de faire une recherche web, de chercher dans le vault, de planifier une tâche complexe — sans passer par Task.
- INTERDIT de refaire le travail d'un subagent ou de re-lire les fichiers déjà triés par lui. Consommer uniquement son retour compact.
- INTERDIT d'utiliser des subagents génériques `general` / `explore` — seuls les 11 subagents dédiés ci-dessous sont autorisés (`permission.task.general/explore: deny` dans `opencode.jsonc`, les autres `task:*` restent `allow` par défaut).

**OBLIGATIONS :**
1. Dès qu'un signal du tableau de routage correspond → appel Task IMMÉDIAT, sans demander confirmation.
2. Signaux indépendants → appels Task en PARALLÈLE dans le même bloc.
3. Prompt Task = question précise + périmètre + format de retour attendu (chemins:lignes, pas de dump brut).
4. Retour subagent = livrable auto-suffisant. Le synthétiser, ne jamais le re-dumper ni le re-vérifier en relisant tout.

**Table de routage exhaustive (11 subagents `~/.config/opencode/agents/`) :**
| Signal | Subagent à appeler |
|---|---|
| Où est X, architecture, appelants, dépendances, blast radius, CodeGraph/Graphify | `decouverte` |
| Doc versionnée lib/framework/SDK/API, signature, option de config, pattern déprécié (avant de coder) | `docs-fetcher` |
| Branche, PR, `git diff`, `gh pr`, workflow CI/CD, revue de code | `github-code-review` |
| Conversion brute/répétitive (JSON↔YAML, cURL→env, mocks/fixtures, JSDoc, scaffolding) | `little-tasks` |
| Infra/VPS/stack/ports/env manquants, fiche projet, lecture vault Obsidian | `obsidian-context-retriever` |
| Écriture dans le vault (créer/corriger/déplacer/renommer/réindexer notes) | `obsidian-vault-maintainer` |
| Tâche >3 étapes, >2 fichiers, migration, refactor, feature, audit → `plan.md`/`progress.md` | `planificateur` |
| Audit SEO, maillage, Schema.org, cocon sémantique, métadonnées, Core Web Vitals | `seo-expert` |
| Fichier >500 Ko ou >1000 lignes, logs/dumps/CSV/JSON massifs, dossier volumineux, output de build | `triage-contexte` |
| Linux, systemd, Docker/Compose, PM2, SSH, pare-feu, réseau/VPN, backup, état VPS | `vps-sysadmin` |
| Recherche web, état de l'art, veille, doc API externe en ligne | `web-researcher` |

**Seules exceptions (à justifier en 1 ligne si utilisées) :**
- Fichier unique <200 lignes explicitement nommé par l'utilisateur.
- Fix one-liner évident déjà localisé, sans exploration.
- Tout le reste → subagent. En cas de doute entre deux subagents → appeler les deux en parallèle.

## Mode de Communication Ultra-Compressé (Skill Caveman)

**Activé via** : `/caveman`, "caveman mode", "talk like caveman", "less tokens", "be brief".
**Désactivation** : "stop caveman", "normal mode".

- **Style** : Répondre de façon concise/ultra-court tout en conservant 100% de la précision technique. Supprimer les articles, mots de remplissage, politesses et explications d'outils.
- **Formule** : `[chose] [action] [raison]. [étape suivante].`
- **Garde-fous** : Conserver les mots exacts, termes d'API, chemins, commandes et messages d'erreur. Repasser en mode normal uniquement pour les avertissements de sécurité et actions irréversibles.

## Vault Obsidian comme source de vérité pour l'infrastructure

Quand j'ai besoin d'informations sur l'infrastructure de l'utilisateur (VPS, serveurs, IPs, credentials, configs, ports, mots de passe), je **cherche d'abord dans le vault Obsidian** avant de poser la question.

**Chemin du vault** : `G:\Mon Drive\Obsidian Vault\raw\assets\`

**Commande de recherche** :
```powershell
Get-ChildItem "G:\Mon Drive\Obsidian Vault\raw\assets\" | Where-Object { $_.Name -match "<mot-clé>" }
```

**Fichiers de référence connus** :
- `VPS_IA.md` — Config VPS IA (IP: 100.99.75.104, user: oui, port 22)
- `Rapport_VPS_ETUDE.md` — Config VPS Étude (IP: 100.76.252.77)
- `config_vps.md` — Config générale VPS
- `NEXUS_PROJECT_MEMORY.md` — Mémoire du projet NexusTrade
- `NEXUS_*.md` — Tout ce qui concerne le projet NexusTrade/Nexus
- `Audit_VPS_OCI*.md` — Audits infrastructure Oracle Cloud

Ce n'est qu'en **l'absence d'information dans le vault** que je pose la question à l'utilisateur.

## Création automatique de GEMINI.md et AGENTS.md dans les projets

Si un projet ne possède pas de fichier `GEMINI.md` ou `AGENTS.md` à sa racine, **créer automatiquement les fichiers de consignes** dès le démarrage des travaux.

## Création automatique de .claudeignore / .opencodeignore dans les projets

Si un projet ne possède pas de fichier d'exclusion (`.claudeignore` ou `.opencodeignore`) à sa racine, **créer automatiquement un fichier `.claudeignore`** (et/ou `.opencodeignore`) dès l'initialisation du travail pour éviter de polluer le contexte avec des fichiers lourds ou temporaires.

**Règles et contenu par défaut obligatoires** :
```ignore
*.log
dist/
coverage/
tmp/
node_modules/
.git/
```

**Instruction d'exécution** : Vérifier la présence de `.claudeignore` / `.opencodeignore` à la racine dès le premier tour dans un projet. Si absent, créer le fichier immédiatement avec ces règles avant d'effectuer les recherches et lectures de fichiers.

## Génération, navigation et mise à jour automatique de Graphify & Code Graph

Si un projet possède un fichier `CLAUDE.md`, `GEMINI.md` ou `AGENTS.md` à sa racine :
1. **Génération initiale** : Générer automatiquement la base de connaissances `graphify` (`graphify extract <chemin> --code-only` puis `graphify tree`) et le graphe de dépendances `codegraph` si absents dès le démarrage des travaux.
2. **Navigation intelligente** : Se référer en priorité aux données `graphify` (`graphify query`, `graphify god-nodes`, `graphify-out/graph.json`) et `codegraph` pour comprendre l'architecture, naviguer intelligemment et cibler les fichiers à modifier de manière optimisée.
3. **Mise à jour post-développement** : Après avoir créé ou modifié d'importantes fonctionnalités dans le projet, ré-exécuter automatiquement la mise à jour des graphes `graphify` et `codegraph`.

## Démarrage automatique de Tailscale

En cas d'échec de connexion SSH (timeout) ou si Tailscale est inactif (`unexpected state: NoState`), lancer automatiquement la commande suivante pour reconnecter le VPN avant toute nouvelle tentative.

## Autonomie Maximale & Prise de Décision Proactive

- **Initiative et Exécution Immédiate** : Prendre directement les décisions techniques et exécuter les actions (création de subagents, installation d'outils, lancement de processus) sans attendre une confirmation intermédiaire si l'intention de l'utilisateur est claire. Ne jamais faire répéter l'utilisateur.
- **Clarification Proactive** : En cas de doute réel ou d'ambiguïté sur une instruction, poser immédiatement des questions précises (avec options le cas échéant) au lieu d'avancer à tâtons.
- **Processus Interactifs / GUI (ex: Login, Authentification)** : Pour toute commande nécessitant une interaction visuelle de l'utilisateur (connexion web, navigateur, fenêtre de login type `notebooklm login`), **ouvrir immédiatement le processus dans une fenêtre GUI séparée et visible au premier plan** (ex: `Start-Process`), et ne jamais bloquer dans une tâche d'arrière-plan sans interface.

## Optimisation des tokens avec RTK (Rust Token Killer) — OpenCode CLI

- **Plugin automatique** : Le plugin OpenCode (`~/.config/opencode/plugins/rtk.ts`) intercepte et réécrit automatiquement les commandes terminal via RTK.
- **Exécution Terminal** : Toujours préfixer les commandes Shell par `rtk` (ex: `rtk git status`, `rtk cargo test`, `rtk docker ps`, `rtk ls`, `rtk grep`, `rtk npx`, `rtk npm`, etc.) pour compresser automatiquement les logs et économiser 60–90% de tokens.
- **Auto-filtrage à la source** : RTK compresse 100% des sorties de build, de test et de commandes directement au niveau du terminal. Il me sera inutile d'invoquer un sous-agent de filtrage pour les sorties de commandes terminal.
- **Gros fichiers statiques sur disque** : Conserver l'utilisation du sous-agent `triage-contexte` exclusivement pour la lecture de gros fichiers statiques enregistrés sur disque (dumps JSON/CSV, logs serveurs de 50 Mo).
- **Commandes utiles** :
  - `rtk gain` — Voir les statistiques d'économie de tokens.
  - `rtk proxy <cmd>` — Exécuter une commande brute sans filtrage en cas de débogage spécifique.

## Auto-Trigger Obsidian Context Retriever & LLM Wiki

### 🚨 RÈGLE D'AUTO-DÉCLENCHEMENT SANS INTERVENTION HUMAINE (Auto-Spawning on Context Gap)

**Déclencheur Automatique :**
Dès que l'utilisateur fait une demande concernant son vault Obsidian, ses notes, son infrastructure, une configuration, un VPS ou toute recherche d'information dans ses connaissances :

1. **INTERDICTION DE DEVINER OU D'HALLUCINER** la stack, la topologie VPS ou les scripts de build.
2. **INTERDICTION DE DEMANDER À L'UTILISATEUR** des informations qui existent déjà dans son système de connaissances.
3. **INTERDICTION D'EFFECTUER LA RECHERCHE DIRECTEMENT EN AGENT PRINCIPAL.**
4. **ACTION IMMÉDIATE :** Instancier de manière 100% autonome le sous-agent **`obsidian-context-retriever`**.

**Mission transmise au Sous-Agent :**
- Chercher et extraire les fichiers de contexte clés (ex: les `CLAUDE.md`/`AGENTS.md` des projets concernés, la fiche VPS dédiée, la topologie réseau, la stack technique, les ports et variables d'environnement).
- Retourner un **Brief de Contexte Structuré** à l'Agent Principal pour qu'il puisse exécuter la demande initiale sans accroc.

## Sous-Agents Dédiés OpenCode CLI (détail — voir règle absolue ci-dessus pour le routage)

### 1. `decouverte` (Codebase, CodeGraph & Graphify — propriétaire exclusif)
- **Déclenchement** : Où est X, architecture, rôle de fichier, appelants, dépendances, rayon d'impact.
- **Rendu** : Réponse 3-10 lignes + Points d'entrée `chemin:ligne` + Architecture + Rayon d'impact + Zones d'ombre. Jamais de dump brut.

### 2. `docs-fetcher` (Doc versionnée lib/framework/SDK/API via Context7)
- **Déclenchement** : Avant de coder contre une dépendance dont l'API a pu bouger, doute sur signature/option/pattern déprécié.
- **Rendu** : Brief court + chemin de fichier, jamais un dump de doc.

### 3. `github-code-review` (Revue de code & rayon d'impact)
- **Déclenchement** : Automatique dès qu'une tâche touche une branche Git, une Pull Request, un pipeline CI/CD ou une demande de revue de code (`git diff`, `gh pr ...`, workflow modifié).
- **Méthode** : Extraction du diff (`gh pr diff` ou `git diff main...HEAD`), puis rayon d'impact via `code-review-graph` (venv `C:\Tools\crg-venv`, chemin absolu, `PYTHONUTF8=1`). Mode dégradé annoncé si l'outil est indisponible.
- **Rendu** : Rapport append-only à 5 sections — Périmètre, Blast radius, Risques, Tests à lancer, Verdict — dans le `progress.md` du dépôt analysé, plus une synthèse d'une vingtaine de lignes.
- **Garde-fou** : `gh pr comment` n'est jamais exécuté sans accord explicite de l'utilisateur dans le fil. `git push`, `gh pr merge` et `code-review-graph install` sont interdits ; l'agent ne modifie pas le code relu.

### 4. `little-tasks` (Micro-exécuteur passif, faible raisonnement)
- **Déclenchement** : Conversion brute/répétitive (JSON↔YAML, cURL→env, table Markdown↔JSON), mocks/fixtures, JSDoc passive, scaffolding `mkdir -p`/`touch`.
- **Rendu** : Chemin du fichier produit uniquement.

### 5. `obsidian-context-retriever` (Extraction & Mémoire du Vault Obsidian)
- **Déclenchement** : Automatique sur tout doute d'infra/VPS/projet ou recherche dans le vault Obsidian.
- **Rendu** : Brief de Contexte Structuré, pas un dump.

### 6. `obsidian-vault-maintainer` (Écriture Vault uniquement)
- **Déclenchement** : La mission demande explicitement de créer/corriger/déplacer/renommer/réparer/structurer/réindexer des notes via vault-mcp.
- **Rendu** : Chemins des notes touchées + actions faites. Séparé du retriever pour éviter les écritures accidentelles.

### 7. `planificateur` (Plan `plan.md` + état `progress.md`)
- **Déclenchement** : Tâche >3 étapes, >2 fichiers, migration, refactor, feature, audit, infra.
- **Rendu** : `plan.md` comme stratégie + `progress.md` comme état courant compact.

### 8. `seo-expert` (SEO technique)
- **Déclenchement** : Audit SEO, maillage interne, Schema.org, cocon sémantique, métadonnées, Core Web Vitals.
- **Rendu** : Synthèse audit + actions priorisées, pas de dump.

### 9. `triage-contexte` (Triage & Filtrage de gros volumes)
- **Déclenchement** : Automatique dès qu'un gros fichier statique sur disque (log de >5 Mo, dump CSV/JSON massif, archive) ou un dossier très volumineux doit être analysé sans polluer le contexte de l'agent principal.
- **Note RTK** : Pour les sorties de terminal/build/test, RTK compresse déjà automatiquement. `triage-contexte` est réservé aux gros fichiers enregistrés sur disque.

### 10. `vps-sysadmin` (Linux, Docker, SSH, réseau — safety-first)
- **Déclenchement** : Linux, systemd, Docker/Compose, PM2, SSH, pare-feu, réseau/VPN, backup, état VPS.
- **Méthode** : Topologie depuis Vault/RAG d'abord, état réel en lecture seule ensuite, modification seulement après.
- **Rendu** : État constaté + actions + vérifications (ports, services, endpoints).

### 11. `web-researcher` (Recherche Web approfondie & Veille)
- **Déclenchement** : Automatique dès qu'une recherche web exhaustive, un état de l'art, une documentation d'API externe ou une veille sur un sujet en ligne est demandée.
- **Rendu** : Retourne une synthèse compacte, factuelle et sourcée sans dump brut.

## Suppression de fichiers — corbeille obligatoire

Ne jamais supprimer définitivement (`rm`, `rm -rf`, `del`, `rmdir /s`, `Remove-Item`,
`shred`, `find -delete`). Toute suppression passe par la corbeille Windows :

```powershell
powershell -NoProfile -File C:/Users/Juliann/.claude/hooks/trash.ps1 "<chemin>"
```

Repli si la corbeille est indisponible : `%LOCALAPPDATA%\ia-trash\<horodatage>\`.
Exceptions : fichiers temporaires (`/tmp`, `%TEMP%`), sous-commandes d'outils (`git rm`,
`docker rm`), ou préfixe `TRASH_GUARD=off ` après accord explicite dans le fil.
Application mécanique : hook PreToolUse `~/.claude/hooks/guard-trash-instead-of-rm.js`,
`permissions.deny` de `settings.json`, plugin OpenCode `plugins/trash-guard.ts`,
règle Antigravity `rules/suppression_via_trash.md`.

## Navigateur par défaut — Brave session réelle (mémoire 2026-09-18)

- **Par défaut, pour TOUTE action navigateur demandée** : utiliser la **session Brave réelle de Juliann**, jamais le headless isolé du MCP.
- **Procédure** : `Stop-Process -Name brave -Force`, puis `Start-Process brave.exe --remote-debugging-port=9222 --remote-allow-origins=* --restore-last-session`, vérifier `http://127.0.0.1:9222/json/version` ne contient plus `HeadlessChrome`.
- **Pourquoi** : LeBonCoin / Vinted bloquent DataDome le headless (`Accès temporairement restreint`). La session réelle garde cookies + login LeBonCoin / Vinted.
- Comptes : LeBonCoin + Vinted connectés sur Brave réel. Ne jamais demander mot de passe / 2FA, faire valider par l'utilisateur dans la fenêtre visible.

## 📁 Organisation des projets & documentation (règle globale)

À appliquer dans **toutes** les sessions et tool agents (Claude Code, Antigravity, Codex,
OpenCode, Freebuff), pour tout projet personnel IA :

- **Tout nouveau projet de code, repo, script ou app** (créé pour / par une IA) → se créer dans
  **`C:\projet\<nom>`** de façon systématique, qu'importe son type.
- **Toute écriture de documentation** (README, notes, rapports, `plan.md`, `progress.md`,
  docs, mémo réutilisable, fiches) → se déposer dans
  **`C:\projetdocs\clone de projet\<sujet>`**.

Exceptions : un projet qui vit déjà ailleurs et qu'on n'a pas décidé de déplacer reste où il
est (voir `C:\projet\PROPOSITIONS.md` avant tout déplacement).
