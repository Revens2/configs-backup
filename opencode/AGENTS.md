# Configuration OpenCode — Juliann

## Délégation adaptative aux subagents

- **FAST** : exécution directe ; aucun fan-out.
- **STANDARD** : un spécialiste ciblé pour l'incertitude réelle ; plusieurs seulement si les axes sont indépendants.
- **DEEP / CRITICAL** : si au moins deux workstreams indépendants existent, lancer 2 à 4 spécialistes en parallèle, puis consolider.
- L'agent principal reste propriétaire des décisions et des écritures applicatives ; aucun fichier n'est modifié par deux agents en parallèle.
- Utiliser `opus-seconde-passe` après consolidation des faits et avant une décision structurante complexe.
- Les subagents génériques `general` / `explore` restent interdits si la configuration les désactive ; utiliser les spécialistes réellement disponibles.
- Ne jamais déléguer par réflexe : le gain attendu doit être parallélisme, isolation de contexte, spécialisation ou vérification indépendante.

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
- `VPS_IA.md` — Config VPS IA (alias SSH `vps-ia`, IP/port/user dans la note)
- `Rapport_VPS_ETUDE.md` — Config VPS Étude (alias SSH `vps-etude-nb`, IP dans la note)
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

## Navigation de code adaptative — Graphify / CodeGraph

**INTERDIT home `C:\\Users\\Juliann`.** Jamais d'initialisation de graphe sans git root projet.

- Architecture, rôle de fichier, communautés → **Graphify**.
- Symboles, appelants, dépendances, blast radius → **CodeGraph**.
- Refactor/migration large avec incertitude structurelle → **les deux**.
- Fix localisé / fichier et impact déjà connus → **aucun graphe obligatoire**.
- Mettre à jour uniquement les graphes réellement utilisés lorsqu'un changement structurel significatif le justifie.

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
- **Déclenchement** : Incertitude, blast radius ou coût d'erreur élevés : migration, refactor large, feature importante, audit, architecture ou infra complexe. Le nombre brut d'étapes/fichiers ne suffit pas.
- **Rendu** : `plan.md` comme stratégie stable + `progress.md` comme snapshot courant compact. Consomme les briefs déjà produits ; ne recommence pas leur collecte.

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

## Politique Opus deux-passes (tâches complexes uniquement)

Pour toute tâche complexe nécessitant un raisonnement substantiel — audit, architecture,
diagnostic, comparaison, décision multicritère, recherche approfondie, plan de migration,
revue d'un travail produit — travail systématique en deux passes, SANS demander confirmation :

1. **Passe 1 — agent principal** : explore et vérifie d'abord toi-même. Utilise les outils
   et sources disponibles (ou délègue la collecte aux subagents du tableau), rassemble
   preuves, métriques, contradictions, anomalies, détails techniques et signaux faibles.
2. **Passe 2 — `opus-seconde-passe`** : délègue ensuite au MCP Opus (`opus_think` via le
   subagent) une seconde passe de réflexion pour critiquer l'analyse, détecter les angles
   morts, regrouper les problèmes par causes, hiérarchiser les risques et actions,
   et améliorer la synthèse.

- Donne à Opus suffisamment de contexte UTILE : faits vérifiés, contraintes, incertitudes,
  résultats des outils, points précis à critiquer. Évite le contexte inutile.
- Timeout MCP (`-32001`) : UN retry en prompt court, nouvelle session. Double échec =
  consigner en ## Erreurs et continuer sur passe 1 seule, jamais bloquer la mission.
- Après le retour d'Opus, produis toi-même la réponse finale en fusionnant les deux analyses.
  Ne supprime JAMAIS un constat technique, une anomalie ou un signal faible utile simplement
  parce qu'Opus ne l'a pas repris. En cas de désaccord, privilégie les preuves et explicite
  l'incertitude.
- Règles complémentaires : AVANT la décision/stratégie principale (pas après coup) ;
  nouvel appel si nouvelles preuves/échec changent la stratégie ; pas d'Opus pour
  trivial/déterministe ; Opus n'est pas source factuelle.

## Mémoire utilisateur locale

Appliquer `LOCAL-AGENT-MEMORY.md` lorsque le contexte personnel peut changer la réponse : récupérer le contrat/contexte depuis le Vault avant de demander à l'utilisateur de répéter ; capturer automatiquement les corrections/préférences/objectifs explicites dans la couche privée ; garder toute inférence en proposition non vérifiée ; ne jamais stocker de secret en clair.

Pour une décision nécessaire, utiliser un choix natif cliquable si le runtime le permet, sinon un QCM A/B/C très court avec la recommandation en premier.
