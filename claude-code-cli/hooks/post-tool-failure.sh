#!/usr/bin/env bash
# CodeGraph post-tool-failure hook — provide corrective context after failures
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-post-tool-failure 2>/dev/null || echo '{"continue":true}'

