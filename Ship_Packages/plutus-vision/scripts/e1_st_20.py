#!/usr/bin/env python3
"""
ST-20 — THE PAYLOAD CONTRACT acceptance suite (W3's gate).

    python3 scripts/e1_st_20.py
    python3 scripts/e1_st_20.py test_extract_contract

Runs the REAL extractor (scripts/e1_extract.py, offline fixtures) into a temp dir, then
asserts the emitted payload against the v8 contract. The adversarial half proves the
contract check itself BITES (a zone missing zCat is flagged) — a validator never seen red
proves nothing.

THE CONTRACT UNDER TEST (plutus-vision-e1-automatic_DPL1_SPEC.md §5 item 3, blueprint §15):
  every zone: top · bottom · name · confluence · pressure_degree · zfp
  every zone: zCat ∈ {RES,MID,SUP}  ·  zTir ∈ {T1,T2}  ·  degree_v8 ∈ the tower's vocabulary
  every level: a non-empty label (no fabricated number)
  the payload: >=1 RES AND >=1 SUP  (both directions present)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def _validate(doc: dict) -> list[str]:
    """The contract validator — returns the list of violations (empty == clean)."""
    errs: list[str] = []
    zs = doc.get("zones", [])
    if not zs:
        return ["no zones"]
    V8_DEGS = {"EXTREME", "HEAVY", "MODERATE-HEAVY", "MODERATE", "LIGHT", "MINIMAL"}
    for z in zs:
        for f in ("top", "bottom", "name", "confluence", "pressure_degree", "zfp"):
            if f not in z:
                errs.append(f"zone {z.get('name','?')}: missing {f}")
        if z.get("zCat") not in ("RES", "MID", "SUP"):
            errs.append(f"zone {z.get('name','?')}: bad zCat {z.get('zCat')!r}")
        if z.get("zTir") not in ("T1", "T2"):
            errs.append(f"zone {z.get('name','?')}: bad zTir {z.get('zTir')!r}")
        # degree_v8 — the zfill/zbord tower's LITERAL vocabulary (no MODERATE_HEAVY underscore)
        if z.get("degree_v8") not in V8_DEGS:
            errs.append(f"zone {z.get('name','?')}: bad degree_v8 {z.get('degree_v8')!r}")
        for lv in z.get("levels", []):
            if not lv.get("label"):
                errs.append(f"zone {z.get('name','?')}: a level with no label")
    cats = {z.get("zCat") for z in zs}
    if "RES" not in cats:
        errs.append("no RES zone (nothing above spot)")
    if "SUP" not in cats:
        errs.append("no SUP zone (nothing below spot)")
    return errs


def test_extract_contract() -> None:
    # ── the negative control FIRST: assert the SPECIFIC violations the checks own ──────
    broken = {"zones": [
        {"name": "X", "top": 1.0, "bottom": 0.9, "confluence": 4, "pressure_degree": "LIGHT",
         "zfp": 0, "zTir": "T2", "levels": [{"label": ""}]},   # no zCat, no degree_v8, no label
    ]}
    errs = _validate(broken)
    # each check must NAME its own subject — a generic >=2 would stay true if a check were deleted
    record("ST-20a  the validator BITES per-check (zCat + degree_v8 + the no-label level)",
           any("zCat" in e for e in errs)
           and any("degree_v8" in e for e in errs)
           and any("no label" in e for e in errs),
           f"{len(errs)} violations")

    # ── run the REAL extractor into a temp dir ──────────────────────────────────────
    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run(
            [sys.executable, os.path.join(HERE, "e1_extract.py"),
             "--pair", "DXY", "--week", "2026-07-06", "--out", td],
            capture_output=True, text=True, cwd=ROOT, timeout=180)
        record("ST-20b  the extractor exits 0", r.returncode == 0, f"exit={r.returncode}")
        # THE WEEK IS THE CHART'S (the extractor anchors to the bars' week, not --week). Find
        # whatever payload the extractor wrote rather than pinning a stale week name.
        _files = sorted(f for f in os.listdir(td) if f.endswith(".json"))
        path = os.path.join(td, _files[0]) if _files else os.path.join(td, "DXY-NONE.json")
        record("ST-20c  the payload file exists", len(_files) == 1, ", ".join(_files) or "(none)")
        if not os.path.exists(path):
            return
        doc = json.load(open(path))

    errs = _validate(doc)
    record("ST-20d  the payload passes the v8 contract", not errs,
           f"{len(doc.get('zones', []))} zones" if not errs else "; ".join(errs[:3]))

    zones = doc.get("zones", [])
    # GUARD the vacuous pass: an empty zone list is NOT a pass (all() on empty is True)
    record("ST-20e  >=1 RES AND >=1 SUP present (non-empty)",
           bool(zones) and "RES" in {z.get("zCat") for z in zones}
           and "SUP" in {z.get("zCat") for z in zones},
           f"cats={sorted({z.get('zCat') for z in zones})}")

    # every level carries a label (no fabricated number) — use .get (a broken payload must not
    # crash the diagnostic that exists to FLAG it)
    all_lv = [lv for z in zones for lv in z.get("levels", [])]
    record("ST-20f  every level carries a label (non-empty set)",
           bool(all_lv) and all(lv.get("label") for lv in all_lv), f"{len(all_lv)} levels")

    # the degree is in the zfill/zbord tower's literal vocabulary
    V8_DEGS = {"EXTREME", "HEAVY", "MODERATE-HEAVY", "MODERATE", "LIGHT", "MINIMAL"}
    record("ST-20g  degree_v8 is in the tower's vocabulary (non-empty set)",
           bool(zones) and all(z.get("degree_v8") in V8_DEGS for z in zones),
           "no MODERATE_HEAVY underscore leaks")


def check_e1_payload_contract() -> None:
    test_extract_contract()


def main(argv: list[str]) -> int:
    want = argv[0] if argv else None
    if want and want not in ("test_extract_contract", "test_e1_payload_contract", "ST-20"):
        print(f"  no such test: {want}", file=sys.stderr)
        return 2
    test_extract_contract()
    fails = [n for n, ok, _ in RESULTS if not ok]
    print(f"\nRESULT pass={len(RESULTS)-len(fails)} fail={len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
