#!/usr/bin/env bash
# plutus-vision-chart — serve the chart page into the agent display.
# Reads the merged indicator from THIS workspace's station (:9741) and renders
# it with the fork's own chart page + Vela, inside the weston window.
set -uo pipefail
W=/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
SLOT=$(ls /tmp/.X11-unix/ | grep -oE '[0-9]+$' | sort -n | tail -2 | head -1)
[ -z "${SLOT:-}" ] && SLOT=3
echo "agent display :$SLOT"

# 1 · serve the fork's chart page + station on our own HTTP port
PORT_HTTP=9841
( cd "$W/pine-ide/chart" && setsid python3 -m http.server $PORT_HTTP --bind 127.0.0.1 \
   > /tmp/pv-chart-http.log 2>&1 & )
sleep 2

# 2 · point the page's station at :9741 (it defaults to 9441 — the dashboard's)
if [ -f "$W/pine-ide/chart/index.html" ]; then
  grep -q "9741" "$W/pine-ide/chart/index.html" || {
    sed -i 's|127\.0\.0\.1:9441|127.0.0.1:9741|g' "$W/pine-ide/chart/index.html"
    sed -i 's|:9441|:9741|g' "$W/pine-ide/chart/app.js" 2>/dev/null || true
  }
fi

# 3 · open a browser on the agent display
URL="http://127.0.0.1:$PORT_HTTP/index.html"
DISPLAY=:$SLOT setsid google-chrome-stable \
  --user-data-dir=/tmp/pv-chrome \
  --no-first-run --no-default-browser-check \
  --window-size=1600,900 --window-position=0,0 \
  --app="$URL" > /tmp/pv-chrome.log 2>&1 &
sleep 6

echo "--- windows on :$SLOT ---"
DISPLAY=:$SLOT xdotool search --onlyvisible --name "." getwindowname %@ 2>/dev/null | head -6
DISPLAY=:$SLOT import -window root /tmp/pv-screen.png 2>/dev/null && echo "captured /tmp/pv-screen.png"
ls -la /tmp/pv-screen.png 2>/dev/null
