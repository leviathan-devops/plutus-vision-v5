#!/usr/bin/env python3
"""
ST-10 .. ST-13 — the PHASE 3 acceptance suite.

    python3 scripts/e2_tests.py
    python3 scripts/e2_tests.py ST-11

ST-11 IS THE ONE THAT MATTERS MOST: the canon names the ZFP-conditioned transition
error its "#1 Engine 2 error that caused mispredictions" — the April 20-24 event,
where the engine saw a powerful Breakout Surge with extreme momentum, hit a Hard
Wall directly above it, and predicted continuation. ST-11 pins the fix.
"""

from __future__ import annotations

import datetime as dt
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from e2_engine import (  # noqa: E402
    ZFP_BREAKOUT, ZFP_HARDWALL, MIN_CHAIN_CONFIDENCE, MAX_CHAIN_LENGTH,
    Zone, FabricationRefused, classify, transition, tf_match, forward_map,
    consolidation_phase, day_decomposition, fine_path)

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def z(zid, top, bot, conf, zfp, **kw) -> Zone:
    return Zone(id=zid, top=top, bottom=bot, confluence=conf, zfp=zfp, **kw)


# ── ST-10 · EVERY SHAPE NAMES ITS ANCHORING ZONE (Rule 1) ───────────────────

def st10_shape_anchored() -> None:
    """The canon's zero-tolerance Rule 1: 'No Shape Without IP Zone Anchoring.'

    NEGATIVE CONTROL: an EMPTY zone map must RAISE, not default to a plausible shape."""
    zones = [z("Z1", 1.1500, 1.1490, 13, 60), z("Z2", 1.1560, 1.1540, 9, 12),
             z("Z3", 1.1400, 1.1380, 7, 35)]

    shape, anchor = classify(1.0, zones)
    record("ST-10a  classify returns a shape AND an anchor", bool(shape) and bool(anchor),
           f"{shape} @ {anchor}")

    # EVERY link in the chain must name a zone
    ch = forward_map(zones, 1.0, dt.date(2026, 10, 6))
    unanchored = [l for l in (ch.chain + ch.alternative) if not l.trigger_zone_id]
    record("ST-10b  ZERO unanchored links in the primary chain", not unanchored,
           f"{len(ch.chain)} links, {len(ch.alternative)} alternative")

    # NEGATIVE CONTROL — the empty map
    try:
        classify(1.0, [])
        raised = False
    except FabricationRefused:
        raised = True
    record("ST-10c  an EMPTY zone map RAISES rather than defaulting", raised,
           "negative control: the refusal is load-bearing")

    # and the refusal NAMES the reason
    ch_empty = forward_map([], 1.0, dt.date(2026, 10, 6))
    record("ST-10d  the refusal is NAMED, not silent",
           bool(ch_empty.refusal) and "E2_" in ch_empty.refusal,
           ch_empty.refusal[:70])

    # every MINIMAL zone must be excluded from anchoring
    all_min = [z("M1", 1.15, 1.149, 2, 90), z("M2", 1.16, 1.159, 3, 85)]
    try:
        classify(1.0, all_min)
        raised = False
    except FabricationRefused:
        raised = True
    record("ST-10e  an all-MINIMAL zone map is refused (confluence < 4)", raised,
           "the canon discards a score of 0-3")


# ── ST-11 · THE HARD-WALL RULE — the canon's #1 E2 ERROR ───────────────────

def st11_hardwall_rwl() -> None:
    """THE ONE SENTENCE THAT IS THE WHOLE OF §6.4.1:

      'The ZFP of the TARGET zone — not the MOMENTUM of the current move —
       determines what happens next. A powerful BS with extreme momentum that hits
       a Hard Wall (ZFP < 20%) will STILL produce an RWL — because the wall is
       DENSER than the move.'

    NEGATIVE CONTROL: momentum is NOT an input to `transition`. A caller cannot pass
    it, so it cannot bias the outcome — the test below proves the signature."""
    import inspect
    params = list(inspect.signature(transition).parameters)
    record("ST-11a  transition() takes NO momentum parameter",
           params == ["current", "target_zfp"],
           f"signature: {params} — momentum cannot reach the decision")

    shape, cond, conf = transition("BS", 18)
    record("ST-11b  BS + zfp 18 (< 20) -> RWL", shape == "RWL",
           f"got {shape}  ·  {cond[:58]}")
    record("ST-11c  NOT 'R' and NOT 'PBS'", shape not in ("R", "PBS"), f"got {shape}")

    # the full BS row of §6.4.1
    for zfp, want in ((15, "RWL"), (30, "R"), (65, "PBS"), (85, "PBS")):
        got, _, _ = transition("BS", zfp)
        record(f"ST-11d  BS + zfp {zfp} -> {want}", got == want, f"got {got}")

    # the other rows — the CANON E2.3 values (docs/PLUTUS_VISION_V2_E1E2_SPEC.md:264):
    #   WLS → any = BS · R → persists = SS (RECLASSIFY) · WL → opposite momentum = RWL ·
    #   RWL → SS. The R row was WRONG (returned WL) until the 2026-10-06 audit fix; the WL
    #   row now reads the opponent from the TARGET's density (a hard wall = the opposite move).
    for cur, zfp, want in (("SS", 50, "BS"), ("SS", 20, "SS"), ("WLS", 40, "BS"),
                           ("R", 30, "SS"), ("WL", 30, "SS"), ("WL", 15, "RWL"),
                           ("RWL", 30, "SS")):
        got, _, _ = transition(cur, zfp)
        record(f"ST-11e  {cur} + zfp {zfp} -> {want}", got == want, f"got {got}")


# ── ST-12 · THE DAY DECOMPOSITION + THE TRADING SPEED RULE ───────────────────

def st12_day_decomp() -> None:
    """§6.6 step 5 (Mon-Fri) + §6.10 ('+1 day', 'assume 30-50% of the speed').

    NEGATIVE CONTROL: the emitted date must be the day AFTER the session day, or the
    speed rule is decorative."""
    zones = [z("Z1", 1.1500, 1.1490, 13, 60), z("Z2", 1.1560, 1.1540, 9, 12),
             z("Z3", 1.1400, 1.1380, 7, 35)]
    monday = dt.date(2026, 10, 6)
    ch = forward_map(zones, 1.0, monday)

    days = ch.days
    record("ST-12a  five day entries (Mon-Fri)", len(days) == 5,
           " · ".join(d["day"] for d in days))

    every_has_zone = all(d["key_zone"] for d in days)
    record("ST-12b  every day names a key zone", every_has_zone,
           "a day with a shape but no zone is the forbidden case")

    every_has_shape = all(d["shape"] for d in days)
    record("ST-12c  every day carries a shape", every_has_shape)

    # THE SPEED RULE, made visible rather than hidden
    d0 = days[0]
    expect = (monday + dt.timedelta(days=1)).isoformat()
    record("ST-12d  the +1 day speed rule is APPLIED to the date", d0["date"] == expect,
           f"Monday {monday} → emitted {d0['date']} (+1 day, §6.10)")

    record("ST-12e  every day carries a confidence", all(0 < d["confidence"] <= 100 for d in days),
           " · ".join(f"{d['day']} {d['confidence']:.0f}%" for d in days))


# ── ST-12F · THE FINE PATH — the E2 line is CONTINUOUS and JAGGED ────────────

def st12_fine_path() -> None:
    """THE 2026-10-05 RENDER DEFECT, pinned. The E2 payload once carried ONE point
    per day, so the render's polyline drew a five-vertex TRIANGLE. Five day anchors
    must expand into a CONTINUOUS, JAGGED price path that reads as continuation.

    NEGATIVE CONTROL: the old behaviour (one point per day) is exactly what
    `len(xs) > 5` rejects; and a straight day-to-day interpolation is rejected by the
    off-the-line bend count, so a passing result means the geometry is really there."""
    days = [(1_783_368_000_000, 100.852, "R", 60.0),
            (1_783_454_400_000, 101.01033, "WL", 60.0),
            (1_783_540_800_000, 100.852, "SS", 55.0),
            (1_783_627_200_000, 100.852, "SS", 55.0),
            (1_783_713_600_000, 100.852, "SS", 55.0)]
    xs, ys, shapes, confs = fine_path(days)

    record("ST-12f  many points, not the 5 day anchors", len(xs) > 5,
           f"{len(xs)} points from {len(days)} days")
    record("ST-12g  the four arrays share one length (the render indexes them together)",
           len(xs) == len(ys) == len(shapes) == len(confs),
           f"x={len(xs)} y={len(ys)} shape={len(shapes)} conf={len(confs)}")
    record("ST-12h  x strictly increasing, no duplicates (one continuous stroke)",
           all(xs[i] < xs[i + 1] for i in range(len(xs) - 1)))
    tags = [(x, s, c) for x, s, c in zip(xs, shapes, confs) if s]
    record("ST-12i  every day boundary is tagged with its shape",
           [t[1] for t in tags] == [d[2] for d in days],
           " · ".join(f"{s} {int(c)}%" for _, s, c in tags))
    record("ST-12j  every tag sits on a real day anchor",
           all(any(x == d[0] for d in days) for x, _, _ in tags))

    # JAGGED — intraday points must lie OFF the straight anchor-to-anchor line
    off = 0
    for i in range(1, len(days)):
        x0, y0, x1, y1 = days[i - 1][0], days[i - 1][1], days[i][0], days[i][1]
        for x, y in zip(xs, ys):
            if x0 < x < x1 and abs(y - (y0 + (y1 - y0) * (x - x0) / (x1 - x0))) > 1e-6:
                off += 1
    record("ST-12k  the path BENDS between anchors (never a straight day-to-day line)",
           off > 0, f"{off} intraday points off the straight anchor line")

    # an SS day between two IDENTICAL anchors (a flat span) must still oscillate
    flat = {y for x, y in zip(xs, ys) if days[2][0] < x <= days[3][0]}
    record("ST-12l  a flat-span SS day still oscillates (range-bound, not dead flat)",
           len(flat) > 1, f"{len(flat)} distinct prices on the flat-span day")


# ── ST-13 · THE CHAIN BOUNDS + THE FABRICATION GUARD ───────────────────────

def st13_empty_corpus() -> None:
    """The chain's two bounds (§6.6) and the fabrication guard.

    NEGATIVE CONTROL: a chain must STOP at 5 links or at <25% cumulative — a chain
    that runs forever is a chain nobody checked."""
    # A FIXTURE THAT MUST PRODUCE A CHAIN. The first version of this test asserted
    # "0 links <= 5" and PASSED while forward_map was returning an empty chain for a
    # reason nobody had found yet (it passed a Zone object where a zone id was
    # expected). A test that passes on an empty result is not a test, so the fixture
    # is built to make a REAL transition and the count is asserted non-zero.
    #   Z0 13 conf, zfp 55 -> BS (breakout risk, momentum up)
    #   Z1  9 conf, zfp 18 -> a HARD WALL, so BS must become RWL (§6.4.1's #1 rule)
    zones = [z("Z0", 1.1500, 1.1490, 13, 55), z("Z1", 1.1560, 1.1540, 9, 18),
             z("Z2", 1.1620, 1.1600, 7, 35), z("Z3", 1.1680, 1.1660, 6, 28)]
    ch = forward_map(zones, 1.0, dt.date(2026, 10, 6))
    record("ST-13a0 the fixture PRODUCES a chain (not vacuously empty)", len(ch.chain) >= 1,
           f"{len(ch.chain)} links")
    record("ST-13a  the chain never exceeds 5 links", len(ch.chain) <= MAX_CHAIN_LENGTH,
           f"{len(ch.chain)} links (max {MAX_CHAIN_LENGTH})")
    terminated_ok = (len(ch.chain) < MAX_CHAIN_LENGTH - 1) or \
                    (ch.cumulative() < MIN_CHAIN_CONFIDENCE)
    record("ST-13c  the chain terminated on a canon bound", terminated_ok,
           f"cumulative {ch.cumulative():.1f}% (floor {MIN_CHAIN_CONFIDENCE}%)")

    # the consolidation phase is always one of the canon's five
    phases = {"EARLY", "MID", "LATE", "POST_BS_EARLY_BREAKOUT"}
    record("ST-13d  the consolidation phase is a canon value",
           ch.consolidation_phase in phases, ch.consolidation_phase)

    # TF matching: 15m must NOT reach a 4H zone
    record("ST-13e  15m cannot target a 4H zone (§6.5)",
           not tf_match("15m", "4H") and tf_match("15m", "30m"),
           "never more than two dimensions up")
    record("ST-13f  4H can target 4H and 1H", tf_match("4H", "4H") and tf_match("4H", "1H"),
           "same-density containment plus one adjacent step")


def st14_determinism() -> None:
    """ST-14 — DETERMINISM (audit 2026-10-06, OCR finding #3 + #1).

    POSITIVE: the anchor is ORDER-INDEPENDENT — the same zone set in a shuffled order must
    classify to the SAME (shape, anchor). NEGATIVE: a non-canon degree RAISES a NAMED refusal
    (a bare `assert` is stripped under `python -O`, so the guard would silently vanish)."""
    import random
    import e2_engine
    zones = [z("ZA", 1.1560, 1.1540, 9, 12), z("ZB", 1.1500, 1.1490, 13, 60),
             z("ZC", 1.1400, 1.1380, 7, 35), z("ZD", 1.1700, 1.1680, 11, 88)]
    base = classify(1.0, zones)
    agree = True
    for seed in range(6):
        perm = zones[:]
        random.Random(seed).shuffle(perm)
        if classify(1.0, perm) != base:
            agree = False
    record("ST-14a  the anchor is ORDER-INDEPENDENT (6 shuffles agree)", agree, f"base={base}")

    # NEGATIVE CONTROL — a degree outside the canon is refused BY NAME (not an assert)
    saved = e2_engine.DEGREES
    try:
        e2_engine.DEGREES = ("EXTREME",)          # strip the ladder's other values
        zz = z("ZY", 1.16, 1.15, 9, 40)           # conf 9 -> HEAVY, now outside the set
        try:
            zz.degree
            raised = False
        except FabricationRefused:
            raised = True
        record("ST-14b  a non-canon degree RAISES a named refusal", raised,
               "the guard survives python -O (not an assert)")
    finally:
        e2_engine.DEGREES = saved

    # ST-14c — a colliding day boundary still gets its tag (finding #3, the fine-path fix)
    from e2_engine import fine_path
    xs, ys, shp, cnf = fine_path([(0, 1.0, "R", 60), (0, 1.5, "WL", 55)], day_ms=0)
    tagged = [s for s in shp if s]
    record("ST-14c  colliding day tags are NOT dropped", len(tagged) >= 2, f"tags={tagged}")

    # ST-14d/e — the chain's own invariants (audit 2026-10-06, findings 299 + 360):
    # len(anchor_zone_ids) == len(chain)+1, and the week-end shape is exposed.
    zs = [z("A", 1.10, 1.09, 9, 40), z("B", 1.12, 1.11, 7, 35)]
    ch = forward_map(zs, 0.0, dt.date(2026, 10, 6))
    record("ST-14d  len(anchor_zone_ids) == len(chain)+1",
           len(ch.anchor_zone_ids) == len(ch.chain) + 1,
           f"{len(ch.anchor_zone_ids)} vs {len(ch.chain)+1}")
    record("ST-14e  the chain exposes the week-end terminal_shape", bool(ch.terminal_shape),
           f"= {ch.terminal_shape!r}")


def main() -> int:
    tests = [("ST-10", st10_shape_anchored), ("ST-11", st11_hardwall_rwl),
             ("ST-12", st12_day_decomp), ("ST-12F", st12_fine_path),
             ("ST-13", st13_empty_corpus), ("ST-14", st14_determinism)]
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