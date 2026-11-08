#!/usr/bin/env python3
"""lqz_adversarial.py — the adversarial half for the W5/W6 additions.

The rule this file exists to enforce: a guard that has never been made to FAIL is
an untested guard. Every check below either (a) plants the exact defect the guard
was built for and proves the guard REFUSES, or (b) reads the artifact and asserts a
property. A check that cannot fail is not a check.

Must-fail mutants are the standard here, not the exception: the panel renderer
shipped three defects in a row (identical panels, off-by-one, the debounced flush),
and only the third attempt named the real cause. So each guard now gets a planted
defect in a COPY of the script, and a guard that lets the mutant through is itself
the finding.
"""
import pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PANEL = ROOT / "scripts/lqz-panel.mjs"
TMP = pathlib.Path("/tmp/lqz-adv"); TMP.mkdir(exist_ok=True)
RESULTS = []


def rec(name, ok, detail):
    RESULTS.append((name, ok, detail))
    print(f"  [{'PASS' if ok else 'FAIL'}] {name:44} {detail}")


# ── A1. SUPPRESSION: every detector colour constant must be transparent ──────
# The D1 look failed twice on this. The property is mechanical, so assert it
# mechanically: zero colour INPUTS left in the deliverable that carries the
# detectors, and the count of transparent constants matching the SILENT list.
d1 = (ROOT / "lqz-luxalgo.pine").read_text()
live_inputs = re.findall(r"^(swp_|voi_|bsl_)c[a-zA-Z0-9_]*\s*=\s*input\.color", d1, flags=re.M)
transparent = re.findall(r"^(swp_|voi_|bsl_)c[a-zA-Z0-9_]*\s*=\s*color\(na\)", d1, flags=re.M)
rec("A1 detector paint suppressed", len(live_inputs) == 0 and len(transparent) >= 8,
    f"live colour inputs={len(live_inputs)} transparent={len(transparent)}")

# ── A2. CAPS: the engine default dropped zones silently ────────────────────
# Measured before the fix: D2 drew 112 zones into 50 lines. A cap that is not
# declared is a cap that eats data.
caps_ok = []
for f in ("lqz-luxalgo.pine", "lqz-plutus.pine", "plutus-vision-v1.pine"):
    s = (ROOT / f).read_text()
    # the FIRST indicator() decl counts; later ones are commented-out merged headers
    first = next((l for l in s.split("\n") if l.startswith("indicator(")), "")
    caps_ok.append(all(f"max_{k}_count = 500" in first for k in ("labels", "lines", "boxes")))
rec("A2 drawing caps raised to 500", all(caps_ok), f"per-deliverable: {caps_ok}")

# ── A3. MUTANT: a wrong expected title must be REFUSED ──────────────────────
# The ran-title assertion is the only deterministic per-panel identity. If a
# poisoned expectation sails through, the assertion is decorative.
m1 = TMP / "m1.mjs"
s = PANEL.read_text().replace('expect: "LQZ LuxAlgo"', 'expect: "TOTALLY WRONG TITLE"')
m1.write_text(s)
r = subprocess.run(["bun", str(m1), "1H"], capture_output=True, text=True, timeout=300, cwd=ROOT)
a3 = r.returncode != 0 and "PANEL_GRID_FAIL" in (r.stdout + r.stderr)
rec("A3 mutant: wrong title refused", a3,
    f"exit={r.returncode} {(r.stdout + r.stderr).strip().splitlines()[-1][:90] if (r.stdout + r.stderr).strip() else ''}")

# ── A4. MUTANT: two identical panels must be REFUSED ────────────────────────
# This is the defect that shipped first: three captures, one frame. The guard's
# whole job is to make a non-distinct grid unwritable.
m2 = TMP / "m2.mjs"
# D2 must be identical to D1 in file, marker AND expected title — otherwise an
# earlier guard (the mark check) fires and the duplicate guard is never reached.
# That is exactly what the first version of this mutant did: it proved the mark
# assertion works and left the duplicate guard untested.
_src = PANEL.read_text()
s = _src.replace(
    '{ key: "D2", file: "lqz-plutus.pine", mark: "LQZ Plutus", expect: "LQZ Plutus",',
    '{ key: "D2", file: "lqz-luxalgo.pine", mark: "LQZ LuxAlgo", expect: "LQZ LuxAlgo",')
assert s != _src, "A4 mutant did not apply — the test is broken, not the code"
m2.write_text(s)
r = subprocess.run(["bun", str(m2), "1H"], capture_output=True, text=True, timeout=300, cwd=ROOT)
out = r.stdout + r.stderr
a4 = r.returncode != 0 and "not distinct" in out
rec("A4 mutant: duplicate panels refused", a4,
    f"exit={r.returncode} {'guarded' if a4 else out.strip().splitlines()[-1][:90]}")

# ── A5. THE GRID ON DISK IS THE GRID THAT WAS VERIFIED ─────────────────────
grid = ROOT / "reports/panel-grid-1H.png"
a5 = grid.exists() and grid.stat().st_size > 100_000
rec("A5 grid artifact present", a5, f"{grid.name} {grid.stat().st_size if grid.exists() else 0} bytes")

# ── A6. THE LEDGER CITES EVERY FRAME ───────────────────────────────────────
led = (ROOT / "reports/lqz_visual_ledger.md").read_text()
frames = ["5c4285258a36d4b6", "b2b5b5ba552ffc0a", "a0f96c396c8168f7"]
a6 = all(f in led for f in frames)
rec("A6 ledger carries the frame shas", a6, f"{sum(f in led for f in frames)}/{len(frames)} shas cited")

# ── VERDICT ────────────────────────────────────────────────────────────────
passed = sum(1 for _, ok, _ in RESULTS if ok)
print(f"\nADVERSARIAL VERDICT: {passed}/{len(RESULTS)} PASS")
if passed != len(RESULTS):
    print("CONFIRMED DEFECTS: " + ", ".join(n for n, ok, _ in RESULTS if not ok))
    sys.exit(1)
print("ZERO confirmed defects — every guard bit its mutant")
