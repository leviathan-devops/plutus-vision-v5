#!/usr/bin/env python3
"""
measure_density.py — PHASE 4 legibility instrument.

THE INSTRUMENT BLIND SPOT THIS FIXES (measured 2026-10-02, the defect that cost a
full round): the previous `measure_ladder.py` scored a chart row "covered" if ANY ink
pixel existed in it. A 1px hairline scored a 99% PASS. It never measured THICKNESS or
FILL — the two properties the library's own bands are defined by.

So the first rule of this file: EVERY measure must be able to FAIL. Each one carries a
known-positive control that the instrument is verified against before it is trusted to
report a zero.

    python3 scripts/measure_density.py <png> [<png> ...]
"""

from __future__ import annotations

import os
import statistics
import sys

try:
    from PIL import Image
except ImportError:
    print("PIL is required"); sys.exit(2)


def is_zone_ink(r: int, g: int, b: int) -> bool:
    """Any coloured zone ink: saturated enough to be a band, bright enough to be paint."""
    mx, mn = max(r, g, b), min(r, g, b)
    return (mx - mn) >= 22 and mx >= 70


def column_bands(path: str, xfrac: float = 0.45) -> list[int]:
    """Vertical runs of zone ink at one column = the bands, measured in PIXELS."""
    im = Image.open(path).convert("RGB")
    W, H = im.size
    x = int(W * xfrac)
    px = im.load()
    runs, cur = [], 0
    for y in range(int(H * 0.04), int(H * 0.97)):
        if is_zone_ink(*px[x, y]):
            cur += 1
        else:
            if cur:
                runs.append(cur)
            cur = 0
    if cur:
        runs.append(cur)
    return runs


def measure(path: str) -> dict:
    runs = column_bands(path)
    if not runs:
        return {"file": os.path.basename(path), "bands": 0}
    return {
        "file": os.path.basename(path),
        "bands": len(runs),
        "median_px": statistics.median(runs),
        "min_px": min(runs),
        "max_px": max(runs),
        "mean_px": round(statistics.mean(runs), 1),
        "ink_pct": round(100 * sum(runs) / (int(Image.open(path).size[1] * 0.93)), 1),
    }


# ── THE KNOWN-POSITIVE CONTROL ───────────────────────────────────────────────
# Before this instrument is trusted to say "too dense", it must read a chart we
# already know. A ruler that has never measured something of known length is a
# guess wearing a decimal point.

def _self_test() -> bool:
    """A synthetic band set with a KNOWN thickness. If the instrument cannot read
    back what was drawn, every number it produces afterwards is noise."""
    from PIL import Image as I, ImageDraw
    im = I.new("RGB", (400, 400), (10, 10, 10))
    d = ImageDraw.Draw(im)
    for i, (y, h) in enumerate(((40, 5), (120, 5), (200, 5), (280, 5))):
        d.rectangle([0, y, 399, y + h], fill=(46, 139, 87))   # #2E8B57, a zone colour
    tmp = "/tmp/_density_selftest.png"
    im.save(tmp)
    runs = column_bands(tmp, xfrac=0.5)
    os.unlink(tmp)
    ok = len(runs) == 4 and all(3 <= r <= 7 for r in runs)
    print(f"  SELF-TEST  drew 4 bands of 5px -> read {len(runs)} bands "
          f"{runs}  {'PASS' if ok else 'FAIL — the instrument cannot measure'}")
    return ok


def main() -> int:
    print("═" * 74)
    print("  DENSITY MEASUREMENT — bands per column, thickness in pixels")
    print("═" * 74)
    if not _self_test():
        print("\n  THE INSTRUMENT FAILED ITS OWN CONTROL. Numbers below are meaningless.")
        return 1

    for p in sys.argv[1:]:
        m = measure(p)
        if m["bands"] == 0:
            print(f"\n  {m['file']}  — 0 bands (no zone ink at 45% width)")
            continue
        print(f"\n  {m['file']}")
        print(f"    bands       {m['bands']:>4}")
        print(f"    thickness   median {m['median_px']:>5.1f} px   "
              f"min {m['min_px']:>3}   max {m['max_px']:>4}   mean {m['mean_px']:>5.1f}")
        print(f"    ink column  {m['ink_pct']:>5.1f} %")

    print("\n  THE REFERENCE (measured 2026-10-02 from the operator's library):")
    print("    bands 4-22 per column (mean ~11 green)   median thickness 5.5px")
    print("    a chart reading 25+ bands is a density the library never shows")
    return 0


if __name__ == "__main__":
    sys.exit(main())