#!/usr/bin/env bash
# pv-shot — capture the agent-display weston window from the host display.
set -uo pipefail
XAUTH=/run/user/1000/.mutter-Xwaylandauth.2I7AW3
OUT="${1:-/tmp/pv-shot.png}"
WIN=$(env DISPLAY=:1 XAUTHORITY=$XAUTH xdotool search --onlyvisible --name "Weston" 2>/dev/null | head -1)
if [ -z "${WIN:-}" ]; then echo "no weston window"; exit 1; fi
env DISPLAY=:1 XAUTHORITY=$XAUTH import -window "$WIN" "$OUT" && echo "shot $OUT $(stat -c%s "$OUT") bytes"
