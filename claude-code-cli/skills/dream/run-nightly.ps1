# Unattended /dream runner, invoked by Task Scheduler.
# Read-only by contract: the only file it may produce is dream-report.md.
$ErrorActionPreference = 'Continue'
$log = "$env:USERPROFILE\.claude\memory\dream-run.log"
$rpt = "$env:USERPROFILE\.claude\memory\dream-report.md"
$turns = "$env:USERPROFILE\.claude\memory\.turns.md"
$env:DREAM_UNATTENDED = '1'

# Keep the log bounded so a nightly job cannot fill the disk.
if ((Test-Path $log) -and (Get-Item $log).Length -gt 2MB) {
  Move-Item $log "$log.1" -Force
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content $log "`n===== dream run $stamp ====="

$before = if (Test-Path $rpt) { (Get-Item $rpt).LastWriteTime } else { [datetime]::MinValue }

# Extract transcripts HERE, not from inside the agent. A nested shell launched by the
# agent is blocked by the PreToolUse hook, and doing it here means the unattended run
# needs no shell tool at all - Read and Write are enough.
try {
  $x = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\skills\dream\extract-user-turns.ps1" -Days 7 2>&1 | Out-String
  Add-Content $log $x.Trim()
} catch {
  Add-Content $log "EXTRACTOR FAILURE: $_"
  Add-Content $log "===== exit 3 (no transcripts, aborted) ====="
  exit 3
}
if (-not (Test-Path "$env:USERPROFILE\.claude\memory\.turns.md")) {
  Add-Content $log "EXTRACTOR produced no .turns.md - aborting rather than reporting on nothing."
  Add-Content $log "===== exit 3 ====="
  exit 3
}

# The agent gets NO write tool and NO shell tool: it is literally read-only, and the
# harness blocks writes under ~/.claude/ anyway. It prints the report to stdout and THIS
# script performs the single authorised write. That keeps 0b's path and makes 0b's
# read-only guarantee structural rather than a matter of the model behaving.
try {
  $prompt = "/dream" + [Environment]::NewLine +
    "UNATTENDED RUN. No human is present. You have no write tool and no shell tool - " +
    "do not attempt to use one, and do not ask for permission. " +
    "Read " + $turns + " for the user's turns; it is already extracted. " +
    "Compare against the memory store, then print the complete dream-report markdown " +
    "as your entire reply, starting with the line '# dream-report'. " +
    "No preamble, no closing remarks, no offer to apply. Apply nothing. Commit nothing."
  $out = & "$env:USERPROFILE\.local\bin\claude.exe" -p $prompt `
      --allowedTools "Read,Glob,Grep" 2>&1 | Out-String
  $code = $LASTEXITCODE

  if ($out -match '(?s)(#\s*dream-report.*)') {
    [System.IO.File]::WriteAllText($rpt, $Matches[1].Trim(), (New-Object System.Text.UTF8Encoding($false)))
    Add-Content $log ("report written: " + (Get-Item $rpt).Length + " bytes")
  } else {
    Add-Content $log "AGENT PRODUCED NO REPORT BODY. Raw reply follows:"
    Add-Content $log $out.Trim()
    if ($code -eq 0) { $code = 4 }
  }
} catch {
  Add-Content $log "LAUNCH FAILURE: $_"
  $code = 1
}

$after = if (Test-Path $rpt) { (Get-Item $rpt).LastWriteTime } else { [datetime]::MinValue }
if ($after -le $before) {
  Add-Content $log "WARNING: dream-report.md was not refreshed - the run produced nothing."
  if ($code -eq 0) { $code = 2 }
}
# NO PUSH. NO COMMIT. An auto-push to origin (Revens2/configs-backup, a PUBLIC repo) was
# present here and was removed on 2026-08-04: it would publish memory content to GitHub on
# every nightly run. The unattended run writes exactly one file, dream-report.md, and that
# file is gitignored. Do not re-add a push step.

$end = Get-Date -Format 'HH:mm:ss'
Add-Content $log "===== exit $code at $end ====="
exit $code

