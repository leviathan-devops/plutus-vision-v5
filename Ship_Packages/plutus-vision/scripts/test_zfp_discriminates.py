#!/usr/bin/env python3
"""test_zfp_discriminates.py — THE GATE (W1). The operator's complaint, mechanized.

THE CANON (Appendix B): the ZFP = base(zone_type) + SUM(modifiers). A zone in an active BREAKOUT
must read a HIGHER ZFP than the same zone in consolidation — the modifiers (momentum, cascade,
regime change) are the mechanism.

THE DEFECT THIS PROVES DEAD (F-54): the old `zfp_from_degree` mapped the confluence to a fixed
band, so the ZFP was monotone in zone STRENGTH and could never rise to signal failure.

EXIT 0 = the ZFP discriminates. EXIT 1 = it does not (the build FAILS).
"""
from __future__ import annotations
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import e1_zfp as ZFP  # noqa: E402

PASS, FAIL = [], []


def ok(name, cond, detail=""):
    (PASS if cond else FAIL).append((name, detail))
    print(f"{'PASS' if cond else 'FAIL'} {name} {detail}")


def synth_bars(spot: float, path: str, n: int = 240) -> list[dict]:
    """A synthetic series. path='consolidation' -> flat, quiet. path='breakout' -> rising INTO the
    zone (approaching it, not blowing through) with an ACCELERATING rate, so the momentum modifier
    fires toward a zone above spot — the operator's 'breakout surge at the ceiling'."""
    bars = []
    if path == "consolidation":
        p = spot - 0.30
        for i in range(n):
            p += 0.0015 * ((i % 3) - 1)
            bars.append({"o": p, "h": p + 0.02, "l": p - 0.02, "c": p, "v": 100,
                         "t": 1750000000 + i * 3600})
        return bars
    # BREAKOUT: flat, then an accelerating charge INTO the zone (ends at ~100.95, still rising).
    p = spot - 0.60
    start = int(n * 0.7)
    for i in range(n):
        if i >= start:
            k = i - start
            p += 0.004 + 0.0003 * k           # accelerating, still rising at the last bar
        else:
            p += 0.0004
        bars.append({"o": p, "h": p + 0.02, "l": p - 0.02, "c": p, "v": 100,
                     "t": 1750000000 + i * 3600})
    return bars


def main() -> int:
    # THE ZONE ABOVE SPOT (a resistance ceiling)
    zone = {"top": 101.10, "bottom": 101.00, "zone_type": "SOFT_WALL", "levels": [{"level_type": "PIVOT"}]}
    spot = 100.50

    bo_bars = synth_bars(spot, "breakout")
    co_bars = synth_bars(spot, "consolidation")

    z_bo = ZFP.zfp(zone, bo_bars, spot, [])
    z_co = ZFP.zfp(zone, co_bars, spot, [])

    print(f"  breakout-week ZFP      = {z_bo}")
    print(f"  consolidation-week ZFP = {z_co}")

    ok("T1 the ZFP is not a constant across paths", z_bo != z_co, f"{z_bo} vs {z_co}")
    ok("T2 THE OPERATOR'S TEST: a breakout reads HIGHER than consolidation", z_bo > z_co,
       f"breakout {z_bo} > consolidation {z_co}")

    # T3 — the ZFP is not a function of the confluence alone (the F-54 signature). Two zones with
    # the SAME confluence but different zone types must differ.
    hard = {"top": 101.10, "bottom": 101.00, "zone_type": "HARD_WALL", "levels": []}
    soft = {"top": 101.10, "bottom": 101.00, "zone_type": "SOFT_WALL", "levels": []}
    ok("T3 the ZFP depends on the zone TYPE, not the confluence alone",
       ZFP.zfp(hard, co_bars, spot, []) != ZFP.zfp(soft, co_bars, spot, []),
       f"HARD {ZFP.zfp(hard, co_bars, spot, [])} vs SOFT {ZFP.zfp(soft, co_bars, spot, [])}")

    # T4 — every canon modifier is present in the receipt
    receipt = ZFP.explain(zone, bo_bars, spot, [])
    names = {m["modifier"] for m in receipt["modifiers"]}
    want = {"spring_release", "macro_catalyst", "momentum", "cross_pair", "cascade", "regime_change"}
    ok("T4 all six canon B.2 modifiers present", want <= names, f"missing {want - names}")
    ok("T5 the receipt carries its canon citation", "Appendix B" in receipt.get("canon", ""))

    print(f"\nZFP GATE: {len(PASS)} pass / {len(FAIL)} fail")
    for n, d in FAIL:
        print(f"  FAIL {n} {d}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
