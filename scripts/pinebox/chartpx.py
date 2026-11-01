#!/usr/bin/env python3
"""chartpx.py - the ONE definition of "the chart pane" and the two measurements verify makes on it.

  chartpx.py colours FILE        print the number of distinct colours inside the chart pane
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
"""
import sys

BLANK_THRESHOLD = 747


def pane(im):
    return im.crop((int(im.width * 0.35), 70, im.width - 6, int(im.height * 0.78)))


def load(path):
    from PIL import Image
    return Image.open(path).convert("RGB")


def main(argv):
    try:
        if argv[1] == "colours" and len(argv) == 3:
            colours = pane(load(argv[2])).getcolors(maxcolors=10 ** 7)
            print(len(colours) if colours is not None else 10 ** 7)
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
    print("usage: chartpx.py colours FILE | changed A B", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
