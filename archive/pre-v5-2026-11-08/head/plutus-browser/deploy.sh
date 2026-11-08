#!/usr/bin/env bash
# deploy.sh - install plutus-browser as a host tool (the same layout as pinebox).
#
#   ~/.local/share/plutus-browser/plutus-browser   the CLI           (from cli/plutus-browser)
#   ~/.local/share/plutus-browser/actions.json     the verb table    (from cli/actions.json)
#   ~/.local/share/plutus-browser/app/             the Electron app  (src/ + package.json + lockfile, npm ci)
#   ~/.local/bin/plutus-browser                    -> the CLI (the ONE place the extension looks)
#   ~/.omp/agent/extensions/plutus-browser/index.ts  the OMP tool `plutus_browser` (binds at the next session start)
#   ~/.plutus-browser/token                        created 0600 when absent; an existing one is checked, never replaced
#
# Run from the source tree (plutus-browser/) or the ship package root: both carry this layout.
# Every step either succeeds or prints REFUSED <TOKEN> and exits 1. Exit 0 prints one JSON receipt.
set -uo pipefail
SRC="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
DEST="$HOME/.local/share/plutus-browser"
LINK="$HOME/.local/bin/plutus-browser"
EXT="$HOME/.omp/agent/extensions/plutus-browser"
TOKEN_FILE="$HOME/.plutus-browser/token"

refuse() { printf 'REFUSED  %s  —  %s\n' "$1" "$2" >&2; exit 1; }

for dep in node npm jq curl ss openssl computer; do
  command -v "$dep" >/dev/null 2>&1 || refuse DEP_ABSENT "'$dep' is not on PATH - install it first (computer = the computer-use v2 tool)"
done
for f in cli/plutus-browser cli/actions.json src/main.js package.json package-lock.json extension/index.ts; do
  [ -f "$SRC/$f" ] || refuse SOURCE_INCOMPLETE "$SRC/$f is missing - deploy from a complete source tree or ship package"
done
jq -e '.actions and .params' "$SRC/cli/actions.json" >/dev/null || refuse SOURCE_INCOMPLETE "$SRC/cli/actions.json is not a verb table"
bash -n "$SRC/cli/plutus-browser" || refuse SOURCE_INCOMPLETE "cli/plutus-browser does not parse"
node --check "$SRC/src/main.js" || refuse SOURCE_INCOMPLETE "src/main.js does not parse"

# a live instance runs the OLD app from DEST; replacing it underneath is refused, not raced
for id in $(seq 10 99); do
  port=$((30000 + id))
  curl -s -m 1 "http://127.0.0.1:$port/health" | jq -e '.success == true' >/dev/null 2>&1 \
    && refuse INSTANCE_LIVE "a plutus-browser answers on 127.0.0.1:$port (id $id) - stop it first: plutus-browser down --id $id"
done

mkdir -p "$DEST/app" "$HOME/.local/bin" "$EXT" || refuse DEST_UNWRITABLE "cannot create $DEST / ~/.local/bin / $EXT"
install -m 0755 "$SRC/cli/plutus-browser" "$DEST/plutus-browser" || refuse DEST_UNWRITABLE "cannot install the CLI"
install -m 0644 "$SRC/cli/actions.json" "$DEST/actions.json"      || refuse DEST_UNWRITABLE "cannot install actions.json"
rm -rf "$DEST/app/src" && mkdir -p "$DEST/app/src"                 || refuse DEST_UNWRITABLE "cannot reset $DEST/app/src"
install -m 0644 "$SRC/src/main.js" "$DEST/app/src/main.js"         || refuse DEST_UNWRITABLE "cannot install main.js"
install -m 0644 "$SRC/package.json" "$SRC/package-lock.json" "$DEST/app/" || refuse DEST_UNWRITABLE "cannot install package files"
npm_log="$(cd "$DEST/app" && npm ci --no-audit --no-fund 2>&1)" || refuse NPM_CI_FAILED "npm ci in $DEST/app failed: $(tail -5 <<<"$npm_log")"
[ -x "$DEST/app/node_modules/.bin/electron" ] || refuse NPM_CI_FAILED "npm ci finished but $DEST/app/node_modules/.bin/electron is absent"
ln -sfn "$DEST/plutus-browser" "$LINK" || refuse DEST_UNWRITABLE "cannot link $LINK"
install -m 0644 "$SRC/extension/index.ts" "$EXT/index.ts" || refuse DEST_UNWRITABLE "cannot install the extension"

if [ -e "$TOKEN_FILE" ]; then
  [ "$(stat -c %a "$TOKEN_FILE")" = "600" ] || refuse TOKEN_UNAVAILABLE "$TOKEN_FILE exists but is not mode 600 - chmod 600 $TOKEN_FILE"
  grep -qxE '[0-9a-f]{64}' "$TOKEN_FILE" || refuse TOKEN_UNAVAILABLE "$TOKEN_FILE exists but is not 64 hex chars - regenerate: openssl rand -hex 32 > $TOKEN_FILE"
  token_state=existing
else
  mkdir -p "$(dirname "$TOKEN_FILE")" && chmod 700 "$(dirname "$TOKEN_FILE")" || refuse TOKEN_UNAVAILABLE "cannot create $(dirname "$TOKEN_FILE")"
  (umask 077 && openssl rand -hex 32 > "$TOKEN_FILE") || refuse TOKEN_UNAVAILABLE "cannot write $TOKEN_FILE"
  token_state=created
fi

sha() { sha256sum "$1" | cut -c1-16; }
jq -nc --arg cli "$(sha "$DEST/plutus-browser")" --arg actions "$(sha "$DEST/actions.json")" --arg main "$(sha "$DEST/app/src/main.js")" \
       --arg ext "$(sha "$EXT/index.ts")" --arg ev "$(jq -r .version "$DEST/app/node_modules/electron/package.json")" \
       --arg link "$(readlink "$LINK")" --arg tok "$token_state" \
  '{ok:true, deployed:{cli:$cli, actions:$actions, main_js:$main, extension:$ext}, electron:$ev, link:$link, token:$tok,
    note:"the plutus_browser tool appears in a NEW omp session (extensions bind at session start)"}'
