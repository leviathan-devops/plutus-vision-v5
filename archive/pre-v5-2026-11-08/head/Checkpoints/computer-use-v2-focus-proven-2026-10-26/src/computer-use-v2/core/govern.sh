#!/usr/bin/env bash
# govern.sh - L6. The instance registry, the per-instance lock, and the no-raise guard.
# Sourced by cli.sh after lib.sh.
#
#   inst_pid ID                 the live primary pid of instance ID (compositor or X server)
#   inst_live ID                0 iff instance ID has a live primary process
#   inst_reap_stale ID          a record whose pid is dead is reaped ON READ and the reap LOGGED
#   inst_orphans                "<pid> <id>" for every compositor with no live record
#   with_up_lock ID CMD...      one `up` per id at a time (INSTANCE_LIVE when one is in flight)
#   c3_snapshot                 "active=0x.. top=0x.." of the HOST display, or "none"
#   c3_check BEFORE AFTER LABEL REFUSED FOCUS_STOLEN iff the change landed on one of OUR windows
#
# THE C3 CONTRACT (blueprint section 5/8): operating an instance must never move the
# operator's focus. It is a BEHAVIOURAL probe - the focused window id before and after -
# not a property we assert. The check is by IDENTITY: a focus change onto a window this
# tool owns is a theft; a change the operator made themselves is not, so it cannot raise a
# false refusal while they work.

inst_pid() {
  local id="$1" tok p
  tok="$(rec_get "$id" comp_tok 2>/dev/null || true)"
  if [ -n "$tok" ]; then tok_alive "$tok" && { tok_pid "$tok"; return 0; }; return 1; fi
  p="$(rec_get "$id" comp_pid 2>/dev/null || true)"
  pid_alive "$p" && { printf '%s' "$p"; return 0; }
  return 1
}

inst_live() { inst_pid "$1" >/dev/null; }

inst_reap_stale() {
  local id="$1" p
  [ -f "$(rec_file "$id")" ] || return 0
  [ "$(rec_get "$id" adapter 2>/dev/null || true)" = existing ] && return 0   # owns no process
  if ! inst_live "$id"; then
    p="$(rec_get "$id" comp_pid 2>/dev/null || true)"
    ledger_row REAPED_STALE "instance $id record named pid '${p:-none}', which is no longer that process"
    rec_clear "$id"
  fi
}

# Every compositor this tool ever started carries --socket=computer-use<id>. One with no
# live record is an orphan: the registry lost it, and a second `up` for that id would
# create a second display for one id (anti-pattern A4).
inst_orphans() {
  local line pid sock id
  while IFS= read -r line; do
    pid="${line%% *}"
    sock="$(printf '%s' "$line" | grep -oE -- '--socket=computer-use[0-9]+' | head -1)"
    [ -n "$sock" ] || continue
    id="${sock##*computer-use}"
    if [ "$(inst_pid "$id" 2>/dev/null || true)" != "$pid" ]; then printf '%s %s\n' "$pid" "$id"; fi
  done < <(pgrep -af -- '--socket=computer-use[0-9]+' 2>/dev/null)
}

with_up_lock() {
  local id="$1"; shift
  local d; d="$(idir "$id")"; mkdir -p "$d"
  exec 8>"$d/.up.lock"
  flock -n 8 || refuse INSTANCE_LIVE "an 'up' for instance $id is already in progress"
  "$@"
  local rc=$?
  flock -u 8; exec 8>&-
  return $rc
}

# ── C3 ───────────────────────────────────────────────────────────────────────────────────
# Every host window this tool owns, one hex id per line, across ALL instances.
our_host_wins() {
  local f w
  for f in "$ROOT"/i*/state.env; do
    [ -f "$f" ] || continue
    w="$(grep -m1 '^host_win=' "$f" | cut -d= -f2-)"
    [ -n "$w" ] && printf '%s\n' "$w"
  done
}

# The host display this instance was drawn on: its OWN record first (the adapter wrote
# where it drew), then the environment. A tool call that arrives through an MCP server or an
# extension may carry no DISPLAY at all, and the guard must not switch itself off exactly
# where the agent calls from.
c3_host() {
  local id="${1:-}" h=""
  [ -n "$id" ] && h="$(rec_get "$id" host_display 2>/dev/null || true)"
  [ -n "$h" ] || h="$(host_display)"
  printf '%s' "$h"
}

# c3_snapshot [ID] -> "active=0x.. top=0x.."
#                     "none"         there is NO host display (a remote host): nothing to steal
#                     "unobservable" there IS one and it could not be read: a refusal, not a pass
c3_snapshot() {
  local h; h="$(c3_host "${1:-}")"
  [ -n "$h" ] || { printf 'none'; return 0; }
  if ! DISPLAY="$h" timeout 3 xdpyinfo >/dev/null 2>&1 || [ ! -x "$LIBDIR/hostwin" ]; then printf 'unobservable'; return 0; fi
  local a t
  a="$("$LIBDIR/hostwin" "$h" active 2>/dev/null)"; t="$("$LIBDIR/hostwin" "$h" top 2>/dev/null)"
  [ -n "$a" ] && [ -n "$t" ] || { printf 'unobservable'; return 0; }
  printf 'active=%s top=%s' "$a" "$t"
}

# A raise that is undone before the "after" read leaves before == after. So while a verb
# runs, a sampler records every (active, top) pair the window manager reports, and the check
# runs over ALL of them, not just the two endpoints.
c3_sampler_start() {   # [ID] -> prints "<pid> <file>"
  local h; h="$(c3_host "${1:-}")"
  [ -n "$h" ] && [ -x "$LIBDIR/hostwin" ] || { printf '0 /dev/null'; return 0; }
  local f; f="$(mktemp /tmp/cu-c3s.XXXXXX)"
  ( while :; do printf 'active=%s top=%s t=%s%s\n' "$("$LIBDIR/hostwin" "$h" active 2>/dev/null)" "$("$LIBDIR/hostwin" "$h" top 2>/dev/null)" "$(date +%s%3N)" "${C3_SAMPLE_DEBUG:+ stack=$("$LIBDIR/hostwin" "$h" stack 2>/dev/null)}" >> "$f"; sleep 0.03; done ) >/dev/null 2>&1 &
  printf '%s %s' "$!" "$f"
}
# C3_SAMPLES_KEEP=<path> keeps the raw, time-ordered timeline there: when a theft is refused,
# the refusal carries the evidence of WHEN it happened instead of a bare "it moved".
# c3_mark SAMPLER LABEL: stamp a step into the timeline (debug aid; the checker ignores it)
c3_mark() { local f="${1#* }"; [ -f "$f" ] && printf 'MARK %s t=%s\n' "$2" "$(date +%s%3N)" >> "$f"; return 0; }
c3_sampler_stop() {    # "<pid> <file>" -> prints the distinct samples, removes the file
  local pid="${1%% *}" f="${1#* }"
  [ "$pid" != 0 ] && { kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; }
  if [ -f "$f" ]; then
    [ -n "${C3_SAMPLES_KEEP:-}" ] && cp "$f" "$C3_SAMPLES_KEEP"
    grep '^active=' "$f" | sed -E 's/ t=[0-9]+( stack=.*)?$//' | sort -u; rm -f "$f"
  fi
}

# c3_check BEFORE AFTER LABEL [EXTRA_OWN_WINDOW]
c3_check() {
  local before="$1" after="$2" label="$3" extra="${4:-}" samples="${5:-}"
  if [ "$before" = unobservable ] || [ "$after" = unobservable ]; then
    refuse C3_UNOBSERVABLE "$label: the host display exists but its focus could not be read, so 'the operator's focus did not move' cannot be proven"
  fi
  [ "$before" = none ] && [ "$after" = none ] && [ -z "$samples" ] && return 0
  [ "$before" = "$after" ] && [ -z "$samples" ] && return 0
  local ours; ours="$(our_host_wins)"; [ -n "$extra" ] && ours="$ours"$'\n'"$extra"
  local b_active b_top a_active a_top
  b_active="${before#active=}"; b_active="${b_active%% *}"; b_top="${before##*top=}"
  a_active="${after#active=}";  a_active="${a_active%% *}"; a_top="${after##*top=}"
  local hit=""
  if [ "$a_active" != "$b_active" ] && printf '%s\n' "$ours" | grep -qxF "$a_active"; then hit="focus moved $b_active -> $a_active"; fi
  if [ "$a_top" != "$b_top" ] && printf '%s\n' "$ours" | grep -qxF "$a_top"; then
    hit="${hit:+$hit; }stack top moved $b_top -> $a_top"
  fi
  # every intermediate sample: an instant at which a window of ours held the focus or the top
  local s s_active s_top
  while IFS= read -r s; do
    [ -n "$s" ] || continue
    s_active="${s#active=}"; s_active="${s_active%% *}"; s_top="${s##*top=}"; s_top="${s_top%% *}"
    if [ "$s_active" != "$b_active" ] && printf '%s\n' "$ours" | grep -qxF "$s_active"; then hit="${hit:+$hit; }focus was on $s_active mid-verb"; break; fi
    if [ "$s_top" != "$b_top" ] && printf '%s\n' "$ours" | grep -qxF "$s_top"; then hit="${hit:+$hit; }stack top was $s_top mid-verb"; break; fi
  done <<< "$samples"
  [ -z "$hit" ] && return 0
  refuse FOCUS_STOLEN "$label: $hit (a window of this tool took the operator's focus or the top of the stack)"
}
