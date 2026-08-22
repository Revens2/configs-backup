#!/usr/bin/env node
// PreToolUse (Bash) guard: block destructive deletions, force the use of `trash`
// (corbeille Windows) so that any file can be restored afterwards.
//
// Bloque : rm / rm -rf, del, erase, rd / rmdir, Remove-Item, unlink, shred,
//          find ... -delete, Clear-RecycleBin.
// Laisse passer : `git rm`, `docker rm*`, `npm rm`, les suppressions sous un
//          répertoire temporaire, et tout ce qui est préfixé de TRASH_GUARD=off.
let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let cmd = "";
  try {
    cmd = (JSON.parse(raw).tool_input || {}).command || "";
  } catch (e) {
    process.exit(0);
  }

  const deny = (reason) => {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  };

  // Échappatoire explicite et volontaire.
  if (/\bTRASH_GUARD=off\b/.test(cmd)) process.exit(0);

  // Découpe grossière en sous-commandes (;, &&, ||, |, retours ligne).
  const parts = cmd.split(/(?:\|\||&&|[;\n|])/);

  const TEMP = /(^|[\s"'=])(\/tmp\/|\/var\/tmp\/|[A-Za-z]:[\\/](?:Windows[\\/])?Temp[\\/]|\$env:TEMP|%TEMP%|\$TMPDIR)/i;
  // Verbes de suppression définitive.
  const RM = /(^|\s)(rm|unlink|shred|srm)(\s|$)/i;
  const WIN = /(^|\s)(del|erase|rd|rmdir|remove-item|ri|clear-recyclebin)(\s|$)/i;
  const FIND_DELETE = /\bfind\b[\s\S]*\s-delete\b/i;
  // Faux positifs : sous-commandes d'outils qui ne touchent pas le disque.
  const SAFE_PREFIX = /(^|\s)(git|docker|podman|npm|pnpm|yarn|kubectl|conda|pip|gh|helm|aws|az)\s+\S*\s*(rm|remove|rmi)\b/i;

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) continue;
    if (SAFE_PREFIX.test(part)) continue;
    if (TEMP.test(part)) continue;

    if (RM.test(part) || WIN.test(part) || FIND_DELETE.test(part)) {
      const rf = /-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|--recursive|--force|\/s\b|-Recurse|-Force/i.test(part);
      deny(
        "Suppression définitive bloquée" +
          (rf ? " (récursive/forcée)" : "") +
          " : `" +
          part +
          "`.\n" +
          "Règle globale — ne jamais supprimer un fichier, toujours l'envoyer à la corbeille pour pouvoir le récupérer.\n" +
          "Utiliser à la place :\n" +
          '  powershell -NoProfile -File C:/Users/Juliann/.claude/hooks/trash.ps1 "<chemin>" [autres chemins...]\n' +
          "  (ou `trash <chemin>` si l'alias est installé)\n" +
          "Cas légitimes de suppression réelle : fichiers temporaires (/tmp, %TEMP%), " +
          "sous-commandes d'outils (`git rm`, `docker rm`), ou préfixer la commande de " +
          "`TRASH_GUARD=off ` après accord explicite de l'utilisateur."
      );
    }
  }

  process.exit(0);
});
