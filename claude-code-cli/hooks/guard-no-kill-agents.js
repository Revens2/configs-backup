#!/usr/bin/env node
// PreToolUse (Bash) guard: block any command that tries to kill claude/agy/opencode processes.
let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let cmd = "";
  try {
    cmd = (JSON.parse(raw).tool_input || {}).command || "";
  } catch (e) {
    process.exit(0);
  }

  const killVerb = /\b(taskkill|stop-process|spps|pkill|kill|end-process|endprocess|terminate-process|wmic\s+process\s+where)\b/i;
  const target = /\b(claude(\.exe)?|agy|opencode)\b/i;

  if (killVerb.test(cmd) && target.test(cmd)) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason:
            "Bloqué : tentative de tuer un processus claude/agy/opencode. Règle globale — ne jamais kill ces process (CLI ou desktop), même sur demande implicite. Diagnostiquer autrement (cache, startup, update) ou demander confirmation explicite à l'utilisateur avant toute exception.",
        },
      })
    );
    process.exit(0);
  }
  process.exit(0);
});
