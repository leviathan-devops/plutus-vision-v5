#!/usr/bin/env bash
# strings.sh - PINEBOX's mechanical anti-pattern detectors (blueprint section 11): B1 B2 B4/B8 B12.
# Each is a predicate that prints a TOKEN and exits non-zero; test/mutate.sh proves each can fire.
#
#   strings.sh                     against the real tree
#   PB_TREE=<dir> PB_REPO=<dir> strings.sh     against a copy (used by the mutants)
#
# Exit: 0 every detector holds, 1 a detector fired.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TREE="${PB_TREE:-$(cd "$HERE/.." && pwd)}"            # scripts/pinebox
REPO="${PB_REPO:-$(cd "$TREE/../.." && pwd)}"         # PLUTUS_VISION (a git repo)
FAIL=0
pass() { printf '  PASS  %-4s %s\n' "$1" "$2"; }
fail() { FAIL=$((FAIL+1)); printf '  FAIL  %-4s %s\n        %s\n' "$1" "$2" "$3"; }

echo "── PINEBOX anti-pattern detectors (blueprint section 11) ──"

# B1 - a file under pine-ide/ is edited. The page and the backend are FROZEN.
d="$(git -C "$REPO" diff HEAD --stat -- pine-ide/ 2>/dev/null)"
[ -z "$d" ] && pass B1 "git diff HEAD --stat -- pine-ide/ is EMPTY (the page and the backend are untouched)" \
            || fail B1 "PINE_IDE_EDITED" "$d"

# B2 - a hardcoded port outside the block. The base numbers may appear ONLY in ports.sh.
base="$(bash -c "source '$HOME/.omp/agent/extensions/computer-use-v2/core/lib.sh'; source '$TREE/ports.sh'; pb_ports_json 0" 2>/dev/null | jq -r '[.station,.rail,.server,.cdp]|map(tostring)|join("|")')"
[ -n "$base" ] || { fail B2 "PORTS_UNREADABLE" "could not read the base ports from ports.sh"; base="NO_SUCH_PORT"; }
hits="$(grep -rnE "\\b($base)\\b" "$TREE" -I 2>/dev/null | grep -v '/ports\.sh:' | grep -v '__pycache__')"
[ -z "$hits" ] && pass B2 "the base port numbers appear only in ports.sh" || fail B2 "HARDCODED_PORT_OUTSIDE_BLOCK" "$hits"

# B4/B8 - a focus steal: no raise/activate/focus primitive, and no call to the helper's raise verb
w="window"; pat="${w}activate|${w}focus|wmctrl -a|ontop|${w}raise|hostwin.* ra""ise"
hits="$(grep -rnE "$pat" "$TREE" --include='*.sh' --include='pinebox' --include='*.mjs' --include='*.py' 2>/dev/null | grep -v '/test/strings.sh:')"
[ -z "$hits" ] && pass B4 "no raise/activate/focus primitive anywhere in scripts/pinebox/ (view is the CORE's verb)" \
               || fail B4 "RAISE_FORBIDDEN" "$hits"

# B12 - a mode that renders nowhere. The token is READ AT RUNTIME from the operator's own rule.
RULE="$(grep -lE '^# [A-Za-z]+ IS FORBIDDEN' "$HOME"/.omp/agent/rules/*.md 2>/dev/null | head -1)"
if [ -z "$RULE" ]; then fail B12 "RULE_FILE_ABSENT" "no rule under ~/.omp/agent/rules/ names a forbidden mode, so the check cannot run"
else
  tok="$(grep -m1 -oE '^# [A-Za-z]+ IS FORBIDDEN' "$RULE" | awk '{print $2}')"
  hits="$(grep -rniE "$tok" "$TREE" "$HOME/.omp/agent/extensions/pinebox" -I 2>/dev/null | grep -v '__pycache__')"
  [ -z "$hits" ] && pass B12 "the forbidden mode '$tok' (read from $(basename "$RULE")) appears nowhere in PINEBOX" \
                 || fail B12 "FORBIDDEN_MODE_PRESENT" "$hits"
fi

# B13 - a generated artifact in the source tree. The server imports inject.py; without
# PYTHONDONTWRITEBYTECODE it drops a __pycache__ beside it.
if find "$TREE" -name '__pycache__' -print -quit | grep -q .; then fail B13 "GENERATED_ARTIFACT_IN_TREE" "$(find "$TREE" -name '__pycache__')"
else pass B13 "no generated __pycache__ in scripts/pinebox/"; fi

echo
[ "$FAIL" -eq 0 ] && { echo " STRINGS: all detectors hold"; exit 0; }
echo " STRINGS: $FAIL detector(s) fired"; exit 1
