#!/usr/bin/env python3
"""_diag_zones.py — per-zone score terms + the canon CLUSTER (3+ levels within 0.15)."""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import e1_extract as E  # noqa: E402

bars, src, prov = E.fetch_best("DXY", "1H")
levels, notes = E.build_levels(bars, "DXY", "2026-07-13")
spot = 101.062
blocks = E.four_h_order_blocks(bars)
wk = bars[-120:] if len(bars) > 120 else bars
hi = max(b["h"] for b in wk)
lo = min(b["l"] for b in wk)
rng = hi - lo
print(f"bars={len(bars)} levels={len(levels)} blocks={len(blocks)} hi={hi:.3f} lo={lo:.3f}")
BANDS = [("Ceiling", 0.85, 1.00, "RES"), ("Upper", 0.66, 0.85, "RES"),
         ("Eq", 0.34, 0.66, "MID"), ("Mid", 0.15, 0.34, "SUP"),
         ("Floor", 0.00, 0.15, "SUP")]
d5 = ("technical", "options", "analyst", "structural", "psychological")


def clusters(inband, tol=0.15):
    """The canon's clusters: consecutive levels (sorted) within `tol`; return the largest 3+."""
    xs = sorted(inband, key=lambda l: l["price"])
    groups = []
    cur = []
    for l in xs:
        if cur and l["price"] - cur[-1]["price"] > tol:
            groups.append(cur)
            cur = []
        cur.append(l)
    if cur:
        groups.append(cur)
    return [g for g in groups if len(g) >= 3]


for nm, f_lo, f_hi, cat in BANDS:
    blo = lo + f_lo * rng
    bhi = lo + f_hi * rng
    inband = [l for l in levels if blo <= l["price"] <= bhi]
    if not inband:
        print(f"{nm:8s} NO INBAND")
        continue
    cl = clusters(inband)
    if cl:
        big = max(cl, key=len)
        cbest = max(big, key=lambda l: sum(l[d] for d in d5))
        cspan = max(x["price"] for x in big) - min(x["price"] for x in big)
        ctxt = (f"cluster n={len(big)} span={cspan:.3f} "
                f"score={sum(cbest[d] for d in d5):.1f} best={cbest['label']}")
    else:
        ctxt = "no 3+ cluster"
    top = max(l["price"] for l in inband)
    bot = min(l["price"] for l in inband)
    best = max(inband, key=lambda l: sum(l[d] for d in d5))
    print(f"{nm:8s} n={len(inband):3d} best5d={sum(best[d] for d in d5):4.1f} "
          f"reg={E.zone_regime(bot, top, bars, spot):.0f} ext={E.zone_extreme_bonus(bot, top, bars):.0f} "
          f"4h={E.zone_4h_bonus(bot, top, blocks, spot):.0f} | {ctxt}")
