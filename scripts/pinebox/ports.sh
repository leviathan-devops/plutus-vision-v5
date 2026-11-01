#!/usr/bin/env bash
# ports.sh - the port block and the claim check (PINEBOX blueprint sections 4 and 8).
# Sourced after the computer-use core's lib.sh.
#
#   pb_ports_json ID        {"station":N,"rail":N,"server":N,"cdp":N,"ws":N,"vnc":N}
#   pb_port ID NAME         one port
#   pb_claim ID             refuse PORT_TAKEN:<port> unless every port is free, or already
#                           held by THIS instance's own recorded processes
#
# EVERY resource of an instance is derived from its id, in ONE function. Nothing is shared,
# so concurrent instances cannot collide. This is the only file in PINEBOX allowed to
# contain the base numbers - anti-pattern B2 greps the whole tree for them and must find
# them only in pb_ports_json.
#
# THE ID SPACE IS BOUNDED. With a stride of 10 and the ws port at server+80, ids above 9
# would put one instance's station on another's server (id 11's station is id 0's
# server), so an id outside 0..9 is a refusal, not a collision.

PB_MAX_ID=9

pb_ports_json() {
  local n="$1"
  # Decimal only: a leading zero makes bash arithmetic read the id as OCTAL
  # (08/09 abort, 010 becomes 8), so a syntactically valid id would silently
  # name the wrong block. Canonical form is the only accepted form.
  [[ "$n" =~ ^(0|[1-9])$ ]] \
    || refuse BAD_ID "pinebox instance id must be a canonical decimal 0..$PB_MAX_ID so the derived port blocks cannot overlap, got '$n'"
  # A 100-port stride is REQUIRED, not cosmetic: ws is server+80, so a stride
  # of 10 made id 0's ws collide with id 8's server. 100 separates every family.
  # room = the Backtest room's control surface; 9443 is its canonical port (id 0), so a stride of 100
  # keeps it clear of every other family (their last two digits are 41/54/51/22/31)
  printf '{"station":%d,"rail":%d,"server":%d,"cdp":%d,"ws":%d,"vnc":%d,"room":%d}' \
    $((9741 + n * 100)) $((9754 + n * 100)) $((9851 + n * 100)) $((9222 + n * 100)) $((9851 + n * 100 + 80)) $((5900 + n)) $((9443 + n * 100))
}

pb_port() {
  local json
  json="$(pb_ports_json "$1")" || return $?
  printf '%s' "$json" | jq -er ".$2"
}

# pb_port_probe PORT: 0 = LISTENING, 1 = FREE, 2 = THE PROBE ITSELF FAILED.
# A failed probe is NEVER "free": that conflation let pb_claim succeed when `ss`
# was missing or errored, which is a fail-open on a safety gate.
pb_port_probe() {
  [[ "$1" =~ ^[0-9]+$ ]] || return 2
  command -v ss >/dev/null 2>&1 || return 2
  local out
  out="$(ss -ltnH "sport = :$1" 2>&1)" || return 2
  case "$out" in *[Ee]rror*|*"Cannot"*|*"cannot"*) return 2 ;; esac
  [ -n "$out" ]
}

# what holds this port: "" when free, else "<pid|unknown> <cmdline-head>". A LISTEN row with
# no visible owner is HELD (owner "unknown") - never free. Returns 2 when the probe failed.
pb_port_holder() {
  pb_port_probe "$1"
  case $? in 1) return 0 ;; 2) return 2 ;; esac
  local pid; pid="$(port_owner "$1")"
  if [ -z "$pid" ]; then printf 'unknown (owner not visible)'; return 0; fi
  printf '%s %s' "$pid" "$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null | cut -c1-70)"
}

# pb_claim ID [OWN_PIDS...]: every port must be free, or held by a pid of OUR instance.
# Serialized per id under flock so two concurrent claimants cannot both observe "free".
# A pid is trusted only while its cmdline still names a pinebox-owned process.
pb_claim() {
  local id="$1"; shift
  local own=" $* " name port holder pid rc
  mkdir -p "${PB_ROOT:-/tmp/pinebox}" 2>/dev/null
  exec 6>"${PB_ROOT:-/tmp/pinebox}/.claim-$id.lock"; flock -x 6
  for name in station rail server cdp ws vnc room; do
    port="$(pb_port "$id" "$name")" || { exec 6>&-; refuse BAD_ID "could not derive the $name port for instance '$id'"; }
    [ -n "$port" ] || { exec 6>&-; refuse BAD_ID "empty $name port for instance '$id'"; }
    holder="$(pb_port_holder "$port")"; rc=$?
    [ "$rc" -eq 2 ] && { exec 6>&-; refuse PORT_PROBE_FAILED "cannot determine whether $name port $port is free (ss missing or errored) - refusing rather than assuming free"; }
    [ -z "$holder" ] && continue
    pid="${holder%% *}"
    case "$own" in *" $pid "*) [ "$pid" != unknown ] && [ -r "/proc/$pid/cmdline" ] && continue ;; esac   # an invisible or dead owner is never ours
    exec 6>&-
    refuse "PORT_TAKEN:$port" "$name port $port is held by pid $pid (${holder#* }), not by this instance"
  done
  exec 6>&-
}
