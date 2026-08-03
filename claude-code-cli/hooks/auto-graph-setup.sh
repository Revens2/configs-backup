#!/usr/bin/env bash
# SessionStart hook — auto-provisionne CodeGraph + Graphify sur tout projet
# qui possède un CLAUDE.md, puis lance le build et documente les outils
# dans le CLAUDE.md du projet.
#
# Tout ce qui est lourd (index, extraction, build) part en arrière-plan :
# le hook ne doit jamais bloquer le démarrage de la session.

set -uo pipefail

PROJ="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$PROJ" 2>/dev/null || exit 0

# 1. Garde principale : pas de CLAUDE.md => on ne touche à rien.
[ -f "CLAUDE.md" ] || exit 0

STATE_DIR="$PROJ/.claude"
mkdir -p "$STATE_DIR" 2>/dev/null
LOG="$STATE_DIR/auto-graph-setup.log"
LOCK="$STATE_DIR/.auto-graph-setup.lock"

# 2. Verrou : une seule provision en vol à la fois (lock périmé après 1h).
if [ -f "$LOCK" ]; then
  now=$(date +%s)
  then_=$(cat "$LOCK" 2>/dev/null || echo 0)
  [ $((now - then_)) -lt 3600 ] && exit 0
fi

CODEGRAPH="$HOME/.cargo/bin/codegraph.exe"
[ -x "$CODEGRAPH" ] || CODEGRAPH="$(command -v codegraph.exe 2>/dev/null || true)"
GRAPHIFY="$(command -v graphify 2>/dev/null || true)"

need_codegraph=0
need_graphify=0
[ -n "$CODEGRAPH" ] && [ ! -d "$PROJ/.codegraph" ] && need_codegraph=1
[ -n "$GRAPHIFY" ]  && [ ! -d "$PROJ/graphify-out" ] && need_graphify=1

# 3. Bloc de doc dans le CLAUDE.md du projet (synchrone, instantané).
if ! grep -q "AUTO_GRAPH_START" "CLAUDE.md" 2>/dev/null; then
  cat >> "CLAUDE.md" <<'BLOCK'

<!-- AUTO_GRAPH_START -->
## Navigation du code — CodeGraph & Graphify

Ce projet est indexé par deux graphes. **Passe par eux avant `Grep`/`Glob`/lecture
exhaustive** : ils répondent en une passe là où une recherche textuelle demande
dix allers-retours.

- **CodeGraph** (`.codegraph/`) — graphe AST + recherche sémantique, via MCP
  `mcp__codegraph__*`. Point d'entrée : `codegraph_context` (décris la tâche,
  récupère tout le contexte utile). Détail des outils : section « CodeGraph —
  Codebase Intelligence » plus bas dans ce fichier.
- **Graphify** (`graphify-out/graph.json`) — graphe de connaissance du projet
  (code *et* docs), communautés et god nodes.

### Graphify — commandes
Toute question sur l'architecture, le rôle d'un fichier ou le contenu du projet
se traite **d'abord comme une requête graphify** (skill `graphify`) :
- `graphify query "<question>"` — traversée BFS depuis la question.
- `graphify explain "<noeud>"` — explication d'un nœud et de son voisinage.
- `graphify path "A" "B"` — chemin le plus court entre deux nœuds.
- `graphify god-nodes` — les hubs architecturaux du projet.
- `graphify affected "X"` — ce qui est impacté par un changement sur X.

Réindexation : `codegraph index` et `graphify update .` (les deux sont incrémentaux).
<!-- AUTO_GRAPH_END -->
BLOCK
  echo "[$(date -Iseconds)] bloc CodeGraph/Graphify ajouté à CLAUDE.md" >> "$LOG"
fi

# Rien de lourd à faire ? on s'arrête ici.
[ "$need_codegraph" = 0 ] && [ "$need_graphify" = 0 ] && exit 0

date +%s > "$LOCK"

# 4. Provision lourde, détachée.
(
  {
    echo "=== [$(date -Iseconds)] provision auto : $PROJ ==="

    # run <secondes> <libellé> <cmd...> : borne chaque étape.
    # `codegraph index` est connu pour stagner indéfiniment sur certains projets ;
    # sans timeout, un hook de session laisserait un processus zombie par projet.
    run() {
      local secs="$1" label="$2"; shift 2
      echo "--- $label ---"
      timeout -k 10 "$secs" "$@" 2>&1
      local rc=$?
      case $rc in
        0)   echo "[ok] $label" ;;
        124|137) echo "[TIMEOUT ${secs}s] $label — abandonné, à relancer à la main" ;;
        *)   echo "[échec rc=$rc] $label" ;;
      esac
      return 0
    }

    if [ "$need_codegraph" = 1 ]; then
      # codegraph télécharge ~615 Mo de modèle ONNX
      # (jina-embeddings-v2-base-code) dans un ".fastembed_cache" RELATIF au
      # projet, sans afficher de progression : sans partage, chaque nouveau
      # projet repaie 130 s+ de téléchargement. FASTEMBED_CACHE_PATH/HF_HOME
      # sont ignorés (codegraph force son propre cache_dir), donc on monte une
      # jonction NTFS vers un cache global. Mesuré : 134 s -> 2 s.
      SHARED_CACHE="$HOME/.cache/fastembed"
      if [ -d "$SHARED_CACHE" ] && [ ! -e "$PROJ/.fastembed_cache" ]; then
        cmd //c mklink //J ".fastembed_cache" "$(cygpath -w "$SHARED_CACHE")" >/dev/null 2>&1 \
          && echo "[cache] jonction .fastembed_cache -> $SHARED_CACHE"
      fi
      # Jamais versionner le cache ni l'index (exclude local, on ne touche pas
      # au .gitignore du projet).
      if [ -d "$PROJ/.git" ]; then
        for p in .fastembed_cache .codegraph graphify-out; do
          grep -qxF "$p" "$PROJ/.git/info/exclude" 2>/dev/null \
            || echo "$p" >> "$PROJ/.git/info/exclude"
        done
      fi
      # -y obligatoire : sans lui, init attend une réponse interactive.
      run 2400 "codegraph init" "$CODEGRAPH" init -y
      # Premier remplissage du cache global si la jonction n'a pas pu servir.
      if [ ! -d "$SHARED_CACHE" ] && [ -d "$PROJ/.fastembed_cache" ]; then
        mkdir -p "$SHARED_CACHE" && cp -r "$PROJ/.fastembed_cache/." "$SHARED_CACHE/" \
          && echo "[cache] cache global amorcé depuis ce projet"
      fi
    fi

    [ "$need_graphify" = 1 ] && run 900 "graphify update (AST, sans LLM)" "$GRAPHIFY" update .

    # 5. Build du projet, une fois l'indexation faite.
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
      if   [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then run 1800 build bun run build
      elif [ -f "pnpm-lock.yaml" ]; then run 1800 build pnpm run build
      elif [ -f "yarn.lock" ];      then run 1800 build yarn build
      else                               run 1800 build npm run build
      fi
    elif [ -f "Cargo.toml" ];    then run 1800 build cargo build
    elif [ -f "pyproject.toml" ]; then run 1800 build python -m build
    elif [ -f "Makefile" ];      then run 1800 build make
    else echo "--- build --- aucune cible détectée, ignoré"
    fi

    echo "=== [$(date -Iseconds)] terminé ==="
  } >> "$LOG" 2>&1
  rm -f "$LOCK"
) </dev/null >/dev/null 2>&1 &

# 6. Contexte injecté dans la session en cours.
cat <<EOF
CodeGraph/Graphify : provision automatique lancée en arrière-plan pour ce projet
(CLAUDE.md détecté). Journal : .claude/auto-graph-setup.log
Les outils seront disponibles à la prochaine session ; d'ici là, navigue normalement.
EOF
exit 0

