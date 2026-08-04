import type { Plugin } from "@opencode-ai/plugin"
import fs from "node:fs"

// SONDE TEMPORAIRE DE MESURE — à retirer après relevé.
// `experimental.chat.system.transform` reçoit le prompt système réellement
// assemblé, juste avant l'appel API. Le hook s'exécute même si l'appel échoue
// ensuite : c'est ce qui permet de mesurer OpenCode modèle injoignable.
const OUT = process.env.OPENCODE_CTX_PROBE_OUT

export const CtxProbePlugin: Plugin = async () => {
  if (!OUT) return {}
  return {
    "experimental.chat.system.transform": async (input, output) => {
      try {
        fs.writeFileSync(
          OUT,
          JSON.stringify(
            {
              model: input?.model?.id ?? null,
              parts: output.system.length,
              chars: output.system.reduce((n, s) => n + s.length, 0),
              system: output.system,
            },
            null,
            1
          ),
          "utf8"
        )
      } catch {
        /* une sonde ne doit jamais bloquer la session */
      }
    },
  }
}
