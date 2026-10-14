#!/usr/bin/env python3
"""
smoke_e1_payload.py — PROVE THE E1 RENDER PATH PAINTS. It is NOT a data claim.

WHY THIS FILE EXISTS. The v2 build reads its zone map from data/e1/<pair>-<week>.json.
On this host every source recorded [NO DATA], so that file legitimately carries an
empty `zones` array and the render has only ever taken its REFUSAL branch. A renderer
that has never painted is not a verified renderer.

WHAT THIS IS. A SMOKE PAYLOAD: six zones with ids prefixed `SMOKE-` and deliberately
round prices, written to a separate directory so they can never be confused with real
E1 output. It exists to answer ONE question — does the degree band, the colour ramp,
the opacity ramp, the Monday anchor and the full-width span actually paint? — and the
answer must be observable on a captured frame.

WHAT THIS IS NOT.
  · It is NOT the canon's nine-pillar confluence score. The values below are 8..13 so
    the six degree bands are all reachable; they are PLACEHOLDERS chosen to exercise
    the renderer, not computed institutional pressure.
  · It is NOT evidence that E1 works. E1's score lives in the fetch layer and is
    `[NO DATA]` on this host. The gap is recorded as such in TESTING_LOG.md.
  · It never overwrites the real payload. `python3 scripts/smoke_e1_payload.py --apply`
    writes to data/e1-smoke/ and builds from there; the real data/e1/ is untouched.

THE DISCIPLINE THIS FILE ENCODES: prove the machinery with a fixture whose name says
it is a fixture. A smoke payload that claimed to be real data would be the exact
fabrication the whole build refuses.
"""

from __future__ import annotations

import json
import pathlib
import sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
SMOKE_DIR = ROOT / "data" / "e1-smoke"

ZONES = [
    # ALL SIX INSIDE THE FIXTURE'S VISIBLE RANGE (EURUSD 1H W29 renders ~1.1350-1.1480).
    # The first version of this fixture placed them at 1.135-1.158 and three of the six
    # sat ABOVE the chart — which made "the zones did not render" and "the zones are off
    # screen" indistinguishable. A fixture that can fail for two different reasons is not
    # a diagnostic.
    {"name": "SMOKE-EXTREME",  "top": 1.14700, "bottom": 1.14600, "confluence": 13, "zfp": 8},
    {"name": "SMOKE-HEAVY",    "top": 1.14500, "bottom": 1.14420, "confluence": 11, "zfp": 18},
    {"name": "SMOKE-MODHEAVY", "top": 1.14300, "bottom": 1.14230, "confluence": 9,  "zfp": 26},
    {"name": "SMOKE-MODERATE", "top": 1.14100, "bottom": 1.14040, "confluence": 7,  "zfp": 38},
    {"name": "SMOKE-LIGHT",    "top": 1.13900, "bottom": 1.13840, "confluence": 5,  "zfp": 48},
    {"name": "SMOKE-MINIMAL",  "top": 1.13700, "bottom": 1.13640, "confluence": 2,  "zfp": 70},
]


def write() -> pathlib.Path:
    SMOKE_DIR.mkdir(parents=True, exist_ok=True)
    out = SMOKE_DIR / "EURUSD-2026-10-06.json"
    doc = {
        "schema": "trident-e1/1-SMOKE",
        "WARNING": "SMOKE PAYLOAD — placeholder zones to exercise the RENDER path. "
                   "These are NOT the canon's nine-pillar confluence scores.",
        "pair": "EUR/USD",
        "target_week": "2026-10-06",
        "data_as_of": "SMOKE",
        "sources": {"SMOKE": {"status": "SMOKE_FIXTURE",
                              "detail": "synthetic zones, six degree bands"}},
        "levels": [],
        "zones": ZONES,
        "shapes": {},
        "notes": ["MINIMAL (confluence 2) must NOT paint — the degree rule drops it."],
    }
    out.write_text(json.dumps(doc, indent=1))
    return out


def main() -> int:
    if "--apply" not in sys.argv:
        p = ROOT / "data" / "e1" / "EURUSD-2026-10-06.json"
        real = len(json.loads(p.read_text()).get("zones", [])) if p.exists() else "no file"
        print(f"  dry run. Would write {SMOKE_DIR.relative_to(ROOT)}/")
        print(f"  the REAL payload data/e1/ carries {real} zones and is NOT touched")
        print(f"  to apply: python3 scripts/smoke_e1_payload.py --apply")
        return 0
    p = write()
    print(f"  wrote {p.relative_to(ROOT)}  ({len(ZONES)} zones, 5 must paint, MINIMAL must not)")
    return 0


if __name__ == "__main__":
    sys.exit(main())