# Lanceur générique script — mode exec-local.
# Ouvre un script au premier plan visible, attend son fichier-résultat, reprend seul.
# Usage :
#   .\Invoke-UserScript.ps1 -ScriptPath <ps1 validé> -ResultFile <fichier .ok> [-TimeoutSec 300]
# Le script cible doit écrire UNIQUEMENT un token (EXEC-OK / FAIL:raison) dans ResultFile.
param(
  [Parameter(Mandatory = $true)][string]$ScriptPath,
  [Parameter(Mandatory = $true)][string]$ResultFile,
  [int]$TimeoutSec = 300
)

if (!(Test-Path -LiteralPath $ScriptPath)) { throw "Script introuvable : $ScriptPath" }

# Validation syntaxe avant ouverture (jamais d'exécution non validée).
$errs = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($ScriptPath, [ref]$null, [ref]$errs)
if ($errs.Count -gt 0) { throw "Script invalide : $($errs[0].Message)" }

if (Test-Path -LiteralPath $ResultFile) { Remove-Item -LiteralPath $ResultFile -Force }

# Ouverture visible premier plan. Jamais -WindowStyle Hidden pour une action user.
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$ScriptPath`""

$start = Get-Date
while (!(Test-Path -LiteralPath $ResultFile) -and ((Get-Date) - $start).TotalSeconds -lt $TimeoutSec) {
  Start-Sleep -Seconds 2
}

if (!(Test-Path -LiteralPath $ResultFile)) { throw "Timeout ${TimeoutSec}s : aucun resultat, abandon propre." }
return (Get-Content -Raw -LiteralPath $ResultFile)
