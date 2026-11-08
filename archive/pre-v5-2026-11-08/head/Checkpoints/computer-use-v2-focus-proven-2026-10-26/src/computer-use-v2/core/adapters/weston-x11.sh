#!/usr/bin/env bash
# weston-x11 - the preferred surface: a real compositor whose window sits on the
# operator's screen, can be clicked into and looked at, and STAYS IN THE BACKGROUND.
#
#   weston-x11.sh probe        print one JSON object: {adapter, available, reason, evidence}
#   weston-x11.sh up ID [WxH]  start the compositor, print its X slot
#
# THE FOCUS CONTRACT (blueprint C3), and the root cause this adapter is built around:
#   MEASURED 2026-10-26 on a clean replica display (mutter 46.2 as the window manager),
#   paired A/B, each case on its own fresh display:
#     no interposer  : focus STOLEN on map, compositor window on TOP of the stack
#     nofocus.so     : focus KEPT on the operator, compositor window UNDER the operator
#   libweston-13/x11-backend.so maps its host window with no _NET_WM_USER_TIME and no
#   placement hint (it references 0 of 11 such atoms), so the host window manager applies
#   its default focus-on-map policy. helpers/nofocus.c sets the two EWMH hints on the same
#   connection just before the map; this adapter then releases the BELOW state so a human
#   can still click the window forward. Interacting with the instance afterwards moves no
#   focus (measured: 11 rungs, X and CDP, focus kept and operator on top at every one).
#
# Nothing in this file raises, activates or focuses a window.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/../lib.sh"
. "$HERE/../govern.sh"

backend_module() { ls /usr/lib/*/libweston-*/x11-backend.so 2>/dev/null | head -1; }

op_probe() {
  local reason="" w_ver="" x_ver="" host mod libdir
  command -v weston >/dev/null 2>&1    || reason="weston is not installed"
  [ -z "$reason" ] && ! command -v Xwayland >/dev/null 2>&1 && reason="Xwayland is not installed"
  [ -z "$reason" ] && { w_ver="$(weston --version 2>&1 | head -1)"; case "$w_ver" in *eston*) ;; *) reason="weston --version did not answer: $w_ver";; esac; }
  [ -z "$reason" ] && x_ver="$(Xwayland -version 2>&1 | head -1)"
  [ -z "$reason" ] && { mod="$(backend_module)"; [ -n "$mod" ] || reason="weston's x11 backend module is not installed"; }
  host="$(host_display)"
  [ -z "$reason" ] && [ -z "$host" ] && reason="no host display: DISPLAY and CU_HOST_DISPLAY are both unset"
  [ -z "$reason" ] && ! DISPLAY="$host" timeout 4 xdpyinfo >/dev/null 2>&1 && reason="the host display '$host' does not answer xdpyinfo"
  if [ -z "$reason" ]; then
    libdir="$("$HERE/../../helpers/build.sh" 2>&1)" || reason="helpers: $(printf '%s' "$libdir" | head -1)"
  fi
  local avail=false; [ -z "$reason" ] && avail=true
  printf '{"adapter":"weston-x11","available":%s,"reason":"%s","evidence":{"weston":"%s","xwayland":"%s","backend":"%s","host_display":"%s","helpers":"%s"}}\n' \
    "$avail" "$(jesc "$reason")" "$(jesc "$w_ver")" "$(jesc "$x_ver")" "$(jesc "${mod:-}")" "$(jesc "$host")" "$(jesc "${libdir:-}")"
}

op_up() {
  local id="$1" size="${2:-1626x931}"
  local w="${size%x*}" h="${size#*x}"
  local d rt log host
  d="$(idir "$id")"; rt="$d/rt"; log="$d/compositor.log"; host="$(host_display)"
  mkdir -p "$d"
  need weston COMPOSITOR_ABSENT; need Xwayland XWAYLAND_ABSENT
  [ -n "$host" ] || refuse NO_HOST_DISPLAY "weston-x11 draws a window on the host display and none is set - use --adapter weston-vnc or xvfb"
  DISPLAY="$host" timeout 4 xdpyinfo >/dev/null 2>&1 || refuse NO_HOST_DISPLAY "host display '$host' does not answer"
  local libdir berr
  libdir="$("$HERE/../../helpers/build.sh" 2>"$d/build.err")" \
    || refuse HELPERS_UNAVAILABLE "$(sed -E 's/^REFUSED +[A-Z_]+ +— +//' "$d/build.err" | head -1)"
  [ -f "$libdir/nofocus.so" ] || refuse SHIM_UNAVAILABLE "$libdir/nofocus.so was not built"

  rm -rf "$rt"; mkdir -p "$rt"; chmod 700 "$rt"
  : > "$log"

  local before smp; before="$(c3_snapshot)"
  smp="$(c3_sampler_start)"   # a timeline of the operator's focus/stack for the WHOLE of `up`

  # WAYLAND_DISPLAY is stripped: inherited, it sends the compositor's clients to the
  # operator's Wayland session instead of this instance (measured: 0 windows mapped).
  env -u WAYLAND_DISPLAY DISPLAY="$host" XDG_RUNTIME_DIR="$rt" \
      LD_PRELOAD="$libdir/nofocus.so" NOFOCUS_BELOW=1 NOFOCUS_TRACE=1 \
      setsid weston --backend=x11-backend.so --xwayland --socket="computer-use$id" \
        --width="$w" --height="$h" --idle-time=0 >> "$log" 2>&1 &
  local wpid=$!
  # SIGNAL-SAFE: an interrupt or a kill during the wait below must not leave a live
  # compositor with no record. The trap tears down the half-started group; it is disarmed
  # only when the instance is fully recorded.
  UP_PID="$wpid"; UP_DONE=0
  up_abort() { [ "${UP_DONE:-1}" = 0 ] && kill_group "$UP_PID" 2>/dev/null; }
  trap up_abort EXIT; trap 'exit 130' INT TERM

  # Everything below is read from the compositor's OWN output, never assumed or slept on.
  local slot="" hwin="" i
  for i in $(seq 1 100); do
    slot="$(grep -oE 'xserver listening on display :[0-9]+' "$log" 2>/dev/null | grep -oE '[0-9]+$' | head -1)"
    hwin="$(grep -oE '\[nofocus\] map win=0x[0-9a-f]+' "$log" 2>/dev/null | head -1 | grep -oE '0x[0-9a-f]+')"
    [ -n "$slot" ] && [ -n "$hwin" ] && break
    pid_alive "$wpid" || { kill_group "$wpid"; refuse COMPOSITOR_FATAL "weston exited — $(tail -3 "$log" | tr '\n' ' ')"; }
    sleep 0.2
  done
  [ -n "$slot" ] || { kill_group "$wpid"; refuse NO_XWAYLAND "weston never reported an xserver — $log"; }
  [ -n "$hwin" ] || { kill_group "$wpid"; refuse SHIM_NOT_LOADED "the compositor mapped its window without nofocus.so (no '[nofocus] map' line) — $log"; }
  [ "$slot" -ge 3 ] 2>/dev/null || { kill_group "$wpid"; refuse SLOT_FORBIDDEN ":$slot is in the operator's range (:0/:1/:2)"; }

  # PROVE the hint reached the window, rather than trusting that the library loaded.
  local ut; ut="$("$libdir/hostwin" "$host" usertime "$hwin" 2>/dev/null)"
  [ "$ut" = 0 ] || { kill_group "$wpid"; refuse SHIM_NOT_EFFECTIVE "host window $hwin has _NET_WM_USER_TIME '$ut', expected 0"; }

  c3_mark "$smp" map-seen
  for i in $(seq 1 50); do [ "$("$libdir/hostwin" "$host" viewable "$hwin")" = 1 ] && break; sleep 0.1; done
  c3_mark "$smp" viewable
  [ "$("$libdir/hostwin" "$host" viewable "$hwin")" = 1 ] || { kill_group "$wpid"; refuse WINDOW_NOT_MAPPED "host window $hwin is not viewable"; }

  # Release BELOW -> the normal layer, so a human can still click the window forward, and keep
  # it under the operator's windows. MEASURED (a marked timeline of a failing `up`, 5 in 45 runs
  # before this): the release itself drops the window at the TOP of the normal layer - 25 ms
  # later it was above the operator - and a lower issued before it is a no-op when the window
  # is already at the bottom. So release+lower go out as ONE message pair (hostwin release),
  # and the result is then VERIFIED on the window manager's own stack, with a bounded
  # correction if it is not under the operator. Neither step focuses or raises.
  c3_mark "$smp" release
  "$libdir/hostwin" "$host" release "$hwin" || { kill_group "$wpid"; refuse WINDOW_RELEASE_FAILED "release $hwin"; }
  local tries=0
  while [ "$tries" -lt 8 ]; do
    sleep 0.15
    if "$libdir/hostwin" "$host" state "$hwin" | grep -q BELOW; then "$libdir/hostwin" "$host" release "$hwin"; tries=$((tries+1)); continue; fi
    [ "$("$libdir/hostwin" "$host" top)" = "$hwin" ] || break
    "$libdir/hostwin" "$host" lower "$hwin"; tries=$((tries+1))
  done
  "$libdir/hostwin" "$host" state "$hwin" | grep -q BELOW && { kill_group "$wpid"; refuse WINDOW_RELEASE_FAILED "BELOW is still set on $hwin after $tries corrections"; }

  DISPLAY=":$slot" timeout 5 xdpyinfo >/dev/null 2>&1 || { kill_group "$wpid"; refuse DISPLAY_DEAD ":$slot does not answer xdpyinfo"; }

  # C3, proven on THIS run: the operator's focus and the top of their stack must not have
  # moved onto our window. A failing run is torn down, never left up.
  sleep 0.5
  local after samples; after="$(c3_snapshot)"
  samples="$(C3_SAMPLES_KEEP="$d/c3-up.timeline" c3_sampler_stop "$smp")"
  if ! ( c3_check "$before" "$after" "weston-x11 up" "$hwin" "$samples" ); then
    echo "  c3 timeline kept: $d/c3-up.timeline" >&2
    kill_group "$wpid"; exit 1
  fi

  rec_set "$id" comp_pid "$wpid" comp_tok "$(pid_token "$wpid")" x_slot "$slot" adapter weston-x11 \
          wayland "computer-use$id" host_win "$hwin" host_display "$host" size "$size" up_at "$(date -Is)"
  UP_DONE=1
  printf '%s' "$slot"
}

# THE ONLY PLACE IN THE TOOL THAT RAISES A WINDOW, reachable only through `computer view`:
# a human asked for the instance to come forward. Nothing else may.
op_view() {
  local id="$1" hw hd
  hw="$(rec_get "$id" host_win 2>/dev/null || true)"; hd="$(rec_get "$id" host_display 2>/dev/null || true)"
  [ -n "$hw" ] && [ -n "$hd" ] || refuse NOT_UP "instance $id has no host window recorded"
  "$LIBDIR/hostwin" "$hd" raise "$hw" || refuse VIEW_FAILED "could not raise $hw on $hd"
  printf '{"ok":true,"raised":"%s","display":"%s"}\n' "$hw" "$hd"
}

case "${1:-}" in
  probe) op_probe ;;
  view)  op_view "${2:?id}" ;;
  up)    op_up "${2:?id}" "${3:-}" ;;
  *)     refuse BAD_VERB "weston-x11: unknown op '${1:-}' (probe|up|view)" ;;
esac
