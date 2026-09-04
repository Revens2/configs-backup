<#
.SYNOPSIS
  Rétablit la connectivité NetBird puis vérifie que la cible répond sur SSH.

.DESCRIPTION
  Remplace ensure-tailscale.ps1 (Tailscale purgé le 2026-08-29).
  Exit 0 : la cible répond sur le port demandé.
  Exit 1 : elle ne répond pas — NE PAS boucler, diagnostiquer côté serveur.

  Invariant : tout `netbird up` porte --allow-server-ssh=false. Sans ce drapeau, le SSH managé
  NetBird détourne le port 22 par DNAT vers 22022 et le vrai sshd devient injoignable.

.EXAMPLE
  .\ensure-netbird.ps1 -TargetIP 10.200.61.52
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$TargetIP,
    [int]$Port = 22,
    [int]$TimeoutSeconds = 25
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "[ensure-netbird] $msg" }

function Test-Target {
    $r = Test-NetConnection -ComputerName $TargetIP -Port $Port -WarningAction SilentlyContinue
    return $r.TcpTestSucceeded
}

# --- 0. Le binaire existe-t-il ? -------------------------------------------------
$netbird = Get-Command netbird -ErrorAction SilentlyContinue
if (-not $netbird) {
    $candidate = 'C:\Program Files\NetBird\netbird.exe'
    if (Test-Path $candidate) { $netbird = $candidate } else {
        Write-Step 'ERREUR : netbird introuvable (PATH et C:\Program Files\NetBird).'
        exit 1
    }
} else { $netbird = $netbird.Source }

# --- 1. Cible déjà joignable ? ---------------------------------------------------
if (Test-Target) {
    Write-Step "OK : $TargetIP`:$Port repond deja. Aucune action."
    exit 0
}
Write-Step "$TargetIP`:$Port ne repond pas. Verification de NetBird."

# --- 2. Service Windows ----------------------------------------------------------
$svc = Get-Service -Name 'NetBird' -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -ne 'Running') {
    Write-Step "Service NetBird arrete ($($svc.Status)) -> demarrage."
    Start-Service -Name 'NetBird'
    Start-Sleep -Seconds 3
}

# --- 3. État du management -------------------------------------------------------
$status = (& $netbird status 2>&1 | Out-String)
if ($status -match 'Management:\s*Connected') {
    Write-Step 'Management deja connecte.'
} else {
    Write-Step 'Management non connecte -> netbird up --allow-server-ssh=false'
    & $netbird up --allow-server-ssh=false 2>&1 | Out-String | Write-Verbose
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        Start-Sleep -Seconds 2
        $status = (& $netbird status 2>&1 | Out-String)
    } until ($status -match 'Management:\s*Connected' -or (Get-Date) -gt $deadline)

    if ($status -notmatch 'Management:\s*Connected') {
        Write-Step "ECHEC : management toujours deconnecte apres $TimeoutSeconds s."
        Write-Step 'Cause probable : control plane (vps-etude) injoignable, ou session expiree.'
        exit 1
    }
    Write-Step 'Management connecte.'
}

# --- 4. Re-test de la cible ------------------------------------------------------
# Un cycle up remet a zero la selection des routes : laisser le temps a la route de remonter.
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
do {
    if (Test-Target) {
        Write-Step "OK : $TargetIP`:$Port repond."
        exit 0
    }
    Start-Sleep -Seconds 3
} until ((Get-Date) -gt $deadline)

Write-Step "ECHEC : NetBird est connecte mais $TargetIP`:$Port ne repond pas."
Write-Step 'La machine est probablement joignable au niveau reseau mais sshd est down, ou UFW bloque.'
Write-Step 'NE PAS retenter en boucle. Diagnostiquer cote serveur.'
exit 1
