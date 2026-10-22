# NEXT STEPS — PLUTUS VISION
**As of 2026-10-22** · overwrite semantics · the queued work, in execution order

---

## THE SEQUENCE — seven waves, each gated, none skippable

```
   W0  the rig + the gate harness        ── nothing starts until W0.T2 is green
   W1  the purge (labels out)            ─┐ parallel, disjoint scopes
   W2  the card field                    ─┘
   W3  the sidecar (9 turns)             ─┐ parallel, disjoint scopes
   W4  the cast layer                     ─┘
   W5  the render (E2 boxes → line → E3)  ── depends on W1+W2+W4
   W6  freeze + ten weeks + blind agent   ── READ-ONLY, on the merged state
   W7  the dashboard tab (Option B)       ── depends on W5
```

**The authority for every turn is `design/BUILD_WORKFLOW_v2.md:900`** (the turns). This doc is the
INDEX; the workflow is the CONTRACT.

---

## W0 · THE RIG AND THE GATE HARNESS — 4 turns

**Done-when:** `gates/W0.T2.sh` exits 0 — meaning all 30 gates exist, each refuses its corrupted
subject, and each passes its clean subject.

```
W0.T1   worktree + display + proof the display is NOT :0/:1/:2      gate W0.T1
W0.T2   the 30 gate stubs + the 30 corruption fixtures               gate W0.T2
W0.T3   the vision/rig/compare helpers, validated against controls   gate W0.T3
W0.T4   the oracle harness (30 rows) + the executable audit table    gate W0.T4
```

**Why W0 gates everything:** `design/BUILD_WORKFLOW_v2.md:2050` (§6) specifies a corrupted subject for
every gate. A gate that has never been watched failing is a sentence, not a gate.

**BLOCKER: none.** W0 can start immediately.

---

## W1 · THE PURGE — 5 turns

**Done-when:** the labels are gone, the box draws survive, and the LQZ block is byte-identical —
proven on TWO OPENED CAPTURES with zero moved bands.

```
W1.T1   measure the trash (9 labels · 7 lines · 4 boxes · 8 inputs · the seal sha)   gate W1.T1
W1.T2   remove the 9 labels                                                          gate W1.T2
W1.T3   remove the 7 structure lines + the 8 inputs; detection intact                gate W1.T3
W1.T4   regenerate; the LQZ block byte-identical                                     gate W1.T4
W1.T5   THE PIXEL GATE — before/after captures, bands identical, labels gone          gate W1.T5
```

**THE SCOPE:** `plutus-vision-v0.pine` ONLY. The generated `plutus-vision-v1.pine` is NEVER edited
(its own line 3 says so; the generator erases it).

**THE MEASURE OF CORRECTNESS:** `box.new == 4` after every turn, and every variable the four box
calls read must still declare.

---

## W2 · THE CARD FIELD — 4 turns

**Done-when:** a hand-written three-zone card pasted into the REAL indicator field renders exactly
three IP bands at the card's prices, driven with real input, captured and read.

```
W2.T1   card.pine: the UDTs + the one input field + the three-behaviour parser          gate W2.T1
W2.T2   wire card.pine into the generator, ordered BEFORE the renderers                gate W2.T2
W2.T3   the ABSENT and PARSE-FAILED tokens, proven on the chart                        gate W2.T3
W2.T4   THE PIXEL GATE — a pasted card renders its zones                               gate W2.T4
```

**THE MECHANIC (the operator's own recollection):** TradingView → the indicator → settings → ONE field
labelled "Week Card" → paste → the chart re-renders. **No code is ever updated.**

**THE THREE BEHAVIOURS, each proven:** empty → `CARD: ABSENT` + no IP zone · truncated →
`CARD: PARSE FAILED` + no partial render · valid → N zones.

---

## W3 · THE SIDECAR — 8 turns, built from scratch

**Done-when:** one command emits a card that passes A2/A4/A5/A6/A7, and that card renders through
the Pine parser with the same zone count.

```
W3.T1   the harvest base + 4H (500 bars, zero target-week leakage)                     gate W3.T1
W3.T2   1H (2000) + 30m (1000) + DXY on the SAME loader; no 15m                        gate W3.T2
W3.T3   Protocol A → walls, the BILLIONS law, the range check                          gate W3.T3
W3.T4   E1 face A: nine pillars · confluence /12 (+2 bonus) · the 5 roles BY POSITION  gate W3.T4
W3.T5   ZFP with a receipt that RECOMPUTES; strength only, never width                 gate W3.T5
W3.T6   the card emitter (nodes · kinds · edges · suppressed)                          gate W3.T6
W3.T7   the card round-trips through the Pine parser                                   gate W3.T7
W3.T8   the pipeline end to end: one command, ten stages, one card                     gate W3.T8
```

**BLOCKER: the Protocol A source.** The operator supplies it into `sidecar/config.yml` as a named key.
W3.T1-T2 and the whole of W0-W2 are unaffected.

---

## W4 · THE CAST LAYER — 5 turns

**Done-when:** a card with one broken `entry_zone` renders NOTHING for that node, names the missing id
on the chart, and leaves every other node intact.

```
W4.T1   the four verdicts: PASS / FAIL / INCONCLUSIVE / READY_FALSE                    gate W4.T1
W4.T2   ancestry that NAMES the missing id                                             gate W4.T2
W4.T3   the three refusal tokens, each on its own malformed card                       gate W4.T3
W4.T4   READY_FALSE — the calibration tier in the table, absent from the chart         gate W4.T4
W4.T5   THE PIXEL GATE — a broken node fails locally and says why                      gate W4.T5
```

**WHY FOUR VERDICTS AND NOT A BOOLEAN:** a zone with no receipt is INCONCLUSIVE, not false. A boolean
collapses "I cannot tell" into "it failed", and the operator's whole standard is that a blocked
verification is reported as blocked, never as passed.

---

## W5 · THE RENDER — 7 turns

**Done-when:** the whole E1/E2/E3 analysis is on one chart, opened and read against a written
expectation, with the line's ratio ≥ 0.900 measured FROM THE CAPTURE.

```
W5.T1   the inherited face-B render survives the purge + the card merge                gate W5.T1
W5.T2   E2 phase 1 — boxes anchored with xloc.bar_time, never bar_index                gate W5.T2
W5.T3   E2 phase 2 — the line; the ratio measured off the png                          gate W5.T3
W5.T4   E3 — entry, the TWO-BRANCH stop, one TP, the 2.5 hard floor                    gate W5.T4
W5.T5   the confidence gate (six terms, ≥65) + eviction by confidence                  gate W5.T5
W5.T6   the six-layer drawing order, enforced by the generator                         gate W5.T6
W5.T7   THE PIXEL GATE — the whole analysis on one chart                               gate W5.T7
```

**THE NUMBER THIS WAVE EXISTS FOR: the rejected prior line measured a column-coincidence ratio of
0.18.** The bar is 0.900, and it is measured from the pixels, never asserted.

**BLOCKER: the golden week** must be written into `.trident/goals/w5.md` before W5.T7 runs.

---

## W6 · THE VERIFIER — 5 turns, code READ-ONLY

**Done-when:** ten unseen weeks render with the code frozen, the geometry VARIES across them, and a
blind agent's card matches the authoritative week within tolerance.

```
W6.T1   the freeze: every source sha + the tree_sha; source read-only                  gate W6.T1
W6.T2   ten held-out weeks rendered AND OPENED (a marker whose mtime is AFTER its png)  gate W6.T2
W6.T3   THE ANTI-HARDCODE GATE — the geometry must VARY                                gate W6.T3
W6.T4   THE BLIND AGENT — one week of bars, no context, graded against the authoritative card  gate W6.T4
W6.T5   the honest verdict + the ledger                                                gate W6.T5
```

**BLOCKER: the ten held-out weeks.** The operator names them AFTER the build freezes. If W6.T4 fails,
**the graph is the finding** — never retune the tolerance.

---

## W7 · OPTION B — 4 turns

**Done-when:** the dashboard tab renders the same week pixel-identically to the paste.

```
W7.T1   the control surface: GET /card · GET /render · POST /cast                     gate W7.T1
W7.T2   the tab, following backtest.js's stated contract                              gate W7.T2
W7.T3   THE PIXEL PARITY GATE — B == A                                                gate W7.T3
W7.T4   the delivery swap documented; the card unchanged                              gate W7.T4
```

**WHY B IS PHASE 2:** A proves the card's contract with the smallest surface (one paste a week). B then
replaces the paste with an HTTP read — **and the card never changes.** The card is the fixed point.

---

## THE IMMEDIATE MOVE

```
1  read design/BUILD_WORKFLOW_v2.md §0 (the laws) and §1 (the worker plan)      ~10 min
2  create wt/w0-rig on branch build/w0-rig
3  export PINE_AGENT_ID=w0-rig; boot the rig; capture and OPEN the frame
4  W0.T1's gate — prove the display is not the operator's
```

**Nothing else happens until W0.T2 is green: 30 gates, 30 corrupted subjects, 30 refusals.**

---

## THE THREE OPERATOR INPUTS STILL OWED

```
1  the ten held-out weeks            → .trident/goals/w6.md      blocks W6.T2 only
2  the Protocol A source             → sidecar/config.yml        blocks W3.T3 onward
3  the golden week, written down     → .trident/goals/w5.md      blocks W5.T7 only
```

---

## THE RETRY AND ESCALATION CONTRACT (what happens when a gate goes red)

Every turn follows the same disposition, and no turn may improvise a different one:

```
1  RUN THE TURN            the change, then its gate
2  GATE GREEN              append the receipt to EVIDENCE_STATE.md, advance
3  GATE RED, cause CLEAR   fix it and re-run THE SAME GATE. A re-run that measures
                           a DIFFERENT property is not a re-run.
4  GATE RED, cause UNCLEAR run the three instruments before touching code:
                             · measure the actual value, not the expected one
                             · validate the INSTRUMENT with a known-positive control
                             · read the mechanism's own stated execution model
                               (design/BUILD_WORKFLOW_v2.md:2050 says why)
5  THREE REDS, same gate   STOP. Do not raise the tolerance, do not soften the gate,
                           do not reinterpret the requirement. Log the three attempts
                           with their measurements and escalate to the operator.
6  A BLOCKED GATE          report it BLOCKED with the missing input named — never
                           relabel it green, never mark the turn done.
```

**The anti-pattern this contract kills:** retuning a threshold until the red becomes green. The
measurement is the finding; changing the ruler does not change the object.

**The second anti-pattern it kills:** declaring a turn done because its FILE exists. Every turn's
done-when names an OBSERVATION — a capture that was opened, a gate that refused, a ratio measured
off pixels — never an artefact's presence. See `design/BUILD_WORKFLOW_v2.md:2100` (§9, the vision
contract) and `gates/anti/anti_patterns.py:1` (the executable form of the rule).

**The third:** a gate that passes on its first-ever run. `design/BUILD_WORKFLOW_v2.md:2050` (§6)
requires every gate to be fed a CORRUPTED subject and watched refusing it — a gate whose failure
path has never been exercised is unproven, and W0.T2 exists precisely to exercise all 30 of them
before a single feature turn runs.
