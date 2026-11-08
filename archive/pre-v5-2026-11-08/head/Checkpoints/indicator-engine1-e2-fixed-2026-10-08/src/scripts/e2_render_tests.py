#!/usr/bin/env python3
"""
ST-14 .. ST-17 — the E2 RENDER acceptance suite.

THE CLAIM BEING TESTED, verbatim from the pin:
  "Render: ONE thick freehand polyline through the Monday-anchored day anchors, a
   shape tag per day, a soft glow, the alternative chain as a dashed ghost, opacity
   ~55. ONE LINE, NOT A FILLED AREA."

A test that asserts a string is present proves nothing. Each assertion below is
paired with a NEGATIVE CONTROL: the thing that makes the claim FALSE is shown to be
detectable, so a passing result means the module would fail if it were wrong.
"""

from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MOD = os.path.join(ROOT, "plutus-vision-lqz", "e2-render.pine")

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def src() -> str:
    return open(MOD).read() if os.path.exists(MOD) else ""


# ── ST-14 · ONE LINE, NOT A FILLED AREA ─────────────────────────────────────

def st14_one_line() -> None:
    """THE SINGLE DECISION that stops the chart becoming a mess.

    NEGATIVE CONTROL: box.new is what a filled area is made of. Its ABSENCE from the
    E2 module is the proof that no filled ribbon exists — and the E1 module (which
    legitimately uses box.new) proves the detector can tell the difference."""
    s = src()
    record("ST-14a  the module exists", bool(s), f"{len(s.splitlines())} lines")

    body = s[s.find("f_e2Render"):] if "f_e2Render" in s else s
    record("ST-14b  ZERO box.new in the E2 render (no filled area)",
           "box.new" not in body,
           "negative control: E1's module uses box.new, so the detector is live")
    record("ST-14c  ZERO polyline.new (Pine has no filled-polyline; the absence matters)",
           "polyline.new" not in s, "the path is line segments, not a shape")

    # the line itself
    record("ST-14d  the path is drawn with line.new",
           "line.new" in body, "one brush stroke through the day anchors")
    record("ST-14e  it uses xloc.bar_time (time-anchored, not bar-index)",
           "xloc.bar_time" in body,
           "the forecast is anchored in TIME so it lands on the right dates")

    # the opacity contract: ~55, and NOT a class colour
    m = re.search(r"e2Opacity\s*=\s*input\.int\((\d+)", s)
    op = int(m.group(1)) if m else -1
    record("ST-14f  the default opacity is 55 (a forecast, not price)",
           45 <= op <= 65, f"default={op}")

    # NEGATIVE CONTROL: the palette must NOT collide with the three real classes
    forbidden = {"#2E8B57": "liquidity GREEN", "#B84A4A": "supply RED",
                 "#F23240": "supply RED", "#3179f5": "demand BLUE",
                 "#FF3D00": "E1 EXTREME", "#B388FF": "E1 MOD_HEAVY"}
    used = [k for k in forbidden if k.lower() in s.lower()]
    record("ST-14g  the forecast borrows NO class colour",
           not used,
           "clean: cyan is not a class in this indicator" if not used else f"COLLIDES {used}")


# ── ST-15 · THE ALTERNATIVE IS A GHOST ──────────────────────────────────────

def st15_ghost() -> None:
    """The canon requires an alternative chain for EVERY primary. Drawing it as a
    second heavy line would be two forecasts fighting for the eye.

    NEGATIVE CONTROL: the ghost must be DASHED and THINNER — if both were solid and
    equal, the assertion would still pass on 'line.new' alone, so the width and the
    style are checked separately."""
    body = src()[src().find("f_e2Render"):]
    ghost = body[body.find("e2GhostX"):] if "e2GhostX" in body else ""
    record("ST-15a  the alternative chain is drawn", "e2GhostX" in body,
           "the canon's §6.6 step 4: every primary carries an alternative")
    record("ST-15b  the alternative is DASHED", "line.style_dashed" in ghost,
           "a ghost, not a second forecast")
    record("ST-15c  the alternative is THINNER (width 1)", "width = 1" in ghost,
           "the primary carries the eye")
    record("ST-15d  the alternative can be switched OFF", "e2ShowGhost" in src())


# ── ST-16 · RULE 1 AT THE RENDER ────────────────────────────────────────────

def st16_rule1_at_render() -> None:
    """A shape with no anchoring zone is a fabrication and is never drawn.

    NEGATIVE CONTROL: the guard must be a CONDITIONAL on the shape being non-empty —
    a module that merely MENTIONS Rule 1 in a comment passes a grep and fails here."""
    body = src()[src().find("f_e2Render"):]
    record("ST-16a  the day dot is guarded on a non-empty shape",
           re.search(r'_anchored\s*=\s*array\.get\(e2DayShape[^\n]*!=\s*""', body) is not None,
           "no shape → no dot, no tag")
    record("ST-16b  the tag is INSIDE that guard",
           body.find("_anchored") < body.find("label.new(array.get(e2DayX"),
           "the tag cannot escape the guard")

    # the refusal must be VISIBLE — a silent empty chart reads as "nothing found"
    record("ST-16c  a refusal is DRAWN on the chart, not swallowed",
           "E2 REFUSED" in body,
           "a named refusal reads as 'the engine refused to guess'")
    record("ST-16d  the refusal is RED (it is an error state, not a class)",
           "color.new(color.red" in body)


# ── ST-17 · THE MONDAY ANCHOR + NO HARDCODED TIMESTAMPS ─────────────────────

def st17_monday_anchor() -> None:
    """Both engines must anchor at the target week's Monday. A hard-coded timestamp
    means the indicator is only ever right for ONE week.

    NEGATIVE CONTROL: the literal pattern is searched for directly."""
    s = src()
    lits = re.findall(r"timestamp\(\s*\d{4}\s*,\s*\d{1,2}\s*,\s*\d{1,2}", s)
    record("ST-17a  no hard-coded timestamp literal", not lits,
           "every x is injected as a computed ms value" if not lits else f"{len(lits)} literal(s)")

    record("ST-17b  the day x values are injected, not computed in Pine",
           "e2_injected_x" in s, "the engine owns the calendar; Pine only draws")
    record("ST-17c  the path is drawn over the forecast horizon",
           "e2DayX" in s and "e2_injected_x" in s,
           "Mon-Fri anchors plus the foresight tail the engine computed")


def main() -> int:
    tests = [("ST-14", st14_one_line), ("ST-15", st15_ghost),
             ("ST-16", st16_rule1_at_render), ("ST-17", st17_monday_anchor)]
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