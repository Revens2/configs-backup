# Pont public / privé (overlay local)

Ce dépôt public ne contient **aucune valeur sensible** : IPs, email et endpoints privés sont remplacés par des variables. Les vraies valeurs vivent dans le dépôt privé `memory-prive` (`overlay/vars.ps1`, jamais poussé), accessible uniquement à Juliann.

## Tokens utilisés dans les templates publics

| Token | Sens | Résolution |
|---|---|---|
| `https://mymcps.duckdns.org/vault-ro/mcp` | URL publique vault-ro (directement utilisable) | aucune |
| `brokermcp@vps-etude-nb` | SSH via alias (`~/.ssh/config`) | alias local |
| `${USER_EMAIL}` | Email du compte Claude (état archivé) | overlay privé |
| `{env:VPS_IA_LLM_BASEURL}` | Endpoint LLM du VPS-IA (machine hors ligne) | variable d'environnement locale, valeur dans l'overlay privé |

## Restauration sur un poste (accès public + privé requis)

```powershell
powershell -File C:\projet\memory-prive\overlay\restore-local.ps1
```

Le script charge les valeurs privées, pose les variables d'environnement persistantes (`setx`), substitue les tokens `${...}` dans les templates listés et écrit les fichiers live avec backup `*.bak-*` préalable. `-WhatIf` pour simuler, `-InstallTemplates` pour copier les templates vers les chemins live.

Règle : les IPs/ports/users d'infra restent dans le Vault Obsidian et les notes privées, jamais en dur ici.

## Récupération couplée (obligatoire, dans les deux sens)

Ce dépôt est **indissociable** de `memory-prive` (`C:\projet\memory-prive`, local-only, jamais poussé).

- Règle agent : toute demande de récupération/restauration de **l'un** des deux dépôts implique **l'autre**. Point d'entrée unique :
  ```powershell
  powershell -File C:\projet\memory-prive\recover-all.ps1
  ```
  (récupère le public + vérifie le privé + contrôle l'overlay).
- Si `memory-prive` est absent de la machine : restauration **INCOMPLÈTE** (templates publics seuls, sans secrets) — le signaler explicitement et réclamer le dépôt privé avant de déclarer terminé. Ne jamais bricoler les vraies valeurs depuis la mémoire de conversation.
