#!/usr/bin/env bash
# v3_backtest.sh - the Backtest ROOM's replay controls (blueprint section G).
# NOTE the jump-to field is a datetime-local input: the BROWSER'S LOCAL TIME. The verb takes a UTC date, so it writes the local-time spelling of UTC midnight
# (measured: on a UTC+4 host the UTC date 2026-07-08 typed verbatim landed on 2026-07-07T20:00Z, a day early).
#
# WHAT THIS DRIVES (T-59, F-179): the room the operator sees on the BACKTEST tab - `#page-backtest-room`, `window.PlutusBacktestRoom` - through its OWN buttons
# (`play`, `pause`, `forward one bar`, `to the first bar`), its `bars / second` select, its jump-to field + GO, and CREATE SESSION. The first version drove
# `PlutusPineShell.chart.replayControl` instead: that is the IDE CHART's replay (it cut the chart on the PINE tab), while the Backtest pane kept reading
# "NO SESSION - CREATE ONE ON THE LEFT", SPEED 2x, an empty JUMP TO. A verb that answers ok:true about state the pane does not show is a status field, not evidence.
#
# EVERY op reads its result back from PlutusBacktestRoom.state() AND from the visible controls (`ui`: the speed select, the timeline value, the NO SESSION banner)
# and refuses by name when the read-back does not match; the "Backtest tab is active" guard is folded INTO the same page evaluation as the action.
#   backtest --op session                  create a session (the room needs one before it can replay)
#   backtest --op state                    read-only: the room's state and what its controls show
#   backtest --op play | pause | stop      stop = pause + back to the session's first bar (via the jump-to field: the room's own first-bar button is a no-op)
#   backtest --op step [--n N]             N x `forward one bar` (1..500)
#   backtest --op speed --speed X          the `bars / second` select: 0.5 1 2 5 10 25
#   backtest --op date --date YYYY-MM-DD   the jump-to field + GO; the date must lie inside the session's window

PB_BT_HEAD="const R=window.PlutusBacktestRoom; const P=document.querySelector('#page-backtest-room'); if(!R||!P) return {absent:true};
 if((document.querySelector('.pv-pane.pv-on')?.id||'')!=='page-backtest-room') return {inactive:true};
 const sleep=(ms)=>new Promise(s=>setTimeout(s,ms));
 const until=async(f,ms)=>{const t=Date.now(); while(Date.now()-t<ms){ try{ if(f()) return true; }catch(e){} await sleep(60);} return false;};
 const B=(t)=>[...P.querySelectorAll('button')].find(b=>(b.title||b.getAttribute('aria-label')||'')===t);
 const SEL=()=>[...P.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='0.5'));
 const GO=()=>[...P.querySelectorAll('button')].find(b=>/^GO\$/i.test((b.textContent||'').trim()));
 const TL=()=>P.querySelector('input[type=range]');
 const ST=()=>{const q=R.state(); const s=q&&q.status; return s?{uid:q.uid,cursor:s.cursor,playing:s.playing,rate:s.rate,atStart:s.atStart,atEnd:s.atEnd,startIndex:s.startIndex,now:s.now&&s.now.iso,nowMs:s.now&&s.now.time,startDate:s.startDate,endDate:s.endDate,barsTotal:s.barsTotal}:null;};
 const UI=()=>({speedSelect:SEL()&&SEL().value,timeline:TL()&&TL().value,timelineMax:TL()&&TL().max,noSessionBanner:[...P.querySelectorAll('*')].some(e=>e.children.length===0&&/^NO SESSION(?!S)/i.test((e.textContent||'').trim())&&e.offsetParent!==null)});"

# pb_bt_eval ID BODY : runs BODY after the head guard; refuses on absent/inactive/no-session, else prints the result
pb_bt_eval() {
  local id="$1" body="$2" res
  res="$(pb_v3_eval "$id" "(async function(){${PB_BT_HEAD} ${body}})()")" || exit $?
  [ "$(jq -r '.absent // false' <<<"$res")" = false ]   || refuse REPLAY_ABSENT "the Backtest room is not mounted on this page (window.PlutusBacktestRoom / #page-backtest-room)"
  [ "$(jq -r '.inactive // false' <<<"$res")" = false ] || refuse BACKTEST_TAB_INACTIVE "the Backtest tab is not active (switch with: pinebox tab --to backtest)"
  [ "$(jq -r '.nosession // false' <<<"$res")" = false ] || refuse NO_SESSION "the Backtest room has no session - the pane reads NO SESSION (create one with: pinebox backtest --op session)"
  printf '%s\n' "$res"
}

pb_bt() {
  pb_v3_begin; local id="$PB_ID" op res
  op="$(flag op)"; [ -n "$op" ] || refuse BAD_ARGS "backtest needs --op session|state|play|pause|step|speed|date|stop"
  local NEED="if(!ST()) return {nosession:true};"
  case "$op" in
    state)
      res="$(pb_bt_eval "$id" "return {state:ST(),ui:UI()};")" || exit $?
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"state"} + $s' ;;
    session)
      res="$(pb_bt_eval "$id" "const had=!!ST(); if(!had){ const b=[...P.querySelectorAll('button')].find(x=>/CREATE SESSION/i.test(x.textContent||'')); if(!b) return {nobutton:true}; b.click(); await until(()=>ST(),6000); } return {existed:had,state:ST(),ui:UI()};")" || exit $?
      [ "$(jq -r '.nobutton // false' <<<"$res")" = false ] || refuse SESSION_CREATE_FAILED "the room has no CREATE SESSION button"
      [ "$(jq -r '.state.uid // empty' <<<"$res")" != "" ] || refuse SESSION_CREATE_FAILED "CREATE SESSION was pressed and no session appeared within 6 s"
      [ "$(jq -r '.ui.noSessionBanner' <<<"$res")" = false ] || refuse SESSION_CREATE_FAILED "a session exists in the state but the pane still reads NO SESSION"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"session"} + $s' ;;
    play)
      res="$(pb_bt_eval "$id" "$NEED const before=ST(); B('play').click(); await until(()=>ST().playing===true,3000); return {before,state:ST(),ui:UI()};")" || exit $?
      [ "$(jq -r '.state.playing' <<<"$res")" = true ] || refuse REPLAY_PLAY_FAILED "the room did not enter the playing state (atEnd=$(jq -r '.state.atEnd' <<<"$res"))"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"play"} + $s' ;;
    pause)
      res="$(pb_bt_eval "$id" "$NEED const before=ST(); B('pause').click(); await until(()=>ST().playing===false,3000); return {before,state:ST(),ui:UI()};")" || exit $?
      [ "$(jq -r '.state.playing' <<<"$res")" = false ] || refuse REPLAY_PAUSE_FAILED "the room is still playing after pause"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"pause"} + $s' ;;
    stop)
      res="$(pb_bt_eval "$id" "$NEED const before=ST(); B('pause').click(); await until(()=>ST().playing===false,3000); const st=Date.parse(before.startDate); const jin=GO().parentElement.querySelector('input'); const nat=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; const dt=new Date(st), z=(n)=>String(n).padStart(2,'0'); nat.call(jin, dt.getFullYear()+'-'+z(dt.getMonth()+1)+'-'+z(dt.getDate())+'T'+z(dt.getHours())+':'+z(dt.getMinutes())); jin.dispatchEvent(new Event('input',{bubbles:true})); jin.dispatchEvent(new Event('change',{bubbles:true})); GO().click(); await until(()=>ST().cursor===ST().startIndex,3000); return {before,state:ST(),ui:UI()};")" || exit $?
      [ "$(jq -r '.state.playing' <<<"$res")" = false ] || refuse REPLAY_STOP_FAILED "the room is still playing after stop"
      # the room's own `to the first bar` button is a NO-OP on this page (measured: cursor 321 stayed 321); the session start is reached through the jump-to field instead
      [ "$(jq -r '.state.cursor' <<<"$res")" = "$(jq -r '.state.startIndex' <<<"$res")" ] || refuse REPLAY_STOP_FAILED "paused, but the cursor is $(jq -r '.state.cursor' <<<"$res"), not the session start $(jq -r '.state.startIndex' <<<"$res")"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"stop"} + $s' ;;
    step)
      local n; n="$(flag n 1)"
      [[ "$n" =~ ^[0-9]+$ ]] && [ "$n" -ge 1 ] && [ "$n" -le 500 ] || refuse BAD_ARGS "step --n must be an integer in 1..500 (a larger loop blocks the page's event loop), got '$n'"
      res="$(pb_bt_eval "$id" "$NEED const before=ST(); for(let i=0;i<$n;i++){ const c0=ST().cursor; B('forward one bar').click(); const moved=await until(()=>ST().cursor!==c0,2500); if(!moved) break; } return {requested:$n,before,state:ST(),ui:UI()};")" || exit $?
      local moved; moved=$(( $(jq -r '.state.cursor' <<<"$res") - $(jq -r '.before.cursor' <<<"$res") ))
      [ "$moved" -gt 0 ] || refuse REPLAY_STEP_FAILED "forward one bar did not move the cursor (cursor $(jq -r '.before.cursor' <<<"$res") -> $(jq -r '.state.cursor' <<<"$res"), atEnd=$(jq -r '.state.atEnd' <<<"$res"))"
      jq -nc --argjson id "$id" --argjson s "$res" --argjson m "$moved" '{ok:true,id:$id,verb:"backtest",op:"step",moved:$m,partial:($m < $s.requested)} + $s' ;;
    speed)
      local sp; sp="$(flag speed)"
      case "$sp" in 0.5|1|2|5|10|25) ;; *) refuse SPEED_SET_FAILED "speed must be one of 0.5 1 2 5 10 25 (bars per second, the room's own select), got '${sp:-nothing}'" ;; esac
      res="$(pb_bt_eval "$id" "$NEED const before=ST(); const s=SEL(); s.value='$sp'; s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true})); await sleep(300); return {before,state:ST(),ui:UI()};")" || exit $?
      [ "$(jq -r '.ui.speedSelect' <<<"$res")" = "$sp" ] || refuse SPEED_SET_FAILED "the room's speed select reads $(jq -r '.ui.speedSelect' <<<"$res"), not $sp"
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"speed"} + $s' ;;
    date)
      local date ms; date="$(flag date)"
      [[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || refuse DATE_SET_FAILED "date must be YYYY-MM-DD, got '$date'"
      ms="$(python3 -c 'import datetime,sys; print(int(datetime.datetime.strptime(sys.argv[1],"%Y-%m-%d").replace(tzinfo=datetime.timezone.utc).timestamp()*1000))' "$date" 2>/dev/null)"
      [[ "$ms" =~ ^[0-9]+$ ]] || refuse DATE_SET_FAILED "'$date' is not a valid calendar date"
      res="$(pb_bt_eval "$id" "$NEED const before=ST(); const lo=Date.parse(before.startDate), hi=Date.parse(before.endDate)+86399999; if($ms<lo||$ms>hi) return {outside:true,lo:before.startDate,hi:before.endDate,before}; const jin=GO().parentElement.querySelector('input'); const nat=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; const dt=new Date($ms), z=(n)=>String(n).padStart(2,'0'); nat.call(jin, dt.getFullYear()+'-'+z(dt.getMonth()+1)+'-'+z(dt.getDate())+'T'+z(dt.getHours())+':'+z(dt.getMinutes())); jin.dispatchEvent(new Event('input',{bubbles:true})); jin.dispatchEvent(new Event('change',{bubbles:true})); const c0=before.cursor; GO().click(); await until(()=>ST().cursor!==c0||Date.parse(ST().now)>=$ms,3000); await sleep(200); return {requested:'$date',before,state:ST(),ui:UI(),jump:jin.value};")" || exit $?
      [ "$(jq -r '.outside // false' <<<"$res")" = false ] || refuse DATE_OUT_OF_RANGE "$date is outside the session's window ($(jq -r '.lo[0:10]' <<<"$res") .. $(jq -r '.hi[0:10]' <<<"$res"))"
      # landing rule (measured): on a day that has bars the room lands exactly on that day's first bar (>= midnight UTC, < the next midnight); on a day with no bars
      # (a weekend) it FLOORS to the last bar before the gap (within 72 h). The weekday rule is what catches a wrong-timezone jump (a UTC+4 host typed verbatim lands 4 h early).
      local dow; dow="$(date -u -d "$date" +%u)"
      if [ "$dow" -le 5 ]; then
        jq -e --argjson ms "$ms" '.state.nowMs >= $ms and .state.nowMs < ($ms + 86400000)' <<<"$res" >/dev/null \
          || refuse DATE_SET_FAILED "the room's current bar is $(jq -r '.state.now' <<<"$res"), not on $date (cursor $(jq -r '.before.cursor' <<<"$res") -> $(jq -r '.state.cursor' <<<"$res"))"
      else
        jq -e --argjson ms "$ms" '.state.nowMs <= $ms and .state.nowMs >= ($ms - 259200000)' <<<"$res" >/dev/null \
          || refuse DATE_SET_FAILED "$date has no bars (a weekend) and the room's current bar $(jq -r '.state.now' <<<"$res") is not the last bar before the gap"
      fi
      jq -nc --argjson id "$id" --argjson s "$res" '{ok:true,id:$id,verb:"backtest",op:"date"} + $s' ;;
    *) refuse BAD_ARGS "unknown backtest op '$op' (session|state|play|pause|step|speed|date|stop)" ;;
  esac
}
