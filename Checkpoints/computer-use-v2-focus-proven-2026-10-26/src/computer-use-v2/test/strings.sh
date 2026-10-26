#!/usr/bin/env bash
# strings.sh - the mechanical anti-pattern detectors of blueprint section 12: A1 A2 A3 A6
# A7 A8 A10. Each row is a defect class this build will produce unless something stops it;
# each is a predicate that prints a TOKEN and exits non-zero.
#
# A4/A5 live in isolation.sh, A9 in cmp-guard.sh. Exit: 0 all hold, 1 a detector fired.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E="$(cd "$HERE/.." && pwd)"
export PATH="$E:$PATH"
FAIL=0
pass() { printf '  PASS  %-4s %s\n' "$1" "$2"; }
fail() { FAIL=$((FAIL+1)); printf '  FAIL  %-4s %s\n        %s\n' "$1" "$2" "$3"; }

echo "── anti-pattern detectors (blueprint section 12) ──"

# A1 - a focus steal creeps in. The raise primitives may appear in core/ ONLY on the line
# that REFUSES them. (The one permitted raise is in helpers/hostwin.c, outside core/.)
hits="$(grep -rnE 'windowactivate|windowfocus|wmctrl -a|ontop|windowraise' "$E/core" "$E/mcp" "$E/computer" 2>/dev/null \
        | grep -v 'ACTIVATE_FORBIDDEN\|RAISE_TOKENS')"
[ -z "$hits" ] && pass A1 "no raise/activate/focus primitive in core/, mcp/ or the launcher" \
               || fail A1 "FOCUS_STEAL_CREPT_IN" "$hits"

# A1b - the raise SURFACE. A1 greps for the shell primitives; the real raise is a helper
# call, which that grep cannot see (a reviewer injected one and A1 still printed PASS). The
# helper's `raise` verb may be called in exactly ONE place: the weston-x11 adapter's view op.
n_all="$(grep -rnE 'hostwin"? +"?\$?[A-Za-z_{}]+"? +raise' "$E/core" "$E/mcp" "$E/computer" 2>/dev/null | wc -l)"
n_ok="$(grep -nE 'hostwin"? +"?\$?[A-Za-z_{}]+"? +raise' "$E/core/adapters/weston-x11.sh" 2>/dev/null | wc -l)"
[ "$n_all" -eq 1 ] && [ "$n_ok" -eq 1 ] && pass A1b "exactly one raise call exists, in adapters/weston-x11.sh (the view op)" \
  || fail A1b "RAISE_SURFACE_WIDENED" "$(grep -rnE 'hostwin"? +"?\$?[A-Za-z_{}]+"? +raise' "$E/core" "$E/mcp" "$E/computer" 2>/dev/null) (found $n_all, expected 1 in the adapter)"

# A2 - a hardcoded display. Displays are discovered, never named.
hits="$(grep -rnE 'DISPLAY=:[0-9]' "$E/core" "$E/mcp" "$E/computer" 2>/dev/null)"
[ -z "$hits" ] && pass A2 "no hardcoded DISPLAY=:N in core/" || fail A2 "HARDCODED_DISPLAY" "$hits"

# A3 - a compositor named outside its adapter. core/*.sh (not adapters/) must never say it.
hits="$(grep -n -i 'weston' "$E"/core/*.sh 2>/dev/null)"
[ -z "$hits" ] && pass A3 "core/*.sh names no compositor; only adapters/ does" \
               || fail A3 "COMPOSITOR_OUTSIDE_ADAPTER" "$hits"

# A6 - a mode that renders nowhere. The forbidden token is READ AT RUNTIME from the
# operator's own rule file - never hardcoded here, so this script cannot drift from the rule.
RULE="$(grep -lE '^# [A-Za-z]+ IS FORBIDDEN' "$HOME"/.omp/agent/rules/*.md 2>/dev/null | head -1)"
if [ -z "$RULE" ]; then
  fail A6 "RULE_FILE_ABSENT" "no rule under ~/.omp/agent/rules/ names a forbidden mode, so the check cannot run (it is not silently skipped)"
else
  tok="$(grep -m1 -oE '^# [A-Za-z]+ IS FORBIDDEN' "$RULE" | awk '{print $2}')"
  hits="$(grep -rniE "$tok" "$E/core" "$E/helpers" "$E/mcp" "$E/index.ts" "$E/computer" 2>/dev/null)"
  [ -z "$hits" ] && pass A6 "the forbidden mode '$tok' (read from $(basename "$RULE")) appears nowhere in the tool" \
                 || fail A6 "FORBIDDEN_MODE_PRESENT" "$hits"
fi

# A7 - the fork must not have edited v1. v1's hash was pinned before this build started.
V1="$HOME/.omp/agent/extensions/computer-use/index.js"
want="$(cut -d' ' -f1 "$HERE/v1.sha256")"; got="$(sha256sum "$V1" 2>/dev/null | cut -d' ' -f1)"
[ -n "$got" ] && [ "$want" = "$got" ] && pass A7 "v1 index.js is byte-identical to its pinned hash (${got:0:12})" \
                                      || fail A7 "V1_EDITED" "pinned $want, found ${got:-<missing>}"

# A8 - the guest never starts on a Linux host: the selected runtime MUST be native.
rt="$(computer probe 2>/dev/null | jq -r '.selected.runtime' 2>/dev/null)"
[ "$rt" = native ] && pass A8 "probe selects runtime=native on this Linux host" \
                   || fail A8 "GUEST_ON_LINUX" "selected.runtime='$rt'"

# A10 - a claim with no probe: every adapter's probe() returns the evidence it used.
pj="$(computer probe 2>/dev/null)"
n_all="$(printf '%s' "$pj" | jq '.surface.adapters | length' 2>/dev/null)"
n_ev="$(printf '%s' "$pj" | jq '[.surface.adapters[] | select(has("evidence") and (.evidence|type=="object") and ((.available==true) or ((.reason|length)>0)))] | length' 2>/dev/null)"
[ -n "$n_all" ] && [ "$n_all" -ge 4 ] && [ "$n_all" = "$n_ev" ] \
  && pass A10 "all $n_all adapters return evidence, and every unavailable one names its reason" \
  || fail A10 "ADAPTER_PROBE_NO_EVIDENCE" "adapters=$n_all with-evidence=$n_ev"

# A11 - a refusing helper substituted in $(...) without `|| exit` makes the caller carry on.
if "$HERE/subshell-exit.sh" >/tmp/cu-sub.out 2>&1; then pass A11 "no refusing helper is substituted without '|| exit \$?'"
else fail A11 "SUBSHELL_EXIT_LEAK" "$(cat /tmp/cu-sub.out)"; fi

echo
[ "$FAIL" -eq 0 ] && { echo " STRINGS: all detectors hold"; exit 0; }
echo " STRINGS: $FAIL detector(s) fired"; exit 1
