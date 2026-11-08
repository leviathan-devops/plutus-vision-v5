#!/usr/bin/env bash
# cli.sh - the core entry point. THE ONLY CODE WITH LOGIC: the OMP extension and the MCP
# server forward to this file and add nothing (blueprint section 10). A bug fixed here is
# fixed in all three surfaces at once.
#
#   computer <action> [--id N] [flags]        actions: see `computer help`
#
# Exit: 0 ok (one JSON object on stdout) | 1 REFUSED (a named token on stderr) | 2 usage

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/lib.sh"
. "$HERE/govern.sh"
. "$HERE/runtime.sh"
. "$HERE/surface.sh"
. "$HERE/drive.sh"
. "$HERE/terminal.sh"
. "$HERE/state.sh"

usage() {
  cat <<'EOF'
computer - a self-contained Linux computer: a headed display, a terminal, a scoped filesystem

  probe                                  the capability record + the selected adapters
  doctor [--json]                        every adapter re-probed, orphans, the refusal top-5
  shell up    --id N [--adapter A] [--size WxH]    create instance N (REFUSED INSTANCE_LIVE if it is)
  shell down  --id N | --all | --orphans           scoped teardown
  shell spawn --id N [--cdp PORT] -- ARGV...       launch an app INTO the instance's display
  shell list                                       every live instance
  displays                               every X display and its window count
  focus       --id N --title RE | --win W          BIND a window (a record write; never raises)
  screenshot  --id N [--out F] [--cdp PORT]        a PNG + its distinct-colour count
  click       --id N --x X --y Y [--button B]      delivered to the bound window or over CDP
  type        --id N --text S                      ditto
  key         --id N --key K                       ditto
  terminal send --id N --text S [--no-enter]       tmux send-keys in the instance's own tmux
  terminal read --id N [--lines N]                 tmux capture-pane
  state get   --id N --key K                       a row from the instance's scoped store
  state put   --id N --key K --value V [--db P]    a row, or SCOPE_VIOLATION
  state battery                                    the store's own battery, run in place
  app install --id N --name NAME [--default] -- ARGV...   register an application
  app launch  --id N [--name NAME]                         launch it into the instance
  view        --id N --confirm           THE ONLY ACTION PERMITTED TO RAISE A WINDOW (--confirm: a human asked)
  activate                               REFUSED ACTIVATE_FORBIDDEN, always
  mcp --stdio                            serve this same action table over MCP
EOF
}

# Actions are written "shell up" on the command line and "shell_up" over MCP/extension.
verb="${1:-help}"; shift || true
case "$verb" in
  shell|terminal|state|app) sub="${1:-}"; shift || true; verb="${verb}_${sub}" ;;
esac
case "$verb" in
  help|-h|--help|"") usage; exit 2 ;;
  mcp_*|mcp) exec node "$CU_HOME/mcp/server.mjs" ;;
esac

parse_flags "$@"

# bind the instance id for every action that takes one
needs_id() { require_explicit_id "$(flag id)"; }

# C3 around any verb that drives an instance: the focused window and the top of the
# operator's stack, before and after, by IDENTITY. A move onto one of OUR windows is a theft.
c3_wrap() {
  local label="$1"; shift
  local before after out rc smp samples tag
  before="$(c3_snapshot "${ID:-}")"
  smp="$(c3_sampler_start "${ID:-}")"
  out="$("$@")"; rc=$?
  samples="$(c3_sampler_stop "$smp")"
  after="$(c3_snapshot "${ID:-}")"
  [ "$rc" -ne 0 ] && exit "$rc"
  c3_check "$before" "$after" "$label" "" "$samples"
  tag='"c3":"held"'; [ "$before" = none ] && tag='"c3":"n/a: this host has no display to observe"'
  if [[ "$out" == *"}" ]]; then printf '%s,%s}\n' "${out%\}}" "$tag"; else printf '%s\n' "$out"; fi
}

json_record() {   # ID -> {"key":"value",...} from the instance record
  local f out="" k v; f="$(rec_file "$1")"
  [ -f "$f" ] || { printf '{}'; return; }
  while IFS='=' read -r k v; do [ -n "$k" ] && out="${out:+$out,}\"$k\":\"$(jesc "$v")\""; done < "$f"
  printf '{%s}' "$out"
}

case "$verb" in

  probe) bash "$HERE/probe.sh" ;;

  doctor)
    pj="$(bash "$HERE/probe.sh")" || exit $?
    rows="$(tail -200 "$LEDGER" 2>/dev/null | grep -oE '"token":"[A-Z_]+"' | cut -d'"' -f4 | sort | uniq -c | sort -rn | head -5)"
    orph="$(inst_orphans | tr '\n' ';')"
    if [ "$(flag json)" = 1 ]; then
      printf '{"probe":%s,"orphans":"%s","refusal_top5":"%s"}\n' "$pj" "$(jesc "$orph")" "$(jesc "$(printf '%s' "$rows" | tr '\n' ';')")"
    else
      echo "DOCTOR"
      printf '%s' "$pj" | jq -r '"  kernel    \(.os.kernel) \(.os.arch)  native_linux=\(.os.native_linux)\n  runtime   \(.selected.runtime)\n  surface   \(.selected.surface)"' 2>/dev/null \
        || printf '  %s\n' "$pj"
      printf '%s' "$pj" | jq -r '.surface.adapters[] | "  adapter   \(.adapter): " + (if .available then "AVAILABLE" else "UNAVAILABLE - \(.reason)" end)' 2>/dev/null
      echo "  orphans   ${orph:-none}"
      echo "  refusals  ${rows:-none}" | tr '\n' ' '; echo
      [[ "$pj" == *'"surface":null'* ]] && { echo "VERDICT   NOT_DRIVEABLE"; exit 1; }
      echo "VERDICT   DRIVEABLE"
    fi
    ;;

  shell_up)
    needs_id; id="$ID"
    # L1: the runtime plane decides WHERE planes L2-L5 run. On a Linux host it is native and
    # the guest never starts; on any other host with no QEMU and no agentOS this is
    # REFUSED NO_RUNTIME - it is never a degraded shell.
    runtime="$(runtime_select)" || exit $?
    inst_reap_stale "$id"
    if inst_live "$id"; then refuse INSTANCE_LIVE "instance $id is already running (pid $(inst_pid "$id")) - run: computer shell down --id $id"; fi
    [ -f "$(rec_file "$id")" ] && refuse INSTANCE_LIVE "instance $id is already bound (adapter $(rec_get "$id" adapter)) - run: computer shell down --id $id"
    opid="$(inst_orphans | awk -v id="$id" '$2==id {print $1; exit}')"
    [ -n "$opid" ] && refuse INSTANCE_LIVE "an untracked compositor (pid $opid) already holds --socket=computer-use$id - run: computer shell down --orphans"
    if [ "$runtime" != native ]; then bash "$HERE/guest/boot.sh" "$runtime" "$id" || exit $?; exit 0; fi
    adapter="$(surface_choose "$(flag adapter "${CU_ADAPTER:-}")")" || exit $?
    slot="$(with_up_lock "$id" surface_up "$id" "$adapter" "$(flag size)")" || exit $?
    printf '{"ok":true,"id":%s,"adapter":"%s","display":":%s","x_slot":"%s","instance":%s}\n' \
      "$id" "$adapter" "$slot" "$slot" "$(json_record "$id")"
    ;;

  shell_down)
    if [ "$(flag all)" = 1 ]; then
      n=0; failed=""
      for f in "$ROOT"/i*/state.env; do
        [ -f "$f" ] || continue
        i="${f%/state.env}"; i="${i##*/i}"
        if ( surface_down "$i" >/dev/null ); then n=$((n+1)); else failed="$failed $i"; fi
      done
      [ -z "$failed" ] || refuse TEARDOWN_INCOMPLETE "instance(s)${failed} could not be torn down; the other $n were"
      printf '{"ok":true,"down":"all","instances":%s}\n' "$n"
    elif [ "$(flag orphans)" = 1 ]; then
      killed=""
      while read -r pid oid; do
        [ -n "$pid" ] || continue
        kill_group "$pid" && killed="$killed $pid"
      done < <(inst_orphans)
      printf '{"ok":true,"down":"orphans","killed":"%s"}\n' "${killed# }"
    else
      needs_id; id="$ID"
      [ -f "$(rec_file "$id")" ] || refuse NOT_UP "instance $id is not up"
      killed="$(surface_down "$id")" || exit $?
      printf '{"ok":true,"down":%s,"killed":"%s"}\n' "$id" "$killed"
    fi
    ;;

  shell_spawn)
    needs_id
    if [ ${#REST[@]} -eq 0 ] && [ -n "$(flag cmd)" ]; then REST=(bash -c "exec $(flag cmd)"); fi
    c3_wrap "spawn" drv_spawn "$ID"
    ;;

  shell_list)
    out=""
    for f in "$ROOT"/i*/state.env; do
      [ -f "$f" ] || continue
      i="${f%/state.env}"; i="${i##*/i}"
      inst_reap_stale "$i"
      [ -f "$(rec_file "$i")" ] || continue
      out="${out:+$out,}{\"id\":$i,\"record\":$(json_record "$i")}"
    done
    printf '{"ok":true,"instances":[%s]}\n' "$out"
    ;;

  displays)    drv_displays ;;
  focus)       needs_id; c3_wrap "focus" drv_focus "$ID" ;;
  screenshot)  needs_id; c3_wrap "screenshot" drv_screenshot "$ID" ;;
  click)       needs_id; c3_wrap "click" drv_click "$ID" ;;
  type)        needs_id; c3_wrap "type" drv_type "$ID" ;;
  key)         needs_id; c3_wrap "key" drv_key "$ID" ;;
  activate)    drv_activate ;;

  terminal_send)
    needs_id
    term_send "$ID" "$(flag text)" "$([ "$(flag no-enter)" = 1 ] && echo 0 || echo 1)"
    printf '{"ok":true,"session":"%s"}\n' "$(term_sess "$ID")"
    ;;
  terminal_read)
    needs_id
    txt="$(term_read "$ID" "$(flag lines 50)")" || exit $?
    printf '{"ok":true,"session":"%s","text":"%s"}\n' "$(term_sess "$ID")" "$(jesc "$txt")"
    ;;

  state_get)     needs_id; state_get "$ID" "$(flag key)" ;;
  state_put)     needs_id; state_put "$ID" "$(flag key)" "$(flag value)" "$(flag db)" ;;
  state_battery) state_battery ;;

  app_install)
    needs_id
    [ -n "$(flag name)" ] || refuse BAD_ARGS "app install needs --name"
    [ ${#REST[@]} -gt 0 ] || refuse NEED_CMD "app install needs the command after '--'"
    [[ "$(flag name)" =~ ^[A-Za-z0-9_-]+$ ]] || refuse BAD_ARGS "app name must match [A-Za-z0-9_-]+"
    mkdir -p "$(idir "$ID")/apps"
    printf '%s\n' "${REST[@]}" > "$(idir "$ID")/apps/$(flag name).argv"
    [ "$(flag default)" = 1 ] && printf '%s' "$(flag name)" > "$(idir "$ID")/apps/.default"
    printf '{"ok":true,"app":"%s","argc":%s}\n' "$(flag name)" "${#REST[@]}"
    ;;
  app_launch)
    needs_id
    name="$(flag name)"; [ -n "$name" ] || name="$(cat "$(idir "$ID")/apps/.default" 2>/dev/null || true)"
    [ -n "$name" ] || refuse NO_APP "no --name given and no default app registered for instance $ID"
    [ -f "$(idir "$ID")/apps/$name.argv" ] || refuse NO_APP "app '$name' is not installed for instance $ID"
    mapfile -t REST < "$(idir "$ID")/apps/$name.argv"
    c3_wrap "app launch" drv_spawn "$ID"
    ;;

  view)
    # THE ONLY VERB PERMITTED TO RAISE A WINDOW. It is explicit, it is named, and it
    # exists so a human can ask for the instance to come forward - nothing else may.
    needs_id; id="$ID"
    [ "$(flag confirm)" = 1 ] || refuse VIEW_UNCONFIRMED "view raises a window on the operator's screen. Pass --confirm only when the operator asked to see this instance."
    adapter="$(rec_get "$id" adapter 2>/dev/null || true)"
    [ -n "$adapter" ] || refuse NOT_UP "instance $id is not up"
    bash "$HERE/adapters/$adapter.sh" view "$id" || exit $?
    ;;

  *) refuse BAD_VERB "unknown action '$verb' - run: computer help" ;;
esac
