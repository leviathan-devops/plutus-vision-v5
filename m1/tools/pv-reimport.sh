#!/usr/bin/env bash
# pv-reimport.sh - the ONE documented re-import flow (room Indicators -> My Scripts row).
# Every step refuses by name on failure; nothing is skipped, nothing falls through.
set -u
TOK=$(cat ~/.plutus-browser/token)
EV(){ curl -sS -m 30 -H "Authorization: Bearer $TOK" --get --data-urlencode "js=$1" http://127.0.0.1:30013/eval || { echo "ROOM_EVAL_UNREACHABLE: /eval did not answer - check the plutus-browser server on :30013" >&2; exit 1; }; }
J(){ python3 -c "import sys,json;print(json.load(sys.stdin)['data'])"; }

# step 1: the room must be on the golden-week session
S=$(EV "(()=>{const h=[...document.querySelectorAll('div,span')].find(e=>/REPLAY-/.test(e.textContent)&&/ROOM/.test(e.textContent)&&e.textContent.length<60);return h?h.textContent.trim():'HEADER_NOT_FOUND';})()" | J)
case "$S" in
  *EUR/USD*|*EURUSD*) : ;;
  *) echo "ROOM_SESSION_NOT_GOLDEN: attached header is '$S' - attach backtest EUR/USD 1H first" >&2; exit 1 ;;
esac

# step 2: open the room's Indicators control (refuse by name if it is not there)
B=$(EV "[...document.querySelectorAll('div,span,button')].find(e=>/^Indicators\$/.test(e.textContent.trim())&&e.getBoundingClientRect().width>30)?'FOUND':'NOT_FOUND'" | J)
if [ "$B" != "FOUND" ]; then
  echo "INDICATORS_CONTROL_NOT_FOUND: the room chart header has no Indicators control - the room page is not fully mounted; reload the instance page and re-run" >&2; exit 1
fi
EV "[...document.querySelectorAll('div,span,button')].find(e=>/^Indicators\$/.test(e.textContent.trim())&&e.getBoundingClientRect().width>30).click()" >/dev/null
sleep 2

# step 3: the My Scripts row for Plutus Vision v1 (refuse by name if it is not there)
R=$(EV "(()=>{const rows=[...document.querySelectorAll('div,li,button')].filter(e=>e.textContent.trim()==='Plutus Vision v1'&&e.className.toString().includes('vela-ip-row')&&e.getBoundingClientRect().y>100&&e.getBoundingClientRect().width>50);if(!rows.length)return 'NOT_FOUND';rows[0].click();return 'CLICKED';})()" | J)
if [ "$R" != "CLICKED" ]; then
  echo "MY_SCRIPTS_ROW_NOT_FOUND: the Indicators dialog has no visible Plutus Vision v1 row - the store import did not appear; PUT the script again, then re-run" >&2; exit 1
fi
echo "REIMPORT_CLICKED session=$S"
