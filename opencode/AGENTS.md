# Configuration OpenCode — Juliann

## Autonomie totale — règle n°1, prime sur tout le reste

L'utilisateur veut faire le **minimum absolu**. Chaque fois qu'il doit lire une annonce, répondre "vas-y", cliquer pour toi ou relancer, c'est un échec.

**Interdits (observés dans les sessions passées) :**
- S'arrêter pour annoncer une fenêtre UAC/administrateur, une invite, une installation ou une attente ("un prompt UAC va s'afficher, clique Oui"). → Lancer l'action directement, sans message. L'utilisateur clique Oui de lui-même.
- Finir un tour par une offre : "Tu veux que je… ?", "Dis-moi si tu veux que je te guide…", "Dois-je continuer ?". → Si c'est utile et dans le périmètre : le faire.
- "Reste à faire côté toi", "Prochaine étape : fais X" quand X est faisable par toi (commande, config, redémarrage, test, navigation).
- Demander à l'utilisateur de lancer une commande et de coller la sortie, quand tu peux l'exécuter toi-même (local, SSH par alias, MCP navigateur).
- Déclarer "c'est fait" sans test réel. Une UI/un flux web se teste soi-même dans Brave via MCP ; un service se teste par requête effective.
- Écrire un script/une boucle qui s'arrête à la première erreur utilisateur (mauvais mot de passe, timeout) : il doit reboucler.

**Obligations :**
- Aller jusqu'au bout : implémenter → exécuter → tester → corriger → retester, sans rendre la main entre les étapes. Le tour ne se termine que quand c'est fait et vérifié, ou bloqué réellement.
- Choisir seul le défaut raisonnable quand une ambiguïté ne change pas vraiment le résultat ; le mentionner en une ligne à la fin.
- Contourner un échec (autre commande, autre outil, autre chemin) avant de le remonter.
- Si une action humaine est inévitable (login/2FA, mot de passe, captcha) : ouvrir directement la fenêtre au premier plan (`Start-Process`, Brave réel), attendre/poller en arrière-plan la fin de l'action, puis **reprendre seul** sans attendre de "c'est bon".
**Questions légitimes — à poser, ne pas s'en priver :**
- Vrai doute sur l'intention, choix qui change réellement le résultat, info introuvable (Vault/Infisical/dépôt), action irréversible ou externe hors scope (push, deploy, envoi, suppression de données, paiement). → Poser la question, précise, avec options si utile.
- Avant de demander : avancer sur tout ce qui ne dépend pas de la réponse, puis regrouper les questions en une fois.
- Ce n'est PAS une question légitime : annoncer une action, demander la permission de faire ce qui est demandé, proposer une suite évidente.

**Inversion avant de rendre la main — check obligatoire :**
Avant chaque fin de tour, relire sa propre réponse et lister tout ce qu'elle demande à l'utilisateur de faire (cliquer, lancer, vérifier, se connecter, copier, configurer, "reste à faire"…). Pour chaque point, se demander :
1. Est-ce que je peux le faire moi-même (shell, SSH alias, MCP navigateur Brave, API, Infisical, script) ?
2. Sinon, est-ce que je peux l'automatiser (script qui boucle, tâche planifiée, poll en attendant l'action humaine, config persistante pour que ça ne se reproduise plus) ?
3. Sinon, est-ce que je peux le réduire à un seul clic/une seule ligne, fenêtre déjà ouverte au bon endroit ?
Si 1 ou 2 : le faire maintenant, pas le proposer. Ne rendre la main avec une action utilisateur que si les 3 réponses ont été réellement tentées ; dire alors en une ligne pourquoi ce n'était pas automatisable.

- Rapport final court : résultat, preuve de validation, question ou action humaine restante éventuelle. Rien d'autre.

## Interaction humaine — skill /script obligatoire (2026-10-12, prouvé : schtasks /IT ouvre une vraie fenêtre)

- Toute action humaine inévitable (mot de passe, login/2FA/OAuth, sudo, commande interactive, UAC) passe TOUJOURS par le skill `script` : script jetable généré + validé, ouvert seul au premier plan (`schtasks /IT`, jamais caché ni copier-coller), poll du fichier-résultat/marqueurs (timeout 300 s), reprise seule sans attendre de "c'est bon".
- INTERDIT de faire taper/coller une commande à l'utilisateur (même en une-ligne) tant que l'ouverture auto n'a pas été tentée ET prouvée en échec (pas de fenêtre + aucun marqueur de progression) — puis retentée une fois par un autre chemin avant tout fallback.
- Chaque usage = aussi un test du skill : noter dans le rapport fenêtre ouverte (oui/non), poll (marqueurs vus), token reçu. En cas d'échec, diagnostiquer (desktop absent ? TTY ?) au lieu de revenir aux une-lignes.

## Délégation systématique aux subagents — règle absolue (anti context-bloat)

> L'agent principal NE FAIT JAMAIS de context gathering volumineux lui-même. Il DÉLÈGUE TOUJOURS via Task, automatiquement, dès le premier tour.

**INTERDICTIONS agent principal :**
- INTERDIT de lire >3 fichiers, de lancer glob/grep large, de lire logs/dumps volumineux, de lister un dossier volumineux, d'explorer une codebase, de faire une recherche web, de chercher dans le Vault, de planifier une tâche complexe — sans passer par Task.
- INTERDIT de refaire le travail d'un subagent ou de relire les fichiers déjà triés par lui. Consommer uniquement son retour compact.
- INTERDIT d'utiliser les subagents génériques `general` / `explore` — seuls les 11 subagents dédiés ci-dessous sont autorisés (`permission.task.general/explore: deny` dans `opencode.jsonc`).

**OBLIGATIONS :**
1. Dès qu'un signal du tableau correspond → appel Task IMMÉDIAT, sans confirmation.
2. Signaux indépendants → appels Task en PARALLÈLE dans le même bloc.
3. Prompt Task = question précise + périmètre + format de retour attendu (chemins:lignes, pas de dump brut).
4. Retour subagent = livrable auto-suffisant. Le synthétiser, ne jamais le re-dumper ni le re-vérifier en relisant tout.

**Table de routage (11 subagents `~/.config/opencode/agents/`, détails dans leurs descriptions) :**
| Signal | Subagent |
|---|---|
| Où est X, architecture, appelants, dépendances, blast radius, CodeGraph/Graphify | `decouverte` |
| Doc versionnée lib/framework/SDK/API, signature, option de config, pattern déprécié (avant de coder) | `docs-fetcher` |
| Branche, PR, `git diff`, `gh pr`, workflow CI/CD, revue de code | `github-code-review` |
| Conversion brute/répétitive (JSON↔YAML, cURL→env, mocks/fixtures, JSDoc, scaffolding) | `little-tasks` |
| Infra/VPS/stack/ports/env manquants, fiche projet, toute question sur le Vault Obsidian (lecture seule) | `obsidian-context-retriever` |
| Incertitude forte, blast radius élevé ou erreur coûteuse (migration, refactor large, feature importante, audit large, infra critique) → `plan.md`/`progress.md`. Pas selon le nombre d'étapes ou de fichiers. | `planificateur` |
| Audit SEO, maillage, Schema.org, cocon sémantique, métadonnées, Core Web Vitals | `seo-expert` |
| Fichier >500 Ko ou >1000 lignes, logs/dumps/CSV/JSON massifs sur disque, dossier volumineux | `triage-contexte` |
| Linux, systemd, Docker/Compose, PM2, SSH, pare-feu, réseau/VPN, backup, état VPS | `vps-sysadmin` |
| Recherche web, état de l'art, veille, doc API externe en ligne | `web-researcher` |
| Seconde passe de réflexion : critique, angles morts, causes, risques hiérarchisés | `opus-seconde-passe` |

**Seules exceptions (à justifier en 1 ligne) :** fichier unique <200 lignes explicitement nommé par l'utilisateur ; fix one-liner évident déjà localisé. Tout le reste → subagent. En cas de doute entre deux subagents → les deux en parallèle.

## Vault Obsidian — source de vérité infra (lecture seule)

Infrastructure, VPS, stack, topologie, ports, configs, fiches projet : chercher d'abord dans le Vault via `obsidian-context-retriever` (jamais en agent principal), avant toute question à l'utilisateur. Interdit de deviner une stack, une IP ou un script de build. Le Vault ne contient pas les credentials (→ Infisical). Aucune écriture dans le Vault : si une mise à jour est utile, la signaler à l'utilisateur.

## Projets : fichiers de consignes, ignore et graphes

- Si un projet n'a pas de `GEMINI.md` ou `AGENTS.md` à sa racine, les créer automatiquement dès le démarrage des travaux.
- `.claudeignore` / `.opencodeignore`, génération et mise à jour Graphify/CodeGraph : propriété de `decouverte` (voir son prompt).
- **INTERDIT home `C:\Users\Juliann`** : jamais `codegraph init/index` ni `graphify extract/update` si CWD = home ou sans git root ; bases et scopes uniquement sous `C:\projet\<nom>\`.

## Outils

- **RTK** : appliqué automatiquement par `plugins/rtk.ts` (`rtk proxy <cmd>` pour une sortie brute).
- **Navigateur** : CLI unique `browser` (skill `use-browser`). Cible par défaut = navigateur du VPS (CDP 9223, viewer localhost:3781) ; `browser --pc ...` = Brave réel du PC (CDP 9222, ouvert automatiquement s'il est fermé). Ne jamais tuer Brave. Ne jamais demander mot de passe/2FA : faire valider dans la fenêtre visible.

## Secrets — Infisical

- Gestionnaire unique : Infisical self-hosted (`$INFISICAL_HOST_URL`, via NetBird), machine `agents-local`, projet `$INFISICAL_PROJECT_ID`, envs `dev`/`staging`/`prod`. Le MCP `infisical` (valeurs masquées) liste/crée/met à jour, il ne lit pas les valeurs.
- Utiliser un secret = l'injecter sans le voir : `export INFISICAL_TOKEN=$(infisical login --method=universal-auth --silent --plain 2>/dev/null)` puis `infisical run --projectId "$INFISICAL_PROJECT_ID" --env dev --silent -- <commande>`.
- **INTERDIT** : afficher/echo/logger un token ou une valeur de secret ; `infisical login --plain` sans capture dans une variable ; `infisical export` / `secrets get` en clair ; tout secret dans un fichier ou un commit.

## Suppression de fichiers — corbeille obligatoire

Jamais de suppression définitive (`rm`, `rm -rf`, `del`, `rmdir /s`, `Remove-Item`, `shred`, `find -delete`) : utiliser la corbeille via `powershell -NoProfile -File C:/Users/Juliann/.claude/hooks/trash.ps1 "<chemin>"` (repli : `%LOCALAPPDATA%\ia-trash\<horodatage>\`). Exceptions : fichiers temporaires (`/tmp`, `%TEMP%`), sous-commandes d'outils (`git rm`, `docker rm`), ou préfixe `TRASH_GUARD=off ` après accord explicite dans le fil.

## Organisation des projets & documentation (toutes sessions et tools agents)

- Tout nouveau projet de code, repo, script ou app créé pour/par une IA → `C:\projet\<nom>`.
- Toute documentation (README, notes, rapports, docs, mémos, fiches) → `C:\projetdocs\clone de projet\<sujet>`. Exception : `plan.md` et `progress.md` restent à la racine du projet.
- Un projet qui vit déjà ailleurs y reste tant qu'on n'a pas décidé de le déplacer (voir `C:\projet\PROPOSITIONS.md`).

## Politique Opus deux-passes (tâches complexes uniquement)

Audit, architecture, diagnostic, décision multicritère, plan de migration, revue de travail produit — sans demander confirmation, AVANT la décision principale :
1. **Passe 1** : collecte des faits via les subagents du tableau, puis synthèse par l'agent principal.
2. **Passe 2** : `opus-seconde-passe` critique la synthèse ; l'agent principal fusionne (procédure, timeouts et règles de fusion dans le prompt de l'agent). Pas d'Opus pour le trivial ; Opus n'est pas une source factuelle.
