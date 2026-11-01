#!/usr/bin/env bash
# room.sh - W4: the Backtest room, one per instance.
#
#   ST-2  room_up_per_instance      two instances each get THEIR OWN room: /health names its own
#                                   port, the served backtest.js probes only that port, the room
#                                   runs in its own group with none of the instance's locks, and
#                                   `down --id K` takes ONLY K's room with it
#   ST-3  room_down_refuses_loudly  with the room's source absent, `up` REFUSES ROOM_UNAVAILABLE
#                                   (rc != 0) and leaves no process, port, lock or record behind;
#                                   with it present no ROOM_ token appears
#   +     INSTRUMENT: the health predicate must be able to say "down" (a port nobody serves)
#
# Runs on a fresh replica display. Exit: 0 all hold, 1 a check failed, 3 the instrument is invalid.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PV="$(cd "$HERE/../../.." && pwd)"
CUE="${CU_EXT:-$HOME/.omp/agent/extensions/computer-use-v2}"
export PATH="$CUE:$PV/scripts/pinebox:$PATH"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }

export PINEBOX_ROOT="/tmp/pinebox-r$$" CU_STATE_ROOT="/tmp/cu-r$$"
D=""
cleanup() { pinebox down --all >/dev/null 2>&1; computer shell down --all >/dev/null 2>&1
            [ -n "$D" ] && bash "$CUE/test/replica.sh" down "$D" >/dev/null 2>&1
            rm -rf "$PINEBOX_ROOT" "$CU_STATE_ROOT"; }
trap cleanup EXIT INT TERM

avail="$(free -m | awk 'NR==2{print $7}')"; need=$((2 * 900 + 1500))
[ "$avail" -ge "$need" ] || { echo "  INSTRUMENT_INVALID  only ${avail} MB available; two instances need ~${need} MB"; exit 3; }
D="$(bash "$CUE/test/replica.sh" up)" || exit 3
bash "$CUE/test/replica.sh" operator "$D" >/dev/null || exit 3
export CU_HOST_DISPLAY="$D"

health_names() { curl -s -m 3 "http://127.0.0.1:$1/health" 2>/dev/null | jq -e --argjson p "$1" '.ok==true and .service=="plutus-backtest-room" and .port==$p' >/dev/null 2>&1; }
holders_of()   { local real; real="$(readlink -f "$1")"; find /proc/[0-9]*/fd -maxdepth 1 -lname "$real" 2>/dev/null | cut -d/ -f3 | sort -u | wc -l; }
rport()        { pinebox ports --id "$1" | jq -r .ports.room; }

echo "── INSTRUMENT: the predicate must be able to say DOWN ──"
health_names 9 && bad "health predicate blind" "port 9 answered as a room" || ok "health predicate reads DOWN for a port nobody serves"

echo; echo "── ST-3 (present): the real room source -> NO ROOM_ token ──"
out="$(pinebox up --id 1 --week 2026-07-06 2>&1)"; rc=$?
[ "$rc" -eq 0 ] && ok "up --id 1 rc=0" || { bad "up --id 1" "rc=$rc $(printf '%s' "$out" | tail -2 | tr '\n' ' ')"; exit 1; }
case "$out" in *ROOM_*) bad "ST-3 present: a ROOM_ token appeared" "$(printf '%s' "$out" | grep -o 'ROOM_[A-Z_]*' | sort -u | tr '\n' ' ')";; *) ok "ST-3 present: no ROOM_ token";; esac
out2="$(pinebox up --id 2 --week 2026-07-06 2>&1)"; [ $? -eq 0 ] && ok "up --id 2 rc=0" || { bad "up --id 2" "$(printf '%s' "$out2" | tail -2 | tr '\n' ' ')"; exit 1; }

echo; echo "── ST-2: one room per instance ──"
R1="$(rport 1)"; R2="$(rport 2)"; S1="$(pinebox ports --id 1 | jq -r .ports.server)"; S2="$(pinebox ports --id 2 | jq -r .ports.server)"
[ "$R1" != "$R2" ] && ok "distinct room ports ($R1, $R2)" || bad "room ports collide" "$R1 == $R2"
health_names "$R1" && ok "ST-2 :$R1 answers as a room bound to :$R1" || bad "ST-2 room 1 health" "$(curl -s -m 3 http://127.0.0.1:$R1/health | head -c 200)"
health_names "$R2" && ok "ST-2 :$R2 answers as a room bound to :$R2" || bad "ST-2 room 2 health" "$(curl -s -m 3 http://127.0.0.1:$R2/health | head -c 200)"
for k in 1 2; do
  r="$([ $k = 1 ] && echo $R1 || echo $R2)"; s="$([ $k = 1 ] && echo $S1 || echo $S2)"
  line="$(curl -s -m 5 "http://127.0.0.1:$s/tabs/backtest.js" | grep -m1 'var PORTS')"
  case "$line" in *"var PORTS = [$r];"*) ok "ST-2 instance $k serves a tab that probes ONLY [$r]";; *) bad "ST-2 instance $k served PORTS" "$line";; esac
  case "$line" in *9443*|*9446*|*9447*) bad "ST-2 instance $k still names a canonical room port" "$line";; esac
done
[ "$(cd "$PV" && git diff --stat -- pine-ide | wc -l)" -eq 0 ] && ok "the frozen pine-ide tree is byte-unchanged" || bad "pine-ide was modified" "$(cd "$PV" && git diff --stat -- pine-ide | tail -2)"
n="$(holders_of "$PINEBOX_ROOT/.up-1.lock")"; [ "$n" -eq 0 ] && ok "ST-2 no process holds instance 1's up-lock (the room closed fds 6,7,8)" || bad "ST-2 lock leak" "$n holders"
db1="$(jq -r .room.db "$PINEBOX_ROOT/i1/state.json")"; db2="$(jq -r .room.db "$PINEBOX_ROOT/i2/state.json")"
[ -s "$db1" ] && [ -s "$db2" ] && [ "$db1" != "$db2" ] && ok "each room has its own database ($db1 / $db2)" || bad "room databases" "$db1 $db2"
pinebox down --id 1 >/dev/null 2>&1
health_names "$R1" && bad "ST-2 down --id 1 left its room serving" ":$R1 still answers" || ok "ST-2 down --id 1 took room :$R1 with it"
health_names "$R2" && ok "ST-2 ...and instance 2's room :$R2 still serves" || bad "ST-2 sibling room died with instance 1" ":$R2 stopped answering"
ss -ltnH "sport = :$R1" | grep -q . && bad "ST-2 :$R1 still listening after down" "" || ok "ST-2 :$R1 is free after down"
pinebox down --id 2 >/dev/null 2>&1

echo; echo "── ST-3 (absent): the room source removed -> ROOM_UNAVAILABLE, rc!=0, nothing left behind ──"
out="$(PINEBOX_DASHBOARD_SRC=/nonexistent pinebox up --id 3 --week 2026-07-06 2>&1)"; rc=$?
[ "$rc" -ne 0 ] && ok "ST-3 absent: rc=$rc (non-zero)" || bad "ST-3 absent: up succeeded without a room source" ""
case "$out" in *ROOM_UNAVAILABLE*) ok "ST-3 absent: the token ROOM_UNAVAILABLE was printed";; *) bad "ST-3 absent: token" "$(printf '%s' "$out" | tail -3 | tr '\n' ' ')";; esac
R3="$(rport 3)"; S3="$(pinebox ports --id 3 | jq -r .ports.server)"
ss -ltnH "sport = :$R3" "or sport = :$S3" | grep -q . && bad "ST-3 absent: a port was left listening" "$(ss -ltnH "sport = :$R3")" || ok "ST-3 absent: no room/server port left listening"
[ ! -e "$PINEBOX_ROOT/i3/state.json" ] && ok "ST-3 absent: no instance record left" || bad "ST-3 absent: record left" ""
[ "$(pgrep -fc -- "--socket=computer-use3" || true)" -eq 0 ] && ok "ST-3 absent: no compositor left for instance 3" || bad "ST-3 absent: compositor leak" ""

echo; printf ' ROOM: PASS %d · FAIL %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
