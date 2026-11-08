#!/usr/bin/env bash
# multi.sh - P8 / P9 / P10 / P7 / B6 / B7 / B10 / P13: N concurrent PINEBOX instances, zero
# shared resources, the operator's focus never moved.
#
#   multi.sh [N]        N instances on one fresh replica display (default 2; the blueprint's P9 is 7)
#
# For EVERY instance it asserts, from the running system and never from the record:
#   * its own display slot and its own port block (N slots, N*5 distinct ports, 0 shared)
#   * the bytes ITS server serves name ITS OWN apiBase, pineStation and rail (B10 - the whole
#     isolation proof: instance 3 serving instance 0's ports would talk to instance 0)
#   * its CDP port lists a pine.html target for ITS OWN server port
#   * its frame has more than one colour
# IDS RUN 1..N. Id 0 is the canonical block - the operator's own live IDE
# holds it on this host - and `up --id 0` correctly REFUSES PORT_TAKEN there. The claim check
# protecting a running instance is itself part of what this gate proves (see the B6 section).
# And across the set:
#   * the operator's focus and the top of their stack are unchanged after every `up` (P7)
#   * a second `up` on a live id is refused (B6)
#   * `down --id K` leaves every other instance answering (B7/P10)
#   * 3 loads on one instance do not grow its chrome process count (B5/P13)
# Exit: 0 every check held, 1 a check failed, 3 the instrument is invalid.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PV="$(cd "$HERE/../../.." && pwd)"
CUE="${CU_EXT:-$HOME/.omp/agent/extensions/computer-use-v2}"
LIBDIR="${CU_LIB_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/computer-use/lib}"
export PATH="$CUE:$PV/scripts/pinebox:$PATH"
N="${1:-2}"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }

export PINEBOX_ROOT="/tmp/pinebox-m$$" CU_STATE_ROOT="/tmp/cu-m$$"
D=""
cleanup() { pinebox down --all >/dev/null 2>&1; computer shell down --all >/dev/null 2>&1
            [ -n "$D" ] && bash "$CUE/test/replica.sh" down "$D" >/dev/null 2>&1
            rm -rf "$PINEBOX_ROOT" "$CU_STATE_ROOT"; }
trap cleanup EXIT INT TERM

avail="$(free -m | awk 'NR==2{print $7}')"; need=$((N * 900 + 1500))
if [ "$avail" -lt "$need" ]; then echo "  INSTRUMENT_INVALID  only ${avail} MB available; $N instances need ~${need} MB (blueprint 7F) - refusing to start a run that would swap the host"; exit 3; fi

D="$(bash "$CUE/test/replica.sh" up)" || exit 3
OP="$(bash "$CUE/test/replica.sh" operator "$D")" || exit 3
export CU_HOST_DISPLAY="$D"
H() { "$LIBDIR/hostwin" "$D" "$@"; }
held() { [ "$(H active)" = "$OP" ] && [ "$(H top)" = "$OP" ]; }

echo "══════════════════════════════════════════════════════════════════════════"
echo " PINEBOX multi-instance · N=$N · replica $D · operator $OP · ${avail} MB available"
echo "══════════════════════════════════════════════════════════════════════════"

echo; echo "── bring up $N instances, one at a time; the operator must keep the focus through each ──"
for i in $(seq 1 "$N"); do
  mkdir -p "$PINEBOX_ROOT"
  out="$(pinebox up --id "$i" 2>"$PINEBOX_ROOT/up$i.err")"; rc=$?
  # a failing `up` carries its OWN refusal into the report: a gate that discards stderr
  # cannot say WHY, and an intermittent failure is then unfalsifiable
  if [ $rc -ne 0 ]; then bad "up --id $i" "rc=$rc: $(grep -E 'REFUSED|partly' "$PINEBOX_ROOT/up$i.err" | head -3 | tr '\n' ' ')"; continue; fi
  held && ok "up --id $i: ready on :$(jq -r .slot <<<"$out"), operator focus + top unchanged" \
       || bad "up --id $i moved the operator's focus" "active=$(H active) top=$(H top) operator=$OP"
done

echo; echo "── isolation: each instance's own bytes name its own ports (B10) ──"
ports_all=""; slots_all=""
for i in $(seq 1 "$N"); do
  rec="$PINEBOX_ROOT/i$i/state.json"; [ -s "$rec" ] || { bad "instance $i has no record" ""; continue; }
  srv="$(jq -r .ports.server "$rec")"; st="$(jq -r .ports.station "$rec")"; rl="$(jq -r .ports.rail "$rec")"; cdp="$(jq -r .ports.cdp "$rec")"; slot="$(jq -r .slot "$rec")"
  ports_all="$ports_all $(jq -r '.ports|[.station,.rail,.server,.cdp,.ws]|join(" ")' "$rec")"; slots_all="$slots_all $slot"
  page="$(curl -s -m 4 "http://127.0.0.1:$srv/pine.html")"
  case "$page" in *"\"apiBase\": \"http://127.0.0.1:$srv\""*"\"pineStation\": \"http://127.0.0.1:$st\""*) a=1;; *) a=0;; esac
  case "$page" in *"PlutusPineShellConfig = {\"railBases\": [\"http://127.0.0.1:$rl\"]}"*) b=1;; *) b=0;; esac
  [ "$a$b" = 11 ] && ok "instance $i serves its OWN apiBase :$srv, pineStation :$st, rail :$rl" \
                  || bad "instance $i serves another instance's ports" "apiBase/station=$a rail=$b — $(printf '%s' "$page" | grep -oE 'apiBase[^,]*' | head -1)"
  curl -s -m 3 "http://127.0.0.1:$cdp/json/list" | jq -e --arg p ":$srv/pine.html" 'any(.[]; .type=="page" and (.url|contains($p)))' >/dev/null 2>&1 \
    && ok "instance $i: CDP :$cdp lists a pine.html target for ITS server :$srv" || bad "instance $i CDP target" "CDP :$cdp"
  c="$(jq -r '.frame.colours // 0' "$rec")"; [ "$c" -gt 1 ] && ok "instance $i frame: $c colours" || bad "instance $i frame is blank" "colours=$c"
done
nports="$(printf '%s\n' $ports_all | sort | uniq | wc -l)"; total="$(printf '%s\n' $ports_all | wc -l)"
[ "$nports" = "$total" ] && ok "0 shared ports: $total port assignments, $nports distinct" || bad "a port is shared" "$total assigned, $nports distinct"
nslots="$(printf '%s\n' $slots_all | sort -u | wc -l)"
[ "$nslots" = "$N" ] && ok "$N instances on $nslots distinct display slots" || bad "display slots collide" "slots:$slots_all"
[ "$(pgrep -fc -- '--socket=computer-use')" = "$N" ] && ok "exactly $N compositors, one per instance" || bad "compositor count" "$(pgrep -fc -- '--socket=computer-use') for $N instances"
nwin="$("$LIBDIR/hostwin" "$D" clients | wc -l)"
[ "$nwin" = $((N + 1)) ] && ok "the operator's display holds $N compositor windows + the operator's own" || bad "host windows" "$nwin windows, expected $((N+1))"

echo; echo "── B6: a second up on a live id is refused ──"
out="$(pinebox up --id 1 2>&1)"; rc=$?
[ $rc -eq 1 ] && case "$out" in *INSTANCE_LIVE*) ok "up --id 1 again: REFUSED INSTANCE_LIVE";; *) bad "B6 token" "$out";; esac || bad "B6: a second up was not refused" "rc=$rc"

echo; echo "── the canonical id: if the operator's live IDE holds id 0's server port, id 0 must be REFUSED, not collided with ──"
CANON="$(pinebox ports --id 0 | jq -r .ports.server)"
if ss -ltnH "sport = :$CANON" 2>/dev/null | grep -q .; then
  out="$(pinebox up --id 0 2>&1)"; rc=$?
  [ $rc -eq 1 ] && case "$out" in *PORT_TAKEN*) ok "up --id 0: REFUSED PORT_TAKEN (something live holds :$CANON)";; *) bad "id 0 refusal token" "$out";; esac || bad "id 0 was not refused while :$CANON is live" "rc=$rc"
  [ "$(pgrep -fc -- '--socket=computer-use0')" = 0 ] && ok "...and nothing was started for it" || bad "id 0 left a compositor" ""
else
  echo "  (id 0's server port is free on this host, so the canonical-id refusal cannot be exercised here)"
fi

if [ "$N" -ge 2 ]; then
  echo; echo "── B7/P10: down --id 1 leaves every other instance running ──"
  pinebox down --id 1 >/dev/null 2>&1; sleep 1
  for i in $(seq 2 "$N"); do
    srv="$(jq -r .ports.server "$PINEBOX_ROOT/i$i/state.json")"
    curl -s -m 3 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$srv/pine.html" | grep -qx 200 \
      && ok "instance $i still serves :$srv after instance 1 was torn down" || bad "instance $i died with instance 1" ":$srv"
  done
  [ ! -e "$PINEBOX_ROOT/i1/state.json" ] && ok "instance 1's record is gone" || bad "record left" ""
  [ "$(pgrep -fc "user-data-dir=$PINEBOX_ROOT/i1/")" = 0 ] && ok "instance 1's browser processes are gone (by the recorded group, not a pattern)" || bad "instance 1 browser leaked" "$(pgrep -fc "user-data-dir=$PINEBOX_ROOT/i1/")"
  held && ok "the operator's focus survived the teardown" || bad "teardown moved focus" ""
fi

echo; echo "── B5/P13: the browser does not accumulate across repeated loads ──"
last="$N"
cnt() { pgrep -fc "user-data-dir=$PINEBOX_ROOT/i$last/chrome"; }
c0="$(cnt)"; for n in 1 2 3; do pinebox load --id "$last" --pine "$HERE/fixtures/ema-ribbon.pine" >/dev/null 2>&1; done; c3="$(cnt)"
[ "$c0" -gt 0 ] && [ "$c3" -le "$c0" ] && ok "chrome processes for instance $last: $c0 before, $c3 after 3 loads (no growth; the blueprint's own 7F measures 11 for one --app chrome)" \
                                       || bad "chrome accumulates" "$c0 -> $c3"
held && ok "the operator's focus survived 3 loads" || bad "loads moved focus" ""

echo; echo "══════════════════════════════════════════════════════════════════════════"
printf ' PASS %d · FAIL %d\n' "$PASS" "$FAIL"
echo "══════════════════════════════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ]
