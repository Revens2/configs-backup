# Règles Globales — Juliann

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

## Création automatique de GEMINI.md dans les projets

Si un projet ne possède pas de fichier `GEMINI.md` (ou `gemini.md`) à sa racine, **créer automatiquement un fichier `GEMINI.md` par défaut** dès le démarrage des travaux.

## Création automatique de .claudeignore dans les projets

Si un projet ne possède pas de fichier `.claudeignore` à sa racine, **créer automatiquement un fichier `.claudeignore`** avec les règles d'exclusion par défaut pour éviter de polluer le contexte du modèle :

```ignore
*.log
dist/
coverage/
tmp/


## Génération, navigation et mise à jour automatique de Graphify & Code Graph

Si un projet possède un fichier `CLAUDE.md` ou `GEMINI.md` à sa racine :
1. **Génération initiale** : Générer automatiquement la base de connaissances `graphify` (`graphify extract <chemin> --code-only` puis `graphify tree`) et le graphe de dépendances `codegraph` si absents dès le démarrage des travaux.
2. **Navigation intelligente** : Se référer en priorité aux données `graphify` (`graphify query`, `graphify god-nodes`, `graphify-out/graph.json`) et `codegraph` pour comprendre l'architecture, naviguer intelligemment et cibler les fichiers à modifier de manière optimisée.
3. **Mise à jour post-développement** : Après avoir créé ou modifié d'importantes fonctionnalités dans le projet, ré-exécuter automatiquement la mise à jour des graphes `graphify` et `codegraph`.

## Démarrage automatique de Tailscale

En cas d'échec de connexion SSH (timeout) ou si Tailscale est inactif (`unexpected state: NoState`), lancer automatiquement la commande suivante pour reconnecter le VPN avant toute nouvelle tentative :


## Autonomie Maximale & Prise de Décision Proactive

- **Initiative et Exécution Immédiate** : Prendre directement les décisions techniques et exécuter les actions (création de subagents, installation d'outils, lancement de processus) sans attendre une confirmation intermédiaire si l'intention de l'utilisateur est claire. Ne jamais faire répéter l'utilisateur.
- **Clarification Proactive** : En cas de doute réel ou d'ambiguïté sur une instruction, poser immédiatement des questions précises (avec options le cas échéant) au lieu d'avancer à tâtons.
- **Processus Interactifs / GUI (ex: Login, Authentification)** : Pour toute commande nécessitant une interaction visuelle de l'utilisateur (connexion web, navigateur, fenêtre de login type `notebooklm login`), **ouvrir immédiatement le processus dans une fenêtre GUI séparée et visible au premier plan** (ex: `Start-Process`), et ne jamais bloquer dans une tâche d'arrière-plan sans interface.


## Optimisation des tokens avec RTK (Rust Token Killer) — AGY & Gemini CLI

**Appliqué à** : AGY CLI (`agy`), Gemini CLI et tous les sous-agents.

- **Exécution Terminal** : Toujours préfixer les commandes Shell par `rtk` (ex: `rtk git status`, `rtk cargo test`, `rtk docker ps`, `rtk ls`, `rtk grep`, `rtk npx`, `rtk npm`, etc.) pour compresser automatiquement les logs et économiser 60–90% de tokens.
- **Auto-filtrage à la source** : RTK compresse 100% des sorties de build, de test et de commandes directement au niveau du terminal. Il est inutile d'invoquer un sous-agent de filtrage pour les sorties de commandes terminal.
- **Gros fichiers statiques sur disque** : Conserver l'utilisation d'un sous-agent de triage exclusivement pour la lecture de gros fichiers statiques enregistrés sur disque (dumps JSON/CSV, logs serveurs de 50 Mo).
- **Commandes utiles** :
  - `rtk gain` — Voir les statistiques d'économie de tokens.
  - `rtk proxy <cmd>` — Exécuter une commande brute sans filtrage en cas de débogage spécifique.

## Auto-Trigger Obsidian Context Retriever & LLM Wiki

### 🚨 RÈGLE D'AUTO-DÉCLENCHEMENT SANS INTERVENTION HUMAINE (Auto-Spawning on Context Gap)

**Déclencheur Automatique :**
Dès que l'utilisateur fait une demande concernant son vault Obsidian, ses notes, son infrastructure, une configuration, un VPS ou toute recherche d'information dans ses connaissances :

1. **INTERDICTION DE DEVINER OU D'HALLUCINER** la stack, la topologie VPS ou les scripts de build.
2. **INTERDICTION DE DEMANDER À L'UTILISATEUR** des informations qui existent déjà dans son système de connaissances.
3. **INTERDICTION D'EFFECTUER LA RECHERCHE DIRECTEMENT VIA VIEW_FILE / LS EN AGENT PRINCIPAL.**
4. **ACTION IMMÉDIATE :** Instancier de manière 100% autonome le sous-agent **`Obsidian-Context-Retriever`**.

**Mission transmise au Sous-Agent :**
- Chercher et extraire les fichiers de contexte clés (ex: les `CLAUDE.md` des projets concernés, la fiche VPS dédiée, la topologie réseau, la stack technique, les ports et variables d'environnement).
- Retourner un **Brief de Contexte Structuré** à l'Agent Principal pour qu'il puisse exécuter la demande initiale sans accroc.

## Sous-Agents Dédiés AGY CLI & Adaptations

### 1. `triage-contexte` (Triage & Filtrage de gros volumes)
- **Déclenchement** : Automatique dès qu'un gros fichier statique sur disque (log de >5 Mo, dump CSV/JSON massif, archive) ou un dossier très volumineux doit être analysé sans polluer le contexte de l'agent principal.
- **Adaptation AGY CLI** : Utilise les outils natifs AGY (`grep_search`, `view_file`, `list_dir`) et préfixe toutes les commandes shell par `rtk`. Se réfère au prompt rédigé dans `C:\Users\Juliann\.claude\agents\triage-contexte.md`.
- **Note RTK** : Pour les sorties de terminal/build/test, RTK compresse déjà automatiquement au niveau du terminal. `triage-contexte` est réservé aux gros fichiers enregistrés sur disque.

### 2. `web-researcher` (Recherche Web approfondie & Veille)
- **Déclenchement** : Automatique dès qu'une recherche web exhaustive, un état de l'art, une documentation d'API externe ou une veille sur un sujet en ligne est demandée.
### 3. `anytype-manager` (Gestion de la base orientée objet Anytype via MCP)
- **Déclenchement** : Automatique dès que la demande implique la recherche, la création, la mise à jour ou l'organisation de données stockées dans **Anytype** (espaces, objets, types, relations, collections).
- **Règle d'Orchestration** : Interdiction de traiter ces demandes avec les outils de fichiers plats (Obsidian / FS local). Instancier le sous-agent `anytype-manager`.
- **Adaptation AGY CLI** : Utilise les outils MCP Anytype (`API-*`). Se réfère au prompt rédigé dans `C:\Users\Juliann\.claude\agents\anytype-manager.md`.

## Confinement MCP Strict & Économie de Contexte

- **Isolation par sous-agent** : Chaque sous-agent possède un sous-ensemble d'outils MCP strictement confiné.
- **Agent Principal Léger** : L'agent principal délègue systématiquement l'exécution MCP aux sous-agents dédiés au lieu d'embarquer les dizaines de schémas de tools MCP dans sa propre boucle de contexte.


