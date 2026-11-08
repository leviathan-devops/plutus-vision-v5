# WAVE PLAN — PLUTUS VISION DYNAMIC INDICATOR
Derives from `PLUTUS_VISION_DYNAMIC_INDICATOR_DPL1_SPEC.md` (§B.3, approved 21/21).

WAVES: 5

W1 — fabrication-kill desk — remove the dead fabrication surface (critical path)
  files: plutus-vision-lqz/e1-render.pine (delete f_e1CalcZFP :151-156),
         scripts/e1_extract.py, scripts/e1_category.py (verify only — fixed 2026-10-08)
  deliverable: no geometry-derived number can reach a ZFP label; payload provenance proven
  gate: test_zfp_transcribe · test_zfp_deadcode_absent
  dependency: none — everything downstream reads the ZFP W1 fixes

W2 — merge-faces desk — one Engine 1 from two halves
  files: plutus-vision-lqz/e1-render.pine (face B rails on one anchor), src/e1_merged.ts (NEW)
  deliverable: IP pressure bands AND S/D + LQZ rails render on the same tsL/tsR window
  gate: test_merged_faces_render · test_one_week_left_window
  depends: W1 (cannot render a label whose ZFP is untrusted)

W3 — e2-desk — turn the shape chain ON and derive it
  files: plutus-vision-lqz/e2-render.pine (default ON), src/e2_chain.ts (NEW)
  deliverable: chain drawn as a line, derived from pressure+ZFP, never a literal
  gate: test_e2_derive_from_pressure · test_e2_no_literal_chain
  depends: W1 (reads the fixed ZFP), W2 (needs the merged zone table)

W4 — dynamic-desk — week scope, emitter, sidecar
  files: src/week_scope.ts (NEW), src/emit_pine.ts (NEW), sidecar/server.ts (NEW)
  deliverable: derive the active week from the most-recent candle; emit; sidecar serves
               pre-week bars only; one-week-left, no forward
  gate: test_week_scope_edges · test_replay_cutoff_enforced · test_state_bleed_absent
  depends: W2 (emits the merged table)

W5 — replay-acceptance desk — THE test
  files: spec/tests/st-*.ts, scripts/run-st.ts, .trident/replay-*.json (evidence)
  deliverable: 10 random weeks replayed Mon 09:00 -> Fri NY close at 10x, scored; plus the
               Jul 6-10 golden week against its reference images
  gate: test_replay_10week_score · test_golden_week_match
  depends: all of W1-W4

PARALLELISM: W1 runs alone (critical path). W2 then W3 are strictly ordered on W1.
W4 runs CONCURRENT with W3 (disjoint files: e2-render vs week_scope/emit/sidecar).
W5 runs last — it is the only wave that can close the run.

DISJOINTNESS (verified at preflight): no file appears in two waves.
