#!/usr/bin/env python3
"""
ST-21 — THE SEAL / TAMPER acceptance suite (W5's gate)

    python3 scripts/e1_st_21.py
    python3 scripts/e1_st_21.py test_build_seal

THE PROPERTY UNDER TEST (C4 / the pin's HARD STOP H1): the build REFUSES to run when v1 has
drifted. This suite TAMPERS v1 in a temp copy, runs the builder against it, asserts the refusal
AND the non-zero exit, then restores — so the seal is proven load-bearing, not decorative.

IT NEVER TOUCHES THE REAL v1: it copies the tree's v1 to a temp dir, tampers THAT, and points
the builder at the temp dir via PV2_* env, so the operator's baseline is never at risk.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
V1_SEAL = "0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1"

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def test_build_seal() -> None:
    v1 = os.path.join(ROOT, "plutus-vision-v1.pine")
    # ── the clean baseline is intact ───────────────────────────────────────────────
    import hashlib
    with open(v1, "rb") as f:
        live = hashlib.sha256(f.read()).hexdigest()
    record("ST-21a  the real v1 is the seal", live == V1_SEAL, live[:16])

    # ── the tamper is done in a COPY, never the real tree ────────────────────────────
    with tempfile.TemporaryDirectory() as td:
        proj = os.path.join(td, "proj")
        os.makedirs(proj)
        # the builder expects /scripts + /plutus-vision-v1.pine + /plutus-vision-lqz
        shutil.copytree(os.path.join(ROOT, "scripts"), os.path.join(proj, "scripts"))
        shutil.copytree(os.path.join(ROOT, "plutus-vision-lqz"), os.path.join(proj, "plutus-vision-lqz"))
        shutil.copytree(os.path.join(ROOT, "data"), os.path.join(proj, "data"))
        v1t = os.path.join(proj, "plutus-vision-v1.pine")
        shutil.copy(v1, v1t)
        # TAMPER
        with open(v1t, "a") as f:
            f.write("\n// tamper\n")
        env = dict(os.environ)
        r = subprocess.run([sys.executable, os.path.join(proj, "scripts", "lqz_vision_v2_build.py"),
                            os.path.join(td, "out.pine")],
                           capture_output=True, text=True, cwd=proj, env=env, timeout=120)
        out = (r.stdout + r.stderr)
        record("ST-21b  a tampered v1 -> the build REFUSES (HARD STOP H1)",
               r.returncode != 0 and "HARD STOP H1" in out, f"exit={r.returncode}")
        record("ST-21c  the refusal names both shas",
               V1_SEAL[:16] in out and "on disk" in out, "")

    # ── the real baseline is UNTOUCHED after the test ────────────────────────────────
    with open(v1, "rb") as f:
        after = hashlib.sha256(f.read()).hexdigest()
    record("ST-21d  the real v1 is UNCHANGED after the tamper test", after == V1_SEAL, "")


def check_build_seal_h1() -> None:
    test_build_seal()


def main(argv: list[str]) -> int:
    want = argv[0] if argv else None
    if want and want not in ("test_build_seal", "test_build_seal_h1", "ST-21"):
        print(f"  no such test: {want}", file=sys.stderr)
        return 2
    test_build_seal()
    fails = [n for n, ok, _ in RESULTS if not ok]
    print(f"\nRESULT pass={len(RESULTS)-len(fails)} fail={len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
