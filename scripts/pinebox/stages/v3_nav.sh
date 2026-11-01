#!/usr/bin/env bash
# v3_nav.sh - P2 user intents: tabs, chart navigation, data axes, widgets.
# Every mutation is re-read after the operation; an unchanged state is a refusal. Inputs are
# validated (numbers range-checked, names allowlisted) before they reach the page's JavaScript.

# the chart renderer's handle, or {absent:true}; shared prologue for the chart expressions
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
  jq -nc --argjson id "$id" --arg a "$to" '{ok:true,id:$id,verb:"tab",active:$a}'
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
      dir="$(flag dir IN)"
      case "$dir" in IN) step=1.25 ;; OUT) step=0.8 ;; *) refuse BAD_ARGS "zoom --dir must be IN or OUT (got '$dir')" ;; esac
      js="r.zoomByStep($step);" ;;
    fit)    js="r.fitContent();" ;;
    resize)
      size="$(flag size)"; [[ "$size" =~ ^[0-9]+x[0-9]+$ ]] || refuse RESIZE_FAILED "resize needs --size WxH (digits only)"
      w="${size%x*}"; h="${size#*x}"
      pb_v3_num width "$w" 200 4000; pb_v3_num height "$h" 200 4000
      js="r.resize($w,$h);" ;;
    view) js="" ;;
    *) refuse BAD_ARGS "unknown chart op '$op' (pan|zoom|fit|view|resize)" ;;
  esac
  before="$(pb_v3_eval "$id" "$PB_CHART_SNAP")" || exit $?
  [ "$(jq -r '.absent // false' <<<"$before")" = false ] || refuse CHART_ABSENT "the chart renderer is not mounted"
  if [ -n "$js" ]; then
    res="$(pb_v3_eval "$id" "(function(){${PB_CHART_HEAD} ${js} return {ok:true};})()")" || exit $?
  fi
  after="$(pb_v3_eval "$id" "$PB_CHART_SNAP")" || exit $?
  if [ "$op" != view ] && jq -en --argjson a "$after" --argjson b "$before" '$a == $b' >/dev/null; then
    case "$op" in
      zoom) refuse ZOOM_NO_EFFECT "zoom $dir left the visible range unchanged (already at the zoom limit?)" ;;
      *)    refuse NAV_NO_EFFECT "$op left the chart state unchanged" ;;
    esac
  fi
  jq -nc --argjson id "$id" --arg op "$op" --argjson b "$before" --argjson a "$after" '{ok:true,id:$id,verb:"chart",op:$op,before:$b,after:$a}'
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
    case "$verb" in
      asset) refuse ASSET_ABSENT "the fixture has no bars for $pair at $tf" ;;
      *)     refuse TF_SET_FAILED "the fixture has no bars for $pair at $tf" ;;
    esac
  fi
  pb_rec "$id" ".nav = $(jq -nc --arg s "$sym" --arg t "$tf" '{symbol:$s,tf:$t}')"
  jq -nc --argjson id "$id" --arg v "$verb" --arg s "$sym" --arg t "$tf" --argjson r "$res" \
    '{ok:true,id:$id,verb:$v,symbol:$s,timeframe:$t,bars:$r.bars,market:$r.market}'
}

pb_nav_asset() {
  pb_v3_begin; local sym tf
  sym="$(flag symbol)"; [ -n "$sym" ] || refuse ASSET_ABSENT "asset needs --symbol DXY|EURUSD|GBPUSD"
  tf="$(flag tf)"; [ -n "$tf" ] || tf="$(pb_rec_get "$PB_ID" .nav.tf)"; tf="${tf:-1H}"
  pb_nav_load_axes asset "$sym" "$tf"
}

pb_nav_tf() {
  pb_v3_begin; local sym tf
  tf="$(flag tf)"; [ -n "$tf" ] || refuse TF_SET_FAILED "tf needs --tf 15m|30m|1H|4H"
  sym="$(flag symbol)"; [ -n "$sym" ] || sym="$(pb_rec_get "$PB_ID" .nav.symbol)"; sym="${sym:-DXY}"
  pb_nav_load_axes tf "$sym" "$tf"
}

pb_nav_widget() {
  pb_v3_begin; local id="$PB_ID" action name res want
  action="$(flag action list)"; name="$(flag name)"
  case "$action" in
    list)
      res="$(pb_v3_eval "$id" "(function(){return {widgets:Array.from(document.querySelectorAll('.pv-pane,.pine-panel,[data-widget],details')).map(e=>({id:e.id||null,cls:String(e.className||''),open:!!(e.open||e.classList.contains('pv-on'))}))};})()")" || exit $?
      jq -nc --argjson id "$id" --argjson r "$res" '{ok:true,id:$id,verb:"widget",widgets:$r.widgets}' ;;
    open|close)
      [ -n "$name" ] || refuse WIDGET_NOT_FOUND "widget --action $action needs --name"
      pb_v3_ident name "$name"      # becomes part of a CSS selector: allowlist it, never escape it
      res="$(pb_v3_eval "$id" "(function(){const e=document.querySelector('[data-widget=\"$name\"],details[name=\"$name\"]'); if(!e) return {found:false}; if('$action'==='open'){e.open=true;e.classList.add('pv-on');}else{e.open=false;e.classList.remove('pv-on');} return {found:true,open:!!(e.open||e.classList.contains('pv-on'))};})()")" || exit $?
      [ "$(jq -r '.found // false' <<<"$res")" = true ] || refuse WIDGET_NOT_FOUND "no widget named '$name'"
      want=false; [ "$action" = open ] && want=true
      [ "$(jq -r '.open' <<<"$res")" = "$want" ] || refuse WIDGET_STATE_UNCHANGED "widget '$name' did not become $action"
      jq -nc --argjson id "$id" --arg n "$name" --arg s "$action" '{ok:true,id:$id,verb:"widget",name:$n,state:$s}' ;;
    *) refuse BAD_ARGS "widget needs --action list|open|close (got '$action')" ;;
  esac
}
