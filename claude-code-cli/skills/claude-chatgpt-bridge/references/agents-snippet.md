# Optional CLAUDE.md / AGENTS.md Snippet

Use this only when a project explicitly wants to adopt the router policy locally.

```markdown
## Claude Code, ChatGPT, and DevSpace MCP Bridge Routing

Use the user-level `claude-chatgpt-bridge` skill when a task may benefit from routing between Claude Code CLI local execution, ChatGPT reasoning/review (ChatGPT Solo on `ia.francestudent.org`), DevSpace MCP bridge scoped project inspection, or web-based handoff.

Default division of labor:
- Claude Code owns source edits, tests, builds, git operations, verification, and final execution.
- ChatGPT owns high-token reasoning, broad review, visual/PDF/screenshot analysis, and independent go/no-go critique.
- DevSpace MCP bridge defaults to read-only access to this project only (`-AllowedRoots`).
- ChatGPT recommendations are advice until Claude Code verifies them locally.

DevSpace MCP bridge policy:
- Prefer `L1_READ_ONLY` for project inspection.
- Allow `L2_DIAGNOSTIC_COMMANDS` only for non-mutating diagnostics scoped to this project.
- Require approval for workspace writes (`L3`), privileged/admin actions (`L4`), destructive commands (`L5`), hardware-impacting actions, external irreversible actions, or access to secrets.
- Never expose `.env`, auth files, API keys, SSH keys, browser cookies, broad home directories, whole drives, or unrelated private folders.

Before fabrication, release, submission, push, or irreversible external action, require Claude Code local checks plus explicit user approval.
```
