#!/usr/bin/env bash
# Check pile prompts/config ChatGPT — refonte JIT 2026-10-03
# Usage : bash configs-backup/tests/check-prompts.sh
# Ne modifie rien : lectures et contrôles uniquement.
# Couvre : tailles loaders <=8000, canonique unique, pas de stale Qwen,
# Opus conditionnel (pas systématique), Astra JIT assaini, pas de secrets.

set -u
BACKUP="$(cd "$(dirname "$0")/.." && pwd)"
pass=0; fail=0
ok() { echo "  PASS  $1"; pass=$((pass+1)); }
ko() { echo "  FAIL  $1"; fail=$((fail+1)); }

echo "== 1. loaders et delta <= 8000 caracteres =="
for f in \
  "ChatGPT Brainstorming/00-instructions-projet.md" \
  "ChatGPT ARION/00-instructions-projet.md" \
  "ChatGPT ARION/ARION-RULES.md" \
  "ChatGPT ARION/Model-prompt-astra-6-extrait.md" ; do
  p="$BACKUP/$f"
  if [ -f "$p" ]; then
    n=$(wc -c < "$p")
    if [ "$n" -le 8000 ]; then ok "$f ($n car.)"; else ko "$f ($n car., attendu <= 8000)"; fi
  else
    ko "$f introuvable"
  fi
done

echo "== 2. canonique PROMPT unique =="
if [ -f "$BACKUP/PROMPT-BRAINSTORMING.md" ]; then ok "canonique present"; else ko "canonique absent"; fi
# pile gouvernante : aucun fichier actif ne doit traiter v2 comme source
# (mentions legitimes : en-tete de migration du canonique, stub v2, archive/, tests/)
PILE=$(ls "$BACKUP"/*.md "$BACKUP"/ChatGPT*/*.md 2>/dev/null | grep -v "PROMPT-BRAINSTORMING-v2.md" | grep -v "PROMPT-BRAINSTORMING.md" || true)
# mentions legitimes : notes de migration declarant v2 supersede (contiennent "stub")
refs=""
for f in $PILE; do
  if grep -q "PROMPT-BRAINSTORMING-v2" "$f" 2>/dev/null; then
    if ! grep "PROMPT-BRAINSTORMING-v2" "$f" | grep -qi "stub"; then refs="$refs $f"; fi
  fi
done
if [ -z "$refs" ]; then ok "aucune reference active a v2"; else ko "references actives a v2 : $refs"; fi
for loader in "$BACKUP/ChatGPT Brainstorming/00-instructions-projet.md" "$BACKUP/ChatGPT ARION/00-instructions-projet.md"; do
  proj=$(basename "$(dirname "$loader")")
  if grep -q "PROMPT-BRAINSTORMING.md" "$loader"; then ok "canonique cite par $proj"; else ko "canonique non cite par $loader"; fi
done

echo "== 3. pas de routing stale (Qwen) dans la pile gouvernante =="
stale=$(grep -li "qwen" $PILE 2>/dev/null || true)
if [ -z "$stale" ]; then ok "aucune mention Qwen dans la pile gouvernante"; else ko "mentions Qwen : $stale"; fi
if grep -q "Muse Spark" "$BACKUP/REPARTITION-RUNTIMES.md" && grep -q "Muse Spark" "$BACKUP/ENVIRONMENT-MAP.md" && grep -q "Muse Spark" "$BACKUP/PROMPT-BRAINSTORMING.md"; then
  ok "fallback Muse Spark dans les 3 fichiers"
else
  ko "fallback Muse Spark manquant (REPARTITION/ENVIRONMENT/PROMPT)"
fi

echo "== 4. Opus conditionnel, jamais systematique =="
syslog=$(grep -l "quelle que soit la classe\|doit injecter .MCP CLAUDE OPUS" $PILE 2>/dev/null || true)
if [ -z "$syslog" ]; then ok "pas d'Opus systematique"; else ko "Opus systematique residuel : $syslog"; fi
if grep -q "NON REQUIS" "$BACKUP/PROMPT-BRAINSTORMING.md"; then ok "clause NON REQUIS presente"; else ko "clause NON REQUIS absente du canonique"; fi

echo "== 5. Astra JIT, jamais bootstrap, assaini =="
astra="$BACKUP/ChatGPT ARION/Model-prompt-astra-6-extrait.md"
n=$(wc -c < "$astra")
if [ "$n" -le 4000 ]; then ok "extrait Astra compact ($n car.)"; else ko "extrait Astra trop gros ($n car.)"; fi
if grep -q "privaterelay\|auth0ClientId\|statsigPayload" "$astra"; then ko "residus d'etat web dans l'extrait Astra"; else ok "aucun residu d'etat web"; fi
if grep -q "JIT" "$BACKUP/ChatGPT ARION/00-instructions-projet.md"; then ok "loader ARION qualifie Astra en JIT"; else ko "loader ARION ne qualifie pas Astra en JIT"; fi

echo "== 6. aucun secret/identifiant prive dans le depot =="
secrets=$(grep -rIl -E "ctx7sk-|gho_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|BEGIN [A-Z ]*PRIVATE KEY|privaterelay|auth0ClientId" \
          "$BACKUP" --exclude-dir=.git --exclude-dir=tests 2>/dev/null | head -5)
if [ -z "$secrets" ]; then ok "aucun motif de secret (archive incluse)"; else ko "secrets repérés : $secrets"; fi

echo
echo "== total : $pass PASS / $fail FAIL =="
[ "$fail" -eq 0 ]
