---
name: deleg
description: >-
  Délègue la réflexion lourde, l'exploration de codebases volumineuses, la conception d'architecture et la planification complexe à ChatGPT Solo (ia.francestudent.org) via le pont MCP DevSpace et Chrome CDP, tout en conservant l'exécution locale déterministe, les modifications de fichiers et les tests pour l'agent local.
  Gère dynamiquement des conversations isolées et propres par défaut (ou la continuité de session via --continue) pour éviter toute pollution de contexte.
  À déclencher UNIQUEMENT lorsque l'utilisateur invoque explicitement `/deleg` ou demande expressément une délégation de réflexion. Si /deleg n'est pas appelé, le fonctionnement par défaut reste 100% standard et local.
---

# /deleg — Délégation de Réflexion & Planification à ChatGPT Solo

Ce skill organise la répartition de charge asymétrique entre **ChatGPT Solo** (Cerveau distant, analyse lourde, gros volumes) et **l'Agent Local** (Bras exécutif local : Antigravity AGY CLI / Claude Code CLI).

---

## ⚠️ Règle de Déclenchement & Fonctionnement par Défaut

- **Sans invocation explicite de `/deleg` :** Tu fonctionnes **exactement comme d'habitude**, en local, sans solliciter ChatGPT ni le pont distant.
- **Avec `/deleg <demande>` (ou `/deleg`) :** Tu bascules immédiatement dans le workflow de délégation de charge ci-dessous.

---

## Gestion Dynamique des Conversations & Isolation du Contexte

Pour éviter l'accumulation de messages hétérogènes et la dégradation de l'attention du modèle :

1. **Mode Vierge / Isolé (Comportement par défaut) :**
   - Chaque nouvelle mission `/deleg` navigue automatiquement sur une **nouvelle conversation propre** (`https://ia.francestudent.org/p/40f895c5-f4a1-439c-80bf-90db9c05510e`).
   - ChatGPT démarre avec un contexte à 100% disponible, sans historique polluant.
2. **Mode Continuité de Session (`--continue`) :**
   - Lorsque l'utilisateur souhaite itérer sur une tâche en cours dans le même projet, le script réutilise l'ID de conversation enregistré dans `<workspace>/.deleg/session.json`.
3. **Persistance Automatique :**
   - Dès la création du nouveau chat, l'URL unique (`https://ia.francestudent.org/chat/<uuid>`) est sauvegardée dans le workspace pour référence.

---

## Répartition des Rôles

| Rôle | Porteur | Responsabilités |
|---|---|---|
| **Réflexion & Conception** | **ChatGPT Solo** (`ia.francestudent.org`) | - Exploration de la codebase via le MCP DevSpace (`open_workspace`, `read`, `grep`)<br>- Analyse architecturale et diagnostic approfondi<br>- Détection d'anti-patterns et de régressions<br>- Rédaction du plan d'action détaillé pas à pas |
| **Exécution Locale & Gating** | **Agent Local** (AGY / Claude Code) | - Lecture et validation critique du plan d'action reçu<br>- Édition précise des fichiers sur disque (`replace_file_content`, `write_to_file`)<br>- Lancement des tests, linters, compilations et commandes locales<br>- Contrôle de sécurité strict et commits Git |

> [!IMPORTANT]
> **Principe de Gating Strict :** Les sorties et recommandations de ChatGPT sont traitées comme des **propositions techniques**. L'agent local vérifie systématiquement les chemins, les diffs et la cohérence avec le code réel avant d'appliquer.

---

## Workflow d'Exécution `/deleg`

Lorsqu'une commande `/deleg <votre demande>` est reçue :

### 1. Préparation du Contexte & Espace de Travail
1. Détermine le répertoire de travail actuel (`$pwd` ou workspace cible).
2. Vérifie la passerelle locale :
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Juliann\.claude\skills\claude-chatgpt-bridge\scripts\bridge_controller.ps1" -Action Status
   ```

### 2. Transmission du Paquet de Réflexion à ChatGPT
Exécute le script d'automatisation CDP pour injecter la mission dans une session propre de ChatGPT Solo :

```bash
node "C:/Users/Juliann/.agents/skills/deleg/scripts/delegate.mjs" --workspace "<CHEMIN_WORKSPACE>" --prompt "<DEMANDE_UTILISATEUR>" --output "<CHEMIN_WORKSPACE>/.deleg/plan.md"
```

Pour continuer une session existante :
```bash
node "C:/Users/Juliann/.agents/skills/deleg/scripts/delegate.mjs" --workspace "<CHEMIN_WORKSPACE>" --prompt "<DEMANDE_UTILISATEUR>" --continue --output "<CHEMIN_WORKSPACE>/.deleg/plan.md"
```

Le script :
- Connecte le navigateur Chrome via CDP (`127.0.0.1:9222`).
- Initialise un thread propre (ou reprend le fil existant).
- Demande à ChatGPT d'ouvrir le workspace via `open_workspace` et d'explorer la codebase.
- Attend la fin de la génération et enregistre le plan complet dans `.deleg/plan.md`.

### 3. Réception & Présentation du Plan
1. Lis le contenu du plan produit dans `.deleg/plan.md`.
2. Présente à l'utilisateur un résumé concis des choix d'architecture retenus par ChatGPT.

### 4. Exécution Déterministe Locale
1. Pour chaque étape du plan d'action :
   - Effectue les modifications de fichiers avec tes outils natifs.
   - Lance les tests et vérifications nécessaires.
2. Rapporte le résultat final validé à l'utilisateur.

---

## Commandes Utiles

- **Statut de la passerelle :**
  `powershell -ExecutionPolicy Bypass -File "C:\Users\Juliann\.claude\skills\claude-chatgpt-bridge\scripts\bridge_controller.ps1" -Action Doctor`
- **Redémarrer le pont si besoin :**
  `powershell -ExecutionPolicy Bypass -File "C:\Users\Juliann\.claude\skills\claude-chatgpt-bridge\scripts\bridge_controller.ps1" -Action Restart`
