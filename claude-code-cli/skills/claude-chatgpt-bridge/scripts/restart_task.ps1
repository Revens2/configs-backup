[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [ValidateSet("Install", "Uninstall", "Status", "Run")]
  [string]$Action = "Status",

  [ValidatePattern('^[^*?\\/]+$')]
  [string]$TaskName = "ClaudeChatGPTBridge-Reboot",

  [switch]$AtLogon,

  [string]$ControllerPath
)

$ErrorActionPreference = "Stop"
if (-not $ControllerPath) {
  $ControllerPath = Join-Path $PSScriptRoot "bridge_controller.ps1"
}
try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
} catch {
  # Non-console hosts may not expose OutputEncoding.
}

function Write-Json($obj) {
  [Console]::Out.WriteLine(($obj | ConvertTo-Json -Depth 8))
}

function Get-TaskOrNull {
  Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}

switch ($Action) {
  "Status" {
    $task = Get-TaskOrNull
    Write-Json ([ordered]@{
      action = "Status"
      taskName = $TaskName
      installed = [bool]$task
      state = if ($task) { [string]$task.State } else { $null }
      controllerPath = $ControllerPath
      mode = if ($task -and $task.Triggers -and @($task.Triggers).Count -gt 0) { "at-logon" } else { "on-demand" }
    })
    break
  }

  "Install" {
    $resolvedController = (Resolve-Path -LiteralPath $ControllerPath).Path
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $windowsPowerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
    $taskArguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Action Reboot' -f $resolvedController.Replace('"', '""')
    $taskAction = New-ScheduledTaskAction -Execute $windowsPowerShell -Argument $taskArguments -WorkingDirectory (Split-Path -Parent $resolvedController)
    $settings = New-ScheduledTaskSettingsSet `
      -MultipleInstances IgnoreNew `
      -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
      -AllowStartIfOnBatteries `
      -DontStopIfGoingOnBatteries
    $principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
    $trigger = if ($AtLogon) { New-ScheduledTaskTrigger -AtLogOn -User $identity } else { $null }
    $taskParams = @{
      Action = $taskAction
      Settings = $settings
      Principal = $principal
      Description = if ($AtLogon) { "Automatic startup restart for Claude Code ChatGPT Bridge on Windows logon." } else { "On-demand verified restart for Claude Code ChatGPT Bridge." }
    }
    if ($trigger) { $taskParams.Trigger = $trigger }
    $task = New-ScheduledTask @taskParams

    $existingTask = Get-TaskOrNull
    if ($existingTask) {
      $existingAction = @($existingTask.Actions)[0]
      $sameExecutable = ([string]$existingAction.Execute).Equals($windowsPowerShell, [System.StringComparison]::OrdinalIgnoreCase)
      $sameController = ([string]$existingAction.Arguments).IndexOf($resolvedController, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
      if (-not $sameExecutable -or -not $sameController) {
        throw "A different scheduled task already uses the name '$TaskName'. Refusing to overwrite it."
      }
    }
    if ($PSCmdlet.ShouldProcess($TaskName, "Register on-demand bridge Reboot task")) {
      Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
    }
    Write-Json ([ordered]@{
      action = "Install"
      taskName = $TaskName
      installed = [bool](Get-TaskOrNull)
      controllerPath = $resolvedController
      runAs = $identity
      runLevel = "Limited"
      multipleInstances = "IgnoreNew"
      automaticTriggers = if ($AtLogon) { 1 } else { 0 }
      note = "This same-user task improves recovery reliability; it is not an OS-account security boundary."
    })
    break
  }

  "Run" {
    $task = Get-TaskOrNull
    if (-not $task) { throw "Scheduled task is not installed: $TaskName" }
    $requested = $false
    if ($PSCmdlet.ShouldProcess($TaskName, "Start on-demand bridge Reboot task")) {
      Start-ScheduledTask -TaskName $TaskName
      $requested = $true
    }
    Write-Json ([ordered]@{
      action = "Run"
      taskName = $TaskName
      requested = $requested
      asynchronous = $true
      expectedResultPath = (Join-Path $env:LOCALAPPDATA "devspace-bridge\controller-result.json")
      note = "Run only requests the task. Verify controller-result.json and run controller Doctor before claiming success."
    })
    break
  }

  "Uninstall" {
    $task = Get-TaskOrNull
    if ($task -and $PSCmdlet.ShouldProcess($TaskName, "Unregister bridge Reboot task")) {
      Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }
    Write-Json ([ordered]@{
      action = "Uninstall"
      taskName = $TaskName
      installed = [bool](Get-TaskOrNull)
    })
    break
  }
}
