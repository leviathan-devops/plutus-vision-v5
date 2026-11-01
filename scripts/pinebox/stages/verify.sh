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
  local st rail srv cdp want got bars onchart colours frame_json frame_rec pr
  # the verdict's checks are a real JSON ARRAY built by jq - hand-concatenated rows broke on any
  # quote/newline in the evidence and were emitted as a STRING, not an array
  local checks='[]'
  add_check() { checks="$(jq -c --arg c "$1" --arg e "$2" '. + [{check:$c,ok:true,evidence:$e}]' <<<"$checks")"; }
  st="$(pb_port "$id" station)"; rail="$(pb_port "$id" rail)"; srv="$(pb_port "$id" server)"; cdp="$(pb_port "$id" cdp)"
  want="$(pb_iso_week "$week")"

  # 1 · THE ROOMS. A down rail is a FAILURE, not a degraded mode: the face is part of the product.
  pb_http_answers "http://127.0.0.1:$rail/" \
    || refuse RAIL_DOWN "the rail (the rooms/face) does not answer on :$rail - the IDE's face is offline"
  add_check rail ":$rail answers"

  # 2 · THE STATION must compile, not merely be alive.
  pb_station_compiles "$st" \
    || refuse STATION_DOWN "the station on :$st does not answer success:true on POST /run"
  add_check station ":$st compiles"

  # 3 · THE PAGE must be talking to THIS instance (the cross-contamination failure).
  local page; page="$(curl -s -m 4 "http://127.0.0.1:$srv/pine.html")"
  # fixed-string matches: a case-pattern with embedded escapes silently never matched (measured)
  printf '%s' "$page" | grep -qF "\"apiBase\": \"http://127.0.0.1:$srv\"" \
    || refuse PORTS_MISMATCH "the page served on :$srv does not name its own apiBase - it would read another instance's data"
  printf '%s' "$page" | grep -qF "\"railBases\": [\"http://127.0.0.1:$rail\"]" \
    || refuse PORTS_MISMATCH "the page served on :$srv does not name this instance's rail :$rail"
  add_check ports "apiBase+rail are this instance's"

  # 4 · THE WEEK. The operator's named failure: an indicator read on the wrong week.
  # two steps, and the instrument's failure is named: `2>/dev/null | jq ... // empty` turned a dead CDP socket, a missing
  # control or a jq failure into the empty string, and the empty string into "WEEK_MISMATCH" - a verdict about the CHART
  # reported for a failure of the READER
  local wk_out wk_err wk_rc
  wk_err="$(mktemp)"
  wk_out="$(node "$CORE/cdp.mjs" "$cdp" evaluate \
        "(()=>{const el=document.querySelector('.pine-week');return (el&&el.value)||(document.body.innerText.match(/\\d{4}-W\\d{2}/)||[''])[0]})()" \
        2>"$wk_err")"; wk_rc=$?
  if [ "$wk_rc" -ne 0 ]; then
    wk_out="$(grep -m1 '^REFUSED' "$wk_err" | cut -c1-200)"; rm -f "$wk_err"
    refuse CDP_UNREADABLE "could not read the week from the page over CDP :$cdp - ${wk_out:-no refusal line from cdp.mjs}"
  fi
  rm -f "$wk_err"
  got="$(jq -r '.value // empty' <<<"$wk_out")" || refuse CDP_UNREADABLE "cdp.mjs answered non-JSON while reading the week: $(printf '%s' "$wk_out" | head -c 120)"
  [ "$got" = "$want" ] || refuse WEEK_MISMATCH "the IDE is set to '${got:-<none>}' but the loaded bars are week $want (fixture $week) - an indicator read here would be read on the wrong week"
  add_check week "$got == $want"

  # 5 · DID ANYTHING ACTUALLY DRAW? counts from the load the instance recorded.
  bars="$(pb_rec_get "$id" ".load.result.bars")"; onchart="$(pb_rec_get "$id" ".load.result.onChart")"
  [ "${bars:-0}" -gt 0 ] 2>/dev/null || refuse NO_BARS "no bars are loaded (bars=${bars:-0}) - the chart has nothing to draw"
  [ "${onchart:-0}" -gt 0 ] 2>/dev/null || refuse NO_DRAWINGS "the script compiled but drew nothing (onChart=${onchart:-0}) - an empty chart is not a working indicator"
  add_check drawn "$bars bars, $onchart drawn"

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
    # THREE outcomes, never two (chartpx.py): 0 = the chart pane changed, 1 = unchanged, 2 = the INSTRUMENT
    # failed (PIL missing, unreadable PNG). Collapsing 2 into 1 reported a missing dependency as "no new frame".
    python3 "$PB_HOME/chartpx.py" changed "$prevfresh" "$fresh" 2>"$d/chartpx.err"; pr=$?
    case "$pr" in
      0) ;;
      1) refuse NO_FRESH_FRAME "the chart pixels are unchanged; only frame metadata or the UTC clock moved" ;;
      *) refuse FRESHNESS_CHECK_FAILED "the pixel-freshness instrument itself failed (exit $pr): $(tail -1 "$d/chartpx.err") - this is NOT a verdict about the frame" ;;
    esac
  fi
  freshsha="$(sha256sum "$fresh" | cut -c1-16)"
  frame_rec="$(jq -c '{path,bytes,colours}' <<<"$frame_json")"
  pb_rec "$id" ".frame_sha = $(jq -nc --arg v "$freshsha" '$v') | .frame = $frame_rec"
  colours="$(jq -r '.colours // 0' <<<"$frame_json")"
  [[ "$colours" =~ ^[0-9]+$ ]] && [ "$colours" -gt 1 ] \
    || refuse FRAME_BLANK "the fresh frame has ${colours:-no} colour(s) - a blank or failed render must not read as WORKS"
  add_check frame "$colours colours"
  # The WHOLE-frame count above cannot see a blank CHART: the editor, tabs and footer alone supply
  # thousands of colours (measured: 6268..7622 with the chart pane painted flat). Measure the pane itself.
  local pane_n pane_min
  pane_min="$(python3 -c 'import sys; sys.path.insert(0,sys.argv[1]); import chartpx; print(chartpx.BLANK_THRESHOLD)' "$PB_HOME")"
  pane_n="$(python3 "$PB_HOME/chartpx.py" colours "$fresh" 2>"$d/chartpx.err")" \
    || refuse FRESHNESS_CHECK_FAILED "could not measure the chart pane: $(tail -1 "$d/chartpx.err") - this is NOT a verdict about the frame"
  [[ "$pane_n" =~ ^[0-9]+$ ]] && [ "$pane_n" -ge "$pane_min" ] \
    || refuse CHART_BLANK "the chart pane has ${pane_n:-no} distinct colours, below the measured floor of $pane_min (a populated pane measures 1493..4153): the chart did not draw"
  add_check chart "$pane_n chart-pane colours (floor $pane_min)"

  # CANDLES, not colours: the colour count above cannot tell a chart from an empty one (gridlines and axis labels alone
  # measure 1617 colours; a pane with NO candles passed it and `verify` answered WORKS). The candle count is measured on the
  # same frame and refuses below its measured floor - see chartpx.py for the four real frames the floor comes from.
  local candles_n candles_min
  candles_min="$(python3 -c 'import sys; sys.path.insert(0,sys.argv[1]); import chartpx; print(chartpx.CANDLE_FLOOR)' "$PB_HOME")"
  candles_n="$(python3 "$PB_HOME/chartpx.py" candles "$fresh" 2>"$d/chartpx.err")" \
    || refuse FRESHNESS_CHECK_FAILED "could not measure the candles in the chart pane: $(tail -1 "$d/chartpx.err") - this is NOT a verdict about the frame"
  [[ "$candles_n" =~ ^[0-9]+$ ]] && [ "$candles_n" -ge "$candles_min" ] \
    || refuse CHART_NO_CANDLES "the chart pane shows ${candles_n:-no} candle pixels, below the measured floor of $candles_min (a drawn week measures 4371; none measures 0..352): there is nothing on the chart to read"
  add_check candles "$candles_n candle pixels (floor $candles_min)"

  [[ "$id" =~ ^(0|[1-9])$ ]] || refuse BAD_ID "verdict for a non-canonical instance id '$id'"   # the function's OWN id, not the global $ID that require_id happened to set
  jq -nc --argjson id "$id" --arg want "$want" --argjson checks "$checks" '{ok:true,id:$id,week:$want,verdict:"WORKS",checks:$checks}'
}
