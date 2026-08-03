#!/usr/bin/env pwsh
<#
.SYNOPSIS
    SSH to a VPS with auto-Tailscale recovery and context loading.

.DESCRIPTION
    Connects to a predefined VPS using alias lookup. Automatically:
    1. Finds VPS details (IP, user, SSH key) from registry/memory
    2. Ensures Tailscale connectivity (start + account switch if needed)
    3. Opens SSH session
    4. Returns control to Claude with VPS context

.PARAMETER VpsAlias
    VPS alias (nexus, llm, etude, vps-ia, etc.)

.EXAMPLE
    .\vps-ssh.ps1 -VpsAlias nexus
    # Connects to NEXUS allermarche (100.76.236.21, ia_admin, cle_ai.ssh)

.EXAMPLE
    .\vps-ssh.ps1 -VpsAlias llm
    # Connects to vps-ia (100.99.75.104, oui, id_rsa_linux)
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$VpsAlias
)

$ErrorActionPreference = "Stop"

# VPS Registry (parsed from memory)
$VpsRegistry = @{
    "nexus" = @{
        "ip"        = "100.76.236.21"
        "user"      = "ia_admin"
        "key"       = "cle_ai.ssh"
        "memory"    = "nexus-vps-allermarche.md"
        "tailnet"   = "main"
    }
    "llm" = @{
        "ip"        = "100.99.75.104"
        "user"      = "oui"
        "key"       = "id_rsa_linux"
        "memory"    = "ufo-vps-llm.md"
        "tailnet"   = "main"
    }
    "vps-ia" = @{  # Alias for llm
        "ip"        = "100.99.75.104"
        "user"      = "oui"
        "key"       = "id_rsa_linux"
        "memory"    = "ufo-vps-llm.md"
        "tailnet"   = "main"
    }
    "etude" = @{
        "ip"        = "100.76.252.77"
        "user"      = "juliann"
        "key"       = "id_rsa"
        "memory"    = "vps-etude-tailscale.md"
        "tailnet"   = "drop.ecom28"
    }
}

# Lookup VPS
$vps = $VpsRegistry[$VpsAlias.ToLower()]
if (-not $vps) {
    Write-Error "Unknown VPS alias: $VpsAlias`nAvailable: $($VpsRegistry.Keys -join ', ')"
}

$ip = $vps.ip
$user = $vps.user
$keyName = $vps.key
$keyPath = "$env:USERPROFILE\$keyName"
$memory = $vps.memory
$tailnet = $vps.tailnet

# Validate SSH key exists
if (-not (Test-Path $keyPath)) {
    Write-Error "SSH key not found: $keyPath`nPlease verify key file exists."
}

Write-Host "🔌 Connecting to $VpsAlias ($ip)..." -ForegroundColor Cyan

# Ensure Tailscale connectivity
$ensureScript = Split-Path $MyInvocation.MyCommand.Path
$ensureScript = Join-Path $ensureScript "ensure-tailscale.ps1"

if (-not (Test-Path $ensureScript)) {
    Write-Error "ensure-tailscale.ps1 not found at $ensureScript"
}

Write-Host "📡 Checking Tailscale connectivity..." -ForegroundColor Yellow
& $ensureScript -TargetIP $ip
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to reach $ip on Tailscale. VPS may be down or account needs login."
}

Write-Host "✓ Tailscale OK, connecting via SSH..." -ForegroundColor Green

# SSH to VPS
$sshCmd = @(
    "ssh"
    "-i", $keyPath
    "-o", "StrictHostKeyChecking=accept-new"
    "$user@$ip"
)

Write-Host ""
Write-Host "━" * 60
Write-Host "SSH Command: ssh -i $keyName $user@$ip" -ForegroundColor DarkGray
Write-Host "━" * 60
Write-Host ""

# Open SSH session (user takes over terminal)
& $sshCmd
$exitCode = $LASTEXITCODE

# After SSH closes, return context info to Claude
Write-Host ""
Write-Host "━" * 60
Write-Host "SSH session closed (exit code: $exitCode)" -ForegroundColor Yellow
Write-Host "━" * 60
Write-Host ""
Write-Host "📚 Loading VPS context from memory: $memory" -ForegroundColor Cyan

# Signal to Claude that context should be loaded
# (Claude will read the memory file based on $memory filename)
Write-Host "Context: $memory" -ForegroundColor DarkGray

exit $exitCode

