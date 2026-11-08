# TESTING_LOG — PLUTUS VISION M1 (plan + results, append-only)

Testing law (operator R-13 and the session order of 2026-11-08): every test of the indicator runs on **Pinebox**,
driven with the `pinebox` tool, and is judged on the **opened** capture against the golden-week oracle images.
No unit tests, no code review. The week-outcome table (m1/src/evaluate.ts) measures the card against the bars;
it is an instrument, not a verdict. The checkpoint gate (gates/commit_gate.py:199) checks the committed PNGs.

---

## ZONE 1 — THE TEST PLAN

## TEST PLAN ENTRY — 2026-11-08 — golden-week visual acceptance (M1 target)

### HOST
- **What:** the v1 baseline + E1 composition on DXY 1H, framed on 2026-07-06..10, shows every required E1 family
  (13, m1/EXECUTION_CONTRACT.md:1) and price reacts at the drawn zones the way the card's ZFP predicts, matching the
  oracle images in /home/leviathan/Pictures/Jul_6-10_DXY_Gold_Standard.
- **How:** `pinebox load` the composition, `chart op=zoom/pan` to the week, `shot section=chart`, OPEN the PNG,
  compare against the oracle; fill comparison.json; run `bun m1/src/evaluate.ts DXY 2026-07-06`.
- **PASS criteria:** 13/13 families MATCHED in comparison.json; outcome table >= 95% correct on tested zones; the
  opened capture shows the oracle's 4H BoM supply 101.33-101.40, the 101.19-101.275 rejection band, the 1H BoM demand
  100.61-100.68 and the Jul 10 reversal from 100.598 as E1 objects.
- **FAIL criteria:** any family WRONG/MISSING/UNOBSERVABLE; outcome < 95%; any hardcoded week price in m1/src.
- **Status:** FAILED (CP-001: 2/13 MATCHED, 42.9%) — re-run at every checkpoint

## TEST PLAN ENTRY — 2026-11-08 — restorability of every visual checkpoint

### SCRIPT
- **What:** a checkpoint commit regenerates byte-identical card and composition.
- **How:** `git archive vc/<id> | tar -x -C /tmp/restore-<id>`; `bun m1/src/run.ts DXY 2026-07-06 && bun m1/src/compose.ts DXY 2026-07-06`; sha256sum.
- **PASS criteria:** composition sha256 == the checkpoint's `composition_sha256`.
- **FAIL criteria:** any difference, or a missing module in the archived tree.
- **Status:** PASSED (CP-001, 2026-11-08)

## TEST PLAN ENTRY — 2026-11-08 — no hardcoded week values

### SCRIPT
- **What:** no golden-week price, date or zone value is typed in m1/src.
- **How:** grep m1/src for the oracle prices (101.33, 101.40, 101.19, 101.275, 100.61, 100.68, 100.598, 100.84) and
  for the literal 2026-07; the only allowed date is the CLI default argument.
- **PASS criteria:** zero hits outside the CLI default `monday = '2026-07-06'`.
- **FAIL criteria:** any hit in a computation.
- **Status:** PASSED (2026-11-08, CP-001 tree)

## TEST PLAN ENTRY — 2026-11-08 — Protocol A extraction correctness

### HOST
- **What:** the 2026-07-06 expiry table read from the original image matches across three passes.
- **How:** pass 1 full image, pass 2 magnified Monday EUR/USD + USD/JPY, pass 3 magnified Tuesday columns; reconcile.
- **PASS criteria:** every strike/notional identical across the passes that cover it; no [UNCLEAR].
- **FAIL criteria:** any disagreement left unreconciled.
- **Status:** PASSED

---

## ZONE 2 — THE TEST RESULTS

## TEST RESULT — 2026-11-08 — Protocol A extraction correctness

### HOST
- **The run:** plutus-browser instance 13 opened the investinglive Orders list, page 4, then the 2026-07-06 post;
  the embedded table image was fetched as original bytes; passes read with the vision reader.
- **The raw output:** post time "06/07/2026 | 05:47 GMT"; Monday EUR/USD 1.1300 €830m, 1.1400 €2.2bn, 1.1450
  €1.4bn, 1.1500 €2.4bn, 1.1600 €1.0bn; Tuesday EUR/USD 8 strikes incl. 1.1350 €1.5bn, 1.1500 €2.8bn.
- **The verdict:** PASS — pass1 == pass2 (Monday), pass1 == pass3 (Tuesday).
- **The artifacts:** m1/evidence/protocol-a/extraction.json:1, investinglive-fxo-2026-07-06.jpg, pass2/pass3 PNGs.

## TEST RESULT — 2026-11-08 — VC-000 first render

### HOST
- **The run:** `pinebox load` (instance 3, cloud) of the first composition; framed Jun 25..Jul 14; shot.
- **The raw output:** chart covered by 43 full-width zone boxes and every option label.
- **The verdict:** FAIL (legibility) — operator: "the entire screen is covered".
- **The artifacts:** m1/visual-log/VC-000/runtime-r1.png (sha256 d35dbb34...), operator-orca-2026-11-08-2132.png.

## TEST RESULT — 2026-11-08 — CP-001 golden-week visual acceptance

### HOST
- **The run:** regenerate card + composition; `pinebox load` -> `{"bars":5000,"boxes":24,"labels":50,"lines":86,"tables":1}`;
  zoom/pan to 2026-06-23T10:00Z..2026-07-16T04:00Z; `shot` -> runtime-state.png 142,712 bytes sha256 3ae1a18d...; opened.
- **The raw output:** outcome table "zones in range 8 | tested 7 | correct 3 (42.9%)" (m1/checkpoints/CP-001/outcome.txt).
- **The verdict:** FAIL against the M1 target (2/13 families MATCHED); legibility improved (operator: "Much less clutter,
  much more legible ... not fully approved yet").
- **The artifacts:** m1/checkpoints/CP-001/{checkpoint.json, comparison.json, outcome.txt, visual/*.png}.

## TEST RESULT — 2026-11-08 — determinism before the CP-001 commit

### SCRIPT
- **The run:** `bun m1/src/run.ts DXY 2026-07-06 && bun m1/src/compose.ts DXY 2026-07-06`, twice.
- **The raw output:** composition sha256 c9261fb3f5a0fb9b480aa08b3f870d0dddf54746b30b342bd75788545a1c3684 both times;
  card sha256 unchanged (07bce57f...).
- **The verdict:** PASS.
- **The artifacts:** m1/out/*.

## TEST RESULT — 2026-11-08 — no hardcoded week values (CP-001 tree)

### SCRIPT
- **The run:** `grep -nE '101\.33|101\.40|101\.19|101\.275|100\.61|100\.68|100\.598|100\.84|2026-07' m1/src/*.ts`
- **The raw output (complete):**
```
m1/src/compose.ts:5:// Usage: bun m1/src/compose.ts DXY 2026-07-06
m1/src/compose.ts:103:if (import.meta.main) { const [a = 'DXY', m = '2026-07-06'] = process.argv.slice(2); ... }
m1/src/evaluate.ts:12:const [asset = 'DXY', monday = '2026-07-06'] = process.argv.slice(2);
m1/src/run.ts:2:// Usage: bun m1/src/run.ts DXY 2026-07-06   -> m1/out/e1-card-<asset>-<monday>.json
m1/src/run.ts:89:  const [asset = 'DXY', monday = '2026-07-06'] = process.argv.slice(2);
```
- **The verdict:** PASS — every hit is a usage comment or a CLI default argument; no oracle price appears.
- **The artifacts:** this entry.

## TEST RESULT — 2026-11-08 — restorability of CP-001

### SCRIPT
- **The run:** /tmp/pv-restore-test.sh — `git archive vc/CP-001 | tar -x -C /tmp/restore-CP-001`; `rm m1/out/*.pine m1/out/*.json`;
  `bun m1/src/run.ts DXY 2026-07-06 && bun m1/src/compose.ts DXY 2026-07-06`; sha256sum.
- **The raw output:**
```
vc/CP-001 -> 8ae7388d421703d97d98187e9d260d903d1b3573
c9261fb3f5a0fb9b480aa08b3f870d0dddf54746b30b342bd75788545a1c3684  m1/out/plutus-vision-v5-e1-DXY-2026-07-06.pine
c9261fb3f5a0fb9b480aa08b3f870d0dddf54746b30b342bd75788545a1c3684  -   (the committed composition)
```
- **The verdict:** PASS — the regenerated composition is byte-identical to the one in the checkpoint and the one Pinebox loaded.
- **The artifacts:** tag vc/CP-001; m1/VISUAL_CHECKPOINTS_LOG.md VC-001 restore block.

## TEST RESULT — 2026-11-08 — CP-002 golden-week visual acceptance

### HOST
- **The run:** regenerate; `pinebox load` -> boxes 25, labels 50, lines 86, tables 1; zoom x7 + pan to 06-22..07-16; shot -> 159,315 bytes; opened.
- **The raw output:** "zones in range 9 | tested 6 | correct 5 (83.3%)" (m1/checkpoints/CP-002/outcome.txt).
- **The verdict:** FAIL against M1 (95% not met; week split caught by the operator).
- **The artifacts:** m1/checkpoints/CP-002/.

## TEST PLAN ENTRY — 2026-11-08 — one active week for v1 and E1

### HOST
- **What:** with the candles rewound so the last bar is in 2026-07-06..10, both the v1 baseline and the E1 layer draw on
  that week; with the candles on any other week, E1 detects that week from the last candle (and refuses by name on the
  chart when no card exists for it).
- **How:** Pinebox replay to the week's end; load; shot; then a second week; shot.
- **PASS criteria:** both layers' drawings sit on the last candle's week in both pictures.
- **FAIL criteria:** any E1 drawing on a week other than the last candle's.
- **Status:** PENDING
