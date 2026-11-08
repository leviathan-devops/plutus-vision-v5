# WAVE PLAN — PLUTUS VISION INDICATOR PORT
WAVES: 7

Interfaces land in W1; implementers + consumers run CONCURRENTLY after. File sets DISJOINT per wave.

## W1 — THE ZFP (critical path — the operator's complaint)
- owner: zfp-desk · deps: none
- files: scripts/e1_zfp.py (NEW) · scripts/e1_category.py · scripts/e1_extract.py
- deliverable: zfp(zone,bars) = Appendix-B base + the 6 B.2 modifiers; zfp_from_degree + CAT.zfp DELETED
- done-when: test_zfp_discriminates — a breakout week's ceiling ZFP > the same zone's in a consolidation week
- gate cmd: `python3 scripts/indicator_gate.py --differential`

## W2 — THE ZONE ASSEMBLY (transcribe the canon's 9 steps)
- owner: assembly-desk · deps: W1 (calls the ZFP)
- files: scripts/e1_zone_assembly.py (NEW)
- deliverable: cluster(0.15/0.10, 3+) -> 6 dims x2 + bonus<=2 -> degree -> positional name
- done-when: test_zone_count_data_driven (4 clusters -> 4 zones) · test_names_positional (RES.top>spot>SUP.bottom)

## W3 — THE PILLARS (P6 first, then P3/P4/P7/P8)
- owner: pillars-desk · deps: W2
- files: scripts/e1_pillars.py (NEW)
- deliverable: P6 fib+rounds; P3/P8 option conversion; P4 analyst; P7 arena — each a level emitter
- done-when: test_dimension_not_flat (technical/structural vary per week) · test_pillar6_present

## W4 — THE LSZ + 4H VERIFICATION
- owner: lsz-desk · deps: W3
- files: scripts/e1_pillars.py (P5 section only)
- deliverable: lsz[] zone objects (Step 0.45) + the 4-point 4H block protocol (Step 0f)
- done-when: test_lsz_zone_objects · test_4h_block_verified (width<=0.40, dated, no overlap)

## W5 — THE PINE EMISSION (computed, not literal)
- owner: emit-desk · deps: W1..W4
- files: scripts/pine_emit.py (NEW) · plutus-vision-v2.pine
- deliverable: the e1_injected_* arrays emitted from computed zones
- done-when: test_payload_computed (two weeks' payloads differ by sha)

## W6 — THE GATES (differential + the 5-week litmus)
- owner: gate-desk · deps: W1, W5
- files: scripts/indicator_gate.py (NEW)
- deliverable: the differential ZFP gate + the 5-week render match vs the v8
- done-when: test_gate_bites (a ZFP that cannot show failure FAILS the build)

## W7 — THE CLEANUP
- owner: cleanup-desk · deps: W6
- files: deletions only (scratch pines, _current.json, desktop/tauri/gen, untracked Checkpoints)
- deliverable: the tree pruned; the V1 baseline sha unchanged
- done-when: test_v1_seal_intact (baseline sha byte-identical)

Oracle table: each wave's done-when is a named test above; the gate cmd is the wave's exit.

## AS-EXECUTED (2026-10-11 — the exit record; guards, never verdicts — JEV judges)
- W1 zfp-desk: the ONE Appendix-B ZFP (base + six B.2 modifiers); the width calcZFP
  and ZFP_BASE deleted (F-55). Gate test_zfp_discriminates 5/0: a breakout-week
  ceiling reads HIGHER than in consolidation (PIN_INDICATOR_PORT_BUILD.md:35).
- W2 assembly-desk: the canon's 9-step assembly with the POSITIONAL ladder fix
  (F-129: rank-naming lied on rally weeks; classify-then-name). Gate 36/0 plus
  the empty-map guard (F-130) and the arm max_tokens fix (F-131).
- W3/W4 pillars+LSZ: P6 fib + round-number grid live; P3/P4/P7/P8 structure-built
  but [NO DATA] (F-52 403-block stands); LSZ later REMOVED from E1 by operator
  ruling. Gate test_pillars 35/0 (PIN_INDICATOR_PORT_BUILD.md:45).
- W5 pine-desk: THE DELIVERABLE — the zones COMPUTED in the served .pine
  (SC-19=0, 26 ta.* calls, v1 region byte-intact). Resurrected from git 0b40379,
  6 defects fixed (F-132..F-137), renders verified on the station AND the :99
  IDE with screenshots (JEV_GATE/run_gate.sh:54).
- W6 gate-desk: scripts/indicator_gate.py (NEW) + JEV_GATE/run_gate.sh wiring —
  the two-week differential, the 5-week litmus over real Friday-close windows
  (seed 20261011, cache data/litmus/dxy_1h.csv), and a live :99 screenshot bound
  by buffer-sha to the artifact, ingested into EVERY JEV chunk (SPEC.md:21).
- W7 cleanup-desk: deletions per forensic/SLUMP_MAP.md:33 with per-row safety
  checks (D3/D4/D5/D6/D7 + F-D/F-H code slump; D2/D8 kept with reason, D9/D10
  out of repo), keepers committed, fence PASS 5/5 in the message. Gate
  test_tree_clean: porcelain==0 and one v2 renderer (SPEC.md:1).
- STOP CONDITION (unchanged): `bash JEV_GATE/run_gate.sh` returns YES (all chunks
  act) AND the operator LOOKS at the live render (C16). Anything less is OPEN.

## EXECUTION LOG (ledger refs — every claim traceable)
- 2026-10-11 W1: test_zfp_discriminates 5/0. The Appendix-B ZFP discriminates
  breakout vs consolidation at the Python level before anything renders.
- 2026-10-11 W2: test_zone_assembly 36/0 after the F-129 positional-ladder fix
  (rank-naming lied below the spot on rally weeks) + the F-130 empty-map guard.
- 2026-10-11 W3/W4: test_pillars 35/0 verified; P3/P4/P7/P8 stay [NO DATA]
  behind loud-fail guards (the opt-strike layer draws nothing unfed).
- 2026-10-11 W5: resurrection audited (SC-19=0, 26 ta.*), F-132..F-137 fixed,
  test_render_computed 6/0; renders verified on the station (5 boxes / 5 lines /
  6 labels, spread 100.74→101.79) AND the :99 IDE (5 spread zones + E2 path +
  table object) with opened screenshots (JEV_GATE/run_gate.sh:54).
- 2026-10-11 W6: scripts/indicator_gate.py runs the 5-week litmus (seed 20261011,
  400 real Friday-close bars/week, RES+SUP per week, ceilings vary 37/40/55) +
  the --differential probe (wide Oct-02 10% vs narrow Jul-24 25%) + a
  sha-bound :99 screenshot; run_gate.sh ingests the evidence into every chunk
  and halts without JEV on any litmus failure (SPEC.md:21).
- 2026-10-11 W7: slump deleted per forensic/SLUMP_MAP.md:33 (D3/D4/D5/D6/D7 +
  F-D/F-H; D2/D8 kept with reason, D9/D10 out of repo), bulk archives ignored
  (preserved on disk), fence PASS 5/5, test_tree_clean guards the clean tree.
- JEV trajectory this set: all-noop (max 0.451) → litmus wired (chunk 6
  escalate 0.733, chunks 4/5 rising) → W7 cleanup committed. The verdict
  decides; the trajectory is information (PIN_INDICATOR_PORT_BUILD.md:6).

## MAINTENANCE LAW
- This plan is DERIVED (the Toolset is the authority — never cite this file as
  proof of a formula). Every wave appends its exit record above with ledger
  refs before its gate; a wave without an entry never ran (SPEC.md:1).
