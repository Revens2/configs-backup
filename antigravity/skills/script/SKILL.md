---
name: script
description: /script — demander une saisie ou une exécution à l'utilisateur sur PC Windows (mot de passe, clé API, 2FA, commande UAC/admin, ssh -t VPS) via script jetable auto-démarré + poll. Utiliser dès que /script est invoqué, qu'un secret doit être tapé par l'utilisateur, qu'une action est impossible pour l'agent, ou qu'un /change-mdp ou vps-oneshot-ssh attend une validation humaine, même sans demande explicite du skill.
---

# script

Reprend le fonctionnement de `/change-mdp` et le généralise : l'agent génère seul un
script jetable, le valide, l'ouvre directement au premier plan, n'agit plus,
attend le fichier-résultat, puis reprend seul. L'utilisateur ne touche jamais au script
(ouverture auto, ou une seule ligne à coller en fallback sans desktop).

## Quand l'utiliser

- Mot de passe, clé d'API, token, 2FA, captcha à faire taper par l'utilisateur.
- Commande impossible pour l'agent : UAC/admin, fenêtre GUI, session interactive,
  `ssh -t` avec `getpass`/`sudo -v` côté VPS.
- Complément de `/change-mdp` (secret VPS) et `vps-oneshot-ssh` (one-shot VPS) :
  dès qu'il faut une validation humaine, passer par ce skill pour l'ouverture + poll.

## Principe (repris de /change-mdp)

1. L'agent génère le script en local Temp, jamais de secret en dur dedans.
2. L'agent valide la syntaxe. Jamais d'exécution non validée.
3. L'agent démarre le script tout seul au premier plan (`schtasks /IT`, jamais caché, zéro copier-coller).
4. L'agent ne fait plus rien et poll le fichier-résultat (timeout 300 s).
   Le fichier-résultat contient UNIQUEMENT un token (`SECRET-OK`, `DEMO-VALIDE`,
   `EXEC-OK`, `FAIL:raison`), jamais le secret.
5. L'agent lit le token, nettoie Temp, reprend seul, vérifie sans secrets.

## Les 3 modes

- **A. secret-local** : mot de passe / clé API tapée sur le PC.
  Template `scripts/ask-secret-template.ps1`. Saisie aveugle + confirmation
  (`Read-Host -AsSecureString`), zéro log du secret, écrit `SECRET-OK <horodatage>`.
- **B. exec-local** : truc à exécuter sur le PC que l'agent ne peut pas faire.
  Génère un `exec-<nom>-<AAAAMMJJ-HHMMSS>.ps1` qui fait l'action puis écrit
  `EXEC-OK` ou `FAIL:raison` dans le fichier-résultat. Lanceur :
  `scripts/Invoke-UserScript.ps1`.
- **C. secret-vps / exec-vps** : délègue la génération à `/change-mdp` ou
  `vps-oneshot-ssh` (`scp` + `chmod 700` + une ligne `ssh -t <alias> "sudo bash /tmp/<nom>"`),
   sans copier-coller : écrit un `ssh-<nom>.bat` (chemin sans espaces) contenant la ligne
   `ssh -t <alias> "sudo bash /tmp/<nom>"`, le démarre via `schtasks /IT`,
   puis poll `ssh <alias> 'ls -l /tmp/<nom> || echo SUPPRIME-OK'`.

## Règles SECRETS (inviolables, comme /change-mdp §0)

- Ne JAMAIS afficher, répéter, logger, commiter un mot de passe / hash / token.
- Ne JAMAIS `cat` un fichier de credentials : noms seuls (`cut -d: -f1`).
- Saisie TOUJOURS côté terminal utilisateur (aveugle + confirmation), jamais en
  argument, jamais via l'agent.
- Script généré sans secret : paramètres codés en dur, secret uniquement dans
  la saisie utilisateur.
- Temp distant : `mktemp` + `trap` + auto-suppression même en échec.
  Temp local : `Remove-Item` après lecture du token (fichiers temporaires :
  exception corbeille OK).

## Workflow agent (obligatoire)

1. Génère en Temp :
   `$ts = Get-Date -Format yyyyMMdd-HHmmss`
   `$script = "$env:TEMP\script-<nom>-$ts.ps1"`
   `$result = "$env:TEMP\script-<nom>-$ts.ok"`
   Remplace les placeholders du template (`__TITRE__`, `__RESULT_FILE__`,
   `__ATTENDU__` pour démo uniquement).
2. Valide (refuse si erreur) :
   `$e = $null; [void][System.Management.Automation.Language.Parser]::ParseFile($script, [ref]$null, [ref]$e); if ($e.Count -gt 0) { throw $e[0].Message }`
   (+ `bash -n` / `shellcheck` pour un script bash VPS).
3. Démarre tout seul, sans copier-coller (primaire : tâche planifiée interactive) :
   `schtasks /create /tn '<nom>' /tr 'powershell.exe -NoExit -ExecutionPolicy Bypass -File <script-sans-espaces>' /sc once /st <HH:mm-futur> /it /f`
   puis `schtasks /run /tn '<nom>'`, puis `schtasks /delete /tn '<nom>' /f`
   (l'instance déjà lancée continue ; rien ne persiste). `/it` = visible sur le
   bureau utilisateur (validé le 2026-10-12 : notepad obtient un vrai handle et la
   démo `DEMO-OK` → `DEMO-VALIDE` de bout en bout sans copier-coller).
   Règles `/tr` : ZÉRO guillemet double (le transport les garde en littéral et casse
   la commande) — chemins SANS espaces et quotes simples uniquement ; si le Temp en
   contient, copier le script vers un chemin sans espaces avant le `/create`.
   Vérifie : process vivant (+ `MainWindowHandle -ne 0` pour un test GUI).
   Secours si le runtime a un desktop direct : `Start-Process ... -PassThru` + contrôle
   du handle (`0` ou process mort = runtime sans desktop direct, ex. harness OpenCode
   où même `notepad.exe` meurt sans fenêtre).
   Dernier recours seulement : une-ligne à coller dans le terminal utilisateur, ex.
   `powershell -NoExit -ExecutionPolicy Bypass -File "<script>"`, puis poll quand même.
4. Poll sans rien faire d'autre (ne pas demander "c'est bon") :
   `$s = Get-Date; while (!(Test-Path -LiteralPath $result) -and ((Get-Date)-$s).TotalSeconds -lt 300) { Start-Sleep -Seconds 2 }`
5. Lit le token : `Get-Content -Raw -LiteralPath $result`
   `SECRET-OK` / `DEMO-VALIDE` / `EXEC-OK` = continue. `FAIL:*` ou timeout =
   demander à quelle étape exacte ça coince (message terminal, refus login).
6. Nettoie : `Remove-Item -LiteralPath $script,$result -ErrorAction SilentlyContinue`
   (VPS : `ssh <alias> 'ls -l /tmp/<nom> || echo SUPPRIME-OK'`, aucun `.bak` résiduel).
7. Post-vérif sans secrets : token présent, fichiers supprimés, service OK
   (`401` sans auth / `systemctl is-active`, jamais de test avec le vrai secret).

## Anti-casse

- Jamais `-WindowStyle Hidden` pour une saisie user. Jamais de secret en argument.
- Jamais de suppression hors Temp (corbeille obligatoire ailleurs).
- Timeout 300 s max, puis abandon propre + message d'étape.
- Si échec : contourne (autre terminal, autre commande) avant de remonter.

## Exemples

- Secret local : génère depuis `ask-secret-template.ps1`, ouvre, attend `SECRET-OK`.
- Démo : `__ATTENDU__ = DEMO-OK`, l'utilisateur tape `DEMO-OK`, voit `DEMO-VALIDE`.
- VPS : `/change-mdp vps-etude glances` puis ouverture auto du `ssh -t ...`.

Références : `commands/change-mdp.md` (template jetable + getpass),
`skills/vps-oneshot-ssh/SKILL.md` (one-shot + règles secrets),
`AGENTS.md` (Start-Process + poll + reprise seule).
