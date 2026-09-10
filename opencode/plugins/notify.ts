import type { Plugin } from "@opencode-ai/plugin"
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

/**
 * OpenCode notify — son uniquement quand la tache principale est finie.
 *
 * Evenement utilise : `session.idle`
 *   - Emis quand la session principale devient idle (tour termine).
 *   - Ne pas utiliser `session.status` / `tool.execute.*` / `permission.*` :
 *     ce serait du bruit de sous-etapes.
 *
 * Garde-fous :
 *   - Filtrage payload : si le payload porte un agentId/subagent, on ignore.
 *   - Deduplication 7s (meme fichier que agent-notify.ps1) pour rideau Stop+idle.
 *   - Aucun toast/balloon Windows, son seul via agent-notify.ps1.
 *   - Ne jamais bloquer la session.
 */

const DEDUP_FILE = path.join(process.env.USERPROFILE ?? process.env.HOME ?? ".", ".claude", "state", ".notify-dedup-opencode.json")
const MIN_INTERVAL_MS = 7000

function shouldSkipDedup(sessionId: string | null): boolean {
  try {
    if (!fs.existsSync(DEDUP_FILE)) return false
    const prev = JSON.parse(fs.readFileSync(DEDUP_FILE, "utf8"))
    const now = Date.now()
    const elapsed = now - Number(prev.ts ?? 0)
    if (elapsed < 3000) return true
    if (elapsed < MIN_INTERVAL_MS && sessionId && prev.session_id && sessionId === prev.session_id) return true
    return false
  } catch {
    return false
  }
}

function markDedup(sessionId: string | null) {
  try {
    const dir = path.dirname(DEDUP_FILE)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DEDUP_FILE, JSON.stringify({ ts: Date.now(), session_id: sessionId, harness: "opencode" }), "utf8")
  } catch {}
}

function fireSound(sessionId: string | null) {
  if (shouldSkipDedup(sessionId)) return
  markDedup(sessionId)
  // Delegate to the unified script (handles sound fallback, async, no toast)
  const ps1 = "C:\\Users\\Juliann\\.claude\\hooks\\agent-notify.ps1"
  const ps = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1, "-Event", "completed", "-Harness", "opencode"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  })
  try { ps.unref() } catch {}
}

function pickSessionId(event: unknown): string | null {
  try {
    const e = event as Record<string, unknown>
    // opencode events carry different shapes; try common fields
    const props = (e?.properties ?? e) as Record<string, unknown>
    return (props?.sessionID as string) ?? (props?.sessionId as string) ?? (e?.sessionID as string) ?? (e?.sessionId as string) ?? null
  } catch {
    return null
  }
}

function looksLikeSubagent(event: unknown): boolean {
  try {
    const e = event as Record<string, unknown>
    const props = (e?.properties ?? e) as Record<string, unknown>
    // Any agent/subagent marker -> skip
    if (props?.agentId ?? props?.agentID ?? e?.agentId ?? e?.agentID) return true
    if (props?.agentName ?? e?.agentName) return true
    const t = String(e?.type ?? "")
    if (t.includes("agent") || t.includes("subagent") || t.includes("permission")) return true
    return false
  } catch {
    return false
  }
}

export const NotifyPlugin: Plugin = async () => {
  return {
    // Generic event tap for session.idle (main session)
    event: async ({ event }) => {
      try {
        const t = String((event as Record<string, unknown>)?.type ?? "")
        if (t !== "session.idle") return
        if (looksLikeSubagent(event)) return
        const sid = pickSessionId(event)
        fireSound(sid)
      } catch {
        /* never block */
      }
    },
  }
}
