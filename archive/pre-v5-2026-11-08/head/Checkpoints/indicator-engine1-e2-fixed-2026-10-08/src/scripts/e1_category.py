#!/usr/bin/env python3
"""
e1_category.py — THE GAP, CLOSED. Three derivations the v8 renderer needs and the engine
did not produce, plus the degree-vocabulary bridge.

THE GAP (measured). trident_v8.pine's render loop colours each zone by `zCat` ∈ {RES,MID,SUP}
against the chart's spot; e1_extract.py emits `zone_type` ∈ {supply,demand} (a PROVENANCE
label). The renderer's vocabulary is POSITIONAL, the engine's is provenance — different
vocabularies. This module is the bridge.

THE SECOND GAP (measured 2026-10-05). e1_extract.py:242 bands `pressure_degree` as
`MODERATE_HEAVY` (underscore); trident_v8.pine's zfill/zbord tower branches on the literal
`"MODERATE-HEAVY"` (hyphen). Feeding the underscore form falls through the tower's `else` to
the LIGHT colour — a silent wrong-colour. `norm_degree()` closes it.

IMplements MASTER_BLUEPRINT.md §5 (the gap, closed) + §3.5 (calcZFP).
SPEC: plutus-vision-e1-automatic_DPL1_SPEC.md §5 items 2,3,4.
GATE: scripts/e1_st_19.py (test_classify_gap) -> `RESULT pass=N fail=0`.

    python3 scripts/e1_category.py --top 101.281 --bottom 101.281 --spot 101.048
"""

from __future__ import annotations

import argparse
import json
import sys

# v8's calcZFP reference ranges — trident_v8.pine:336, verbatim
# (REF_RANGE / REF_RANGE_DEFAULT DELETED with the width ZFP — FAILURE_LOG F-55. The ONE ZFP is
# e1_zfp.py; this module computes no ZFP. Leaving the dicts risked a future reader re-introducing
# the deleted formula.)

# the tier threshold — the canon's; confluence >= 8 is T1
TIER1_MIN = 8

# the degree-vocabulary bridge: the engine's band -> v8's zfill/zbord literal.
# Only the ONE aliased form; every other degree passes through unchanged (dict.get returns
# the key itself when absent), so a self-referential "MODERATE-HEAVY": "MODERATE-HEAVY" is
# redundant (audit finding, 2026-10-05).
_DEGREE_ALIAS = {
    "MODERATE_HEAVY": "MODERATE-HEAVY",
}


class E1SpotMissing(Exception):
    """Loud, named refusal — a category cannot be derived without spot."""


def classify(top: float, bottom: float, spot: float | None) -> str:
    """Positional category vs spot — the v8 renderer's `zCat` vocabulary.
    LOUD refusal when the spot is missing OR non-finite: `abs(nan) < 1e-9` is False and every
    comparison with NaN is False, so an unguarded NaN falls through to MID (the code-audit's
    high finding). A NaN/Inf spot is E1SpotMissing, never a silent MID."""
    if spot is None:
        raise E1SpotMissing("E1SpotMissing: spot is required to classify a zone")
    try:
        spot = float(spot)
    except (TypeError, ValueError):
        raise E1SpotMissing(f"E1SpotMissing: spot {spot!r} is not numeric")
    if spot != spot or spot in (float("inf"), float("-inf")) or abs(spot) < 1e-9:
        raise E1SpotMissing(f"E1SpotMissing: spot {spot!r} is not finite/non-zero")
    # an INVERTED zone (top < bottom) or a non-finite edge is malformed — refuse, never
    # mis-classify (the audit's high: NaN top/bottom makes every comparison False -> silent MID)
    try:
        top, bottom = float(top), float(bottom)
    except (TypeError, ValueError):
        raise ValueError(f"E1ZoneNonNumeric: top {top!r} bottom {bottom!r}")
    if top != top or bottom != bottom or top in (float("inf"), float("-inf")) or bottom in (float("inf"), float("-inf")):
        raise ValueError(f"E1ZoneNonFinite: top {top!r} bottom {bottom!r}")
    if top < bottom:
        raise ValueError(f"E1ZoneInverted: top {top} < bottom {bottom}")
    if bottom > spot:
        return "RES"
    if top < spot:
        return "SUP"
    return "MID"

def tier(confluence: int) -> str:
    """The renderer's `zTir` vocabulary. The canon's threshold: >=8 is T1, else T2."""
    return "T1" if confluence >= TIER1_MIN else "T2"


# ── THE ZFP IS DELETED HERE (FAILURE_LOG F-55) ──────────────────────────────────────────
# This was the THIRD ZFP: the zone WIDTH / reference range (trident_v8.pine:334-338). It reads
# ~9% for every clustered zone (they share a similar width), so it cannot distinguish one that
# holds from one that breaks. The canon's ZFP is base + modifiers — see e1_zfp.py. ONE ZFP.


def norm_degree(degree: str) -> str:
    """The engine emits MODERATE_HEAVY (underscore); v8's tower branches on MODERATE-HEAVY
    (hyphen). Normalise so the tower's branch matches — otherwise the zone falls through to
    the LIGHT default (a silent wrong-colour)."""
    return _DEGREE_ALIAS.get(degree, degree)


def derive(top: float, bottom: float, spot: float, confluence: int, degree: str,
           pair: str = "DXY") -> dict:
    """The full v8 contract for one zone: zCat + zTir + the label's ZFP + the degree bridge."""
    return {
        "zCat": classify(top, bottom, spot),
        "zTir": tier(confluence),
        "zfp_label": None,   # the ONE ZFP is e1_zfp.zfp(); this bridge computes no ZFP
        "degree_v8": norm_degree(degree),
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="the E1 category gap")
    ap.add_argument("--top", type=float, required=True)
    ap.add_argument("--bottom", type=float, required=True)
    ap.add_argument("--spot", type=float, required=True)
    ap.add_argument("--confluence", type=int, default=4)
    ap.add_argument("--degree", default="LIGHT")
    ap.add_argument("--pair", default="DXY")
    args = ap.parse_args(argv)
    try:
        out = derive(args.top, args.bottom, args.spot, args.confluence, args.degree, args.pair)
    except (E1SpotMissing, ValueError) as e:
        print(str(e), file=sys.stderr)
        return 1
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
