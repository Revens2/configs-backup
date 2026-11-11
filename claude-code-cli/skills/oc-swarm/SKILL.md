---
name: oc-swarm
description: Orchestrate a swarm of OpenCode sub-agents (DeepSeek V4.1 Flash, max reasoning) via the `swarm` CLI — spawn many workers in parallel, monitor, collect reports, follow up, retry. Use when the user asks for opencode/deepseek sub-agents, a swarm, many cheap parallel workers, or wants Claude to act as orchestrator/manager of external agents; also for fan-out work (many independent files/modules/research questions) where cheap parallel workers beat doing it inline.
---

# oc-swarm — Claude orchestrates, DeepSeek workers execute

`swarm` (code: `C:\projet\oc-swarm\swarm.py`, wrappers in `~/.local/bin`) drives ONE shared
`opencode serve` (port 4797, auto-started) where each agent = one session. No process per agent,
10+ agents in parallel tested. State: `~/.ocswarm/agents.json`, server log `~/.ocswarm/server.log`.

Defaults: model `opencode/deepseek-v4.1-flash-free`, variant `max` (reasoningEffort max), worker
system prompt (autonomous, no questions, ends with FINAL REPORT). Override: `-m`, `--variant`,
env `OCSWARM_MODEL` / `OCSWARM_VARIANT` / `OCSWARM_PORT`.

## Commands
- `swarm spawn -n NAME -d DIR [--ro] "prompt"` (or `-f prompt.md`, or `-` stdin) — non-blocking
- `swarm batch tasks.jsonl -d DIR [--shared "common context"] [--ro] [--stagger 0.5]`
  — lines/array of `{name, prompt | prompt_file, dir?, ro?, model?, variant?}`
- `swarm ls [--json]` — state busy|retry|done|empty|error|pending, elapsed, tool calls, tokens, cost
- `swarm wait [names] [-r] [--any] [--timeout 1800] [--max-chars 1500]` — blocks; `-r` prints final
  reports; `--any` returns at first finisher; auto-rejects questions/permission prompts
- `swarm result NAME... | --all [--max-chars N]` — final text
- `swarm log NAME [-n 40] [--thinking]` — tool-call timeline (debug a bad result)
- `swarm send NAME "follow-up"` — continue same session (keeps its context)
- `swarm retry NAME [-m model] [--variant high]` — resend original prompt
- `swarm abort NAME|--all`, `swarm drop NAME|--done|--all`, `swarm attach NAME` (TUI cmd for user)
- `swarm up [--pure]`, `swarm down`

Long `wait`: run with Bash `run_in_background` (or timeout ≤ 600000 ms) — never foreground-sleep.

## Parallelism & rate limits
- OpenCode agents can invoke up to **4 nested sub-agents simultaneously** (`--allow-task`); more
  concurrent work on the free pool triggers 429s.
- Work in waves of ≤ 4 live workers, then `swarm wait` before the next wave; `--stagger 0.5`
  smooths bursts.
- 429 / `retry` / `empty` are expected on the free model: back off a few seconds, then relaunch the
  **same session** with `swarm retry NAME` (or `swarm send NAME "continue"`). Never respawn under a
  new name: it loses the agent's context.

## Orchestration loop
1. Decompose into independent tasks with **disjoint write scopes** (one file/module per worker; no
   two rw workers on the same file). Research/audit = `--ro` (denies edit + bash).
2. Each prompt self-contained: goal, exact files/paths, constraints, acceptance check to run,
   expected report format. Workers don't see this conversation. Common context: `--shared`.
3. `swarm batch` → `swarm wait -r --max-chars 800` (background for long jobs).
4. Review each report like a code review: spot-check diffs/tests yourself (`git diff`, run tests).
   Never trust a worker's "verified" without own proof.
5. Fix-up: `swarm send NAME "..."` (has context) rather than respawn. `error`/`empty` → `retry`
   (`empty` = output cap eaten by reasoning → `--variant high`).
6. Integrate, run global validation, then `swarm drop --done`.

## Facts / limits
- Free model: 200k context, **32k output per step** — `max` can burn all 32k thinking on a pure
  reasoning question and return empty; agentic tasks (tool steps) are fine.
- Paid `opencode/deepseek-v4.1-flash` (1M ctx, 384k out, $0.3/$1.2 per M) needs OpenCode Zen
  credit — on 2026-11-03 returned `402 Insufficient account funds`.
- `experiential/deepseek-v4.1-flash` works but has no reasoning variants.
- Per-agent overhead ~23k input tokens/step (MCP tool schemas, `task`, `skill`, `question` denied by
  default to save ~35k). `--mcp NAME`, `--allow-task`, `--allow-skill` re-enable.
- Workers run with permission `*` allow in their dir (rw) — choose `-d` carefully; never point rw
  workers at production/servers.
