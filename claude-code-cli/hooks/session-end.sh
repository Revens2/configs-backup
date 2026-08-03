#!/usr/bin/env bash
# CodeGraph session-end hook — final re-index and diagnostics
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-session-end 2>/dev/null || echo '{"continue":true}'

