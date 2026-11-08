#!/usr/bin/env bash
# existing - the caller's own display, passed through. It NEVER creates, kills or raises
# anything: this is v1's behaviour exactly, and it cannot fail differently than v1 did.
#
#   existing.sh probe          one JSON object: {adapter, available, reason, evidence}
#   existing.sh up ID [WxH]    bind instance ID to the caller's display, print its slot
#
# The display is CU_EXISTING_DISPLAY if set, else $DISPLAY.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/../lib.sh"

target() { printf '%s' "${CU_EXISTING_DISPLAY:-${DISPLAY:-}}"; }

op_probe() {
  local t reason=""; t="$(target)"
  [ -n "$t" ] || reason="no display: CU_EXISTING_DISPLAY and DISPLAY are both unset"
  [ -z "$reason" ] && ! DISPLAY="$t" timeout 4 xdpyinfo >/dev/null 2>&1 && reason="display '$t' does not answer xdpyinfo"
  local avail=false; [ -z "$reason" ] && avail=true
  printf '{"adapter":"existing","available":%s,"reason":"%s","evidence":{"display":"%s"}}\n' \
    "$avail" "$(jesc "$reason")" "$(jesc "$t")"
}

op_up() {
  local id="$1" t; t="$(target)"
  [ -n "$t" ] || refuse NO_SURFACE "existing: no display to bind (set CU_EXISTING_DISPLAY or DISPLAY)"
  DISPLAY="$t" timeout 4 xdpyinfo >/dev/null 2>&1 || refuse DISPLAY_DEAD "existing: '$t' does not answer xdpyinfo"
  rec_set "$id" x_slot "${t#:}" adapter existing up_at "$(date -Is)"
  printf '%s' "${t#:}"
}

case "${1:-}" in
  probe) op_probe ;;
  view)  refuse NO_HOST_WINDOW "adapter existing has no window on a host display - use screenshot" ;;
  up)    op_up "${2:?id}" ;;
  *)     refuse BAD_VERB "existing: unknown op '${1:-}' (probe|up|view)" ;;
esac
