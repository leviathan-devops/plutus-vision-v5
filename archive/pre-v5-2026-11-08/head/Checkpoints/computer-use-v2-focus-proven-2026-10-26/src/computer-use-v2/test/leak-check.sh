#!/usr/bin/env bash
# leak-check.sh - after a gate chain, NOTHING this tool or its tests started may still be alive.
#
#   RIG_LEFTOVER   a replica display, its window manager, or its X socket survives
#   LEAK           a compositor, an instance browser, a station/rail/server, or a raw control
#                  compositor survives
#
# A leak is the defect class this whole project exists to kill (a compositor orphaned per test
# run is how the operator ended up with four windows). Every gate chain ends with this check;
# it must be able to fail, and test/mutate.sh-style proof is in the must-fail probe the chain
# documents: leave a replica up -> this exits 1 naming it.
#
# Exit: 0 nothing left, 1 a leak (every survivor named).

set -uo pipefail
leaks=""
add() { leaks="${leaks}${leaks:+$'\n'}  $1"; }

# replica displays: X sockets in the replica range, their servers, their window managers
for s in /tmp/.X11-unix/X*; do
  [ -e "$s" ] || continue
  n="${s##*/X}"
  if [ "$n" -ge 200 ] 2>/dev/null && [ "$n" -le 230 ] 2>/dev/null; then add "RIG_LEFTOVER: replica display :$n (socket $s)"; fi
done
while read -r pid args; do [ -n "$pid" ] && add "RIG_LEFTOVER: pid $pid ${args:0:90}"; done < <(pgrep -af 'Xvfb.* :2([0-2][0-9]|30)( |$)|mutter --x11 -d :2([0-2][0-9]|30)$' 2>/dev/null)

# everything this tool starts is named by its own markers
while read -r pid args; do [ -n "$pid" ] && add "LEAK: pid $pid ${args:0:100}"; done < <(
  pgrep -af 'socket=computer-use[0-9]|socket=cu-|user-data-dir=/tmp/(pinebox|cu-|pb)|PINE_STATION_PORT=9[7-9][0-9][0-9]|vil-rail.mjs|pv-server.py 9[89][0-9][0-9] ' 2>/dev/null \
  | grep -v 'leak-check.sh' | grep -vE 'pv-server.py 9851 ')   # 9851 is the operator's own canonical server

if [ -n "$leaks" ]; then
  echo "LEAK: the run left processes or displays behind:"
  echo "$leaks"
  exit 1
fi
exit 0
