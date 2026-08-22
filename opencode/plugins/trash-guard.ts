import type { Plugin } from "@opencode-ai/plugin"

// Trash guard — bloque les suppressions définitives et impose la corbeille.
// Même règle que le hook Claude Code `guard-trash-instead-of-rm.js`.

const TEMP = /(^|[\s"'=])(\/tmp\/|\/var\/tmp\/|[A-Za-z]:[\\/](?:Windows[\\/])?Temp[\\/]|\$env:TEMP|%TEMP%|\$TMPDIR)/i
const RM = /(^|\s)(rm|unlink|shred|srm)(\s|$)/i
const WIN = /(^|\s)(del|erase|rd|rmdir|remove-item|ri|clear-recyclebin)(\s|$)/i
const FIND_DELETE = /\bfind\b[\s\S]*\s-delete\b/i
const SAFE_PREFIX =
  /(^|\s)(git|docker|podman|npm|pnpm|yarn|kubectl|conda|pip|gh|helm|aws|az)\s+\S*\s*(rm|remove|rmi)\b/i

const HINT =
  "Suppression définitive interdite. Utiliser la corbeille :\n" +
  '  powershell -NoProfile -File C:/Users/Juliann/.claude/hooks/trash.ps1 "<chemin>"\n' +
  "Exceptions : fichiers temporaires, sous-commandes d'outils (`git rm`, `docker rm`), " +
  "ou préfixe `TRASH_GUARD=off ` après accord explicite de l'utilisateur."

export const TrashGuardPlugin: Plugin = async () => ({
  "tool.execute.before": async (input, output) => {
    const tool = String(input?.tool ?? "").toLowerCase()
    if (tool !== "bash" && tool !== "shell") return

    const command = (output?.args as Record<string, unknown> | undefined)?.command
    if (typeof command !== "string" || !command) return
    if (/\bTRASH_GUARD=off\b/.test(command)) return

    for (const raw of command.split(/(?:\|\||&&|[;\n|])/)) {
      const part = raw.trim()
      if (!part || SAFE_PREFIX.test(part) || TEMP.test(part)) continue
      if (RM.test(part) || WIN.test(part) || FIND_DELETE.test(part)) {
        throw new Error(`[trash-guard] Commande bloquée : \`${part}\`\n${HINT}`)
      }
    }
  },
})
