#!/usr/bin/env bash
# run.sh - the gate chain for computer-use v2. Every gate must exit 0; the first failure does
# NOT stop the chain (a wave reports all of its failures), but the chain's exit is non-zero if
# any gate failed.
#
#   run.sh            the fast gates + the behavioural gates (C3 proof, isolation)
#   run.sh --slow     also the behavioural MUTANTS: each of those gates must FAIL on a
#                     behavioural defect, or it is not a gate
#
# Exit: 0 every gate held, 1 at least one failed.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
declare -a NAMES RCS
run() { local name="$1"; shift; local out rc
        out="$("$@" 2>&1)"; rc=$?
        NAMES+=("$name"); RCS+=("$rc")
        printf '%-30s %s\n' "$name" "$([ $rc -eq 0 ] && echo PASS || echo "FAIL (rc=$rc)")"
        [ $rc -ne 0 ] && printf '%s\n' "$out" | tail -12 | sed 's/^/    | /'
        return 0; }

echo "══ computer-use v2 · the gate chain ══"
run "cmp-guard      (A9)"        bash "$HERE/cmp-guard.sh"
run "strings        (A1-A11)"    bash "$HERE/strings.sh"
run "mutate         (detectors)" bash "$HERE/mutate.sh"
run "state battery  (V6)"        bash -c "cd '$HERE/../scoped' && bun test workspace-scoping.test.ts"
run "mcp            (V9)"        bash "$HERE/mcp.sh"
run "c3-no-raise    (V3)"        bash "$HERE/c3-no-raise.sh"
run "isolation      (V4/V5)"     bash "$HERE/isolation.sh"
[ "${1:-}" = "--slow" ] && run "mutate --slow (gates bite)" bash "$HERE/mutate.sh" --slow
run "leak-check     (nothing left)" bash "$HERE/leak-check.sh"   # the LAST gate: the chain must leave no display, compositor or browser behind

fail=0; for rc in "${RCS[@]}"; do [ "$rc" -ne 0 ] && fail=$((fail+1)); done
echo "══ ${#NAMES[@]} gates · $fail failed ══"
[ "$fail" -eq 0 ]
