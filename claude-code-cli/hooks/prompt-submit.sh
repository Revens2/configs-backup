#!/usr/bin/env bash
# CodeGraph prompt-submit hook — inject relevant context
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-prompt-submit 2>/dev/null || echo '{"continue":true}'
