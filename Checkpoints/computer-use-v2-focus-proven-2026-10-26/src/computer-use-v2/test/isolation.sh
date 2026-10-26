#!/usr/bin/env bash
# isolation.sh - anti-patterns A4 and A5, plus the orphan and leak guarantees.
#
#   A4  `up --id 0` twice            -> the second exits 1 with INSTANCE_LIVE
#   A5  two instances, `down --id 0` -> id 1's display still answers xdpyinfo
#   +   a record lost while its compositor lives -> a second `up` is refused, and
#       `down --orphans` removes exactly that compositor
#   +   `down --all` leaves no compositor, no chrome, no socket
#
# Runs on a fresh replica display. Exit: 0 all hold, 1 a check failed.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E="$(cd "$HERE/.." && pwd)"
LIBDIR="${CU_LIB_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/computer-use/lib}"
export PATH="$E:$PATH"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }

export CU_STATE_ROOT="/tmp/cu-iso-$$"
D="$("$HERE/replica.sh" up)" || { echo "NO_REPLICA"; exit 1; }
OP="$("$HERE/replica.sh" operator "$D")" || exit 1
export CU_HOST_DISPLAY="$D"
cleanup() { computer shell down --all >/dev/null 2>&1; "$HERE/replica.sh" down "$D" >/dev/null 2>&1; rm -rf "$CU_STATE_ROOT"; }
trap cleanup EXIT INT TERM
slot_of() { computer shell list | jq -r --arg i "$1" '.instances[] | select(.id==($i|tonumber)) | .record.x_slot'; }
answers() { DISPLAY=":$1" timeout 4 xdpyinfo >/dev/null 2>&1; }

echo "── A4: a second 'up' on one id ──"
computer shell up --id 0 >/dev/null 2>&1; [ $? -eq 0 ] && ok "up --id 0" || { bad "up --id 0" "did not start"; exit 1; }
out="$(computer shell up --id 0 2>&1)"; rc=$?
[ $rc -eq 1 ] && ok "the second up --id 0 exited 1" || bad "second up exit code" "rc=$rc"
case "$out" in *INSTANCE_LIVE*) ok "...with the token INSTANCE_LIVE";; *) bad "INSTANCE_LIVE token" "$out";; esac
[ "$(pgrep -fc -- '--socket=computer-use0')" -eq 1 ] && ok "exactly ONE compositor holds --socket=computer-use0" \
  || bad "duplicate compositor for one id" "$(pgrep -fc -- '--socket=computer-use0') processes"

echo; echo "── A5: scoped teardown ──"
computer shell up --id 1 >/dev/null 2>&1 && ok "up --id 1" || bad "up --id 1" "did not start"
s0="$(slot_of 0)"; s1="$(slot_of 1)"
[ -n "$s0" ] && [ -n "$s1" ] && [ "$s0" != "$s1" ] && ok "distinct displays: id 0 on :$s0, id 1 on :$s1" || bad "slots" "s0=$s0 s1=$s1"
answers "$s0" && answers "$s1" && ok "both displays answer xdpyinfo" || bad "displays before down" ""
computer shell down --id 0 >/dev/null 2>&1
answers "$s1" && ok "after down --id 0, id 1's :$s1 STILL answers (no sibling was killed)" || bad "sibling killed" ":$s1 is dead"
sleep 1
answers "$s0" && bad "id 0 survived down" ":$s0 still answers" || ok "id 0's :$s0 is gone"
[ "$("$LIBDIR/hostwin" "$D" top)" = "$OP" ] && ok "the operator window stayed on top through both ups and a down" \
  || bad "operator displaced" "top=$("$LIBDIR/hostwin" "$D" top)"

echo; echo "── orphan: the registry loses a live compositor ──"
rm -f "$CU_STATE_ROOT/i1/state.env"
out="$(computer shell up --id 1 2>&1)"; rc=$?
[ $rc -eq 1 ] && case "$out" in *INSTANCE_LIVE*untracked*) ok "a second up is refused and names the untracked compositor";; *) bad "orphan refusal wording" "$out";; esac \
              || bad "orphan not refused" "rc=$rc $out"
computer shell down --orphans >/dev/null 2>&1; sleep 1.5
[ "$(pgrep -fc -- '--socket=computer-use1')" -eq 0 ] && ok "down --orphans removed exactly that compositor" || bad "orphan survived" ""
computer shell up --id 1 >/dev/null 2>&1 && ok "id 1 can be brought up again afterwards" || bad "re-up after orphan reap" ""

echo; echo "── leak: down --all ──"
computer shell up --id 2 >/dev/null 2>&1
computer shell spawn --id 2 -- xev -geometry 200x200 >/dev/null 2>&1
computer shell down --all >/dev/null 2>&1; sleep 1.5
n="$(pgrep -fc -- '--socket=computer-use')"; [ "$n" -eq 0 ] && ok "no compositor left" || bad "compositor leak" "$n"
n="$(pgrep -fc -- 'xev -geometry 200x200')"; [ "$n" -eq 0 ] && ok "no app left" || bad "app leak" "$n"
n="$(ls "$CU_STATE_ROOT"/i*/state.env 2>/dev/null | wc -l)"; [ "$n" -eq 0 ] && ok "no instance record left" || bad "record leak" "$n"

echo; printf ' ISOLATION: PASS %d · FAIL %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
