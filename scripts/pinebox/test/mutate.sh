#!/usr/bin/env bash
# mutate.sh - prove PINEBOX's detectors can FIRE. Each mutant injects ONE violation into a COPY
# of the tree (and, for B1, into a throwaway git repo) and the detector must exit non-zero and
# name the right token; then the unmutated copy must pass. A detector that stays silent on its
# own violation is not a gate. Exit: 0 all, 1 otherwise.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PB="$(cd "$HERE/.." && pwd)"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }
W="$(mktemp -d /tmp/pb-mut.XXXXXX)"; trap 'rm -rf "$W"' EXIT

fresh() {
  rm -rf "$W/repo"; mkdir -p "$W/repo/pine-ide/ide" "$W/repo/scripts"
  cp -a "$PB" "$W/repo/scripts/pinebox"; rm -rf "$W/repo/scripts/pinebox/core"
  echo "page" > "$W/repo/pine-ide/ide/pine.html"
  ( cd "$W/repo" && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm base )
}
run() { PB_TREE="$W/repo/scripts/pinebox" PB_REPO="$W/repo" bash "$W/repo/scripts/pinebox/test/strings.sh" 2>&1; }
RULE_FILE="$(grep -lE '^# [A-Za-z]+ IS FORBIDDEN' "$HOME"/.omp/agent/rules/*.md 2>/dev/null | head -1)"
[ -n "$RULE_FILE" ] || RULE_FILE="$HOME/.omp/agent/rules-disabled/headless-forbidden.md"
TOK="$(grep -m1 -oE '^# [A-Za-z]+ IS FORBIDDEN' "$RULE_FILE" | awk '{print tolower($2)}')"

mutant() { # name token 'injection (cwd = $W/repo)'
  fresh; ( cd "$W/repo" && eval "$3" )
  local out rc; out="$(run)"; rc=$?
  if [ $rc -ne 0 ] && printf '%s' "$out" | grep -q "$2"; then ok "$1 -> $2 (rc=$rc)"
  else bad "$1" "expected rc!=0 and '$2'; got rc=$rc: $(printf '%s' "$out" | grep -E 'FAIL' | head -2 | tr '\n' ' ')"; fi
}

echo "── every PINEBOX detector must fire on its own violation ──"
mutant "B1  a file under pine-ide/ edited"       PINE_IDE_EDITED           'echo "// edited" >> pine-ide/ide/pine.html'
mutant "B2  a hardcoded base port in a stage"    HARDCODED_PORT_OUTSIDE_BLOCK 'echo "X=$((9800 + 51))" >> scripts/pinebox/stages/page.sh'
mutant "B4  a raise call in a stage"             RAISE_FORBIDDEN           'w=window; echo "xdotool ${w}activate \$w" >> scripts/pinebox/stages/page.sh'
mutant "B4  the helper raise verb in a stage"    RAISE_FORBIDDEN           'r=ra; echo "\"\$LIBDIR/hostwin\" \$h ${r}ise \$w" >> scripts/pinebox/stages/page.sh'
mutant "B12 the forbidden mode in a stage"       FORBIDDEN_MODE_PRESENT    "echo '# a $TOK mode' >> scripts/pinebox/stages/page.sh"
mutant "B13 a generated __pycache__ in the tree" GENERATED_ARTIFACT_IN_TREE 'mkdir -p scripts/pinebox/__pycache__ && touch scripts/pinebox/__pycache__/x.pyc'

echo; echo "── and the detectors must HOLD on the unmutated tree ──"
fresh; out="$(run)"; rc=$?
[ $rc -eq 0 ] && ok "strings.sh holds on the original" || bad "strings.sh fired on clean code" "$(printf '%s' "$out" | grep FAIL | head -2 | tr '\n' ' ')"

echo; printf ' MUTATE: PASS %d · FAIL %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
