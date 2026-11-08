#!/usr/bin/env python3
"""test_payload_computed.py — THE W5 GATE.

THE DEFECT THIS PROVES DEAD (F-56): the Pine payload was HAND-WRITTEN LITERALS — the same five
`e1_injected_zfp.push(27)` values at `bar_index == 0` for every week. A "render" from them could
only ever show the one week somebody typed.

THE CONTRACT: two DIFFERENT weeks must emit DIFFERENT payloads (sha256), and every emitted value
must trace to the computed zone (never a literal).

EXIT 0 = the payload is computed. EXIT 1 = it is hand-written.
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


def gen_payload(fixture: str, td: str) -> pathlib.Path | None:
    env = {**os.environ, "E1_FIXTURE": str(FIX / fixture)}
    subprocess.run([sys.executable, str(ROOT / "scripts" / "e1_extract.py"),
                    "--pair", "DXY", "--out", td],
                   capture_output=True, text=True, env=env)
    outs = sorted(pathlib.Path(td).glob("DXY-*.json"))
    return outs[-1] if outs else None


def emit(payload: pathlib.Path, out: str) -> str:
    subprocess.run([sys.executable, str(ROOT / "scripts" / "pine_emit.py"),
                    "--data", str(payload), "--out", out], capture_output=True, text=True)
    return hashlib.sha256(pathlib.Path(out).read_bytes()).hexdigest()


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        pa = gen_payload("cv-2026-04-13.json", td)
        pb = gen_payload("cv-2026-05-04.json", td)
        ok("W5.0 two weeks generated payloads", pa is not None and pb is not None, f"{pa} {pb}")
        if pa and pb:
            sha_a = emit(pa, "/tmp/_pa.pine")
            sha_b = emit(pb, "/tmp/_pb.pine")
            ok("W5.1 THE CONTRACT: two weeks emit DIFFERENT payloads", sha_a != sha_b,
               f"{sha_a[:16]} vs {sha_b[:16]}")
            # W5.2 — the emitted zfp values match the computed zones (not literals)
            blk_a = pathlib.Path("/tmp/_pa.pine").read_text()
            import re
            zfps_pine = re.findall(r"e1_injected_zfp\.push\((\d+)\)", blk_a)
            zfps_json = [str(int(z["zfp"])) for z in
                         sorted(json.loads(pa.read_text())["zones"], key=lambda z: -float(z["top"]))]
            ok("W5.2 the emitted ZFPs equal the computed zones", zfps_pine == zfps_json,
               f"pine {zfps_pine} vs json {zfps_json}")
            # W5.3 — the ZFP is not a single repeated literal (the hand-written signature)
            ok("W5.3 the ZFPs are not one repeated literal",
               len(set(zfps_pine)) > 1 or len(zfps_pine) == 1, f"values {zfps_pine}")

    print(f"\nW5 GATE: {len(PASS)} pass / {len(FAIL)} fail")
    for n, d in FAIL:
        print(f"  FAIL {n} {d}")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
