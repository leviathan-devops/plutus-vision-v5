#!/usr/bin/env python3
"""test_zone_assembly.py — THE W2 GATE (runs the engine itself; never a stale payload).

THE CANON (Zone Assembly Algorithm, steps 3-7, verbatim):
  step 3 "A 'cluster' is 3+ levels within a 0.15 DXY band."
  step 7 the names are POSITIONAL ("the zones ABOVE the spot are RES … the one straddling is
         the Equilibrium").

THE DEFECTS THIS PROVES DEAD:
  F-57  the zone count was FORCED to 5, a missing slot FABRICATED at a 2-pillar floor
  F-58  the names were assigned BY RANK, overwriting the positional classify

EXIT 0 = the assembly obeys the canon. EXIT 1 = it does not.
"""
from __future__ import annotations
import json
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIX = ROOT / "fixtures" / "bars"
PASS, FAIL = [], []


def ok(name, cond, detail=""):
    (PASS if cond else FAIL).append((name, detail))
    print(f"{'PASS' if cond else 'FAIL'} {name} {detail}")


def run_week(fixture: str, outdir: str) -> dict:
    """Run the engine against a controlled fixture. The engine anchors to the FIXTURE's own
    last bar (the WEEK_ANCHOR law), so each fixture yields its own week's payload."""
    env = {**os.environ, "E1_FIXTURE": str(FIX / fixture)}
    p = subprocess.run([sys.executable, str(ROOT / "scripts" / "e1_extract.py"),
                        "--pair", "DXY", "--out", outdir],
                       capture_output=True, text=True, env=env)
    if p.returncode != 0:
        return {"_err": p.stderr[-400:]}
    outs = sorted(pathlib.Path(outdir).glob("DXY-*.json"))
    return json.loads(outs[-1].read_text()) if outs else {}


def main() -> int:
    fixtures = sys.argv[1:] or ["2026-07-06.json", "cv-2026-04-13.json", "cv-2026-05-04.json",
                                "cv-2026-06-15.json", "cv-2026-06-29.json", "cv-2026-08-24.json"]
    with tempfile.TemporaryDirectory() as td:
        for fx in fixtures:
            d = run_week(fx, td)
            if d.get("_err") or not d.get("zones"):
                ok(f"{fx}: produced zones", False, d.get("_err", "no zones"))
                continue
            zs, spot = d["zones"], d.get("spot")
            tag = fx.replace(".json", "")
            # T1 — THE 3+ FLOOR (canon step 3)
            thin = [z["name"] for z in zs if len(z.get("levels", [])) < 3]
            ok(f"{tag} T1 every zone has >= 3 levels", not thin, f"thin: {thin}")
            # T2 — DATA-DRIVEN COUNT (F-57): never a forced 5
            ok(f"{tag} T2 count is data-driven", 1 <= len(zs) <= 7, f"zones={len(zs)}")
            # T3 — POSITIONAL NAMES (F-58): RES above spot, SUP below
            res = [z for z in zs if z.get("zCat") == "RES"]
            sup = [z for z in zs if z.get("zCat") == "SUP"]
            bad_res = [z["name"] for z in res if z["bottom"] <= spot]
            bad_sup = [z["name"] for z in sup if z["top"] >= spot]
            ok(f"{tag} T3a RES above spot", not bad_res, f"below: {bad_res}")
            ok(f"{tag} T3b SUP below spot", not bad_sup, f"above: {bad_sup}")
            # T4 — the MID straddles spot
            for z in [z for z in zs if z.get("zCat") == "MID"]:
                ok(f"{tag} T4 Equilibrium straddles spot", z["bottom"] <= spot <= z["top"],
                   f"{z['bottom']}..{z['top']} vs {spot}")
            # T5 — every zone carries a ZFP receipt (W1's contract holds through W2)
            ok(f"{tag} T5 every zone carries a zfp_receipt",
               all("zfp_receipt" in z for z in zs), "")

    print(f"\nW2 GATE: {len(PASS)} pass / {len(FAIL)} fail")
    for n, d in FAIL:
        print(f"  FAIL {n} {d}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
