# THE SLUMP MAP — PLUTUS VISION (what the churn created, what is safe to delete)

**Date:** 2026-10-09 · **Rule:** every row carries its measured size, the reason it is slump, and the
safety check that must pass BEFORE deletion. Nothing is deleted on this sheet's authority alone.

---

## §1 — WHAT THE ~500M TOKENS ACTUALLY BUILT (the honest inventory)

```
BUILT AND WORKS (keep):
  scripts/e1_zfp.py          the ONE Appendix-B ZFP (the core fix, correct in isolation)
  scripts/e2_engine.py       the §6.4.1 table + the None-honesty ([NO DATA])
  scripts/e1_fetch.py        the [NO DATA] discipline
  the pivot engine + MA grid + band_of (12/10/8/6/4)
  the V1 seal 0d20e831 (byte-identical — HARD STOP H1 held)
  the rig (pv-server:9851 / pine-station:9741 / CDP)
  the fixtures + validationAgainstDocumentedPrints

BUILT AND IS THE DERAILMENT (the A2 payload):
  the baked e1_injected_* arrays in the .pine (15 literal pushes)
  scripts/lqz_vision_v2_build.py (the offline builder that bakes them)
  the 17 reviewer rounds of cosmetics on the baked payload
  the twin renderer, the orphan renderers, the redundant checkpoints

THE WASTE = the three days spent perfecting the baked payload (the report you deleted,
renamed) instead of porting the engine into the indicator. The engine survives; the
payload and its churn go.
```

---

## §2 — THE DELETE LIST (measured, with the safety check)

```
#   PATH                                          SIZE     WHY SLUMP                      SAFETY CHECK BEFORE rm
──  ────────────────────────────────────────────  ───────  ─────────────────────────────  ──────────────────────────────
D1  desktop/tauri/target/                          1.1G     Rust/Tauri build output         cargo build regenerates it; not
                                                             (regenerable)                  referenced by the rig
D2  pine-ide-fork/                                 50M      a fork; not the port target     grep -rn pine-ide-fork scripts/ pine-ide/
                                                                                            -> 0 live refs
D3  Checkpoints/{v1-clean-baseline, v1-working-     210M     5 near-duplicate v1 seals       keep ONE (v1-clean-baseline);
      baseline-2026-10-03, v1-lqz-pin-execution,              (231M total in Checkpoints/)   verify the kept one's v1 sha
      v1-ship-2026-10-02, v1-ship-approved}                                                  == 0d20e831
D4  Checkpoints/{e2-drawing-semi-accurate-2026-     4.3M     post-baseline churn            superseded by indicator-engine1-
      10-06, v2-e2-chain-2026-10-07, indicator-               checkpoints; untracked         e2-fixed; the port re-does it
      port-w1-w7-2026-10-08}                                  (w1-w7 = 2 files, hollow)
D5  pine-ide/charts/plutus-vision-v2.pine           100K     THE TWIN (divergent copy)       the live renderer is ide/renderer/;
                                                                                            one v2 only
D6  pine-ide/ide/renderer/{plutus-vision-e1-        320K     orphan renderers (superseded)   none loaded by the shell; the
      automatic, plutus-vision-v1-tol10,                      (e1-automatic is the OLD        port target is v2
      plutus-vision-v2-smoke, lqz-luxalgo-both,               hand-typed engine)
      lqz-luxalgo, lqz-plutus}.pine
D7  parity_frames/ vision_frames/ runtime/          1.6M     untracked scratch capture       git ls-files -> 0 (never
                                                             output                         committed)
D8  .fence/                                         28K      build scratch (step-*.txt)      transient
D9  ~/.omp/agent/*.bak-*                            6M       stale config/skill backups      keep the most recent only
D10 ~/.omp/agent/sessions/*.jsonl (since 2026-     ~1.0G    the token bonfire              keep recent (7d); archive older
      10-06)
D11 65 uncommitted files (git status --porcelain)   —        the working/committed drift    commit the keepers, revert the
                                                                                            churn — explicitly, not silently
```

**TOTAL REMOVABLE: ~1.4G of tree + ~1.0G of session logs.**

---

## §3 — THE CODE SLUMP (delete in the rebuild, not the filesystem)

```
F-B  the width calcZFP in lqz_vision_v2_build.py:203 + ZFP_BASE in e1_fetch.py
     -> delete; ONE ZFP (e1_zfp.py).   (spec SC-3 / F-55)
F-G  e1_extract.py:1117 comment ("the zone WIDTH") vs the code (Appendix-B probability)
     -> fix the comment or delete it.
F-H  dead code: verify_classic, ema (e1_extract.py); f_e1CalcZFP (the ide .pine)
     -> delete (no caller).
F-D  e1_render_tests.py:228 oracle = a Checkpoints path
     -> repoint to the sealed v1 sha.
F-A  the e1_injected_* zone arrays (the A2 payload)
     -> delete; compute the zones in Pine (SC-19).
```

---

## §4 — THE SAFETY LAW

A deletion runs ONLY after its row's SAFETY CHECK returns its stated value. D1-D3 are the large
wins (1.36G); D5-D8 are the churn. **No deletion happens on this sheet alone** — each is executed
with its check, and the check's output is pasted. The v1 seal (0d20e831) and the engine sources
(S1-S8 of the ledger) are NEVER in this list.

---

## §5 — THE EXECUTION RECORD (2026-10-11, W7 — per-row dispositions)
- D1: already gone (removed 90d33e1). D2: KEPT — the safety check FAILED (4 live
  refs to pine-ide-fork/pv_probe.mjs in scripts/goal_audit.py); §4 binds, no delete.
- D3: the 4 named dupes deleted via git rm — BUT the sheet was STALE (the named
  keeper v1-clean-baseline holds NO seal; a named deletee held one). Keeper intent
  corrected: 7 seal-holders remain incl. Checkpoints/e1-e2-v2-pending-ship-approval.
- D4/D5/D6(twin+orphans)/D7: deleted (2.5M+196K+1.6M checkpoints, the twin charts
  v2, 3 e1-automatic copies, renderer trident_v8, runtime/). lqz-luxalgo/plutus
  KEPT (live refs in scripts/gen_canon.py) — the D6 row overstated.
- D8: KEPT — .fence/ is where SPEC.md:25's done-when steps write; deleting the
  fence's own artifacts destroys the PASS row's backing. D9/D10: out of repo.
- F-A..F-H: F-A done in the renderer (SC-19=0, the W5 deliverable per
  PIN_INDICATOR_PORT_BUILD.md:53); F-B/F-G already gone; F-H (ema/verify_classic)
  deleted; F-D ST-9d repointed to the seal (live modules rebuild 0d20e831
  byte-identically). Fence PASS 5/5 (JEV_GATE/run_gate.sh:54).
