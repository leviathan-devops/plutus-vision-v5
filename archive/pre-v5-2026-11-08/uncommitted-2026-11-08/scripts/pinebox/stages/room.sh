#!/usr/bin/env bash
# room.sh - the Backtest room, ONE PER INSTANCE (blueprint v3 phase P3).
#
# The Backtest tab is a client of a separate process, the room (backtest-room/control.mjs). The
# frozen page probes a fixed port list, so without this stage every instance's tab reads
# BACKTEST_ROOM_DOWN, or - worse - finds some other instance's room. Here each instance gets its
# own room on its own claimed port, its own database, its own HOME, and the served backtest.js
# is rewritten (inject.py) to probe only that port.
#
# LOUD FAIL OR CLEAR PASS. Every missing input is a NAMED refusal with its remedy:
#   ROOM_UNAVAILABLE   a substrate is absent (source tree, schema owner, node:sqlite, schema file)
#   ROOM_SEED_FAILED   the instance database could not be seeded
#   ROOM_DOWN          the room started but never answered /health as THIS instance's room
# There is no substitute path: no other room is borrowed, no database is copied, no token is
# invented. The room's source tree is read, never edited; it is configured only through its own
# documented environment (PLUTUS_BACKTEST_PORT / PLUTUS_DASHBOARD_DB / PLUTUS_BARS_FIXTURE /
# PLUTUS_API / PLUTUS_TV_FEED) and an instance-scoped HOME, so it can never write into the
# operator's ~/.plutus-dashboard.

# the dashboard source tree that owns the room. ONE explicit location, overridable, REFUSED when absent.
PB_DASH_SRC="$PB_HOME/fork/dashboard"   # the backtest room, from Pinebox's own fork (R1); no outside source tree

pb_room_health() {   # PORT : this port answers as a plutus-backtest-room that is bound to THIS port
  curl -s -m 2 "http://127.0.0.1:$1/health" 2>/dev/null \
    | jq -e --argjson p "$1" '.ok == true and .service == "plutus-backtest-room" and .port == $p' >/dev/null 2>&1
}

# SELF-CONTAINED (2026-11-04, operator): room/base-schema.sql IS the room's schema - Pinebox owns it. It was compared on every up with
# the upstream dashboard's electron/server/db.js, which made a file of another program a hard dependency of `up`; that check is gone.

pb_room_preflight() {   # refuses by name BEFORE anything is started
  local ctl="$PB_DASH_SRC/backtest-room/control.mjs"
  [ -f "$ctl" ]  || refuse ROOM_UNAVAILABLE "the Backtest room source is missing: $ctl - reinstall Pinebox (deploy.sh push)"
  [ -f "$PB_HOME/room/base-schema.sql" ] || refuse ROOM_UNAVAILABLE "$PB_HOME/room/base-schema.sql is missing - restore it from git (scripts/pinebox/room/)"
  command -v node >/dev/null 2>&1 || refuse ROOM_UNAVAILABLE "node is not installed - the room needs Node >= 22.5 (node:sqlite)"
  node --no-warnings -e "require('node:sqlite')" >/dev/null 2>&1 \
    || refuse ROOM_UNAVAILABLE "this node ($(node --version 2>/dev/null)) has no node:sqlite - install Node >= 22.5"
}

stage_room() {
  local id="$1" d="$2" week="$3" room srv fix home
  [[ "$week" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || pb_fail "$id" BAD_ARGS "week must be a date YYYY-MM-DD naming a fixture, got '$week'"
  need curl ROOM_UNAVAILABLE; need jq ROOM_UNAVAILABLE   # pb_room_health needs both: without them a healthy room read as ROOM_DOWN
  room="$(pb_port "$id" room)" && srv="$(pb_port "$id" server)" || pb_fail "$id" BAD_ID "could not derive the room port for instance '$id'"
  [[ "$room" =~ ^[0-9]+$ && "$srv" =~ ^[0-9]+$ ]] || pb_fail "$id" BAD_ID "the derived ports are not numbers (room '$room', server '$srv')"
  fix="$PB_FORK/fixtures/bars/$week.json"
  [ -f "$fix" ] || pb_fail "$id" FIXTURE_ABSENT "no bars fixture for week '$week': $fix"

  # a fresh, instance-scoped database and HOME on every up; the room refuses to init without the base table
  # `rm -rf` on a caller-supplied $d: with $d empty this expanded to /room-home and /room.db. The reset only runs on the
  # instance's OWN directory - exactly $PB_ROOT/i<id> - that exists and is not a symlink.
  [ -n "$d" ] && [ -n "${PB_ROOT:-}" ] && [ "$d" = "$PB_ROOT/i$id" ] && [ -d "$d" ] && [ ! -L "$d" ] \
    || pb_fail "$id" SCOPE_VIOLATION "instance dir '$d' is not an existing $PB_ROOT/i$id - refusing to reset a room database under it"
  home="$d/room-home"; rm -rf -- "$home" "$d"/room.db "$d"/room.db-wal "$d"/room.db-shm; mkdir -p "$home"
  node --no-warnings -e "const {DatabaseSync}=require('node:sqlite'); const fs=require('node:fs'); const db=new DatabaseSync(process.argv[1]); db.exec(fs.readFileSync(process.argv[2],'utf8')); db.close();" \
      "$d/room.db" "$PB_HOME/room/base-schema.sql" 2>"$d/room-seed.err" \
    || pb_fail "$id" ROOM_SEED_FAILED "could not seed $d/room.db from room/base-schema.sql: $(tail -1 "$d/room-seed.err" | cut -c1-200)"

  # TV feed pinned to a closed loopback port: the instance has no TradingView feed, and the default
  # would reach the OPERATOR'S. Any use fails loudly (ECONNREFUSED) instead of crossing instances.
  # fds 6,7,8 are the instance's claim/up/down locks: a service must not inherit them.
  env HOME="$home" PLUTUS_BACKTEST_PORT="$room" PLUTUS_DASHBOARD_DB="$d/room.db" PLUTUS_BARS_FIXTURE="$fix" \
      PLUTUS_API="http://127.0.0.1:$srv" PLUTUS_TV_FEED="http://127.0.0.1:1" \
      setsid node --no-warnings "$PB_DASH_SRC/backtest-room/control.mjs" --port "$room" \
      >> "$d/room.log" 2>&1 < /dev/null 6>&- 7>&- 8>&- &
  pb_svc_record "$id" room "$!"
  pb_wait 30 pb_room_health "$room" \
    || { pb_kill_recorded "$id" >/dev/null
         refuse ROOM_DOWN "the room never answered /health as the room on :$room - $d/room.log: $(tail -3 "$d/room.log" | tr '\n' ' ' | cut -c1-260)"; }
  pb_rec "$id" ".room = $(jq -nc --argjson p "$room" --arg db "$d/room.db" '{port:$p,db:$db}')"
  printf '  room      :%s  (own db, own HOME; /health names this port)\n' "$room" >&2
}
