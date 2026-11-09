#!/usr/bin/env bash
# pv-verify-room.sh - verdict on "the E1 render is live on the golden week".
# Instrument (corrected 2026-11-09): the room draws tables/labels on the CHART CANVAS, not the DOM -
# a DOM/text check is the wrong substrate (it refused a rendered table: false E1_RENDER_ABSENT).
# The instrument now: (1) the room session must be the golden-week EUR/USD session (DOM header),
# (2) the captured PNG must contain the E1 zone-band pixels (equilibrium/resistance-light orange
#     rgb(255,152,0)-family, >= 300 samples in the chart area). Absent -> named refusal, exit 1.
set -u
TOK=$(cat ~/.plutus-browser/token)
EV(){ curl -sS -m 30 -H "Authorization: Bearer $TOK" --get --data-urlencode "js=$1" http://127.0.0.1:30013/eval || { echo "ROOM_EVAL_UNREACHABLE: /eval did not answer - check the plutus-browser server on :30013" >&2; exit 1; }; }
J(){ python3 -c "import sys,json;print(json.load(sys.stdin)['data'])"; }

SESSION=$(EV "(()=>{const h=[...document.querySelectorAll('div,span')].find(e=>/REPLAY-/.test(e.textContent)&&/ROOM/.test(e.textContent)&&e.textContent.length<60);return h?h.textContent.trim():'HEADER_NOT_FOUND';})()" | J)
case "$SESSION" in
  *EUR/USD*|*EURUSD*) : ;;
  *) echo "ROOM_SESSION_NOT_GOLDEN: attached header is '$SESSION' - attach backtest EUR/USD 1H (cursor Jul 10 2026) via the room's session row" >&2; exit 1 ;;
esac

PNG=${1:-}
if [ -z "$PNG" ]; then
  PNG=/tmp/pv-verify-fresh.png
  curl -sS -m 30 -X POST -H "Authorization: Bearer $TOK" http://127.0.0.1:30013/capture -o /tmp/pv-verify-cap.json || { echo "ROOM_CAPTURE_FAILED: /capture did not respond - check the plutus-browser server on :30013" >&2; exit 1; }
  python3 - "$PNG" <<'PY'
import json, base64, sys, pathlib
d = json.load(open('/tmp/pv-verify-cap.json'))['data']
pathlib.Path(sys.argv[1]).write_bytes(base64.b64decode(d['png_base64']))
PY
fi
[ -f "$PNG" ] || { echo "CAPTURE_ABSENT: no PNG at $PNG - run without an argument to capture fresh" >&2; exit 1; }

ORANGE=$(python3 - "$PNG" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); px = im.load(); w, h = im.size
n = 0
for x in range(315, min(w, 1310), 3):
    for y in range(140, min(h, 680), 2):
        r, g, b = px[x, y]
        if r > 130 and 60 < g < 170 and b < 90 and r > g:
            n += 1
print(n)
PY
)
if [ "$ORANGE" -lt 300 ]; then
  echo "E1_ZONE_BANDS_ABSENT: session=$SESSION but $PNG has only $ORANGE zone-band pixels (<300) - the E1 render is not on the chart; re-import Plutus Vision v1 (Indicators -> My Scripts) and re-run" >&2
  exit 1
fi
echo "E1_RENDER_VERIFIED session=$SESSION png=$PNG zone_band_pixels=$ORANGE"
