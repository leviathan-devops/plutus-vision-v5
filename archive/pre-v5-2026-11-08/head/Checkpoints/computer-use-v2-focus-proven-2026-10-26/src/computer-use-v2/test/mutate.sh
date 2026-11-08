#!/usr/bin/env bash
# mutate.sh - prove every detector can FIRE. A gate that has never failed is documentation.
#
# For each detector, copy the tree, inject exactly ONE violation of the class it guards,
# run the detector against the copy, and require that it exits non-zero and names the right
# token. Then run it against the unmutated copy and require exit 0. A detector that stays
# silent on its own violation (or fires on clean code) is itself a defect.
#
# Exit: 0 every detector fired on its mutant and held on the original, 1 otherwise.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E="$(cd "$HERE/.." && pwd)"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }

W="$(mktemp -d /tmp/cu-mut.XXXXXX)"
trap 'rm -rf "$W"' EXIT

fresh() { rm -rf "$W/t"; mkdir -p "$W/t"; cp -a "$E/." "$W/t/"; }

# mutant NAME TOKEN SCRIPT 'shell snippet that injects the violation into $W/t'
mutant() {
  local name="$1" token="$2" script="$3" inject="$4" out rc
  fresh; ( cd "$W/t" && eval "$inject" )
  out="$(bash "$W/t/test/$script" 2>&1)"; rc=$?
  if [ $rc -ne 0 ] && printf '%s' "$out" | grep -q "$token"; then ok "$name -> $token (rc=$rc)"
  else bad "$name" "expected rc!=0 and '$token'; got rc=$rc: $(printf '%s' "$out" | tail -2 | tr '\n' ' ')"; fi
}

echo "── every detector must fire on its own violation ──"
# the forbidden-mode token is read from the operator's rule, never typed here
TOK="$(grep -m1 -oE '^# [A-Za-z]+ IS FORBIDDEN' "$(grep -lE '^# [A-Za-z]+ IS FORBIDDEN' "$HOME"/.omp/agent/rules/*.md | head -1)" | awk '{print tolower($2)}')"

mutant "A1  a raise call in core/"            FOCUS_STEAL_CREPT_IN   strings.sh 'echo "DISPLAY=\$d xdotool windowactivate \$w" >> core/drive.sh'
mutant "A2  a hardcoded display"              HARDCODED_DISPLAY      strings.sh 'echo "DISPLAY=:7 xdpyinfo" >> core/drive.sh'
mutant "A3  a compositor named in core/"      COMPOSITOR_OUTSIDE_ADAPTER strings.sh 'echo "# uses weston" >> core/lib.sh'
mutant "A6  the forbidden mode in core/"      FORBIDDEN_MODE_PRESENT strings.sh "echo '# a $TOK mode' >> core/lib.sh"
mutant "A7  v1 edited (pinned hash differs)"  V1_EDITED              strings.sh 'echo 0000000000000000000000000000000000000000000000000000000000000000 > test/v1.sha256'
mutant "A9  a scoped file edited"             SCOPED_FILE_EDITED     cmp-guard.sh 'echo "// tampered" >> scoped/scope-guard.ts'
mutant "A9  a scoped file missing"            SCOPED_FILE_MISSING    cmp-guard.sh 'rm scoped/session-state.ts'
mutant "A1b a second raise call in core/"     RAISE_SURFACE_WIDENED  strings.sh 'echo "  \"\$LIBDIR/hostwin\" \"\$h\" raise \"\$w\"" >> core/drive.sh'
mutant "A11 a refusing fn substituted bare"   SUBSHELL_EXIT_LEAK     subshell-exit.sh 'echo "  zz=\"\$(drv_spawn \"\$id\")\"" >> core/drive.sh'

if [ "${1:-}" = "--slow" ]; then
  echo; echo "── the BEHAVIOURAL gates must fail on a behavioural defect (each runs on a replica display) ──"
  # a drive verb that raises the instance's window: the C3 ladder MUST fail
  mutant "C3  a click that raises the window"   "FAIL  click (X path)"  c3-no-raise.sh 'python3 - <<PY
p="core/drive.sh"; s=open(p).read()
s=s.replace("DISPLAY=\":\$slot\" xdotool mousemove --window", "\"\$LIBDIR/hostwin\" \"\$(rec_get \"\$id\" host_display)\" raise \"\$(rec_get \"\$id\" host_win)\"; DISPLAY=\":\$slot\" xdotool mousemove --window",1)
open(p,"w").write(s)
PY'
  # a registry that forgets live instances: A4 (a second up must be refused) MUST fail
  mutant "A5  registry forgets live instances"  "FAIL  sibling killed"  isolation.sh 'python3 - <<PY
p="core/govern.sh"; s=open(p).read()
s=s.replace("inst_live() { inst_pid \"\$1\" >/dev/null; }","inst_live() { return 1; }",1)
open(p,"w").write(s)
PY'
fi

echo; echo "── and every detector must HOLD on the unmutated tree ──"
fresh
for s in strings.sh cmp-guard.sh subshell-exit.sh; do
  out="$(bash "$W/t/test/$s" 2>&1)"; rc=$?
  [ $rc -eq 0 ] && ok "$s holds on the original" || bad "$s fired on clean code" "$(printf '%s' "$out" | grep -E 'FAIL' | head -2 | tr '\n' ' ')"
done

echo; printf ' MUTATE: PASS %d · FAIL %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
