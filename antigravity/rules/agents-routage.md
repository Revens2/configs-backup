# Délégation aux subagents — règle d'exécution (AGY)

Les 11 spécialistes vivent dans `~/.gemini/config/agents/` et s'appellent avec `invoke_subagent`.
Cette table est **exécutoire**, pas indicative : si un signal correspond, l'appel part au premier
tour, sans confirmation et sans que l'utilisateur ait à le demander.

## Table de routage

| Signal | Subagent |
|---|---|
| Où est X, architecture, rôle d'un fichier, appelants, dépendances, blast radius, CodeGraph/Graphify | `decouverte` |
| Documentation versionnée d'une lib/framework/SDK/API, signature, option, pattern déprécié — **avant de coder contre une dépendance** | `docs-fetcher` |
| Branche Git, `git diff`, Pull Request, workflow CI/CD, revue de code | `github-code-review` |
| Conversion brute ou répétitive (JSON↔YAML, cURL→env, tables, fixtures, JSDoc, scaffolding) | `little-tasks` |
| Contexte projet/VPS/stack/ports/env manquant, décision passée, lecture du vault Obsidian | `obsidian-context-retriever` |
| Écriture dans le vault : créer/corriger/déplacer/renommer/réparer/réindexer une note | `obsidian-vault-maintainer` |
| Tâche > 3 étapes, > 2 fichiers, migration, refactor, nouvelle fonctionnalité, audit, infra | `planificateur` |
| Audit SEO, maillage interne, Schema.org, cocon sémantique, métadonnées, Core Web Vitals | `seo-expert` |
| Fichier statique > 500 Ko ou > 1 000 lignes, dump, log, dossier volumineux | `triage-contexte` |
| Linux, systemd, Docker/Compose, PM2, SSH, pare-feu, réseau/VPN, backup, état d'un serveur | `vps-sysadmin` |
| Recherche web, veille, état de l'art, doc d'une API externe en ligne | `web-researcher` |

## Obligations

1. **Déléguer avant d'explorer.** L'agent principal ne fait pas lui-même de collecte volumineuse :
   pas de balayage de dépôt, pas de lecture de gros fichier, pas de recherche web, pas de recherche
   vault, pas de planification lourde sans passer par le subagent compétent.
2. **Appels indépendants en parallèle**, dans le même tour.
3. **Brief d'appel** = question précise + périmètre + format de retour attendu. Le rapport d'un
   subagent n'est pas visible de l'utilisateur : l'agent principal en relaye l'essentiel.
4. **Ne pas refaire le travail du subagent** : consommer son retour compact, ne pas relire les
   fichiers qu'il a déjà triés.

## Exceptions (à justifier en une ligne)

- Fichier unique de moins de 200 lignes explicitement nommé par l'utilisateur.
- Correction évidente déjà localisée, sans exploration.
- Question factuelle triviale ou information déjà présente dans le fil.

En cas de doute entre deux subagents, appeler les deux en parallèle.
