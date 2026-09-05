# Répartition actuelle des runtimes

Ce fichier décrit le **routage logique actuel**. Les versions de modèles, IP, ports et mesures de contexte vieillissent vite et ne sont pas figés ici ; les récupérer dans les configurations runtime, le Vault ou l'état réel.

## Claude Code CLI / Desktop — primaire

Usage principal : fondation d'applications, code complexe, architecture, refactors, migrations et infra à risque.

Forces :
- sous-agents spécialisés ;
- isolation de contexte ;
- CodeGraph / Graphify ;
- Vault/RAG ;
- Context7 ;
- browser/web ;
- hooks d'état ;
- modèles différenciés selon le spécialiste.

Deux comptes Claude peuvent se relayer. Le handoff est fait par `plan.md` + `progress.md`, pas par copie du transcript.

## ChatGPT — cerveau global + exécution connectée

Usage : brainstorming, architecture, recherche, compréhension de l'environnement, génération de prompts et, quand les outils connectés suffisent, exécution directe.

ChatGPT doit connaître la carte complète des runtimes et de leurs capacités. Pour du code local ou une tâche nécessitant le workspace de développement, il peut déléguer à Codex ou produire le prompt exact pour Claude/AGY.

Le Project Brainstorming consulte le RAG/Vault en priorité pour les faits dynamiques et les fichiers de contexte pour les capacités stables.

## Codex — secondaire fort / bras de ChatGPT

Runtime multi-agent complet. À utiliser comme alternative de premier rang à Claude, pour exécuter une tâche issue de ChatGPT, ou pour paralléliser quand cela apporte réellement quelque chose.

Conserver la même philosophie que Claude : FAST / STANDARD / DEEP / CRITICAL, spécialistes, état durable et contexte propre.

## Antigravity / AGY — fallback complet

AGY est la **solution de substitution à Claude Code quand le quota Claude est épuisé**. Il doit pouvoir prendre une grosse tâche et la mener de bout en bout avec le même niveau d'exigence.

Son mécanisme interne peut différer : Rules, Skills, Plugins, Hooks, MCP et capacités réellement exposées. Ne jamais faire semblant qu'un sous-agent existe s'il n'est pas callable ; reproduire sa fonction sous forme de phase/skill/plugin/worker disponible.

Une mission AGY complexe ne doit pas recevoir un prompt volontairement simplifié : elle garde planification, exploration, validation, état durable et handoff propre.

## Freebuff — worker économique

Usage : rapports, transformations, extraction, documentation passive et tâches textuelles peu risquées.

Pas de dépendance supposée à des MCP ou sous-agents. Donner un brief minimal et le payload strictement nécessaire. Ne pas lui transmettre toute la topologie de la stack.

## OpenCode + Qwen local — local / expérimental

Usage rare : tâches simples, essais locaux, gros volume peu exigeant en raisonnement, cas où le coût marginal local est intéressant.

Ne pas en faire le chemin critique d'une migration, d'une architecture ou d'une intervention risquée tant que la fiabilité tool-use/agentique du modèle local n'est pas suffisante.

## Règle de choix

1. Qualité maximale, fondation, code complexe, infra risquée → **Claude Code**.
2. Claude indisponible/quota épuisé → **AGY en fallback complet**.
3. Besoin d'un runtime fort multi-agent, exécution depuis ChatGPT ou parallélisation pertinente → **Codex**.
4. Rapport/transformation/tâche textuelle peu risquée → **Freebuff**.
5. Besoin local/offline/expérimental ou gros volume peu exigeant → **OpenCode/Qwen**.

La disponibilité réelle, les outils nécessaires, le blast radius et le coût de contexte priment sur cette préférence.

## Context engineering commun

- FAST : direct.
- STANDARD : spécialiste ciblé, sans plan lourd si inutile.
- DEEP : planification isolée + `plan.md` + `progress.md` compact.
- CRITICAL : DEEP + état read-only, sauvegarde, rollback et validation après chaque changement.

`progress.md` est un snapshot courant, pas un journal infini. L'historique détaillé va dans `errors.md` seulement si nécessaire. Ne pas réémettre le ToDo complet à chaque tour ; utiliser au besoin un micro-ancrage d'une ligne.

Voir `ENVIRONMENT-MAP.md` pour la carte canonique de routage.