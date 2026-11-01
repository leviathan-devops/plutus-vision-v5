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
pb_wait() { local secs="$1" deadline=$((SECONDS + $1)); shift; while [ "$SECONDS" -lt "$deadline" ]; do "$@" && return 0; sleep 0.25; done; return 1; }

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
# pb_fail ID TOKEN DETAIL: a refusal AFTER something was started. It kills every recorded service
# group first, so a refused instance leaves no supervisor loop, rail or server behind (the audit's
# critical: only the station path cleaned up; the server and CONFIG_NOT_INJECTED refusals leaked).
pb_fail() { local id="$1"; shift; pb_kill_recorded "$id" >/dev/null 2>&1; refuse "$@"; }

pb_http_answers() { curl -s -m 2 -o /dev/null "$1" 2>/dev/null; }

# pb_preflight WEEK: everything about the INPUTS that can be known before a single process
# starts. Nothing is spawned for an instance whose inputs are wrong.
pb_preflight() {
  local week="$1" instance_id="${2:-0}" fix renderer
  # the id becomes part of a file path below: only a canonical decimal may reach it
  [[ "$instance_id" =~ ^(0|[1-9])$ ]] || refuse BAD_ID "instance id must be a canonical decimal 0..9, got '$instance_id'"
  fix="$PV_ROOT/fixtures/bars/$week.json"
  renderer="${PINEBOX_RENDERER_ROOT:-$PV_ROOT/pine-ide/ide/renderer}"
  # the renderer root is read, never written, but it is still an input: absolute, free of control
  # characters, a real directory, and carrying the page we are about to rewrite
  case "$renderer" in /*) ;; *) refuse BAD_ARGS "PINEBOX_RENDERER_ROOT must be an absolute path, got '$renderer'" ;; esac
  [[ "$renderer" != *[[:cntrl:]]* ]] || refuse BAD_ARGS "PINEBOX_RENDERER_ROOT contains a control character"
  [ -d "$renderer" ] && [ -f "$renderer/pine.html" ] || refuse RENDERER_ABSENT "no pine.html under renderer root '$renderer'"
  # the week names a FILE: only a real date may reach the path (--week ../../x resolved outside
  # the fixtures tree and would have been loaded as the bars fixture)
  [[ "$week" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || refuse BAD_ARGS "week must be a date YYYY-MM-DD naming a fixture, got '$week'"
  [ -f "$fix" ] || refuse FIXTURE_ABSENT "no bars fixture for week '$week': $fix"
  [ -d "$PV_ROOT/pine-ide/pine-station/node_modules/pinets" ] || refuse ENGINE_ABSENT "run npm install in $PV_ROOT/pine-ide/pine-station"
  local inject_err="$PB_ROOT/i${instance_id}.inject.err"
  mkdir -p "$(dirname "$inject_err")"
  python3 "$PB_HOME/inject.py" --check "$renderer/pine.html" >/dev/null 2>"$inject_err" \
    || refuse CONFIG_BLOCK_ABSENT "$(sed -E 's/^REFUSED +CONFIG_BLOCK_ABSENT +— +//' "$inject_err" | head -1)"
}

stage_services() {
  local id="$1" d="$2" week="$3"
  local rtok
  local st rail srv fix renderer
  # (the ws port, server+80, is RESERVED in the block and claimed by pb_claim, but nothing in this
  # stage serves on it - it is not read here so no one mistakes it for a wired service)
  st="$(pb_port "$id" station)" && rail="$(pb_port "$id" rail)" && srv="$(pb_port "$id" server)" \
    || refuse BAD_ID "could not derive the port block for instance '$id'"
  fix="$PV_ROOT/fixtures/bars/$week.json"
  renderer="${PINEBOX_RENDERER_ROOT:-$PV_ROOT/pine-ide/ide/renderer}"
  # ── station: supervised with a bounded memory cap, exactly as pv-ide.sh does ──
  # (the 2026-10-11 incident: an unsupervised station leaked to ~33 GB RSS+swap)
  env -C "$PV_ROOT/pine-ide/pine-station" PINE_STATION_PORT="$st" PINE_STATION_HOST=127.0.0.1 \
      PLUTUS_BARS_FIXTURE="$fix" PLUTUS_LIVE_ROOT="$PV_ROOT" PINE_STATION_RSS_CAP_MB=2560 \
      setsid bash -c 'n=0; while [ "$n" -lt 20 ]; do node --max-old-space-size=1536 server.mjs; c=$?; n=$((n+1)); echo "[pinebox] station exited ($c) - restart $n/20 in 1s"; sleep 1; done; echo "[pinebox] station gave up after 20 restarts"' \
      >> "$d/station.log" 2>&1 < /dev/null 6>&- 7>&- 8>&- &
  pb_svc_record "$id" station "$!"
  pb_wait 60 pb_station_compiles "$st" \
    || { pb_kill_recorded "$id" >/dev/null   # do not leave the supervisor loop running behind a refusal
         refuse STATION_WILL_NOT_COMPILE "POST /run on :$st never answered success:true - $d/station.log: $(tail -2 "$d/station.log" | tr '\n' ' ')"; }

  # ── rail: its ledger and evidence live INSIDE the instance, never in the live tree ──
  mkdir -p "$d/vil" "$d/evidence"
  env PLUTUS_VIL_PORT="$rail" PLUTUS_STATION_URL="http://127.0.0.1:$st" \
      PLUTUS_VIL_DIR="$d/vil" PLUTUS_VIL_EVIDENCE="$d/evidence" \
      setsid node "$PV_ROOT/pine-ide/pine-ide/vil-rail.mjs" >> "$d/rail.log" 2>&1 < /dev/null 6>&- 7>&- 8>&- &
  pb_svc_record "$id" rail "$!"
  if pb_wait 15 pb_http_answers "http://127.0.0.1:$rail/"; then pb_rec "$id" '.rail = "up"'
  else
    # the face is the one service the IDE honestly runs without: the page's own
    # "workspaces: offline" state is shown, and the record says so
    # a rail that missed its deadline may still bind seconds later and own this instance's port and directories while the
    # record says "down": stop the recorded rail (by its start-time token - the group leader this function just started)
    rtok="$(pb_rec_get "$id" ".toks.rail")"
    if [ -n "$rtok" ] && tok_group_ours "$rtok"; then kill_tok "$rtok" || refuse TEARDOWN_INCOMPLETE "the rail that never answered on :$rail could not be stopped"; fi
    pb_rec "$id" '.rail = "down"'
    echo "  rail      DOWN on :$rail (stopped; the IDE opens without its face) - $d/rail.log" >&2
  fi

  # ── server: the static host + the API, with THIS instance's port block to inject ──
  local ports
  ports="$(pb_ports_json "$id")" && jq -e 'type=="object" and has("server") and has("room")' <<<"$ports" >/dev/null 2>&1 \
    || pb_fail "$id" BAD_PORTS "the port block for instance '$id' is empty or malformed: '${ports:0:120}'"
  # A PER-INSTANCE credential, generated fresh on every `up`: 128 bits from the kernel. The page carries
  # it (it is embedded in the served config) and the server's terminal bridge requires the SAME value
  # (PV_TERM_TOKEN), so instance A's page cannot authenticate to instance B's server. It is never written
  # to the record, the log or the repo; it lives in this process's environment and the served bytes.
  local ptoken
  ptoken="$(od -An -N16 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n')"
  [[ "$ptoken" =~ ^[0-9a-f]{32}$ ]] || pb_fail "$id" AUTH_TOKEN_UNAVAILABLE "could not read 16 random bytes from /dev/urandom for the per-instance token"
  ports="$(jq -c --arg t "$ptoken" '. + {authToken:$t}' <<<"$ports")" || pb_fail "$id" BAD_PORTS "could not attach the per-instance token to the port block"
  env PYTHONDONTWRITEBYTECODE=1 PV_FIXTURE="$fix" PINEBOX_PORTS="$ports" PV_TERM_TOKEN="$ptoken" \
      setsid python3 "$PV_ROOT/scripts/pv-server.py" "$srv" "$renderer" >> "$d/server.log" 2>&1 < /dev/null 6>&- 7>&- 8>&- &
  pb_svc_record "$id" server "$!"
  pb_wait 20 pb_http_ok "http://127.0.0.1:$srv/pine.html" \
    || pb_fail "$id" "SERVICE_DOWN:server" "pine.html never answered 200 on :$srv - $d/server.log: $(tail -2 "$d/server.log" | tr '\n' ' ')"

  # B10: the SERVED bytes must name THIS instance's own ports, or the instance would talk
  # to another instance's server
  # pb_fetch URL SECONDS: the body on stdout; a FAILED fetch (curl rc != 0, or an empty body) is retried 3 times and then refused as SERVICE_DOWN. An empty string used to flow
  # on to the `grep -q` below and be reported as CONFIG_NOT_INJECTED - "the served bytes do not name this instance" - when nothing had been read at all (the silent-drop class:
  # could-not-read must never become not-present). Seen once in crash round 4 on a loaded host; the cause of THAT failure is unproven, the conflation is not.
  pb_fetch() { local body rc n; for n in 1 2 3; do body="$(curl -s -m "$2" "$1")"; rc=$?; [ "$rc" -eq 0 ] && [ -n "$body" ] && { printf '%s' "$body"; return 0; }; sleep 1; done; return 1; }
  local served; served="$(pb_fetch "http://127.0.0.1:$srv/pine.html" 6)" \
    || pb_fail "$id" "SERVICE_DOWN:server" "pine.html on :$srv could not be read (3 tries): the server answered the readiness probe and then not a body - $d/server.log: $(tail -2 "$d/server.log" | tr '\n' ' ')"
  printf '%s' "$served" | grep -q "\"apiBase\": \"http://127.0.0.1:$srv\"" \
    || pb_fail "$id" CONFIG_NOT_INJECTED "the page served on :$srv does not name apiBase :$srv - the instance would use another instance's server"
  printf '%s' "$served" | grep -q "\"pineStation\": \"http://127.0.0.1:$st\"" \
    || pb_fail "$id" CONFIG_NOT_INJECTED "the page served on :$srv does not name pineStation :$st"
  printf '%s' "$served" | grep -qE "PlutusPineShellConfig *= *\{[^}]*\"railBases\": *\[\"http://127\.0\.0\.1:$rail\"\]" \
    || pb_fail "$id" CONFIG_NOT_INJECTED "the page served on :$srv does not name this instance's rail :$rail in PlutusPineShellConfig - the engine would fall back to the default rail"
  local wb; wb="$(pb_fetch "http://127.0.0.1:$srv/charts/workbench.bundle.js" 20)" \
    || pb_fail "$id" "SERVICE_DOWN:server" "workbench.bundle.js on :$srv could not be read (3 tries of 20 s): a fetch failure is not 'the config was not injected' - $d/server.log: $(tail -2 "$d/server.log" | tr '\n' ' ')"
  printf '%s' "$wb" | grep -qF "var MAIN_API = \"http://127.0.0.1:$srv\";" \
    || pb_fail "$id" CONFIG_NOT_INJECTED "the workbench served on :$srv does not name this instance's MAIN_API - its fixture feed would use another instance"
  printf '  services  station :%s · rail :%s (%s) · server :%s  (apiBase/pineStation verified in the served bytes)\n' \
    "$st" "$rail" "$(jq -r .rail "$d/state.json")" "$srv" >&2
}
