#!/usr/bin/env bash
# drive.sh - L5. The navigation verbs (blueprint sections 7A/8). Sourced after lib.sh and
# govern.sh.
#
#   drv_displays                 every X display on the host with its window count (v1 verb)
#   drv_focus  ID [--title RE | --win W]   BIND a window of the instance (a record write only)
#   drv_spawn  ID [--cdp PORT] -- ARGV...  launch an app INTO the instance's display
#   drv_screenshot ID [--out F] [--cdp PORT]
#   drv_click / drv_type / drv_key
#
# INVARIANTS:
#   * EVERY X input is scoped to the instance's own display (DISPLAY=":<slot>") and to one
#     window id, so an event can never land on the operator's display or window.
#   * For a BROWSER window the path is CDP (core/cdp.mjs): in-process, it cannot raise.
#   * Nothing here raises, activates or focuses a window. `focus` only records which window
#     later verbs act on.

need xdotool NO_INPUT

# every visible top-level window of the instance display: "<id> <area> <class> <name>"
win_table() {
  local slot="$1" w g
  for w in $(DISPLAY=":$slot" xdotool search --onlyvisible --class '.' 2>/dev/null; DISPLAY=":$slot" xdotool search --onlyvisible --name '.' 2>/dev/null); do
    echo "$w"
  done | sort -un | while read -r w; do
    g="$(DISPLAY=":$slot" xdotool getwindowgeometry --shell "$w" 2>/dev/null)" || continue
    eval "$g"
    printf '%s %s %s\n' "$w" "$(( ${WIDTH:-0} * ${HEIGHT:-0} ))" "$(DISPLAY=":$slot" xdotool getwindowname "$w" 2>/dev/null | tr ' ' '_')"
  done
}

slot_of() {
  local s; s="$(rec_get "$1" x_slot 2>/dev/null || true)"
  [ -n "$s" ] || refuse NOT_UP "instance $1 has no display - run: computer shell_up --id $1"
  printf '%s' "$s"
}

# the window a verb acts on: an explicit --win, else the bound one, else the app's window
win_of() {
  local id="$1" w; w="${FLAG[win]:-}"
  [ -n "$w" ] || w="$(rec_get "$id" win 2>/dev/null || true)"
  [ -n "$w" ] || w="$(rec_get "$id" app_win 2>/dev/null || true)"
  [ -n "$w" ] || refuse WINDOW_GONE "instance $id has no bound window - run: computer focus --id $id --title <regex>"
  printf '%s' "$w"
}

# REFUSE WINDOW_GONE with the display's current windows, so the caller can re-bind
win_check() {
  local slot="$1" w="$2"
  DISPLAY=":$slot" xdotool getwindowgeometry "$w" >/dev/null 2>&1 && return 0
  refuse WINDOW_GONE "window $w no longer exists on :$slot; current windows: $(win_table "$slot" | tr '\n' ';')"
}

# --cdp PORT drives that port; --cdp 0 forces the X path for this call (the recorded browser
# may be dead, and a recorded port must never trap the instance on CDP forever).
cdp_of() {
  local id="$1" p="${FLAG[cdp]:-}"
  [ "$p" = 0 ] && return 0
  [ -n "$p" ] || p="$(rec_get "$id" cdp 2>/dev/null || true)"
  printf '%s' "$p"
}

# INPUT is never delivered to the operator's own display (slots :0/:1/:2). `existing` may
# bind such a display so it can be READ (screenshot, displays, focus); a click or a key into
# it would land on the operator's real windows, which blueprint section 7A forbids.
x_input_guard() {
  local slot="$1"
  [ "$slot" -ge 3 ] 2>/dev/null || refuse OPERATOR_DISPLAY "input into display :$slot is forbidden - :0/:1/:2 belong to the operator. Create an instance (computer shell up) and drive that."
}

# Run a CDP verb. On failure the REFUSAL TOKEN cdp.mjs chose (NO_PAGE, CAPTURE_FAILED,
# EVAL_FAILED, ...) is surfaced as-is - never re-wrapped under a second, vaguer token.
# Must be called directly (not inside $(...)) so the refusal exits the verb.
cdp() {
  local errf out rc line tok
  errf="$(mktemp)"
  out="$(node "$CU_HOME/core/cdp.mjs" "$@" 2>"$errf")"; rc=$?
  if [ "$rc" -ne 0 ]; then
    line="$(grep -m1 '^REFUSED' "$errf" || head -1 "$errf")"; rm -f "$errf"
    tok="$(printf '%s' "$line" | sed -nE 's/^REFUSED +([A-Z_]+) +—.*/\1/p')"; [ -n "$tok" ] || tok=CDP_FAILED
    refuse "$tok" "$(printf '%s' "$line" | sed -E 's/^REFUSED +[A-Z_]+ +— +//')"
  fi
  rm -f "$errf"; printf '%s\n' "$out"
}

drv_displays() {
  local out="" sock n geo wins
  for sock in /tmp/.X11-unix/X*; do
    [ -e "$sock" ] || continue
    n="${sock##*/X}"
    geo="$(DISPLAY=":$n" timeout 3 xdpyinfo 2>/dev/null | grep -m1 -oE '[0-9]+x[0-9]+ pixels' | cut -d' ' -f1)"
    [ -n "$geo" ] || continue
    wins="$(DISPLAY=":$n" xdotool search --name '.' 2>/dev/null | wc -l)"
    out="${out:+$out,}{\"display\":\":$n\",\"geometry\":\"$geo\",\"windows\":$wins}"
  done
  printf '{"ok":true,"displays":[%s]}\n' "$out"
}

drv_focus() {
  local id="$1" slot w title row
  slot="$(slot_of "$id")" || exit $?
  if [ -n "${FLAG[win]:-}" ]; then w="${FLAG[win]}"; win_check "$slot" "$w"
  else
    title="${FLAG[title]:-.}"
    # the LARGEST matching window: the client area, not a 10x10 helper window
    row="$(win_table "$slot" | awk -v re="$title" '$3 ~ re || re=="." {print}' | sort -k2,2nr | head -1)"
    [ -n "$row" ] || refuse WINDOW_GONE "no window matching '$title' on :$slot; current windows: $(win_table "$slot" | tr '\n' ';')"
    w="${row%% *}"
  fi
  rec_set "$id" win "$w"
  printf '{"ok":true,"win":"%s","display":":%s"}\n' "$w" "$slot"
}

drv_spawn() {
  local id="$1" slot log before after new w pid cdpport
  slot="$(slot_of "$id")" || exit $?
  [ "$slot" -ge 3 ] 2>/dev/null || refuse OPERATOR_DISPLAY "spawning into display :$slot is forbidden - :0/:1/:2 belong to the operator. Create an instance (computer shell up) and spawn into that."
  [ ${#REST[@]} -gt 0 ] || refuse NEED_CMD "spawn needs a command after '--', or --cmd '<command line>'"
  log="$(idir "$id")/app.log"
  cdpport="${FLAG[cdp]:-}"
  before="$(win_table "$slot" | cut -d' ' -f1 | sort)"
  # The app is a client of THIS instance only: X11 forced, the operator's Wayland socket
  # removed. WAYLAND_DISPLAY inherited is how clients escape onto the operator's session.
  env -u WAYLAND_DISPLAY DISPLAY=":$slot" GDK_BACKEND=x11 QT_QPA_PLATFORM=xcb XDG_SESSION_TYPE=x11 \
      MOZ_ENABLE_WAYLAND=0 ELECTRON_OZONE_PLATFORM_HINT=x11 setsid "${REST[@]}" >> "$log" 2>&1 &
  pid=$!
  new=""
  for _ in $(seq 1 100); do
    after="$(win_table "$slot" | cut -d' ' -f1 | sort)"
    new="$(comm -13 <(printf '%s\n' "$before") <(printf '%s\n' "$after") | tr '\n' ' ')"
    [ -n "${new// /}" ] && break
    pid_alive "$pid" || refuse APP_EXITED "${REST[0]} exited before mapping a window — $(tail -2 "$log" | tr '\n' ' ')"
    sleep 0.3
  done
  [ -n "${new// /}" ] || refuse APP_NO_WINDOW "${REST[0]} ran but mapped no window on :$slot — $log"
  # the largest new window is the app's main window
  w="$(for x in $new; do win_table "$slot" | awk -v x="$x" '$1==x'; done | sort -k2,2nr | head -1 | cut -d' ' -f1)"
  rec_set "$id" app_win "$w" win "$w" ${cdpport:+cdp "$cdpport"}
  rec_append "$id" app_pids "$(pid_token "$pid")"
  printf '{"ok":true,"id":%s,"display":":%s","window":"%s","pid":%s%s}\n' "$id" "$slot" "$w" "$pid" "${cdpport:+,\"cdp\":$cdpport}"
}

drv_screenshot() {
  local id="$1" out="${FLAG[out]:-}" slot w port colours err
  [ -n "$out" ] || out="$(idir "$id")/shot.png"
  mkdir -p "$(dirname "$out")"
  port="$(cdp_of "$id")"
  if [ -n "$port" ]; then
    cdp "$port" screenshot "$out" >/dev/null
  else
    need import NO_CAPTURE
    slot="$(slot_of "$id")" || exit $?; w="$(win_of "$id")" || exit $?; win_check "$slot" "$w"
    err=""
    for _ in $(seq 1 10); do
      rm -f "$out"; err="$(DISPLAY=":$slot" import -window "$w" -silent "$out" 2>&1)"
      [ -s "$out" ] && break; sleep 0.4
    done
    [ -s "$out" ] || refuse CAPTURE_FAILED "${err:-window $w gave no image}"
  fi
  # a one-colour frame is a capture of nothing; reporting it as a success would be a lie.
  # The count is ImageMagick's (no Python dependency): a thumbnail quantised to 4 bits per
  # channel. A count that is not an integer means the check could not run - a refusal, never
  # a silent pass.
  need convert NO_IMAGE_CHECK
  colours="$(convert "$out" -resize '420x420>' -depth 4 -format '%k' info: 2>/dev/null)"
  [[ "$colours" =~ ^[0-9]+$ ]] || refuse NO_IMAGE_CHECK "could not count the colours of $out (convert said '${colours:-nothing}') - the blank-frame check cannot run"
  [ "$colours" = 1 ] && refuse FRAME_BLANK "$out has one colour"
  local via=x; [ -n "$port" ] && via=cdp
  printf '{"ok":true,"path":"%s","bytes":%s,"colours":%s,"via":"%s"}\n' "$out" "$(stat -c%s "$out")" "$colours" "$via"
}

drv_click() {
  local id="$1" x="${FLAG[x]:-0}" y="${FLAG[y]:-0}" b="${FLAG[button]:-1}" port slot w
  port="$(cdp_of "$id")"
  if [ -n "$port" ]; then cdp "$port" click "$x" "$y" "$b"; return $?; fi
  slot="$(slot_of "$id")" || exit $?; w="$(win_of "$id")" || exit $?; x_input_guard "$slot"; win_check "$slot" "$w"
  DISPLAY=":$slot" xdotool mousemove --window "$w" "$x" "$y" click "$b" || refuse INPUT_FAILED "click at $x,$y in window $w"
  printf '{"ok":true,"clicked":[%s,%s],"button":%s,"window":"%s","via":"x"}\n' "$x" "$y" "$b" "$w"
}

drv_type() {
  local id="$1" text="${FLAG[text]:-}" port slot w
  port="$(cdp_of "$id")"
  if [ -n "$port" ]; then cdp "$port" type "$text"; return $?; fi
  slot="$(slot_of "$id")" || exit $?; w="$(win_of "$id")" || exit $?; x_input_guard "$slot"; win_check "$slot" "$w"
  DISPLAY=":$slot" xdotool type --window "$w" --delay 25 -- "$text" || refuse INPUT_FAILED "type into window $w"
  printf '{"ok":true,"typed":%s,"window":"%s","via":"x"}\n' "${#text}" "$w"
}

drv_key() {
  local id="$1" k="${FLAG[key]:-}" port slot w
  [ -n "$k" ] || refuse BAD_ARGS "key needs --key <name>"
  port="$(cdp_of "$id")"
  if [ -n "$port" ]; then cdp "$port" key "$k"; return $?; fi
  slot="$(slot_of "$id")" || exit $?; w="$(win_of "$id")" || exit $?; x_input_guard "$slot"; win_check "$slot" "$w"
  DISPLAY=":$slot" xdotool key --window "$w" "$k" || refuse INPUT_FAILED "key $k into window $w"
  printf '{"ok":true,"key":"%s","window":"%s","via":"x"}\n' "$k" "$w"
}

# the one refusal that exists to make the old defect impossible to reintroduce
drv_activate() {
  refuse ACTIVATE_FORBIDDEN "raising a window steals the operator's focus. Use focus (a record write), screenshot/click/type/key (never raise), or view - the one verb permitted to raise."
}
