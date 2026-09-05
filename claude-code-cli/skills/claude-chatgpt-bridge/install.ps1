param(
  [string]$ClaudeHome = "$env:USERPROFILE\.claude",
  [switch]$BackupExisting,
  [switch]$ForceOverwrite,
  [switch]$RegisterRestartTask
)

$ErrorActionPreference = "Stop"

if ($BackupExisting -and $ForceOverwrite) {
  throw "-BackupExisting and -ForceOverwrite are mutually exclusive. Backup is already the default."
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = $repoRoot
$targetRoot = Join-Path $ClaudeHome "skills"
$target = Join-Path $targetRoot "claude-chatgpt-bridge"

if (-not (Test-Path -LiteralPath (Join-Path $source "SKILL.md"))) {
  throw "Skill source not found: $source (missing SKILL.md)"
}

New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null

$isSamePath = $false
try {
  $sourceResolved = (Resolve-Path -LiteralPath $source).Path.TrimEnd("\", "/")
  $targetResolved = (Resolve-Path -LiteralPath $target -ErrorAction SilentlyContinue)
  if ($targetResolved) {
    $isSamePath = $sourceResolved.Equals($targetResolved.Path.TrimEnd("\", "/"), [System.StringComparison]::OrdinalIgnoreCase)
  }
} catch {
  $isSamePath = $false
}

if (-not $isSamePath) {
  if (Test-Path -LiteralPath $target) {
    if (-not $ForceOverwrite) {
      $stamp = Get-Date -Format "yyyyMMddHHmmss"
      $backup = "$target.backup-$stamp"
      Move-Item -LiteralPath $target -Destination $backup
      Write-Host "Backed up existing skill to $backup"
    } else {
      Remove-Item -LiteralPath $target -Recurse -Force
    }
  }

  New-Item -ItemType Directory -Force -Path $target | Out-Null
  Get-ChildItem -LiteralPath $source -Exclude ".git", "*.bak*" | Copy-Item -Destination $target -Recurse -Force
  Write-Host "Installed claude-chatgpt-bridge skill to $target"
} else {
  Write-Host "Skill already located at target: $target"
}

# Sync / junction to AGY CLI skills directory (~/.agents/skills)
$agySkills = Join-Path $env:USERPROFILE ".agents\skills"
if (Test-Path -LiteralPath $agySkills) {
  $agyTarget = Join-Path $agySkills "claude-chatgpt-bridge"
  if (-not (Test-Path -LiteralPath $agyTarget)) {
    try {
      New-Item -ItemType Junction -Path $agyTarget -Target $target | Out-Null
      Write-Host "Linked skill to AGY CLI: $agyTarget"
    } catch {
      Write-Host "Notice: could not create junction for AGY ($($_.Exception.Message))"
    }
  }
}

Write-Host "Reload skills or start Claude Code / AGY CLI to use it."
