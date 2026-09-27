#!/usr/bin/env bash
# CodeGraph post-edit hook — re-index modified file, sauf home (interdit)
PROJ="${CLAUDE_PROJECT_DIR:-$PWD}"
case "$PROJ" in
  *Juliann*|*/c/Users/Juliann*|*C:/Users/Juliann*|*C:\\Users\\Juliann*)
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
    ;;
esac
# CodeGraph post-edit hook — re-index modified file
CODEGRAPH_BIN="${CODEGRAPH_BIN:-C:\Users\Juliann\.cargo\bin\codegraph.exe}"
"$CODEGRAPH_BIN" hook-post-edit 2>/dev/null || echo '{"continue":true}'
