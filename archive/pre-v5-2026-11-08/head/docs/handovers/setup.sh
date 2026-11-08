#!/usr/bin/env bash
# setup.sh — PLUTUS VISION PINE IDE pack setup (run from 02_PINE_IDE/, after unzip).
#
# Idempotent. Installs the station's engine (pinets + @luxalgo/vela-pinets, AGPL-3.0) into
# pine-ide/pine-station/node_modules. The pack ALREADY SHIPS that directory; this only
# matters if it was pruned or the extraction dropped it.
set -uo pipefail
TREE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
STATION="$TREE/pine-ide/pine-station"

echo "tree: $TREE"

command -v node >/dev/null 2>&1 || { echo "NODE_ABSENT: install Node.js >= 20"; exit 1; }
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || { echo "NODE_TOO_OLD: $(node -v) — need >= 20"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "PYTHON_ABSENT: install python3 >= 3.10"; exit 1; }

[ -f "$STATION/server.mjs" ] || { echo "STATION_ABSENT: $STATION/server.mjs"; exit 1; }
[ -f "$TREE/fixtures/bars/2026-07-06.json" ] || { echo "FIXTURE_ABSENT: $TREE/fixtures/bars/2026-07-06.json"; exit 1; }

if [ -f "$STATION/node_modules/pinets/package.json" ] && \
   [ -f "$STATION/node_modules/@luxalgo/vela-pinets/package.json" ]; then
  echo "  engine present: $(node -p "require('$STATION/node_modules/pinets/package.json').version") pinets · $(node -p "require('$STATION/node_modules/@luxalgo/vela-pinets/package.json').version") @luxalgo/vela-pinets"
else
  echo "  engine missing — installing (AGPL-3.0, station-private)…"
  command -v npm >/dev/null 2>&1 || { echo "NPM_ABSENT: install npm"; exit 1; }
  ( cd "$STATION" && npm install --omit=dev ) || { echo "NPM_INSTALL_FAILED"; exit 1; }
fi

[ -f "$STATION/node_modules/pinets/package.json" ] || { echo "ENGINE_INCOMPLETE: pinets"; exit 1; }
[ -f "$STATION/node_modules/@luxalgo/vela-pinets/package.json" ] || { echo "ENGINE_INCOMPLETE: @luxalgo/vela-pinets"; exit 1; }

chmod +x "$TREE/launch-pine-ide" "$TREE/scripts/pv-ide.sh" "$TREE/scripts/verify_served_pine.sh" 2>/dev/null || true

echo "ENGINE_OK"
echo
echo "next (headless):  see PINE_IDE_OPERATORS_MANUAL.md §3"
echo "  cd $STATION && PINE_STATION_PORT=9741 PINE_STATION_HOST=127.0.0.1 \\"
echo "    PLUTUS_BARS_FIXTURE=$TREE/fixtures/bars/2026-07-06.json PLUTUS_LIVE_ROOT=$TREE node server.mjs &"
echo "next (headed):    bash launch-pine-ide plutus-vision-v1.pine EUR/USD 1H"
