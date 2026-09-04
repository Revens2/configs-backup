# CLAUDE.md — répertoire personnel Freebuff (`C:\Users\Juliann`)

Spécifique à ce répertoire. Le comportement des agents (délégation, confinement MCP, RTK,
stratégie de contexte, lien `CLAUDE.md`/`AGENTS.md`) est défini une seule fois dans
`~/.claude/CLAUDE.md` — ne pas le dupliquer ici.

## Sources de vérité Freebuff pour l'infrastructure

Avant de poser une question sur un VPS, une IP, un port, une config ou un credential :
chercher, dans cet ordre.

1. **Mémoire auto** — `~/.claude/projects/C--Users-Juliann/memory/` (index `MEMORY.md`).
2. **Vault Obsidian** — `G:\Mon Drive\Obsidian Vault\raw\assets\`, via le sous-agent
   `obsidian-context-retriever`. Fiches connues : `VPS_IA.md`, `Rapport_VPS_ETUDE.md`,
   `config_vps.md`, `NEXUS_*.md`, `Audit_VPS_OCI*.md`.

Ce n'est qu'en l'absence d'information dans ces deux sources qu'il faut me demander.

### Accès SSH — toujours par alias `~/.ssh/config`

`ssh vps-etude '<cmd>'`, jamais IP + `-i` + `user@`.

Toutes les IP sont des **IP NetBird** (`10.200.0.0/16`) depuis le 2026-08-29. Tailscale est
purgé de vps-nexus, de vps-etude et du poste ; les anciennes `100.x` ne répondent plus.

| Alias | Hôte | Rôle |
|---|---|---|
| `vps-nexus` | `10.200.61.52` (`ia_admin`) | Prod NEXUS / allermarche — clé `cle_ai.ssh`, **pas** `id_rsa_linux` |
| `vps-etude-nb` | `10.200.114.203` (`juliann`) | VPS étude (variantes `-ubuntu`, `-ludo`) |
| `vps-ia` | `10.200.16.142` (`oui`) | Serveur Qwen — clé `id_rsa_linux` (dernière machine encore sous Tailscale, hors ligne) |

Noms internes également résolus : `<nom>.netbird.selfhosted` (Pi-hole de vps-etude).

⚠️ **Ne jamais lancer `netbird up` sans `--allow-server-ssh=false`** : le SSH managé NetBird
détourne le port 22 par DNAT vers 22022 et le vrai `sshd` devient injoignable
(`REMOTE HOST IDENTIFICATION HAS CHANGED`). Un cycle `down`/`up` remet aussi à zéro la
sélection des routes du client.

Détails complets de chaque machine : fiches mémoire (`nexus-vps-allermarche`, `ufo-vps-llm`,
`vps-etude-acces`, `netbird-stack-reseau`) et vault. Ne pas les recopier ici.

⚠️ Ne pas boucler sur une connexion qui échoue. `Connection timed out` = port fermé ou sshd
down côté serveur ; changer de clé ou d'utilisateur ne sert à rien et risque de faire
blacklister l'IP. **Maximum 2 tentatives**, puis diagnostiquer :

```powershell
Test-NetConnection -Port 22 <ip>; netbird status
```

Si NetBird n'est pas `Management: Connected`, relancer le VPN avant toute nouvelle tentative —
le skill `vps-connect` automatise cette reprise (`scripts/ensure-netbird.ps1`).

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

## Amorçage d'un projet dans Freebuff

À l'ouverture de travaux sur un projet, si l'élément manque, le créer sans demander :

- **`.claudeignore`** — au minimum `*.log`, `dist/`, `coverage/`, `tmp/`.
- **Graphes** — `graphify extract <chemin> --code-only` puis `graphify tree`, et
  `codegraph init`. Les remettre à jour après toute fonctionnalité importante.

<!-- AUTO_GRAPH_START -->
## Revue de code, branches et PR

Toute tâche touchant une branche Git, une Pull Request, un pipeline CI/CD ou une demande de
revue passe par le sous-agent **`github-code-review`**, sans confirmation préalable. Il extrait
le diff (`gh pr diff` ou `git diff main...HEAD`), calcule le rayon d'impact avec
`code-review-graph` (venv `C:\Tools\crg-venv`, chemin absolu, `PYTHONUTF8=1`), et écrit un
rapport à 5 sections — Périmètre, Blast radius, Risques, Tests à lancer, Verdict — en
append-only dans le `progress.md` du dépôt analysé.

Un commentaire de PR (`gh pr comment`) est une action sortante : il est proposé en entier et
attend un accord explicite dans le fil. `git push`, `gh pr merge` et
`code-review-graph install` sont interdits à cet agent.

## Navigation du code

CodeGraph et Graphify sont installés sur ce répertoire. La règle d'usage (ordre
graphify → codegraph, chargement `ToolSearch` des outils différés, commandes de
réindexation) est définie une seule fois dans `~/.claude/CLAUDE.md`, § « Navigation du code — CodeGraph **et** Graphify, en paire ».
Ne pas la dupliquer ici.
<!-- AUTO_GRAPH_END -->

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
