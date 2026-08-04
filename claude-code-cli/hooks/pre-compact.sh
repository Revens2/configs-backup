#!/usr/bin/env bash
# CodeGraph pre-compact hook — save graph summary
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-pre-compact 2>/dev/null || echo '{"continue":true}'
