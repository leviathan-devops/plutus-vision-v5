#!/usr/bin/env bash
# pv-servers — bring up the THREE pine-ide backend servers ONLY.
# No browser, no display, no weston :3. This is the SERVER BLOCK of
# scripts/pv-ide.sh, extracted so a desktop shell can start the backend without
# the weston-Chrome launch. Same programs, same ports, same env:
#   :9741 pine-station (PineTS compile+run)   -> pine-ide/pine-station/server.mjs
#   :9754 VIL rail (evidence ledger)          -> pine-ide/pine-ide/vil-rail.mjs
#   :9851 renderer + /api/v1/chart/bars       -> scripts/pv-server.py
# Keep in sync with scripts/pv-ide.sh (source of truth; do not edit that file).
#
# Idempotent: probes each port and only starts what is DOWN.
set -uo pipefail
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
FIX="${PV_FIXTURE:-$ROOT/fixtures/bars/2026-07-06.json}"

up() { for _ in $(seq 1 40); do curl -s -m 1 -o /dev/null "$1" && return 0; sleep 0.25; done; return 1; }

[ -f "$FIX" ] || { echo "FIXTURE_ABSENT: $FIX"; exit 1; }
[ -d "$ROOT/pine-ide/pine-station/node_modules/pinets" ] || { echo "ENGINE_ABSENT: run npm install in $ROOT/pine-ide/pine-station"; exit 1; }

# --- :9741 pine-station (probe the WORK route /catalog; GET / can hang on a working station) ---
if up http://127.0.0.1:9741/catalog; then
  echo "  station :9741 (already up)"
else
  env -C "$ROOT/pine-ide/pine-station" PINE_STATION_PORT=9741 PINE_STATION_HOST=127.0.0.1 \
    PLUTUS_BARS_FIXTURE="$FIX" PLUTUS_LIVE_ROOT="$ROOT" setsid -f node server.mjs > /tmp/pv-station.log 2>&1 < /dev/null
  up http://127.0.0.1:9741/catalog || { echo "STATION_DOWN: /tmp/pv-station.log"; exit 1; }
  echo "  station :9741 up"
fi

# --- :9754 VIL rail -> station; ledger + evidence inside the tree ---
mkdir -p "$ROOT/vil" "$ROOT/evidence"
if up http://127.0.0.1:9754/; then
  echo "  rail    :9754 (already up)"
else
  env PLUTUS_VIL_PORT=9754 PLUTUS_STATION_URL=http://127.0.0.1:9741 PLUTUS_VIL_DIR="$ROOT/vil" \
    PLUTUS_VIL_EVIDENCE="$ROOT/evidence" setsid -f node "$ROOT/pine-ide/pine-ide/vil-rail.mjs" \
    > /tmp/pv-vil-rail.log 2>&1 < /dev/null
  up http://127.0.0.1:9754/ || { echo "RAIL_DOWN: /tmp/pv-vil-rail.log"; exit 1; }
  echo "  rail    :9754 up"
fi

# --- :9851 renderer root + /api/v1/chart/bars on the same fixture ---
if up http://127.0.0.1:9851/pine.html; then
  echo "  server  :9851 (already up)"
else
  env PV_FIXTURE="$FIX" setsid -f python3 "$ROOT/scripts/pv-server.py" 9851 "$ROOT/pine-ide/ide/renderer" \
    > /tmp/pv-ide-http.log 2>&1 < /dev/null
  up http://127.0.0.1:9851/pine.html || { echo "SERVER_DOWN: /tmp/pv-ide-http.log"; exit 1; }
  echo "  server  :9851 up"
fi
echo "servers ready: station :9741 · rail :9754 · server :9851"
