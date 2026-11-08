#!/usr/bin/env bash
# probe.sh - L0. Capability detection, by RUNNING things (blueprint section 4).
#
#   probe.sh            print the capability record as one JSON object
#
# INVARIANT: every field is the result of running a probe, never of parsing a config file.
# This file names no compositor: each surface adapter probes itself and returns its own
# evidence (A10), and this file orders them. A probe that cannot run yields an adapter
# marked unavailable with the failing reason; it never guesses.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
. "$HERE/runtime.sh"

# the order IS the preference (adapters/order, one name per line): the first AVAILABLE adapter is selected
mapfile -t SURFACE_ORDER < "$HERE/adapters/order"

kernel="$(uname -s)"; arch="$(uname -m)"
native=false; [ "$kernel" = Linux ] && native=true

adapters_json=""; selected=""
for a in "${SURFACE_ORDER[@]}"; do
  out="$(bash "$HERE/adapters/$a.sh" probe 2>&1 | tail -1)"
  case "$out" in "{"*) ;; *) out="{\"adapter\":\"$a\",\"available\":false,\"reason\":\"probe produced no JSON: $(jesc "$out")\",\"evidence\":{}}";; esac
  adapters_json="${adapters_json:+$adapters_json,}$out"
  if [ -z "$selected" ] && [[ "$out" == *'"available":true'* ]]; then selected="$a"; fi
done

socks=""
for s in /tmp/.X11-unix/X*; do [ -e "$s" ] && socks="${socks:+$socks,}\"$(jesc "$s")\""; done

bin() { command -v "$1" 2>/dev/null || true; }
runtime="$(runtime_select 2>/dev/null || true)"

printf '{"os":{"kernel":"%s","arch":"%s","native_linux":%s},' "$kernel" "$arch" "$native"
printf '"surface":{"adapters":[%s],"x_sockets":[%s]},' "$adapters_json" "$socks"
printf '"state":{"sqlite3":"%s","bun":"%s","bwrap":"%s","unshare":"%s"},' \
  "$(jesc "$(bin sqlite3)")" "$(jesc "$(bin bun)")" "$(jesc "$(bin bwrap)")" "$(jesc "$(bin unshare)")"
printf '"runtime":{"tmux":"%s","node":"%s","bun":"%s","qemu":"%s","xdotool":"%s","import":"%s"},' \
  "$(jesc "$(bin tmux)")" "$(jesc "$(bin node)")" "$(jesc "$(bin bun)")" "$(jesc "$(bin qemu-system-x86_64)")" \
  "$(jesc "$(bin xdotool)")" "$(jesc "$(bin import)")"
if [ -n "$selected" ]; then sel="\"$selected\""; else sel=null; fi
if [ -n "$runtime" ]; then rt="\"$runtime\""; else rt=null; fi
printf '"selected":{"runtime":%s,"surface":%s,"state":"scoped-store"}}\n' "$rt" "$sel"
