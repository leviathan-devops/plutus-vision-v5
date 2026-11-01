#!/usr/bin/env bash
# hardening.sh - the audit's fixes, as DURABLE probes (no display, no compositor, ~10s).
# Each section attacks the input the finding named, and where the old behaviour is reproducible it
# also runs a CONTROL that must read "defective" so the instrument is known to be able to say so.
#
#   H-CLAIM   pb_claim: a recycled pid is not "ours"; a real service is; a probe failure fails CLOSED
#   H-ID      ids are canonical decimals wherever a path is built
#   H-SCOPE   the browser-profile delete refuses a symlinked root/parent and spares the victim
#   H-ROW     the status assertion matches a FIELD exactly (1D !~ 21D, empty never matches)
#   H-ARGS    pair/timeframe/date/step/speed/dx reach the page only after validation
#   H-PIXELS  the chart-pane floor separates a drawn chart from a blank one; a dead instrument is rc=2
#   H-INJECT  nested/string braces, tokens, UTF-8, the CLI's named refusals
#   H-MCP     hostile frames are answered and the server lives; a bad timeout is a startup failure
#   H-DRIVE   `drive` is allowlisted and --id/--action are exact
# Exit: 0 all hold, 1 a check failed.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PB="$(cd "$HERE/.." && pwd)"; PV="$(cd "$PB/../.." && pwd)"
CUE="${CU_EXT:-$HOME/.omp/agent/extensions/computer-use-v2}"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }
W="$(mktemp -d /tmp/pb-hard.XXXXXX)"; PIDS=""
cleanup() { for p in $PIDS; do kill "$p" 2>/dev/null; done; rm -rf "$W"; rm -rf "$PB/__pycache__"; }
trap cleanup EXIT INT TERM
inpb() { bash -c "cd '$PB'; source '$CUE/core/lib.sh'; source ./ports.sh; $*" 2>&1; }
loadcli() { bash -c "cd '$PB'; PINEBOX_ROOT='$W/root' source ./pinebox ports >/dev/null 2>&1; $*" 2>&1; }

echo "── H-CLAIM ──"
RP="$(inpb 'pb_port 7 room')"
PYL="import socket,time;s=socket.socket();s.setsockopt(1,2,1);s.bind(('127.0.0.1',$RP));s.listen();time.sleep(25)"
claim() { # $1 own-pid  $2 ports.sh  ; port_owner is overridden because `ss -p` shows no pids in some sandboxes
  FAKE="$FAKE" bash -c "cd '$PB'; source '$CUE/core/lib.sh'; source '$2'; port_owner() { [ \"\$1\" = '$RP' ] && echo \"\$FAKE\"; }; PB_ROOT='$W/claim'; mkdir -p \$PB_ROOT; pb_claim 7 '$1'; echo claim_rc=\$?" 2>&1 | tail -1; }
python3 -c "$PYL" >/dev/null 2>&1 & P=$!; PIDS="$PIDS $P"; sleep 0.8
FAKE=$P; r="$(claim "$P" ./ports.sh)"; case "$r" in *PORT_TAKEN*) ok "a recycled pid (unrelated python) on the own-list is PORT_TAKEN";; *) bad "recycled pid accepted" "$r";; esac
# The CONTROL is the ports.sh from BEFORE the fix, pinned to a commit (579312c): `HEAD:` was the pre-fix file only until the
# fix was committed, after which the control branch was skipped without a word - a control that disappears is a gate that
# cannot fail. An unreadable ref, or a "pre-fix" file that already has the fix, is now a FAIL, never a skip.
PRE_FIX_REF=579312c
if git -C "$PV" show "$PRE_FIX_REF:scripts/pinebox/ports.sh" > "$W/ports-prefix.sh" 2>/dev/null && ! grep -q 'pb_pid_is_ours' "$W/ports-prefix.sh"; then
  r="$(claim "$P" "$W/ports-prefix.sh")"; case "$r" in *claim_rc=0*) ok "CONTROL: the pre-fix ports.sh ($PRE_FIX_REF) ACCEPTS that pid (the instrument can say defective)";; *) bad "control: old ports.sh did not accept" "$r";; esac
else
  bad "control unavailable" "cannot read a pre-fix ports.sh at $PRE_FIX_REF (git history rewritten, or the ref already contains pb_pid_is_ours)"
fi
kill "$P" 2>/dev/null; wait "$P" 2>/dev/null
bash -c "exec -a pv-server.py python3 -c \"$PYL\"" >/dev/null 2>&1 & P=$!; PIDS="$PIDS $P"; sleep 0.8
FAKE=$P; r="$(claim "$P" ./ports.sh)"; case "$r" in *claim_rc=0*) ok "a real service (argv0 pv-server.py) on the own-list claims";; *) bad "real service refused" "$r";; esac
r="$(claim "" ./ports.sh)"; case "$r" in *PORT_TAKEN*) ok "the same service NOT on the own-list is PORT_TAKEN";; *) bad "foreign holder accepted" "$r";; esac
kill "$P" 2>/dev/null; wait "$P" 2>/dev/null
mkdir -p "$W/ssfail"; printf '#!/bin/sh\necho "ss: simulated failure" >&2\nexit 2\n' > "$W/ssfail/ss"; chmod +x "$W/ssfail/ss"
r="$(PATH="$W/ssfail:$PATH" inpb "PB_ROOT='$W/claim'; mkdir -p \$PB_ROOT; pb_claim 7; echo claim_rc=\$?" | tail -1)"; case "$r" in *PORT_PROBE_FAILED*) ok "a failing ss FAILS CLOSED (PORT_PROBE_FAILED), never 'free'";; *) bad "probe failure read as free" "$r";; esac
r="$(inpb "PB_ROOT='$W/claim'; pb_claim 8; echo claim_rc=\$?" | tail -1)"; case "$r" in *claim_rc=0*) ok "all ports free -> claim succeeds (the refusals are not blanket)";; *) bad "free claim refused" "$r";; esac

echo; echo "── H-ID ──"
for i in 08 09 010 10 -1 x "" "../x" "1;2"; do r="$(inpb "pb_ports_json '$i'" | head -1)"; case "$r" in *BAD_ID*) ;; *) bad "id '$i' accepted by pb_ports_json" "$r"; continue;; esac; done; ok "pb_ports_json refuses 08 09 010 10 -1 x '' ../x 1;2"
for i in 08 "../x" ""; do r="$(inpb "PB_ROOT='$W/claim'; pb_claim '$i'; echo ACCEPTED" | head -1)"; case "$r" in *BAD_ID*) ;; *) bad "pb_claim accepted id '$i'" "$r";; esac; done; ok "pb_claim refuses 08 ../x '' before it names a lock file"
r="$(loadcli "pb_rec 'x/../../y' '.a=1'; echo ACCEPTED" | head -1)"; case "$r" in *BAD_ID*) ok "pb_rec refuses a traversal id (it would have written /state.json)";; *) bad "pb_rec accepted a traversal id" "$r";; esac
r="$(env -u PINEBOX_ROOT -u XDG_RUNTIME_DIR bash -c "cd '$PB'; ./pinebox ports --id 1" 2>&1 | head -1)"; case "$r" in *PB_ROOT_UNAVAILABLE*) ok "no PINEBOX_ROOT and no XDG_RUNTIME_DIR -> PB_ROOT_UNAVAILABLE (no /tmp default)";; *) bad "a /tmp default still exists" "$r";; esac
r="$(env -u PINEBOX_ROOT bash -c "cd '$PB'; source ./pinebox ports >/dev/null 2>&1; echo \"\$PB_ROOT \$(stat -c %a \"\$PB_ROOT\")\"")"; case "$r" in "$XDG_RUNTIME_DIR/pinebox 700") ok "the default root is \$XDG_RUNTIME_DIR/pinebox, mode 700";; *) bad "default root" "$r";; esac

echo; echo "── H-SCOPE ──"
mkdir -p "$W/victim/i3/chrome"; touch "$W/victim/i3/chrome/PRECIOUS"; mkdir -p "$W/sym"; ln -s "$W/victim" "$W/sym/root"
r="$(loadcli "PB_ROOT='$W/sym/root'; stage_page 3 '$W/sym/root/i3'" | head -1)"; case "$r" in *SCOPE_VIOLATION*) ok "a SYMLINKED root is refused SCOPE_VIOLATION";; *) bad "symlinked root not refused" "$r";; esac
[ -e "$W/victim/i3/chrome/PRECIOUS" ] && ok "...and the victim file SURVIVED" || bad "the victim file was DELETED" ""
mkdir -p "$W/victim2/real/i3/chrome"; touch "$W/victim2/real/i3/chrome/PRECIOUS"; ln -s "$W/victim2" "$W/sym/up"
r="$(loadcli "PB_ROOT='$W/sym/up/real'; stage_page 3 '$W/sym/up/real/i3'" | head -1)"; case "$r" in *SCOPE_VIOLATION*) [ -e "$W/victim2/real/i3/chrome/PRECIOUS" ] && ok "a symlinked PARENT of the root is refused and the victim survives" || bad "parent symlink: victim deleted" "";; *) bad "symlinked parent not refused" "$r";; esac

echo; echo "── H-ROW / H-ARGS ──"
t() { loadcli "pb_row_has_field '$1' '$2' && echo match || echo no" | tail -1; }
[ "$(t 'FIXTURE · BTC · 21D · 5 bars' 1D)" = no ]    && ok "'1D' does not match inside '21D'"        || bad "substring match on 1D/21D" ""
[ "$(t 'FIXTURE · BTCX · 1H · 5 bars' BTC)" = no ]   && ok "'BTC' does not match inside 'BTCX'"       || bad "substring match on BTC/BTCX" ""
[ "$(t 'FIXTURE · DXY · 1H' '')" = no ]               && ok "an EMPTY field never matches (no vacuous '**')" || bad "empty field matched" ""
[ "$(t 'FIXTURE · DXY · 1H · 508 bars' DXY)" = match ] && [ "$(t 'FIXTURE · EUR/USD · 1H · 5' EUR/USD)" = match ] && ok "real rows still match (DXY, EUR/USD)" || bad "legit row refused" ""
for pt in "DXY;rm|1H" "|1H" "DXY|" "DXY|1;H" "A|1H"; do p="${pt%%|*}"; tf="${pt#*|}"; r="$(loadcli "pb_check_pair_tf '$p' '$tf'; echo ACCEPTED" | head -1)"; case "$r" in *BAD_ARGS*) ;; *) bad "pair/tf '$p'/'$tf' accepted" "$r";; esac; done; ok "pair/tf: shell metacharacters, empties and a 1-char pair are BAD_ARGS"
r="$(loadcli "pb_check_pair_tf EUR/USD 15m && pb_check_pair_tf DXY 1H && echo ok")"; [ "$r" = ok ] && ok "legitimate pair/tf (EUR/USD 15m, DXY 1H) pass" || bad "legit pair/tf refused" "$r"
r="$(loadcli "pb_v3_num dx '1));evil();//' -1000 1000; echo ACCEPTED" | head -1)"; case "$r" in *BAD_ARGS*) ok "dx='1));evil();//' is BAD_ARGS";; *) bad "dx injection accepted" "$r";; esac
r="$(loadcli "pb_v3_num speed 0 1 60000; echo ACCEPTED" | head -1)"; case "$r" in *BAD_ARGS*) ok "speed 0 (a spin loop) is BAD_ARGS";; *) bad "speed 0 accepted" "$r";; esac
r="$(loadcli "pb_v3_ident name '\"]));evil();//'; echo ACCEPTED" | head -1)"; case "$r" in *BAD_ARGS*) ok "a widget name with quote/bracket/paren is BAD_ARGS";; *) bad "widget name injection accepted" "$r";; esac

echo; echo "── H-PIXELS ──"
python3 - "$W" <<'PYEOF' || bad "could not build the synthetic frames" "PIL missing?"
import sys
from PIL import Image, ImageDraw
import random
w = sys.argv[1]; W, H = 1626, 875
im = Image.new("RGB", (W, H), (12, 12, 16)); d = ImageDraw.Draw(im); random.seed(7)
for x in range(0, W, 3):                        # chrome everywhere (editor, tabs, footer): thousands of colours
    d.line([(x, 0), (x, H)], fill=(random.randrange(256), random.randrange(256), random.randrange(256)))
im.save(w + "/blank-chart.png")                 # chrome noisy, chart pane flat
d.rectangle((int(W*0.35), 70, W-6, int(H*0.78)), fill=(19, 20, 24)); im.save(w + "/blank-chart.png")
im2 = Image.open(w + "/blank-chart.png").copy(); d2 = ImageDraw.Draw(im2)
for i in range(4000):                           # a populated pane: many antialiased shades
    x = random.randrange(int(W*0.36), W-8); y = random.randrange(72, int(H*0.77)); d2.point((x, y), fill=(random.randrange(256), random.randrange(256), random.randrange(256)))
im2.save(w + "/drawn-chart.png")
PYEOF
n_blank="$(python3 "$PB/chartpx.py" colours "$W/blank-chart.png")"; n_drawn="$(python3 "$PB/chartpx.py" colours "$W/drawn-chart.png")"; floor="$(python3 -c "import sys; sys.path.insert(0,'$PB'); import chartpx; print(chartpx.BLANK_THRESHOLD)")"
whole="$(python3 -c "from PIL import Image; print(len(Image.open('$W/blank-chart.png').convert('RGB').getcolors(10**7)))")"
[ "$n_blank" -lt "$floor" ] && [ "$n_drawn" -ge "$floor" ] && ok "pane colours: blank=$n_blank < floor $floor <= drawn=$n_drawn" || bad "the floor does not separate" "blank=$n_blank drawn=$n_drawn floor=$floor"
[ "$whole" -gt 1 ] && ok "CONTROL: the blank chart's WHOLE-frame count is $whole (> 1), so the old check would have said WORKS" || bad "control: whole-frame count" "$whole"
python3 "$PB/chartpx.py" changed "$W/blank-chart.png" "$W/blank-chart.png"; [ $? -eq 1 ] && ok "the same file is 'unchanged' (rc 1)" || bad "same file not rc 1" ""
python3 "$PB/chartpx.py" changed "$W/blank-chart.png" "$W/drawn-chart.png"; [ $? -eq 0 ] && ok "a drawn vs blank pane is 'changed' (rc 0)" || bad "changed not rc 0" ""
python3 "$PB/chartpx.py" colours "$W/does-not-exist.png" >/dev/null 2>&1; [ $? -eq 2 ] && ok "an unreadable PNG is the INSTRUMENT failing (rc 2), never 'unchanged'" || bad "instrument failure not rc 2" ""

echo; echo "── H-INJECT ──"
PORTS='{"station":9941,"rail":9954,"server":10051,"cdp":9422,"ws":10131,"vnc":5902,"room":9643,"authToken":"a1b2c3d4e5f60718"}'
printf '<script>\n window.dashboardConfig = { apiBase: %s, opts: { retry: { n: 3 } }, note: %s, pineStation: %s };\n</script><p id="after">tail</p>' "'http://127.0.0.1:1111'" "'a } inside a string'" "'http://127.0.0.1:2222'" > "$W/nested.html"
out="$(python3 "$PB/inject.py" --render "$W/nested.html" "$PORTS" 2>&1)"; case "$out" in *"inside a string"*|*retry*) bad "nested/string braces left junk" "$(printf '%s' "$out" | head -c 120)";; *'<p id="after">tail</p>'*) ok "a nested object and a '}' in a string: the block is replaced WHOLE";; *) bad "tail lost" "$out";; esac
r="$(python3 "$PB/inject.py" --render "$W/nested.html" "$(jq -c 'del(.authToken)' <<<"$PORTS")" 2>&1 >/dev/null | head -1)"; case "$r" in *AUTH_TOKEN_UNAVAILABLE*) ok "no authToken -> AUTH_TOKEN_UNAVAILABLE";; *) bad "tokenless accepted" "$r";; esac
r="$(python3 "$PB/inject.py" --render "$PV/pine-ide/ide/renderer/pine.html" "$PORTS" 2>&1)"; case "$r" in *rw_dev_plutus_backtest*) bad "the shared dev token is still served" "";; *a1b2c3d4e5f60718*) ok "the real page is served with the instance's token and without the shared dev token";; *) bad "token not injected" "";; esac
printf '<script>window.dashboardConfig = {a:1};</script>\xff\xfe' > "$W/utf8.html"; r="$(python3 "$PB/inject.py" --render "$W/utf8.html" "$PORTS" 2>&1 | head -1)"; case "$r" in *PAGE_NOT_UTF8*) ok "invalid UTF-8 -> PAGE_NOT_UTF8 (no lossy re-encode)";; *) bad "invalid UTF-8 accepted" "$r";; esac
r="$(python3 "$PB/inject.py" --check /nonexistent 2>&1 | head -1)"; case "$r" in *CLI_INPUT_UNREADABLE*) ok "a missing file is a NAMED refusal, not a traceback";; *) bad "traceback or wrong token" "$r";; esac
printf '<script>window.dashboardConfig = { apiBase: %s</script>' "'x'" > "$W/unterminated.html"; r="$(python3 "$PB/inject.py" --render "$W/unterminated.html" "$PORTS" 2>&1 | head -1)"; case "$r" in *CONFIG_BLOCK_MALFORMED*) ok "an unterminated block -> CONFIG_BLOCK_MALFORMED";; *) bad "unterminated block" "$r";; esac
cat "$W/nested.html" "$W/nested.html" > "$W/twice.html"; r="$(python3 "$PB/inject.py" --render "$W/twice.html" "$PORTS" 2>&1 | head -1)"; case "$r" in *CONFIG_BLOCK_AMBIGUOUS*) ok "a page defining the block twice -> CONFIG_BLOCK_AMBIGUOUS";; *) bad "double block" "$r";; esac

echo; echo "── H-MCP ──"
for v in foo "" -5 0 99 3600001 1e999; do PINEBOX_MCP_TIMEOUT_MS="$v" timeout 5 node "$PB/mcp/server.mjs" </dev/null >/dev/null 2>&1; [ $? -eq 2 ] || bad "timeout '$v' did not fail startup (rc 2)" ""; done; ok "PINEBOX_MCP_TIMEOUT_MS foo '' -5 0 99 3600001 1e999 -> startup failure rc=2"
r="$(python3 - "$PB" <<'PYEOF'
import subprocess, json, sys
p = subprocess.Popen(['node', sys.argv[1] + '/mcp/server.mjs'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
frames = ['null', '5', '"x"', '[1]', 'true', '{"x":"' + 'A' * (3 * (1 << 20)) + '"}', '{"jsonrpc":"2.0","id":7,"method":"ping"}', '{"jsonrpc":"2.0","id":8,"method":"tools/list"}']
out, _ = p.communicate("\n".join(frames) + "\n", timeout=30)
m = [json.loads(l) for l in out.splitlines() if l.strip()]
inv = sum(1 for x in m if (x.get('error') or {}).get('code') == -32600); big = sum(1 for x in m if 'exceeds' in ((x.get('error') or {}).get('message') or ''))
print(inv, big, any(x.get('id') == 7 and 'result' in x for x in m), any(x.get('id') == 8 and 'result' in x for x in m), p.returncode, len(m))
PYEOF
)"
[ "$r" = "5 1 True True 0 8" ] && ok "5 non-object frames -> 5 errors; a 3 MiB line -> exactly ONE error; ping and tools/list still answered; server exit 0" || bad "hostile MCP frames" "got '$r' want '5 1 True True 0 8'"

echo; echo "── H-DRIVE ──"
mkdir -p "$W/root/i3"; echo '{}' > "$W/root/i3/state.json"
for a in view shell_down shell_up terminal_send state_put app_install bogus; do r="$(PINEBOX_ROOT="$W/root" "$PB/pinebox" drive --id 3 --action "$a" 2>&1 | head -1)"; case "$r" in *BAD_ARGS*) ;; *) bad "drive --action $a was NOT refused" "$r";; esac; done; ok "drive refuses view shell_down shell_up terminal_send state_put app_install bogus"
for args in "--id=3 --action screenshot" "--id 3 --action=screenshot" "--id 3 --id 4 --action screenshot" "--id 3 --action screenshot --action view"; do r="$(PINEBOX_ROOT="$W/root" "$PB/pinebox" drive $args 2>&1 | head -1)"; case "$r" in *BAD_ARGS*) ;; *) bad "drive '$args' not refused" "$r";; esac; done; ok "drive refuses --id=N, --action=V and repeated --id/--action"

echo; printf ' HARDENING: PASS %d · FAIL %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
