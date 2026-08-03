#Requires -Version 5.1
<#
  ensure-tailscale.ps1 — bring Tailscale up and make -TargetIP reachable,
  switching accounts if needed. Exit 0 = reachable, 1 = failed.
#>
[CmdletBinding()]
param(
  [string]$TargetIP = "100.76.252.77",
  [int]$UpTimeoutSec = 30,     # wait for backend Running
  [int]$PeerTimeoutSec = 20    # wait for target to answer after Running
)

# Continue (not Stop): native-exe stderr (e.g. tailscale "no matching peer")
# must NOT abort the script under PowerShell 5.1.
$ErrorActionPreference = "Continue"
$TS = "C:\Program Files\Tailscale\tailscale.exe"
if (-not (Test-Path $TS)) { Write-Output "ERROR tailscale.exe not found at $TS"; exit 2 }

function State { try { (& $TS status --json 2>$null | ConvertFrom-Json).BackendState } catch { "NoState" } }

function Wait-Running([int]$sec) {
  $end = (Get-Date).AddSeconds($sec)
  while ((Get-Date) -lt $end) {
    if ((State) -eq "Running") { return $true }
    Start-Sleep -Seconds 2
  }
  return ((State) -eq "Running")
}

function Test-Target([int]$sec) {
  # Consider reachable if tailscale ping OR TCP:22 succeeds within window.
  $end = (Get-Date).AddSeconds($sec)
  while ((Get-Date) -lt $end) {
    $p = & $TS ping --timeout=3s --c=1 $TargetIP 2>$null
    if ($p -match "pong|via") { return $true }
    try {
      $t = New-Object Net.Sockets.TcpClient
      $iar = $t.BeginConnect($TargetIP, 22, $null, $null)
      if ($iar.AsyncWaitHandle.WaitOne(3000) -and $t.Connected) { $t.Close(); return $true }
      $t.Close()
    } catch {}
    Start-Sleep -Seconds 2
  }
  return $false
}

function Bring-Up {
  if ((State) -ne "Running") {
    $out = & $TS up --timeout=15s 2>&1
    if ($out -match "https://login") { Write-Output "LOGIN-REQUIRED $out" }
  }
  return (Wait-Running $UpTimeoutSec)
}

# --- 1) current account first ---
Write-Output "Target=$TargetIP  active-state=$(State)"
if (Bring-Up) {
  if (Test-Target $PeerTimeoutSec) {
    $acct = ((& $TS switch --list 2>$null) -split "`n" | Where-Object { $_ -match '\*' }) -replace '\s+',' '
    Write-Output "REACHABLE via current account [$acct]"
    exit 0
  }
  Write-Output "Current account up but target unreachable -> trying other accounts"
} else {
  Write-Output "Backend not Running on current account -> trying other accounts"
}

# --- 2) cycle accounts ---
$rows = (& $TS switch --list 2>$null) -split "`n" | Where-Object { $_ -match '@' }
$active = ($rows | Where-Object { $_ -match '\*' })
$others = $rows | Where-Object { $_ -notmatch '\*' }

foreach ($row in $others) {
  $acct = ($row.Trim() -split '\s+')[-1]
  if (-not $acct) { continue }
  Write-Output "Switching -> $acct"
  & $TS switch $acct 2>&1 | Out-Null
  Start-Sleep -Seconds 2
  if (-not (Bring-Up)) { Write-Output "  $acct did not reach Running"; continue }
  if (Test-Target $PeerTimeoutSec) { Write-Output "REACHABLE via $acct"; exit 0 }
  Write-Output "  $acct Running but target still unreachable"
}

# --- 3) restore original active account, give up ---
if ($active) {
  $orig = ($active.Trim() -split '\s+')[-1] -replace '\*',''
  if ($orig) { & $TS switch $orig 2>&1 | Out-Null }
}
Write-Output "UNREACHABLE - no account could reach $TargetIP (VPS down or login required)"
exit 1

