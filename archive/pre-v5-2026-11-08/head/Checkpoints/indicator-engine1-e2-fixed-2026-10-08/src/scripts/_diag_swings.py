#!/usr/bin/env python3
"""_diag_swings.py — the daily swing-extreme detection (why the ceiling has no swing high)."""
import datetime as dt
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import e1_extract as E  # noqa: E402

bars, src, prov = E.fetch_best("DXY", "1H")
daily = {}
for b in bars[-540:]:
    d = dt.datetime.fromtimestamp(b["t"] / 1000, dt.timezone.utc).date()
    row = daily.setdefault(d, {"h": b["h"], "l": b["l"], "c": b["c"], "o": b["o"]})
    row["h"] = max(row["h"], b["h"])
    row["l"] = min(row["l"], b["l"])
    row["c"] = b["c"]
print(f"daily rows={len(daily)}")
nhigh = nlow = 0
for dd, r in sorted(daily.items()):
    rng = r["h"] - r["l"]
    if rng <= 0:
        continue
    lw = min(r["o"], r["c"]) - r["l"]
    uw = r["h"] - max(r["o"], r["c"])
    islow = lw >= 0.15 and (r["c"] - r["l"]) / rng >= 0.5
    ishigh = uw >= 0.15 and (r["c"] - r["l"]) / rng <= 0.5
    nlow += islow
    nhigh += ishigh
    print(f"{dd} o={r['o']:.3f} h={r['h']:.3f} l={r['l']:.3f} c={r['c']:.3f} "
          f"rng={rng:.3f} uw={uw:.3f} lw={lw:.3f} {'HIGH' if ishigh else ''}{'LOW' if islow else ''}")
print(f"swing highs={nhigh} lows={nlow}")
