#!/usr/bin/env python3
"""chartpx.py - the measurements verify makes on a captured frame.

  chartpx.py render PROBE.json FRAME.png   print {"candidates","hits","rate"}: of the bars the RENDERER says are in view, the share whose
                                           column in the frame holds a pixel of the colour the RENDERER says that bar is drawn in
  chartpx.py changed A B                   exit 0 = the chart pane differs, 1 = pixel-identical, 2 = INSTRUMENT FAILED

Exit 2 is never a verdict about the frame: a missing PIL, an unreadable PNG or a probe that does not fit the frame must not read as
"unchanged" or as "blank".

WHY THIS REPLACES THE OLD COLOUR/CANDLE-PIXEL FLOORS (2026-11-01): the old measure compared the pane with the IDE theme's two candle colours
and a floor of 707 taken from four frames. It named the theme (a recolour made a populated chart read as empty), named a crop in
proportions of the frame, and could not tell "the chart has no bars in view" from "the chart did not draw". Now the renderer is asked
what it holds (chartprobe.js: candle colours, visible range, the x of every in-view bar) and the pixels are checked AT THOSE PLACES.

THE FLOOR IS MEASURED, NOT PICKED (see RENDER_HIT_FLOOR below and ship-docs/TESTING_LOG.md T-49 for the frames it comes from).
"""
import json
import sys

TOL = 40          # per-channel distance for "this pixel is that colour" (antialiasing); the colours themselves come from the renderer
BAND = 1          # a bar is 1-2 px wide at the measured spacing; its wick is at round(x); look one column either side
# MEASURED 2026-11-01 on the running tool (T-49): drawn chart 356/382 = 0.9319 (two repeats, and the SAME after a recolour), partially panned
# views 1.0; the renderer holding the same 382 bars with its canvases hidden 0/382 = 0.0.  floor = midpoint(max not-drawn 0.0, min drawn 0.9319).
RENDER_HIT_FLOOR = 0.466


def hex_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def pane(im):
    return im.crop((int(im.width * 0.35), 70, im.width - 6, int(im.height * 0.78)))


def load(path):
    from PIL import Image
    return Image.open(path).convert("RGB")


def render(probe_path, frame_path):
    probe = json.load(open(probe_path))
    im = load(frame_path)
    if probe.get("state") != "OK":
        raise ValueError("the probe state is %s, not OK: nothing to measure" % probe.get("state"))
    sx, sy = im.width / probe["inner"][0], im.height / probe["inner"][1]
    if abs(sx - sy) > 0.01:
        raise ValueError("frame %dx%d does not match the page viewport %dx%d" % (im.width, im.height, probe["inner"][0], probe["inner"][1]))
    px = im.load()
    colour = {1: hex_rgb(probe["up"]), 0: hex_rgb(probe["down"])}
    left, top = probe["mount"]["l"] * sx, probe["mount"]["t"] * sy
    y0, y1 = int(top), min(im.height, int(top + probe["H"] * sy))
    hits = 0
    for x, up in probe["cols"]:
        c = colour[up]
        X = int(round(left + x * sx))
        hit = False
        for xx in range(X - BAND, X + BAND + 1):
            if 0 <= xx < im.width and any(all(abs(px[xx, y][i] - c[i]) <= TOL for i in range(3)) for y in range(y0, y1)):
                hit = True
                break
        hits += hit
    n = len(probe["cols"])
    return {"candidates": n, "hits": hits, "rate": round(hits / n, 4) if n else 0.0}


def main(argv):
    try:
        if argv[1] == "render" and len(argv) == 4:
            print(json.dumps(render(argv[2], argv[3])))
            return 0
        if argv[1] == "changed" and len(argv) == 4:
            from PIL import ImageChops
            a, b = load(argv[2]), load(argv[3])
            if a.size != b.size:
                return 0                      # a different viewport IS a different frame
            return 1 if ImageChops.difference(pane(a), pane(b)).getbbox() is None else 0
    except Exception as e:                    # PIL absent, unreadable PNG, a probe that does not fit: the instrument, not the frame
        print("CHARTPX_INSTRUMENT: %s" % e, file=sys.stderr)
        return 2
    print("usage: chartpx.py render PROBE.json FRAME.png | changed A B", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
