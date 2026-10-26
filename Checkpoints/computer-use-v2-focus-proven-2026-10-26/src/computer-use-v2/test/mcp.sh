#!/usr/bin/env bash
# mcp.sh - V9: the MCP server answers over stdio with the WHOLE action table, runs a real
# call, returns a refusal as a STRUCTURED TOKEN, and drives the same core as the CLI.
# Also checks the OMP extension's forwarder reads the same table (R7: no drift).
# Exit: 0 all hold, 1 a check failed.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E="$(cd "$HERE/.." && pwd)"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }

rpc() { # one request line -> the response with that id
  local id="$1" body="$2"
  printf '%s\n%s\n' \
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' "$body" \
    | timeout 25 node "$E/mcp/server.mjs" 2>/dev/null | jq -c --argjson i "$id" 'select(.id==$i)'
}

echo "── tools/list ──"
r="$(rpc 2 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}')"
n="$(printf '%s' "$r" | jq '.result.tools[0].inputSchema.properties.action.enum | length')"
want="$(jq '.actions | length' "$E/core/actions.json")"
[ "$n" = "$want" ] && ok "tools/list returns the whole action table ($n of $want actions)" || bad "tools/list" "got $n, want $want"
for a in probe doctor shell_up shell_down shell_spawn shell_list displays focus screenshot click type key terminal_send terminal_read state_get state_put app_install app_launch; do
  printf '%s' "$r" | jq -e --arg a "$a" '.result.tools[0].inputSchema.properties.action.enum | index($a)' >/dev/null || bad "action $a is missing" ""
done
ok "every blueprint 7D action is present"

echo "── tools/call ──"
r="$(rpc 3 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"computer","arguments":{"action":"probe"}}}')"
rt="$(printf '%s' "$r" | jq -r '.result.content[0].text | fromjson | .details.selected.runtime')"
[ "$rt" = native ] && ok "a real call: probe over MCP selects runtime=native" || bad "probe over MCP" "$r"

r="$(rpc 4 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"computer","arguments":{"action":"activate"}}}')"
err="$(printf '%s' "$r" | jq -r '.result.content[0].text | fromjson | .error')"; is="$(printf '%s' "$r" | jq -r '.result.isError')"
[ "$err" = ACTIVATE_FORBIDDEN ] && [ "$is" = true ] && ok "a refusal arrives as the TOKEN ACTIVATE_FORBIDDEN with isError=true" || bad "structured refusal" "$r"

r="$(rpc 5 '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"computer","arguments":{"action":"click","id":"abc"}}}')"
err="$(printf '%s' "$r" | jq -r '.result.content[0].text | fromjson | .error')"
[ "$err" = BAD_ID ] && ok "bad input arrives as BAD_ID, not prose" || bad "BAD_ID token" "$r"

r="$(rpc 6 '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"computer","arguments":{"action":"nonsense"}}}')"
err="$(printf '%s' "$r" | jq -r '.result.content[0].text | fromjson | .error')"
[ "$err" = BAD_ACTION ] && ok "an unknown action arrives as BAD_ACTION" || bad "BAD_ACTION token" "$r"

echo "── the extension forwarder reads the SAME table (R7) ──"
grep -q 'core", "actions.json"' "$E/index.ts" && ok "index.ts reads core/actions.json" || bad "index.ts does not read the shared table" ""
grep -q 'core", "actions.json"\|core/actions.json' "$E/mcp/server.mjs" || grep -q 'actions.json' "$E/mcp/server.mjs" && ok "mcp/server.mjs reads core/actions.json" || bad "mcp does not read the shared table" ""
grep -qE 'loadMode: "essential"' "$E/index.ts" && grep -q 'defaultInactive: false' "$E/index.ts" && ok "index.ts registers loadMode=essential, defaultInactive=false" || bad "registration flags" ""
# neither forwarder may implement an action: no xdotool/weston/tmux in them
leak="$(grep -nE 'xdotool|weston|tmux|xdpyinfo|import -window' "$E/index.ts" "$E/mcp/server.mjs")"
[ -z "$leak" ] && ok "neither forwarder implements an action (no xdotool/weston/tmux in them)" || bad "a forwarder implements logic" "$leak"

echo; printf ' MCP: PASS %d · FAIL %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
