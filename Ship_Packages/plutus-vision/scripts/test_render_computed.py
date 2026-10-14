#!/usr/bin/env python3
"""
test_render_computed — the W5 MECHANICAL gate (PIN_INDICATOR_PORT_BUILD.md:57).

    python3 scripts/test_render_computed.py

THE INVARIANT: the SERVED indicator (pine-ide/ide/renderer/plutus-vision-v2.pine)
COMPUTES its E1 zones from the chart's bars. No injected zone literal survives:

    1. SC-19 (the port spec):  e1_injected_(top|bottom|cat|degree|zfp).push([0-9]  == 0
    2. W5 gate (the pin):      e1_injected_*.push([0-9]                              == 0
    3. the array.push form:    array.push(*_injected_*, [0-9]                        == 0
       (a string CONCAT embedding computed values is not a literal — only a LEADING
       numeric literal counts; display vocabulary like "S T2 Entry " + price is fine)
    4. the zones are built by ta.* (>= 10 call sites) — P1/P2/P5/P6/P9 live
    5. the compute structure exists (f_e1Compute + f_e2Compute + the e1g_* series)
    6. the v1 region is byte-intact (ST-9: head sha == the C16-approved head)

A REGRESSION GUARD ONLY — it never passes the build. JEV judges (AP-G2).
"""

from __future__ import annotations

import hashlib
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
V2 = os.path.join(ROOT, "pine-ide", "ide", "renderer", "plutus-vision-v2.pine")

# The C16-approved v1-region head sha — measured 2026-10-11 from the caef1f9 blob
# (== the served 282517ac backup): head -n 1271, split at "E1 — the institutional
# pressure map" line 1272. The W5 artifact must carry this region byte-identical.
V1_HEAD_SHA16 = "5247ec3f21acc938"
V1_SPLIT_MARK = "E1 — the institutional pressure map"

FAILS: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))
    if not ok:
        FAILS.append(name)


def main() -> int:
    src = open(V2, encoding="utf-8").read()
    print(f"artifact: {V2}")
    print(f"sha: {hashlib.sha256(src.encode()).hexdigest()[:16]}  lines: {len(src.splitlines())}")

    sc19 = len(re.findall(r"e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]", src))
    check("SC-19==0 (spec zone-literal pattern)", sc19 == 0, f"hits={sc19}")

    w5 = len(re.findall(r"e1_injected_*.push\([0-9]", src))
    check("W5-gate==0 (pin pattern)", w5 == 0, f"hits={w5}")

    arr = len(re.findall(r"array\.push\((e1|e2)_injected_[a-z_]+, *[0-9]", src))
    check("array.push numeric-literal form==0", arr == 0, f"hits={arr}")

    ta = len(re.findall(r"ta\.[a-z]+\(", src))
    check("zones built by ta.* (>=10)", ta >= 10, f"calls={ta}")

    struct = all(s in src for s in ("f_e1Compute() =>", "f_e2Compute() =>", "e1g_ema20"))
    check("compute structure (f_e1Compute/f_e2Compute/e1g_*)", struct)

    lines = src.splitlines(keepends=True)
    try:
        split = next(i for i, ln in enumerate(lines) if V1_SPLIT_MARK in ln)
    except StopIteration:
        split = -1
    head_sha = hashlib.sha256("".join(lines[:split]).encode()).hexdigest()[:16] if split > 0 else "NONE"
    check("ST-9 v1 region intact", split == 1271 and head_sha == V1_HEAD_SHA16,
          f"split@{split + 1 if split > 0 else '?'} head={head_sha}")

    print(f"== {'6/0 ALL GREEN' if not FAILS else f'{6 - len(FAILS)}/6 FAIL: {FAILS}'} ==")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
