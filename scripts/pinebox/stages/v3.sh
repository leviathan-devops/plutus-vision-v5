#!/usr/bin/env bash
. "$PB_HOME/stages/load.sh"
# v3.sh - the user-intent verbs (P1): run, insert, editor, look.
# Every verb either performs the action and returns measured evidence, or refuses
# with a token. No verb reports a render it did not capture.

pb_v3_eval() {
  local id="$1" expr="$2" cdp result
  cdp="$(pb_port "$id" cdp)"
  result="$(node "$CORE/cdp.mjs" "$cdp" evaluate "$expr" 2>"$PINEBOX_ROOT/i$id/v3-eval.err")" \
    || refuse EVAL_FAILED "$(tail -1 "$PINEBOX_ROOT/i$id/v3-eval.err")"
  printf '%s\n' "$result" | jq -c '.value // empty'
}

pb_v3_up_guard() {
  local id="$1"
  [ -s "$(pb_dir "$id")/state.json" ] || refuse NOT_UP "pinebox instance $id is not up"
}

pb_v3_insert() {
  local id d pine pair tf
  id="$(flag id 0)"; d="$(pb_dir "$id")"; pb_v3_up_guard "$id"
  pine="$(flag pine)"; pair="$(flag pair DXY)"; tf="$(flag tf 1H)"
  [ -n "$pine" ] || refuse PINE_ABSENT "insert needs --pine FILE"
  [ -f "$pine" ] || refuse PINE_ABSENT "no such pine source: $pine"
  local abs="$pine"; case "$abs" in /*) ;; *) abs="$PWD/$abs" ;; esac
  local src_json
  src_json="$(jq -Rs . "$abs")"
  pb_v3_eval "$id" "(function(){const P=window.PlutusPineShell; if(!P||!P.editor) return 'EDITOR_ABSENT'; P.editor.setSource($src_json); P.editor.flush(); return P.editor.getSource().length;})()"
  local result
  result="$(pb_v3_eval "$id" "(function(){const P=window.PlutusPineShell; return {chars:P.editor.getSource().length, source:P.editor.getSource()};})()")"
  [ "$(jq -r '.chars // 0' <<<"$result")" -gt 0 ] || refuse EDITOR_ABSENT "the editor did not accept the source"
  pb_rec "$id" ".editor = $(jq -nc --argjson result "$result" '{chars:$result.chars}')"
  printf '{"ok":true,"id":%s,"verb":"insert","chars":%s}\n' "$id" "$(jq -r '.chars' <<<"$result")"
}

pb_v3_run() {
  local id d pine pair tf
  id="$(flag id 0)"; d="$(pb_dir "$id")"; pb_v3_up_guard "$id"
  pine="$(flag pine)"; pair="$(flag pair DXY)"; tf="$(flag tf 1H)"
  [ -n "$pine" ] || refuse PINE_ABSENT "run needs --pine FILE"
  [ -f "$pine" ] || refuse PINE_ABSENT "no such pine source: $pine"
  pb_v3_insert "$id" >/dev/null || exit $?
  stage_load "$id" "$d" "$pine" "$pair" "$tf" || exit $?
  local result frame
  result="$(pb_rec_get "$id" .load.result)"
  [ -n "$result" ] || refuse NO_DRAWINGS "the run produced no measured result"
  frame="$(pb_rec_get "$id" .frame.path)"
  printf '{"ok":true,"id":%s,"verb":"run","bars":%s,"onChart":%s,"counts":%s,"frame":%s}\n' \
    "$id" "$(jq -r '.bars // 0' <<<"$result")" "$(jq -r '.onChart // 0' <<<"$result")" \
    "$(jq -c '.counts // {}' <<<"$result")" "$(jq -nc --arg f "$frame" '$f')"
}

pb_v3_editor() {
  local id="$1" mode text
  id="$(flag id 0)"; pb_v3_up_guard "$id"
  mode="$(flag mode get)"; text="$(flag text)"
  case "$mode" in
    get)
      local result; result="$(pb_v3_eval "$id" "(function(){const P=window.PlutusPineShell; return {source:P.editor.getSource()};})()")"
      printf '%s\n' "$(jq -nc --argjson result "$result" '{ok:true,verb:"editor",source:$result.source}')" ;;
    set)
      [ -n "$text" ] || refuse EDITOR_ABSENT "editor --set needs --text"
      local result; result="$(pb_v3_eval "$id" "(function(){const P=window.PlutusPineShell; P.editor.setSource($(jq -nc --arg t "$text" '$t')); P.editor.flush(); return {chars:P.editor.getSource().length};})()")"
      printf '%s\n' "$(jq -nc --argjson result "$result" '{ok:true,verb:"editor",chars:$result.chars}')" ;;
    *) refuse BAD_ARGS "editor needs --mode get or --mode set" ;;
  esac
}

pb_v3_look() {
  local id="$1" d out frame
  id="$(flag id 0)"; pb_v3_up_guard "$id"
  d="$(pb_dir "$id")"
  out="$(flag out "$d/look.png")"
  frame="$("$COMPUTER" screenshot --id "$id" --out "$out" 2>"$d/look.err")" \
    || refuse CAPTURE_FAILED "$(tail -1 "$d/look.err")"
  [ "$(jq -r '.colours // 0' <<<"$frame")" -gt 1 ] || refuse FRAME_BLANK "the captured frame is blank"
  local sha; sha="$(sha256sum "$out" | cut -c1-16)"
  pb_rec "$id" ".look = $(jq -nc --argjson f "$frame" --arg sha "$sha" '{path:$f.path,bytes:$f.bytes,colours:$f.colours,sha:$sha}')"
  printf '{"ok":true,"id":%s,"verb":"look","frame":%s}\n' "$id" "$(jq -c '{path,bytes,colours,via}' <<<"$frame")"
}
