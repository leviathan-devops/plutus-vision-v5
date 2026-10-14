#!/usr/bin/env python3
"""
test_5week_crossval — the W6 NAMED gate (PIN_INDICATOR_PORT_BUILD.md:63).

    python3 scripts/test_5week_crossval.py

THE PIN'S GATE, VERBATIM: "each week has >=5 zones with >=1 RES AND >=1 SUP AND
the render ok:true". Implemented by scripts/indicator_gate.py (the litmus); this
file is the named entry that asserts the pin's exact conditions over its evidence.

A REGRESSION GUARD ONLY — it never passes the build. JEV judges (AP-G2).
"""

from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import indicator_gate as G  # noqa: E402


def main() -> int:
    rc = G.main()
    if rc != 0:
        print("test_5week_crossval: FAIL — the litmus exited nonzero")
        return 1
    ev = open(os.path.join(ROOT, "JEV_GATE", "litmus_evidence.txt")).read()
    weeks = re.findall(
        r"week (\S+): ok:(true|false) boxes=(\d+) RES=(True|False) SUP=(True|False)",
        ev)
    ok = (len(weeks) == 5
          and all(w[1] == "true" and int(w[2]) >= 5 and w[3] == "True" and w[4] == "True"
                  for w in weeks))
    print(f"test_5week_crossval: {'PASS' if ok else 'FAIL'} — "
          f"{len(weeks)}/5 weeks match the pin's gate")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
