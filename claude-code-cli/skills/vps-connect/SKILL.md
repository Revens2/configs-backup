---
name: vps-connect
description: "Auto-connect to VPS with context loading. Use when user says 'connect to [vps-name]' or 'ssh to [vps-name]'. Automatically resolves VPS details from memory, handles Tailscale account switching, and loads VPS context. Also auto-recovers failed Tailscale connections (SSH timeouts, connection refused, 'No route to host', etc.) by restarting Tailscale and cycling accounts."
---

# vps-connect — SSH to any VPS with auto-context

## When to use

### Primary: Direct VPS connection
- User asks: "Connect to NEXUS", "SSH to vps-ia", "Connect to etude"
- Trigger: `/connect vps <vps-name>` or `claude connect <vps-name>`
- **Do NOT ask for details** — find VPS config in memory (memory/*.md), SSH automatically, load context.

### Secondary: Auto-heal failed Tailscale
- Any SSH/curl/ping to a `100.x.y.z` or `*.ts.net` address fails with:
  - `ssh: connect to host <ip> port 22: Connection timed out / refused`
  - `curl: (7) Failed to connect` or `(28) Operation timeout`
  - `ping` to tailnet IP fails; `unexpected state: NoState`
- **Do NOT ask first** — run recovery, retry the command.

---

## How to connect to a VPS

### Step 1: Find VPS config in memory
Query your memory index (`MEMORY.md`) for VPS details. Expected memory files:
- `nexus-vps-allermarche.md` → NEXUS (100.76.236.21)
- `ufo-vps-llm.md` → vps-ia (100.99.75.104)
- `vps-etude-tailscale.md` → vps-etude (100.76.252.77)

Each file contains:
- Tailscale IP (100.x.y.z)
- SSH user (e.g., `ia_admin`, `oui`, `juliann`)
- SSH key path (e.g., `cle_ai.ssh`, `id_rsa_linux`)
- Tailscale account email (if account-specific)

### Step 2: Ensure Tailscale connectivity
Run the recovery script:

```powershell
& "C:\Users\Juliann\.claude\skills\vps-connect\scripts\ensure-tailscale.ps1" -TargetIP 100.76.236.21
```

Script does:
1. Start Tailscale if not running
2. Test connectivity to `-TargetIP`
3. If unreachable, cycle every Tailscale account until one reaches the target
4. Exit 0 (success) or exit 1 (all accounts failed)

**On exit 0**: Proceed to step 3.  
**On exit 1**: Inform user: "Tailscale can't reach [IP] on any account; VPS may be down or login required."

### Step 3: SSH + load context
```bash
ssh -i "$env:USERPROFILE\<ssh-key>" <user>@<tailscale-ip>
```

**Immediately after successful SSH**, load context by:
- Reading the VPS memory file (e.g., `nexus-vps-allermarche.md`)
- Presenting key facts: IP, user, services, recent context
- Offering to run commands (e.g., "Run `systemctl status nexustrade*`?")

---

## SSH key locations
All keys stored in `$env:USERPROFILE\` (e.g., `C:\Users\Juliann\`):
- `cle_ai.ssh` — ED25519, for NEXUS allermarche (ia_admin)
- `id_rsa_linux` — for vps-ia (user oui)
- (default ~/.ssh/id_rsa) — for vps-etude (juliann)

---

## Known VPS aliases
| Alias | Host | IP | User | Key | Tailnet |
|-------|------|----|----|-----|---------|
| `nexus` | NEXUS allermarche | 100.76.236.21 | ia_admin | cle_ai.ssh | (main) |
| `llm` / `vps-ia` | vps-ia (LLM) | 100.99.75.104 | oui | id_rsa_linux | (default) |
| `etude` | vps-etude | 100.76.252.77 | juliann | ~/.ssh/id_rsa | drop.ecom28 |

---

## Troubleshooting

### "Connection timed out" even after recovery script
→ VPS may be down or firewall blocked. Check Tailscale status: `tailscale status`

### "Permission denied (publickey)"
→ Wrong SSH key. Verify key file and user name in memory. For vps-ia, must use `id_rsa_linux` not `cle_ai.ssh`.

### Tailscale account switching needed
→ Recovery script auto-cycles. If it still fails, user may need manual login: `! & "C:\Program Files\Tailscale\tailscale.exe" login`

### "Unknown configuration file option" on remote
→ VPS config issue. Log it but don't block connection.

---

## Script reference
See `scripts/ensure-tailscale.ps1` for Tailscale recovery logic.  
See `references/vps-registry.md` for parsed VPS registry extracted from memory.
