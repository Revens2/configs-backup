---
name: codex-with-chatgpt
description: Use ChatGPT as a planning and review layer while Codex retains local execution ownership.
---

# Codex with ChatGPT

ChatGPT plans and reviews; Codex edits files, runs commands, tests changes, and owns recovery.

## Safety contract

- Never paste file contents, diffs, logs, credentials, tokens, cookies, or session state into ChatGPT.
- Keep the connector read-only from ChatGPT's perspective and use the pairing flow rather than copying secrets.
- Use one connector and one conversation/project per workspace; never silently switch workspaces.
- Run the local doctor/health check before opening ChatGPT or sending control messages.
- Keep control messages short and send only metadata such as goal, changed-file count, and test status.
- On resume, follow the saved checkpoint instead of starting a duplicate task or connector.
- Do not upload repositories or private files to a ChatGPT project.

## Local workflow

1. Check for updates and ensure the local state directory is writable.
2. Run the local health/doctor check and repair the bridge before connecting.
3. Pair the current workspace's connector and verify the workspace identity.
4. Exchange `INIT`, `PLAN`, `EXECUTING`, `EXECUTED`, `REVIEW`, `DONE`, or `BLOCKED` control states.
5. Codex executes the plan locally and records changed files and validation results.
6. ChatGPT independently reviews through the connector; apply only confirmed findings.
7. Clear the checkpoint after `DONE`; keep a precise user decision when `BLOCKED`.

## Connection and recovery

Use the configured in-app browser for ChatGPT setup. Never reuse another workspace's connector or
chat URL. If a temporary address is reclaimed, delete and recreate only the current workspace's
connector, pair again, run the health check, and then resume the saved conversation.

The full local C2C implementation may use machine-specific paths and state files; those are not
part of this public configuration backup.
