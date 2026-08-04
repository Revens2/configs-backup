import type { Plugin } from "@opencode-ai/plugin"
import fs from "node:fs"
import path from "node:path"

// plan-pointer — équivalent OpenCode du hook PreCompact de Claude Code.
//
// Un fichier ne se compacte pas. `progress.md` est la source de vérité de
// l'avancement ; le contexte ne l'est pas. Ce plugin garantit que la tâche en
// cours et son critère d'acceptation traversent la compaction.
//
// Deux points d'accroche, tous deux fournis par @opencode-ai/plugin@1.18.3 :
//   - `experimental.session.compacting`  → avant la compaction, on ajoute le
//     pointeur au prompt de compaction (`output.context`). C'est le pendant
//     exact de `PreCompact` côté Claude Code.
//   - `experimental.chat.system.transform` → à chaque requête, on réinjecte le
//     pointeur en fin de prompt système. Filet de sécurité : même si la
//     compaction perd le fil, le tour suivant le retrouve.

type Block = string[]

function planPointer(dir: string): string | null {
  try {
    const file = path.join(dir, "progress.md")
    if (!fs.existsSync(file)) return null
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/)
    const done = lines.filter((l) => /^\s*[-*]\s*\[x\]/i.test(l)).length

    // Une tâche = sa ligne cochable + ses lignes de continuation indentées
    // (`critère :`, `cible :`). Sans son critère, une reprise à froid ne sait
    // pas à quoi reconnaître que la tâche est finie.
    const todo: Block[] = []
    for (let i = 0; i < lines.length; i++) {
      if (!/^\s*[-*]\s*\[[ ~]\]/.test(lines[i])) continue
      const block: Block = [lines[i].trim()]
      for (let j = i + 1; j < lines.length; j++) {
        if (/^\s*[-*]\s*\[[ x~]\]/i.test(lines[j]) || !/^\s+\S/.test(lines[j])) break
        block.push(lines[j].trim())
      }
      todo.push(block)
    }
    if (!todo.length && !done) return null

    const L: string[] = []
    L.push("## Plan en cours — source de vérité")
    L.push(`**${file}** — ${done}/${done + todo.length} tâches cochées.`)
    L.push("Relire ce fichier avant toute action ; ne pas se fier au résumé ci-dessus.")
    if (todo.length) {
      L.push("")
      L.push("Tâche en cours, à reprendre en premier (avec son critère d’acceptation) :")
      todo[0].forEach((l, i) => L.push(i === 0 ? l : `  ${l}`))
      if (todo.length > 1) {
        L.push("")
        L.push("Ensuite :")
        todo.slice(1, 3).forEach((b) => L.push(b[0]))
      }
    } else {
      L.push("")
      L.push("Toutes les tâches sont cochées.")
    }
    return L.join("\n")
  } catch {
    // Un plugin qui plante bloque la session : on échoue toujours en silence.
    return null
  }
}

// Trace de vérification, inerte hors mesure : sans la variable d'environnement,
// le plugin n'écrit rien. Sert à prouver que les hooks se déclenchent vraiment,
// ce qu'aucune commande d'OpenCode ne permet de constater autrement.
function trace(evt: string, ok: boolean) {
  const f = process.env.OPENCODE_PLAN_POINTER_TRACE
  if (!f) return
  try {
    fs.appendFileSync(f, `${evt} pointeur=${ok ? "oui" : "non"}\n`, "utf8")
  } catch {
    /* une trace ne doit jamais bloquer la session */
  }
}

export const PlanPointerPlugin: Plugin = async ({ directory }) => {
  trace("plugin.charge", true)
  return {
    "experimental.session.compacting": async (_input, output) => {
      const p = planPointer(directory)
      trace("session.compacting", !!p)
      if (!p) return
      output.context.push(
        "La mission en cours n'est pas terminée. Ce bloc fait autorité sur l'historique " +
          "compacté : rouvre le progress.md indiqué et reprends la tâche marquée [~] là où " +
          "elle s'est arrêtée, sans attendre qu'on te la rappelle.\n\n" +
          p
      )
    },

    "experimental.chat.system.transform": async (_input, output) => {
      const p = planPointer(directory)
      trace("chat.system.transform", !!p)
      if (!p) return
      output.system.push(p)
    },
  }
}
