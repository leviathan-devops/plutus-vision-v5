#!/usr/bin/env bash
# surface.sh - L2 dispatch. Sourced after lib.sh and govern.sh.
#
#   surface_choose [ADAPTER]     print the adapter to use. A named adapter must be AVAILABLE
#                                (its own probe) or this refuses ADAPTER_UNAVAILABLE with the
#                                reason - it never quietly picks a different one.
#   surface_up ID ADAPTER SIZE   bring the surface up; print the X slot
#   surface_down ID              scoped teardown: THIS instance's process groups, nothing else
#
# INVARIANT: a display in the operator's reserved range (:0/:1/:2) is never created or written.

SURFACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/adapters"

surface_choose() {
  local want="${1:-}" out
  if [ -n "$want" ]; then
    [ -x "$SURFACE_DIR/$want.sh" ] || refuse BAD_ADAPTER "no adapter '$want' (available: $(paste -sd'|' "$SURFACE_DIR/order"))"
    out="$(bash "$SURFACE_DIR/$want.sh" probe 2>&1 | tail -1)"
    [[ "$out" == *'"available":true'* ]] || refuse ADAPTER_UNAVAILABLE "$want: $(printf '%s' "$out" | grep -oE '"reason":"[^"]*"' | head -1)"
    printf '%s' "$want"; return 0
  fi
  local pj sel
  pj="$(bash "$CU_HOME/core/probe.sh")" || exit $?
  sel="$(printf '%s' "$pj" | grep -oE '"selected":\{[^}]*\}' | grep -oE '"surface":"[^"]*"' | cut -d'"' -f4)"
  [ -n "$sel" ] || refuse NO_SURFACE "no surface adapter satisfies the contract on this host - run: computer doctor"
  printf '%s' "$sel"
}

surface_up() {
  local id="$1" adapter="$2" size="${3:-}"
  local slot
  slot="$(bash "$SURFACE_DIR/$adapter.sh" up "$id" ${size:+"$size"})" || exit $?
  [ -n "$slot" ] || refuse SURFACE_NO_DISPLAY "adapter $adapter produced no display"
  printf '%s' "$slot"
}

# Kill ONLY what the instance's own record names, and only if it is STILL that process:
# the compositor/X-server group, every app group, and the instance's own tmux server.
# Siblings are untouched (anti-pattern A5), and a pid the OS has since reused is not ours
# to signal (apps are recorded as pid:starttime tokens).
surface_down() {
  local id="$1" t killed="" adapter apps ctok
  adapter="$(rec_get "$id" adapter 2>/dev/null || true)"
  apps="$(rec_get "$id" app_pids 2>/dev/null || true)"
  for t in $apps; do
    if tok_alive "$t"; then kill_tok "$t" && killed="$killed $(tok_pid "$t")" || refuse TEARDOWN_INCOMPLETE "app $t of instance $id survived TERM and KILL"; fi
  done
  tmux -L "cu-$id" kill-server 2>/dev/null || true
  if [ "$adapter" != existing ]; then
    ctok="$(rec_get "$id" comp_tok 2>/dev/null || true)"
    if [ -n "$ctok" ]; then
      # the leader may be gone while its Xwayland still holds the display slot: signal the group
      if tok_alive "$ctok" || group_alive "$(tok_pid "$ctok")"; then
        kill_group "$(tok_pid "$ctok")" && killed="$killed $(tok_pid "$ctok")" || refuse TEARDOWN_INCOMPLETE "compositor group $(tok_pid "$ctok") of instance $id survived TERM and KILL"
      fi
    fi
  fi
  rec_clear "$id"
  printf '%s' "${killed# }"
}
