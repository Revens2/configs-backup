#!/usr/bin/env bash
# CodeGraph session-start hook — re-index codebase
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-session-start 2>/dev/null || echo '{"continue":true}'

