#!/usr/bin/env bash
# build.sh - compile the two helpers into the cache, keyed by the SHA of their source.
#
#   build.sh            build what is missing or stale; print "<libdir>" on success
#
# A helper is rebuilt only when its source changed (the sha is part of the file name), so
# a stale binary can never be mistaken for the current one. gcc or the xcb headers being
# absent is a NAMED refusal - never a silently skipped build.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIBDIR="${CU_LIB_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/computer-use/lib}"
mkdir -p "$LIBDIR"

die() { printf 'REFUSED  %s  —  %s\n' "$1" "$2" >&2; exit 1; }

command -v gcc >/dev/null 2>&1      || die HELPERS_UNAVAILABLE "gcc is not installed - install build-essential"
pkg-config --exists xcb 2>/dev/null || die HELPERS_UNAVAILABLE "xcb headers are missing - install libxcb1-dev"

# build_one <source> <so|bin> <name>  ->  prints the sha-keyed output path
build_one() {
  local src="$1" kind="$2" name="$3" sha out
  sha="$(sha256sum "$HERE/$src" | cut -c1-12)"
  out="$LIBDIR/$name-$sha"
  [ "$kind" = so ] && out="$out.so"
  if [ ! -x "$out" ]; then
    local flags=(-O2)
    [ "$kind" = so ] && flags=(-shared -fPIC -O2)
    gcc "${flags[@]}" -o "$out" "$HERE/$src" $(pkg-config --cflags --libs xcb) -ldl 2>"$LIBDIR/$name.err" \
      || die HELPERS_BUILD_FAILED "$src: $(head -2 "$LIBDIR/$name.err" | tr '\n' ' ')"
  fi
  printf '%s' "$out"
}

so="$(build_one nofocus.c so nofocus)"   || exit 1
bin="$(build_one hostwin.c bin hostwin)" || exit 1
# stable names the rest of the tool uses; each points at the sha-keyed build
ln -sf "$so"  "$LIBDIR/nofocus.so"
ln -sf "$bin" "$LIBDIR/hostwin"
printf '%s\n' "$LIBDIR"
