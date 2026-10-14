#!/usr/bin/env python3
"""
ST-19 — THE GAP acceptance suite (W2's gate).

    python3 scripts/e1_st_19.py
    python3 scripts/e1_st_19.py test_classify_gap

Every case carries a PREMISE (the inputs' relationship to spot is asserted before the
classify is trusted) and an ADVERSARIAL half that goes RED if its guard is removed.

THE CONTRACT UNDER TEST (plutus-vision-e1-automatic_DPL1_SPEC.md §5 items 2,3,4):
  classify(top,bottom,spot) -> RES|MID|SUP (positional vs spot) · E1SpotMissing on a falsy spot
  tier(confluence) -> T1 (>=8) | T2
  zfp(top,bottom,pair) -> v8's round((top-bottom)/ref*100)
  norm_degree("MODERATE_HEAVY") -> "MODERATE-HEAVY" (the tower-branch bridge)
  a zero-height zone (top==bottom, the measured shape) is still classified
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import e1_category as C  # noqa: E402

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def test_classify_gap() -> None:
    spot = 101.048
    # premises: the shapes are what they claim
    assert 102.0 > 101.5 > spot, "premise: the RES band sits ENTIRELY above spot"
    assert spot > 100.5 > 100.0, "premise: the SUP band sits ENTIRELY below spot"

    # ── C1 · classify: above -> RES ─────────────────────────────────────────────────
    record("ST-19a  top>spot -> RES", C.classify(102.0, 101.5, spot) == "RES", "")

    # ── C2 · classify: below -> SUP ─────────────────────────────────────────────────
    record("ST-19b  bottom<spot -> SUP", C.classify(100.5, 100.0, spot) == "SUP", "")

    # ── C3 · classify: straddles -> MID ─────────────────────────────────────────────
    record("ST-19c  straddles spot -> MID", C.classify(101.2, 100.9, spot) == "MID", "")

    # ── C4 · the MEASURED zero-height zone still classifies ─────────────────────────
    # the real payload's shape: top==bottom (a single level, not a band)
    record("ST-19d  a zero-height zone (top==bottom) classifies",
           C.classify(101.281, 101.281, spot) == "RES"
           and C.classify(100.831, 100.831, spot) == "SUP", "the measured shape")

    # ── C5 · tier: confluence>=8 -> T1, else T2 ─────────────────────────────────────
    record("ST-19e  tier(8)==T1 and tier(7)==T2",
           C.tier(8) == "T1" and C.tier(7) == "T2" and C.tier(14) == "T1", "")

    # ── C6 · THE ZFP (canon Appendix B) — base by type + the B.2 modifiers ────────────
    # UPDATED (W1, FAILURE_LOG F-55): the width formula (zoneW/refRange) is DELETED. The ONE ZFP
    # is e1_zfp: a SOFT_WALL base is 40 (the (30,50) midpoint). A HARD_WALL base is 10 (5-15).
    import e1_zfp as Z
    _soft = Z.zfp({"top": 101.281, "bottom": 101.257, "zone_type": "SOFT_WALL"}, [], None, [])
    _hard = Z.zfp({"top": 101.281, "bottom": 101.257, "zone_type": "HARD_WALL"}, [], None, [])
    record("ST-19f  the ZFP is base-by-type (Appendix B.1), not the deleted width formula",
           _soft == 40 and _hard == 10,
           f"SOFT base 40 / HARD base 10 (canon B.1 midpoints)")
    record("ST-19f2 the width ZFP is GONE (no CAT.zfp)",
           not hasattr(C, "zfp"), "the third ZFP is deleted — ONE implementation")

    # ── C7 · the degree bridge: MODERATE_HEAVY -> MODERATE-HEAVY ─────────────────────
    record("ST-19g  norm_degree bridges MODERATE_HEAVY -> MODERATE-HEAVY",
           C.norm_degree("MODERATE_HEAVY") == "MODERATE-HEAVY"
           and C.norm_degree("LIGHT") == "LIGHT", "the tower-branch bridge")

    # ── C8 · ADVERSARIAL: a falsy spot raises (the loud fail) ───────────────────────
    # NEGATIVE CONTROL: delete the guard -> this goes RED.
    def _raises(fn, *a):
        try:
            fn(*a)
        except C.E1SpotMissing:
            return True
        except Exception:
            return False
        return False
    record("ST-19h  spot=0 RAISES E1SpotMissing",
           _raises(C.classify, 102.0, 101.5, 0), "negative control: the guard is load-bearing")

    # ── C9 · ADVERSARIAL: a None spot raises ────────────────────────────────────────
    record("ST-19i  spot=None RAISES E1SpotMissing",
           _raises(C.classify, 102.0, 101.5, None), "")

    # ── C10 · ADVERSARIAL: a NEAR-ZERO spot raises (exact ==0 missed 1e-15) ──────────
    # the verboo audit found this: `spot == 0` passed for 1e-15 -> a wrong classification.
    record("ST-19j  a near-zero spot (1e-15) RAISES", _raises(C.classify, 102.0, 101.5, 1e-15),
           "the float-safe guard is load-bearing")


def check_e1_category_gap() -> None:
    test_classify_gap()


def main(argv: list[str]) -> int:
    want = argv[0] if argv else None
    if want and want not in ("test_classify_gap", "test_e1_category_gap", "ST-19"):
        print(f"  no such test: {want}", file=sys.stderr)
        return 2
    test_classify_gap()
    fails = [n for n, ok, _ in RESULTS if not ok]
    print(f"\nRESULT pass={len(RESULTS)-len(fails)} fail={len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
