#!/usr/bin/env bash
# v3_nav.sh - P2 user intents: tabs, chart navigation, data axes, widgets.
# Every mutation is re-read after the operation; an unchanged state is a refusal.

pb_nav_eval() {
  local id="$1" expr="$2"
  pb_v3_eval "$id" "$expr"
}

pb_nav_tab() {
  local id to
  id="$(flag id 0)"; pb_v3_up_guard "$id"
  to="$(flag to)"; [ -n "$to" ] || refuse TAB_NOT_FOUND "tab needs --to pine or --to backtest"
  case "$to" in pine|backtest) ;; *) refuse TAB_NOT_FOUND "unknown tab '$to' (expected pine|backtest)" ;; esac
  local page btn
  case "$to" in pine) page=pine-shell-root; btn=pine-shell ;; backtest) page=page-backtest-room; btn=backtest-room ;; esac
  local result
  result="$(pb_nav_eval "$id" "(function(){const b=document.querySelector('.nav-btn[data-page=\"$btn\"]'); if(!b) return 'TAB_NOT_FOUND'; b.click(); return document.querySelector('.pv-pane.pv-on')?.id || '';})()")"
  local active; active="$(python3 -c 'import json,sys; print(json.loads(sys.stdin.read()))' <<<"$result")"
  [ "$active" = "$page" ] || refuse TAB_SWITCH_FAILED "tab $to did not become active (got '$active')"
  printf '{"ok":true,"id":%s,"verb":"tab","active":"%s"}\n' "$id" "$to"
}
pb_nav_chart() {

  local id op before after
  id="$(flag id 0)"; pb_v3_up_guard "$id"
  op="$(flag op)"; [ -n "$op" ] || refuse BAD_ARGS "chart needs --op pan|zoom|fit|view|resize"
  before="$(pb_nav_eval "$id" "(function(){const P=window.PlutusPineShell; return {range:P.chart.getVisibleRange?.(), width:P.chart.rendererControl.renderer.coords.width, height:P.chart.rendererControl.renderer.coords.height};})()")"
  case "$op" in
    pan)
      local dx dy; dx="$(flag dx 1)"; dy="$(flag dy 0)"
      pb_nav_eval "$id" "(function(){const P=window.PlutusPineShell; const r=P.chart.rendererControl.renderer; r.panBy(Number($dx)); return P.chart.getVisibleRange?.();})()" >/dev/null || exit $? ;;
    zoom)
      local dir at; dir="$(flag dir IN)"; at="$(flag at)"
      [ "$dir" = IN ] || [ "$dir" = OUT ] || refuse BAD_ARGS "zoom --dir must be IN or OUT"
      local step=1.25; [ "$dir" = OUT ] && step=0.8
      pb_nav_eval "$id" "(function(){const P=window.PlutusPineShell; const r=P.chart.rendererControl.renderer; r.zoomByStep($step); return P.chart.getVisibleRange?.();})()" >/dev/null || exit $? ;;
    fit)
      pb_nav_eval "$id" "(function(){const P=window.PlutusPineShell; const r=P.chart.rendererControl.renderer; r.fitContent(); return P.chart.getVisibleRange?.();})()" >/dev/null || exit $? ;;
    resize)
      local wh; wh="$(flag size)"; [[ "$wh" =~ ^[0-9]+x[0-9]+$ ]] || refuse RESIZE_FAILED "resize needs --size WxH"
      local w="${wh%x*}" h="${wh#*x}"
      pb_nav_eval "$id" "(function(){const P=window.PlutusPineShell; const r=P.chart.rendererControl.renderer; r.resize($w,$h); return {width:r.coords.width,height:r.coords.height};})()" >/dev/null || exit $? ;;
    view) ;;
    *) refuse BAD_ARGS "unknown chart op '$op'" ;;
  esac
  after="$(pb_nav_eval "$id" "(function(){const P=window.PlutusPineShell; return {range:P.chart.getVisibleRange?.(), width:P.chart.rendererControl.renderer.coords.width, height:P.chart.rendererControl.renderer.coords.height};})()")"
  if [ "$op" != view ] && [ "$before" = "$after" ]; then
    case "$op" in zoom) refuse ZOOM_NO_EFFECT "zoom left the visible range unchanged" ;; *) refuse NAV_NO_EFFECT "$op left the chart state unchanged" ;; esac
  fi
  printf '{"ok":true,"id":%s,"verb":"chart","op":"%s","before":%s,"after":%s}\n' "$id" "$op" "$before" "$after"
}

pb_nav_asset() {
  local id sym result
  id="$(flag id 0)"; pb_v3_up_guard "$id"
  sym="$(flag symbol)"; [ -n "$sym" ] || refuse ASSET_ABSENT "asset needs --symbol DXY or EURUSD"
  case "$sym" in DXY|EURUSD|GBPUSD) ;; *) refuse ASSET_ABSENT "unsupported instrument '$sym' (fixture carries DXY, EURUSD, GBPUSD)" ;; esac
  local pair="$sym"; case "$sym" in EURUSD) pair="EUR/USD" ;; GBPUSD) pair="GBP/USD" ;; esac
  result="$(pb_nav_eval "$id" "(async function(){const P=window.PlutusPineShell; const r=await P.loadBars({pair:'$pair',timeframe:'1H'}); return {ok:r.ok,market:P.workbench.market, bars:(P.workbench.getBars()||[]).length};})()")"
  [ "$(jq -r '.ok' <<<"$result")" = true ] || {
    [ "$(jq -r '.bars // 0' <<<"$result")" -eq 0 ] && refuse ASSET_ABSENT "the fixture has no bars for $pair at 1H"
    refuse ASSET_SET_FAILED "loadBars did not accept $sym: $result"
  }
  printf '{"ok":true,"id":%s,"verb":"asset","symbol":"%s","market":%s}\n' "$id" "$sym" "$(jq -c '.market' <<<"$result")"
}

pb_nav_tf() {
  local id tf result
  id="$(flag id 0)"; pb_v3_up_guard "$id"
  tf="$(flag tf)"; [ -n "$tf" ] || refuse TF_SET_FAILED "tf needs --tf 15m|30m|1H|4H"
  case "$tf" in 15m|30m|1H|4H) ;; *) refuse TF_SET_FAILED "unsupported timeframe '$tf' (fixture carries 15m,30m,1H,4H)" ;; esac
  result="$(pb_nav_eval "$id" "(async function(){const P=window.PlutusPineShell; const r=await P.loadBars({pair:'DXY',timeframe:'$tf'}); return {ok:r.ok,market:P.workbench.market, bars:(P.workbench.getBars()||[]).length};})()")"
  [ "$(jq -r '.ok' <<<"$result")" = true ] || {
    [ "$(jq -r '.bars // 0' <<<"$result")" -eq 0 ] && refuse TF_SET_FAILED "the fixture has no bars for DXY at $tf"
    refuse TF_SET_FAILED "loadBars did not accept timeframe $tf: $result"
  }
  printf '{"ok":true,"id":%s,"verb":"tf","timeframe":"%s","market":%s}\n' "$id" "$tf" "$(jq -c '.market' <<<"$result")"
}

pb_nav_widget() {
  local id action name result
  id="$(flag id 0)"; pb_v3_up_guard "$id"
  action="$(flag action list)"; name="$(flag name)"
  case "$action" in
    list)
      result="$(pb_nav_eval "$id" "Array.from(document.querySelectorAll('.pv-pane,.pine-panel,[data-widget],details')).map(e=>({id:e.id||null,cls:e.className,open:e.open||e.classList.contains('pv-on')}))")"
      printf '{"ok":true,"id":%s,"verb":"widget","widgets":%s}\n' "$id" "$result" ;;
    open|close)
      [ -n "$name" ] || refuse WIDGET_NOT_FOUND "widget needs --name"
      result="$(pb_nav_eval "$id" "(function(){const e=document.querySelector('[data-widget=\"$name\"],details[name=\"$name\"]'); if(!e) return 'WIDGET_NOT_FOUND'; if('$action'==='open'){e.open=true;e.classList.add('pv-on')}else{e.open=false;e.classList.remove('pv-on')} return {open:e.open||e.classList.contains('pv-on')};})()")"
      case "$result" in \{*) ;; *) refuse WIDGET_NOT_FOUND "no widget named $name" ;; esac
      local want=false; [ "$action" = open ] && want=true
      [ "$(jq -r '.open' <<<"$result")" = "$want" ] || refuse WIDGET_STATE_UNCHANGED "$name did not change to $action"
      printf '{"ok":true,"id":%s,"verb":"widget","name":"%s","state":"%s"}\n' "$id" "$name" "$action" ;;
    *) refuse BAD_ARGS "widget needs --action list|open|close" ;;
  esac
}
