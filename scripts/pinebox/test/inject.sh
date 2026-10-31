#!/usr/bin/env bash
# inject.sh - P0 / P1 / B3 / B10: the port block and the serve-time config rewrite, with no
# compositor and no browser - just the real pv-server.py serving the real page.
#
#   P0   `pinebox ports --id 3` prints 5 distinct ports and a claim verdict
#   P1   a server started with instance 3's port block SERVES a page naming instance 3's own
#        apiBase / pineStation / rail, and `git diff -- pine-ide/` is empty
#   B10  those are the SERVED BYTES (curl), never the record
#   B3   a doctored page (no config block) makes the server answer 500 CONFIG_BLOCK_ABSENT and
#        `pinebox up` refuse it BEFORE starting anything
#
# Exit: 0 every check held, 1 a check failed.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PB="$(cd "$HERE/.." && pwd)"; PV="$(cd "$PB/../.." && pwd)"
CUE="${CU_EXT:-$HOME/.omp/agent/extensions/computer-use-v2}"
export PATH="$CUE:$PB:$PATH" PYTHONDONTWRITEBYTECODE=1
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }
export PINEBOX_ROOT="/tmp/pinebox-i$$" CU_STATE_ROOT="/tmp/cu-i$$"
cleanup() { [ -n "${SP:-}" ] && kill "$SP" 2>/dev/null; rm -rf "$PINEBOX_ROOT" "$CU_STATE_ROOT" /tmp/doctored-$$; }
trap cleanup EXIT INT TERM

echo "── P0: the port block ──"
j="$(pinebox ports --id 3)"
n="$(jq -r '.ports|[.station,.rail,.server,.cdp,.ws]|map(tostring)|unique|length' <<<"$j")"
[ "$n" = 5 ] && ok "pinebox ports --id 3 prints 5 distinct ports: $(jq -c .ports <<<"$j")" || bad "P0 distinct" "$j"
[ "$(jq -r .ports.server <<<"$j")" = "$(jq -r .ports.server <<<"$(pinebox ports --id 0)" | awk '{print $1+300}')" ] && ok "derived from the id: id 3's server = id 0's server + 300" || bad "P0 derivation" ""
python3 - <<'PY'
import subprocess,json
seen={}
for i in range(10):
    out=subprocess.check_output(['pinebox','ports','--id',str(i)],text=True)
    for k,v in json.loads(out)['ports'].items(): seen.setdefault(v,[]).append((i,k))
collisions=[(p,u) for p,u in seen.items() if len(u)>1]
assert not collisions, collisions
print(f"  PASS  all {len(seen)} service ports across ids 0..9 are distinct")
PY
pinebox ports --id 10 >/dev/null 2>&1; rc=$?; [ $rc -eq 1 ] && ok "id 10 is REFUSED (the derived blocks would overlap above 9)" || bad "id bound" "rc=$rc"

echo; echo "── P1/B10: the SERVED bytes name the instance's own ports ──"
P="$(jq -c '.ports' <<<"$j")"
free=$(( $(jq -r .ports.server <<<"$j") + 400 ))
PINEBOX_PORTS="$P" PV_FIXTURE="$PV/fixtures/bars/2026-07-06.json" python3 "$PV/scripts/pv-server.py" "$free" "$PV/pine-ide/ide/renderer" >/tmp/inject-srv-$$.log 2>&1 &
SP=$!
for _ in $(seq 1 40); do curl -s -m 1 -o /dev/null "http://127.0.0.1:$free/pine.html" && break; sleep 0.25; done
page="$(curl -s -m 3 "http://127.0.0.1:$free/pine.html")"
srv="$(jq -r .server <<<"$P")"; st="$(jq -r .station <<<"$P")"; rl="$(jq -r .rail <<<"$P")"
case "$page" in *"\"apiBase\": \"http://127.0.0.1:$srv\""*) ok "served apiBase names instance 3's server :$srv";; *) bad "B10 apiBase" "$(printf '%s' "$page" | grep -oE 'apiBase[^,]*' | head -1)";; esac
case "$page" in *"\"pineStation\": \"http://127.0.0.1:$st\""*) ok "served pineStation names instance 3's station :$st";; *) bad "B10 pineStation" "";; esac
case "$page" in *"PlutusPineShellConfig = {\"railBases\": [\"http://127.0.0.1:$rl\"]}"*) ok "served PlutusPineShellConfig names instance 3's rail :$rl (the second config global)";; *) bad "B10 rail" "";; esac
wb="$(curl -s -m 5 "http://127.0.0.1:$free/charts/workbench.bundle.js")"
case "$wb" in *"var MAIN_API = \"http://127.0.0.1:$srv\";"*) ok "served workbench MAIN_API names instance 3's server :$srv";; *) bad "B10 workbench MAIN_API" "missing instance base";; esac
base="$(jq -r .server <<<"$(pinebox ports --id 0 | jq -c .ports)")"
case "$wb" in *"var MAIN_API = \"http://127.0.0.1:$base\";"*) bad "B10 workbench default" "canonical MAIN_API leaked";; *) ok "the workbench's canonical MAIN_API is not served";; esac
case "$page" in *"http://127.0.0.1:$base"*) bad "B10: the DEFAULT port leaked into the served page" "the page still names :$base";; *) ok "no default (id 0) port appears anywhere in the served page";; esac
n="$(git -C "$PV" diff HEAD --stat -- pine-ide/ | wc -l)"; [ "$n" = 0 ] && ok "git diff -- pine-ide/ is EMPTY: the page was NOT touched" || bad "P1 pine-ide edited" "$n lines"
kill "$SP" 2>/dev/null; SP=""

echo; echo "── B3: a doctored page is refused, loudly, before anything starts ──"
mkdir -p /tmp/doctored-$$ && cp -a "$PV/pine-ide/ide/renderer/." /tmp/doctored-$$/ && sed -i 's/window\.dashboardConfig/window.somethingElse/' /tmp/doctored-$$/pine.html
PINEBOX_PORTS="$P" PV_FIXTURE="$PV/fixtures/bars/2026-07-06.json" python3 "$PV/scripts/pv-server.py" "$free" /tmp/doctored-$$ >/tmp/inject-srv2-$$.log 2>&1 &
SP=$!; for _ in $(seq 1 40); do curl -s -m 1 -o /dev/null "http://127.0.0.1:$free/" && break; sleep 0.25; done
code="$(curl -s -m 3 -o /tmp/inject-body-$$ -w '%{http_code}' "http://127.0.0.1:$free/pine.html")"; body="$(cat /tmp/inject-body-$$)"
[ "$code" = 500 ] && case "$body" in CONFIG_BLOCK_ABSENT*) ok "the server answers 500 CONFIG_BLOCK_ABSENT (never the unrewritten page)";; *) bad "B3 body" "$body";; esac || bad "B3 status" "http $code: $body"
kill "$SP" 2>/dev/null; SP=""
out="$(PINEBOX_RENDERER_ROOT=/tmp/doctored-$$ pinebox up --id 9 2>&1)"; rc=$?
[ $rc -eq 1 ] && case "$out" in *CONFIG_BLOCK_ABSENT*) ok "pinebox up --id 9 on the doctored page: REFUSED CONFIG_BLOCK_ABSENT";; *) bad "B3 up token" "$out";; esac || bad "B3 up" "rc=$rc"
[ "$(pgrep -fc -- '--socket=computer-use9')" = 0 ] && ok "...and no compositor was started for it" || bad "B3 left a compositor" ""
rm -f /tmp/inject-srv-$$.log /tmp/inject-srv2-$$.log /tmp/inject-body-$$

echo; printf ' INJECT: PASS %d · FAIL %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
