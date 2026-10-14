import pathlib, subprocess, hashlib, datetime, shutil
D = pathlib.Path("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/e1/vision")
V = D / "plutus-vision-v0.pine"
TS = "plutus-vision-v0-station-verified"
CP = D / "Checkpoints" / TS
if CP.exists():
    shutil.rmtree(CP)
(CP / "scripts").mkdir(parents=True)
shutil.copy2(V, CP / "plutus-vision-v0.pine")
for f in ["BUNDLE_MANIFEST.md", "TESTING_LOG.md", "RUNTIME_LEDGER.md",
          "P5_ADVERSARIAL_VERDICT.md", "reports_plutus_vision_v0_parity.md",
          "PLUTUS_VISION_V0_BLUEPRINT.md", "FINDINGS_sweeps_extend.md"]:
    p = D / f
    if p.exists():
        shutil.copy2(p, CP / f)
for s in ["lexcheck.py", "starvation_probe.ts", "p5_adversarial.py", "verify_four.py"]:
    p = D / "scripts" / s
    if p.exists():
        shutil.copy2(p, CP / "scripts" / s)
pk = D / "packages/plutus-vision-v0"
if pk.exists():
    shutil.copytree(pk, CP / "packages", dirs_exist_ok=True)
sha = hashlib.sha256(V.read_bytes()).hexdigest()
files = sorted(p.relative_to(CP).as_posix() for p in CP.rglob("*") if p.is_file())
m = f"""# CHECKPOINT plutus-vision-v0-station-verified

Date: {datetime.date.today()} · Mode: NO LOCK (living snapshot)
Merged SHA: {sha}
Lines: {len(V.read_text().splitlines())}
Engine: PineTS 0.10.0 (forked standalone station, :9641)

## WHAT IS VERIFIED IN THIS CHECKPOINT
- lexcheck PASS (0 findings) — run against THIS sha
- single indicator() declaration (1)
- LuxAlgo attribution retained (5 mentions)
- per-subsystem render 4/4: SMC 5/22/19 · SWEEPS 12/0/24 · VOIDS 94/0/0 · POOLS 1/0/2
- full artifact RUN_OK 112 boxes / 22 labels / 45 lines, 0 warnings
- adversarial: positive GREEN, negative GREEN, 12/12 fixture cells GREEN
- behavior diff 10/10 core shapes present modulo identifiers

## THE EIGHT ENGINE-COMPAT SHIMS (PineTS only; Pine-legal)
1. for-in over box-UDT arrays + na-guard (seed-element tolerance)
2. swp_break_box method inlined at 4 call sites (UDT-returning method on array element)
3. direction literal bound per inlined site (method param has no scope when inlined)
4. bsl_aZZ.bsl_x reverted to bsl_aZZ.x (array-field over-rename, 8 sites)
5. bsl_aZZ.in_out reverted to bsl_roll (method rename missed 2 call sites)
6. swp_len scoping (bare len input + 4 call sites)
7. voi_b.voi_l / bsl_b.bsl_i field reverts (12 + 35 sites)
8. type/parameter shadow renames (swp_isSet param, swp_pct param)

## HONEST GAPS (verbatim, not softened)
- TRADINGVIEW IS UNVERIFIED. Every gate ran on PineTS 0.10.0, a PROXY. No run has
  proved TradingView's compiler accepts the source; no eyes have seen a chart.
- VISUAL PARITY IS COUNTS, NOT PIXELS. SMC + VOIDS match sources exactly on counts;
  SWEEPS source 422s on PineTS so no parity number exists; POOLS draws 1 where the
  source draws 8 (threshold/bar-count dependent, NOT proven benign).
- THE BOX BUDGET IS DOCUMENTED, NOT ENFORCED. 3 of 12 cells sit within 40 boxes of
  the 500 ceiling. OPEN finding, deliberately unfixed in v0.
- AUDIT GATE: BLOCKED (no audit artifact on disk). Never PASS.
- Tier-1 LuxAlgo validation never started.

## CONTENTS ({len(files)} files)
{chr(10).join('  ' + f for f in files)}
"""
(CP / "CHECKPOINT_MANIFEST.md").write_text(m)
print(f"  sealed {TS}")
print(f"  files: {len(files)}")
print(f"  sha:   {sha}")
