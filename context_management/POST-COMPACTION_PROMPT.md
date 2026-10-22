# POST-COMPACTION PROMPT — PLUTUS VISION
**As of 2026-10-22** · overwrite semantics · the canonical resume prompt

---

## 1 · WHAT THIS FILE IS

This is the prompt a fresh session receives after a compaction. It mandates a **full deep absorption**
before any action, and it names the exact files and the exact order. It is not a summary — it is a
LOAD ORDER, because a summary is what the compaction already destroyed.

**The failure it prevents:** a fresh session reading `CURRENT_STATE.md`, skimming two cards, and
starting to write Pine. That session will break the LQZ block, miscount the boxes, and speak a
vocabulary the canon does not use.

---

## 2 · THE PROMPT (paste this verbatim)

---

```
PLUTUS VISION — RESUME AND EXECUTE THE BUILD.

You are resuming a build whose design layer is COMPLETE and whose execution layer is at ZERO.
Before any action, absorb the whole context. Do not skim. Do not summarise. READ.

PROJECT ROOT
  /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION

════════ STEP 1 — ABSORB THE STATE (read, do not act) ════════

Read these IN ORDER, fully:

  1. context_management/CURRENT_STATE.md
        what exists NOW; the artefacts; the honest gaps
  2. context_management/NEXT_STEPS.md
        the wave order; the retry/escalation contract
  3. context_management/TASK_QUEUE.md
        all 42 turns; the per-turn contracts; the gate→evidence map
  4. context_management/BUILD_STATE.md
        the seal's sha; the six modules; the artefact chain; the carried defects
  5. MASTER_CONTEXT/OPERATOR_RULINGS_PV.md
        R-01 … R-11, THE OPERATOR'S OWN WORDS. These are not negotiable.

════════ STEP 2 — ABSORB THE TWO AUTHORITY DOCUMENTS ════════

  6. design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md   (857 L — READ IT WHOLE)
        §0  the constraint: PINE CANNOT FETCH — the one law everything follows from
        §1  the stack: the five planes
        §4  L0 the data plane: bars, the loader, the leakage rule
        §5  L1 the compute plane: the sidecar, built from scratch
        §6  L2 the card: a JESL document, the payload, the three behaviours
        §7  L3 the Pine kernel: the standalone engine, the drawing order
        §8  the delivery: Option A (a paste) now, Option B (the dashboard) as phase 2
        §9  L4 the verify plane: the four verdicts
        §11 the anti-patterns, wired into the build
        §12 the build sequence and what it inherits from the baseline

  7. design/BUILD_WORKFLOW_v2.md   (2,916 L — READ §0, §1, §4, §5 WHOLE)
        §0  the seven laws: display, verdict, turn, forbidden, isolation, anti-cheat, substitution
        §1  the worker plan: 7 workers, the eight columns, the dependency graph, the pinned todos
        §2  the 30-row oracle table
        §3  the rig: three surfaces, one law
        §4  the turn shape: P0 / A / E / R / G / C, and the authorized action set
        §5  THE TURNS: W0 … W7, every turn with its gate and its capture protocol

════════ STEP 3 — ABSORB THE GRAPH (the canon) ════════

Read these cards, in this order — they are the canon the build must speak:

  cards/FRAC-THREE-ENGINES.md              E1 → E2 → E3, one direction
  cards/E1-NINE-PILLARS.md                 the nine confluence dimensions
  cards/E1-CONFLUENCE-SCORE.md             the /12 base + the capped +2 bonus
  cards/E1-ZFP-BASE.md                     the six zone classes and their base failure probabilities
  cards/E1-ZFP-DUAL-DEFINITION-RULING.md   ZFP is STRENGTH, never width
  cards/E1-ZFP-RECEIPT.md                  the receipt is MANDATORY; no receipt, no render
  cards/E2-CLASSIFICATION-MATRIX.md        the cascade — FIRST MATCH STOPS (not a lookup table)
  cards/E2-TWO-PHASES.md                   the BOXES, then the LINE
  cards/MECH-SWEEP-VS-CLOSE-THROUGH.md     the two mitigation outcomes
  cards/SHAPE-SS.md … SHAPE-PRWL.md        the ten shapes, each with its candle anatomy
  cards/E3-CONTRACT.md                     the mandatory setup field set
  cards/E3-RRR-RULING.md                   the 2.5 hard floor vs the 3.0 gauge
  cards/E3-SL-RULE.md                      BOTH branches, context-driven
  cards/E3-TP-RULING.md                    ONE TP, no partials
  cards/E3-CONFIDENCE-RULING.md            gate 65 · GOD_TIER ≥90 · CONDITIONAL DELETED
  cards/LAW-TRADE-COUNT-CAP.md             eviction, never rejection
  cards/MECH-ROCKETS-VS-TRADES.md          rockets are reinforcement, NEVER trades
  cards/REF-CHART-ANNOTATION-GRAMMAR.md    red=SL, green=TP, shared edge=ENTRY
  cards/REF-WTL-WEEK-ANATOMY.md            the two panels per page
  cards/REF-VLM-TRADE-CORPUS.md            43 entries; 4 carry fabricated levels

Then read, for the honest record:
  forensic/BLIND_COMPREHENSION_AUDIT.md     what the graph does and does not support
  forensic/INSTRUMENT_FAILURES.md           the four detectors that returned false answers

════════ STEP 4 — VERIFY THE BASELINE BEFORE TRUSTING IT ════════

Run this and require the EXACT sha:

  cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
  python3 scripts/lqz_vision_build.py
  sha256sum plutus-vision-v1.pine
  # MUST BE: 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1

If it does not match, the tree has drifted. STOP and report — do not build on a fiction.

Then run the existing gate and read its failures:

  python3 gates/anti/anti_patterns.py plutus-vision-v1.pine
  # EXPECT rc=1, with A3 (no ABSENT token), A9 (15m), A10 (market vocabulary) failing.
  # Those failures are the WORK, not a surprise.

════════ STEP 5 — EXECUTE ════════

Begin at the first NEXT task in context_management/TASK_QUEUE.md — that is W0.T1.

THE ORDER IS NOT NEGOTIABLE:

  W0  the rig + the 30 gates      ← NOTHING else starts until W0.T2 is green
  W1  the purge          ┐
  W2  the card field     ┘ parallel, disjoint files
  W3  the sidecar        ┐
  W4  the cast layer     ┘ parallel, disjoint files
  W5  the render                  ← needs W1 + W2 + W4
  W6  the verifier                ← READ-ONLY, on unseen weeks
  W7  the dashboard               ← after W5

THE LAWS YOU OPERATE UNDER (violating one invalidates the whole turn):

  · PINE CANNOT FETCH. Class A is computed live; Class B arrives in a card. Never write an
    indicator that assumes it can request a URL.
  · THE GENERATED FILE IS NEVER EDITED. Edit the modules; regenerate; compare the sha.
  · THE LQZ BLOCK IS BYTE-STABLE. box.new == 4 after every turn. It is the product.
  · ONE TURN = ONE COMMITMENT = ONE GATE. A turn that does not move its oracle row did not happen.
  · EVERY RENDER TURN ENDS IN AN OPENED CAPTURE. A count is not evidence. A capture you did not
    open is not evidence. A screenshot you did not read is not evidence.
  · A GATE THAT HAS NEVER FAILED IS A SENTENCE. W0.T2 exercises all 30 with corrupted subjects.
  · REPORT BLOCKED AS BLOCKED. Never relabel a blocked gate green. Never retune a tolerance to
    turn a red green — the measurement is the finding.
  · THREE REDS ON THE SAME GATE = STOP AND ESCALATE. Name the three attempts and their measurements.
  · THE OPERATOR'S RULINGS ARE FINAL. R-01 … R-11. If a card disagrees, the ruling wins.

THE THREE OPERATOR INPUTS THAT ARE STILL OWED (ask only when the turn needs them):

  1. the ten held-out weeks       → blocks W6.T2 only
  2. the Protocol A source        → blocks W3.T3 onward
  3. the golden week, written     → blocks W5.T7 only

W0 IS BLOCKED BY NONE OF THEM. START AT W0.T1.

════════ WHAT DONE MEANS ════════

Not "the files exist". Done means: the 30 gates refuse their corrupted subjects; the purge left
box.new == 4 and the LQZ block byte-identical; a pasted card renders its zones; the sidecar emits a
card that round-trips through the Pine parser; a broken node fails locally and names itself; the whole
E1/E2/E3 analysis is on one chart in an OPENED capture with the line's ratio ≥ 0.900 measured off the
pixels; ten unseen weeks render with the code frozen AND the geometry varies; and a blind agent's card
matches the authoritative week within tolerance.

START WITH W0.T1. Report what you READ in Step 1-3 before you write a single line of Pine.
```

---

## 3 · WHY EACH STEP EXISTS

```
STEP 1   because the state docs are the only place the ACTUAL position lives
STEP 2   because the blueprint is WHAT and the workflow is HOW, and a builder who reads one
         without the other builds the wrong thing correctly
STEP 3   because the canon vocabulary is not optional — the baseline's 13 gate failures are
         almost entirely vocabulary, and a builder who has not read the cards will reintroduce them
STEP 4   because a drifted tree makes every later measurement meaningless, and the sha check
         costs four seconds
STEP 5   because the wave order encodes dependencies that are not obvious (W5 needs W2's card,
         W6 must be read-only, W7 must come after W5 or the parity gate compares a fiction)
```

---

## 4 · THE ANTI-SKIM INSTRUCTION

The prompt says **"Report what you READ in Step 1-3 before you write a single line of Pine."**

**That sentence is the enforcement.** A session that skimmed cannot report specifics; a session that
read can name the cascade's first-match rule, the 2.5 RRR floor, the six-layer order, and the three
shapes' candle anatomy. The report is the comprehension test, and it costs one message.

The same principle governs W6.T4's blind agent: **the only evidence of comprehension is a produced
artefact, not a claim of having read.**

---

## 5 · THE THREE FAILURE MODES THIS PROMPT IS BUILT AGAINST

```
1  THE SKIM-AND-BUILD      a session reads CURRENT_STATE, skips the blueprint, and writes Pine that
                           assumes the indicator can fetch. Caught by STEP 2 + the anti-skim report.

2  THE BASELINE ASSUMPTION a session assumes the seal is correct because it is the seal. Caught by
                           STEP 4: regenerate and require the exact sha.

3  THE FEATURE-BEFORE-HARNESS a session starts with the interesting work (the card, the render) and
                           never writes the gates. Caught by the wave order: W0 gates everything,
                           and W0.T2 requires 30 gates watched refusing.
```

---

## 6 · THE ONE-SENTENCE VERSION

> **Absorb the two authority documents and the canon cards, prove the seal reproduces, write the
> 30 gates and watch them refuse, then build in wave order — and never call something verified
> until a capture you opened says so.**

---

## 7 · THE MANDATES, LINE-ANCHORED

A prompt that mandates a reading order must be able to say WHERE each mandate comes from. The
anchors below are checked to resolve (file exists, line within the file).

```
MANDATE                                    ANCHOR
Pine cannot fetch — the one physical law   design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:21
the five planes                            design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:66
Class A computed live / Class B in a card  design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:145
the card IS a JESL document                design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:246
the four verify verdicts                   design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:475
Option A now / Option B as phase 2         design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md:396
the seven operating laws                   design/BUILD_WORKFLOW_v2.md:22
the verdict law (pixels only)              design/BUILD_WORKFLOW_v2.md:46
the forbidden list, in every turn's G      design/BUILD_WORKFLOW_v2.md:74
the anti-cheat law (four proofs)           design/BUILD_WORKFLOW_v2.md:104
the worker plan + the eight columns        design/BUILD_WORKFLOW_v2.md:130
the oracle table (30 rows)                 design/BUILD_WORKFLOW_v2.md:365
the turn shape + the action set            design/BUILD_WORKFLOW_v2.md:517
the 42 turns                               design/BUILD_WORKFLOW_v2.md:590
W0 — the rig and the gate harness          design/BUILD_WORKFLOW_v2.md:597
the baseline's measured state              design/BUILD_WORKFLOW_v2.md:156
━━━ why the canon is not optional ━━━
E1 → E2 → E3 one direction                 cards/FRAC-THREE-ENGINES.md:1
the cascade stops at first match           cards/E2-CLASSIFICATION-MATRIX.md:1
ZFP is strength, never width               cards/E1-ZFP-DUAL-DEFINITION-RULING.md:1
the 2.5 RRR hard floor                     cards/E3-RRR-RULING.md:1
one TP, no partials                        cards/E3-TP-RULING.md:1
the confidence gate at 65                  cards/E3-CONFIDENCE-RULING.md:1
rockets are not trades                     cards/MECH-ROCKETS-VS-TRADES.md:1
eviction, never rejection                  cards/LAW-TRADE-COUNT-CAP.md:1
━━━ the executables the prompt runs ━━━
the seal must reproduce                    scripts/lqz_vision_build.py:1
the 13 anti-pattern checks                 gates/anti/anti_patterns.py:1
the seal's own no-edit warning             plutus-vision-v1.pine:3
the operator's rulings                     MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:1
```

**A resume prompt without anchors is folklore.** These are what make STEP 4's "verify the baseline"
and STEP 5's "the order is not negotiable" checkable rather than assertable.
