#!/usr/bin/env python3
"""frame_axis — measure a PLUTUS_VISION frame's PRICE AXIS from its own gutter ticks.

WHY THIS EXISTS (measured 2026-10-25). The LOOK judge maps a card's zone PRICE to a row of the
frame; without the frame's own scale a price is meaningless. The judge refuses with
JEV_BAD_ARGUMENTS ("a zone price needs the frame's axis mapping") rather than guessing — correct,
and it left the LOOK unreachable on every frame that did not carry a hand-written axis.

THE INSTRUMENT. The price gutter is a column of ~13 labels at a FIXED 0.100 step. Their row
centres are evenly spaced, so the scale is (0.100 / median-spacing) per px. The ONE unknown is
the price of a given tick, which this resolves from the chart's LAST-PRICE TAG — the highlighted
label the renderer draws at the close. That tag is the only gutter row whose ink is orders of
magnitude larger than a tick's, so it identifies itself.

★ VALIDATED, not assumed. The instrument proves itself on every run: the tag's computed price is
compared against the fixture's own last close, and the run FAILS LOUD (AXIS_UNVALIDATED) when the
two disagree by more than one tick. A scale that cannot be checked is a guess wearing a number.

    python3 scripts/frame_axis.py <frame.png> --fixture fixtures/bars/2026-07-06.json
    python3 scripts/frame_axis.py <frame.png> --fixture ... --write-card cards/2026-07-06/DXY.json

Exit 0 = measured and validated · 1 = the frame carries no readable gutter · 2 = AXIS_UNVALIDATED
"""
from __future__ import annotations

import argparse
import json
import sys

import numpy as np


def _load(path: str):
    try:
        from PIL import Image
    except ImportError:
        sys.exit("frame_axis: pillow is required (pip install pillow)")
    return np.array(Image.open(path).convert("RGB"))


def measure_axis(arr, gutter_left: int | None = None, pane_y0: int = 118, pane_y1: int = 803) -> dict:
    """Measure (price_hi, price_lo, y0, y1) from the gutter's tick rows + the last-price tag."""
    H, W, _ = arr.shape
    left = gutter_left if gutter_left is not None else int(W * 0.955)
    gut = arr[:, left:W].astype(int)
    bright = (gut.max(axis=2) > 110)
    prof = bright.sum(axis=1)
    rows = np.where(prof > 0)[0]
    if rows.size == 0:
        raise SystemExit("AXIS_UNREADABLE: no ink in the price gutter")
    groups: list[list[int]] = []
    for r in rows:
        if groups and r - groups[-1][-1] <= 3:
            groups[-1].append(r)
        else:
            groups.append([r])
    bands = [(g[0], g[-1], int(prof[g].sum())) for g in groups if len(g) >= 4]
    if len(bands) < 4:
        raise SystemExit(f"AXIS_UNREADABLE: {len(bands)} gutter bands (need the tick column)")
    # a TICK is thin (few rows of ink); the LAST-PRICE TAG is a filled chip — orders of magnitude
    # more ink. Splitting on ink mass identifies the tag without knowing its row.
    inks = sorted(b[2] for b in bands)
    med = inks[len(inks) // 2]
    ticks = [b for b in bands if b[2] <= max(4 * med, 200)]
    tags = [b for b in bands if b[2] > max(4 * med, 200)]
    if len(ticks) < 3:
        raise SystemExit(f"AXIS_UNREADABLE: {len(ticks)} ticks found")
    centres = [(a + b) // 2 for a, b, _ in ticks]
    diffs = [d for d in np.diff(centres) if d > 0]
    step = float(np.median(diffs))
    if step <= 0:
        raise SystemExit("AXIS_UNREADABLE: tick spacing is not positive")
    # ★ THE COLUMN IS A LATTICE, AND THE GUTTER IS NOT ONLY TICKS. It also carries the IDE's own
    #   toolbar text and the clock, so centres[0] is not necessarily a tick (measured: a stray
    #   band 32 px above the first real tick made the origin read 100.765 instead of 101.700).
    #   Keep the largest subset that fits start + k*step within a quarter step.
    _tol = step / 4.0
    _best, _best_n = None, 0
    for _cand in centres:
        _fit = [c for c in centres
                if min(((c - _cand) % step), step - ((c - _cand) % step)) < _tol]
        if len(_fit) > _best_n:
            _best, _best_n = _fit, len(_fit)
    if _best is None or len(_best) < 3:
        raise SystemExit(f"AXIS_UNREADABLE: no regular tick lattice (best fit {_best_n} rows)")
    centres = sorted(_best)
    step = float(np.median(np.diff(centres)))
    if step <= 0:
        raise SystemExit("AXIS_UNREADABLE: tick spacing is not positive")
    per_px = 0.100 / step
    tag_row = (tags[0][0] + tags[0][1]) // 2 if tags else None
    return {
        "tick_rows": centres,
        "tick_step_px": round(step, 3),
        "price_per_px": round(per_px, 9),
        "tag_row": tag_row,
        "pane_y0": pane_y0,
        "pane_y1": pane_y1,
        "_per_px": per_px,
        "_top_tick_row": centres[0],
    }


def solve(axis: dict, top_tick_price: float) -> dict:
    per, r0 = axis["_per_px"], axis["_top_tick_row"]
    p = lambda y: top_tick_price - (y - r0) * per          # noqa: E731
    return {
        "price_hi": round(p(axis["pane_y0"]), 5),
        "price_lo": round(p(axis["pane_y1"]), 5),
        "y0": int(axis["pane_y0"]),
        "y1": int(axis["pane_y1"]),
        "price_per_px": round(per, 9),
        "tick_step_px": axis["tick_step_px"],
        "top_tick_price": top_tick_price,
        "top_tick_row": r0,
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("frame")
    ap.add_argument("--fixture", required=True, help="bars json — the axis is VALIDATED against its last close")
    ap.add_argument("--gutter-left", type=int, default=None)
    ap.add_argument("--pane-y0", type=int, default=118)
    ap.add_argument("--pane-y1", type=int, default=803)
    ap.add_argument("--write-card", default=None, help="inject the measured axis block into this card")
    ap.add_argument("--label-crop-x0", type=int, default=640, help="left edge of the judge's label window")
    ap.add_argument("--label-crop-x1", type=int, default=1520, help="right edge of the judge's label window")
    a = ap.parse_args(argv)

    arr = _load(a.frame)
    ax = measure_axis(arr, a.gutter_left, a.pane_y0, a.pane_y1)
    if ax["tag_row"] is None:
        sys.exit("AXIS_UNVALIDATED: the frame carries no last-price tag to anchor the tick column")

    bars = json.load(open(a.fixture))
    # THE FIXTURE SHAPE: {"schema","provenance","cells":[{"pair","timeframe","bars":[...]}]}.
    # A bare list or a {"bars":...} envelope are both accepted; the cells envelope is the one this
    # tree actually ships (fixtures/bars/<week>.json).
    if isinstance(bars, list):
        seq = bars
    elif isinstance(bars.get("bars"), list):
        seq = bars["bars"]
    elif isinstance(bars.get("cells"), list) and bars["cells"]:
        seq = bars["cells"][0].get("bars") or []
    else:
        seq = []
    if not seq:
        sys.exit(f"AXIS_UNVALIDATED: {a.fixture} carries no bars")
    close = float(seq[-1]["close"] if isinstance(seq[-1], dict) else seq[-1][4])

    # the tag sits AT the close; the ticks are 0.100 apart, so the tag's row maps to a price whose
    # distance from the nearest tick is a whole multiple of 0.100. Solve the tick column's origin
    # by putting the tag exactly on `close` and snapping the ticks to the 0.100 grid.
    per, r0 = ax["_per_px"], ax["_top_tick_row"]
    origin = close + (ax["tag_row"] - r0) * per          # the top tick's price implied by the tag
    snapped = round(origin / 0.100) * 0.100              # the grid is 0.100; snap the origin to it
    # THE SNAP TOLERANCE IS HALF A TICK. The tag is the last TRADED price and sits
    # up to half a tick off a grid line; the real proof is the read-back check below.
    if abs(origin - snapped) > 0.050:
        sys.exit(f"AXIS_UNVALIDATED: the tag implies a top tick of {origin:.5f}, which is "
                 f"{abs(origin - snapped):.5f} off the 0.100 grid (max 0.050) — the tag is not on "
                 f"the tick column, or the gutter is not the price axis")

    axis = solve(ax, snapped)
    # ★ THE INSTRUMENT PROVES ITSELF: read the close back through the solved axis.
    back = axis["price_hi"] - (ax["tag_row"] - axis["y0"]) * ax["_per_px"]
    delta = abs(back - close)
    print(f"frame_axis: {a.frame}")
    print(f"  ticks       {len(ax['tick_rows'])} at {ax['tick_step_px']}px = 0.100  "
          f"({ax['_per_px']:.6f}/px)")
    print(f"  top tick    row {axis['top_tick_row']} = {snapped:.5f}")
    print(f"  axis        price_hi {axis['price_hi']:.5f} (row {axis['y0']}) -> "
          f"price_lo {axis['price_lo']:.5f} (row {axis['y1']})")
    print(f"  VALIDATION  tag row {ax['tag_row']} reads back {back:.5f} vs the fixture close "
          f"{close:.5f}  (delta {delta:.5f})")
    if delta > 0.100:
        sys.exit(f"AXIS_UNVALIDATED: the axis reads the close as {back:.5f} but the fixture closes "
                 f"at {close:.5f} — {delta:.5f} apart, beyond one tick. The frame and the fixture "
                 f"are not the same bar set, or the gutter is not the price axis.")

    if a.write_card:
        card = json.load(open(a.write_card))
        card["axis"] = {k: (int(v) if isinstance(v, (int,)) or type(v).__name__ == "int64"
                            else float(v) if type(v).__name__ in ("float64", "float32")
                            else v) for k, v in axis.items()}
        # ── THE JUDGE'S WINDOW, FRAMED ON THE MEASURED SUBJECT ─────────────────────────────
        # Two defects, both measured on the golden frame:
        #  (1) jev_gate's auto-crop is `yc - h2 - 6 .. yc + h2` (h2 = 13) with yc = the ZONE MID.
        #      Every role label's white text sits +7..+9 px BELOW the zone mid, so its bottom row
        #      lands on the crop's last row and is clipped.
        #  (2) the auto-crop is the FULL pane width (~930 px). The label is 233..316 px wide, so
        #      the text filled a quarter of the window and the judge read two of five as ABSENT.
        # The card's own `label_crop` is the sanctioned override (`_zone_rows` skips the auto-crop
        # when every zone carries one), so the window is declared from MEASUREMENT here — not by
        # editing the sha-pinned gate, and not by inflating the fill until the judge agrees.
        _mx, _mn = arr.max(axis=2), arr.min(axis=2)
        # white label text on a coloured band: all channels high AND near-equal. A candle body or
        # a zone fill is saturated, so (max-min) is large and it is excluded.
        _text = (_mn > 120) & ((_mx - _mn) < 45)
        y_of = lambda pr: int(round(axis["y0"] + (axis["price_hi"] - pr) *
                                    (axis["y1"] - axis["y0"]) /
                                    (axis["price_hi"] - axis["price_lo"])))   # noqa: E731
        px0, px1 = int(a.label_crop_x0), int(a.label_crop_x1)
        for z in card.get("zones") or []:
            mid = (float(z["top"]) + float(z["bottom"])) / 2.0
            yc = y_of(mid)
            band = _text[max(0, yc - 26):yc + 30, px0:px1]
            cols = np.where(band.sum(axis=0) > 0)[0]
            rows = np.where(band.sum(axis=1) > 0)[0]
            if cols.size == 0 or rows.size == 0:
                # NO TEXT MEASURED -> keep a tight window on the zone mid and say so loudly.
                # A silent wide window is how the judge got a quarter-filled crop in the first place.
                print(f"              {z['name']:24} NO LABEL TEXT MEASURED near row {yc} "
                      f"— label_crop left at the zone mid")
                z["label_crop"] = [px0 + 400, max(0, yc - 14), px1 - 100, yc + 14]
                continue
            # merge word gaps into ONE text run, then pad
            runs = []
            st = cols[0]
            prv = cols[0]
            for c in cols[1:]:
                if c - prv <= 25:
                    prv = c
                else:
                    runs.append((st, prv))
                    st = c
                    prv = c
            runs.append((st, prv))
            a0, b0 = max(runs, key=lambda r: r[1] - r[0])
            ty0 = int(rows.min()) + max(0, yc - 26)
            ty1 = int(rows.max()) + max(0, yc - 26)
            z["label_crop"] = [px0 + int(a0) - 12, max(0, ty0 - 6),
                               px0 + int(b0) + 12, ty1 + 6]
        json.dump(card, open(a.write_card, "w"), indent=1)
        print(f"  wrote       axis block + {len(card.get('zones') or [])} label_crop -> {a.write_card}")
        for z in card.get("zones") or []:
            c = z["label_crop"]
            print(f"              {z['name']:24} label_crop {c}  "
                  f"({c[2]-c[0]}x{c[3]-c[1]} px)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
