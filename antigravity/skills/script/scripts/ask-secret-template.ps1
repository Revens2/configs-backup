# Template script — secret-local (repris de /change-mdp §3bis, porté Windows).
# Placeholders remplacés par l'agent à la génération :
#   __TITRE__       : intitulé affiché (ex. "Mot de passe Glances", "DEMO demande-user")
#   __RESULT_FILE__ : chemin complet du fichier-résultat (ex. $env:TEMP\demande-user-demo-*.ok)
#   __ATTENDU__     : vide = vrai secret (double saisie aveugle) ; non vide = mode démo (ex. DEMO-OK)
# Ce script ne log JAMAIS le secret. Le fichier-résultat contient UNIQUEMENT un token.
param()

$Titre = "__TITRE__"
$ResultFile = "__RESULT_FILE__"
$Attendu = "__ATTENDU__"

Write-Host "=== $Titre ===" -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($ResultFile)) {
  Write-Host "ABANDON : RESULT_FILE vide" -ForegroundColor Red
  exit 1
}

if (-not [string]::IsNullOrEmpty($Attendu)) {
  # --- Mode démo : valeur test non sensible, saisie en clair ---
  $saisie = Read-Host "Tape exactement $Attendu (test, valeur non sensible)"
  if ($saisie -ceq $Attendu) {
    "DEMO-VALIDE $(Get-Date -Format o)" | Set-Content -LiteralPath $ResultFile -Encoding utf8 -NoNewline
    Write-Host "DEMO-VALIDE : token ecrit, tu peux laisser l'agent reprendre." -ForegroundColor Green
  } else {
    "FAIL:saisie-differente $(Get-Date -Format o)" | Set-Content -LiteralPath $ResultFile -Encoding utf8 -NoNewline
    Write-Host "FAIL : tu as tape autre chose que $Attendu." -ForegroundColor Red
    exit 1
  }
  return
}

# --- Mode réel : double saisie aveugle, secret jamais stocké ni affiché ---
$s1 = Read-Host "Nouveau secret (saisie aveugle)" -AsSecureString
$s2 = Read-Host "Confirme (saisie aveugle)" -AsSecureString

function Unwrap($s) {
  $p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($p) } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)
  }
}

$p1 = Unwrap $s1
$p2 = Unwrap $s2
$s1.Dispose(); $s2.Dispose()

if ([string]::IsNullOrEmpty($p1) -or ($p1 -cne $p2)) {
  "FAIL:saisie-differente-ou-vide $(Get-Date -Format o)" | Set-Content -LiteralPath $ResultFile -Encoding utf8 -NoNewline
  Write-Host "ABANDON : secrets differents ou vides." -ForegroundColor Red
  $p1 = $null; $p2 = $null
  exit 1
}

$p1 = $null; $p2 = $null
"SECRET-OK $(Get-Date -Format o)" | Set-Content -LiteralPath $ResultFile -Encoding utf8 -NoNewline
Write-Host "SECRET-OK : saisie validee, tu peux laisser l'agent reprendre." -ForegroundColor Green
