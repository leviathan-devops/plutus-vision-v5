#!/usr/bin/env python3
"""Measure the LIQUIDITY LADDER from pixels.
The chart background is a vertical gradient, so a row is classified by SATURATION
(max(r,g,b)-min(r,g,b)) and BRIGHTNESS, not by most-common colour.
A ladder line is a row where saturated pixels span a large fraction of the width.
"""
import sys, pathlib
from collections import Counter
from PIL import Image

src = pathlib.Path(sys.argv[1])
box = tuple(int(x) for x in sys.argv[2].split(",")) if len(sys.argv) > 2 else None

im = Image.open(src).convert("RGB")
if box:
    im = im.crop(box)
W, H = im.size
px = im.load()
STEP = 2
print(f"crop: {W}x{H}  from {src.name}")

def sat(c): return max(c) - min(c)

rows = []
for y in range(H):
    hits = Counter()
    n = 0
    for x in range(0, W, STEP):
        c = px[x, y]
        n += 1
        if sat(c) > 45 and max(c) > 55:
            hits[c] += 1
    frac = (sum(hits.values()) / n) if n else 0
    if frac > 0.40 and hits:
        rows.append((y, hits.most_common(1)[0], frac, sum(hits.values())))

bands = []
for y, (col, _), frac, _cnt in rows:
    if bands and y - bands[-1][1] <= 1:
        b = bands[-1]
        bands[-1] = (b[0], y, b[2])
    else:
        bands.append((y, y, (col, frac)))

print(f"\nbands (horizontal lines): {len(bands)}")
print(f"{'y0':>4} {'y1':>4} {'thick':>5} {'coverage':>9}  colour")
palette = Counter()
for y0, y1, (col, frac) in bands:
    thick = y1 - y0 + 1
    r, g, b = col
    if g > r + 20 and g > b + 5: hue = "GREEN/teal"
    elif r > g + 45: hue = "RED"
    elif b > r + 30 and b > g + 10: hue = "BLUE"
    elif sat(col) < 45 and max(col) > 140: hue = "GREY/white"
    else: hue = "other"
    palette[hue] += 1
    print(f"{y0:>4} {y1:>4} {thick:>5} {frac:>8.0%}  #{r:02X}{g:02X}{b:02X}  {hue}")

print("\npalette summary (bands per class):")
for k, v in palette.most_common():
    print(f"  {k:12} {v:>3} bands")

ys = [(y0 + y1) / 2 for y0, y1, _ in bands]
gaps = [round(ys[i + 1] - ys[i], 1) for i in range(len(ys) - 1)]
if gaps:
    uniq = sorted(set(gaps))
    print(f"\ncentre-to-centre spacing: n={len(gaps)}  distinct={len(uniq)}  "
          f"min={min(gaps)} max={max(gaps)}")
    print("  → " + ("EVENLY SPACED (synthetic grid)" if len(uniq) <= 3 else "IRREGULAR (detected levels)"))