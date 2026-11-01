#!/usr/bin/env bash
# page.sh - STAGE 3 (the browser) and STAGE 4 (the frame). Sourced by pinebox.
#
#   stage_page         launch the Pine IDE as a window INSIDE the instance's display
#   stage_frame        a CDP capture of it, refused when it is blank
#
# STAGE 3 EXIT: a window exists on the instance's slot, and CDP /json/list names a
# pine.html target ON THIS INSTANCE'S PORT. The browser is spawned THROUGH the
# computer-use core (`shell spawn`), so its process group is recorded by the core and
# killed by the core's scoped teardown - never found again by a pattern grep (the measured
# leak: 12 chrome processes for 3 instances came from a grep against a path the launch
# never used).
#
# STAGE 4 EXIT: a PNG whose distinct-colour count is > 1 (a one-colour frame is a blank
# frame and the capture REFUSES it), taken over CDP Page.captureScreenshot, which is
# in-process and CANNOT raise the window. The frame is then OPENED AND READ by the caller.

stage_page() {
  local id="$1" d="$2"
  local srv cdp profile url
  srv="$(pb_port "$id" server)"; cdp="$(pb_port "$id" cdp)"
  profile="$d/chrome"; url="http://127.0.0.1:$srv/pine.html"
  need google-chrome-stable WINDOW_NOT_MAPPED
  # The profile is rm -rf'd, so its scope check must be REAL. "$d/chrome" always matches "$d"/*
  # by construction (and "/chrome" matches /* when $d is empty), so that test could never fail.
  # Require: a non-empty instance dir that sits directly under the instance root, and a profile
  # that is exactly <dir>/chrome and is not a symlink.
  [ -n "$d" ] && [ -n "${PB_ROOT:-}" ] && [ "$d" = "$PB_ROOT/i$id" ] \
    || refuse SCOPE_VIOLATION "instance dir '$d' is not $PB_ROOT/i$id - refusing to delete a browser profile under it"
  [ "$profile" = "$d/chrome" ] && [ ! -L "$profile" ] && [ ! -L "$d" ] \
    || refuse SCOPE_VIOLATION "chrome profile '$profile' is not a plain <instance>/chrome directory (symlink or escape)"
  rm -rf -- "$profile"

  local out
  # the flags and WHY each is there: blueprint section 7E. --ozone-platform=x11 pins it to
  # this instance's X display (the core also strips the operator's Wayland socket).
  out="$("$COMPUTER" shell spawn --id "$id" --cdp "$cdp" -- google-chrome-stable \
        --app="$url" --user-data-dir="$profile" --no-first-run --no-default-browser-check \
        --remote-debugging-port="$cdp" --remote-debugging-address=127.0.0.1 \
        --remote-allow-origins="http://127.0.0.1:$cdp" \
        --window-size=1626,931 --window-position=0,0 \
        --disable-gpu --disable-gpu-compositing --disable-accelerated-2d-canvas \
        --use-gl=swiftshader --enable-unsafe-swiftshader --ozone-platform=x11 2>"$d/spawn.err")" \
    || {
      local tok; tok="$(sed -nE 's/^REFUSED +([A-Z_]+) +—.*/\1/p' "$d/spawn.err" | head -1)"
      case "$tok" in
        APP_NO_WINDOW|APP_EXITED) refuse WINDOW_NOT_MAPPED "the browser opened no window on :$(pb_rec_get "$id" .slot) (slot $(pb_rec_get "$id" .slot)) - the core says: $(sed -E 's/^REFUSED +[A-Z_]+ +— +//' "$d/spawn.err" | head -1)" ;;
        *) pb_forward_refusal "$d/spawn.err" ;;
      esac
    }
  local chrome_json
  chrome_json="$(jq -nc --arg profile "$profile" --argjson cdp "$cdp" --arg url "$url" --arg window "$(jq -r '.window // empty' <<<"$out")" '{profile:$profile,cdp:$cdp,url:$url,window:$window}')"
  [ -n "$(jq -r '.window // empty' <<<"$out")" ] || refuse WINDOW_NOT_MAPPED "the core returned no browser window for instance $id"
  pb_rec "$id" ".chrome = $chrome_json"

  # the CDP target list must name pine.html on THIS instance's server port
  local targets
  if ! pb_wait 30 pb_cdp_names_page "$cdp" "$srv"; then
    targets="$(node "$CORE/cdp.mjs" "$cdp" targets 2>&1 | head -c 400)"
    refuse NO_PAGE "CDP :$cdp has no pine.html target for :$srv; targets: $targets"
  fi
  printf '  page      chrome in a window on :%s · CDP :%s · profile %s\n' "$(pb_rec_get "$id" .slot)" "$cdp" "$profile" >&2
}

pb_cdp_names_page() {
  curl -s -m 2 "http://127.0.0.1:$1/json/list" 2>/dev/null | jq -e --arg p "http://127.0.0.1:$2/pine.html" 'any(.[]; .type=="page" and .url==$p)' >/dev/null 2>&1
}

stage_frame() {
  local id="$1" d="$2" out
  local colours frame_rec
  out="$("$COMPUTER" screenshot --id "$id" --out "$d/frame.png" 2>"$d/shot.err")" || pb_forward_refusal "$d/shot.err"
  # the tool already refuses a 1-colour frame; this re-checks the CONTRACT we record, so a
  # malformed/empty tool reply can never be stored as a successful frame
  frame_rec="$(jq -c '{path, bytes, colours}' <<<"$out" 2>/dev/null)" \
    || refuse FRAME_UNREADABLE "the screenshot reply was not JSON: $(printf '%s' "$out" | head -c 200)"
  colours="$(jq -r '.colours // 0' <<<"$frame_rec")"
  [[ "$colours" =~ ^[0-9]+$ ]] && [ "$colours" -gt 1 ] \
    || refuse FRAME_BLANK "the captured frame has ${colours:-no} colour(s) - a blank frame is not a frame"
  pb_rec "$id" ".frame = $frame_rec"
  printf '  frame     %s  (%s bytes, %s colours, CDP capture)\n' "$d/frame.png" "$(jq -r .bytes <<<"$out")" "$(jq -r .colours <<<"$out")" >&2
}
