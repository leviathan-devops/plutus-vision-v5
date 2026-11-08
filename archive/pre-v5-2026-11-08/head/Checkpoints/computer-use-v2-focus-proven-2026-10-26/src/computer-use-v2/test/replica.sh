#!/usr/bin/env bash
# replica.sh - a stand-in OPERATOR display, so focus behaviour can be measured without ever
# touching the operator's real screen.
#
#   replica.sh up          create it; print its display name (e.g. :90)
#   replica.sh down D      tear down display D
#   replica.sh operator D  map a focusable "operator" window on D, focus it; print its id
#
# It is a real X framebuffer (the blueprint's own xvfb adapter: capturable, clickable) with
# mutter as its window manager - the same WM that manages the operator's desktop - so the
# focus-on-map and stacking policy under test is the real one. Each `up` takes a FRESH
# display number, so no state can leak between runs.
#
# THE RIG MUST BE EMPTY or every measurement taken on it is void: `up` refuses RIG_DIRTY
# unless the new display has zero client windows and exactly one X server.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E="$(cd "$HERE/.." && pwd)"
LIBDIR="${CU_LIB_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/computer-use/lib}"
RDIR=/tmp/cu-replica
mkdir -p "$RDIR"

die() { printf 'REFUSED  %s  —  %s\n' "$1" "$2" >&2; exit 1; }

xserver_bin() { command -v Xvfb || die NO_REPLICA "Xvfb is not installed"; }

# THE REPLICA RANGE. A replica display is only ever one of :200-:230. Another agent's rig was
# seen on :99 (Xvfb + fluxbox) and an earlier scratch pattern, `pkill -f 'Xvfb.real :9[0-9]'`,
# matched it - so this file may CREATE and DESTROY only displays inside its own range, and it
# refuses anything else by name (REPLICA_FOREIGN), whatever the caller asks.
REPLICA_MIN=200; REPLICA_MAX=230
in_range() { [ "${1#:}" -ge "$REPLICA_MIN" ] 2>/dev/null && [ "${1#:}" -le "$REPLICA_MAX" ] 2>/dev/null; }

free_display() {
  local n
  for n in $(seq "$REPLICA_MIN" "$REPLICA_MAX"); do
    [ -e "/tmp/.X11-unix/X$n" ] && continue
    [ -e "/tmp/.X$n-lock" ] && continue
    printf ':%s' "$n"; return 0
  done
  die NO_REPLICA "no free display between :$REPLICA_MIN and :$REPLICA_MAX"
}

cmd_up() {
  [ -x "$LIBDIR/hostwin" ] || "$E/helpers/build.sh" >/dev/null || exit 1
  local d n x; d="$(free_display)"; n="${d#:}"
  "$(xserver_bin)" "$d" -screen 0 3624x1080x24 -nolisten tcp >"$RDIR/xserver$n.log" 2>&1 &
  echo $! > "$RDIR/xserver$n.pid"
  for x in $(seq 1 50); do DISPLAY="$d" xdpyinfo >/dev/null 2>&1 && break; sleep 0.2; done
  DISPLAY="$d" xdpyinfo >/dev/null 2>&1 || die NO_REPLICA "$d did not answer xdpyinfo — $(tail -2 "$RDIR/xserver$n.log" | tr '\n' ' ')"
  DISPLAY="$d" setsid dbus-run-session -- mutter --x11 -d "$d" >"$RDIR/wm$n.log" 2>&1 &
  echo $! > "$RDIR/wm$n.pid"
  for x in $(seq 1 60); do
    DISPLAY="$d" xprop -root _NET_SUPPORTING_WM_CHECK 2>/dev/null | grep -q 'window id' && break; sleep 0.2
  done
  DISPLAY="$d" xprop -root _NET_SUPPORTING_WM_CHECK 2>/dev/null | grep -q 'window id' || die NO_REPLICA "no window manager on $d — $(tail -2 "$RDIR/wm$n.log" | tr '\n' ' ')"
  local clients; clients="$("$LIBDIR/hostwin" "$d" clients | wc -l)"
  [ "$clients" -eq 0 ] || die RIG_DIRTY "$clients client window(s) already on $d - measurements would be void"
  printf '%s\n' "$d"
}

cmd_down() {
  local d="${1:?display}" n; n="${d#:}"
  in_range "$d" || die REPLICA_FOREIGN "display $d is outside the replica range :$REPLICA_MIN-:$REPLICA_MAX - it is not mine to touch"
  [ -f "$RDIR/wm$n.pid" ] && kill -TERM -"$(cat "$RDIR/wm$n.pid")" >/dev/null 2>&1 || pkill -f "mutter --x11 -d $d\$" >/dev/null 2>&1
  pkill -f "xmessage -name OPERATOR-$n\$" >/dev/null 2>&1
  if [ -f "$RDIR/xserver$n.pid" ]; then kill "$(cat "$RDIR/xserver$n.pid")" 2>/dev/null; fi
  local i; for i in $(seq 1 30); do [ ! -e "/tmp/.X11-unix/X$n" ] && break; sleep 0.2; done
  rm -f "$RDIR/xserver$n.pid" "$RDIR/wm$n.pid"
  [ ! -e "/tmp/.X11-unix/X$n" ] || die RIG_LEFTOVER "$d still has a socket after teardown"
}

cmd_operator() {
  local d="${1:?display}" n w i; n="${d#:}"
  command -v xmessage >/dev/null || die NO_REPLICA "xmessage is not installed (the focusable stand-in window)"
  DISPLAY="$d" xmessage -name "OPERATOR-$n" -title OPERATOR -geometry 1400x800+30+30 "operator working here" >/dev/null 2>&1 &
  for i in $(seq 1 40); do
    w="$("$LIBDIR/hostwin" "$d" clients | head -1)"; [ -n "$w" ] && break; sleep 0.2
  done
  [ -n "$w" ] || die NO_REPLICA "the operator window never mapped on $d"
  DISPLAY="$d" xdotool windowfocus "$((w))"; sleep 0.8
  # the operator window must be focused AND on top, or every later comparison is meaningless
  [ "$("$LIBDIR/hostwin" "$d" active)" = "$w" ] && [ "$("$LIBDIR/hostwin" "$d" top)" = "$w" ] \
    || die INSTRUMENT_INVALID "operator window $w is not focused/top on $d (active=$("$LIBDIR/hostwin" "$d" active) top=$("$LIBDIR/hostwin" "$d" top))"
  printf '%s\n' "$w"
}

case "${1:-}" in
  up)       cmd_up ;;
  down)     cmd_down "${2:-}" ;;
  operator) cmd_operator "${2:-}" ;;
  *) die BAD_VERB "usage: replica.sh up | down D | operator D" ;;
esac
