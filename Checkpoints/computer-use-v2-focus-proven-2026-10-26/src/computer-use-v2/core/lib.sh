#!/usr/bin/env bash
# lib.sh - shared by every core script. Sourced, never executed.
#
#   refuse TOKEN detail...      print "REFUSED  TOKEN  -  detail" on stderr, append one row
#                               to the refusal ledger (blueprint section 11), exit 1
#   need BIN TOKEN              refuse TOKEN unless BIN is on PATH
#   require_id N                refuse BAD_ID unless N is a non-negative integer
#   rec_get ID KEY / rec_set ID KEY VALUE [KEY VALUE ...]
#                               the per-instance record: one KEY=VALUE line per key
#   jesc STRING                 JSON-escape a string (no jq dependency)
#
# THE RULE THIS FILE ENFORCES: every outcome is a loud refusal with a TOKEN or a clear
# result. There is no third state, and no function here substitutes one artifact for another.

CU_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CU_UID="$(id -u)"

# ONE registry per host. A different root per caller is how compositors leaked in the
# first build (four roots, four orphaned compositors), so the root is derived, not chosen:
# only CU_STATE_ROOT overrides it, and the test harness is the only caller that sets it.
ROOT="${CU_STATE_ROOT:-${XDG_RUNTIME_DIR:-/tmp/cu-$CU_UID}/computer-use}"
LIBDIR="${CU_LIB_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/computer-use/lib}"
LEDGER="$ROOT/refusals.jsonl"
mkdir -p "$ROOT" 2>/dev/null

# the host display the operator lives on. Empty on a host with none (a cloud box).
host_display() { printf '%s' "${CU_HOST_DISPLAY:-${DISPLAY:-}}"; }

jesc() {
  local s="$1"
  s=${s//\\/\\\\}; s=${s//\"/\\\"}; s=${s//$'\n'/\\n}; s=${s//$'\t'/\\t}; s=${s//$'\r'/}
  printf '%s' "$s"
}

# ── the refusal ledger: the learn loop (blueprint section 11) ────────────────────────────
ledger_row() {
  printf '{"token":"%s","detail":"%s","instance":"%s","at":"%s"}\n' \
    "$(jesc "$1")" "$(jesc "$2")" "$(jesc "${CU_CTX_ID:-}")" "$(date -Is)" >> "$LEDGER" 2>/dev/null
}

refuse() {
  local token="$1"; shift
  local detail="$*"
  printf 'REFUSED  %s  —  %s\n' "$token" "$detail" >&2
  ledger_row "$token" "$detail"
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || refuse "$2" "$1 is not installed"
}

# require_explicit_id FLAGVALUE: the caller must NAME the instance. A missing --id silently
# meaning "instance 0" drives the wrong computer, so absence is a refusal.
require_explicit_id() {
  [ -n "${1:-}" ] || refuse MISSING_ID "this action drives one instance - pass --id N (there is no default instance)"
  require_id "$1"
}

require_id() {
  [[ "${1:-}" =~ ^[0-9]+$ ]] || refuse BAD_ID "instance id must be a non-negative integer, got '${1:-}'"
  CU_CTX_ID="$1"; ID="$1"
}

idir() { printf '%s/i%s' "$ROOT" "$1"; }

# ── the per-instance record ──────────────────────────────────────────────────────────────
# One KEY=VALUE line per key, written under flock so two writers can never interleave.
# A value may not contain a newline: it would forge a second key.
rec_file() { printf '%s/state.env' "$(idir "$1")"; }

rec_get() {
  local f; f="$(rec_file "$1")"
  [ -f "$f" ] || return 1
  local line
  line="$(grep -m1 "^$2=" "$f")" || return 1
  printf '%s' "${line#*=}"
}

rec_set() {
  local id="$1"; shift
  local d f; d="$(idir "$id")"; f="$(rec_file "$id")"
  mkdir -p "$d"
  (
    flock -x 9
    local tmp="$f.tmp.$$" k v
    [ -f "$f" ] && cp "$f" "$tmp" || : > "$tmp"
    while [ $# -ge 2 ]; do
      k="$1"; v="$2"; shift 2
      [[ "$k" =~ ^[a-z_][a-z0-9_]*$ ]] || { rm -f "$tmp"; echo "REFUSED  BAD_KEY  —  record key '$k'" >&2; exit 1; }
      case "$v" in *$'\n'*) rm -f "$tmp"; echo "REFUSED  BAD_VALUE  —  record value for '$k' has a newline" >&2; exit 1;; esac
      grep -v "^$k=" "$tmp" > "$tmp.n" 2>/dev/null; mv "$tmp.n" "$tmp"
      printf '%s=%s\n' "$k" "$v" >> "$tmp"
    done
    mv "$tmp" "$f"
  ) 9>"$d/.rec.lock" || refuse RECORD_WRITE_FAILED "could not write $f"
}

rec_clear() { rm -f "$(rec_file "$1")"; }

# rec_append ID KEY VALUE: add VALUE to the space-separated list at KEY, atomically. The read
# AND the write happen under the same flock, so two concurrent spawns cannot lose a pid.
rec_append() {
  local id="$1" key="$2" val="$3" d f; d="$(idir "$id")"; f="$(rec_file "$id")"
  mkdir -p "$d"
  (
    flock -x 9
    local tmp="$f.tmp.$$" cur=""
    [ -f "$f" ] && cur="$(grep -m1 "^$key=" "$f" | cut -d= -f2-)"
    [ -f "$f" ] && grep -v "^$key=" "$f" > "$tmp" || : > "$tmp"
    printf '%s=%s\n' "$key" "${cur:+$cur }$val" >> "$tmp"
    mv "$tmp" "$f"
  ) 9>"$d/.rec.lock" || refuse RECORD_WRITE_FAILED "could not append to $f"
}

# ── processes ────────────────────────────────────────────────────────────────────────────
pid_alive() { [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null; }

# A pid alone is not an identity: once the process exits the number can be reused by an
# unrelated process, and signalling it would kill the wrong thing (the scoped-teardown
# guarantee C5 is "this instance and nothing else"). A TOKEN is "pid:starttime", where the
# start time (clock ticks since boot, /proc/<pid>/stat field 22) never repeats for a pid.
pid_start() { awk '{ sub(/^.*\) /, ""); print $20 }' "/proc/$1/stat" 2>/dev/null; }
pid_token() { local s; s="$(pid_start "$1")"; [ -n "$s" ] && printf '%s:%s' "$1" "$s"; }
tok_pid()   { printf '%s' "${1%%:*}"; }
# alive AND the same process that was recorded. A bare pid (no start time) never matches.
tok_alive() {
  local p="${1%%:*}" st="${1#*:}"
  [ "$p" != "$1" ] && [ -n "$st" ] && [ "$(pid_start "$p")" = "$st" ]
}

# Kill a whole process group (every compositor/app is started under setsid, so pgid==pid):
# TERM, wait up to ~3s for it to be gone, then KILL. Returns 0 once nothing is left.
group_alive() { [ -n "${1:-}" ] && [ -n "$(pgrep -g "$1" 2>/dev/null)" ]; }
kill_group() {
  local p="$1" i
  [ -n "$p" ] || return 0
  group_alive "$p" || pid_alive "$p" || return 0
  kill -TERM "-$p" 2>/dev/null || kill -TERM "$p" 2>/dev/null
  for i in $(seq 1 30); do group_alive "$p" || pid_alive "$p" || return 0; sleep 0.1; done
  kill -KILL "-$p" 2>/dev/null || kill -KILL "$p" 2>/dev/null
  for i in $(seq 1 20); do group_alive "$p" || pid_alive "$p" || return 0; sleep 0.1; done
  return 1
}
# kill the group of a recorded TOKEN only if it is still the recorded process
kill_tok() { tok_alive "$1" || return 0; kill_group "$(tok_pid "$1")"; }

# ── ports ────────────────────────────────────────────────────────────────────────────────
# A port is HELD iff a LISTEN row exists for it. MEASURED 2026-10-26 in this environment:
# `ss -p`, `fuser` and `lsof` all fail to name the owner of a live listener (the row has no
# users:(...) column), so an ownerless LISTEN row is a LIVE listener with an invisible owner.
# An earlier version of this file called that case "a socket the kernel is draining" and
# treated it as free - wrong twice over: a socket in LISTEN state cannot be draining, and the
# result was that a stranger's server on a port went undetected (pb_claim returned 0).
port_listening() { [ -n "$(ss -ltnH "sport = :$1" 2>/dev/null)" ]; }
port_free()      { ! port_listening "$1"; }
# best-effort owner pid ("" when it cannot be seen - which does NOT mean the port is free)
port_owner() { ss -ltnpH "sport = :$1" 2>/dev/null | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2; }

# ── flag parsing ─────────────────────────────────────────────────────────────────────────
# parse_flags "$@" fills FLAG[...] from `--key value` pairs, booleans from the BOOL list,
# and REST[...] from everything after a bare `--`.
declare -gA FLAG=()
declare -ga REST=()
BOOL_FLAGS=" --json --all --orphans --default --confirm --no-enter --read "
parse_flags() {
  FLAG=(); REST=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --) shift; REST=("$@"); return 0 ;;
      --*)
        if [[ "$BOOL_FLAGS" == *" $1 "* ]]; then FLAG["${1#--}"]=1; shift
        else
          [ $# -ge 2 ] || refuse BAD_ARGS "flag $1 needs a value"
          FLAG["${1#--}"]="$2"; shift 2
        fi ;;
      *) refuse BAD_ARGS "unexpected argument '$1'" ;;
    esac
  done
}
flag() { printf '%s' "${FLAG[$1]:-${2:-}}"; }
