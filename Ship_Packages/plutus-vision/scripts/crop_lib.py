#!/usr/bin/env python3
"""Crop + upscale a region of a chart screenshot so the hand-drawn labels are readable."""
import sys, pathlib
from PIL import Image

src = pathlib.Path(sys.argv[1])
out = sys.argv[2]
box = tuple(int(x) for x in sys.argv[3].split(",")) if len(sys.argv) > 3 else None
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 3.0

im = Image.open(src).convert("RGB")
print("full:", im.size)
if box:
    x0, y0, x1, y1 = box
    # scale box from the displayed 960x505-ish coordinate space if needed
    im = im.crop((x0, y0, x1, y1))
w, h = im.size
im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
im.save(out)
print("wrote", out, im.size)