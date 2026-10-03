# Claude Code Desktop — règles stables

Ce fichier est l'addendum comportemental propre à Claude Code Desktop dans `configs-backup`. Il ne remplace ni les règles projet ni la configuration Claude Code commune.

## Projet d'abord

Avant toute intervention dans un dépôt, lire et respecter son `CLAUDE.md` / `AGENTS.md` réellement présent.

Pour **ARION**, `CLAUDE.md` et `AGENTS.md` pointent vers `ARION.md` : **`ARION.md` est donc l'autorité projet** pour l'état, les garde-fous scientifiques et l'orchestration. Ne duplique pas ici ses données dynamiques.

## Multi-agent Desktop

- FAST : direct.
- STANDARD : un spécialiste ciblé par défaut ; deux seulement si les questions sont indépendantes.
- DEEP/CRITICAL avec au moins deux workstreams indépendants : privilégier **2 à 4 sous-agents réellement disponibles en parallèle**.
- Chaque brief précise mission, périmètre, dépendances, sources autorisées, interdits et livrable compact.
- Les sous-agents restent **read-only par défaut** ; le parent conserve la synthèse, les décisions et l'application des changements applicatifs.
- Ne jamais faire écrire deux agents sur le même fichier ou sur des interfaces fortement couplées en parallèle sans arbitrage préalable.
- Après une implémentation significative, demander une revue indépendante adaptée lorsque cela apporte un gain réel.
- Si les sous-agents ne sont pas disponibles dans la session Desktop, le signaler et poursuivre en mode dégradé sans simuler leur usage.

## ARION

Sur ARION, exploiter le fan-out surtout pour isoler les axes réellement indépendants : code/architecture, géométrie/science/preuves, Quest/Unity/Kotlin/C#, données/logs/docs.

La délégation ne crée **aucun droit nouveau** sur gels, holdouts, protocoles, sorties attendues, vérités scellées ou tokens scientifiques. Les restrictions du projet s'appliquent aussi aux briefs, copies et synthèses. Consensus d'agents ≠ preuve expérimentale.

## Continuité

Pour les missions DEEP/CRITICAL, handoff par `plan.md` + `progress.md` compact ; `errors.md` seulement si un historique détaillé est nécessaire. Ne pas transporter un transcript complet entre sessions/comptes.

Ce fichier de backup ne prouve pas à lui seul qu'une session Desktop live l'a chargé : vérifier l'état réellement déployé lorsque cela affecte la mission.

## Mémoire utilisateur locale

Appliquer `LOCAL-AGENT-MEMORY.md` lorsque le contexte personnel peut changer la réponse : récupérer le contrat/contexte depuis le Vault avant de demander à l'utilisateur de répéter ; capturer automatiquement les corrections/préférences/objectifs explicites dans la couche privée ; garder toute inférence en proposition non vérifiée ; ne jamais stocker de secret en clair.

Pour une décision nécessaire, utiliser un choix natif cliquable si le runtime le permet, sinon un QCM A/B/C très court avec la recommandation en premier.
