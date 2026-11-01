#!/usr/bin/env bash
# mcp.sh - P12 / P11: the PINEBOX MCP server answers over stdio with the whole verb table, runs
# real calls, returns a refusal as a STRUCTURED TOKEN, and both forwarders read the same table.
# Exit: 0 every check held, 1 a check failed.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PB="$(cd "$HERE/.." && pwd)"
CUE="${CU_EXT:-$HOME/.omp/agent/extensions/computer-use-v2}"
EXT="$HOME/.omp/agent/extensions/pinebox/index.ts"
export PATH="$CUE:$PB:$PATH" PINEBOX_ROOT="/tmp/pinebox-mcp-$$" CU_STATE_ROOT="/tmp/cu-mcp-$$"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }
trap 'rm -rf "$PINEBOX_ROOT" "$CU_STATE_ROOT"' EXIT

rpc() { # id body -> the response with that id
  printf '%s\n%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' "$2" \
    | timeout 40 node "$PB/mcp/server.mjs" 2>/dev/null | jq -c --argjson i "$1" 'select(.id==$i)'
}
call() { rpc "$1" "{\"jsonrpc\":\"2.0\",\"id\":$1,\"method\":\"tools/call\",\"params\":{\"name\":\"pinebox\",\"arguments\":$2}}" | jq -c '.result.content[0].text | fromjson'; }

echo "── tools/list ──"
r="$(rpc 2 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}')"
n="$(jq '.result.tools[0].inputSchema.properties.verb.enum | length' <<<"$r")"; want="$(jq '.actions | length' "$PB/actions.json")"
[ "$n" = "$want" ] && ok "tools/list returns the whole verb table ($n of $want verbs)" || bad "tools/list" "got $n, want $want"
for v in ports up down list status shot load drive terminal state view; do
  jq -e --arg v "$v" '.result.tools[0].inputSchema.properties.verb.enum | index($v)' <<<"$r" >/dev/null || bad "verb $v is missing" ""
done; ok "every blueprint 7B verb is present"
jq -e '.result.tools[0].inputSchema.properties | has("drive_action")' <<<"$r" >/dev/null && ok "drive's own computer-use verb is exposed as drive_action (no clash with the verb)" || bad "drive_action" ""

echo "── tools/call ──"
c="$(call 3 '{"verb":"ports","id":"3"}')"
[ "$(jq -r '.details.ports.server' <<<"$c")" = "$(( $(pinebox ports --id 0 | jq -r .ports.server) + 300 ))" ] && ok "a real call: ports id=3 returns the derived block ($(jq -c '.details.ports' <<<"$c"))" || bad "ports over MCP" "$c"
c="$(call 4 '{"verb":"ports","id":"10"}')"
[ "$(jq -r .error <<<"$c")" = BAD_ID ] && [ "$(jq -r .ok <<<"$c")" = false ] && ok "an out-of-range id arrives as the TOKEN BAD_ID" || bad "BAD_ID token" "$c"
c="$(call 5 '{"verb":"down","id":"9"}')"
[ "$(jq -r .error <<<"$c")" = NOT_UP ] && ok "downing an instance that is not up arrives as the TOKEN NOT_UP" || bad "NOT_UP token" "$c"
c="$(call 6 '{"verb":"view","id":"9"}')"
[ "$(jq -r .error <<<"$c")" = NOT_UP ] && ok "view on a missing instance: NOT_UP, no window touched" || bad "view token" "$c"
c="$(call 7 '{"verb":"nonsense"}')"
# the server validates BEFORE it spawns: an unknown verb is BAD_ARGS (a bad request), never a CLI failure
[ "$(jq -r .error <<<"$c")" = BAD_ARGS ] && jq -e '.detail|test("unknown verb")' <<<"$c" >/dev/null && ok "an unknown verb arrives as BAD_ARGS (unknown verb)" || bad "BAD_ARGS token" "$c"

echo "── the two forwarders read the SAME table (R7) ──"
grep -q 'actions.json' "$PB/mcp/server.mjs" && grep -q 'actions.json' "$EXT" && ok "mcp/server.mjs and the extension both read actions.json" || bad "a forwarder does not read the table" ""
grep -qE 'loadMode: "essential"' "$EXT" && grep -q 'defaultInactive: false' "$EXT" && ok "the extension registers loadMode=essential, defaultInactive=false" || bad "registration flags" ""
leak="$(grep -nE 'xdotool|weston|tmux|xdpyinfo|import -window|chrome' "$PB/mcp/server.mjs" "$EXT" | grep -v 'description')"
[ -z "$leak" ] && ok "neither forwarder implements a verb" || bad "a forwarder implements logic" "$leak"

echo; printf ' MCP: PASS %d · FAIL %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
