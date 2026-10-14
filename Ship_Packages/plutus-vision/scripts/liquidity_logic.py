#!/usr/bin/env python3
"""What does each LuxAlgo liquidity indicator actually SEARCH FOR?
Prints the detection core of each of the three, so it can be mapped onto the operator's
hand-drawn GREEN liquidity bands."""
import pathlib, re, sys

S = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/sources")
FILES = {
    "SWEEPS  (liquidity-sweeps.pine)": "liquidity-sweeps.pine",
    "VOIDS   (liquidity-voids-fvg.pine)": "liquidity-voids-fvg.pine",
    "POOLS   (buyside-sellside-liquidity.pine)": "buyside-sellside-liquidity.pine",
}
PAT = re.compile(
    r"(ta\.pivoth|fvg|fairValue|void|sweep|zigzag|pivot|liqLen|liqMar|margin|"
    r"high\[|low\[|barsSince|isSweep|outbreak|retest)", re.I)

for label, f in FILES.items():
    p = S / f
    L = p.read_text().split("\n")
    print("=" * 78)
    print(label, f"({len(L)} lines)")
    print("=" * 78)
    for i, ln in enumerate(L, 1):
        s = ln.strip()
        if not s or s.startswith("//"):
            continue
        if PAT.search(s):
            print(f"{i:5}: {s[:150]}")
    print()