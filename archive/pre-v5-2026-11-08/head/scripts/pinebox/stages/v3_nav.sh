#!/usr/bin/env bash
# v3_nav.sh - P2 user intents: tabs, chart navigation, data axes, widgets.
# Every mutation is re-read after the operation; an unchanged state is a refusal. Inputs are
# validated (numbers range-checked, names allowlisted) before they reach the page's JavaScript.

# the chart renderer's handle, or {absent:true}; shared prologue for the chart expressions
# pb_chart_wait_still ID: wait in the page until the chart's viewport holds still for 6 animation frames (bounded 4 s) - pan, zoom and fit glide
# (F-199), and a capture taken mid-glide is a stale frame (F-177) - then ask the scheduler to paint now. A page with no chart renderer returns at once.
pb_chart_wait_still() {
  pb_v3_eval "$1" "new Promise(res=>{const P=window.PlutusPineShell; const r=P?.chart?.rendererControl?.renderer; if(!r) return res({absent:true}); let last='', still=0; const t0=performance.now(); (function f(){ const v=JSON.stringify(r.coords.getViewport()); still = v===last ? still+1 : 0; last=v; if(still>=6 || performance.now()-t0>4000){ r.scheduler.invalidate(1); r.scheduler.flushNow(); res({still:still>=6, ms:Math.round(performance.now()-t0)}); } else requestAnimationFrame(f); })(); })"
}

PB_CHART_HEAD="const P=window.PlutusPineShell; const r=P?.chart?.rendererControl?.renderer; if(!r) return {absent:true};"
PB_CHART_SNAP="(function(){${PB_CHART_HEAD} return {range:P.chart.getVisibleRange?.()??null,width:r.coords?.width??null,height:r.coords?.height??null};})()"

pb_nav_tab() {
  pb_v3_begin; local id="$PB_ID" to page btn res active
  to="$(flag to)"
  case "$to" in
    pine)     page=pine-shell-root;  btn=pine-shell ;;
    backtest) page=page-backtest-room; btn=backtest-room ;;
    *) refuse TAB_NOT_FOUND "tab needs --to pine|backtest (got '$to')" ;;
  esac
  res="$(pb_v3_eval "$id" "(function(){const b=document.querySelector('.nav-btn[data-page=\"$btn\"]'); if(!b) return {missing:true}; b.click(); return {active:document.querySelector('.pv-pane.pv-on')?.id||''};})()")" || exit $?
  [ "$(jq -r '.missing // false' <<<"$res")" = false ] || refuse TAB_NOT_FOUND "no navigation button for '$to' on this page"
  active="$(jq -r '.active' <<<"$res")"
  [ "$active" = "$page" ] || refuse TAB_SWITCH_FAILED "tab $to did not become active (the active pane is '$active')"
  # READY, not just ACTIVE (W8, 2026-11-03): the shell RE-MOUNTS a tab's content on activation, and `ok` came back before the IDE had
  # re-mounted (measured: the week input read empty right after `tab --to pine` returned; the restored value appeared a moment later), so
  # the next verb read a half-mounted page. Poll the TARGET's own readiness, bounded, and refuse by name when it never arrives.
  local ready_js r="" i
  case "$to" in
    pine) ready_js="(function(){const P=document.querySelector('#pine-shell-root'); const w=P&&P.querySelector('.pine-week'); const rr=window.PlutusPineShell&&window.PlutusPineShell.chart&&window.PlutusPineShell.chart.rendererControl&&window.PlutusPineShell.chart.rendererControl.renderer; let s=null; try{s=localStorage.getItem('plutus.pine.week')}catch(e){} const valid=typeof s==='string'&&/^\d{4}-W\d{2}$|^\d{4}-\d{2}-\d{2}$/.test(s); const wk=!!w&&(!valid||w.value===s); return {ready:!!(w&&rr&&wk&&P.querySelector('canvas')), week:w?w.value:null, stored:s, renderer:!!rr};})()" ;;
    backtest) ready_js="(function(){const P=document.querySelector('#page-backtest-room'); const R=window.PlutusBacktestRoom; const sel=!!P&&[...P.querySelectorAll('select')].some(s=>[...s.options].some(o=>o.value==='0.5')); const tl=!!P&&!!P.querySelector('input[type=range]'); return {ready:!!(R&&sel&&tl), room:!!R, speed:sel, timeline:tl};})()" ;;
  esac
  for i in $(seq 1 80); do
    r="$(pb_v3_eval "$id" "$ready_js")" || exit $?
    [ "$(jq -r '.ready' <<<"$r")" = true ] && break
    sleep 0.25
  done
  [ "$(jq -r '.ready' <<<"$r")" = true ] || refuse TAB_NOT_READY "tab $to is active but its content did not finish mounting within 20 s: $r"
  jq -nc --argjson id "$id" --arg a "$to" --argjson r "$r" '{ok:true,id:$id,verb:"tab",active:$a,ready:$r}'
}

pb_nav_chart() {
  pb_v3_begin; local id="$PB_ID" op before after step dx dy dir size w h js res
  op="$(flag op)"; [ -n "$op" ] || refuse BAD_ARGS "chart needs --op pan|zoom|fit|view|resize"
  case "$op" in
    pan)
      dx="$(flag dx 1)"; dy="$(flag dy 0)"
      pb_v3_num dx "$dx" -1000 1000
      # the renderer's panBy is horizontal; a non-zero dy would be silently dropped, so refuse it
      awk -v v="$dy" 'BEGIN{exit !(v+0==0)}' 2>/dev/null || refuse BAD_ARGS "vertical pan (--dy) is not supported by the chart renderer; use --dx"
      js="r.panBy(Number($dx));" ;;
    zoom)
      dir="$(flag dir IN)"; dir="${dir^^}"                       # IN/OUT in any case: `--dir in` is what an agent types first
      case "$dir" in IN) step=1 ;; OUT) step=-1 ;;   # zoomByStep(direction) is exp(direction*KEY_ZOOM_STEP) (workbench.bundle.js:37454): a SIGN, not a factor - 1.25 and 0.8 both zoomed IN (F-200)
      *) refuse BAD_ARGS "zoom --dir must be IN or OUT (got '$dir')" ;; esac
      js="r.zoomByStep($step);" ;;
    fit)
      # "frame ALL loaded bars" (blueprint P2: the "I cannot see anything" fix). The renderer's own fitContent() frames only the LAST 200 bars (measured on 508 loaded: 201 in
      # view, FEWER than the 382 the chart opens with), so it is not used; the same viewport math is applied to every bar. NO_BARS when nothing is loaded.
      # MECHANISM (measured, 508 bars): the page's clampViewport cannot zoom out past n + ZOOM_OUT_MARGIN_BARS (workbench.bundle.js:35102, = 6) bars, while the style's right
      # margin is 10: asking for n+10 was clamped to n+6 and the 3 oldest bars fell off the left edge (505 of 508 in view). So: try the style margin, then smaller ones, until the
      # renderer's OWN visible range reaches the first bar; the page decides what is reachable, no constant is copied here.
      js="const n=r.coords.barCount; if(!(n>0)) return {nobars:true}; r.animator?.stop(); r.panVelocity=0; const rt0=r.scene.style.margins.right; for(let rt=rt0; rt>=0; rt--){ const v=r.clampViewport(r.coords.width/((n+rt)*r.coords.spacingScale), rt); r.coords.setViewport(v); r.targetBarSpacing=v.barSpacing; const vr=P.chart.getVisibleRange(); if(vr && vr.from<=r.bars[0].time && vr.to>=r.bars[n-1].time) break; }" ;;
    resize)
      size="$(flag size)"; [[ "$size" =~ ^[0-9]+x[0-9]+$ ]] || refuse RESIZE_FAILED "resize needs --size WxH (digits only)"
      w="${size%x*}"; h="${size#*x}"
      pb_v3_num width "$w" 200 4000; pb_v3_num height "$h" 200 4000
      refuse RESIZE_UNSUPPORTED "the renderer's resize() takes no size: it is 'resize() { this.syncSize(); }' (workbench.bundle.js:36404-36405), the chart always fills its container (measured: 934x686 in a 998x708 mount before and after resize 900x600); to change the chart's size change the window, not the chart" ;;
    view) js="" ;;
    *) refuse BAD_ARGS "unknown chart op '$op' (pan|zoom|fit|view|resize)" ;;
  esac
  before="$(pb_v3_eval "$id" "$PB_CHART_SNAP")" || exit $?
  [ "$(jq -r '.absent // false' <<<"$before")" = false ] || refuse CANVAS_ABSENT "the chart canvas is not on the page (no renderer mounted): nothing to pan, zoom, fit or read"
  if [ -n "$js" ]; then
    res="$(pb_v3_eval "$id" "(function(){${PB_CHART_HEAD} ${js} return {ok:true};})()")" || exit $?
    # F-199 ROOT CAUSE (workbench.bundle.js panBy -> glideRightOffset, zoomByStep -> zoomTo): pan and zoom ANIMATE. The verb used to return and read
    # `after` mid-glide, and a shot/verify right after it saw a chart still moving. Wait until the viewport is still, then read `after`.
    [ "$(jq -r '.nobars // false' <<<"$res")" = true ] || pb_chart_wait_still "$id" >/dev/null || exit $?
    [ "$(jq -r '.nobars // false' <<<"$res")" = false ] || refuse NO_BARS "the chart holds no bars: there is nothing to frame (load a script first)"
  fi
  after="$(pb_v3_eval "$id" "$PB_CHART_SNAP")" || exit $?
  if [ "$op" != view ] && jq -en --argjson a "$after" --argjson b "$before" '$a == $b' >/dev/null; then
    case "$op" in
      zoom) refuse ZOOM_NO_EFFECT "zoom $dir left the visible range unchanged (already at the zoom limit?)" ;;
      *)    refuse NAV_NO_EFFECT "$op left the chart state unchanged" ;;
    esac
  fi
  if [ "$op" = fit ]; then
    # the read-back that matters: every loaded bar is in view (the renderer's own visible range reaches the FIRST bar and the LAST)
    local cover; cover="$(pb_v3_eval "$id" "(function(){${PB_CHART_HEAD} const vr=P.chart.getVisibleRange(); const n=r.bars.length; return {total:n,first:r.bars[0].time,last:r.bars[n-1].time,vr,all:!!vr&&vr.from<=r.bars[0].time&&vr.to>=r.bars[n-1].time};})()")" || exit $?
    [ "$(jq -r '.all' <<<"$cover")" = true ] || refuse FIT_INCOMPLETE "fit left part of the $(jq -r '.total' <<<"$cover") loaded bars out of view (range $(jq -c '.vr' <<<"$cover"), bars $(jq -r '.first' <<<"$cover")..$(jq -r '.last' <<<"$cover"))"
    after="$(jq -c --argjson c "$cover" '. + {allBarsInView:true,total:$c.total}' <<<"$after")"
  fi
  local settled_ms=0; [ "$op" != view ] && { settled_ms="$(pb_chart_settle "$id")" || exit $?; }
  jq -nc --argjson id "$id" --arg op "$op" --argjson b "$before" --argjson a "$after" --argjson s "$settled_ms" '{ok:true,id:$id,verb:"chart",op:$op,before:$b,after:$a,settled_ms:$s}'
}

# asset and tf share ONE loader so they COMPOSE: each takes the other's current value from the
# instance record (default DXY / 1H) instead of silently resetting it.
pb_nav_load_axes() {   # VERB SYMBOL TF
  local verb="$1" sym="$2" tf="$3" id="$PB_ID" pair res ok bars
  case "$sym" in DXY) pair=DXY ;; EURUSD) pair="EUR/USD" ;; GBPUSD) pair="GBP/USD" ;; *) refuse ASSET_ABSENT "unsupported instrument '$sym' (DXY, EURUSD, GBPUSD)" ;; esac
  case "$tf" in 15m|30m|1H|4H) ;; *) refuse TF_SET_FAILED "unsupported timeframe '$tf' (15m, 30m, 1H, 4H)" ;; esac
  res="$(pb_v3_eval "$id" "(async function(){const P=window.PlutusPineShell; if(!P) return {absent:true}; const r=await P.loadBars({pair:'$pair',timeframe:'$tf'}); return {ok:!!(r&&r.ok),bars:(P.workbench.getBars()||[]).length,market:P.workbench.market??null};})()")" || exit $?
  [ "$(jq -r '.absent // false' <<<"$res")" = false ] || refuse EDITOR_ABSENT "the Pine shell is not mounted"
  ok="$(jq -r '.ok' <<<"$res")"; bars="$(jq -r '.bars // 0' <<<"$res")"
  if [ "$ok" != true ] || ! [[ "$bars" =~ ^[0-9]+$ ]] || [ "$bars" -eq 0 ]; then
    # ROLL BACK (T-60, F-184): a refused load used to leave the page on the refused axes - a blank chart under a FIXTURE_CELL_ABSENT toast - while the record said
    # the old axes were current. Put the previous axes back, and say whether that worked.
    local psym ptf ppair rb rbn
    psym="$(pb_rec_get "$id" .nav.symbol)"; psym="${psym:-DXY}"; ptf="$(pb_rec_get "$id" .nav.tf)"; ptf="${ptf:-1H}"
    case "$psym" in DXY) ppair=DXY ;; EURUSD) ppair="EUR/USD" ;; GBPUSD) ppair="GBP/USD" ;; *) ppair=DXY ;; esac
    rb="$(pb_v3_eval "$id" "(async function(){const P=window.PlutusPineShell; const r=await P.loadBars({pair:'$ppair',timeframe:'$ptf'}); return {ok:!!(r&&r.ok),bars:(P.workbench.getBars()||[]).length};})()" 2>/dev/null)" || rb='{}'
    rbn="$(jq -r '.bars // 0' <<<"$rb" 2>/dev/null)"
    if [ "$(jq -r '.ok // false' <<<"$rb" 2>/dev/null)" = true ] && [ "${rbn:-0}" -gt 0 ] 2>/dev/null; then rb="; the page was put back on $ppair $ptf ($rbn bars)"; else rb="; ROLLBACK FAILED: the page may still show the refused axes - reload with: pinebox load"; fi
    case "$verb" in
      asset) refuse ASSET_ABSENT "the fixture has no bars for $pair at $tf$rb" ;;
      *)     refuse TF_SET_FAILED "the fixture has no bars for $pair at $tf$rb" ;;
    esac
  fi
  # READ BACK (v3 expansion section E: ASSET_SET_FAILED / TF_SET_FAILED): bars loaded is not the same as the selector having taken the value - the
  # page's own market must now name the requested instrument and timeframe (measured shape: {symbol:"fixture:DXY", timeframe:"60"}).
  local msym mtf want_tf; msym="$(jq -r '.market.symbol // ""' <<<"$res")"; mtf="$(jq -r '.market.timeframe // ""' <<<"$res")"
  case "$tf" in 15m) want_tf=15 ;; 30m) want_tf=30 ;; 1H) want_tf=60 ;; 4H) want_tf=240 ;; esac
  case "$msym" in *"$pair"|*"${pair//\//}") ;; *) [ "$verb" = asset ] && refuse ASSET_SET_FAILED "the page loaded $bars bars but its market is '$msym', not $pair: the instrument selector did not take the value" ;; esac
  [ "$mtf" = "$want_tf" ] || { [ "$verb" = tf ] && refuse TF_SET_FAILED "the page loaded $bars bars but its timeframe is '$mtf', not $tf ($want_tf)"; }
  pb_rec "$id" ".nav = $(jq -nc --arg s "$sym" --arg t "$tf" '{symbol:$s,tf:$t}')"
  jq -nc --argjson id "$id" --arg v "$verb" --arg s "$sym" --arg t "$tf" --argjson r "$res" \
    '{ok:true,id:$id,verb:$v,symbol:$s,timeframe:$t,bars:$r.bars,market:$r.market}'
}

# `--get`: what the page ITSELF holds now (the loaded market and bar count), next to what the record says
pb_nav_get() {
  local id="$PB_ID" res
  res="$(pb_v3_eval "$id" "(function(){const P=window.PlutusPineShell; if(!P) return {absent:true}; return {bars:(P.workbench.getBars()||[]).length,market:P.workbench.market||null};})()")" || exit $?
  [ "$(jq -r '.absent // false' <<<"$res")" = false ] || refuse EDITOR_ABSENT "the Pine shell is not mounted"
  jq -nc --argjson id "$id" --arg s "$(pb_rec_get "$id" .nav.symbol)" --arg t "$(pb_rec_get "$id" .nav.tf)" --argjson r "$res" '{ok:true,id:$id,recorded:{symbol:($s|if .=="" then "DXY" else . end),timeframe:($t|if .=="" then "1H" else . end)},page:$r}'
}
pb_nav_asset() {
  pb_v3_begin; local sym tf
  [ -n "$(flag get)" ] && { pb_nav_get; return; }
  sym="$(flag symbol)"; [ -n "$sym" ] || sym="$(flag set)"; [ -n "$sym" ] || refuse ASSET_ABSENT "asset needs --symbol DXY|EURUSD|GBPUSD"
  tf="$(flag tf)"; [ -n "$tf" ] || tf="$(pb_rec_get "$PB_ID" .nav.tf)"; tf="${tf:-1H}"
  pb_nav_load_axes asset "$sym" "$tf"
}

pb_nav_tf() {
  pb_v3_begin; local sym tf
  [ -n "$(flag get)" ] && { pb_nav_get; return; }
  tf="$(flag tf)"; [ -n "$tf" ] || tf="$(flag set)"; [ -n "$tf" ] || refuse TF_SET_FAILED "tf needs --tf 15m|30m|1H|4H"
  sym="$(flag symbol)"; [ -n "$sym" ] || sym="$(pb_rec_get "$PB_ID" .nav.symbol)"; sym="${sym:-DXY}"
  pb_nav_load_axes tf "$sym" "$tf"
}

pb_nav_widget() {
  # WIDGETS (blueprint F): the toggles the operator means by "open and close all of the widgets". Discovered on the page (T-60): the Pine shell's layout toggles
  # `.pine-lay-btn` (EDITOR, FACE, VERDICT, FOCUS), each carrying aria-pressed. The blueprint's `[data-widget]` / `details[name]` selectors match NOTHING on this page
  # (measured: 0 elements), so open/close could never succeed; the state is read back from aria-pressed AND the pane the toggle owns.
  pb_v3_begin; local id="$PB_ID" action name res want
  action="$(flag action list)"; name="$(flag name)"
  local HEAD="const L=[...document.querySelectorAll('.pine-lay-btn')].map(b=>({name:(b.textContent||'').replace(/[^A-Za-z]/g,'').toLowerCase(),pressed:b.getAttribute('aria-pressed')==='true',el:b}));
   const view=()=>L.map(x=>({name:x.name,pressed:x.el.getAttribute('aria-pressed')==='true'}));"
  case "$action" in
    list)
      res="$(pb_v3_eval "$id" "(function(){${HEAD} return {widgets:view(),panes:Array.from(document.querySelectorAll('.pv-pane')).map(e=>({id:e.id,open:e.classList.contains('pv-on')}))};})()")" || exit $?
      [ "$(jq -r '.widgets|length' <<<"$res")" -gt 0 ] || refuse WIDGET_NOT_FOUND "the page has no .pine-lay-btn toggles (is the Pine IDE tab mounted?)"
      jq -nc --argjson id "$id" --argjson r "$res" '{ok:true,id:$id,verb:"widget",widgets:$r.widgets,panes:$r.panes}' ;;
    open|close)
      [ -n "$name" ] || refuse WIDGET_NOT_FOUND "widget --action $action needs --name editor|face|verdict|focus"
      pb_v3_ident name "$name"
      want=false; [ "$action" = open ] && want=true
      res="$(pb_v3_eval "$id" "(async function(){${HEAD} const w=L.find(x=>x.name==='$name'); if(!w) return {found:false,names:view().map(x=>x.name)}; const before=w.pressed; if(before!==$want){ w.el.click(); const t=Date.now(); while(Date.now()-t<2500 && (w.el.getAttribute('aria-pressed')==='true')!==$want) await new Promise(s=>setTimeout(s,60)); } return {found:true,before,after:w.el.getAttribute('aria-pressed')==='true',all:view()};})()")" || exit $?
      [ "$(jq -r '.found // false' <<<"$res")" = true ] || refuse WIDGET_NOT_FOUND "no widget named '$name' (the toggles are: $(jq -r '.names|join(", ")' <<<"$res"))"
      [ "$(jq -r '.after' <<<"$res")" = "$want" ] || refuse WIDGET_STATE_UNCHANGED "widget '$name' did not become $action (aria-pressed still $(jq -r '.after' <<<"$res"))"
      jq -nc --argjson id "$id" --arg n "$name" --arg s "$action" --argjson r "$res" '{ok:true,id:$id,verb:"widget",name:$n,state:$s,changed:($r.before != $r.after),widgets:$r.all}' ;;
    *) refuse BAD_ARGS "widget needs --action list|open|close (got '$action')" ;;
  esac
}
