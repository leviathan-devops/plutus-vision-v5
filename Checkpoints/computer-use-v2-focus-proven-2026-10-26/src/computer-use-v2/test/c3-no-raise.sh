#!/usr/bin/env bash
# c3-no-raise.sh - THE FOCUS PROOF (blueprint section 13, V3: "the exit that matters most").
#
#   c3-no-raise.sh            on a fresh replica display (default): the full proof
#   c3-no-raise.sh --real     on the operator's real display: ONE instance, no stand-in
#                             window, no raise, the weaker oracle (see below)
#
# THE REQUIREMENT (the operator's, verbatim): the compositor is a headed window on the
# operator's screen that they can click into and look at, and it must NEVER take the
# primary focus - not when it opens, and not when the agent interacts with it.
#
# THE ORACLE is independent of the tool under test: `hostwin` reads the window manager's
# own records (_NET_ACTIVE_WINDOW and the top of _NET_CLIENT_LIST_STACKING) on the HOST
# display. The tool's internal c3 guard is a second opinion, not the measurement.
#
# THE CONTROLS - an oracle that cannot read a theft proves nothing:
#   NEGATIVE  do nothing for a second            -> focus and stack must read UNCHANGED
#   POSITIVE  a raw compositor, no interposer    -> must read STOLEN  (the old behaviour)
#   POSITIVE  `view`, the one permitted raise    -> must read RAISED
# If either positive control fails to read a theft the run is INSTRUMENT_INVALID, not a pass.
#
# Exit: 0 every check held, 1 a check failed, 3 the instrument is invalid.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E="$(cd "$HERE/.." && pwd)"
LIBDIR="${CU_LIB_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/computer-use/lib}"
export PATH="$E:$PATH"
MODE=replica; [ "${1:-}" = "--real" ] && MODE=real

PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }
invalid() { printf '  INSTRUMENT_INVALID  %s\n' "$1"; cleanup; exit 3; }

export CU_STATE_ROOT="/tmp/cu-c3-$$"
D=""; OP=""
# The raw control compositor is torn down by its PROCESS GROUP with KILL escalation, and the
# teardown is VERIFIED: a TERM alone was ignored once its display went away, and every run
# leaked one (six were found). A control that leaks the thing under test is not a control.
RAWPID=""
raw_down() {
  [ -n "$RAWPID" ] || return 0
  kill -TERM "-$RAWPID" 2>/dev/null; local i
  for i in $(seq 1 20); do pgrep -g "$RAWPID" >/dev/null 2>&1 || break; sleep 0.1; done
  pgrep -g "$RAWPID" >/dev/null 2>&1 && { kill -KILL "-$RAWPID" 2>/dev/null; sleep 0.3; }
  if pgrep -g "$RAWPID" >/dev/null 2>&1; then bad "the raw control compositor survived TERM and KILL" "group $RAWPID"; else RAWPID=""; fi
}
cleanup() {
  raw_down
  computer shell down --all >/dev/null 2>&1
  pkill -f "socket=cu-raw-$$" >/dev/null 2>&1
  pkill -f "user-data-dir=$CU_STATE_ROOT" >/dev/null 2>&1
  [ "$MODE" = replica ] && [ -n "$D" ] && "$HERE/replica.sh" down "$D" >/dev/null 2>&1
  rm -rf "$CU_STATE_ROOT"
}
trap cleanup EXIT INT TERM

if [ "$MODE" = replica ]; then
  D="$("$HERE/replica.sh" up)" || { echo "NO_REPLICA"; exit 3; }
  OP="$("$HERE/replica.sh" operator "$D")" || { cleanup; exit 3; }
else
  D="${DISPLAY:?--real needs DISPLAY}"
  OP="$("$LIBDIR/hostwin" "$D" active)"
fi
# TWO baselines. On a replica the operator window is both focused and on top. On the operator's
# REAL desktop the focused window may be a native Wayland client the X server cannot see
# (active = 0x0) while the top of the X stack is some other window - so each is compared to its
# OWN baseline, never to a single id.
BASE_ACTIVE="$("$LIBDIR/hostwin" "$D" active)"; BASE_TOP="$("$LIBDIR/hostwin" "$D" top)"
export CU_HOST_DISPLAY="$D"
H() { "$LIBDIR/hostwin" "$D" "$@"; }

echo "══════════════════════════════════════════════════════════════════════════"
echo " C3 · NO RAISE  ·  mode=$MODE  host display=$D  operator window=$OP"
echo "══════════════════════════════════════════════════════════════════════════"

# held LABEL: the operator's focus and the top of their stack are exactly as they were
held() {
  local a t; a="$(H active)"; t="$(H top)"
  if [ "$a" = "$BASE_ACTIVE" ] && [ "$t" = "$BASE_TOP" ]; then ok "$1"
  else bad "$1" "active=$a top=$t, expected active=$BASE_ACTIVE top=$BASE_TOP"; fi
}
# moved LABEL: a control that MUST read as a change
moved() {
  local a t; a="$(H active)"; t="$(H top)"
  if [ "$a" != "$BASE_ACTIVE" ] || [ "$t" != "$BASE_TOP" ]; then ok "$1 (read as: active=$a top=$t)"
  else invalid "$1 did not read as a change - the oracle is blind"; fi
}
refocus() { [ "$MODE" = replica ] && { DISPLAY="$D" xdotool windowactivate "$((OP))" 2>/dev/null; sleep 0.7; }; }

echo; echo "── CONTROLS (the oracle must read both outcomes) ──"
sleep 1
if [ "$MODE" = replica ]; then
  held "negative control: nothing happened"
  # a raw compositor with NO interposer = the original behaviour
  RT="$CU_STATE_ROOT/rawrt"; mkdir -p "$RT"; chmod 700 "$RT"
  env -u WAYLAND_DISPLAY DISPLAY="$D" XDG_RUNTIME_DIR="$RT" setsid weston --backend=x11-backend.so \
    --xwayland --socket="cu-raw-$$" --width=800 --height=500 --idle-time=0 >"$CU_STATE_ROOT/raw.log" 2>&1 &
  RAWPID=$!
  for _ in $(seq 1 40); do grep -q 'xserver listening' "$CU_STATE_ROOT/raw.log" 2>/dev/null && break; sleep 0.3; done
  sleep 2
  moved "positive control: a compositor WITHOUT the interposer (the old behaviour)"
  raw_down; refocus
  held "operator restored after the control"
else
  echo "  (real display: no stand-in operator window can be created; controls are run by --replica)"
fi

echo; echo "── THE INSTANCE ──"
out="$(computer shell up --id 0 2>&1)"; rc=$?
[ $rc -eq 0 ] && ok "shell up --id 0 exited 0 ($(printf '%s' "$out" | jq -r '.adapter' 2>/dev/null))" \
              || { bad "shell up --id 0" "rc=$rc: $out"; echo "  (cannot continue)"; exit 1; }
sleep 1
held "after shell up: the compositor window did not take focus or the top of the stack"
HW="$(computer shell list | jq -r '.instances[0].record.host_win')"
[ "$("$LIBDIR/hostwin" "$D" viewable "$HW")" = 1 ] && ok "the compositor window IS headed: mapped and viewable on $D ($HW)" \
                                                  || bad "the compositor window is not viewable" "$HW"
"$LIBDIR/hostwin" "$D" state "$HW" | grep -q BELOW && bad "BELOW was not released" "$HW" || ok "the window is in the normal layer (a human can click it forward)"

echo; echo "── THE LADDER: every verb, one at a time ──"
step() { local label="$1"; shift; local o; o="$("$@" 2>&1)"; local rc=$?
         [ $rc -eq 0 ] || { bad "$label" "rc=$rc: $(printf '%s' "$o" | tail -1)"; return; }
         sleep 0.5; held "$label"; }
step "shell list"                       computer shell list
step "displays"                         computer displays
step "shell spawn (xev)"                computer shell spawn --id 0 -- xev -geometry 500x400
step "focus (binds, never raises)"      computer focus --id 0 --title .
step "screenshot (X path)"              computer screenshot --id 0 --out "$CU_STATE_ROOT/x.png"
step "click (X path)"                   computer click --id 0 --x 80 --y 80
step "key (X path)"                     computer key --id 0 --key a
step "type (X path)"                    computer type --id 0 --text hi
step "terminal send"                    computer terminal send --id 0 --text 'echo ok'
step "terminal read"                    computer terminal read --id 0
step "state put"                        computer state put --id 0 --key k --value v
step "state get"                        computer state get --id 0 --key k
CHROME_PROFILE="$CU_STATE_ROOT/i0/chrome"; CDP_PORT=$((53000 + $$ % 900))
step "shell spawn (chrome, CDP bound)" computer shell spawn --id 0 --cdp "$CDP_PORT" -- google-chrome-stable \
       --user-data-dir="$CHROME_PROFILE" --no-first-run --no-default-browser-check --ozone-platform=x11 \
       --remote-debugging-port="$CDP_PORT" --remote-allow-origins='*' --window-size=800,500 --disable-gpu \
       --use-gl=swiftshader --enable-unsafe-swiftshader \
       "--app=data:text/html,<body style='background:%23246'><h1>c3</h1><input autofocus></body>"
step "screenshot (CDP)"                 computer screenshot --id 0 --out "$CU_STATE_ROOT/cdp.png"
step "click (CDP)"                      computer click --id 0 --x 100 --y 60
step "type (CDP)"                       computer type --id 0 --text hello
step "key (CDP)"                        computer key --id 0 --key Backspace

echo; echo "── THE ONE PERMITTED RAISE ──"
if [ "$MODE" = replica ]; then
  v0="$(computer view --id 0 2>&1)"; vrc=$?
  [ $vrc -eq 1 ] && case "$v0" in *VIEW_UNCONFIRMED*) ok "view WITHOUT --confirm is REFUSED (VIEW_UNCONFIRMED)";; *) bad "view without confirm" "$v0";; esac \
                 || bad "view without --confirm was not refused" "rc=$vrc $v0"
  computer view --id 0 --confirm >/dev/null 2>&1; sleep 1
  a="$(H active)"; t="$(H top)"
  [ "$a" = "$HW" ] && [ "$t" = "$HW" ] && ok "view raised the window (active=$a top=$t) - the oracle sees a raise" \
                                      || invalid "view did not read as a raise (active=$a top=$t, expected $HW)"
  refocus; held "operator restored after view"
else
  echo "  (real display: view is not run - it would raise a window on your screen)"
fi

echo; echo "── THE FORBIDDEN ACTION ──"
# capture first: `... | grep -q` under pipefail reports SIGPIPE on the writer even when the token matched
act_out="$(computer activate 2>&1)"; rc=$?
[ $rc -eq 1 ] && ok "activate is REFUSED (rc=1)" || bad "activate" "rc=$rc, expected 1"
case "$act_out" in *ACTIVATE_FORBIDDEN*) ok "...with the token ACTIVATE_FORBIDDEN";; *) bad "activate token" "output was: $act_out";; esac

echo; echo "── TEARDOWN ──"
computer shell down --id 0 >/dev/null 2>&1; sleep 1
[ "$("$LIBDIR/hostwin" "$D" viewable "$HW" 2>/dev/null)" != 1 ] && ok "the compositor window is gone" || bad "the compositor window survived down" "$HW"
n="$(pgrep -fc "socket=computer-use0")"; [ "$n" -eq 0 ] && ok "no compositor process left" || bad "leftover compositor" "$n process(es)"
held "operator still focused and on top at the end"

echo; echo "══════════════════════════════════════════════════════════════════════════"
printf ' PASS %d · FAIL %d\n' "$PASS" "$FAIL"
echo "══════════════════════════════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ]
