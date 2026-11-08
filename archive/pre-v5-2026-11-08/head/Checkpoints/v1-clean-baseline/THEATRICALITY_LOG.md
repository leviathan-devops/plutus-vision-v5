# THEATRICALITY_LOG — PLUTUS VISION (append-only)

Theatrical = an artifact whose FORM is verification standing in for verification.
Dispositions: SELF-CORRECTED (producer caught it) · OPERATOR-CAUGHT (survived to the operator — the
expensive class) · BLOCKED-OPEN.

## SUMMARY (2026-10-01): 7 entries — SELF-CORRECTED 4 · OPERATOR-CAUGHT 3 · BLOCKED-OPEN 0
## ROOT PATTERN: the agent looked at its own screenshots and probes without reading them against a
## written expectation. Countermeasure now in the standing loop: `scripts/vil.py` (written expectation,
## independent reader, planted-defect battery) + the engineer's named-delta read recorded in TESTING_LOG.

### T-01 — "fully working" over a double-mounted IDE (OPERATOR-CAUGHT)
- **Form:** the claim "IT'S FULLY WORKING NOW" with a screenshot attached.
- **Substance missing:** the same screenshot showed two editors and the prefill EMA ribbon (EN-009).
- **Evidence:** operator: "LOOK AT THE FUCKING IMAGES ... BROKEN DUPLICATE SLOP".
- **Disposition:** OPERATOR-CAUGHT → fixed; `DOUBLE_MOUNT` exit code in pv-load.

### T-02 — editorLen 83217 printed from the input, not the editor (SELF-CORRECTED)
- **Form:** a probe line `editorLen: 83217` "proving" the merged file was in the editor.
- **Substance missing:** `P.editor.getValue` is undefined; the probe fell back to `src.length` (EN-007).
- **Disposition:** SELF-CORRECTED when the run title came back "EMA Ribbon".

### T-03 — ViL reader "labels: YES" while every label printed a price (SELF-CORRECTED)
- **Form:** local Qwen3.5-4B reader verdict PASS, Q3 labels YES.
- **Substance missing:** labels rendered as `1.15`-style price pills (EN-014); the reader cannot distinguish a structure label from a price tag.
- **Disposition:** SELF-CORRECTED by the agent's own read; the bible's composition rule (reader = pipeline gate, engineer read = engineer gate) is now recorded per run.

### T-04 — "lost=44" parity numbers computed on None keys (SELF-CORRECTED)
- **Form:** `VERDICT: DELTA lost=44 extra=163` from `scripts/compare.py`.
- **Substance missing:** every key was `(type, None, None, None, None)` (EN-017).
- **Disposition:** SELF-CORRECTED — schema dumped, keys rewritten, numbers re-measured.

### T-05 — the merged file's header claimed "zero deltas vs sources" (SELF-CORRECTED)
- **Form:** `// BEHAVIOR: zero deltas vs sources modulo identifiers (I-4 proves in W4)` in the artifact.
- **Substance missing:** measured POOLS 0/25, SMC 190/195 (EN-011/013).
- **Disposition:** SELF-CORRECTED — header now states the measured parity per subsystem.

### T-06 — VIL ledger row orch=PASS on the double-mounted render (OPERATOR-CAUGHT)
- **Form:** `/home/leviathan/.plutus-dashboard/vil/2026-W29.jsonl` row `orch=PASS` (written via the DASHBOARD's rail :9444).
- **Substance missing:** the render it judged was the double-mounted IDE; reader verdict on the row was PENDING; the rail belonged to another session (EN-016).
- **Disposition:** OPERATOR-CAUGHT (F-02); fork now writes only to `<tree>/vil` via :9754.

### T-07 — 15m/30m called "rendering" while visually untuned (OPERATOR-CAUGHT)
- **Form:** VIL reader PASS on 15m/30m.
- **Substance missing:** VOIDS tan-striped blocks and label pile-ups (operator 30m image; EN-021).
- **Disposition:** OPERATOR-CAUGHT → recorded as engineer-read FAIL with named deltas; tuning wave open.

## COUNTERMEASURE CHECKLIST (applied before any "it works" in this project)

1. Write the expectation BEFORE the render (scripts/vil.py `EXPECT`; the engineer read lists elements found/missing/wrong).
2. The reader is independent: local Qwen VL via rail :9754, model id recorded in `vil/vil-results.json`.
3. Structure cross-check: the run's own `onChart` count must be > 0 for a PASS (reader over-fire guard).
4. Battery every run: planted-empty indicator must FAIL; black frame and truncated PNG must be INCONCLUSIVE.
5. Probes read the target object, never the input (`P.editor.getSource()`, never `src.length`).
6. After every kill, assert absence (`pgrep -fc ... == 0`); after every edit, assert the served file carries it (`curl ... | grep -c`).
7. Counts are not proof of meaning: a "labels: 24" status with price pills on screen is a FAIL.
8. The operator-caught count is the metric: 3 this session — the next pass targets 0.

## SUMMARY (2026-10-01, after the vision pass): 10 entries — SELF-CORRECTED 5 · OPERATOR-CAUGHT 5 · BLOCKED-OPEN 0
## ROOT PATTERN (the one mechanism under all ten): a verification artifact stood in for the verification —
## a gate line for a look, a harness for a test, a recording for an observation, a PASS line for a FAIL
## with deltas. COUNTERMEASURE NOW MECHANICAL: `computer-use action=look/verdict/claim` refuses each shape
## and the refusal is recorded (`~/.omp/agent/run/computer-use/runs.jsonl`).

### T-08 — The tool's contract was asserted before the tool was run (SELF-CORRECTED)
- **Form:** the extension header stated the rails existed and worked.
- **Substance missing:** it had never been executed; it contained a `require()` in ESM and two dispatch-order bugs.
- **Evidence:** ABIDE-R1 p=0.834 on `index.js`, p=0.881 on the test harness — the gate fired while the claim sat unwritten.
- **Disposition:** SELF-CORRECTED — `rail-test.mjs` + `rail-test2.mjs` run it live; 4 bugs found (EN-023..EN-026).

### T-09 — "PASS, but the labels overlap" was a valid PASS (SELF-CORRECTED)
- **Form:** `verdict=PASS wrong="CHoCH overlap"` recorded a clean green.
- **Substance missing:** the verdict's own detail line contradicted its summary line; the rail judged the circumstances, not the content.
- **Disposition:** SELF-CORRECTED — EN-026; `T3 PASS with deltas → ✓ VERDICT REFUSED`.

### T-10 — `grep computer-use` was treated as evidence of wiring (SELF-CORRECTED)
- **Form:** "3 skills already reference computer-use" reported to the operator.
- **Substance missing:** all three hits were `computer-use-virtual-display` (a different skill); **zero** skills invoked the tool's actions.
- **Disposition:** SELF-CORRECTED — F-40; re-audited with `action=verdict|action=expect|action=screenshot` and found 2 further unwired skills.

### T-11 — A grep hit was read as a wiring audit (SELF-CORRECTED)
- **Form:** the first skill audit reported 9 candidates and 3 wired.
- **Substance missing:** the audit grepped for the wrong string and never checked whether a skill invoked an ACTION. A wiring audit must grep for the mechanism's calls, not its name.
- **Disposition:** SELF-CORRECTED — the second pass grepped `action=verdict|action=expect|action=screenshot` and found 4 real files.

### T-12 — The escape hatches were free (SELF-CORRECTED)
- **Form:** `ack` cleared the unobserved count with no cost; `PASS` with deltas recorded cleanly; a completion claim could be typed by hand.
- **Substance missing:** every bypass was cheaper than the honest path, so the rail was optional in practice.
- **Disposition:** SELF-CORRECTED — EN-026, EN-027, `action=claim`. Verified `T3`–`T8`.

## COUNTERMEASURE ADDENDUM (2026-10-01)

The rail is a TOOL, not prose. The paths that were cheaper than the honest path are now refusals:

| path | before | now |
|---|---|---|
| cite a gate line | `VIL GATE: PASS` | the reader returns `TRIAGE_ONLY`; nothing to cite |
| judge without looking | allowed | `verdict` REFUSED, `unobserved > 0` |
| no written ruler | allowed | `verdict` REFUSED, no expectation |
| "PASS, but …" | allowed | REFUSED unless `force=1`, logged as an override |
| claim without a look | allowed | `ack` REFUSED without `note=` |
| hand-typed completion | allowed | `claim` REFUSES with zero verdicts; its output carries every sha256 |
| bypass via bash entirely | invisible | `report` prints the **look-ratio** (frames ÷ interactions); the ledger's absence is the tell |

### T-13 — "No D timeframe" reported without opening the menu (SELF-CORRECTED)
- **Form:** FAILURE_LOG F-18 stated the daily timeframe could not be selected.
- **Substance missing:** the selector offers `1m 5m 15m 30m 1h 4h 1D 1W`. The control exists; the fixture has no daily bars. The claim was reasoned from data, never from the UI.
- **Disposition:** SELF-CORRECTED — found while reading the open menu during the sweep; F-44 supersedes F-18's wording.

### T-14 — A copy of a source-of-truth file was treated as the file (SELF-CORRECTED)
- **Form:** "the merged indicator renders, parity 195/195" while the IDE served `d7e00609` and the file under test is `605bff82`.
- **Substance missing:** three layers of drift (stale copy → browser cache → port held by a dead server). Every automated check passed on the wrong binary.
- **Disposition:** SELF-CORRECTED — EN-028. **This is the strongest evidence the direct-look method works:** the defect was found by reading the editor's text against the source file. No parity script, no VLM gate, no crash test found it, because all of them consume the same served copy.

## COUNTERMEASURE ADDENDUM 2 (2026-10-01)

- `pine-ide/ide/renderer/plutus-vision-v0.pine` is a **symlink**, never a copy.
- `pv-server.py` sends `no-store, no-cache, must-revalidate` for everything except images/fonts.
- `scripts/verify_served_pine.sh` compares source / renderer / over-the-wire shas → `SERVED_PINE_DRIFT`.
- `computer-use` persists its session so a multi-invocation sweep does not lose the written expectation.

### T-15 — A feature was declared WORKING that the operator had to break (OPERATOR-CAUGHT)
- **Form:** EN-014 declared the interaction lock "PARTIAL PRODUCT" and the inputs panel "PARTIAL PRODUCT — mechanic proven, appearance unobserved", while BUILD_REPORT listed the settings panel under "built".
- **Substance missing:** (a) the lock was enforced on one path of four, so delete still worked — the operator found it; (b) the panel's labels were raw variable names — the operator screenshotted it.
- **Disposition:** OPERATOR-CAUGHT (F-46). Both closed at the root: the lock at `remove()`, the panel via `inline=` + section markers. **A UI feature is not "working" because its mechanism ran — it is working when it renders correctly and resists the user.**
