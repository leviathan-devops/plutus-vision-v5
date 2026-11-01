#!/usr/bin/env bash
# run.sh - the PINEBOX gate chain. Every gate must exit 0; a failure does not stop the chain
# (a wave reports all of its failures), but the chain's exit is non-zero if any gate failed.
#
#   run.sh            strings + mutants + inject + mcp + the 2-instance multi gate
#   run.sh --full     also the blueprint's P9: SEVEN concurrent instances
#
# Exit: 0 every gate held, 1 at least one failed.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
declare -a NAMES RCS
run() { local name="$1"; shift; local out rc
        out="$("$@" 2>&1)"; rc=$?
        NAMES+=("$name"); RCS+=("$rc")
        printf '%-34s %s\n' "$name" "$([ $rc -eq 0 ] && echo PASS || echo "FAIL (rc=$rc)")"
        [ $rc -ne 0 ] && printf '%s\n' "$out" | grep -vE '^[0-9]+$' | tail -14 | sed 's/^/    | /'
        return 0; }

echo "══ PINEBOX · the gate chain ══"
run "strings        (B1 B2 B4 B12 B13)" bash "$HERE/strings.sh"
run "mutate         (detectors bite)"   bash "$HERE/mutate.sh"
run "inject         (P0 P1 B3 B10)"     bash "$HERE/inject.sh"
run "mcp            (P11 P12)"          bash "$HERE/mcp.sh"
run "hardening       (display-free)"     bash "$HERE/hardening.sh"
run "ext forwarder  (repo A)"           bash "${PB_EXT_TEST:-$HOME/.omp/agent/extensions/pinebox/test/forwarder.sh}"
run "room           (ST-2 ST-3)"        bash "$HERE/room.sh"
run "multi N=2      (P8 P10 B5-B7)"     bash "$HERE/multi.sh" 2
[ "${1:-}" = "--full" ] && run "multi N=7      (P9)"          bash "$HERE/multi.sh" 7
run "leak-check     (nothing left)"     bash "${CU_EXT:-$HOME/.omp/agent/extensions/computer-use-v2}/test/leak-check.sh"
run "deploy verify  (seal/helpers/mcp/probe)" bash "${CU_EXT:-$HOME/.omp/agent/extensions/computer-use-v2}/deploy.sh" verify
# A18/A19: every design blueprint must carry its mandatory sections and no duration-sized phase.
run "blueprint-gate (A18 A19)"     env HERE="$HERE" bash -c 'PV="$(cd "$HERE/../../.." && pwd)"; for f in "$PV"/design/DESIGN_BLUEPRINT_AGENT_DESK_v3.md "$PV"/design/DESIGN_BLUEPRINT_v2.0_AUTHORITATIVE.md "$PV"/design/DESIGN_BLUEPRINT_P3_EVIDENCE_TICKET_JUDGE.md; do [ -f "$f" ] && bash "$PV"/gates/blueprint-gate.sh "$f" || exit 1; done'

fail=0; for rc in "${RCS[@]}"; do [ "$rc" -ne 0 ] && fail=$((fail+1)); done
echo "══ ${#NAMES[@]} gates · $fail failed ══"
[ "$fail" -eq 0 ]
