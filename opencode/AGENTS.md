# Configuration OpenCode — Juliann

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

- **Initiative et Exécution Immédiate** : Prendre directement les décisions techniques et exécuter les actions (création de subagents, installation d'outils, lancement de processus) sans attendre une confirmation intermédiaire si l'intention de me l'utilisateur est claire. Ne jamais faire répéter l'utilisateur.
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

## Sous-Agents Dédiés OpenCode CLI

### 1. `triage-contexte` (Triage & Filtrage de gros volumes)
- **Déclenchement** : Automatique dès qu'un gros fichier statique sur disque (log de >5 Mo, dump CSV/JSON massif, archive) ou un dossier très volumineux doit être analysé sans polluer le contexte de l'agent principal.
- **Note RTK** : Pour les sorties de terminal/build/test, RTK compresse déjà automatiquement. `triage-contexte` est réservé aux gros fichiers enregistrés sur disque.

### 2. `web-researcher` (Recherche Web approfondie & Veille)
- **Déclenchement** : Automatique dès qu'une recherche web exhaustive, un état de l'art, une documentation d'API externe ou une veille sur un sujet en ligne est demandée.
- **Rendu** : Retourne une synthèse compacte, factuelle et sourcée sans dump brut.

### 3. `obsidian-context-retriever` (Extraction & Mémoire du Vault Obsidian)
- **Déclenchement** : Automatique sur tout doute d'infra/VPS/projet ou recherche dans le vault Obsidian.
- **Rendu** : Retourne un brief de contexte structuré.

### 4. `github-code-review` (Revue de code & rayon d'impact)
- **Déclenchement** : Automatique dès qu'une tâche touche une branche Git, une Pull Request, un pipeline CI/CD ou une demande de revue de code (`git diff`, `gh pr ...`, workflow modifié).
- **Méthode** : Extraction du diff (`gh pr diff` ou `git diff main...HEAD`), puis rayon d'impact via `code-review-graph` (venv `C:\Tools\crg-venv`, chemin absolu, `PYTHONUTF8=1`). Mode dégradé annoncé si l'outil est indisponible.
- **Rendu** : Rapport append-only à 5 sections — Périmètre, Blast radius, Risques, Tests à lancer, Verdict — dans le `progress.md` du dépôt analysé, plus une synthèse d'une vingtaine de lignes.
- **Garde-fou** : `gh pr comment` n'est jamais exécuté sans accord explicite de l'utilisateur dans le fil. `git push`, `gh pr merge` et `code-review-graph install` sont interdits ; l'agent ne modifie pas le code relu.
