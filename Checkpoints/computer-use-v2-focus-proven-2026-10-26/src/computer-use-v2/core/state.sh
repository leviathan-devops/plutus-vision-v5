#!/usr/bin/env bash
# state.sh - L3. The computer's filesystem plane: the scoped store (blueprint section 6).
# Sourced after lib.sh.
#
#   state_get ID KEY            a row from the instance's store
#   state_put ID KEY VALUE [--db PATH]   a row, or a SCOPE_VIOLATION refusal
#   state_battery               run the store's own 68-assertion battery in place
#
# The 7 files in scoped/ are copied VERBATIM from the boilerplate and never edited; the
# build gate (test/cmp-guard.sh, anti-pattern A9) fails on any difference.

STATE_CLI="$CU_HOME/core/state-cli.ts"

state_run() {
  need bun NO_STATE
  local out rc
  out="$(bun "$STATE_CLI" "$@" 2>&1)"; rc=$?
  if [ "$rc" -ne 0 ]; then
    local line; line="$(printf '%s' "$out" | grep -m1 '^REFUSED' || printf '%s' "$out" | tail -1)"
    local tok; tok="$(printf '%s' "$line" | sed -E 's/^REFUSED +([A-Z_]+).*/\1/')"
    case "$tok" in [A-Z_]*) ;; *) tok=STATE_FAILED;; esac
    local detail; detail="$(printf '%s' "$line" | sed -E 's/^REFUSED +[A-Z_]+ +— +//')"
    refuse "$tok" "$detail"
  fi
  printf '%s\n' "$out"
}

state_get() { state_run get "$(idir "$1")" "$2"; }
state_put() { state_run put "$(idir "$1")" "$2" "$3" ${4:+--db "$4"}; }

state_battery() {
  need bun NO_STATE
  ( cd "$CU_HOME/scoped" && bun test workspace-scoping.test.ts 2>&1 )
}
