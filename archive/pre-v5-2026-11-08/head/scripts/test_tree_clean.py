#!/usr/bin/env python3
"""test_tree_clean — the W7 NAMED gate (PIN_INDICATOR_PORT_BUILD.md:66).

THE PIN'S GATE, VERBATIM: "git status --porcelain == 0 and no duplicate v2
renderer". No duplicate v2 = exactly ONE plutus-vision-v2.pine under pine-ide/
(the served renderer copy) and no .bak twins.

A REGRESSION GUARD ONLY — it never passes the build. JEV judges (AP-G2).
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main() -> int:
    fails = []
    p = subprocess.run(["git", "status", "--porcelain"], capture_output=True,
                       text=True, cwd=ROOT, timeout=60)
    lines = [ln for ln in p.stdout.splitlines() if ln.strip()]
    print(f"porcelain lines: {len(lines)}")
    for ln in lines[:10]:
        print(f"  {ln}")
    if lines:
        fails.append(f"tree dirty ({len(lines)} lines)")
    v2s = []
    for dp, _, fns in os.walk(os.path.join(ROOT, "pine-ide")):
        if "node_modules" in dp:
            continue
        for fn in fns:
            if fn == "plutus-vision-v2.pine":
                v2s.append(os.path.relpath(os.path.join(dp, fn), ROOT))
    print(f"v2 copies: {v2s}")
    if len(v2s) != 1 or not v2s[0].endswith("ide/renderer/plutus-vision-v2.pine"):
        fails.append(f"duplicate/missing v2 renderer: {v2s}")
    baks = []
    for dp, _, fns in os.walk(os.path.join(ROOT, "pine-ide")):
        for fn in fns:
            if fn.endswith(".bak-w5-splice") or fn.endswith(".bak-w5-v2"):
                baks.append(fn)
    if baks:
        fails.append(f"bak twins present: {baks}")
    print("test_tree_clean:", "PASS" if not fails else f"FAIL — {fails}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
