#!/usr/bin/env python3
"""lqz_ab.py — the W6 A/B measurement: a panel against the library's own numbers.

WHY THIS EXISTS
  The panel grid puts [library | D1 | D2 | D3] side by side for the eye. The eye is the
  verdict. But "IS IT APPROVED" should not be answered from scratch every round — this
  measures the DELTA numerically and hands the operator the number beside the picture.

THE METHOD IS NOT INVENTED HERE — IT IS THE AUTHORITY'S.
  scripts/measure_ladder.py produced the target numbers (GREEN 33 · RED 7 · coverage
  99-100 % · gaps n=40 distinct=23). An A/B that used a DIFFERENT method would compare
  apples to oranges, so this classifies exactly as the authority does:

      a row is a candidate  iff  SATURATION (max-min) > 45  AND  BRIGHTNESS max > 55
      a row IS a band       iff  those pixels span > 40 % of the width
      a band's hue          GREEN/teal if g > r+20 and g > b+5 · RED if r > g+45
                            BLUE if b > r+30 and b > g+10 · else other

  MEASURED FAILURE, recorded so it is not repeated: the first version of this script
  matched the target hex (#3E8A46 / #7F3613) per pixel. It read ZERO on the library
  reference itself — the known-positive control. Cause: the library's bands are PASTEL
  (measured #B7DFB9, #9CD6CD) while the target hex is the saturated end of the same
  family. A hex-match cannot see a translucent band; saturation-and-hue can.
  THE LESSON: an instrument is validated on a KNOWN POSITIVE before its output is read.

USAGE
    python3 scripts/lqz_ab.py <panel.png> [--ref <library.png>] [--json]
    python3 scripts/lqz_ab.py <panel.png> [--box x0,y0,x1,y1]

EXIT
    0  a measurement was produced (the numbers are in the output)
    1  the input could not be measured (a named refusal — NEVER a fabricated zero)
"""
import json
import pathlib
import sys
from collections import Counter

try:
    from PIL import Image
except ImportError:
    print("LQZ_AB_REFUSED: PIL missing (pip install pillow)")
    sys.exit(1)

# ── THE MEASURED TARGET (scripts/measure_ladder.py on WINNING_TRADE_LIBARARY) ──
TARGET = {
    "green_bands": 33,
    "red_bands": 7,
    "coverage_min": 0.99,
    "gap_n": 40,
    "gap_distinct": 23,
    "gap_min_px": 2.5,
    "gap_max_px": 48.5,
}

SAT_MIN = 45        # the authority's saturation floor
BRIGHT_MIN = 55     # the authority's brightness floor
SPAN_MIN = 0.40     # the authority's width-coverage floor


def sat(c):
    return max(c[:3]) - min(c[:3])


def hue(c):
    """The authority's per-band classification, verbatim."""
    r, g, b = c[:3]
    if g > r + 20 and g > b + 5:
        return "GREEN/teal"
    if r > g + 45:
        return "RED"
    if b > r + 30 and b > g + 10:
        return "BLUE"
    if sat(c) < SAT_MIN and max(c) > 140:
        return "GREY/white"
    return "other"


def measure(path, box=None, step=2):
    im = Image.open(path).convert("RGB")
    if box:
        im = im.crop(box)
    W, H = im.size
    px = im.load()

    rows = []
    for y in range(H):
        hits = Counter()
        n = 0
        for x in range(0, W, step):
            c = px[x, y]
            n += 1
            if sat(c) > SAT_MIN and max(c) > BRIGHT_MIN:
                hits[c] += 1
        frac = (sum(hits.values()) / n) if n else 0
        if frac > SPAN_MIN and hits:
            rows.append((y, hits.most_common(1)[0][0], frac))

    bands = []
    for y, col, frac in rows:
        if bands and y - bands[-1][1] <= 1:
            bands[-1] = (bands[-1][0], y, bands[-1][2])
        else:
            bands.append((y, y, (col, frac)))

    palette = Counter()
    centres, cov = [], []
    for y0, y1, (col, frac) in bands:
        palette[hue(col)] += 1
        centres.append((y0 + y1) / 2)
        cov.append(frac)

    gaps = [round(centres[i + 1] - centres[i], 1) for i in range(len(centres) - 1)]
    distinct = len(set(gaps))

    return {
        "file": str(path),
        "size": [W, H],
        "bands": len(bands),
        "green_bands": palette.get("GREEN/teal", 0),
        "red_bands": palette.get("RED", 0),
        "palette": dict(palette),
        "coverage_min": round(min(cov), 3) if cov else None,
        "coverage_max": round(max(cov), 3) if cov else None,
        "gaps": len(gaps),
        "gap_min": min(gaps) if gaps else None,
        "gap_max": max(gaps) if gaps else None,
        "gap_distinct": distinct,
        # THE REFUSAL: a uniform spacing is a synthetic grid, not detected levels.
        # The authority draws the same line at <= 3 distinct spacings.
        "irregular": (distinct > 3) if gaps else False,
    }


def diff(m, ref=None):
    t = ref or TARGET
    keys = ["bands", "green_bands", "red_bands", "gaps", "gap_distinct"]
    out = {}
    for k in keys:
        want, got = t.get(k), m.get(k)
        out[k] = {"target": want, "panel": got,
                  "delta": (got - want) if isinstance(want, int) and isinstance(got, int) else None}
    return out


def main():
    if len(sys.argv) < 2:
        print("LQZ_AB_REFUSED: no panel given. usage: lqz_ab.py <panel.png> [--ref <png>] [--json]")
        return 1
    path = pathlib.Path(sys.argv[1])
    if not path.exists():
        print(f"LQZ_AB_REFUSED: {path} does not exist")
        return 1

    ref = None
    if "--ref" in sys.argv:
        ref = pathlib.Path(sys.argv[sys.argv.index("--ref") + 1])
        if not ref.exists():
            print(f"LQZ_AB_REFUSED: reference {ref} does not exist")
            return 1

    box = None
    if "--box" in sys.argv:
        try:
            box = tuple(int(v) for v in sys.argv[sys.argv.index("--box") + 1].split(","))
        except Exception:
            print("LQZ_AB_REFUSED: --box needs x0,y0,x1,y1")
            return 1

    try:
        m = measure(path, box)
    except Exception as e:
        print(f"LQZ_AB_REFUSED: cannot measure {path}: {type(e).__name__}: {e}")
        return 1

    r = measure(ref, box) if ref else None
    d = diff(m, r)

    if "--json" in sys.argv:
        print(json.dumps({"panel": m, "reference": r, "delta": d}, indent=2))
    else:
        print(f"LQZ A/B — {path.name}  {m['size'][0]}x{m['size'][1]}")
        print(f"  bands       {m['bands']:>3}   (target {TARGET['bands'] if 'bands' in TARGET else 40})")
        print(f"  green/teal  {m['green_bands']:>3}   (target {TARGET['green_bands']})")
        print(f"  red         {m['red_bands']:>3}   (target {TARGET['red_bands']})")
        print(f"  coverage    {m['coverage_min']}–{m['coverage_max']}   (target {TARGET['coverage_min']}+)")
        print(f"  gaps        {m['gaps']:>3}  distinct {m['gap_distinct']:>3}  "
              f"min {m['gap_min']} max {m['gap_max']} px")
        print(f"  IRREGULAR   {m['irregular']}   <- False means a GRID, not detected levels")
        print(f"  palette     {json.dumps(m['palette'])}")
        if r:
            print(f"  vs {ref.name}: {json.dumps(d)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
