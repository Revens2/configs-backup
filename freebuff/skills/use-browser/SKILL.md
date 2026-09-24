---
name: use-browser
description: >
  Drive the user's REAL browser (Brave/Chrome, with their cookies and logged-in sessions) through the
  browser MCP (CDP on 127.0.0.1:9222) instead of the isolated headless instance.
  ALWAYS use this skill when the user says "use browser", "prends mon navigateur", "ouvre le mcp sur
  chrome/brave", asks for clicks in a console needing their login (OCI, AWS, Cloudflare, ...), or when
  MCP pages look empty/headless and the user's own tabs are nowhere to be seen.
---

# use-browser — piloter le vrai navigateur via le MCP

Principe : le MCP navigateur parle CDP à `127.0.0.1:9222`. Par défaut c'est une instance **headless
isolée** (pas les onglets de l'utilisateur, pas ses cookies). Pour agir avec sa session, rattacher le
MCP à son Brave/Chrome réel, puis piloter.

## 1. Diagnostiquer à qui le MCP parle

```powershell
(Invoke-WebRequest -Uri http://127.0.0.1:9222/json/version -TimeoutSec 5).Content
# Browser: "HeadlessChrome/..." => instance MCP isolée. "Chrome/..." => vrai navigateur.
(Invoke-WebRequest -Uri http://127.0.0.1:9222/json/list -TimeoutSec 5).Content |
  ConvertFrom-Json | Where-Object { $_.type -eq 'page' } | Select-Object title, url
```

Croiser avec l'outil `list_pages` du MCP. Si un seul onglet générique et aucun onglet utilisateur :
c'est le headless — passer à §2.

## 2. Rattacher le MCP au vrai Brave (recommandé) ou Chrome

Préférer **Brave** si c'est le navigateur principal de l'utilisateur (cookies, sessions).
Exécutables usuels :

- Brave : `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
- Chrome : `C:\Program Files\Google\Chrome\Application\chrome.exe`

Règle critique : **le flag debug est ignoré si une instance tourne déjà**. Il faut donc tout fermer
d'abord. C'est disruptif (fenêtres fermées) mais restaurable — **prévenir l'utilisateur avant**.

```powershell
Stop-Process -Name brave -Force -ErrorAction SilentlyContinue
$t=0; while ((Get-Process brave -ErrorAction SilentlyContinue) -and $t -lt 15) { Start-Sleep 1; $t++ }
Start-Process "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" `
  -ArgumentList "--remote-debugging-port=9222","--remote-allow-origins=*","--restore-last-session"
Start-Sleep 6
(Invoke-WebRequest -Uri http://127.0.0.1:9222/json/list -TimeoutSec 8).Content |
  ConvertFrom-Json | Where-Object { $_.type -eq 'page' } | Select-Object title, url
```

Succès = les vrais onglets apparaissent. Côté MCP, `list_pages` répond
`browser was restarted or reconnected` — normal, les ids de pages changent.

Pièges constatés :

- Chrome peut porter le flag dans sa ligne de commande **sans écouter sur 9222** (il bind un port
  éphémère). Lire `%LOCALAPPDATA%\Google\Chrome\User Data\DevToolsActivePort` (1ère ligne = port
  réel). En cas de doute, valider le mécanisme avec un profil test sur un autre port :
  `--user-data-dir=$env:TEMP\chrome-test-profile --remote-debugging-port=9333 about:blank`.
- Ne jamais spécifier `--user-data-dir` du profil réel : le lancement sans ce flag reprend le
  profil par défaut (cookies conservés).
- Ne jamais demander ni taper mot de passe / 2FA : l'utilisateur se connecte **lui-même** dans la
  fenêtre visible, l'agent prend la main après ("dis-moi quand loggé").

## 3. Piloter — patterns validés (console OCI, 2026-09-17)

- `navigate_page` direct sur deep-link SPA → coquille vide fréquente (timeouts). Préférer naviguer
  vers une page liste qui rend bien, puis **clics in-app**.
- `click` échoue sur liens virtualisés ("did not become interactive") → clic JS via
  `evaluate_script` en perçant les iframes same-origin :
  `docs=[document,...iframes.contentDocument]`, trouver le `<a>` par texte exact, `a.click()`.
- `wait_for` avec liste de textes candidats FR/EN avant chaque lecture (SPAs lentes).
- `fill` sur combobox à filtre ajoute au lieu de remplacer ("TCPUDP") → corriger en JS :
  focus + select + `execCommand('delete')` + `execCommand('insertText',false,'UDP')` + events
  `input`/`change`, puis `ArrowDown` + `Enter` (`press_key`) pour sélectionner l'option.
- `fill_form` pour plusieurs champs texte d'un coup ; toujours **revérifier par snapshot** avant
  de soumettre (bouton Ajouter).
- L'utilisateur voit tout en direct dans sa fenêtre : annoncer chaque action irréversible
  (ex. création de règle pare-feu avec valeurs exactes) avant de cliquer.

## 4. Garde-fous

- Fermer le navigateur de l'utilisateur = disruptif : prévenir, `--restore-last-session` aide
  mais ne garantit rien.
- Ne jamais relancer le headless d'origine : le MCP suit ce qui écoute sur 9222, quel que soit
  le binaire (Brave headless d'origine, Brave réel, Chrome).
- Si `127.0.0.1:9222` refuse toute connexion et aucun navigateur ne tourne : relancer Brave
  avec les flags §2.
- Scope : pilotage navigateur uniquement. Pas de lecture de mots de passe, pas de contournement
  de login, pas d'exfiltration de session.

## 5. Où ce skill est installé (miroirs, contenu identique)

| Outil | Chemin du skill | Slash command |
|---|---|---|
| Claude Code CLI | `~/.claude/skills/use-browser/SKILL.md` | `~/.claude/commands/use-browser.md` |
| OpenCode | `~/.config/opencode/skills/use-browser/SKILL.md` | `~/.config/opencode/commands/use-browser.md` |
| .agents (Antigravity & co) | `~/.agents/skills/use-browser/SKILL.md` | — |
| Codex CLI | `~/.codex/skills/use-browser/SKILL.md` | — |
| Freebuff | `~/.freebuff/skills/use-browser/SKILL.md` (non lu nativement à ce jour, mémo) | — |

Modifier le canonique puis recopier vers les miroirs. Ne jamais diverger sans raison.
Claude Desktop : pas de support Skills/file-based — utiliser le MCP navigateur de
l'environnement appelant, pas la config Desktop (ne pas toucher à
`%APPDATA%\Claude\claude_desktop_config.json`).
