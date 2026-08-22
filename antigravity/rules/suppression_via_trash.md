# Suppression de fichiers — corbeille obligatoire (Obligatoire)

**Règle** : ne jamais supprimer définitivement un fichier ou un dossier. Toute suppression
passe par la corbeille Windows, pour que l'élément reste récupérable en cas d'erreur.

## Interdit

`rm`, `rm -rf`, `del`, `erase`, `rd` / `rmdir /s`, `Remove-Item`, `unlink`, `shred`,
`find ... -delete`, `Clear-RecycleBin`.

## À utiliser à la place

```powershell
powershell -NoProfile -File C:/Users/Juliann/.claude/hooks/trash.ps1 "<chemin>" [autres chemins...]
```

Le script envoie chaque cible à la corbeille ; si la corbeille est indisponible
(lecteur réseau), il déplace l'élément dans `%LOCALAPPDATA%\ia-trash\<horodatage>\`.
Restauration : corbeille > clic droit > Restaurer, ou déplacement manuel depuis `ia-trash`.

## Exceptions admises

- Fichiers réellement temporaires : `/tmp`, `/var/tmp`, `%TEMP%`, `$env:TEMP`.
- Sous-commandes d'outils qui ne détruisent rien sur disque : `git rm`, `docker rm`,
  `npm rm`, `kubectl delete`, etc.
- Suppression définitive explicitement demandée par l'utilisateur dans le fil : préfixer
  alors la commande de `TRASH_GUARD=off `.

Côté Claude Code CLI, la règle est appliquée mécaniquement par le hook PreToolUse
`~/.claude/hooks/guard-trash-instead-of-rm.js` (deny) et par la liste `permissions.deny`
de `settings.json`. Côté OpenCode, par le plugin `plugins/trash-guard.ts`.
