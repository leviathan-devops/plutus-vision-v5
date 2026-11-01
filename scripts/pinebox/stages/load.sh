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

stage_load() {
  local id="$1" d="$2" pine="$3" pair="$4" tf="$5"
  local abs="$pine" cdp srv out result
  case "$pine" in /*) ;; *) abs="$PWD/$pine" ;; esac
  [ -f "$abs" ] || refuse PINE_ABSENT "no such pine source: $abs"
  need bun LOAD_UNAVAILABLE
  cdp="$(pb_port "$id" cdp)"; srv="$(pb_port "$id" server)"

  # pv-load resolves nothing against cwd but its own tree; PV_* name this instance's IDE
  out="$(cd "$PV_ROOT" && PV_CDP_PORT="$cdp" PV_SERVER_PORT="$srv" timeout 170 bun scripts/pv-load.mjs "$abs" "$pair" "$tf" 2>"$d/load.err")" \
    || {
      local line tok; line="$(grep -m1 -E '^[A-Z_]+:' "$d/load.err" || tail -1 "$d/load.err")"
      tok="$(printf '%s' "$line" | sed -nE 's/^([A-Z_]+):.*/\1/p')"
      refuse "${tok:-PINE_LOAD_FAILED}" "$(printf '%s' "$line" | sed -E 's/^[A-Z_]+: *//') (source $abs, $pair $tf)"
    }
  result="$(jq -c . <<<"$out")" || refuse PINE_LOAD_FAILED "pv-load returned non-JSON output, so no successful load can be recorded: $(printf '%s' "$out" | tail -1)"
  [ "$(jq -r '.bars // 0' <<<"$result")" -gt 0 ] || refuse NO_BARS "pv-load returned success-shaped output with zero bars"
  [ "$(jq -r '.onChart // 0' <<<"$result")" -gt 0 ] || refuse NO_DRAWINGS "pv-load returned zero chart objects"
  # stage_frame waits for and measures the frame itself; its failure is OURS to propagate -
  # falling through recorded a successful load over a blank frame
  stage_frame "$id" "$d" || exit $?

  # the page's OWN status row: what the page itself says it loaded. It is an ASSERTION, not a
  # log line: empty, "(no FIXTURE row)", a CDP failure or a different pair/timeframe all refuse.
  local row
  row="$(node "$CORE/cdp.mjs" "$cdp" evaluate "(document.body.innerText.match(/FIXTURE[^\\n]*/)||['(no FIXTURE row)'])[0]" 2>"$d/status.err" | jq -r '.value // empty')" \
    || refuse STATUS_ROW_UNREADABLE "could not read the page's status row over CDP: $(tail -1 "$d/status.err")"
  [ -n "$row" ] && [ "$row" != "(no FIXTURE row)" ] \
    || refuse STATUS_ROW_ABSENT "the page shows no FIXTURE status row - it did not report loading this fixture"
  case "$row" in *"$pair"*) ;; *) refuse STATUS_ROW_MISMATCH "the page's status row '$row' does not name pair $pair" ;; esac
  case "$row" in *"$tf"*) ;; *) refuse STATUS_ROW_MISMATCH "the page's status row '$row' does not name timeframe $tf" ;; esac
  pb_rec "$id" ".load = $(jq -nc --arg pine "$abs" --arg pair "$pair" --arg tf "$tf" --arg row "$row" --argjson result "$result" '{pine:$pine,pair:$pair,tf:$tf,status_row:$row,result:$result}')"
  printf '  load      %s  %s %s  -> %s\n' "$(basename "$abs")" "$pair" "$tf" "$(printf '%s' "$out" | jq -c '{bars,onChart,counts}' 2>/dev/null)" >&2
  printf '  status    %s\n' "$row" >&2
}
