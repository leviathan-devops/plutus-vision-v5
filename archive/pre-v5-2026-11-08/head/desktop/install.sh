#!/usr/bin/env bash
# install.sh — install the Plutus Vision desktop app for the current user:
#   ~/.local/bin/pine-ide                      (symlink → desktop/pine-ide)
#   ~/.local/share/applications/pine-ide.desktop
#   ~/.local/share/icons/hicolor/512x512/apps/plutus-vision.png (+ scalable svg)
#
#   desktop/install.sh            install
#   desktop/install.sh --build    also cargo-build the Tauri binary first
set -euo pipefail
SELF="$(readlink -f "$0")"
ROOT="$(cd "$(dirname "$SELF")/.." && pwd)"
BIN="$HOME/.local/bin"
APPS="$HOME/.local/share/applications"
ICONS="$HOME/.local/share/icons/hicolor"

if [ "${1:-}" = "--build" ]; then
  echo "building Tauri shell…"
  ( cd "$ROOT/desktop/tauri" && cargo build --release )
fi

mkdir -p "$BIN" "$APPS" "$ICONS/512x512/apps" "$ICONS/scalable/apps"

chmod +x "$ROOT/desktop/pine-ide" "$ROOT/desktop/pv-servers.sh" "$ROOT/desktop/pine-ide-webview.py"
ln -sf "$ROOT/desktop/pine-ide" "$BIN/pine-ide"

sed "s|^Exec=.*|Exec=$BIN/pine-ide|" "$ROOT/desktop/pine-ide.desktop" > "$APPS/pine-ide.desktop"
chmod 644 "$APPS/pine-ide.desktop"

cp "$ROOT/desktop/icons/plutus-vision.png" "$ICONS/512x512/apps/plutus-vision.png"
cp "$ROOT/desktop/icons/plutus-vision.svg" "$ICONS/scalable/apps/plutus-vision.svg"

gtk-update-icon-cache -f -t "$ICONS" 2>/dev/null || true
command -v update-desktop-database >/dev/null && update-desktop-database "$APPS" 2>/dev/null || true

echo "installed:"
echo "  $BIN/pine-ide -> $(readlink -f "$BIN/pine-ide")"
echo "  $APPS/pine-ide.desktop"
echo "  $ICONS/512x512/apps/plutus-vision.png"
echo
echo "verify: pine-ide --status"
