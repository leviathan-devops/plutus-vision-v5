#!/usr/bin/env python3
"""test_v1_seal_intact.py — THE W7 GATE. The V1 baseline is UNTOUCHED.

The operator's law: the E1/E2 layers draw ON TOP of the V1 baseline; the baseline itself is
never edited. The V1 baseline is `plutus-vision-v0.pine` (the v2's own header: "SMC verbatim
from plutus-vision-v0.pine").

EXIT 0 = the baseline is byte-identical. EXIT 1 = it was modified.
"""
import hashlib, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
SEALED = "605bff82d3539e9e5e258da3"      # the V1 baseline's sha256 prefix, measured 2026-10-08
PASS, FAIL = [], []
def ok(n, c, d=""):
    (PASS if c else FAIL).append((n, d)); print(f"{'PASS' if c else 'FAIL'} {n} {d}")
for rel in ("plutus-vision-v0.pine", "pine-ide/ide/renderer/plutus-vision-v0.pine"):
    p = ROOT / rel
    if not p.exists():
        ok(f"V1 baseline {rel} exists", False); continue
    h = hashlib.sha256(p.read_bytes()).hexdigest()
    ok(f"V1 baseline {rel} is byte-identical (sealed)", h.startswith(SEALED), f"sha {h[:24]}")
print(f"\nW7 SEAL GATE: {len(PASS)} pass / {len(FAIL)} fail")
sys.exit(1 if FAIL else 0)
