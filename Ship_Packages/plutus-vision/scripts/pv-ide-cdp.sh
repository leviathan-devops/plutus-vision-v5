#!/usr/bin/env bash
# pv-ide-cdp — serve the PLUTUS Pine IDE and open it on the agent display with CDP.
set -uo pipefail
W=/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
SLOT=3
PORT=9851
CDP=9222

DISPLAY=:$SLOT pkill -f "pv-ide-chrome" 2>/dev/null || true
fuser -k ${PORT}/tcp 2>/dev/null || true
sleep 1

( cd "$W/pine-ide/ide/renderer" && setsid python3 -m http.server $PORT --bind 127.0.0.1 \
    > /tmp/pv-ide-http.log 2>&1 & )
sleep 2
echo "http: $(curl -s -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORT/index.html)"

DISPLAY=:$SLOT setsid google-chrome-stable \
  --user-data-dir=/tmp/pv-ide-chrome \
  --no-first-run --no-default-browser-check \
  --remote-debugging-port=$CDP --remote-allow-origins='*' \
  --window-size=1600,950 --window-position=0,0 \
  --app="http://127.0.0.1:$PORT/index.html" > /tmp/pv-ide-chrome.log 2>&1 &
sleep 9

echo "--- CDP ---"
curl -s -m 5 http://127.0.0.1:$CDP/json/version | head -c 200; echo
echo "--- targets ---"
curl -s -m 5 http://127.0.0.1:$CDP/json/list 2>/dev/null | python3 -c "
import json,sys
try:
    for t in json.load(sys.stdin):
        if t.get('type')=='page': print('  ', t.get('title'), t.get('url')[:70])
except Exception as e: print('  ', e)
"
