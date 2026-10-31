#!/usr/bin/env bash
# services.sh - STAGE 2: the three application services, one port block (blueprint section 6).
# Sourced by pinebox. Reproduces scripts/pv-ide.sh's choreography, parametrised by the
# instance's derived ports and with EVERY path derived from the instance id, so the
# teardown can kill by the RECORDED process group instead of by a pattern.
#
#   stage_services     station :<station> -> rail :<rail> -> server :<server>
#
# EXIT (each can fail): station POST /run returns success:true on THE INSTANCE'S port; the
# rail answers; the server serves pine.html whose served apiBase names THE INSTANCE'S OWN
# server port (anti-pattern B10 - the whole isolation proof).

# wait up to N seconds for a command to succeed
pb_wait() { local secs="$1"; shift; local i; for i in $(seq 1 $((secs * 4))); do "$@" && return 0; sleep 0.25; done; return 1; }

# THE STATION CHECK PROBES THE WORK ROUTE, NOT THE LIVENESS ROUTE (measured, pv-ide.sh:
# GET / can hang for the full client timeout on a station whose POST /run compiles fine).
pb_station_compiles() {
  local r
  r="$(curl -s -m 3 -X POST "http://127.0.0.1:$1/run" -H 'Content-Type: application/json' \
       -d '{"script":"//@version=6\nindicator(\"probe\")\nplot(close)","pair":"DXY","timeframe":"1H","limit":300}' 2>/dev/null)"
  case "$r" in *'"success":true'*) return 0 ;; esac
  return 1
}

pb_http_ok() { curl -s -m 2 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null | grep -qx 200; }
# a SERVICE is up when it ANSWERS: any HTTP status proves the listener is serving. (The rail's
# `/` is not a 200 route; demanding one reported a live, listening rail as DOWN.) Only the
# PAGE needs a 200, because that is the thing being served.
pb_http_answers() { curl -s -m 2 -o /dev/null "$1" 2>/dev/null; }

# pb_preflight WEEK: everything about the INPUTS that can be known before a single process
# starts. Nothing is spawned for an instance whose inputs are wrong.
pb_preflight() {
  local week="$1" fix renderer
  fix="$PV_ROOT/fixtures/bars/$week.json"
  renderer="${PINEBOX_RENDERER_ROOT:-$PV_ROOT/pine-ide/ide/renderer}"
  [ -f "$fix" ] || refuse FIXTURE_ABSENT "no bars fixture for week '$week': $fix"
  [ -d "$PV_ROOT/pine-ide/pine-station/node_modules/pinets" ] || refuse ENGINE_ABSENT "run npm install in $PV_ROOT/pine-ide/pine-station"
  python3 "$PB_HOME/inject.py" --check "$renderer/pine.html" >/dev/null 2>"$PB_ROOT/.inject.err" \
    || refuse CONFIG_BLOCK_ABSENT "$(sed -E 's/^REFUSED +CONFIG_BLOCK_ABSENT +— +//' "$PB_ROOT/.inject.err" | head -1)"
}

stage_services() {
  local id="$1" d="$2" week="$3"
  local st rail srv ws fix renderer
  st="$(pb_port "$id" station)"; rail="$(pb_port "$id" rail)"; srv="$(pb_port "$id" server)"; ws="$(pb_port "$id" ws)"
  fix="$PV_ROOT/fixtures/bars/$week.json"
  renderer="${PINEBOX_RENDERER_ROOT:-$PV_ROOT/pine-ide/ide/renderer}"
  # ── station: supervised with a bounded memory cap, exactly as pv-ide.sh does ──
  # (the 2026-10-11 incident: an unsupervised station leaked to ~33 GB RSS+swap)
  env -C "$PV_ROOT/pine-ide/pine-station" PINE_STATION_PORT="$st" PINE_STATION_HOST=127.0.0.1 \
      PLUTUS_BARS_FIXTURE="$fix" PLUTUS_LIVE_ROOT="$PV_ROOT" PINE_STATION_RSS_CAP_MB=2560 \
      setsid bash -c 'while :; do node --max-old-space-size=1536 server.mjs; c=$?; echo "[pinebox] station exited ($c) - restarting in 1s"; sleep 1; done' \
      >> "$d/station.log" 2>&1 < /dev/null &
  pb_rec "$id" ".pids.station = $!"
  pb_wait 60 pb_station_compiles "$st" \
    || refuse STATION_WILL_NOT_COMPILE "POST /run on :$st never answered success:true - $d/station.log: $(tail -2 "$d/station.log" | tr '\n' ' ')"

  # ── rail: its ledger and evidence live INSIDE the instance, never in the live tree ──
  mkdir -p "$d/vil" "$d/evidence"
  env PLUTUS_VIL_PORT="$rail" PLUTUS_STATION_URL="http://127.0.0.1:$st" \
      PLUTUS_VIL_DIR="$d/vil" PLUTUS_VIL_EVIDENCE="$d/evidence" \
      setsid node "$PV_ROOT/pine-ide/pine-ide/vil-rail.mjs" >> "$d/rail.log" 2>&1 < /dev/null &
  pb_rec "$id" ".pids.rail = $!"
  if pb_wait 15 pb_http_answers "http://127.0.0.1:$rail/"; then pb_rec "$id" '.rail = "up"'
  else
    # the face is the one service the IDE honestly runs without: the page's own
    # "workspaces: offline" state is shown, and the record says so
    pb_rec "$id" '.rail = "down"'
    echo "  rail      DOWN on :$rail (the IDE opens without its face) - $d/rail.log" >&2
  fi

  # ── server: the static host + the API, with THIS instance's port block to inject ──
  local ports; ports="$(pb_ports_json "$id")"
  env PYTHONDONTWRITEBYTECODE=1 PV_FIXTURE="$fix" PINEBOX_PORTS="$ports" \
      setsid python3 "$PV_ROOT/scripts/pv-server.py" "$srv" "$renderer" >> "$d/server.log" 2>&1 < /dev/null &
  pb_rec "$id" ".pids.server = $!"
  pb_wait 20 pb_http_ok "http://127.0.0.1:$srv/pine.html" \
    || refuse "SERVICE_DOWN:server" "pine.html never answered 200 on :$srv - $d/server.log: $(tail -2 "$d/server.log" | tr '\n' ' ')"

  # B10: the SERVED bytes must name THIS instance's own ports, or the instance would talk
  # to another instance's server
  local served; served="$(curl -s -m 3 "http://127.0.0.1:$srv/pine.html")"
  printf '%s' "$served" | grep -q "\"apiBase\": \"http://127.0.0.1:$srv\"" \
    || refuse CONFIG_NOT_INJECTED "the page served on :$srv does not name apiBase :$srv - the instance would use another instance's server"
  printf '%s' "$served" | grep -q "\"pineStation\": \"http://127.0.0.1:$st\"" \
    || refuse CONFIG_NOT_INJECTED "the page served on :$srv does not name pineStation :$st"
  printf '%s' "$served" | grep -qE "PlutusPineShellConfig *= *\{[^}]*\"railBases\": *\[\"http://127\.0\.0\.1:$rail\"\]" \
    || refuse CONFIG_NOT_INJECTED "the page served on :$srv does not name this instance's rail :$rail in PlutusPineShellConfig - the engine would fall back to the default rail"
  local wb; wb="$(curl -s -m 5 "http://127.0.0.1:$srv/charts/workbench.bundle.js")"
  printf '%s' "$wb" | grep -qF "var MAIN_API = \"http://127.0.0.1:$srv\";" \
    || refuse CONFIG_NOT_INJECTED "the workbench served on :$srv does not name this instance's MAIN_API - its fixture feed would use another instance"
  printf '  services  station :%s · rail :%s (%s) · server :%s  (apiBase/pineStation verified in the served bytes)\n' \
    "$st" "$rail" "$(jq -r .rail "$d/state.json")" "$srv" >&2
}
