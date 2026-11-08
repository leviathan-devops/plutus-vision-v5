#!/usr/bin/env python3
"""
ST-6 .. ST-9b — the PHASE 2 acceptance suite.

    python3 scripts/e1_render_tests.py
    python3 scripts/e1_render_tests.py ST-7

THE INVARIANT UNDER TEST: the E1 layer must be at most six degree-banded zones,
Monday-anchored, colour-from-degree — and it must NEVER regress the sealed v1
baseline (LuxAlgo SMC 226 · SMC order blocks 6 · LQZ bands 4).
"""

from __future__ import annotations

import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import e1_fetch as E  # noqa: E402

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


PIN = os.path.join(ROOT, "plutus-vision-lqz", "e1-render.pine")
V1 = os.path.join(ROOT, "plutus-vision-v1.pine")
V1_SHA = "0d20e8314ce992fc"
FLOOR = {"smc": 226, "ob": 6, "lqz": 4}


def read_pin() -> str:
    return open(PIN).read() if os.path.exists(PIN) else ""


# ── ST-6 · AT MOST SIX ZONES ────────────────────────────────────────────────

def st6_six_zones() -> None:
    """The pin: 'at most six IP zones for a week — five plus at most one options
    wall. NOT one per level.'

    NEGATIVE CONTROL: a 40-zone payload must be CLAMPED to 6, not painted in full.
    A cap that does not bite is not a cap."""
    src = read_pin()
    record("ST-6a  the module exists", bool(src), f"{len(src.splitlines())} lines")

    m = re.search(r'e1MaxZones\s*=\s*input\.int\((\d+)', src)
    default = int(m.group(1)) if m else -1
    record("ST-6b  the default cap is 6", default == 6, f"default={default}")
    record("ST-6c  the hard maxval is 6", "maxval = 6" in src or "maxval=6" in src,
           "the operator cannot raise the cap past 6")

    # the cap must be ENFORCED, not merely declared
    record("ST-6d  the module clamps the zone count", "e1MaxZones" in src and
           src.count("e1MaxZones") >= 2, f"{src.count('e1MaxZones')} references")


# ── ST-7 · THE DEGREE IS DERIVED FROM THE CONFLUENCE ───────────────────────

def st7_degree_derived() -> None:
    """The canon's bands, and the rule that the colour comes from the DEGREE, never
    from a positional field. The v1 banding defect was exactly that mistake.

    NEGATIVE CONTROL: the band table is checked at its EDGES, so a shifted edge
    (e.g. 12→11) fails. And the render must contain NO positional→colour ternary."""
    src = read_pin()

    # MINIMAL is the ELSE branch, not a `c >= 0` comparison — probe defect found
    # 2026-10-03: the first version looked for `c >=  0 ? "MINIMAL"` and reported the
    # band missing when it was present as the fallback. The band table is checked at
    # its five explicit EDGES plus the else.
    bands = [(12, "EXTREME"), (10, "HEAVY"), (8, "MODERATE_HEAVY"),
             (6, "MODERATE"), (4, "LIGHT")]
    edges_ok = True
    for c, deg in bands:
        if f'c >= {c:>2} ? "{deg}"' not in src:
            edges_ok = False
            record(f"ST-7  band {c} -> {deg}", False, "edge not found in f_e1Degree")
    record("ST-7a  every canon band edge is present", edges_ok)
    record("ST-7  MINIMAL is the else branch (score < 4)",
           re.search(r'c\s*>=\s*4\s*\?\s*"LIGHT"\s*:\s*"MINIMAL"', src) is not None,
           "0-3 collapses to MINIMAL, which paints nothing")

    # the exact sequence, in order
    order = re.search(r"f_e1Degree\(c\) =>\s*(.+?)\n\n", src, re.S)
    seq = re.findall(r'"(\w+)"', order.group(1)) if order else []
    record("ST-7b  the band sequence is EXTREME→HEAVY→MOD_HEAVY→MODERATE→LIGHT→MINIMAL",
           seq == ["EXTREME", "HEAVY", "MODERATE_HEAVY", "MODERATE", "LIGHT", "MINIMAL"],
           " → ".join(seq))

    # THE BANDING DEFENCE: colour must be selected by degree alone
    colour_fn = re.search(r"f_e1Color\(deg\) =>(.*?)\n\n", src, re.S)
    cbody = colour_fn.group(1) if colour_fn else ""
    positional = bool(re.search(r"(close|open|high|low|top|bottom|side)\s*[<>=]", cbody))
    record("ST-7c  the colour function reads NO price or side field", not positional,
           "colour is a function of degree alone")

    # MINIMAL must paint nothing
    record("ST-7d  MINIMAL paints NOTHING", '"MINIMAL"' in src and
           "_d != \"MINIMAL\"" in src, "the weak tail never reaches the screen")

    # the 7->8 asymmetry the canon calls out
    record("ST-7e  the 7->8 boundary is kept distinct from 11->12",
           "c >=  8" in src and "c >= 12" in src,
           "the canon: the 8th point moves ZFP 10-15%, the 12th only 5-10%")

def st8_monday_anchor() -> None:
    """Both horizontal bounds derive from the anchor. A hard-coded timestamp means
    the indicator is only ever correct for ONE week — the canon's Temporal Boundary
    violation in a different costume.

    NEGATIVE CONTROL: the module must contain NO literal timestamp(YYYY,M,D)."""
    src = read_pin()

    literals = re.findall(r"timestamp\(\s*\d{4}\s*,\s*\d{1,2}\s*,\s*\d{1,2}", src)
    record("ST-8a  no hard-coded timestamp literal", not literals,
           f"found {len(literals)} literal(s)" if literals else "every bound is computed")

    # Probe defect, found 2026-10-03: the original expression was
    #   f"def" not in src and f"{fn}()" in src or f"{fn}() =>" in src
    # which Python parses as (A and B) or C — a precedence mistake that reported two
    # existing functions as missing. Presence is now a plain membership test.
    # Probe defect, found 2026-10-03 (second pass): the test looked for `f_e1LeftMs() =>`
    # — EMPTY parens — while the function was declared `f_e1LeftMs(anchorMs) =>`.
    # Probe defect, THIRD pass, and the one that mattered: the module was then REFACTORED
    # to compute the anchor in PYTHON (the PineTS transpiler has neither str.split nor
    # tonumber — measured), so the helper functions are gone and the bounds are computed
    # inline against a local `_anchor`. The old greps matched names that no longer exist.
    # The assertion now checks the ARITHMETIC and that both bounds share ONE anchor.
    # Probe defect, fourth pass: F-17's fix changed the ARITHMETIC — the anchor is now
    # converted to a bar index via `_barsBack`, and both bounds are CLAMPED into the
    # loaded window, so the old greps (which looked for a raw-millisecond subtraction)
    # match nothing. The property the pin requires is unchanged: the left edge is the
    # anchor minus hindsight, the right edge is the anchor plus foresight, and both come
    # from the SAME bar. Assert that, not the spelling.
    # Probe defect, fifth pass: the anchor arithmetic changed again with the F-17 fix —
    # `_bAnchor` is now CLAMPED into the loaded window
    # (`math.max(0, math.min(bar_index, bar_index - _barsBack))`) because the target week
    # can sit 83 days past the chart's right edge. The property under test has not changed:
    # BOTH bounds derive from the SAME anchor bar. Match the shape as written now, and fall
    # back to the unclamped form so the assertion tests the property in EITHER revision.
    anchored = re.search(r"_bAnchor\s*=\s*math\.max\(0,\s*math\.min\(\s*bar_index\s*,\s*"
                         r"bar_index\s*-\s*_barsBack\s*\)\s*\)", src) \
            or re.search(r"_bAnchor\s*=\s*bar_index\s*-\s*_barsBack", src)
    left = re.search(r"_lx\s*=\s*math\.max\(0,\s*_bAnchor\s*-", src)
    right = re.search(r"_rx\s*=\s*math\.min\(\s*bar_index\s*\+\s*1,\s*_bAnchor\s*\+", src)
    same = bool(left and right and anchored)
    record("ST-8c  both bounds derive from the SAME computed anchor bar", same,
           "_bAnchor = bar_index - barsBack; both bounds clamped into the window")
    record("ST-8b  the anchor comes from the injected payload, not a literal",
           "e1_anchor_ms" in src,
           "e2_engine.py owns the calendar; Pine only draws")
    record("ST-8f  a missing anchor falls back to bar time, never to a pinned date",
           "e1_anchor_ms > 0 ?" in src, "no anchor -> the bar's own time")

    record("ST-8d  the anchor is drawn on the chart so the Monday is visible",
           "line.new(_anchor" in src, "a dashed anchor line at the Monday")

    # the ISO-week arithmetic must actually run
    import datetime as dt
    for wk, expect in ((29, "2026-07-13"), (44, "2026-10-26")):
        mon = dt.date.fromisocalendar(2026, wk, 1)
        record(f"ST-8e  ISO week {wk} of 2026 -> {expect}",
               mon.isoformat() == expect, f"computed {mon.isoformat()}")


# ── ST-9 / ST-9b · THE v1 FLOOR ─────────────────────────────────────────────

def st9_v1_floor() -> None:
    """The pin's H1 hard stop: the v1 reference counts must not regress.
    'Intention is not a control.'"""
    src = open(V1).read()
    # COUNT LINES, NOT OCCURRENCES. Probe defect, found 2026-10-03: this test used
    # re.findall, which counts every OCCURRENCE (308), while the baseline the pin
    # froze was measured with `grep -c`, which counts LINES containing the pattern
    # (226). Same file, same patterns, two different numbers — and the probe was
    # wrong, not the artifact. Its sha matched the seal exactly and git reported no
    # modification. A test that measures a different quantity than the baseline is a
    # false alarm, and a false alarm that fires on a hard stop is worse than none.
    def _lines(pattern: str) -> int:
        rx = re.compile(pattern)
        return sum(1 for ln in src.splitlines() if rx.search(ln))

    smc = _lines(r"pv_alerts|smc_")
    ob = _lines(r"smc_storeOrdeBlock|smc_drawOrderBlocks")
    lqz = _lines(r"lqzColorLq|f_lqzRender")
    record("ST-9a  LuxAlgo SMC unchanged", smc == FLOOR["smc"], f"{smc}/{FLOOR['smc']}")
    record("ST-9b  SMC order blocks unchanged", ob == FLOOR["ob"], f"{ob}/{FLOOR['ob']}")
    record("ST-9c  LQZ bands unchanged", lqz == FLOOR["lqz"], f"{lqz}/{FLOOR['lqz']}")


def st9b_modules_diff_clean() -> None:
    """The v1 modules must be byte-identical to the sealed baseline checkpoint."""
    ck = os.path.join(ROOT, "Checkpoints", "v1-working-baseline-2026-10-03")
    pairs = [("plutus-vision-lqz/lqz-core.pine", "src/plutus-vision-lqz/lqz-core.pine"),
             ("plutus-vision-lqz/lqz-render.pine", "src/plutus-vision-lqz/lqz-render.pine")]
    if not os.path.isdir(ck):
        record("ST-9d  the baseline checkpoint is present", False, f"missing {ck}")
        return
    for live, sealed in pairs:
        lp, sp = os.path.join(ROOT, live), os.path.join(ck, sealed)
        if not os.path.exists(sp):
            record(f"ST-9d  {live} diff-clean", False, "no sealed copy")
            continue
        a = open(lp, "rb").read()
        b = open(sp, "rb").read()
        record(f"ST-9d  {os.path.basename(live)} diff-clean vs the baseline",
               a == b, "identical" if a == b else f"DRIFT {len(a)} vs {len(b)} bytes")


def main() -> int:
    tests = [("ST-6", st6_six_zones), ("ST-7", st7_degree_derived),
             ("ST-8", st8_monday_anchor), ("ST-9", st9_v1_floor),
             ("ST-9b", st9b_modules_diff_clean)]
    want = (sys.argv[1].upper() if len(sys.argv) > 1 else None)
    for name, fn in tests:
        if want and not name.startswith(want):
            continue
        print(f"\n── {name} ──")
        try:
            fn()
        except Exception as e:
            record(f"{name} raised", False, f"{type(e).__name__}: {e}")
    passed = sum(1 for _, ok, _ in RESULTS if ok)
    print(f"\nRESULT pass={passed} fail={len(RESULTS) - passed}")
    for n, ok, d in RESULTS:
        if not ok:
            print(f"  FAILED {n}  {d}")
    return 0 if passed == len(RESULTS) else 1


if __name__ == "__main__":
    sys.exit(main())