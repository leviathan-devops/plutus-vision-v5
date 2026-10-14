#!/usr/bin/env bash
# finalize.sh — capture the live display + verify every service is up.
set -uo pipefail
sleep 2
WIN=$(DISPLAY=:3 xdotool search --name "Plutus Vision" | head -1)
DISPLAY=:3 import -window "$WIN" -silent /tmp/pv-DONE.png 2>&1 | head -2
echo "captured: $(stat -c%s /tmp/pv-DONE.png 2>/dev/null) bytes"
echo
echo "=== services ==="
if ss -lptnH 'sport = :9851' >/dev/null 2>&1; then echo "  pv-server :9851 UP"; else echo "  pv-server :9851 DOWN"; fi
printf "  chrome CDP :9222 "; curl -s -m 3 -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9222/json/version
printf "  pine-station :9741 "; curl -s -m 3 -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9741/
printf "  vil rail :9444 "; curl -s -m 3 -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9444/vil/look
printf "  vision seat :4171 "; curl -s -m 3 -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4171/
echo
echo "=== bars api ==="
curl -s -m 5 "http://127.0.0.1:9851/api/v1/chart/bars?pair=EUR%2FUSD&timeframe=1H" | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ok=%s count=%s' % (d['success'], d['data']['count']))"
