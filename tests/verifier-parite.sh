#!/usr/bin/env bash
# Vérificateur de parité — Codex / OpenCode / AGY
# Usage : bash configs-backup/tests/verifier-parite.sh
# Ne modifie rien : lectures et commandes de diagnostic uniquement.

set -u
HOME_DIR="${HOME:-/c/Users/Juliann}"
BACKUP="$(cd "$(dirname "$0")/.." && pwd)"
pass=0; fail=0

ok()   { echo "  PASS  $1"; pass=$((pass+1)); }
ko()   { echo "  FAIL  $1"; fail=$((fail+1)); }
check(){ if [ "$2" = "$3" ]; then ok "$1 ($2)"; else ko "$1 — attendu $3, vu $2"; fi; }

echo "== 1. 12 spécialistes Codex/OpenCode, 11 AGY =="
for pair in \
  "codex live:$HOME_DIR/.codex/agents:toml" \
  "opencode live:$HOME_DIR/.config/opencode/agents:md" \
  "codex backup:$BACKUP/codex/agents:toml" \
  "opencode backup:$BACKUP/opencode/agents:md" ; do
  label="${pair%%:*}"; rest="${pair#*:}"; dir="${rest%:*}"; ext="${rest##*:}"
  n=0
  [ -d "$dir" ] && n=$(ls "$dir"/*."$ext" 2>/dev/null | wc -l)
  check "$label" "$n" "12"
done
for pair in \
  "agy live:$HOME_DIR/.gemini/config/agents:md" \
  "agy backup:$BACKUP/antigravity/agents:md" ; do
  label="${pair%%:*}"; rest="${pair#*:}"; dir="${rest%:*}"; ext="${rest##*:}"
  n=0
  [ -d "$dir" ] && n=$(ls "$dir"/*."$ext" 2>/dev/null | wc -l)
  check "$label" "$n" "11"
done

echo "== 2. fichiers de configuration valides =="
if command -v agy >/dev/null 2>&1; then
  n=$(agy mcp list 2>/dev/null | tail -n +2 | grep -c . )
  [ "$n" -ge 4 ] && ok "agy mcp list ($n serveurs)" || ko "agy mcp list ($n serveurs, attendu >= 4)"
  n=$(agy agents 2>/dev/null | grep -c .)
  [ "$n" -ge 1 ] && ok "agy agents ($n agent(s) primaire(s))" || ko "agy agents (aucun agent)"
else
  ko "agy introuvable"
fi

if command -v codex >/dev/null 2>&1; then
  if codex mcp list >/dev/null 2>&1; then ok "codex mcp list répond"; else ko "codex mcp list en échec"; fi
  codex mcp list 2>/dev/null | grep -q "^github" && ko "github encore déclaré dans Codex" || ok "github absent de Codex"
else
  ko "codex introuvable"
fi

if command -v opencode >/dev/null 2>&1; then
  # le pipe évite tout fichier temporaire : node lit le JSON sur stdin
  oc=$(opencode debug config 2>/dev/null | node -e "
    let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      try{const j=JSON.parse(s);
        const a=Object.keys(j.agent||{}).length;
        const m=Object.keys(j.mcp||{});
        const core=['vault','context7','chrome-devtools','codegraph'];
        const missing=core.filter(x=>!m.includes(x));
        console.log(a+'|'+(missing.length?'MANQUE:'+missing.join(','):'OK')+'|'+m.join(','));
      }catch(e){console.log('ERR|json illisible|')}
    });" 2>/dev/null)
  IFS='|' read -r oc_agents oc_mcp_flag oc_mcp <<< "$oc"
  check "opencode agents" "${oc_agents:-ERR}" "12"
  if [ "$oc_mcp_flag" = "OK" ]; then ok "opencode MCP socle complet ($oc_mcp)"; else ko "opencode MCP — $oc_mcp_flag ($oc_mcp)"; fi
else
  ko "opencode introuvable"
fi

echo "== 3. aucun secret dans les configs versionnées =="
secrets=$(grep -rIl -E "ctx7sk-|gho_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|BEGIN [A-Z ]*PRIVATE KEY" \
          "$BACKUP" --exclude-dir=.git --exclude-dir=tests 2>/dev/null | head -5)
if [ -z "$secrets" ]; then ok "aucun motif de secret"; else ko "secrets repérés : $secrets"; fi

echo
echo "== total : $pass PASS / $fail FAIL =="
[ "$fail" -eq 0 ]
