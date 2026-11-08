#!/usr/bin/env python3
"""
ST-26 — THE HARVEST HONESTY acceptance suite (W6's gate)

    python3 scripts/e1_st_26.py
    python3 scripts/e1_st_26.py test_harvest_dead_source

THE PROPERTY UNDER TEST (the pin's LOUD-FAIL-OR-CLEAR-PASS law): a source that is DOWN yields
[NO DATA] + a reason, and the harvest STILL SUCCEEDS. One dead source never kills the harvest,
and no source ever invents a value.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e1_sources as S  # noqa: E402

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def test_harvest_dead_source() -> None:
    # ── the NEGATIVE CONTROL: a source that RAISES must become [NO DATA], not a crash ──
    def boom(_week):
        raise S.SourceDown("SIMULATED_DOWN: for the test")
    S.SOURCE_PILLARS["_test_down"] = ("test", boom)
    try:
        pillars = S.harvest_all("2026-07-06")
        record("ST-26a  harvest_all NEVER raises (per-pillar capture)",
               isinstance(pillars, dict), f"{len(pillars)} pillars")
        d = pillars.get("_test_down", {})
        record("ST-26b  a raising source -> [NO DATA] + a reason",
               d.get("label") == "[NO DATA]" and d.get("reason", "").startswith("SIMULATED_DOWN"),
               d.get("label", "?"))
    finally:
        S.SOURCE_PILLARS.pop("_test_down", None)

    # ── the live ohlc source is UP and carries real bars ───────────────────────────
    pillars = S.harvest_all("2026-07-06")
    ohlc = pillars.get("ohlc", {})
    record("ST-26c  the ohlc source is up (the fixture)",
           ohlc.get("status") == "OK" and ohlc.get("count", 0) > 200,
           f"count={ohlc.get('count')}")

    # ── every DOWN pillar carries a reason; every OK pillar carries data ─────────────
    ok_clean = all((p.get("reason") and p.get("label") == "[NO DATA]") if p.get("status") == "DOWN"
                   else bool(p.get("data")) for p in pillars.values())
    record("ST-26d  DOWN -> [NO DATA]+reason ; OK -> data", ok_clean,
           f"{sum(1 for p in pillars.values() if p.get('status')=='OK')} up / {len(pillars)}")


def check_e1_harvest() -> None:
    test_harvest_dead_source()


def main(argv: list[str]) -> int:
    want = argv[0] if argv else None
    if want and want not in ("test_harvest_dead_source", "test_e1_harvest", "ST-26"):
        print(f"  no such test: {want}", file=sys.stderr)
        return 2
    test_harvest_dead_source()
    fails = [n for n, ok, _ in RESULTS if not ok]
    print(f"\nRESULT pass={len(RESULTS)-len(fails)} fail={len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
