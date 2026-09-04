#!/usr/bin/env node
// PreToolUse hook: deny browser tool calls and instruct the agent to delegate.
// Works for Claude Code CLI & Desktop (settings.json) and AGY (hooks.json).
//
// 2026-08-16 — CORRECTIF DE BOUCLE.
// L'ancienne version refusait INCONDITIONNELLEMENT, sans regarder l'appelant. Un
// sous-agent de recherche (`web-researcher`) se voyait donc ordonner de deleguer a
// un sous-agent de recherche : boucle sans issue, aucune recherche web possible.
// Desormais les agents dont la recherche web EST le role sont laisses passer.

const ALLOWED_AGENTS = [
  "web-researcher",
  "research",
  "researcher",
  "browser-agent",
  "seo-expert",
];

// Le format du payload PreToolUse n'est pas stable entre versions/produits : on
// ratisse large plutot que de parier sur un seul champ.
function callerIdentity(p) {
  const candidates = [
    p?.agent_type, p?.agentType, p?.subagent_type, p?.subagentType,
    p?.agent?.type, p?.agent?.name, p?.agentName, p?.agent_id, p?.agentId,
    p?.source_agent, p?.sourceAgent, p?.caller, p?.persona,
    process.env.CLAUDE_AGENT_TYPE, process.env.CLAUDE_SUBAGENT_TYPE,
    process.env.CLAUDE_AGENT_NAME,
  ];
  return candidates.filter((v) => typeof v === "string" && v).join(" ").toLowerCase();
}

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  const allow = () => { process.stdout.write("{}"); process.exit(0); };

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return allow(); // illisible : on ne bloque pas
  }

  const who = callerIdentity(payload);
  if (ALLOWED_AGENTS.some((a) => who.includes(a))) return allow();

  // 2026-08-29 — Claude Code ne transmet souvent qu'un `agentId` opaque : le nom de
  // l'agent est alors introuvable et un sous-agent legitime se voit refuse. L'intention
  // de la regle est de garder le contexte de l'agent PRINCIPAL propre ; tout appel
  // provenant d'un transcript de sous-agent (sidechain) satisfait deja cette intention.
  const transcript = String(payload?.transcript_path || payload?.transcriptPath || "")
    .replace(/\\/g, "/");
  if (/\/subagents\//.test(transcript)) return allow();

  const toolName =
    payload?.toolCall?.name || payload?.tool_input?.name || payload?.tool_name || "";

  const reason =
    `BROWSER DELEGATION RULE: Do NOT use browser tools (${toolName}) directly. ` +
    `Delegate the browser task to a dedicated subagent — 'web-researcher' for search ` +
    `and documentation, or another browser-capable agent — and pass it the URL/task. ` +
    `It will execute the browser action and return only the result. ` +
    `This keeps the main agent's context clean. ` +
    `NOTE: agents whose role IS web research (${ALLOWED_AGENTS.join(", ")}) are exempt ` +
    `from this rule and may call browser tools directly; if you ARE one of them and ` +
    `still see this message, the hook could not identify the calling agent from its ` +
    `payload — report it rather than retrying the same call.`;

  if (payload.toolCall) {
    // AGY
    process.stdout.write(JSON.stringify({ decision: "deny", reason }));
  } else {
    // Claude Code
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }));
  }
  process.exit(0);
});
