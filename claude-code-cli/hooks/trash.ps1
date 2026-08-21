<#
.SYNOPSIS
    Envoie un ou plusieurs fichiers/dossiers à la corbeille Windows au lieu de les supprimer.

.DESCRIPTION
    Remplaçant de `rm` / `Remove-Item` pour la stack IA : rien n'est détruit,
    tout est récupérable depuis la corbeille (clic droit > Restaurer).

    Si la corbeille n'est pas disponible (lecteur réseau, partition sans $Recycle.Bin),
    l'élément est déplacé dans %LOCALAPPDATA%\ia-trash\<horodatage>\ — récupérable
    manuellement, jamais effacé automatiquement.

.EXAMPLE
    powershell -NoProfile -File trash.ps1 .\build .\vieux.log
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
    [string[]]$Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName Microsoft.VisualBasic

$fallbackRoot = Join-Path $env:LOCALAPPDATA 'ia-trash'
$exitCode = 0

foreach ($p in $Path) {
    $items = @()
    try { $items = @(Resolve-Path -LiteralPath $p -ErrorAction Stop) }
    catch {
        Write-Warning "Introuvable, ignoré : $p"
        $exitCode = 1
        continue
    }

    foreach ($item in $items) {
        $full = $item.ProviderPath
        try {
            if (Test-Path -LiteralPath $full -PathType Container) {
                [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory(
                    $full,
                    [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,
                    [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)
            }
            else {
                [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(
                    $full,
                    [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,
                    [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)
            }
            Write-Host "Corbeille <- $full"
        }
        catch {
            # Corbeille indisponible : repli sur un dossier de quarantaine horodaté.
            $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
            $dest = Join-Path $fallbackRoot $stamp
            New-Item -ItemType Directory -Path $dest -Force | Out-Null
            Move-Item -LiteralPath $full -Destination $dest -Force
            Write-Host "Quarantaine <- $full  (=> $dest)"
        }
    }
}

exit $exitCode
