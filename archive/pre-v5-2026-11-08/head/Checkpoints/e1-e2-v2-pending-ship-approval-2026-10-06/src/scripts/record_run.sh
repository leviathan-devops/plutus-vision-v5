#!/usr/bin/env bash
# record_run — screen-record display :3 while the IDE walks every timeframe + opens the Inputs
# dialog; also saves one full-res PNG per step. Output: <tree>/vil/recordings/<stamp>/{run.mp4,NN-step.png}
set -uo pipefail
W="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
STAMP=$(date +%Y%m%dT%H%M%S); OUT="$W/vil/recordings/$STAMP"; mkdir -p "$OUT"
PINE="${1:-$W/plutus-vision-v0.pine}"; PAIR="${2:-EUR/USD}"
bash "$W/scripts/pv-ide.sh" "$PINE" "$PAIR" 1H > "$OUT/launch.log" 2>&1 || { cat "$OUT/launch.log"; exit 1; }
DISPLAY=:3 ffmpeg -loglevel error -y -f x11grab -framerate 4 -video_size 1638x996 -i :3 \
  -c:v libx264 -preset ultrafast -pix_fmt yuv420p "$OUT/run.mp4" &
FF=$!; sleep 2
n=0; shot() { n=$((n+1)); sleep 2; bash "$W/scripts/pv-ide.sh" --shot "$OUT/$(printf %02d $n)-$1.png" >/dev/null; echo "$(printf %02d $n)-$1 t=$(( $(date +%s) - T0 ))s"; }
T0=$(date +%s)
for TF in 15m 30m 1H 4H; do
  bun "$W/scripts/pv-load.mjs" "$PINE" "$PAIR" "$TF" > "$OUT/load-$TF.json" 2>&1; shot "tf-$TF"
done
bun "$W/scripts/pv-eval.mjs" "document.querySelector('[data-pv-settings]').click(), 'opened'" >/dev/null; shot "settings-open"
bun "$W/scripts/pv-eval.mjs" "document.querySelector('[data-pv-dialog]').scrollTop = 1e6, 'scrolled'" >/dev/null; shot "settings-scrolled"
bun "$W/scripts/pv-eval.mjs" "document.querySelector('[data-pv-settings]').click(), 'closed'" >/dev/null; shot "settings-closed"
sleep 1; kill -INT $FF; wait $FF 2>/dev/null
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/run.mp4" | sed 's/^/video seconds: /'
echo "OUT=$OUT"
