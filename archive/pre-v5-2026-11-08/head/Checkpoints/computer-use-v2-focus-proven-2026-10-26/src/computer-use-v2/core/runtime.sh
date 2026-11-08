#!/usr/bin/env bash
# runtime.sh - L1. Where planes L2-L5 execute (blueprint section 9).
# Sourced. Needs lib.sh.
#
#   runtime_select      print native | guest | agentos, or refuse NO_RUNTIME
#
# THE OPERATOR'S RULE, implemented literally: if the host IS Linux the runtime is native
# and the guest NEVER starts (anti-pattern A8). The guest and agentOS exist only for a
# host that is not Linux. There is no override that forces a guest onto a Linux host.

runtime_select() {
  if [ "$(uname -s)" = Linux ]; then printf 'native'; return 0; fi
  if command -v qemu-system-x86_64 >/dev/null 2>&1; then printf 'guest'; return 0; fi
  if [ -n "${CU_AGENTOS:-}" ]; then printf 'agentos'; return 0; fi
  refuse NO_RUNTIME "this host is $(uname -s), not Linux, and has neither QEMU nor agentOS - install QEMU (a Linux guest self-hosts the computer) or run on a Linux host"
}
