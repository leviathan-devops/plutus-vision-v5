#!/usr/bin/env bash
# DEPLOY.sh — install this package's tool and PROVE the host runs what was packaged.
# THE MAPPING IS THE POINT: this package carries the tool's SOURCE; the host runs it in place.
# There is no compiled dist/index.js to copy — the helpers are compiled from helpers/*.c and their
# file names carry the source sha, so a stale helper is impossible to load silently.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${CU_EXT:-$HOME/.omp/agent/extensions/computer-use-v2}"
PB="${PINEBOX_DIR:-$HOME/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/scripts/pinebox}"
die() { printf 'REFUSED  %s  —  %s\n' "$1" "$2" >&2; exit 1; }
[ -d "$HERE/dist/computer-use-v2" ] || die PACKAGE_INCOMPLETE "dist/computer-use-v2 is missing"
# 1 · the tool, source in place
mkdir -p "$(dirname "$DEST")"
rsync -a --delete "$HERE/dist/computer-use-v2/" "$DEST/" 2>/dev/null || cp -a "$HERE/dist/computer-use-v2/." "$DEST/"
# 2 · the app layer
[ -d "$HERE/dist/pinebox" ] && { mkdir -p "$(dirname "$PB")"; cp -a "$HERE/dist/pinebox/." "$(dirname "$PB")/"; }
# 3 · re-seal from the deployed bytes, build the helpers, register the two MCP servers, then VERIFY
"$DEST/deploy.sh" seal >/dev/null || die SEAL_FAILED "seal"
"$DEST/deploy.sh" install || die DEPLOY_FAILED "install"
"$DEST/deploy.sh" verify || die DEPLOY_UNVERIFIED "verify"
printf 'DEPLOYED: %s\n' "$DEST"
