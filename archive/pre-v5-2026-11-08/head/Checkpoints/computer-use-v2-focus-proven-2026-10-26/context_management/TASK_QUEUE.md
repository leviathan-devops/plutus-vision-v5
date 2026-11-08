# TASK QUEUE — PLUTUS VISION
**As of 2026-10-22** · overwrite semantics · every task, its gate, its status

---

## STATUS LEGEND

```
DONE        the gate landed and its evidence is on disk
NEXT        the immediate work; its gate is specified
QUEUED      specified, blocked on a dependency
BLOCKED     blocked on an OPERATOR input (named)
OPEN-DEC    blocked on an operator RULING (named)
```

---

## THE DESIGN LAYER — DONE

```
DONE   the 163-card knowledge graph, diagnostics 0, 163/163 anchors
DONE   design/DESIGN_BLUEPRINT_v1.0_AS_DESIGNED.md         449 L  (the design of record)
DONE   design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md       857 L  (WHAT the machine is)
DONE   design/BUILD_WORKFLOW_v2.md                       2,916 L  (HOW it gets built)
DONE   gates/anti/anti_patterns.py                          13 checks, rc=1 on the baseline
DONE   managed-skills/design-blueprint/SKILL.md            193 L  (the method, extracted)
DONE   the v1 seal's reproducibility PROVEN (generator → sha 0d20e831…)
DONE   the trade library measured (15 WT + 26 OBS + 2 TP; 14 found by eye; 2-3 per week)
DONE   the operator rulings R-01 … R-11 recorded verbatim
```

---

## THE BUILD — 42 turns, all QUEUED

```
┌────────┬────────────────────────────────────────────────────────────┬──────────┬─────────────┐
│ TURN   │ WHAT                                                       │ GATE     │ STATUS      │
├────────┼────────────────────────────────────────────────────────────┼──────────┼─────────────┤
│ W0.T1  │ worktree + display; prove it is NOT the operator's          │ W0.T1    │ NEXT        │
│ W0.T2  │ the 30 gate stubs + 30 corruption fixtures                  │ W0.T2    │ NEXT        │
│ W0.T3  │ the vision/rig/compare helpers vs controls                  │ W0.T3    │ NEXT        │
│ W0.T4  │ the oracle harness (30 rows) + the audit table              │ W0.T4    │ NEXT        │
├────────┼────────────────────────────────────────────────────────────┼──────────┼─────────────┤
│ W1.T1  │ measure the trash (9/7/4/8 + the seal sha)                  │ W1.T1    │ QUEUED      │
│ W1.T2  │ remove the 9 labels                                         │ W1.T2    │ QUEUED      │
│ W1.T3  │ remove 7 lines + 8 inputs; detection intact                 │ W1.T3    │ QUEUED      │
│ W1.T4  │ regenerate; the LQZ block byte-identical                    │ W1.T4    │ QUEUED      │
│ W1.T5  │ THE PIXEL GATE — before/after, bands identical              │ W1.T5    │ QUEUED      │
├────────┼────────────────────────────────────────────────────────────┼──────────┼─────────────┤
│ W2.T1  │ card.pine: UDTs + field + the three-behaviour parser        │ W2.T1    │ QUEUED      │
│ W2.T2  │ wire into the generator, before the renderers               │ W2.T2    │ QUEUED      │
│ W2.T3  │ the ABSENT / PARSE-FAILED tokens on the chart               │ W2.T3    │ QUEUED      │
│ W2.T4  │ THE PIXEL GATE — a pasted card renders                      │ W2.T4    │ QUEUED      │
├────────┼────────────────────────────────────────────────────────────┼──────────┼─────────────┤
│ W3.T1  │ harvest base + 4H (500 bars, no leakage)                    │ W3.T1    │ QUEUED      │
│ W3.T2  │ 1H + 30m + DXY on one loader; no 15m                        │ W3.T2    │ QUEUED      │
│ W3.T3  │ Protocol A → walls · the BILLIONS law · range check         │ W3.T3    │ BLOCKED (2) │
│ W3.T4  │ E1 face A: 9 pillars · /12 confluence · 5 roles            │ W3.T4    │ QUEUED      │
│ W3.T5  │ ZFP with a recomputable receipt; strength only              │ W3.T5    │ QUEUED      │
│ W3.T6  │ the card emitter                                            │ W3.T6    │ QUEUED      │
│ W3.T7  │ the card round-trips through Pine                           │ W3.T7    │ QUEUED      │
│ W3.T8  │ the pipeline end to end                                     │ W3.T8    │ QUEUED      │
├────────┼────────────────────────────────────────────────────────────┼──────────┼─────────────┤
│ W4.T1  │ the four verdicts                                           │ W4.T1    │ QUEUED      │
│ W4.T2  │ ancestry that NAMES the missing id                          │ W4.T2    │ QUEUED      │
│ W4.T3  │ three refusal tokens                                        │ W4.T3    │ QUEUED      │
│ W4.T4  │ READY_FALSE — table yes, chart no                           │ W4.T4    │ QUEUED      │
│ W4.T5  │ THE PIXEL GATE — a broken node fails locally                │ W4.T5    │ QUEUED      │
├────────┼────────────────────────────────────────────────────────────┼──────────┼─────────────┤
│ W5.T1  │ face-B survives purge + card                                │ W5.T1    │ QUEUED      │
│ W5.T2  │ E2 boxes, xloc.bar_time                                     │ W5.T2    │ QUEUED      │
│ W5.T3  │ E2 line; ratio ≥0.900 FROM THE CAPTURE                      │ W5.T3    │ QUEUED      │
│ W5.T4  │ E3: two-branch stop, one TP, 2.5 hard floor                 │ W5.T4    │ QUEUED      │
│ W5.T5  │ the confidence gate + eviction                              │ W5.T5    │ QUEUED      │
│ W5.T6  │ the six-layer drawing order                                 │ W5.T6    │ QUEUED      │
│ W5.T7  │ THE PIXEL GATE — the whole analysis                         │ W5.T7    │ BLOCKED (3) │
├────────┼────────────────────────────────────────────────────────────┼──────────┼─────────────┤
│ W6.T1  │ the freeze                                                  │ W6.T1    │ QUEUED      │
│ W6.T2  │ ten held-out weeks, rendered AND opened                     │ W6.T2    │ BLOCKED (1) │
│ W6.T3  │ THE ANTI-HARDCODE GATE — the geometry varies                │ W6.T3    │ QUEUED      │
│ W6.T4  │ THE BLIND AGENT                                             │ W6.T4    │ QUEUED      │
│ W6.T5  │ the honest verdict + the ledger                             │ W6.T5    │ QUEUED      │
├────────┼────────────────────────────────────────────────────────────┼──────────┼─────────────┤
│ W7.T1  │ the control surface (card / render / cast)                  │ W7.T1    │ QUEUED      │
│ W7.T2  │ the tab, self-contained                                     │ W7.T2    │ QUEUED      │
│ W7.T3  │ THE PIXEL PARITY GATE — B == A                              │ W7.T3    │ QUEUED      │
│ W7.T4  │ the delivery swap documented                                │ W7.T4    │ QUEUED      │
└────────┴────────────────────────────────────────────────────────────┴──────────┴─────────────┘
```

---

## THE THREE OPERATOR BLOCKERS

```
(1)  the ten held-out weeks          → .trident/goals/w6.md     blocks W6.T2
(2)  the Protocol A source           → sidecar/config.yml       blocks W3.T3 onward
(3)  the golden week, written down   → .trident/goals/w5.md     blocks W5.T7
```

**W0 — the immediate work — is blocked by NONE of them.**

---

## OPEN DECISIONS (the operator's rulings, still owed)

```
OPEN-DEC   the 6-vs-7 confluence floor — 6 is the enforceable admissibility floor per the E1 ruling;
           the 7 in Engine Integration Phase 1 is the stricter candidate-generation filter.
           Both readings are in the graph; the operator has not formally ruled which governs.
OPEN-DEC   the 6-shapes-vs-10 taxonomy — the TTE doc names six; the corrected taxonomy has ten.
           The graph carries all ten as pv-shape cards; the ruling is recorded SUPERSEDED.
OPEN-DEC   the SL offset ladder — seven statements (1 / 1-2 / 2 / 2.5-3 / 1.5-for-5m-scalp /
           half-pip-inside-next-zone / 1.5-2.5-inside-next-5m), resolved as an invariant
           (outside the zone) plus a tunable ladder with a 1-pip minimum.
```

**None of the three blocks a turn.** They refine constants; they do not gate structure.

---

## THE IMPROVEMENT BACKLOG (not blocking, worth doing)

```
· lateral cross-links — 155 of 163 cards are reachable only from their hub
· an E2-CANNOT-DO card (E1 has one; E2's limits are spread across five cards)
· trigger + probability on the five variant shape transitions (the base 14 edges have both)
· the seven planted contradictions in the graph: four RESOLVED by the operator's rulings,
  three remain (above)
· the Closed Positions history — the only source of a real per-week trade RATE
```

---

## THE PER-TURN CONTRACTS — what each gate actually measures

The table above is the INDEX. This is the CONTRACT, turn by turn. **The authority is
`design/BUILD_WORKFLOW_v2.md:900` (§5); this section is the extract a builder works from.**

### W0 · THE HARNESS

```
TURN    DELIVERABLE                    THE CORRUPTED SUBJECT IT MUST REFUSE          DONE-WHEN
W0.T1   the worktree + the display     a capture taken from :0 — the gate must      a frame exists whose
        proof of isolation            refuse it as "not the agent's display"        geometry differs from :0
W0.T2   the 30 gate stubs              EVERY gate gets its own corrupted subject    30/30 refuse; 30/30 pass clean
W0.T3   vision/rig/compare helpers     a control image against itself (delta 0)     a known-different pair reports >0
W0.T4   the oracle harness             an empty oracle table                        the harness refuses to emit PASS
```

**Why W0.T2 is the whole wave:** `gates/anti/anti_patterns.py:1` is the only gate that exists today,
and it was itself proven by reverting each of its 13 checks and watching it go red. Any new gate
inherits that standard or it is a sentence.

### W1 · THE PURGE — the four box calls survive

```
TURN    DELIVERABLE                    CORRUPTED SUBJECT                             DONE-WHEN
W1.T1   the measurements                a claimed count that disagrees with grep     the table matches grep exactly
W1.T2   the 9 labels removed            one label left behind                        grep finds zero label.new
W1.T3   lines + inputs removed          a removed input still referenced             pine compiles
W1.T4   the regeneration                a hand edit to the GENERATED file            the seal sha is unchanged
W1.T5   the pixel comparison            a capture of the WRONG week                  bands differ → gate fires
```

**THE INVARIANT ACROSS ALL FIVE:** `box.new == 4`. The four box draws are the supply/demand detection
and they are the product. Any turn that changes the count is a regression regardless of its other merits.

### W2 · THE CARD — three behaviours, three proofs

```
TURN    DELIVERABLE                    CORRUPTED SUBJECT                             DONE-WHEN
W2.T1   card.pine                      a card with an unknown kind                   parser refuses, names the kind
W2.T2   the generator wiring            card.pine ordered AFTER the renderers         zones still render
W2.T3   the two tokens                  a card truncated mid-JSON                     PARSE FAILED, no partial
W2.T4   the pixel gate                  a card whose price is off-scale               no zone drawn, token printed
```

### W3 · THE SIDECAR — one command, ten stages

```
TURN    DELIVERABLE                    CORRUPTED SUBJECT                             DONE-WHEN
W3.T1   harvest base + 4H               one bar from the target week                  the loader refuses
W3.T2   1H + 30m + DXY                  a 15m frame in the bundle                     the emitter refuses
W3.T3   the walls                       a strike below BILLIONS                      the wall is dropped, logged
W3.T4   E1 face A                       a pillar datum absent                         marked ABSENT, not zeroed
W3.T5   ZFP + receipt                   a receipt that does not recompute             zfp_suppressed, not emitted
W3.T6   the emitter                     two nodes with the same id                    the emitter refuses
W3.T7   the round trip                  a card the Pine parser rejects                the emitter's own gate fires
W3.T8   the pipeline                      a missing stage in config                    named failure, no partial card
```

### W4 · THE CAST — four verdicts, never a boolean

```
TURN    DELIVERABLE                    CORRUPTED SUBJECT                             DONE-WHEN
W4.T1   the four verdicts               a node with no receipt                        INCONCLUSIVE, not FAIL
W4.T2   the ancestry                   a node whose parent is absent                 the missing id is NAMED
W4.T3   the three tokens               each malformed card class                     each token fires
W4.T4   READY_FALSE                     a 67-confidence setup                         table yes, chart no
W4.T5   the pixel gate                  a broken entry_zone                           that node alone vanishes
```

### W5 · THE RENDER — the number this wave exists for

```
TURN    DELIVERABLE                    CORRUPTED SUBJECT                             DONE-WHEN
W5.T1   face B + the merge             the card's zones over the inherited zones     no double-draw
W5.T2   E2 phase 1 (the boxes)         a bar_index anchor on a shifted chart          boxes on the wrong bars
W5.T3   E2 phase 2 (the line)          a line drawn only to the box's near edge       ratio < 0.900 → fires
W5.T4   E3                             a stop on BOTH branches at once               the branches are exclusive
W5.T5   the gate + eviction            four setups, one at 66, three at 95           the 66 is evicted
W5.T6   the layer order                 two layers swapped                            the render order gate fires
W5.T7   the whole analysis              the golden week drawn from memory             the capture disagrees
```

**THE MEASURED PRIOR:** the rejected line scored a column-coincidence ratio of **0.18**. The bar is
**0.900**, measured from the capture — see `design/BUILD_WORKFLOW_v2.md:2100` (§9) for the
measurement procedure, which counts columns where the line and the price path both have ink.

### W6 · THE VERIFIER — code frozen, ten unseen weeks

```
TURN    DELIVERABLE                    CORRUPTED SUBJECT                             DONE-WHEN
W6.T1   the freeze                      an edit to a frozen file                      the sha changes → fires
W6.T2   ten held-out weeks              one week rendered without being opened        the marker mtime is before the png
W6.T3   the anti-hardcode gate          identical geometry on two different weeks     the gate fires
W6.T4   the blind agent                 a card built from the answer key              the grader flags it
W6.T5   the verdict                      a PASS with an unopened capture               the ledger refuses
```

**W6.T3's logic:** if the geometry is identical across ten different weeks, the code is not analysing
the market — it is drawing a constant, or it is fitted to the fixture. The gate compares the emitted
node sets and requires them to differ.

**W6.T4's logic:** one week of BARS and the graph, no task prompt beyond "build the card for this
week", then a graded comparison against the authoritative card. If the agent cannot, **the graph is
the finding** — it is not a prompt to retune the tolerance.

### W7 · THE DASHBOARD — the card is the fixed point

```
TURN    DELIVERABLE                    CORRUPTED SUBJECT                             DONE-WHEN
W7.T1   the control surface              a week key that does not exist                named 404, no empty card
W7.T2   the tab                          the tab mounting twice                        the canvas is one
W7.T3   the parity                        a B capture from a different week             the delta is non-zero → fires
W7.T4   the swap                           a card edited only in the dashboard           the paste still works
```

---

## THE DEPENDENCY GRAPH

```
W0 ──────────────────────────────────────────────────────────► every wave (the harness)
 └─ W1 ─┐
    W2 ─┼─► W5 ─► W6
    W4 ─┘        └─► W7 (Option B, after W5)
    W3 ──────────────────► (feeds W2's fixture cards; independent of W1/W4)
```

**THE CRITICAL PATH: W0 → W1 → W2 → W5 → W6.** Everything else is parallel or downstream.

**THE DISJOINT-FILE RULE that makes the parallel waves safe** (`design/BUILD_WORKFLOW_v2.md:200` §1):
each worker owns a disjoint file set and a dedicated worktree. W1 owns `plutus-vision-v0.pine`;
W2 owns `plutus-vision-lqz/card.pine` and the generator; W3 owns `sidecar/`; W4 owns the cast module.
**No two workers ever write the same file** — which is why W1 and W2 can run concurrently and why W5
must wait for both.

---

## THE GATE → EVIDENCE MAP

Every gate writes one row. The row is the only thing a reviewer trusts.

```
gate id      what the row carries                                    where it lands
W0.T2        30 gate names, 30 refusals, 30 clean passes             EVIDENCE_STATE.md
W1.T5        2 capture shas, the band-delta count, the label count   EVIDENCE_STATE.md
W2.T4        the card JSON, the zone count, the capture sha          EVIDENCE_STATE.md
W3.T8        the card sha, the stage count, the round-trip result    EVIDENCE_STATE.md
W4.T5        the failing node id, the capture sha, the survivors     EVIDENCE_STATE.md
W5.T7        the golden week, the capture sha, the ratio             EVIDENCE_STATE.md
W6.T2/T3     10 week shas, the geometry variance, the marker mtimes  EVIDENCE_STATE.md
W6.T4        the blind agent's card, the graded delta, the verdict   EVIDENCE_STATE.md
W7.T3        the A capture sha, the B capture sha, the delta          EVIDENCE_STATE.md
```

**A gate with no row did not run.** `design/BUILD_WORKFLOW_v2.md:2100` (§9) makes the row the
deliverable: the capture is evidence only once it has been OPENED, and the row records that it was.

---

## THE THINGS A BUILDER MUST NEVER DO (the 13 gates, in prose)

`gates/anti/anti_patterns.py:1` encodes these mechanically; the prose is here so a builder can
recognise the temptation before the gate fires.

**THE GATE'S INVOCATION (getting this wrong produces a false green):**

```
python3 gates/anti/anti_patterns.py <root> pine=<f> card=<f> tree=<dir> proofs=<d> report=<f>
   → rc 0 PASS (live checks only)  ·  rc 1 FAIL  ·  rc 2 INCONCLUSIVE (zero subjects)
```

`sinks: `SKIP` means the gate could not look. `live == 0 → INCONCLUSIVE rc=2`, never PASS.
Measured baseline: **rc=1, 4 classes** — A3 · A9 (27 build files) · A10 · A12 (5.9).

```
 1  never edit the GENERATED plutus-vision-v1.pine — the generator erases it
 2  never edit the LQZ block — it is the product and it is byte-stable
 3  never emit a zone without a receipt
 4  never print a wall or a price as a supply zone
 5  never let a label define a visual boundary
 6  never count a box as eleven
 7  never draw a line merely because a box exists
 8  never let the ABSENT case render silently
 9  never speak a market-standard term the canon does not use
10  never let the object set default to the union of every variable
11  never anchor with bar_index — use xloc.bar_time
12  never claim a verification with a capture that was not opened
13  never report a BLOCKED gate as green
```
