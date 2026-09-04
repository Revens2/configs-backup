---
name: vps-connect
description: "Se connecter à un VPS par alias SSH et rétablir NetBird quand la connexion échoue. Utiliser sur « connecte-toi à vps-nexus », « ssh vps-etude », ou dès qu'une commande SSH/curl/ping vers une IP 10.200.x échoue (timeout, connection refused, no route to host). Résout l'alias, vérifie NetBird, relance le VPN si besoin, puis rejoue la commande — maximum 2 tentatives."
---

# vps-connect — accès VPS par alias, avec reprise NetBird

## Invariants

1. **Toujours par alias `~/.ssh/config`** : `ssh vps-nexus '<cmd>'`.
   Jamais `ssh -i <clé> user@IP`. L'alias porte déjà l'hôte, l'utilisateur et la clé.
2. **Toutes les IP sont NetBird** (`10.200.0.0/16`). Tailscale est purgé depuis le 2026-08-29 ;
   une IP en `100.x` est morte, sauf `nas-ts`.
3. **Maximum 2 tentatives SSH.** Un `Connection timed out` signifie port fermé ou `sshd` down
   côté serveur : changer de clé ou d'utilisateur ne sert à rien et risque de faire blacklister
   l'IP. Après 2 échecs → diagnostiquer, ne pas boucler.
4. **`netbird up` sans `--allow-server-ssh=false` est interdit.** Le SSH managé NetBird détourne
   le port 22 par DNAT vers 22022 ; le vrai `sshd` devient injoignable et SSH crie
   `REMOTE HOST IDENTIFICATION HAS CHANGED`. Un cycle `down`/`up` remet aussi à zéro la
   sélection des routes du client.

## Procédure

### 1. Résoudre l'alias
Lire `references/vps-registry.md`. Si l'alias demandé n'y est pas, chercher dans
`~/.ssh/config` — c'est la source de vérité, le registre n'en est qu'un résumé.

### 2. Tenter la connexion (tentative 1/2)
```bash
ssh -o ConnectTimeout=8 <alias> 'hostname; uptime'
```
Si ça passe → aller au 4.

### 3. Rétablir NetBird, puis retenter (tentative 2/2)
```powershell
& "C:\Users\Juliann\.claude\skills\vps-connect\scripts\ensure-netbird.ps1" -TargetIP 10.200.61.52
```
Le script : vérifie le service, `netbird status`, relance avec `--allow-server-ssh=false` si le
management n'est pas connecté, puis teste le port 22 de la cible.
Sortie **0** = cible joignable, retenter le `ssh` une fois. Sortie **1** = arrêter et rapporter.

`ensure-netbird.ps1` est un cmdlet PowerShell (`Test-NetConnection` n'a pas d'équivalent POSIX) :
sa sortie n'est pas compressée par RTK. Ne pas le lancer en boucle.

### 4. Charger le contexte
Après une connexion réussie, lire la fiche mémoire de la machine
(`~/.claude/projects/C--Users-Juliann/memory/`) et résumer : rôle, services, points d'attention.
Ne pas redemander à l'utilisateur une information qui est dans le registre ou dans la mémoire.

## Diagnostic après 2 échecs

```powershell
Test-NetConnection -Port 22 <ip>; netbird status
```

| Symptôme | Cause probable | Action |
|---|---|---|
| `Management: Disconnected` | VPN à terre | `ensure-netbird.ps1`, puis **une** relance |
| Port 22 fermé, management OK | `sshd` down ou UFW | La machine est joignable : passer par `vps-sysadmin` |
| `REMOTE HOST IDENTIFICATION HAS CHANGED` | SSH managé NetBird actif (DNAT 22→22022) | `netbird up --allow-server-ssh=false` |
| `Permission denied (publickey)` | Mauvaise clé | Vérifier l'`IdentityFile` de l'alias — ne pas essayer d'autres clés au hasard |
| Timeout sur `vps-ia` | Machine hors ligne (dernière sous Tailscale) | Attendu. Ne pas insister. |

## Références
- `references/vps-registry.md` — alias, IP NetBird, utilisateurs, clés, rôles.
- `scripts/ensure-netbird.ps1` — reprise de connexion VPN.
