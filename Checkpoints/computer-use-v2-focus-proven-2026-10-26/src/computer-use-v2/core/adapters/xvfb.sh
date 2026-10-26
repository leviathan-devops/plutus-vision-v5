#!/usr/bin/env bash
# xvfb - a real X framebuffer: pixels the agent can capture and click, no compositor.
#
#   xvfb.sh probe        one JSON object: {adapter, available, reason, evidence}
#   xvfb.sh up ID [WxH]  start it, print its X slot
#
# Selected when there is no weston but Xvfb exists. Blueprint section 5: the display
# number is chosen by scanning for a free slot from :3 upward, so it can never be one of
# the operator's (:0/:1/:2) and can never collide with another instance.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/../lib.sh"
. "$HERE/../govern.sh"

free_slot() {
  local n
  for n in $(seq 3 60); do
    [ -e "/tmp/.X11-unix/X$n" ] && continue
    [ -e "/tmp/.X$n-lock" ] && continue
    printf '%s' "$n"; return 0
  done
  return 1
}

op_probe() {
  local reason="" ver=""
  command -v Xvfb >/dev/null 2>&1 || reason="Xvfb is not installed"
  if [ -z "$reason" ]; then
    ver="$(Xvfb -version 2>&1 | head -1)"
    case "$ver" in *X*erver*|*Xvfb*|*X.Org*|*version*) ;; *) reason="Xvfb -version did not answer: $ver";; esac
  fi
  local avail=false; [ -z "$reason" ] && avail=true
  printf '{"adapter":"xvfb","available":%s,"reason":"%s","evidence":{"xvfb":"%s","path":"%s"}}\n' \
    "$avail" "$(jesc "$reason")" "$(jesc "$ver")" "$(jesc "$(command -v Xvfb || true)")"
}

op_up() {
  local id="$1" size="${2:-1626x931}"
  local d log slot xpid i
  d="$(idir "$id")"; log="$d/xvfb.log"; mkdir -p "$d"; : > "$log"
  need Xvfb NO_SURFACE
  slot="$(free_slot)" || refuse NO_SLOT "no free X slot between :3 and :60"
  local before; before="$(c3_snapshot)"
  setsid Xvfb ":$slot" -screen 0 "${size}x24" -nolisten tcp >> "$log" 2>&1 &
  xpid=$!
  UP_PID="$xpid"; UP_DONE=0
  up_abort() { [ "${UP_DONE:-1}" = 0 ] && kill_group "$UP_PID" 2>/dev/null; }
  trap up_abort EXIT; trap 'exit 130' INT TERM
  for i in $(seq 1 50); do
    DISPLAY=":$slot" timeout 3 xdpyinfo >/dev/null 2>&1 && break
    pid_alive "$xpid" || { kill_group "$xpid"; refuse COMPOSITOR_FATAL "Xvfb exited — $(tail -3 "$log" | tr '\n' ' ')"; }
    sleep 0.2
  done
  DISPLAY=":$slot" timeout 3 xdpyinfo >/dev/null 2>&1 || { kill_group "$xpid"; refuse DISPLAY_DEAD ":$slot does not answer xdpyinfo"; }
  local after; after="$(c3_snapshot)"
  if ! ( c3_check "$before" "$after" "xvfb up" "" ); then kill_group "$xpid"; exit 1; fi
  rec_set "$id" comp_pid "$xpid" comp_tok "$(pid_token "$xpid")" x_slot "$slot" adapter xvfb size "$size" up_at "$(date -Is)"
  UP_DONE=1
  printf '%s' "$slot"
}

case "${1:-}" in
  probe) op_probe ;;
  view)  refuse NO_HOST_WINDOW "adapter xvfb has no window on a host display - use screenshot" ;;
  up)    op_up "${2:?id}" "${3:-}" ;;
  *)     refuse BAD_VERB "xvfb: unknown op '${1:-}' (probe|up|view)" ;;
esac
