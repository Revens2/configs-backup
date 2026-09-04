# Registre VPS — alias SSH

Résumé de `~/.ssh/config`, qui reste la **source de vérité**. Toutes les IP sont NetBird
(`10.200.0.0/16`) depuis le 2026-08-29, sauf `nas-ts` (dernier reliquat NetBird).

| Alias | IP | User | Clé | Rôle |
|---|---|---|---|---|
| `vps-nexus` | 10.200.61.52 | `ia_admin` | `~/cle_ai.ssh` | Prod NEXUS / allermarche. **Pas** `id_rsa_linux`. Joignable **uniquement** par NetBird. |
| `vps-etude`, `vps-etude-nb` | 10.200.114.203 | `juliann` | `~/.ssh/id_ed25519_juliann` | VPS étude (arm64). Porte le control plane NetBird et le Pi-hole. |
| `vps-etude-ubuntu` | 10.200.114.203 | `ubuntu` | `~/.ssh/id_ed25519_ubuntu` | Même machine, autre compte. |
| `vps-etude-ludo` | 10.200.114.203 | `ludo` | `~/.ssh/id_ed25519_ludo` | Même machine, autre compte. |
| `vps-ia` | 10.200.16.142 | `oui` | `~/.ssh/id_rsa_linux` | Serveur Qwen / ComfyUI. **Hors ligne** — dernière machine sous NetBird. |
| `vps-ia-lan` | 192.168.1.64 | `oui` | `~/.ssh/id_rsa_linux` | Même machine, accès LAN direct. |
| `nas` | 192.168.1.187 | `juliann` | `~/.ssh/id_ed25519_nas` | NAS Debian local (Lenovo 14w Gen 2), accès LAN. |
| `nas-nb` | 10.200.85.236 | `juliann` | `~/.ssh/id_ed25519_nas` | Même NAS par NetBird. |
| `nas-ts` | 100.122.237.32 | `juliann` | `~/.ssh/id_ed25519_nas` | Même NAS par NetBird — **reliquat**, préférer `nas-nb`. |
| `pc-travail` | 10.200.221.200 | `julia` | `~/.ssh/id_ed25519_juliann` | Poste distant. |

Noms internes également résolus : `<nom>.netbird.selfhosted` (Pi-hole hébergé sur `vps-etude`).

## Pièges connus
- Le NAS Debian ne démarre **pas** de façon autonome (GRUB figé) et plafonne à 4 Go de RAM.
- `vps-nexus` n'est **pas** joignable hors NetBird : aucune IP publique de secours.
- L'exit node WARP de `vps-etude` repose sur une `ip rule` non persistante, remise à plat par
  `systemd-networkd` au cron APT de 02:00.
