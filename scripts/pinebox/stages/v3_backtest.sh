#!/usr/bin/env bash
# v3_backtest.sh - P3 replay controls.
#
# The "Backtest tab is active" guard is folded INTO the same page evaluation as the action
# (PB_BT_HEAD): a guard checked in one call and an action in a second would let a tab switch
# slip between them and drive the replay on the wrong pane. Every op reads the replay state
# back and refuses if the post-condition does not hold.

PB_BT_HEAD="const P=window.PlutusPineShell; const c=P?.chart?.replayControl?.ctrl; if(!c) return {absent:true}; if((document.querySelector('.pv-pane.pv-on')?.id||'')!=='page-backtest-room') return {inactive:true};"

# pb_bt_eval ID BODY : runs BODY after the head guard; refuses on absent/inactive, else prints the result
pb_bt_eval() {
  local id="$1" body="$2" res
  res="$(pb_v3_eval "$id" "(async function(){${PB_BT_HEAD} ${body}})()")" || exit $?
  [ "$(jq -r '.absent // false' <<<"$res")" = false ]   || refuse REPLAY_ABSENT "the replay controller is not mounted on this page"
  [ "$(jq -r '.inactive // false' <<<"$res")" = false ] || refuse BACKTEST_TAB_INACTIVE "the Backtest tab is not active (switch with: pinebox tab --to backtest)"
  printf '%s\n' "$res"
}

pb_bt() {
  pb_v3_begin; local id="$PB_ID" op res
  op="$(flag op)"; [ -n "$op" ] || refuse BAD_ARGS "backtest needs --op play|pause|step|speed|date|stop"
  case "$op" in
    play)
      res="$(pb_bt_eval "$id" "c.replayPlay(); return {playing:c.replayPlaying,interval:c.replayIntervalMs};")" || exit $?
      [ "$(jq -r '.playing' <<<"$res")" = true ] || refuse REPLAY_PLAY_FAILED "replay did not enter the playing state"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"play",state:$s}' ;;
    pause)
      res="$(pb_bt_eval "$id" "c.replayPause(); return {playing:c.replayPlaying,interval:c.replayIntervalMs};")" || exit $?
      [ "$(jq -r '.playing' <<<"$res")" = false ] || refuse REPLAY_PAUSE_FAILED "replay did not pause"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"pause",state:$s}' ;;
    step)
      local n; n="$(flag n 1)"
      [[ "$n" =~ ^[0-9]+$ ]] && [ "$n" -ge 1 ] && [ "$n" -le 500 ] || refuse BAD_ARGS "step --n must be an integer in 1..500 (a larger loop blocks the page's event loop), got '$n'"
      res="$(pb_bt_eval "$id" "let done=0; for(let i=0;i<$n;i++){ if(!c.replayStep()) break; done++; } return {requested:$n,steps:done,queue:c.replayQueue?.length??null,playing:c.replayPlaying};")" || exit $?
      [ "$(jq -r '.steps // 0' <<<"$res")" -gt 0 ] || refuse REPLAY_STEP_FAILED "no replay bar could be stepped (the queue is empty - start one with --op date)"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"step",state:$s,partial:($s.steps < $s.requested)}' ;;
    speed)
      local ms; ms="$(flag speed)"
      pb_v3_num speed "$ms" 1 60000      # strictly positive: 0 would spin the replay loop
      res="$(pb_bt_eval "$id" "c.replayPlay($ms); return {playing:c.replayPlaying,interval:c.replayIntervalMs};")" || exit $?
      jq -e --argjson want "$ms" '(.interval|tonumber) == $want' <<<"$res" >/dev/null || refuse SPEED_SET_FAILED "replay interval is $(jq -r .interval <<<"$res"), not $ms"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"speed",state:$s}' ;;
    date)
      local date ms; date="$(flag date)"
      [[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || refuse DATE_SET_FAILED "date must be YYYY-MM-DD, got '$date'"
      # a REAL calendar date: 2026-13-99 matches the shape and is not one. The page replays in
      # UTC, so the date is taken as UTC midnight.
      ms="$(python3 -c 'import datetime,sys; print(int(datetime.datetime.strptime(sys.argv[1],"%Y-%m-%d").replace(tzinfo=datetime.timezone.utc).timestamp()*1000))' "$date" 2>/dev/null)"
      [[ "$ms" =~ ^[0-9]+$ ]] || refuse DATE_SET_FAILED "'$date' is not a valid calendar date"
      # the date must lie INSIDE the loaded bars. replayStart({from}) with an earlier date silently
      # starts at bar 0, so "1999-01-01" read as a successful seek 27 years before the data.
      res="$(pb_bt_eval "$id" "const b=P.workbench.getBars()||[]; if(!b.length) return {empty:true};   /* the LOADED bars, not c.rawBars: that is the replay's own mutable working set and shrinks after every seek */ const lo=b[0].time, hi=b[b.length-1].time; if($ms<lo||$ms>hi) return {outside:true,first:lo,last:hi}; await c.replayStart({from:$ms}); return {queue:c.replayQueue?.length??null,playing:c.replayPlaying,first:lo,last:hi};")" || exit $?
      [ "$(jq -r '.empty // false' <<<"$res")" = false ]   || refuse DATE_OUT_OF_RANGE "no bars are loaded, so there is nothing to replay"
      [ "$(jq -r '.outside // false' <<<"$res")" = false ] || refuse DATE_OUT_OF_RANGE "$date is outside the loaded bars ($(jq -r '.first/1000|strftime("%Y-%m-%d")' <<<"$res") .. $(jq -r '.last/1000|strftime("%Y-%m-%d")' <<<"$res"))"
      [[ "$(jq -r '.queue // 0' <<<"$res")" =~ ^[0-9]+$ ]] && [ "$(jq -r '.queue // 0' <<<"$res")" -gt 0 ] || refuse DATE_OUT_OF_RANGE "no replay bars at or after $date"
      jq -nc --argjson id "$id" --arg d "$date" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"date",date:$d,state:$s}' ;;
    stop)
      res="$(pb_bt_eval "$id" "c.replayStop(); return {playing:c.replayPlaying,queue:c.replayQueue?.length??null};")" || exit $?
      # a replay that is still playing after stop is a live timer, not a stopped replay
      [ "$(jq -r '.playing' <<<"$res")" = false ] || refuse REPLAY_STOP_FAILED "replay is still playing after stop"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"stop",state:$s}' ;;
    *) refuse BAD_ARGS "unknown backtest op '$op' (play|pause|step|speed|date|stop)" ;;
  esac
}
