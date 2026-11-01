#!/usr/bin/env bash
# v3_backtest.sh - P3 replay controls. Replay commands are legal only while the
# Backtest pane is active; the state is read after every operation.

pb_bt_active() {
  local id="$1" active
  active="$(pb_v3_eval "$id" "document.querySelector('.pv-pane.pv-on')?.id || ''")"
  [ "$(jq -r . <<<"$active")" = "page-backtest-room" ] || refuse BACKTEST_TAB_INACTIVE "the Backtest tab is not active"
}

pb_bt_state() {
  local id="$1"
  pb_v3_eval "$id" "(()=>{const c=window.PlutusPineShell.chart.replayControl.ctrl; return {queue:c.replayQueue?.length ?? null,playing:c.replayPlaying,interval:c.replayIntervalMs,depth:c.replayDepth,first:c.rawBars[0]?.time,last:c.rawBars.at(-1)?.time};})()"
}

pb_bt() {
  local id op
  id="$(flag id 0)"; pb_v3_up_guard "$id"; pb_bt_active "$id"
  op="$(flag op)"; [ -n "$op" ] || refuse BAD_ARGS "backtest needs --op play|pause|step|speed|date|stop"
  local result
  case "$op" in
    play)
      result="$(pb_v3_eval "$id" "(()=>{const c=window.PlutusPineShell.chart.replayControl.ctrl; c.replayPlay(); return {playing:c.replayPlaying,interval:c.replayIntervalMs};})()")"
      [ "$(jq -r '.playing' <<<"$result")" = true ] || refuse REPLAY_PLAY_FAILED "replay did not enter playing state"
      printf '{"ok":true,"id":%s,"verb":"backtest","op":"play","state":%s}\n' "$id" "$result" ;;
    pause)
      result="$(pb_v3_eval "$id" "(()=>{const c=window.PlutusPineShell.chart.replayControl.ctrl; c.replayPause(); return {playing:c.replayPlaying,interval:c.replayIntervalMs};})()")"
      [ "$(jq -r '.playing' <<<"$result")" = false ] || refuse REPLAY_PAUSE_FAILED "replay did not pause"
      printf '{"ok":true,"id":%s,"verb":"backtest","op":"pause","state":%s}\n' "$id" "$result" ;;
    step)
      local n; n="$(flag n 1)"; [[ "$n" =~ ^[0-9]+$ ]] || refuse BAD_ARGS "step --n must be an integer"
      result="$(pb_v3_eval "$id" "(()=>{const c=window.PlutusPineShell.chart.replayControl.ctrl; let n=0; for(let i=0;i<$n;i++){if(c.replayStep()) n++;} return {steps:n,queue:c.replayQueue?.length ?? null,playing:c.replayPlaying};})()")"
      [ "$(jq -r '.steps // 0' <<<"$result")" -gt 0 ] || refuse REPLAY_STEP_FAILED "no replay bar could be stepped"
      printf '{"ok":true,"id":%s,"verb":"backtest","op":"step","state":%s}\n' "$id" "$result" ;;
    speed)
      local ms; ms="$(flag speed)"; [[ "$ms" =~ ^[0-9]+(\.[0-9]+)?$ ]] || refuse SPEED_SET_FAILED "speed must be positive milliseconds per bar"
      result="$(pb_v3_eval "$id" "(()=>{const c=window.PlutusPineShell.chart.replayControl.ctrl; c.replayPlay($ms); return {playing:c.replayPlaying,interval:c.replayIntervalMs};})()")"
      [ "$(jq -r '.interval // 0' <<<"$result")" = "$ms" ] || refuse SPEED_SET_FAILED "replay interval did not become $ms"
      printf '{"ok":true,"id":%s,"verb":"backtest","op":"speed","state":%s}\n' "$id" "$result" ;;
    date)
      local date; date="$(flag date)"; [[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || refuse DATE_SET_FAILED "date must be YYYY-MM-DD"
      local ms; ms="$(python3 -c 'import datetime,sys; print(int(datetime.datetime.fromisoformat(sys.argv[1]).replace(tzinfo=datetime.timezone.utc).timestamp()*1000))' "$date")"
      result="$(pb_v3_eval "$id" "(async()=>{const c=window.PlutusPineShell.chart.replayControl.ctrl; await c.replayStart({from:$ms}); return {queue:c.replayQueue?.length ?? null,playing:c.replayPlaying,first:c.rawBars[0]?.time,last:c.rawBars.at(-1)?.time};})()")"
      [ "$(jq -r '.queue // 0' <<<"$result")" -gt 0 ] || refuse DATE_OUT_OF_RANGE "no replay bars after $date"
      printf '{"ok":true,"id":%s,"verb":"backtest","op":"date","date":"%s","state":%s}\n' "$id" "$date" "$result" ;;
    stop)
      result="$(pb_v3_eval "$id" "(()=>{const c=window.PlutusPineShell.chart.replayControl.ctrl; c.replayStop(); return {playing:c.replayPlaying,queue:c.replayQueue?.length ?? null};})()")"
      printf '{"ok":true,"id":%s,"verb":"backtest","op":"stop","state":%s}\n' "$id" "$result" ;;
    *) refuse BAD_ARGS "unknown backtest op '$op'" ;;
  esac
}
