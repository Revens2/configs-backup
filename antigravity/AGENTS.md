# Instructions globales — Antigravity CLI (Juliann)

Règles comportementales valables dans toutes les sessions de ce poste.

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

Pour toute tâche complexe — audit, architecture, diagnostic, comparaison, décision
multicritère, recherche approfondie, plan de migration, revue d'un travail produit —
travail systématique en deux passes, SANS demander confirmation :

1. **Passe 1 — agent principal** : explore et vérifie d'abord toi-même (preuves,
   métriques, contradictions, anomalies, détails techniques, signaux faibles).
2. **Passe 2 — `opus-seconde-passe`** (`.agents/agents/opus-seconde-passe.md`,
   règle `.agents/rules/opus-deux-passes.md`) : critique l'analyse, détecte les angles
   morts, regroupe par causes, hiérarchise risques et actions, améliore la synthèse.

Contexte utile uniquement (faits vérifiés, contraintes, incertitudes, résultats d'outils,
points à critiquer). Timeout MCP : 1 retry court, puis continuer sur passe 1 seule.
Fusion par l'agent principal : ne jamais supprimer un constat utile ignoré par la passe 2 ;
preuves d'abord, incertitude explicitée. Pas de passe 2 pour trivial/déterministe ;
Opus n'est pas source factuelle.

## Mémoire utilisateur locale

Appliquer `LOCAL-AGENT-MEMORY.md` lorsque le contexte personnel peut changer la réponse : récupérer le contrat/contexte depuis le Vault avant de demander à l'utilisateur de répéter ; capturer automatiquement les corrections/préférences/objectifs explicites dans la couche privée ; garder toute inférence en proposition non vérifiée ; ne jamais stocker de secret en clair.

Pour une décision nécessaire, utiliser un choix natif cliquable si le runtime le permet, sinon un QCM A/B/C très court avec la recommandation en premier.
