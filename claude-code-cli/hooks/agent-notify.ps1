param(
  [ValidateSet('completed', 'needs-input')]
  [string]$Event = 'completed'
)

try {
  Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
  Add-Type -AssemblyName System.Drawing -ErrorAction Stop
  [console]::beep(880, 180)
  $title = if ($Event -eq 'needs-input') { 'Agent needs your input' } else { 'Agent finished' }
  $message = if ($Event -eq 'needs-input') { 'Claude Code is waiting for a question, permission, or answer.' } else { 'Claude Code finished the current response.' }
  $notify = New-Object System.Windows.Forms.NotifyIcon
  $notify.Icon = [System.Drawing.SystemIcons]::Information
  $notify.BalloonTipTitle = $title
  $notify.BalloonTipText = $message
  $notify.Visible = $true
  $notify.ShowBalloonTip(5000)
  Start-Sleep -Milliseconds 5200
  $notify.Dispose()
} catch {
  try { [console]::beep(880, 180) } catch {}
}
exit 0
