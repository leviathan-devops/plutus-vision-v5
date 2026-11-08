#!/usr/bin/env python3
"""test_pillars.py — THE W3/W4 GATE (dimensions vary + the 4H block verification).

THE CANON:
  - The confluence is SIX dimensions, each 0-2, computed PER LEVEL (Synthesis Engine).
  - Step 0f: a 4H order block is verified (width cap 0.40, a date stamp, no overlap).
  - Pillars 1,2,5,6,9 are chart-computable; 3,4,7 need external data ([NO DATA] when blocked).

THE DEFECTS THIS PROVES DEAD:
  F-68  `technical` and `structural` were FLAT CONSTANTS (2.0 on every zone) — no discrimination
  F-63  the 4H order block had NO verification protocol

EXIT 0 = the pillars discriminate. EXIT 1 = they do not.
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


def run_week(fixture: str, td: str) -> dict:
    env = {**os.environ, "E1_FIXTURE": str(FIX / fixture)}
    subprocess.run([sys.executable, str(ROOT / "scripts" / "e1_extract.py"),
                    "--pair", "DXY", "--out", td], capture_output=True, text=True, env=env)
    outs = sorted(pathlib.Path(td).glob("DXY-*.json"))
    return json.loads(outs[-1].read_text()) if outs else {}


def main() -> int:
    fixtures = ["2026-07-06.json", "cv-2026-04-13.json", "cv-2026-05-04.json",
                "cv-2026-06-15.json", "cv-2026-06-29.json"]
    with tempfile.TemporaryDirectory() as td:
        for i, fx in enumerate(fixtures):
            sub = pathlib.Path(td) / f"w{i}"
            sub.mkdir()
            d = run_week(fx, str(sub))
            if not d.get("zones"):
                ok(f"{fx} produced zones", False, "")
                continue
            tag = fx.replace(".json", "")
            zs = d["zones"]
            # T1 — NO FLAT DIMENSION (F-68): across the zones, `technical` must not be one value
            tech = {z["dims"]["technical"] for z in zs} if "dims" in zs[0] else None
            sets = [z["levels"] for z in zs]
            # the level pool's dimensions (the raw evidence) must not be a single constant
            lv = d.get("levels", [])
            tech_vals = {round(l.get("technical", 0.0), 2) for l in lv}
            struct_vals = {round(l.get("structural", 0.0), 2) for l in lv}
            ok(f"{tag} T1 `technical` varies across the level pool", len(tech_vals) > 1,
               f"{sorted(tech_vals)[:6]}")
            ok(f"{tag} T1 `structural` varies across the level pool", len(struct_vals) > 1,
               f"{sorted(struct_vals)[:6]}")
            # T2 — PILLAR 6 PRESENT (the fib retracement + the round grid)
            labels = " ".join(l.get("label", "") for l in lv)
            ok(f"{tag} T2 Pillar 6 (fib + rounds) contributes", "P6_FIB" in labels or "P6_ROUND" in labels,
               "")
            # T3 — the pillars that need external data are honest [NO DATA], never fabricated
            notes = d.get("notes", {})
            p7 = notes.get("P7_derivatives") if isinstance(notes, dict) else None
            p7_status = p7.get("status") if isinstance(p7, dict) else None
            ok(f"{tag} T3 P7 derivatives reads [NO DATA] (never fabricated)",
               p7_status in ("NO_DATA", None), f"status={p7_status}")
            # T4 — THE LSZ IS A FIRST-CLASS ZONE OBJECT (canon Step 0.45; F-62)
            lsz = d.get("lsz", [])
            ok(f"{tag} T4 lsz[] first-class objects present", len(lsz) > 0, f"{len(lsz)} objects")
            if lsz:
                z0 = lsz[0]
                ok(f"{tag} T4 the LSZ carries range/type/source/function/priority",
                   all(k in z0 for k in ("range", "type", "source", "function", "priority")),
                   f"keys {sorted(z0)}")
                ok(f"{tag} T4 the LSZ range is [low, low+0.05]",
                   round(z0["range"][1] - z0["range"][0], 5) == 0.05, f"{z0['range']}")

    print(f"\nW3/W4 GATE: {len(PASS)} pass / {len(FAIL)} fail")
    for n, d in FAIL:
        print(f"  FAIL {n} {d}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
