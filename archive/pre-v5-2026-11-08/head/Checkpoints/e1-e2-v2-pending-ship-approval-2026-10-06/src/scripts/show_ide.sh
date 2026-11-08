#!/usr/bin/env bash
# pv-ide — serve the forked PLUTUS Pine IDE renderer and open it on the agent display.
set -uo pipefail
W=/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
SLOT=3
PORT=9851

# kill any prior chart window
DISPLAY=:$SLOT pkill -f "pv-chrome" 2>/dev/null || true
fuser -k ${PORT}/tcp 2>/dev/null || true
sleep 1

# serve the renderer tree (it is the IDE host: index.html + tabs + assets)
( cd "$W/pine-ide/ide/renderer" && setsid python3 -m http.server $PORT --bind 127.0.0.1 \
    > /tmp/pv-ide-http.log 2>&1 & )
sleep 2
echo "http: $(curl -s -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORT/index.html)"

# open the IDE, pinned to the PINE SHELL tab
DISPLAY=:$SLOT setsid google-chrome-stable \
  --user-data-dir=/tmp/pv-ide-chrome \
  --no-first-run --no-default-browser-check --disable-gcm-registration \
  --window-size=1600,950 --window-position=0,0 \
  --app="http://127.0.0.1:$PORT/index.html#pine" > /tmp/pv-ide-chrome.log 2>&1 &
sleep 8

echo "--- windows on :$SLOT ---"
DISPLAY=:$SLOT xdotool search --onlyvisible --name "." getwindowname %@ 2>/dev/null | head -6
echo "--- station ---"
curl -s -m 5 http://127.0.0.1:9741/ | head -c 120; echo
