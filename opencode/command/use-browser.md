---
description: Pilote ton vrai Brave/Chrome (cookies, sessions) via le MCP navigateur au lieu du headless isolé. Usage : /use-browser <but, ex. règle OCI, console Cloudflare>
---

# /use-browser — $ARGUMENTS

Charge le skill `use-browser` (`~/.config/opencode/skills/use-browser/SKILL.md`) et exécute la demande :
**$ARGUMENTS**.

Marche : 1) diagnostique qui écoute sur `127.0.0.1:9222`, 2) si headless → rattache au vrai Brave
(fermeture navigateur = prévenir avant), 3) pilote (clics in-app, pas de deep-links SPA ;
clic JS si `click` échoue ; corrige les combobox concaténées), 4) jamais de mot de passe/2FA
tapé par l'agent — l'utilisateur se logge lui-même dans la fenêtre visible.
