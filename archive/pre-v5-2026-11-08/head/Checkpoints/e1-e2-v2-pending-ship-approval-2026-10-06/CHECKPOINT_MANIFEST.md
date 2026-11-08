# CHECKPOINT — e1-e2-v2-pending-ship-approval-2026-10-06

**STATE: V2 PENDING SHIP APPROVAL.** The operator's own look (C16, 2026-10-06): *"This is very
good progress... Not bad. I like that the engine two is reacting to the engine one — good, that's
how it's supposed to be."* The C16 gate PASSED. The SHIP remains PENDING the 5-week
cross-validation (the next phase).

## THE DIST (the artifact)
| artifact | sha256 |
|---|---|
| `plutus-vision-v2.pine` | `282517ac622769bdb34296ebee94fa8079da28dbab30bff1c27ae2146a74f011` |
| `plutus-vision-v1.pine` | `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` |

`sha256sum` verified at seal time; the v2 here == the served copy == the tree == the prior
checkpoint's render (ZERO drift).

## THE STATE (what is validated / what is pending)
VALIDATED:
- C1–C15 (14/14) · A1–A7 (9/9) · the ocr AUDIT GATE PASS · the independent re-verification 12/13
  (+1 W5 adjudicated a probe-error).
- The E1/E2 render: 6 labelled institutional-pressure zones + the E2 predicted path, drawn
  together, no wall (drawings scene 846 → 29).
- The E2 accuracy on the TARGET week (Jul 6–11): MAE 0.0979 vs the actual.
- The v1 seal byte-identical (the HARD STOP H1 target).
- C16 — the operator's look: **PASSED**.

PENDING:
- **The 5-week cross-validation** (the operator's directive): pick 5 random trading weeks in the
  last 6 months; rewind to each; verify (1) the dynamic week rendering fires for THAT week and
  (2) the macro-level E1/E2 accuracy across random weeks. THIS is the litmus test before ship.

## THE CONTENTS
| path | content | count |
|---|---|---|
| `src/scripts/` | the full pipeline (e1_week, e1_category, e1_extract, e2_engine, wire_e2, lqz_vision_v2_build, pv-server, the ST suites) | 89 `.py` |
| `src/plutus-vision-lqz/` | the render sources (e1-render.pine, e2-render.pine) | 5 `.pine` |
| `dist/` | the built artifacts + SHA256SUMS | 3 |
| `context_management/` | the full canon | 12 docs |
| the 5 ship docs | BUILD_REPORT (2220) · DEBUG_LOG (2050) · FAILURE_LOG (903) · SPEC_VIOLATION_LOG (283) · TESTING_LOG (1633) | 5 |
| `visual/runtime-state.png` | the live runtime capture (the app: 6 zones + the E2 path) | sha bf0d72dc66652585 |
| `artifacts/package/` | the DPL1 spec + the wave-plan + the blueprint | (the build package) |
| `artifacts/data-snapshot/` | the E1/E2 payloads (the data the render consumed) | 8 |

## THE HONEST GAPS (the unstated-absence rule is satisfied)
1. **The 5-week cross-validation is NOT run** — it is the pending phase (named above).
2. **The E2 direction** is the momentum's sign (a weak signal). The TZ fix made it match the
   target week; whether it generalizes is exactly what the 5-week test will measure.
3. **The BACKTEST overlay** draws the zones at the chart's last bar, not the room's future week
   (the room's Vite chart has no future drawing).
4. The `visual/runtime-state.png` is the operator-display capture; the map's EDGE cases (a replay
   mid-week) are not separately captured.

## THE REPLICATION RECIPE
```
build  PV2_PAIR=DXY PV2_WEEK=<the-week> python3 scripts/lqz_vision_v2_build.py
       -> plutus-vision-v2.pine  (v1 verified untouched -> HARD STOP H1 on any drift)
tests  python3 scripts/e1_st_18.py · scripts/e2_tests.py · scripts/e1_tests.py  (0 fail)
rig    :9741 pine-station · :9851 pv-server · :9222 CDP
app    pine-ide  -> the 2-tab dashboard (PINE IDE + BACKTEST)
```

## THE NEXT WORK (the queued phase)
The 5-week cross-validation: 5 random trading weeks in the last 6 months, each rewound on the
chart, the pipeline run per week, the E1 zones + E2 path rendered, the accuracy measured vs the
actual. The ship decision follows the verdicts.

---
## UPDATE 2026-10-06 (after the 5-week CV + the macro sweep + the audit fixes)

**THE MACRO VERDICT (35 weeks, 2026-02-02…09-28, `evidence/macro-sweep.json`):**
- **E1 zone relevance: 74% mean** (min 33% · max 100%); **32/35 = 91% of weeks ≥50% touched. SHIPS.**
- **E2 direction: 19/35 = 54%** (decisive |mom|≥0.5: 15/26 = 58%). Marginal.
- **E2 path beat-naive: 17/35 = 49%** — a coin flip. The 5-week 5/5 was a sample-size artifact. NO SHIP.

**THE AUDIT GATE: BLOCKED** (`qwen-code-audit` → `OCR_JSON_UNPARSEABLE` on both runs; 4 findings
returned in text, ALL addressed). BLOCKED is never PASS → the ship stays PENDING.

**THE FIXES IN THIS CHECKPOINT** (`scripts/e2_engine.py`, shas in the tree):
1. The degree guard: `assert` → `FabricationRefused` (ST-14b, passes under `-O`).
2. `classify` sorts `solid` by `(mid,id)` → order-independent anchors (ST-14a).
3. The day range override preserves the Link trigger as `link_zone` (§6.6 trace).
4. The fine-path day tag scans past a taken slot (ST-14c).

**BATTERY:** `e2_tests 39/0 · e1_st_18 8/0 · e1_tests 15/0`. **The target render byte-identical
(`282517ac622769bd`) after every fix.**

## THE SEAL MODE — MODE B (no lock, a MUTABLE working snapshot)
Per the saving-checkpoints skill: Mode A = a full-tree `chattr +i` (byte-immutable); Mode B = no
lock (a living snapshot, refreshed in place). **This checkpoint is MODE B** — the operator labeled
it "PENDING ship approval" (a follow-up is expected: the E2 direction work or the ship). It is
NEVER manifest-only (the partial-lock lie). The `chattr` lock is the operator's to apply (the
guardian owns protect/unprotect) — apply Mode A here when the ship is final.

## THE ANCHOR INDEX (where each claim's source lives)
- The E1 deterministic derivation: `scripts/e1_extract.py:452` (`build_levels`) and
  `scripts/e1_extract.py:722` (`assemble`).
- The E2 engine + the fixed decision matrix: `scripts/e2_engine.py:103` (`classify`), and the
  fixes at `scripts/e2_engine.py:55` (the degree refusal), `scripts/e2_engine.py:121` (the sort),
  `scripts/e2_engine.py:533` (the link_zone), `scripts/e2_engine.py:677` (the tag scan).
- The payload builder: `scripts/lqz_vision_v2_build.py:153` (`build_payload`).
- The momentum (the E2's weak axis): `scripts/wire_e2.py:34` (`compute_momentum`).
- The cross-val harness: `/tmp/pv_crossval.py:56` (`measure_week`); the macro: `/tmp/pv_macro.py:41`.
- The evidence: `evidence/macro-sweep.json:1`, `evidence/crossval-5week.json:1`.
- The testing log: `TESTING_LOG.md:1701` (the audit gate + the macro section).
- The debug log: `DEBUG_LOG.md:2107` (F-AUDIT-SWEEP).
- The report: `CROSSVAL_5WEEK.md:145` (the macro sweep).
