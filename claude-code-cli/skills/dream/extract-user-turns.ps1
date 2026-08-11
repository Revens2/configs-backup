# Emits ONLY the user's own typed turns from Claude Code transcripts.
# Enforces constraint 0d: tool output, tool_result blocks, assistant turns,
# system reminders, hook output and sidechains are excluded at the source,
# so they can never reach the model as a candidate memory.
param(
  [int]$Days = 7,
  [string]$Root = "$env:USERPROFILE\.claude\projects",
  [string]$Out  = "$env:USERPROFILE\.claude\memory\.turns.md"
)
$ErrorActionPreference = 'Stop'
$since = (Get-Date).AddDays(-$Days)
$sb = [System.Text.StringBuilder]::new()
$kept = 0

foreach ($f in Get-ChildItem $Root -Recurse -Filter *.jsonl | Where-Object LastWriteTime -gt $since | Sort-Object LastWriteTime) {
  $head = $true
  foreach ($line in [System.IO.File]::ReadLines($f.FullName)) {
    if ($line -notmatch '"type":"user"') { continue }
    try { $o = $line | ConvertFrom-Json } catch { continue }
    if ($o.type -ne 'user' -or $o.isMeta -eq $true -or $o.isSidechain -eq $true) { continue }

    $c = $o.message.content
    $text = $null
    if ($c -is [string]) {
      $text = $c
    } else {
      # An array containing ANY tool_result is a tool-output turn, not the user speaking.
      if ($c | Where-Object { $_.type -eq 'tool_result' }) { continue }
      $text = ($c | Where-Object { $_.type -eq 'text' } | ForEach-Object { $_.text }) -join "`n"
    }
    if ([string]::IsNullOrWhiteSpace($text)) { continue }

    # Strip injected wrappers that are not the user's words.
    $text = [regex]::Replace($text, '(?s)<system-reminder>.*?</system-reminder>', '')
    $text = [regex]::Replace($text, '(?s)<local-command-stdout>.*?</local-command-stdout>', '')
    $text = [regex]::Replace($text, '(?s)<command-(name|message|args)>.*?</command-\1>', '')
    $text = $text.Trim()

    # Injected as user-role turns, but NOT the user typing. Constraint 0d.
    if ($text -match '^<task-notification>')            { continue }  # harness task result
    if ($text -match '^This session is being continued') { continue } # compaction summary
    if ($text -match '^Caveat: The messages below')      { continue }
    if ($text -match '^Resume the paused workflow')      { continue }
    if ($text -match '^\[Request interrupted')           { continue }
    if ($text.Length -lt 3) { continue }

    if ($head) {
      [void]$sb.AppendLine("`n## session: $($f.Directory.Name)/$($f.BaseName)  ($($f.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))")
      $head = $false
    }
    [void]$sb.AppendLine("`n[USER] $text")
    $kept++
  }
}

New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
Set-Content -Path $Out -Value $sb.ToString() -Encoding utf8
Write-Output "user turns extracted: $kept -> $Out"
