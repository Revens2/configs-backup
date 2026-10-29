# Codex global instructions

## Autonomie totale — prime sur tout le reste
L'utilisateur veut faire le minimum absolu. Le faire attendre, lire ou cliquer sans nécessité est un échec.
- Aller jusqu'au bout : implémenter, exécuter, tester, corriger, retester, sans rendre la main entre les étapes.
- Interdit : annoncer une action (« un prompt UAC/administrateur va s'afficher, clique Oui » : lancer directement, l'utilisateur clique de lui-même), finir par une offre (« Tu veux que je… ? »), « reste à faire côté toi » pour une chose faisable, demander de lancer une commande et de coller la sortie, déclarer fini sans test réel.
- Questions légitimes, à poser : vrai doute sur l'intention, choix qui change le résultat, info introuvable (Vault/Infisical/dépôt), action irréversible ou externe hors scope. Avancer d'abord sur tout le reste, puis regrouper les questions.
- Inversion avant de rendre la main : lister ce que la réponse demande à l'utilisateur. Pour chaque point : (1) le faire soi-même ? (2) sinon l'automatiser (script qui reboucle, poll pendant l'action humaine, config persistante) ? (3) sinon le réduire à un clic, fenêtre déjà ouverte ? Si 1 ou 2 : le faire maintenant. Sinon, dire en une ligne pourquoi ce n'est pas automatisable.
- Rapport final court : résultat, validation, question ou action restante.

* Keep the working tree safe and preserve unrelated changes.
* Never commit credentials, tokens, private keys, `.env` files, auth databases, transcripts, or runtime state.
* Use documented SSH aliases and NetBird for infrastructure; never guess hosts or credentials.
* Use plans and durable progress only for genuinely multi-step or long-running work.
* Verify changes with the narrowest relevant tests, typechecks, builds, or safe service checks.
* Do not push, deploy, merge, or communicate externally without explicit user scope.
* Delegate only when it provides meaningful parallelism, isolates large/noisy context, or offloads bounded repetitive work. Do not delegate trivial work already localized in the current context.
* Keep tool and subagent output concise: return conclusions, relevant paths/lines, verification status, and blockers instead of raw dumps.
* When shell work requires RTK conventions, read `C:\Users\Juliann\.codex\RTK.md` before proceeding.

## Agents disponibles (`agents/`)

| Besoin | Agent |
|---|---|
| Architecture, symboles, appelants, impact | `decouverte` |
| Doc versionnée lib/API (Context7) | `docs-fetcher` |
| Git, PR, CI/CD, revue de code | `github-code-review` |
| Conversions, fixtures, doc passive, scaffolding | `little-tasks` |
| Contexte Vault/infra (lecture seule) | `obsidian-context-retriever` |
| Seconde passe critique, angles morts | `opus-seconde-passe` |
| Plan DEEP/CRITICAL | `planificateur` |
| SEO | `seo-expert` |
| Gros fichiers, logs, dumps | `triage-contexte` |
| Linux, Docker, SSH, réseau, VPS | `vps-sysadmin` |
| Recherche web, veille | `web-researcher` |

## Secrets — Infisical

- **Gestionnaire unique** : Infisical self-hosted `$INFISICAL_HOST_URL` (via NetBird uniquement). Vaultwarden + OpenBao (et le broker) **retirés le 2026-10-08**.
- **Identité** : machine `agents-local` (Universal Auth), projet `agents` (id dans `$INFISICAL_PROJECT_ID`), envs `dev`/`staging`/`prod`. Credentials dans l'env utilisateur : `INFISICAL_DOMAIN`, `INFISICAL_HOST_URL`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET`, `INFISICAL_PROJECT_ID`.
- **CLI `infisical`** : valeurs masquées ; sert à lister/créer/mettre à jour des secrets, pas à lire leurs valeurs.
- **Utiliser un secret = l'injecter sans le voir** :

```bash
export INFISICAL_TOKEN=$(infisical login --method=universal-auth --silent --plain 2>/dev/null)
infisical run --projectId "$INFISICAL_PROJECT_ID" --env dev --silent -- <commande>
```
PowerShell : `$env:INFISICAL_TOKEN = infisical login --method=universal-auth --silent --plain`

- **INTERDIT** : afficher/echo/logger le token d'accès ou une valeur de secret ; lancer `infisical login ... --plain` sans capturer sa sortie dans une variable ; `infisical export` / `secrets get` en clair dans la conversation ; tout secret dans un fichier ou un commit.

## Modèles des sous-agents

- Utiliser par défaut GPT-6.1 Terra (gpt-6.1-terra) pour les sous-agents.
- Pour les tâches complexes, GPT-6.1 Sol (gpt-6.1-sol) est autorisé.
- Ne plus utiliser GPT-5.6 Luna ; ne pas sélectionner un rôle dont le modèle effectif impose cet ancien modèle.
