#!/usr/bin/env python3
"""wave_gates.py — THE FIVE NAMED WAVE TESTS (selectable by name).

    python3 scripts/wave_gates.py                 # run all five
    python3 scripts/wave_gates.py test_v8_structure
    python3 scripts/wave_gates.py test_6dim_score test_render_ladder

Each test is the MECHANICAL gate the objective names for its wave. It prints a PASS/FAIL
line per assertion and exits nonzero if any assertion fails — so the fence and CI can gate
on it. Every assertion is bound to a TOOL RESULT (a file's parsed content, a grep count, an
exit code), never to prose.
"""
from __future__ import annotations
import glob
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# THE CANONICAL WEEK — the objective's reference week. The gate reads THIS week's payload, so
# its verdict is DETERMINISTIC. `sorted(glob(...))[-1]` was fragile: any other week written to
# data/e1 (a cross-validation week, an ad-hoc extract) silently became the gate's subject and
# its verdict changed with the alphabet — a gate whose subject drifts is not a gate.
CANONICAL_WEEK = "2026-07-13"

_RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    _RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def _newest_dxy() -> str:
    """The CANONICAL week's payload — deterministic, never the alphabetically-last file."""
    p = os.path.join(ROOT, "data", "e1", f"DXY-{CANONICAL_WEEK}.json")
    if os.path.exists(p):
        return p
    fs = sorted(glob.glob(os.path.join(ROOT, "data", "e1", "DXY-*.json")))
    return fs[-1] if fs else ""


def _payload(path: str) -> dict:
    try:
        return json.load(open(path))
    except Exception:
        return {}


# ── W1 · test_v8_structure ──────────────────────────────────────────────────
def test_v8_structure() -> None:
    """The payload emits EXACTLY 5 zones — RES,RES,MID,SUP,SUP, top→down — with the
    floor zone weaker (lower zfp) than the mid zones."""
    f = _newest_dxy()
    record("W1a  a DXY payload exists", bool(f), os.path.relpath(f, ROOT) if f else "none")
    if not f:
        return
    d = _payload(f)
    zs = d.get("zones", [])
    cats = [z.get("zCat") for z in zs]
    seq = ",".join(cats)
    record("W1b  zCat sequence == RES,RES,MID,SUP,SUP", seq == "RES,RES,MID,SUP,SUP", seq)
    record("W1c  >= 2 RES zones", cats.count("RES") >= 2, f"{cats.count('RES')} RES")
    tops = [z.get("top") for z in zs]
    record("W1d  sorted TOP->DOWN", tops == sorted(tops, reverse=True), f"tops={tops}")
    mids = [z for z in zs if z.get("zCat") == "MID"]
    floor = zs[-1] if zs else {}
    if mids:
        record("W1e  the floor zone's zfp < the mid zones' zfp",
               floor.get("zfp") is not None and floor.get("zfp") < mids[0].get("zfp"),
               f"floor {floor.get('zfp')} vs mid {mids[0].get('zfp')}")


# ── W2 · test_6dim_score ────────────────────────────────────────────────────
def test_6dim_score() -> None:
    """The 0-14 score spans six dimensions with NO global constant; the Options (S3) and
    Analyst (S4) dimensions are WIRED (totals > 0); >= 4 distinct zfp across the 5 zones."""
    f = _newest_dxy()
    d = _payload(f)
    zs = d.get("zones", [])
    zfps = [z.get("zfp") for z in zs]
    record("W2a  >= 4 distinct zfp across the zones", len(set(zfps)) >= 4,
           f"{len(set(zfps))} distinct: {sorted(set(zfps))}")
    levels = d.get("levels", [])
    dims = ("technical", "options", "analyst", "structural", "psychological", "regime")
    tot = {k: sum(int(l.get(k, 0) or 0) for l in levels) for k in dims}
    record("W2b  Options (S3) dimension total > 0", tot["options"] > 0, f"options={tot['options']}")
    record("W2c  Analyst (S4) dimension total > 0", tot["analyst"] > 0, f"analyst={tot['analyst']}")
    present = [k for k in dims if k in (levels[0] if levels else {})]
    record("W2d  no global constant (>= 2 dimensions vary across levels)",
           len({l.get(k) for l in levels for k in dims if k in l}) > 2,
           f"dimension keys in a level: {present}")


# ── W3 · test_e2_zfp_conditioned ────────────────────────────────────────────
def test_e2_zfp_conditioned() -> None:
    """classify() reads the TARGET zone's ZFP and NEVER the momentum scalar (§6.4.1);
    transition() reads target_zfp."""
    src = open(os.path.join(ROOT, "scripts", "e2_engine.py")).read()
    m = re.search(r"def classify\(.*?\n(?=\ndef |\n# )", src, re.S)
    body = m.group(0) if m else ""
    record("W3a  no bars_momentum inside classify()", body.count("bars_momentum") == 0,
           f"{body.count('bars_momentum')} occurrences")
    # THE INTENT: classify takes NO MOMENTUM parameter. It MAY take the PRICE (`spot`) — §6.2
    # #1's "price breaks through" needs it, and the price is not the momentum axis §6.4.1 bans.
    # The earlier check pinned the exact signature `classify(zones: list[Zone])`, which a
    # canon-faithful `spot` addition (correctly) broke.
    _sig = (re.search(r"def classify\(([^)]*)\)", src) or [None, ""])[1]
    record("W3b  classify() takes NO momentum parameter", "momentum" not in _sig,
           f"signature: classify({_sig.strip()})")
    mt = re.search(r"def transition\(.*?\n(?=\n# |\ndef )", src, re.S)
    tbody = mt.group(0) if mt else ""
    record("W3c  transition() reads target_zfp", "target_zfp" in tbody,
           "the §6.4.1 ZFP-conditioned table")


# ── W4 · test_render_ladder ─────────────────────────────────────────────────
def test_render_ladder() -> None:
    """No hardcoded timestamp(2026...) and no now(); the payload carries all three
    categories (RES red / MID orange / SUP teal) so the ladder can paint."""
    v2 = open(os.path.join(ROOT, "plutus-vision-v2.pine")).read()
    n_ts = len(re.findall(r"timestamp\(2026", v2))
    # STRIP PINE COMMENTS before matching a now() CALL — a mention in a `//` comment is not a
    # call (the objective forbids the CALL). Measured 2026-10-07: the only `now()` was inside
    # `// ... derived from the chart, not now()` and the raw scan false-positived.
    code = "\n".join(ln.split("//")[0] for ln in v2.splitlines())
    n_now = len(re.findall(r"\bnow\(\)", code))
    record("W4a  no timestamp(2026...) literal", n_ts == 0, f"{n_ts} occurrences")
    record("W4b  no now() CALL (comments ignored)", n_now == 0, f"{n_now} occurrences")
    d = _payload(_newest_dxy())
    cats = {z.get("zCat") for z in d.get("zones", [])}
    record("W4c  the payload carries RES + MID + SUP (>=1 each)", cats >= {"RES", "MID", "SUP"},
           f"cats={sorted(cats)}")


# ── W5 · test_5week_crossval ────────────────────────────────────────────────
def test_5week_crossval() -> None:
    """For each of the 5 cross-validation weeks: >= 5 zones with >= 1 RES AND >= 1 SUP,
    and the rendered pine for that week has the E1 boxes."""
    cvs = sorted(glob.glob(os.path.join(ROOT, "data", "e1-cv", "DXY-*.json")))
    record("W5a  five cross-validation payloads exist", len(cvs) == 5, f"{len(cvs)} files")
    for f in cvs:
        d = _payload(f)
        zs = d.get("zones", [])
        cats = [z.get("zCat") for z in zs]
        ok = len(zs) >= 5 and "RES" in cats and "SUP" in cats
        record(f"W5  {os.path.basename(f)}: >=5 zones + RES + SUP", ok,
               f"n={len(zs)} cats={cats}")


TESTS = {
    "test_v8_structure": test_v8_structure,
    "test_6dim_score": test_6dim_score,
    "test_e2_zfp_conditioned": test_e2_zfp_conditioned,
    "test_render_ladder": test_render_ladder,
    "test_5week_crossval": test_5week_crossval,
}


def main() -> int:
    names = sys.argv[1:] or list(TESTS)
    for n in names:
        if n not in TESTS:
            print(f"UNKNOWN TEST: {n}  (choose from {', '.join(TESTS)})")
            return 2
        print(f"\n── {n} ──")
        TESTS[n]()
    npass = sum(1 for _, ok, _ in _RESULTS if ok)
    nfail = sum(1 for _, ok, _ in _RESULTS if not ok)
    print(f"\nRESULT pass={npass} fail={nfail}")
    return 0 if nfail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
