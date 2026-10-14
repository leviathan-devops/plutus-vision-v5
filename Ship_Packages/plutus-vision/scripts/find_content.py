import sys
from PIL import Image

comp = Image.open("/tmp/pv-ide-capture.png").convert("RGB")
W, H = comp.size
print("composite:", W, H)

# scan rows for non-background content (the chart bg is ~ (11,11,12))
px = comp.load()
rows = []
step = 4
for y in range(0, H, step):
    n = 0
    for x in range(0, W, 8):
        r, g, b = px[x, y]
        if r > 40 or g > 40 or b > 40:
            n += 1
    if n > 3:
        rows.append((y, n))

if not rows:
    print("NO CONTENT FOUND")
    sys.exit(0)

print("content rows:", len(rows), "first:", rows[0], "last:", rows[-1])

# cluster into bands separated by > 200px gaps
bands = []
start = rows[0][0]
prev = rows[0][0]
for y, n in rows[1:]:
    if y - prev > 200:
        bands.append((start, prev))
        start = y
    prev = y
bands.append((start, prev))
print("bands:", len(bands))
for i, (a, b) in enumerate(bands[:12]):
    print(f"  band {i}: y {a}..{b}  ({b-a}px)")

# save the richest band
best = max(bands, key=lambda t: t[1] - t[0])
a, b = best
pad = 20
crop = comp.crop((0, max(0, a - pad), W, min(H, b + pad)))
# scale to a viewable height
if crop.height > 1200:
    s = 1200 / crop.height
    crop = crop.resize((int(crop.width * s), 1200))
crop.save("/tmp/pv-content-band.png")
print("richest band:", best, "-> /tmp/pv-content-band.png", crop.size)
