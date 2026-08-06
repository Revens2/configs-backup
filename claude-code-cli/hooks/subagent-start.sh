#!/usr/bin/env bash
# CodeGraph subagent-start hook — inject project overview into subagents
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-subagent-start 2>/dev/null || echo '{"continue":true}'
