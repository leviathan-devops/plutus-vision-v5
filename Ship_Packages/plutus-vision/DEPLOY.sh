#!/usr/bin/env bash
# DEPLOY.sh — PLUTUS VISION ship package 2026.10.14-1
#
# MAPPING WARNING (read before running): this project has NO .trident/dist-manifest.json, so
# there is no declared deploy runbook to generate from. The commands below are the ones actually
# used to run this rig on the build host, transcribed from scripts/ and the ship docs. The ONE
# mapping this script cannot make for you is the RENDERER ROOT: pv-server needs a directory that
# serves the renderer, and on the build host that is /tmp/agent-displays/<instance>/renderer (a
# per-instance dir of real files). Set RENDERER_ROOT, or it defaults to the packaged tree.
#
# WHAT THIS DEPLOY DOES NOT DO: it does not install pine-ide/tv-feed (that directory has no
# node_modules and its server cannot start — see SHIP_MANIFEST.md honest gap #2), and it does
# not lock the protected ports (honest gap #3).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${1:-$HOME/plutus-vision-deploy}"
RENDERER_ROOT="${RENDERER_ROOT:-$DEST/pine-ide/ide/renderer}"
FIXTURE="${FIXTURE:-$HERE/fixtures/bars/2026-07-06.json}"
V2="125c94f86e6a2f1d3009a75c778e02ad16c48e4f3772e8d0d8d95c50af162400"
V1="0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1"

say() { printf '  %s\n' "$*"; }
die() { printf 'DEPLOY: %s\n' "$*" >&2; exit 1; }

echo "== 1 · VERIFY THE PACKAGE BEFORE TOUCHING ANYTHING =="
[ -d "$HERE/dist" ] || die "no dist/ in the package"
say "v2: $(sha256sum "$HERE/dist/plutus-vision-v2.pine" | cut -c1-16)"
say "v1: $(sha256sum "$HERE/dist/plutus-vision-v1.pine" | cut -c1-16)"
sha256sum "$HERE/dist/plutus-vision-v2.pine" | grep -q "$V2" || die "v2 MISMATCH — refusing to deploy the wrong artifact"
sha256sum "$HERE/dist/plutus-vision-v1.pine" | grep -q "$V1" || die "v1 SEAL MISMATCH — HARD STOP H1, aborting"
say "artifact fingerprints verified"

echo "== 2 · COPY THE TREE =="
mkdir -p "$DEST"
rsync -a --delete --exclude=node_modules --exclude=.git --exclude=Ship_Packages \
  "$HERE/pine-ide/" "$DEST/pine-ide/"
cp "$HERE/dist/plutus-vision-v2.pine" "$DEST/pine-ide/ide/renderer/plutus-vision-v2.pine"
cp "$HERE/dist/plutus-vision-v1.pine" "$DEST/pine-ide/ide/renderer/plutus-vision-v1.pine"
mkdir -p "$DEST/fixtures/bars"; cp "$FIXTURE" "$DEST/fixtures/bars/"
mkdir -p "$DEST/scripts"; cp "$HERE/scripts/pv-server.py" "$DEST/scripts/"
say "tree copied to $DEST"

echo "== 3 · VERIFY THE DEPLOYED FINGERPRINTS (the gate you must not skip) =="
sha256sum "$DEST/pine-ide/ide/renderer/plutus-vision-v2.pine" | grep -q "$V2" || die "DEPLOYED v2 does not match"
sha256sum "$DEST/pine-ide/ide/renderer/plutus-vision-v1.pine" | grep -q "$V1" || die "DEPLOYED v1 seal does not match"
# the artifact-vs-source gate: the deployed file must carry this build's own symbols
grep -q 'data-hide-foot' "$DEST/pine-ide/ide/renderer/tabs/pineshell.css" \
  || die "the layout collapse rules are ABSENT from the deployed css — this is not the shipped build"
grep -q 'isFinite' "$DEST/pine-ide/ide/renderer/tabs/backtest.js" \
  || die "the date guard is ABSENT from the deployed backtest.js — this is not the shipped build"
say "deployed artifacts match + carry this build's symbols"

echo "== 4 · START THE SERVICES =="
mkdir -p "$DEST/logs"
PV_FIXTURE="$FIXTURE" setsid -f python3 "$DEST/scripts/pv-server.py" 9851 "$RENDERER_ROOT" >"$DEST/logs/pv-9851.log" 2>&1
say "pv-server  :9851  (renderer root: $RENDERER_ROOT)"
[ -f "$DEST/pine-ide/pine-station/server.mjs" ] && {
  setsid -f node "$DEST/pine-ide/pine-station/server.mjs" >"$DEST/logs/station.log" 2>&1
  say "pine-station :9741"; }
[ -f "$DEST/pine-ide/vil-rail.mjs" ] && {
  setsid -f node "$DEST/pine-ide/vil-rail.mjs" >"$DEST/logs/vil-rail.log" 2>&1
  say "vil-rail     :9754"; }
say "tv-feed      :9448  NOT STARTED — that directory ships without node_modules (see the manifest)"

echo "== 5 · VERIFY THE SERVICES ANSWER =="
sleep 2
for p in 9851 9741 9754; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 4 "http://127.0.0.1:$p/" || echo 000)
  say "  :$p -> HTTP $code"
done
code=$(curl -s -o /dev/null -w '%{http_code}' -m 4 "http://127.0.0.1:9448/bars" || echo 000)
say "  :9448 -> HTTP $code  (000 = the feed is down; every tv: market will report FEED_UNREACHABLE)"

echo "== 6 · WHAT TO DO NEXT =="
say "open http://127.0.0.1:9851/pine.html in a browser with its own --user-data-dir"
say "set the market to fixture:DXY (localStorage plutus.pine.market) — tv: markets are dead"
say "read SHIP_MANIFEST.md's HONEST GAPS before trusting anything this deploy does not do"
echo "DEPLOY: DONE (artifacts verified; tv-feed and the port lock remain open)"
