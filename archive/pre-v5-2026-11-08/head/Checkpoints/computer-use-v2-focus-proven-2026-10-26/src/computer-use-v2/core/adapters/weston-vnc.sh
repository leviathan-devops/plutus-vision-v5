#!/usr/bin/env bash
# weston-vnc - the SAME compositor, served on a VNC port instead of drawn on a host display.
#
#   weston-vnc.sh probe        one JSON object: {adapter, available, reason, evidence}
#   weston-vnc.sh up ID [WxH]  start it, print its X slot
#
# Selected when the operator is remote, the host has no display, or weston-x11 is
# unavailable. A remote operator looks at it by connecting to 5900+id (contract C6).
# The drive path is byte-identical to weston-x11 because the display string is identical.
#
# MEASURED 2026-10-26: `weston --backend=vnc-backend.so --xwayland ...` logs
# "Output 'vnc' enabled with head(s) vnc", reports "xserver listening on display :3",
# and adds zero windows to the operator's display.
# FLAG NOTE (measured): the port flag is `--port=PORT`. `--vnc-port` is fatal
# ("unhandled option"). TLS needs `--vnc-tls-cert` and `--vnc-tls-key`.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/../lib.sh"
. "$HERE/../govern.sh"

backend_module() { ls /usr/lib/*/libweston-*/vnc-backend.so 2>/dev/null | head -1; }
vnc_port_for() { printf '%s' "$((5900 + $1))"; }

op_probe() {
  local reason="" w_ver="" mod
  command -v weston >/dev/null 2>&1   || reason="weston is not installed"
  [ -z "$reason" ] && ! command -v Xwayland >/dev/null 2>&1 && reason="Xwayland is not installed"
  [ -z "$reason" ] && ! command -v openssl >/dev/null 2>&1 && reason="openssl is not installed (the VNC backend needs a TLS certificate)"
  [ -z "$reason" ] && { w_ver="$(weston --version 2>&1 | head -1)"; case "$w_ver" in *eston*) ;; *) reason="weston --version did not answer: $w_ver";; esac; }
  [ -z "$reason" ] && { mod="$(backend_module)"; [ -n "$mod" ] || reason="weston's vnc backend module is not installed"; }
  local avail=false; [ -z "$reason" ] && avail=true
  printf '{"adapter":"weston-vnc","available":%s,"reason":"%s","evidence":{"weston":"%s","backend":"%s"}}\n' \
    "$avail" "$(jesc "$reason")" "$(jesc "$w_ver")" "$(jesc "${mod:-}")"
}

op_up() {
  local id="$1" size="${2:-1626x931}"
  local w="${size%x*}" h="${size#*x}"
  local d rt log port tls
  d="$(idir "$id")"; rt="$d/rt"; log="$d/compositor.log"; port="$(vnc_port_for "$id")"
  mkdir -p "$d"
  need weston COMPOSITOR_ABSENT; need Xwayland XWAYLAND_ABSENT; need openssl TLS_CERT_FAILED

  if port_listening "$port"; then
    refuse PORT_TAKEN "vnc port $port is held by pid $(port_owner "$port" | grep . || echo '(owner not visible)') - not this instance"
  fi

  # the VNC backend refuses to start without a TLS pair; a missing one is GENERATED, never skipped
  tls="$ROOT/tls"; mkdir -p "$tls"
  if [ ! -s "$tls/cert.pem" ] || [ ! -s "$tls/key.pem" ]; then
    openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -keyout "$tls/key.pem" \
      -out "$tls/cert.pem" -subj "/CN=computer-use" >/dev/null 2>&1 \
      || refuse TLS_CERT_FAILED "openssl could not generate a certificate in $tls"
  fi
  chmod 600 "$tls/key.pem"

  rm -rf "$rt"; mkdir -p "$rt"; chmod 700 "$rt"; : > "$log"
  local before; before="$(c3_snapshot)"

  env -u WAYLAND_DISPLAY XDG_RUNTIME_DIR="$rt" \
      setsid weston --backend=vnc-backend.so --xwayland --socket="computer-use$id" \
        --width="$w" --height="$h" --idle-time=0 --port="$port" \
        --vnc-tls-cert="$tls/cert.pem" --vnc-tls-key="$tls/key.pem" >> "$log" 2>&1 &
  local wpid=$!
  UP_PID="$wpid"; UP_DONE=0
  up_abort() { [ "${UP_DONE:-1}" = 0 ] && kill_group "$UP_PID" 2>/dev/null; }
  trap up_abort EXIT; trap 'exit 130' INT TERM

  local slot="" have_out=0 i
  for i in $(seq 1 100); do
    grep -q "Output 'vnc' enabled" "$log" 2>/dev/null && have_out=1
    slot="$(grep -oE 'xserver listening on display :[0-9]+' "$log" 2>/dev/null | grep -oE '[0-9]+$' | head -1)"
    [ -n "$slot" ] && [ "$have_out" = 1 ] && break
    pid_alive "$wpid" || { kill_group "$wpid"; refuse COMPOSITOR_FATAL "weston exited — $(tail -3 "$log" | tr '\n' ' ')"; }
    sleep 0.2
  done
  [ "$have_out" = 1 ] || { kill_group "$wpid"; refuse COMPOSITOR_NO_OUTPUT "no \"Output 'vnc' enabled\" line — $log"; }
  [ -n "$slot" ]      || { kill_group "$wpid"; refuse NO_XWAYLAND "weston never reported an xserver — $log"; }
  [ "$slot" -ge 3 ] 2>/dev/null || { kill_group "$wpid"; refuse SLOT_FORBIDDEN ":$slot is in the operator's range (:0/:1/:2)"; }
  DISPLAY=":$slot" timeout 5 xdpyinfo >/dev/null 2>&1 || { kill_group "$wpid"; refuse DISPLAY_DEAD ":$slot does not answer xdpyinfo"; }
  port_listening "$port" || { kill_group "$wpid"; refuse VNC_NOT_LISTENING "nothing listens on :$port"; }

  local after; after="$(c3_snapshot)"
  if ! ( c3_check "$before" "$after" "weston-vnc up" "" ); then kill_group "$wpid"; exit 1; fi

  rec_set "$id" comp_pid "$wpid" comp_tok "$(pid_token "$wpid")" x_slot "$slot" adapter weston-vnc \
          wayland "computer-use$id" vnc_port "$port" size "$size" up_at "$(date -Is)"
  UP_DONE=1
  printf '%s' "$slot"
}

op_view() {
  printf '{"ok":true,"serve":"vnc","port":%s,"note":"connect a VNC client; this instance has no window on a host display"}\n' "$(rec_get "$1" vnc_port)"
}

case "${1:-}" in
  probe) op_probe ;;
  view)  op_view "${2:?id}" ;;
  up)    op_up "${2:?id}" "${3:-}" ;;
  *)     refuse BAD_VERB "weston-vnc: unknown op '${1:-}' (probe|up|view)" ;;
esac
