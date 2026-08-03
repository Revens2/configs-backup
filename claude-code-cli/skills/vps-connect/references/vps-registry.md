# VPS Registry (extracted from memory)

This is a parsed registry of all VPS instances extracted from your memory. Used by vps-connect skill to auto-resolve SSH parameters.

## NEXUS allermarche

**Alias**: `nexus`  
**Type**: Production MT5 SaaS  
**Tailscale IP**: `100.76.236.21`  
**Public IP**: `141.253.118.248`  
**SSH User**: `ia_admin`  
**SSH Key**: `cle_ai.ssh` (ED25519)  
**OS**: Ubuntu 24.04.4 LTS (arm64, Oracle KVM)  
**Memory file**: `nexus-vps-allermarche.md`

### Key facts
- Dual NOPASSWD sudo access
- Supply-chain hardened (2026-06-16)
- Docker stack: nexustrade-server, db, redis
- PostgreSQL: user `nexus` on `nexustrade_auth` DB
- Important: NOT `id_rsa_linux` (rejected by server)

### Ports
- LAN: `10.0.0.136`
- Docker GW: `172.18.0.1`

---

## vps-ia (VPS LLM / UFO)

**Alias**: `llm`, `vps-ia`  
**Type**: LLM inference server (UFO backend)  
**Tailscale IP**: `100.99.75.104`  
**SSH User**: `oui`  
**SSH Key**: `id_rsa_linux` (NOT `cle_ai.ssh`)  
**OS**: Ubuntu 24.04.4 LTS (arm64)  
**Memory file**: `ufo-vps-llm.md`

### Key facts
- **Model**: Qwen 3.6 35B MoE (MTP optimized)
- **Hardware**: RTX 5070 12GB VRAM
- **Framework**: llama.cpp with spec-draft-mtp
- **Performance**: ~86 tokens/sec
- **Key optimizations**: FA_ALL_QUANTS, KV q8_0
- **Inference port**: 8000
- **fail2ban**: Enabled (SSH spam protection)

### Related
- Hermes Desktop (Windows) connects to this via port 8000
- ComfyUI FLUX.2 also uses this (img2img/inpaint)
- Memory: `hermes-vps-llm-chain.md`, `comfyui-flux2-vps.md`

---

## vps-etude (VPS Étude)

**Alias**: `etude`  
**Type**: Study/experimental server  
**Tailscale IP**: `100.76.252.77`  
**SSH User**: `juliann` (or `oui`)  
**SSH Key**: `~/.ssh/id_rsa` (default)  
**OS**: Ubuntu 24.04.4 LTS (arm64)  
**Tailnet**: `drop.ecom28` (account-specific)  
**Memory file**: `vps-etude-tailscale.md`

### Key facts
- CouchDB LiveSync at `:5984`
- vault_rag (4394 notes) on this VPS
- Server.py provides plaintext RAG
- push_vault.py syncs to this VPS
- Tailscale account: `juliann.ploquin@gmail.com` (on drop.ecom28 tailnet)

---

## Connection matrix

| Alias | IP | User | Key | Tailnet | Status |
|-------|-----|------|-----|---------|--------|
| nexus | 100.76.236.21 | ia_admin | cle_ai.ssh | (main) | Production |
| llm | 100.99.75.104 | oui | id_rsa_linux | (main) | Active |
| etude | 100.76.252.77 | juliann | ~/.ssh/id_rsa | drop.ecom28 | Active |

## How vps-connect uses this

1. User says: `"connect to nexus"`
2. vps-connect looks up `nexus` in this registry
3. Extracts: IP=100.76.236.21, user=ia_admin, key=cle_ai.ssh
4. Runs ensure-tailscale.ps1 to check connectivity
5. SSHes: `ssh -i C:\Users\Juliann\cle_ai.ssh ia_admin@100.76.236.21`
6. Loads memory file `nexus-vps-allermarche.md` for context

---

## Troubleshooting by VPS

### NEXUS allermarche won't connect
- Check: `cle_ai.ssh` exists and readable
- **NOT** id_rsa_linux (wrong key = Permission denied)
- User must be `ia_admin` (not `ubuntu` or `root`)
- Tailscale: On account that has `100.76.236.21` visible

### vps-ia connection hangs
- Check: `id_rsa_linux` is used (not cle_ai.ssh)
- fail2ban may have blocked SSH if > 5 attempts — wait ~10 min
- Verify user is `oui` (not `root`)

### vps-etude "No route to host"
- Check Tailscale account is on `drop.ecom28` tailnet
- May need: `tailscale switch juliann.ploquin@gmail.com`
- Default account (main tailnet) can't see `100.76.252.77`

