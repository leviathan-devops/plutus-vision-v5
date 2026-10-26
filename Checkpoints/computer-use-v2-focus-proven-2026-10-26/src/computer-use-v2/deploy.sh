#!/usr/bin/env bash
# deploy.sh - install and VERIFY the computer-use v2 + pinebox tools on this host.
#
#   deploy.sh seal       write MANIFEST.sha256 (the sha of every source file of this tool and of
#                        the pinebox extension and CLI); commit it with the change it describes
#   deploy.sh install    build the helpers, link `computer` onto PATH, register the two MCP
#                        servers in ~/.omp/agent/mcp.json (those two KEYS only), then verify
#   deploy.sh verify     prove the host runs what was sealed. Prints DEPLOY: OK or refuses by name
#
# WHAT "DEPLOYED" MEANS HERE: this tool has no build step - the host runs the source in place - so
# the artifact IS the installed tree plus the two compiled helpers. A deploy is proven by (1) every
# source file hashing to the sealed manifest, (2) each compiled helper being the one built from the
# CURRENT source (its sha is in its file name) and carrying the symbols this change added, (3) the
# registered MCP commands answering tools/list, (4) `computer probe` selecting the native runtime.
# A claim that any of these holds without this script's output is not a deploy.
#
# REFUSALS (stderr, exit 1):  DEPLOY_DRIFT · HELPER_STALE · HELPER_SYMBOL_ABSENT · MCP_NOT_REGISTERED
#   MCP_NO_ANSWER · PROBE_FAILED · SEAL_INCOMPLETE · TOOL_ABSENT
#
# Secrets: this script writes ONLY the keys .mcpServers["computer-use"] and .mcpServers.pinebox of
# mcp.json and never reads or prints any other key (that file holds other servers' bearer tokens).

set -uo pipefail
HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PB_EXT="${PB_EXT:-$(dirname "$HERE")/pinebox}"
PB_CLI="${PB_CLI:-$HOME/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/scripts/pinebox}"
MCP_JSON="${MCP_JSON:-$HOME/.omp/agent/mcp.json}"
LIBDIR="${CU_LIB_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/computer-use/lib}"
MANIFEST="$HERE/MANIFEST.sha256"
NODE_PATH_ENV="/home/leviathan/.local/bin:/usr/local/bin:/usr/bin:/bin:/home/leviathan/.bun/bin:/home/leviathan/.brv-cli/bin"

die() { printf 'REFUSED  %s  —  %s\n' "$1" "$2" >&2; exit 1; }

# the files whose bytes ARE the deployed tool, as absolute paths
source_files() {
  find "$HERE" -type f -not -name MANIFEST.sha256 -not -path '*/node_modules/*' -not -name '*.pyc' | sort
  [ -d "$PB_EXT" ] && find "$PB_EXT" -type f | sort
  [ -d "$PB_CLI" ] && find "$PB_CLI" -type f -not -name '*.pyc' -not -path '*/__pycache__/*' | sort
}

op_seal() {
  [ -d "$HERE/core" ] || die TOOL_ABSENT "no core/ under $HERE"
  [ -d "$PB_CLI" ]    || die SEAL_INCOMPLETE "the pinebox CLI is absent at $PB_CLI - sealing without it would attest half a deploy"
  [ -d "$PB_EXT" ]    || die SEAL_INCOMPLETE "the pinebox extension is absent at $PB_EXT"
  source_files | xargs -d '\n' sha256sum | sed "s#$HOME#~#" > "$MANIFEST"
  printf 'sealed %s files -> %s\n' "$(wc -l < "$MANIFEST")" "$MANIFEST"
}

op_helpers() { "$HERE/helpers/build.sh" >/dev/null || die HELPER_STALE "helpers/build.sh failed"; }

op_register() {
  [ -f "$MCP_JSON" ] || die MCP_NOT_REGISTERED "$MCP_JSON does not exist"
  local tmp; tmp="$(mktemp)"
  jq --arg cu "$HERE/mcp/server.mjs" --arg pb "$PB_CLI/mcp/server.mjs" --arg path "$NODE_PATH_ENV" \
     '.mcpServers["computer-use"] = {command:"node", args:[$cu], env:{PATH:$path}}
      | .mcpServers.pinebox       = {command:"node", args:[$pb], env:{PATH:$path}}' "$MCP_JSON" > "$tmp" \
    && jq -e . "$tmp" >/dev/null && cat "$tmp" > "$MCP_JSON" || { rm -f "$tmp"; die MCP_NOT_REGISTERED "could not write the two keys into $MCP_JSON"; }
  rm -f "$tmp"
}

op_link() { mkdir -p "$HOME/.local/bin" && ln -sf "$HERE/computer" "$HOME/.local/bin/computer"; }

op_install() { op_helpers; op_link; op_register; op_verify; }

op_verify() {
  [ -f "$MANIFEST" ] || die SEAL_INCOMPLETE "no $MANIFEST - run: deploy.sh seal"
  local bad
  # (1) every sealed file hashes to what was sealed, and no unsealed file sits in the tree
  bad="$(sed "s#^\\(.\\{64\\}\\)  ~#\\1  $HOME#" "$MANIFEST" | sha256sum -c --quiet 2>&1 | head -5)"
  [ -z "$bad" ] || die DEPLOY_DRIFT "$(printf '%s' "$bad" | tr '\n' ' ')"
  local extra; extra="$(source_files | sed "s#$HOME#~#" | grep -vxFf <(awk '{print $2}' "$MANIFEST") | head -5)"
  [ -z "$extra" ] || die DEPLOY_DRIFT "files exist that the seal does not list: $(printf '%s' "$extra" | tr '\n' ' ')"

  # (2) the compiled helpers are the ones built from THIS source, and carry the symbols
  local sha_nf sha_hw
  sha_nf="$(sha256sum "$HERE/helpers/nofocus.c" | cut -c1-12)"; sha_hw="$(sha256sum "$HERE/helpers/hostwin.c" | cut -c1-12)"
  [ "$(readlink -f "$LIBDIR/nofocus.so" 2>/dev/null)" = "$LIBDIR/nofocus-$sha_nf.so" ] \
    || die HELPER_STALE "nofocus.so is not the build of the current nofocus.c ($sha_nf) - run: deploy.sh install"
  [ "$(readlink -f "$LIBDIR/hostwin" 2>/dev/null)" = "$LIBDIR/hostwin-$sha_hw" ] \
    || die HELPER_STALE "hostwin is not the build of the current hostwin.c ($sha_hw) - run: deploy.sh install"
  local sym
  for sym in NOFOCUS_BELOW _NET_WM_USER_TIME; do strings "$LIBDIR/nofocus.so" | grep -q "$sym" || die HELPER_SYMBOL_ABSENT "$sym is not in nofocus.so"; done
  for sym in _NET_RESTACK_WINDOW release; do strings "$LIBDIR/hostwin" | grep -q "$sym" || die HELPER_SYMBOL_ABSENT "$sym is not in hostwin"; done

  # (3) both MCP servers are registered at THIS tree and answer tools/list
  local name cmd arg want
  for name in computer-use pinebox; do
    cmd="$(jq -r --arg n "$name" '.mcpServers[$n].command // empty' "$MCP_JSON")"; arg="$(jq -r --arg n "$name" '.mcpServers[$n].args[0] // empty' "$MCP_JSON")"
    want="$HERE/mcp/server.mjs"; [ "$name" = pinebox ] && want="$PB_CLI/mcp/server.mjs"
    [ "$arg" = "$want" ] || die MCP_NOT_REGISTERED "$name -> '${arg:-<absent>}', expected $want - run: deploy.sh install"
    printf '%s\n%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
      | timeout 15 "$cmd" "$arg" 2>/dev/null | jq -e 'select(.id==2) | .result.tools | length > 0' >/dev/null \
      || die MCP_NO_ANSWER "$name ($cmd $arg) did not answer tools/list"
  done

  # (4) the CLI on PATH is this tree's, and the probe selects the native runtime
  [ "$(readlink -f "$HOME/.local/bin/computer" 2>/dev/null)" = "$HERE/computer" ] || die TOOL_ABSENT "~/.local/bin/computer does not point at $HERE/computer"
  "$HERE/computer" probe 2>/dev/null | jq -e '.selected.runtime=="native" and (.selected.surface != null)' >/dev/null \
    || die PROBE_FAILED "computer probe did not select runtime=native with a surface"
  printf 'DEPLOY: OK  sealed=%s files  nofocus=%s  hostwin=%s  mcp=2/2 answer  probe=native/%s\n' \
    "$(wc -l < "$MANIFEST")" "$sha_nf" "$sha_hw" "$("$HERE/computer" probe 2>/dev/null | jq -r .selected.surface)"
}

case "${1:-}" in
  seal)    op_seal ;;
  install) op_install ;;
  verify)  op_verify ;;
  *) die BAD_VERB "usage: deploy.sh seal | install | verify" ;;
esac
