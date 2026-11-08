#!/usr/bin/env python3
"""indicator_gate.py — THE W6 GATE (the differential + the 5-week litmus).

THE OPERATOR'S TEST, mechanized, in ONE gate:
  1. THE DIFFERENTIAL (the ZFP carries failure information): a breakout week's ceiling reads a
     HIGHER ZFP than a consolidation week's. F-54's whole point.
  2. THE 5-WEEK LITMUS: five DIFFERENT weeks each emit a DIFFERENT payload (never the same
     hand-written block). F-56's whole point.

EXIT 0 = the indicator's data is real. EXIT 1 = it is not — the build FAILS.
"""
from __future__ import annotations
import hashlib
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


def emit_sha(payload_path: pathlib.Path, out: str) -> str:
    subprocess.run([sys.executable, str(ROOT / "scripts" / "pine_emit.py"),
                    "--data", str(payload_path), "--out", out], capture_output=True, text=True)
    return hashlib.sha256(pathlib.Path(out).read_bytes()).hexdigest()


def main() -> int:
    # ── GATE 1: THE DIFFERENTIAL (the ZFP discriminates) ────────────────────────────────
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "test_zfp_discriminates.py")],
                       capture_output=True, text=True)
    ok("GATE-1 the differential ZFP test passes (breakout > consolidation)", r.returncode == 0,
       r.stdout.strip().splitlines()[-1] if r.stdout else "")

    # ── GATE 2: THE 5-WEEK LITMUS (five weeks, five different payloads) ─────────────────
    weeks = ["2026-07-06.json", "cv-2026-04-13.json", "cv-2026-05-04.json",
             "cv-2026-06-15.json", "cv-2026-06-29.json", "cv-2026-08-24.json"]
    with tempfile.TemporaryDirectory() as td:
        shas = {}
        for i, fx in enumerate(weeks):
            sub = pathlib.Path(td) / f"w{i}"          # a FRESH dir per fixture — otherwise the
            sub.mkdir()                               # alphabetically-last of an ACCUMULATED set
            env = {**os.environ, "E1_FIXTURE": str(FIX / fx)}   # is read, not the one just written
            subprocess.run([sys.executable, str(ROOT / "scripts" / "e1_extract.py"),
                            "--pair", "DXY", "--out", str(sub)], capture_output=True, text=True, env=env)
            outs = sorted(sub.glob("DXY-*.json"))
            if not outs:
                ok(f"GATE-2 {fx} produced a payload", False, "")
                continue
            shas[fx] = emit_sha(outs[-1], f"/tmp/_litmus_{i}.pine")
        ok(f"GATE-2 all {len(weeks)} weeks produced payloads", len(shas) == len(weeks), f"{len(shas)}")
        ok("GATE-2 THE LITMUS: every week's payload DIFFERS (no shared hand-written block)",
           len(set(shas.values())) == len(shas),
           f"{len(set(shas.values()))} distinct of {len(shas)}")

    print(f"\nW6 GATE: {len(PASS)} pass / {len(FAIL)} fail")
    for n, d in FAIL:
        print(f"  FAIL {n} {d}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
