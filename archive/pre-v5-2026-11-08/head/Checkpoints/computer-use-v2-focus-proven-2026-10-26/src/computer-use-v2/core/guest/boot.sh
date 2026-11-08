#!/usr/bin/env bash
# boot.sh - L1, the NON-Linux runtime (blueprint sections 9 and 7A).
#
#   boot.sh guest   ID              boot a Linux guest under QEMU and bring the instance up INSIDE it
#   boot.sh agentos ID              the agentOS runtime (a Worker); see below
#   boot.sh forward ACTION [ARGS..] run any `computer` action inside the guest that owns the instance
#
# THE OPERATOR'S RULE: the VM is not needed when the native runtime is Linux. This file is
# reached ONLY through runtime_select, which on a Linux host always answers `native` (the
# detector A8 proves it). It is for a macOS/Windows host: the guest self-hosts the whole
# computer, and the host's drive path is byte-identical because the guest runs THE SAME CLI.
#
# THE GUEST'S SURFACE IS SERVED, never hidden (contract C6): QEMU's own framebuffer is served
# on 127.0.0.1:(5900 + 50 + id) with -vnc, and the guest's compositor serves a second display on
# the forwarded port, so a human can look at it with a VNC client.
#
# A guest that does not boot is REFUSED GUEST_BOOT_FAILED with QEMU's own log tail. The native
# path is NEVER used as a silent fallback: a fallback that produces a DIFFERENT computer is
# false success.
#
# REQUIREMENTS: qemu-system-x86_64, ssh, and CU_GUEST_IMAGE: a bootable qcow2 built from
# guest/rootfs/manifest.txt that carries the tool at /opt/computer-use and an sshd with the
# key in CU_GUEST_KEY. guest/rootfs/assert.sh is the presence assertion that image must pass.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/../lib.sh"

guest_ports() { printf '%s %s %s' "$((2200 + $1))" "$((5950 + $1))" "$((6200 + $1))"; }   # ssh, qemu vnc, guest display

guest_ssh() {   # ID -> prints the ssh argv prefix
  local id="$1" ssh_p; read -r ssh_p _ _ <<<"$(guest_ports "$id")"
  printf 'ssh -p %s -i %s -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=%s/known_hosts -o ConnectTimeout=5 -o BatchMode=yes root@127.0.0.1' \
    "$ssh_p" "${CU_GUEST_KEY:-$HOME/.ssh/id_ed25519}" "$(idir "$id")"
}

op_guest() {
  local id="$1" d img ssh_p vnc_p gd_p i
  d="$(idir "$id")"; mkdir -p "$d"; img="${CU_GUEST_IMAGE:-}"
  need qemu-system-x86_64 NO_RUNTIME; need ssh NO_RUNTIME
  [ -n "$img" ] || refuse GUEST_IMAGE_ABSENT "CU_GUEST_IMAGE is not set. The guest is a qcow2 built from $HERE/rootfs/manifest.txt (weston, Xwayland, Xvfb, chromium, node, tmux, sshd and this tool); build it, then export CU_GUEST_IMAGE=<path>"
  [ -s "$img" ] || refuse GUEST_IMAGE_ABSENT "CU_GUEST_IMAGE='$img' does not exist or is empty"
  read -r ssh_p vnc_p gd_p <<<"$(guest_ports "$id")"
  for p in "$ssh_p" "$vnc_p" "$gd_p"; do
    local o; o="$(port_owner "$p")"; [ -z "$o" ] || refuse PORT_TAKEN "guest port $p is held by pid $o"
  done
  local accel=tcg; [ -r /dev/kvm ] && [ -w /dev/kvm ] && accel=kvm
  : > "$d/guest-serial.log"
  # -snapshot: the guest's disk is never written, so every boot is the image that was built
  qemu-system-x86_64 -machine "accel=$accel" -m "${CU_GUEST_MEM:-2048}" -smp 2 \
    -drive "file=$img,if=virtio,snapshot=on" \
    -nic "user,hostfwd=tcp:127.0.0.1:$ssh_p-:22,hostfwd=tcp:127.0.0.1:$gd_p-:6000" \
    -vga std -vnc "127.0.0.1:$((vnc_p - 5900))" -serial "file:$d/guest-serial.log" \
    -daemonize -pidfile "$d/qemu.pid" >"$d/qemu.log" 2>&1 \
    || refuse GUEST_BOOT_FAILED "qemu did not start: $(tail -3 "$d/qemu.log" | tr '\n' ' ')"
  local qpid; qpid="$(cat "$d/qemu.pid")"
  # SIGNAL-SAFE: an interrupt or a kill while waiting for the guest must not leave a running
  # VM and a record behind (measured: a 60s timeout did exactly that). The trap tears the VM
  # down and clears the record unless the guest finished coming up.
  UP_DONE=0
  guest_abort() { [ "${UP_DONE:-1}" = 0 ] && { kill_group "$qpid" 2>/dev/null; rec_clear "$id"; }; }
  trap guest_abort EXIT; trap 'exit 130' INT TERM
  rec_set "$id" comp_pid "$qpid" comp_tok "$(pid_token "$qpid")" adapter guest runtime guest \
          guest_ssh "$ssh_p" vnc_port "$vnc_p" guest_display "$gd_p" up_at "$(date -Is)"

  # the guest must ANSWER, not merely have a process
  local ssh; ssh="$(guest_ssh "$id")"
  for i in $(seq 1 90); do
    $ssh true 2>/dev/null && break
    pid_alive "$qpid" || { rec_clear "$id"; refuse GUEST_BOOT_FAILED "qemu exited — serial tail: $(tail -3 "$d/guest-serial.log" | tr '\n' ' ')"; }
    sleep 2
  done
  $ssh true 2>/dev/null || { kill_group "$qpid"; rec_clear "$id"; refuse GUEST_BOOT_FAILED "sshd never answered on :$ssh_p within 180s — serial tail: $(tail -3 "$d/guest-serial.log" | tr '\n' ' ')"; }
  $ssh "bash /opt/computer-use/test/../guest/rootfs/assert.sh" >"$d/assert.out" 2>&1 \
    || { kill_group "$qpid"; rec_clear "$id"; refuse GUEST_IMAGE_INCOMPLETE "the guest is missing binaries: $(head -3 "$d/assert.out" | tr '\n' ' ')"; }

  # the guest self-hosts the computer: THE SAME CLI, run inside it
  $ssh "/opt/computer-use/computer shell up --id $id" || { kill_group "$qpid"; rec_clear "$id"; refuse GUEST_BOOT_FAILED "the tool inside the guest refused 'shell up'"; }
  UP_DONE=1
}

op_forward() {   # run an action inside the guest that owns --id
  local id="" a prev=""
  for a in "$@"; do [ "$prev" = "--id" ] && id="$a"; prev="$a"; done
  [ -n "$id" ] || refuse MISSING_ID "forwarded actions must carry --id"
  [ "$(rec_get "$id" adapter 2>/dev/null || true)" = guest ] || refuse NOT_UP "instance $id is not a guest instance"
  local ssh; ssh="$(guest_ssh "$id")"
  $ssh "/opt/computer-use/computer $(printf '%q ' "$@")"
}

op_agentos() {
  refuse AGENTOS_UNAVAILABLE "the agentOS runtime (a WASM Linux on a Worker) is blueprint section 16B, Phase Two, and is not built in this version. Run on a Linux host, or on a non-Linux host with QEMU and CU_GUEST_IMAGE."
}

case "${1:-}" in
  guest)   op_guest "${2:?id}" ;;
  agentos) op_agentos ;;
  forward) shift; op_forward "$@" ;;
  *)       refuse BAD_VERB "boot.sh: unknown op '${1:-}' (guest|agentos|forward)" ;;
esac
