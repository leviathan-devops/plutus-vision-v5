from PIL import Image

comp = Image.open("/tmp/pv-ide-capture.png").convert("RGB")
W, H = comp.size

# Vela paints layered canvases; the composite stacks them. Layer N occupies
# y = N*1081 .. (N+1)*1081. Extract each layer separately so the one carrying
# the drawings (the merged indicator's boxes/trendlines/labels) is legible.
LAYER = 1081
n_layers = H // LAYER
print(f"composite {W}x{H} -> {n_layers} layers of {LAYER}px")

for i in range(min(n_layers, 14)):
    a = i * LAYER
    b = a + LAYER
    lay = comp.crop((0, a, W, b))
    # content score
    px = lay.load()
    n = 0
    for y in range(0, lay.height, 6):
        for x in range(0, lay.width, 6):
            r, g, bl = px[x, y]
            if r > 40 or g > 40 or bl > 40:
                n += 1
    print(f"  layer {i:2}: y{a}..{b}  content={n}")
    if n > 60:
        s = 1100 / lay.height
        view = lay.resize((int(lay.width * s), 1100))
        view.save(f"/tmp/pv-layer-{i}.png")
        print(f"    -> /tmp/pv-layer-{i}.png ({n} content px)")
