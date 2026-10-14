#!/usr/bin/env bash
# pv-port-guard — a PORT GUARDIAN. A product's port must not be free real-estate.
#
# INCIDENT (2026-10-14): a /tmp CORS shim (corsserve-cu-clay.py) squatted the
# dashboard's :9430 and its /api/ proxy bounced back to :9851 — an INFINITE loop
# (158,843 reqs / 12,900 threads / 587 MB per server, ×5 instances ≈ 8 GB).
#
# PID DISCOVERY (measured): /proc/<pid>/fd is Permission-denied for processes in
# an ORCA scope, so `ss -ltnp`, `fuser` and an inode scan all find NO owner even
# for a live server. The readable path is the CGROUP: `ss -ltne` prints
# `cgroup:/user.slice/.../<scope>`, and /sys/fs/cgroup/<scope>/cgroup.procs lists
# its pids; each pid's /proc/<pid>/cmdline IS readable. So the guardian resolves
# the holder by cgroup, not by /proc/fd.
#
# POLICY: for a protected port, a pid whose cmdline is NOT the declared owner AND
# is a throwaway script (a /tmp/ interpreter) is a SQUATTER → TERM, then KILL.
# A legit owner is never touched. Every action is logged.
set -uo pipefail

LOG="${PV_GUARD_LOG:-/tmp/pv-port-guard.log}"
TICK="${PV_GUARD_TICK:-3}"
GRACE="${PV_GUARD_GRACE:-2}"

say() { printf '%s  %s\n' "$(date '+%F %T')" "$*" >> "$LOG"; }

# "port:owner-regex" — the ONLY cmdline allowed to hold that port.
PROTECT=(
  "9430:electron.*PLUTUS/LIVE/dashboard|dashboard/dashboard/electron|electron/main\.js"
  "9431:electron.*PLUTUS/LIVE/dashboard|dashboard/dashboard/electron"
  "9741:pine-station|node.*server\.mjs"
  "9851:pv-server\.py"
  "9863:pv-server\.py"
)
# A throwaway squat: an interpreter launched FROM a /tmp script. The script path is
# the interpreter's FIRST argument — matching /tmp/ anywhere in the argv is too broad
# (a legit pv-server's argv carries a /tmp/ renderer-root argument and would match).
SQUAT_RE='(^|[[:space:]])(python|python3|node|bun|bash|sh)[[:space:]]+/tmp/'

holder_cgroup() {   # port -> the cgroup scope that owns its LISTEN socket
  ss -ltne "sport = :$1" 2>/dev/null | grep -oE 'cgroup:[^ ]+' | head -1 | sed 's/^cgroup://'
}

squatters_on() {    # port:allowed -> pids that are /tmp-squats in the holder's cgroup
  local port="${1%%:*}" allowed="${1#*:}" cg pid cmd
  cg="$(holder_cgroup "$port")"
  [ -n "$cg" ] || return 0
  local procs="/sys/fs/cgroup${cg}/cgroup.procs"
  [ -r "$procs" ] || return 0
  for pid in $(cat "$procs" 2>/dev/null); do
    cmd="$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null)"
    [ -n "$cmd" ] || continue
    printf '%s' "$cmd" | grep -qE "$allowed" && continue          # the legit owner
    if printf '%s' "$cmd" | grep -qE "$SQUAT_RE"; then printf '%s ' "$pid"; fi
  done
}

guard_one() {
  local entry="$1" pids pid cmd
  pids="$(squatters_on "$entry")"
  [ -n "$pids" ] || return 0
  for pid in $pids; do
    cmd="$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null | cut -c1-120)"
    say "SQUATTER :${entry%%:*} pid=$pid  KILLED — cmd='$cmd'  (only [${entry#*:}] may hold this port)"
    kill -TERM "$pid" 2>/dev/null
    sleep "$GRACE"
    kill -KILL "$pid" 2>/dev/null || true
  done
}

say "GUARD START  protected=${#PROTECT[@]} ports  tick=${TICK}s  policy=/tmp-squats-only"
while true; do
  for entry in "${PROTECT[@]}"; do guard_one "$entry"; done
  sleep "$TICK"
done
