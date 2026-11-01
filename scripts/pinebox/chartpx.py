#!/usr/bin/env python3
"""chartpx.py - the ONE definition of "the chart pane" and the two measurements verify makes on it.

  chartpx.py colours FILE        print the number of distinct colours inside the chart pane
  chartpx.py candles FILE        print the number of CANDLE pixels in the chart pane (see CANDLE_FLOOR)
  chartpx.py changed A B         exit 0 = the chart pane differs, 1 = pixel-identical, 2 = INSTRUMENT FAILED

Exit 2 is never a verdict about the frame: a missing PIL or an unreadable PNG must not read as
"unchanged" (which it used to) or as "blank".

THE PANE is expressed as proportions of the frame, not a fixed pixel box: right of the editor column
(35%), below the tab strip (70px), above the footer clock (78% of the height), short of the right edge.

THE BLANK THRESHOLD IS MEASURED, NOT PICKED (2026-11-01, five real frames of a populated chart pane):
    populated chart pane   1493 .. 4153 distinct colours   (min 1493)
    the SAME frames with the pane painted flat   1 distinct colour   (max 1)
    whole-frame count of those blanked frames    6268 .. 7622   <- why a whole-frame "> 1" test passes a blank chart
  threshold = midpoint(max blank, min populated) = (1 + 1493) // 2 = 747

THAT FLOOR IS BLIND TO THE REAL FAILURE (found 2026-11-01, `verify` answered WORKS on a chart with no candles): it was derived
from a pane painted FLAT, but a real empty chart still has gridlines, axis labels and a price tag. Distinct colours in the pane
of three real frames: good 1617, candles squeezed to a sliver 1612, NO candles 1617 - the count cannot tell them apart.

CANDLES are what must be present. A candle pixel is a pixel within 40/channel of the theme's up colour (8,153,129) or down colour
(242,54,69), in the pane below its 60px legend rows and left of the price axis, with the SAME colour directly above or below it
(bodies and wicks are vertical; the teal dotted last-price line and the legend text are not). Measured on real frames:
    no candles, bars=0 (before any load)      0
    no candles, after `fit` (grid + price tag)  352        <- the dotted line's vertically-adjacent fragments
    candles squeezed to a sliver (zoomed in)   1062
    the full week of candles                   4371
  CANDLE_FLOOR = midpoint(max empty 352, min populated 1062) = 707.   FOUR frames: a small sample, kept as test fixtures
  (test/fixtures/pane-*.png) so hardening.sh re-measures them. The colours are the IDE theme's: a theme change makes the count
  fall, which REFUSES (fail closed) rather than passes.
"""
import sys

BLANK_THRESHOLD = 747
CANDLE_FLOOR = 707
CANDLE_UP = (8, 153, 129)
CANDLE_DOWN = (242, 54, 69)


def pane(im):
    return im.crop((int(im.width * 0.35), 70, im.width - 6, int(im.height * 0.78)))


def candle_pixels(im):
    """Vertically-connected pixels of the theme's candle colours in the pane (see the module docstring)."""
    pn = pane(im)
    w, h = pn.size
    body = pn.crop((0, 60, int(w * 0.93), h))
    px = body.load()
    bw, bh = body.size

    def near(p, c):
        return all(abs(p[i] - c[i]) <= 40 for i in range(3))

    mask = [[near(px[x, y], CANDLE_UP) or near(px[x, y], CANDLE_DOWN) for x in range(bw)] for y in range(bh)]
    return sum(1 for y in range(1, bh - 1) for x in range(bw) if mask[y][x] and (mask[y - 1][x] or mask[y + 1][x]))


def load(path):
    from PIL import Image
    return Image.open(path).convert("RGB")


def main(argv):
    try:
        if argv[1] == "colours" and len(argv) == 3:
            colours = pane(load(argv[2])).getcolors(maxcolors=10 ** 7)
            print(len(colours) if colours is not None else 10 ** 7)
            return 0
        if argv[1] == "candles" and len(argv) == 3:
            print(candle_pixels(load(argv[2])))
            return 0
        if argv[1] == "changed" and len(argv) == 4:
            from PIL import ImageChops
            a, b = load(argv[2]), load(argv[3])
            if a.size != b.size:
                return 0                      # a different viewport IS a different frame
            return 1 if ImageChops.difference(pane(a), pane(b)).getbbox() is None else 0
    except Exception as e:                    # PIL absent, unreadable PNG, missing file: the instrument, not the frame
        print("CHARTPX_INSTRUMENT: %s" % e, file=sys.stderr)
        return 2
    print("usage: chartpx.py colours FILE | candles FILE | changed A B", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
