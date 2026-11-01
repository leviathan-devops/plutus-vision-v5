#!/usr/bin/env bash
# verify.sh - "open it, run the indicator, LOOK at it, and tell me if it works" AS A PREDICATE.
#
# THE FAILURES THIS EXISTS TO MAKE IMPOSSIBLE (all named by the operator, all real):
#   the agent does not look at the display; it hallucinates that the render is fine
#   the agent cannot tell which WEEK is loaded, so an indicator is read on the wrong week
#   the rail (the "rooms") is down and the agent keeps narrating a working face
#   the page is silently talking to ANOTHER instance's ports
#   a blank/error frame is reported as a successful render
# Every check below REFUSES with its own token, so an agent cannot proceed on a false premise:
#   WEEK_MISMATCH · RAIL_DOWN · STATION_DOWN · PORTS_MISMATCH · NO_BARS · NO_DRAWINGS · FRAME_BLANK
#
# stage_week_set ID LABEL      drive the IDE's own week control (.pine-week) and verify it took
# stage_verify   ID DIR WEEK   run every check; print one JSON verdict; refuse on the first failure

pb_iso_week() {  # 2026-07-06 -> 2026-W28 (ISO-8601, computed, never guessed)
  python3 - "$1" <<'PY'
import sys, datetime
d = datetime.date.fromisoformat(sys.argv[1])
y, w, _ = d.isocalendar()
print(f"{y}-W{w:02d}")
PY
}

stage_week_set() {
  local id="$1" want="$2" cdp got expr
  [[ "$want" =~ ^[0-9]{4}-W[0-9]{2}$ ]] || refuse BAD_ARGS "week must be an ISO label YYYY-Www, got '$want'"
  cdp="$(pb_port "$id" cdp)"
  local want_json; want_json="$(jq -nc --arg w "$want" '$w')"
  expr="(function(){const el=document.querySelector('.pine-week'); if(!el) return 'NO_CONTROL'; el.value=$want_json; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return el.value;})()"
  node "$CORE/cdp.mjs" "$cdp" evaluate "$expr" >/dev/null 2>&1
  sleep 1
  got="$(node "$CORE/cdp.mjs" "$cdp" evaluate \
    "(document.querySelector('.pine-week')?.value)||''" 2>/dev/null | jq -r '.value // empty')"
  [ "$got" = "$want" ] || refuse WEEK_SET_FAILED "could not set the IDE week control to $want (it reads '$got') - the control is .pine-week in the renderer"
  pb_rec "$id" ".week = $(jq -nc --arg w "$want" '$w')"
  printf '  week      %s (the IDE control now reads %s)\n' "$want" "$got" >&2
}

stage_verify() {
  local id="$1" d="$2" week="$3"
  local st rail srv cdp want got bars onchart colours rows="" frame_json frame_rec
  st="$(pb_port "$id" station)"; rail="$(pb_port "$id" rail)"; srv="$(pb_port "$id" server)"; cdp="$(pb_port "$id" cdp)"
  want="$(pb_iso_week "$week")"

  # 1 · THE ROOMS. A down rail is a FAILURE, not a degraded mode: the face is part of the product.
  pb_http_answers "http://127.0.0.1:$rail/" \
    || refuse RAIL_DOWN "the rail (the rooms/face) does not answer on :$rail - the IDE's face is offline"
  rows="$rows{\"check\":\"rail\",\"ok\":true,\"evidence\":\":$rail answers\"},"

  # 2 · THE STATION must compile, not merely be alive.
  pb_station_compiles "$st" \
    || refuse STATION_DOWN "the station on :$st does not answer success:true on POST /run"
  rows="$rows{\"check\":\"station\",\"ok\":true,\"evidence\":\":$st compiles\"},"

  # 3 · THE PAGE must be talking to THIS instance (the cross-contamination failure).
  local page; page="$(curl -s -m 4 "http://127.0.0.1:$srv/pine.html")"
  # fixed-string matches: a case-pattern with embedded escapes silently never matched (measured)
  printf '%s' "$page" | grep -qF "\"apiBase\": \"http://127.0.0.1:$srv\"" \
    || refuse PORTS_MISMATCH "the page served on :$srv does not name its own apiBase - it would read another instance's data"
  printf '%s' "$page" | grep -qF "\"railBases\": [\"http://127.0.0.1:$rail\"]" \
    || refuse PORTS_MISMATCH "the page served on :$srv does not name this instance's rail :$rail"
  rows="$rows{\"check\":\"ports\",\"ok\":true,\"evidence\":\"apiBase+rail are this instance's\"},"

  # 4 · THE WEEK. The operator's named failure: an indicator read on the wrong week.
  got="$(node "$CORE/cdp.mjs" "$cdp" evaluate \
        "(()=>{const el=document.querySelector('.pine-week');return (el&&el.value)||(document.body.innerText.match(/\\d{4}-W\\d{2}/)||[''])[0]})()" \
        2>/dev/null | jq -r '.value // empty')"
  [ "$got" = "$want" ] || refuse WEEK_MISMATCH "the IDE is set to '${got:-<none>}' but the loaded bars are week $want (fixture $week) - an indicator read here would be read on the wrong week"
  rows="$rows{\"check\":\"week\",\"ok\":true,\"evidence\":\"$got == $want\"},"

  # 5 · DID ANYTHING ACTUALLY DRAW? counts from the load the instance recorded.
  bars="$(pb_rec_get "$id" ".load.result.bars")"; onchart="$(pb_rec_get "$id" ".load.result.onChart")"
  [ "${bars:-0}" -gt 0 ] 2>/dev/null || refuse NO_BARS "no bars are loaded (bars=${bars:-0}) - the chart has nothing to draw"
  [ "${onchart:-0}" -gt 0 ] 2>/dev/null || refuse NO_DRAWINGS "the script compiled but drew nothing (onChart=${onchart:-0}) - an empty chart is not a working indicator"
  rows="$rows{\"check\":\"drawn\",\"ok\":true,\"evidence\":\"$bars bars, $onchart drawn\"},"

  # 6 · THE PIXELS, AND THEY MUST BE NEW. A capture byte-identical to the one before it is not a
  # second look - it is the same frame, so nothing was re-rendered (the "identical bytes, 5 boxes then
  # 0" trap). Capture fresh, compare against the recorded sha, refuse NO_FRESH_FRAME on a repeat.
  local fresh freshsha prevfresh
  fresh="$d/verify-frame.png"
  prevfresh="$d/frame.png"
  frame_json="$("$COMPUTER" screenshot --id "$id" --out "$fresh" 2>"$d/verify-shot.err")" \
    || refuse CAPTURE_FAILED "could not capture and measure the frame: $(tail -1 "$d/verify-shot.err")"
  # Freshness belongs to the CHART PIXELS, not the PNG container: the UTC
  # footer changes every second, so byte hashes differ on an unchanged chart.
  if [ -f "$prevfresh" ]; then
    python3 - "$prevfresh" "$fresh" <<'PY'
import sys
from PIL import Image, ImageChops
a, b = (Image.open(p).convert("RGB") for p in sys.argv[1:3])
if a.size != b.size:
    raise SystemExit(0)
box = (550, 70, a.width - 6, 660)
if ImageChops.difference(a.crop(box), b.crop(box)).getbbox() is None:
    raise SystemExit(1)
PY
    [ $? -eq 0 ] || refuse NO_FRESH_FRAME "the chart pixels are unchanged; only frame metadata or the UTC clock moved"
  fi
  freshsha="$(sha256sum "$fresh" | cut -c1-16)"
  frame_rec="$(jq -c '{path,bytes,colours}' <<<"$frame_json")"
  pb_rec "$id" ".frame_sha = \"$freshsha\" | .frame = $frame_rec"
  colours="$(jq -r '.colours // 0' <<<"$frame_json")"
  rows="$rows{\"check\":\"frame\",\"ok\":true,\"evidence\":\"$colours colours\"}"

  printf '%s\n' "$(jq -nc --argjson id "$id" --arg want "$want" --arg checks "[${rows%,}]" '{ok:true,id:$id,week:$want,verdict:"WORKS",checks:$checks}')"
}
