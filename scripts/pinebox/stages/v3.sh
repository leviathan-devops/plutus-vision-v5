#!/usr/bin/env bash
# v3.sh - the user-intent verbs (P1): run, insert, editor, look; plus the helpers every v3 verb
# shares (pb_v3_begin / pb_v3_eval / pb_v3_num / pb_v3_ident).
#
# CONTRACT. A verb either performs the action and prints ONE JSON line of measured evidence,
# or REFUSES with a named token (rc 1). Nothing a caller passes is ever spliced raw into the
# page's JavaScript: numbers are range-checked, names are allowlisted, text is jq-encoded.

# pb_v3_begin: parse --id (a canonical decimal), set PB_ID, and require the instance to be up.
pb_v3_begin() {
  pb_bind
  PB_ID="$ID"
  [ -s "$(pb_dir "$PB_ID")/state.json" ] || refuse NOT_UP "pinebox instance $PB_ID is not up"
}

# pb_v3_eval ID EXPRESSION -> the expression's value as one JSON line on stdout.
# Refuses EVAL_FAILED on a dead CDP, a thrown exception, or a null result (every expression
# these verbs send returns an object/number/string, so null means "the page gave no answer").
# Callers MUST write:   v="$(pb_v3_eval ...)" || exit $?
# (a refusal inside $(...) only ends the substitution - the caller propagates it.)
pb_v3_eval() {
  local id="$1" expr="$2" cdp raw val err
  cdp="$(pb_port "$id" cdp)" || exit $?
  err="$(pb_dir "$id")/v3-eval.err"
  raw="$(node "$CORE/cdp.mjs" "$cdp" evaluate "$expr" 2>"$err")" \
    || refuse EVAL_FAILED "$(tail -1 "$err" | cut -c1-300)"
  val="$(jq -c 'select(has("value")) | .value' <<<"$raw" 2>/dev/null)"
  if [ -z "$val" ] || [ "$val" = null ]; then refuse EVAL_FAILED "the page returned no value for the expression"; fi
  printf '%s\n' "$val"
}

# pb_v3_num NAME VALUE MIN MAX: a decimal number inside [MIN,MAX], or refuse BAD_ARGS.
pb_v3_num() {
  [[ "$2" =~ ^-?[0-9]+(\.[0-9]+)?$ ]] || refuse BAD_ARGS "$1 must be a number, got '$2'"
  awk -v v="$2" -v lo="$3" -v hi="$4" 'BEGIN{exit !(v+0>=lo+0 && v+0<=hi+0)}' \
    || refuse BAD_ARGS "$1 must be within [$3,$4], got '$2'"
}

# pb_v3_ident NAME VALUE: [A-Za-z0-9_-]{1,64}, or refuse BAD_ARGS (used wherever a name
# becomes part of a CSS selector).
pb_v3_ident() {
  [[ "$2" =~ ^[A-Za-z0-9_-]{1,64}$ ]] || refuse BAD_ARGS "$1 must match [A-Za-z0-9_-]{1,64}, got '$2'"
}

pb_v3_insert() {
  pb_v3_begin; local id="$PB_ID" pine src_json res chars absent
  pine="$(flag pine)"
  [ -n "$pine" ] || refuse PINE_ABSENT "insert needs --pine FILE"
  case "$pine" in /*) ;; *) pine="$PWD/$pine" ;; esac
  [ -f "$pine" ] || refuse PINE_ABSENT "no such pine source: $pine"
  src_json="$(jq -Rs . "$pine")" || refuse PINE_UNREADABLE "could not encode $pine"
  res="$(pb_v3_eval "$id" "(function(){const P=window.PlutusPineShell; if(!P||!P.editor) return {absent:true}; P.editor.setSource($src_json); P.editor.flush(); return {chars:P.editor.getSource().length};})()")" || exit $?
  absent="$(jq -r '.absent // false' <<<"$res")"
  [ "$absent" = false ] || refuse EDITOR_ABSENT "the Pine editor is not mounted on this page"
  chars="$(jq -r '.chars // 0' <<<"$res")"
  [[ "$chars" =~ ^[0-9]+$ ]] && [ "$chars" -gt 0 ] || refuse EDITOR_ABSENT "the editor accepted the source but reads back empty"
  pb_rec "$id" ".editor = $(jq -nc --argjson c "$chars" '{chars:$c}')"
  jq -nc --argjson id "$id" --argjson c "$chars" '{ok:true,id:$id,verb:"insert",chars:$c}'
}

pb_v3_run() {
  pb_v3_begin; local id="$PB_ID" d pine pair tf result frame
  d="$(pb_dir "$id")"
  pine="$(flag pine)"; pair="$(flag pair DXY)"; tf="$(flag tf 1H)"
  [ -n "$pine" ] || refuse PINE_ABSENT "run needs --pine FILE"
  case "$pine" in /*) ;; *) pine="$PWD/$pine" ;; esac
  [ -f "$pine" ] || refuse PINE_ABSENT "no such pine source: $pine"
  pb_check_pair_tf "$pair" "$tf"      # refuse a bad pair/tf BEFORE the editor is touched
  pb_v3_insert >/dev/null || exit $?
  stage_load "$id" "$d" "$pine" "$pair" "$tf" || exit $?
  result="$(pb_rec_get "$id" .load.result)"
  # `[ -n "$result" ]` accepted the literal `null` (and {} / 0 / false): a failed load was coerced by `bars//0` into an
  # ok:true run with zero bars. A result is an object that names a positive bar count.
  jq -e 'type == "object" and ((.bars // 0) > 0)' <<<"${result:-null}" >/dev/null 2>&1 \
    || refuse NO_DRAWINGS "the run produced no measured result (got '${result:-nothing}')"
  frame="$(pb_rec_get "$id" .frame.path)"
  [ -n "$frame" ] && [ -s "$frame" ] || refuse FRAME_ABSENT "the run recorded no frame on disk (path '${frame:-none}')"
  jq -nc --argjson id "$id" --argjson r "$result" --arg f "$frame" \
    '{ok:true,id:$id,verb:"run",bars:($r.bars//0),onChart:($r.onChart//0),counts:($r.counts//{}),frame:$f}'
}

pb_v3_editor() {
  pb_v3_begin; local id="$PB_ID" mode text res absent
  mode="$(flag mode get)"; text="$(flag text)"
  case "$mode" in
    get)
      res="$(pb_v3_eval "$id" "(function(){const P=window.PlutusPineShell; if(!P||!P.editor) return {absent:true}; return {source:P.editor.getSource()};})()")" || exit $?
      absent="$(jq -r '.absent // false' <<<"$res")"
      [ "$absent" = false ] || refuse EDITOR_ABSENT "the Pine editor is not mounted on this page"
      jq -nc --argjson r "$res" '{ok:true,verb:"editor",source:$r.source}' ;;
    set)
      [ -n "$text" ] || refuse BAD_ARGS "editor --mode set needs --text"
      res="$(pb_v3_eval "$id" "(function(){const P=window.PlutusPineShell; if(!P||!P.editor) return {absent:true}; P.editor.setSource($(jq -nc --arg t "$text" '$t')); P.editor.flush(); return {chars:P.editor.getSource().length};})()")" || exit $?
      absent="$(jq -r '.absent // false' <<<"$res")"
      [ "$absent" = false ] || refuse EDITOR_ABSENT "the Pine editor is not mounted on this page"
      jq -nc --argjson r "$res" '{ok:true,verb:"editor",chars:$r.chars}' ;;
    *) refuse BAD_ARGS "editor needs --mode get|set (got '$mode')" ;;
  esac
}

pb_v3_look() {
  pb_v3_begin; local id="$PB_ID" d name out frame sha colours
  d="$(pb_dir "$id")"
  # --out is a FILE NAME inside the instance dir, never a path: an absolute or escaping value
  # (~/.ssh/authorized_keys, ../../x) would overwrite arbitrary files with image bytes
  name="$(flag out look.png)"
  [[ "$name" =~ ^[A-Za-z0-9._-]{1,64}\.png$ ]] \
    || refuse SCOPE_VIOLATION "look --out must be a bare file name ending .png (it is written inside the instance dir), got '$name'"
  out="$d/$name"
  frame="$("$COMPUTER" screenshot --id "$id" --cdp "$(pb_port "$id" cdp)" --out "$out" ${FLAG[section]:+--section "${FLAG[section]}"} 2>"$d/look.err")" \
    || refuse CAPTURE_FAILED "$(tail -1 "$d/look.err")"
  # the reply is a CLAIM about a file: it must be JSON, name THIS file, and the file must exist and be
  # non-empty before any hash or record is derived from it
  jq -e . <<<"$frame" >/dev/null 2>&1 || refuse CAPTURE_FAILED "the screenshot reply was not JSON: ${frame:0:160}"
  [ "$(realpath -m -- "$(jq -r '.path // empty' <<<"$frame")")" = "$(realpath -m -- "$out")" ] \
    || refuse CAPTURE_FAILED "the tool captured '$(jq -r '.path // empty' <<<"$frame")', not the requested '$out'"
  [ -s "$out" ] || refuse CAPTURE_FAILED "$out is missing or empty after the capture"
  colours="$(jq -r '.colours // 0' <<<"$frame")"
  [[ "$colours" =~ ^[0-9]+$ ]] && [ "$colours" -gt 1 ] || refuse FRAME_BLANK "the captured frame has ${colours:-no} colour(s)"
  sha="$(sha256sum -- "$out" 2>/dev/null | cut -c1-16)"
  [[ "$sha" =~ ^[0-9a-f]{16}$ ]] || refuse CAPTURE_FAILED "could not hash $out"
  pb_rec "$id" ".look = $(jq -nc --argjson f "$frame" --arg sha "$sha" '{path:$f.path,bytes:$f.bytes,colours:$f.colours,sha:$sha}')"
  jq -nc --argjson id "$id" --argjson f "$frame" --arg sha "$sha" '{ok:true,id:$id,verb:"look",frame:($f|{path,bytes,colours,via}),sha:$sha}'
}
