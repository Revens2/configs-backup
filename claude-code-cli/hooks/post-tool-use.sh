#!/usr/bin/env bash
# CodeGraph post-edit hook — re-index modified file
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-post-edit 2>/dev/null || echo '{"continue":true}'
