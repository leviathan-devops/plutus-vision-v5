#!/usr/bin/env python3
"""
ST-22 — THE ANTI-FABRICATION acceptance suite (W7's gate)

    python3 scripts/e1_st_22.py
    python3 scripts/e1_st_22.py test_vlm_dead_arm

THE PROPERTY UNDER TEST (the operator's worst failure — a fabricated level on a chart):
a DEAD arm reads DEAD (never empty-but-OK), and a MALFORMED model answer NEVER becomes a strike.
parse_strikes returns [] on ANY unparseable output.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e1_vlm_options as V  # noqa: E402

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def test_vlm_dead_arm() -> None:
    # ── the anti-fabrication core: a malformed answer -> [] (NEVER a strike) ──────────
    junk = {"choices": [{"message": {"content": "I cannot read this image, sorry."}}]}
    record("ST-22a  no JSON array -> [] (no fabricated strike)",
           V.parse_strikes(junk) == [], "the guard is load-bearing")

    malformed = {"choices": [{"message": {"content": '[{"price": "abc", "vol": null}]'}}]}
    record("ST-22b  a row with a non-numeric price -> dropped",
           V.parse_strikes(malformed) == [], "only numeric price+vol survive")

    good = {"choices": [{"message": {"content": '[{"price": 100.5, "vol": 1.2}]'}}]}
    r = V.parse_strikes(good)
    record("ST-22c  a well-formed row IS parsed",
           len(r) == 1 and r[0]["price"] == 100.5 and r[0]["label"] == "VLM", "")

    empty = {"choices": [{"message": {"content": "[]"}}]}
    record("ST-22d  an empty table -> []", V.parse_strikes(empty) == [], "")

    # ── the fabricated-strike class beyond strings: bool + non-finite ─────────────────
    # isinstance(True,int) is True and NaN/Infinity parse as float — either becomes a fake strike.
    bool_p = {"choices": [{"message": {"content": '[{"price": true, "vol": 1.0}]'}}]}
    nan_p = {"choices": [{"message": {"content": '[{"price": NaN, "vol": 1.0}]'}}]}
    inf_p = {"choices": [{"message": {"content": '[{"price": Infinity, "vol": 1.0}]'}}]}
    record("ST-22g  bool / NaN / Infinity prices are REJECTED (no fabricated strike)",
           V.parse_strikes(bool_p) == [] and V.parse_strikes(nan_p) == []
           and V.parse_strikes(inf_p) == [], "the numeric filter is load-bearing")

    # ── the DEAD ARM reads DEAD, not empty-but-OK ─────────────────────────────────────
    # NEGATIVE CONTROL: point the arm at a dead port; health must RAISE ArmDead.
    orig = V.ARM
    V.ARM = "http://127.0.0.1:9"          # a closed port
    try:
        raised = False
        try:
            V.health(timeout=1)
        except V.ArmDead:
            raised = True
        record("ST-22e  a dead arm RAISES ArmDead (not an empty OK)", raised,
               "the auth probe is load-bearing")
    finally:
        V.ARM = orig

    # ── the arm probe: INFRA, not a property (the hermeticity law) ─────────────────────
    # The anti-fabrication PROPERTY is proven by ST-22a-e (a malformed answer -> []). Whether
    # the LIVE arm at :8010 is reachable is an INFRA fact — a hermetic container (or CI) has no
    # arm, and that must NOT fail the suite. Set E1_REQUIRE_ARM=1 to assert it on a host rig.
    import os as _os
    try:
        V.health(timeout=3)
        _arm = "up"
    except V.ArmDead:
        _arm = "absent"
    record("ST-22f  the arm probe (informational; E1_REQUIRE_ARM=1 to require)",
           _os.environ.get("E1_REQUIRE_ARM") != "1" or _arm == "up", f"arm {_arm}")


def check_e1_vlm_dead_arm() -> None:
    test_vlm_dead_arm()


def main(argv: list[str]) -> int:
    want = argv[0] if argv else None
    if want and want not in ("test_vlm_dead_arm", "test_e1_vlm_dead_arm", "ST-22"):
        print(f"  no such test: {want}", file=sys.stderr)
        return 2
    test_vlm_dead_arm()
    fails = [n for n, ok, _ in RESULTS if not ok]
    print(f"\nRESULT pass={len(RESULTS)-len(fails)} fail={len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
