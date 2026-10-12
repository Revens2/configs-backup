---
description: Fait taper ou exécuter quelque chose à l'utilisateur (mot de passe, clé API, commande UAC/admin, ssh VPS) via un script jetable auto-démarré, sans copier-coller. Porté par le skill `script`.
---

# /script — saisie ou exécution côté utilisateur, sans copier-coller

Arguments : `$ARGUMENTS` = `[secret-local|exec-local|secret-vps|exec-vps] <intitulé> [détail]`

Exemples :
- `/script secret-local "Mot de passe Glances"`
- `/script exec-local "Valider le pare-feu en GUI" "impossible en headless"`
- `/script secret-vps vps-etude glances` (délègue la génération à `/change-mdp`)

## Workflow (détail complet dans le skill `script`, à suivre à la lettre)

1. Génère le script jetable en local Temp depuis `skills/script/scripts/`
   (`ask-secret-template.ps1` pour un secret, script ad hoc pour une exécution).
   Jamais de secret en dur dedans. Placeholders `__TITRE__ __RESULT_FILE__`.
2. Valide la syntaxe avant toute exécution (parser PowerShell, `bash -n` côté VPS).
   Jamais d'exécution non validée.
3. Démarre tout seul via `schtasks /IT` (visible sur le bureau, zéro copier-coller),
   puis `schtasks /delete` (l'instance continue, rien ne persiste).
   `/tr` sans guillemets doubles, chemins sans espaces uniquement.
4. Poll le fichier-résultat (token uniquement : `SECRET-OK`, `EXEC-OK`, `FAIL:raison`),
   ne fait rien d'autre en attendant, reprend seul à la détection.
5. Lit le token (jamais le secret), nettoie Temp, post-vérifie sans secrets.

## Règles inviolables (comme `/change-mdp`)

- Ne JAMAIS afficher, répéter, logger ou commiter un secret.
- Saisie TOUJOURS côté terminal utilisateur (aveugle + confirmation).
- Timeout 300 s max, abandon propre + question sur l'étape exacte en cas d'échec.
