#!/usr/bin/env bash
# CodeGraph pre-tool-use hook — inject codebase context before tool execution
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-pre-tool-use 2>/dev/null || echo '{"continue":true}'

