#!/usr/bin/env bash
# load.sh - STAGE 5: put a Pine source into the page's editor and RUN it (blueprint section 6).
# Sourced by pinebox.
#
#   stage_load ID DIR PINE_FILE PAIR TF
#
# It reuses scripts/pv-load.mjs, which drives the page over CDP (Runtime.evaluate): set the
# editor source, load the bars, run, frame the drawn geometry, and print the counts. The
# instance's CDP port and server port reach it through the environment.
#
# EXIT (can fail): pv-load exits 0 (compiled and drawn), a fresh frame is not blank, and the
# page's OWN status row shows the fixture. A source that does not compile, or that draws
# nothing, is a refusal that carries pv-load's own code - never an empty chart dressed as
# success.

# pb_row_has_field ROW FIELD: FIELD is one of the row's ' · '-separated fields, EXACTLY. A substring test
# accepted '1D' inside '21D' and 'BTC' inside 'BTCX', and passed vacuously on an empty FIELD ('**'
# matches everything), so a mismatched fixture could clear the page-assertion gate.
pb_row_has_field() {
  [ -n "$2" ] || return 1
  awk -v f="$2" -F ' · ' '{ for (i = 1; i <= NF; i++) if ($i == f) found = 1 } END { exit !found }' <<<"$1"
}

# pb_check_pair_tf PAIR TF: the two values reach `bun pv-load.mjs` and the page's status assertion;
# only a plausible symbol and a plausible timeframe may. Refuses BAD_ARGS by name.
pb_check_pair_tf() {
  [[ "$1" =~ ^[A-Za-z0-9]{2,8}(/[A-Za-z0-9]{2,8})?$ ]] || refuse BAD_ARGS "pair must be a symbol like DXY or EUR/USD, got '$1'"
  [[ "$2" =~ ^[0-9]{1,3}[mHDW]$ ]] || refuse BAD_ARGS "timeframe must look like 15m, 1H, 4H or 1D, got '$2'"
}

stage_load() {
  local id="$1" d="$2" pine="$3" pair="$4" tf="$5"
  local abs="$pine" cdp srv out result lrc raw
  pb_check_pair_tf "$pair" "$tf"
  case "$pine" in /*) ;; *) abs="$PWD/$pine" ;; esac
  [ -f "$abs" ] || refuse PINE_ABSENT "no such pine source: $abs"
  need bun LOAD_UNAVAILABLE
  cdp="$(pb_port "$id" cdp)"; srv="$(pb_port "$id" server)"

  # pv-load resolves nothing against cwd but its own tree; PV_* name this instance's IDE
  out="$(cd "$PV_ROOT" && PV_CDP_PORT="$cdp" PV_SERVER_PORT="$srv" timeout 170 bun scripts/pv-load.mjs "$abs" "$pair" "$tf" 2>"$d/load.err")"; lrc=$?
  if [ "$lrc" -ne 0 ]; then
    # the exit code is the CAUSE when stderr is empty: 124 is the 170s deadline, anything else with no
    # message is a failure to even run (cd, bun) - never an empty "PINE_LOAD_FAILED ()"
    [ "$lrc" -ne 124 ] || refuse PINE_LOAD_TIMEOUT "pv-load did not finish within 170s (source $abs, $pair $tf)"
    local line tok; line="$(grep -m1 -E '^[A-Z_]+:' "$d/load.err" || tail -1 "$d/load.err")"
    [ -n "$line" ] || line="PINE_LOAD_FAILED: pv-load exited $lrc with no message on stderr (is bun runnable from $PV_ROOT?)"
    tok="$(printf '%s' "$line" | sed -nE 's/^([A-Z_]+):.*/\1/p')"
    # a compiler/bun log level at the head of a stderr line (`ERROR: ...`, `WARNING: ...`) is not pv-load's token and must
    # not be minted into the refusal ledger as one
    case "$tok" in ERROR|WARNING|WARN|INFO|DEBUG|FATAL|NOTE|TRACE) tok="" ;; esac
    refuse "${tok:-PINE_LOAD_FAILED}" "$(printf '%s' "$line" | sed -E 's/^[A-Z_]+: *//') (source $abs, $pair $tf)"
  fi
  result="$(jq -c . <<<"$out")" || refuse PINE_LOAD_FAILED "pv-load returned non-JSON output, so no successful load can be recorded: $(printf '%s' "$out" | tail -1)"
  [ "$(jq -r '.bars // 0' <<<"$result")" -gt 0 ] || refuse NO_BARS "pv-load returned success-shaped output with zero bars"
  [ "$(jq -r '.onChart // 0' <<<"$result")" -gt 0 ] || refuse NO_DRAWINGS "pv-load returned zero chart objects"
  # stage_frame waits for and measures the frame itself; its failure is OURS to propagate -
  # falling through recorded a successful load over a blank frame
  stage_frame "$id" "$d" || exit $?

  # the page's OWN status row: what the page itself says it loaded. It is an ASSERTION, not a
  # log line: empty, "(no FIXTURE row)", a CDP failure or a different pair/timeframe all refuse.
  local row
  # two steps, not a pipeline: in `node | jq` a failed node feeds jq an EMPTY stdin, jq succeeds with empty
  # output, and the unreadable page looked like a page with no status row
  raw="$(node "$CORE/cdp.mjs" "$cdp" evaluate "(document.body.innerText.match(/FIXTURE[^\\n]*/)||['(no FIXTURE row)'])[0]" 2>"$d/status.err")" \
    || refuse STATUS_ROW_UNREADABLE "could not read the page's status row over CDP: $(tail -1 "$d/status.err")"
  row="$(jq -r '.value // empty' <<<"$raw")" || refuse STATUS_ROW_UNREADABLE "the page's status reply was not JSON: ${raw:0:160}"
  [ -n "$row" ] && [ "$row" != "(no FIXTURE row)" ] \
    || refuse STATUS_ROW_ABSENT "the page shows no FIXTURE status row - it did not report loading this fixture"
  pb_row_has_field "$row" "$pair" || refuse STATUS_ROW_MISMATCH "the page's status row '$row' has no field equal to pair '$pair'"
  pb_row_has_field "$row" "$tf"   || refuse STATUS_ROW_MISMATCH "the page's status row '$row' has no field equal to timeframe '$tf'"
  pb_rec "$id" ".load = $(jq -nc --arg pine "$abs" --arg pair "$pair" --arg tf "$tf" --arg row "$row" --argjson result "$result" '{pine:$pine,pair:$pair,tf:$tf,status_row:$row,result:$result}')"
  printf '  load      %s  %s %s  -> %s\n' "$(basename "$abs")" "$pair" "$tf" "$(printf '%s' "$out" | jq -c '{bars,onChart,counts}' 2>/dev/null)" >&2
  printf '  status    %s\n' "$row" >&2
}
