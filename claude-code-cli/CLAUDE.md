# CLAUDE.md — répertoire personnel (`C:\Users\Juliann`)

Spécifique à ce répertoire. Le comportement des agents (délégation, confinement MCP, RTK,
stratégie de contexte, réplication `gemini.md`) est défini une seule fois dans
`~/.claude/CLAUDE.md` — ne pas le dupliquer ici.

## Sources de vérité pour l'infrastructure

Avant de poser une question sur un VPS, une IP, un port, une config ou un credential :
chercher, dans cet ordre.

1. **Mémoire auto** — `~/.claude/projects/C--Users-Juliann/memory/` (index `MEMORY.md`).
2. **Vault Obsidian** — `G:\Mon Drive\Obsidian Vault\raw\assets\`, via le sous-agent
   `obsidian-context-retriever`. Fiches connues : `VPS_IA.md`, `Rapport_VPS_ETUDE.md`,
   `config_vps.md`, `NEXUS_*.md`, `Audit_VPS_OCI*.md`.

Ce n'est qu'en l'absence d'information dans ces deux sources qu'il faut me demander.

### Accès SSH — toujours par alias `~/.ssh/config`

`ssh vps-etude '<cmd>'`, jamais IP + `-i` + `user@`.

| Alias | Hôte | Rôle |
|---|---|---|
| `vps-nexus` | `100.76.236.21` (`ia_admin`) | Prod NEXUS / allermarche — clé `cle_ai.ssh`, **pas** `id_rsa_linux` |
| `vps-etude` | `100.76.252.77` (`juliann`) | VPS étude (variantes `-ubuntu`, `-ludo`) |
| `vps-ia` | `100.99.75.104` (`oui`) | Serveur Qwen — clé `id_rsa_linux` |

Détails complets de chaque machine : fiches mémoire (`nexus-vps-allermarche`, `ufo-vps-llm`,
`vps-etude-tailscale`) et vault. Ne pas les recopier ici.

⚠️ Ne pas boucler sur une connexion qui échoue. `Connection timed out` = port fermé ou sshd
down côté serveur ; changer de clé ou d'utilisateur ne sert à rien et risque de faire
blacklister l'IP. **Maximum 2 tentatives**, puis diagnostiquer :

```powershell
Test-NetConnection -Port 22 <ip>; tailscale status
```

Si Tailscale est inactif (`unexpected state: NoState`) ou si le SSH expire, relancer le VPN
avant toute nouvelle tentative — le skill `vps-connect` automatise cette reprise.

## Amorçage d'un projet

À l'ouverture de travaux sur un projet, si l'élément manque, le créer sans demander :

- **`.claudeignore`** — au minimum `*.log`, `dist/`, `coverage/`, `tmp/`.
- **Graphes** — `graphify extract <chemin> --code-only` puis `graphify tree`, et
  `codegraph init`. Les remettre à jour après toute fonctionnalité importante.

<!-- AUTO_GRAPH_START -->
## Navigation du code — CodeGraph & Graphify

Ce projet est indexé par deux graphes. **Passe par eux avant `Grep`/`Glob`/lecture
exhaustive** : ils répondent en une passe là où une recherche textuelle demande
dix allers-retours.

- **CodeGraph** (`.codegraph/`) — graphe AST + recherche sémantique, via MCP
  `mcp__codegraph__*`. Point d'entrée : `codegraph_context` (décris la tâche,
  récupère tout le contexte utile). Détail des outils : section « CodeGraph —
  Codebase Intelligence » plus bas dans ce fichier.
- **Graphify** (`graphify-out/graph.json`) — graphe de connaissance du projet
  (code *et* docs), communautés et god nodes.

### Graphify — commandes
Toute question sur l'architecture, le rôle d'un fichier ou le contenu du projet
se traite **d'abord comme une requête graphify** (skill `graphify`) :
- `graphify query "<question>"` — traversée BFS depuis la question.
- `graphify explain "<noeud>"` — explication d'un nœud et de son voisinage.
- `graphify path "A" "B"` — chemin le plus court entre deux nœuds.
- `graphify god-nodes` — les hubs architecturaux du projet.
- `graphify affected "X"` — ce qui est impacté par un changement sur X.

Réindexation : `codegraph index` et `graphify update .` (les deux sont incrémentaux).
<!-- AUTO_GRAPH_END -->

