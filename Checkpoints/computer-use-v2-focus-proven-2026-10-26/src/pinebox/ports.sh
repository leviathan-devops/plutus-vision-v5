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
  [[ "$n" =~ ^[0-9]+$ ]] && [ "$n" -le "$PB_MAX_ID" ] \
    || refuse BAD_ID "pinebox instance id must be 0..$PB_MAX_ID so the derived port blocks cannot overlap, got '$n'"
  printf '{"station":%d,"rail":%d,"server":%d,"cdp":%d,"ws":%d,"vnc":%d}' \
    $((9741 + n * 10)) $((9754 + n * 10)) $((9851 + n * 10)) $((9222 + n * 10)) $((9851 + n * 10 + 80)) $((5900 + n))
}

pb_port() {
  local json; json="$(pb_ports_json "$1")" || exit $?
  printf '%s' "$json" | jq -r ".$2"
}

# what holds this port: "" when free, else "<pid|unknown> <cmdline-head>". A LISTEN row with
# no visible owner is HELD (owner "unknown") - never free.
pb_port_holder() {
  port_listening "$1" || return 0
  local pid; pid="$(port_owner "$1")"
  if [ -z "$pid" ]; then printf 'unknown (owner not visible)'; return 0; fi
  printf '%s %s' "$pid" "$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null | cut -c1-70)"
}

# pb_claim ID [OWN_PIDS...]: every port must be free, or held by a pid of OUR instance
pb_claim() {
  local id="$1"; shift
  local own=" $* " name port holder pid
  for name in station rail server cdp ws; do
    port="$(pb_port "$id" "$name")"
    holder="$(pb_port_holder "$port")"
    [ -z "$holder" ] && continue
    pid="${holder%% *}"
    case "$own" in *" $pid "*) [ "$pid" != unknown ] && continue ;; esac   # an invisible owner is never ours
    refuse "PORT_TAKEN:$port" "$name port $port is held by pid $pid (${holder#* }), not by this instance"
  done
}
