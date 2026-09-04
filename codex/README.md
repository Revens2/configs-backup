# Codex configuration backup

This directory contains the reusable, sanitized Codex configuration for this machine.

## Included

- `config.toml`: reusable model, feature, agent, MCP, and sandbox settings; volatile runtime paths and workspace trust entries are intentionally omitted.
- `hooks.json`: lifecycle hook wiring.
- `agents/`: custom Codex agent definitions.
- `hooks/`: hook implementations.
- `rules/`: command safety rules.
- `skills/caveman/`: the only user-installed Codex skill; Codex system skills remain managed by Codex itself.
The ChatGPT bridge workspace is intentionally separate from Freebuff: use a dedicated project
root such as `C:\\projet\\codex-with-chatgpt`, never `C:\\Users\\<user>` or another broad home
root. `run_shell` is not constrained by `allowedRoots`, so keep the bridge account/workspace
least-privileged and review commands and diffs.

## Excluded

Authentication (`auth.json`), conversation history, rollout/session files, SQLite state,
caches, plugin runtime data, named-pipe identifiers, machine installation paths, and private
infrastructure memory are never committed to this public repository.

Restore by copying the selected files into `%USERPROFILE%\\.codex` and adapting local paths and
secrets through environment variables or the Codex credential store. Do not commit those local
values.
