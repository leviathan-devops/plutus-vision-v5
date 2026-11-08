#!/usr/bin/env bash
# pv-ide — ONE COMMAND, RELOCATABLE: everything runs from the tree this script sits in
# (live PLUTUS_VISION or any checkpoint copy). Owns ports :9741 station · :9754 rail ·
# :9851 renderer+bars · :9222 CDP. Restarts all of them from THIS tree every launch.
#   pv-ide.sh [file.pine] [PAIR] [TF]      default: <tree>/plutus-vision-v0.pine EUR/USD 1H
#   pv-ide.sh --shot [out.png]             capture the IDE window (vision in the loop)
set -uo pipefail
W="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
SLOT=3; CDP=9222
FIX="$W/fixtures/bars/2026-07-06.json"

if [ "${1:-}" = "--shot" ]; then
  OUT="${2:-/tmp/pine-ide-shot.png}"
  WIN=$(DISPLAY=:$SLOT xdotool search --name "Plutus Vision" | head -1)
  [ -n "$WIN" ] || { echo "NO_WINDOW: launch pine-ide first"; exit 1; }
  DISPLAY=:$SLOT import -window "$WIN" -silent "$OUT" && echo "shot $OUT"; exit
fi
[ -S /tmp/.X11-unix/X$SLOT ] || { echo "DISPLAY_DOWN: agent display :$SLOT absent (computer-use-virtual-display skill)"; exit 1; }
[ -f "$FIX" ] || { echo "FIXTURE_ABSENT: $FIX"; exit 1; }
[ -d "$W/pine-ide/pine-station/node_modules/pinets" ] || { echo "ENGINE_ABSENT: run npm install in $W/pine-ide/pine-station"; exit 1; }
echo "tree: $W"

for p in $(pgrep -f "user-data-dir=/tmp/pv-ide-chrome"); do kill -9 "$p" 2>/dev/null; done
fuser -k 9741/tcp 9754/tcp 9851/tcp 2>/dev/null || true
for i in $(seq 1 20); do pgrep -f "user-data-dir=/tmp/pv-ide-chrome" >/dev/null || break; sleep 0.25; done
pgrep -f "user-data-dir=/tmp/pv-ide-chrome" >/dev/null && { echo "CHROME_STUCK"; exit 1; }
for port in 9741 9754 9851; do
  for i in $(seq 1 20); do fuser $port/tcp >/dev/null 2>&1 || break; sleep 0.25; done
  fuser $port/tcp >/dev/null 2>&1 && { echo "PORT_HELD: :$port still owned by pid $(fuser $port/tcp 2>/dev/null) (a supervisor restarting it?)"; exit 1; }
done

up() { for i in $(seq 1 40); do curl -s -m 1 -o /dev/null "$1" && return 0; sleep 0.25; done; return 1; }

# station :9741 (PineTS) on this tree's fixture
env -C "$W/pine-ide/pine-station" PINE_STATION_PORT=9741 PINE_STATION_HOST=127.0.0.1 \
  PLUTUS_BARS_FIXTURE="$FIX" PLUTUS_LIVE_ROOT="$W" setsid -f node server.mjs > /tmp/pv-station.log 2>&1 < /dev/null
up http://127.0.0.1:9741/ || { echo "STATION_DOWN: /tmp/pv-station.log"; exit 1; }
# VIL rail :9754 -> station; ledger + evidence inside the tree
mkdir -p "$W/vil" "$W/evidence"
env PLUTUS_VIL_PORT=9754 PLUTUS_STATION_URL=http://127.0.0.1:9741 PLUTUS_VIL_DIR="$W/vil" PLUTUS_VIL_EVIDENCE="$W/evidence" \
  setsid -f node "$W/pine-ide/pine-ide/vil-rail.mjs" > /tmp/pv-vil-rail.log 2>&1 < /dev/null
up http://127.0.0.1:9754/ || { echo "RAIL_DOWN: /tmp/pv-vil-rail.log"; exit 1; }
# renderer root + /api/v1/chart/bars on the same fixture
env PV_FIXTURE="$FIX" setsid -f python3 "$W/scripts/pv-server.py" 9851 "$W/pine-ide/ide/renderer" > /tmp/pv-ide-http.log 2>&1 < /dev/null
up http://127.0.0.1:9851/pine.html || { echo "SERVER_DOWN: /tmp/pv-ide-http.log"; exit 1; }
echo "  station :9741 · rail :9754 · server :9851 up"

rm -rf /tmp/pv-ide-chrome
DISPLAY=:$SLOT setsid -f google-chrome-stable \
  --user-data-dir=/tmp/pv-ide-chrome --no-first-run --no-default-browser-check \
  --remote-debugging-port=$CDP --remote-allow-origins='*' \
  --window-size=1626,931 --window-position=0,0 \
  --disable-gpu --disable-gpu-compositing --disable-accelerated-2d-canvas \
  --use-gl=swiftshader --enable-unsafe-swiftshader \
  --app="http://127.0.0.1:9851/pine.html" > /tmp/pv-ide-chrome.log 2>&1 < /dev/null

timeout 120 bun "$W/scripts/pv-load.mjs" "${1:-$W/plutus-vision-v0.pine}" "${2:-EUR/USD}" "${3:-1H}"
