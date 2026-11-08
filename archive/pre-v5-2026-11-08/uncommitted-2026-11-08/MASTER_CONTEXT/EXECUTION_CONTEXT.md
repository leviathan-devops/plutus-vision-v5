# EXECUTION CONTEXT GRAPH — start here

**This is the routing node for the Plutus Vision build.** Read it first, in order. It tells you what
is authoritative, what is superseded, what is proved, and what is not.

**Last updated:** 2026-10-18 · **State:** specification phase · **no build work authorized**

---

## §A · THE ORDER (read in this sequence, nothing else first)

```
1  THIS FILE                you are here
2  spec/PLUTUS_VISION_MASTER_SPEC.md          the spec + the full execution workflow
3  MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md
                         the TOOLSET ORIGINAL — 4,216 lines, authoritative
4  cards/ (34)              the atomic facts, typed
5  nothing else until 2-4 are read
```

**If a file conflicts with `spec/PLUTUS_VISION_MASTER_SPEC.md`, that spec wins and you must state
the conflict in your report rather than silently picking.**

---

## §B · THE GRAPH EDGES

```
                      [MASTER_SPEC]  spec/PLUTUS_VISION_MASTER_SPEC.md
                     /      |      \            \
                    /       |       \            \
            §3 E1        §4 ZFP    §5 E2       §6 E3
             |             |         |            |
    ENGF-E1-IP          Appendix B  ENGF-E2-    ENGF-E3-
    ENGF-E1-SD-LIQ     ZONEF-GRAMMAR  SHAPE-CHAIN  TRADES
    ZONEF-AUTHOR-SET   LAWF-ZFP-*     SHAPEF-*     LAWF-E3-VERTEX-ENTRY
    ZONEF-FACE-B                     SHAPEF-CHAIN-PRIMACY
             \             |        /            /
              \            |       /            /
               THE DERIVATION CHAIN  (one direction only)
                        E1 -> E2 -> E3
                          |
                    [THE GATES]
                GATE A  golden week visual
                GATE B  anti-hardcode 10 weeks
                applied INSIDE every phase
```

---

## §C · THE FIVE THINGS THAT WILL BITE YOU

| trap | the law |
|---|---|
| trusting a prior agent's "built and works" | **L1** — nothing is built until visually proven |
| treating a grep/sha/count as a verdict | **L2** — those are pre-flight guards, never a pass |
| deriving upward in the chain | **L3** — E1 → E2 → E3 only |
| typing a price into a draw call | **L4** — it cannot change with the week |
| accepting a good golden-week screenshot | **L5** — the 10 held-out weeks are the test |

---

## §D · THE AUTHORITATIVE SOURCE MAP

| question | read |
|---|---|
| what is E1 / E2 / E3 exactly | `spec/PLUTUS_VISION_MASTER_SPEC.md` §3 §5 §6 |
| what is ZFP and how is it computed | same file §4 · source `APPENDIX B.1 + B.2` |
| what are the shapes and how are they classified | same file §5 · source `v5.3.3 §6.1 §6.2` |
| what is the trade contract | same file §6 · source `VISUAL_TELESCOPE §3.6` + `FORENSIC_ANALYSIS_38_TRADES` |
| what does the golden week look like | `MASTER_CONTEXT/Golden_Operator_Trade_Feedback_EU_GU.md` · the 3 target PNGs in `~/Pictures` |
| what are the four densities | `Trident_Fractal_Architecture_FirstPrinciples_v2.3.md` |
| what shape anatomy (secondary) | `TTE_MACRO_SHAPES_COMPLETE_REFERENCE.md` |
| how do I verify anything | `TESTING_LOG.md` §ZONE 16 · master spec §10 |
| what failed before and why | `FAILURE_LOG.md` F-147 · `THEATRICALITY_LOG.md` T-16 · `forensic/SLUMP_MAP.md` |

---

## §E · SUPERSEDED — do not use

```
spec/EW_A_BACKEND_SPEC.md          superseded — grep-as-test criteria throughout
spec/EW_B1_ENGINE1_SPEC.md         superseded — same defect
spec/EW_B2_ENGINE2_SPEC.md         superseded — describes a polyline, not two-phase E2
spec/VERIFICATION_ARCHITECTURE.md  DELETED
spec/RENDER_LOOP_WORKFLOW.md       superseded by master spec §9
~/.omp/agent/extensions/snapcompact-read-frames.ts   unrelated to this build

SUPERSEDED SUB-CLAIMS
  width/refRange as ZFP                -> Appendix B
  "6 macro shapes"                     -> 10 (§6.1)
  "shapes classified by candle anatomy"-> §6.2 ZFP decision matrix
  "entry at a shape vertex"            -> entry at a ZONE EDGE
  any grep/hash/diff as a PASS reason  -> pre-flight guard only
```

---

## §F · PROVED vs UNPROVED (measured 2026-10-18)

**PROVED** — each with the command that produced it, re-run 2026-10-18

```
$ ss -ltn | grep -oE ':(9741|9851|9230|9222)' | sort -u
:9222 :9230 :9741 :9851
$ DISPLAY=:4 xdotool search --name "Plutus Vision" | wc -l
1
-> the rig is up: station :9741, server :9851, CDP :9222/:9230,
   one indicator window on display :4

$ wc -lc vision/plutus-vision.pine
  231 9715 vision/plutus-vision.pine
-> the indicator compiles and renders. The COUNTS IT RENDERS ARE NOT CURRENT:
   the file was rewritten after the last render, so the only proven fact
   here is that it exists and compiled in a prior run.

$ python3 <fixture census>
fixtures=24 weeks=84 bars=41546
-> 84 weeks of 1H bar data exist for rendering and for the calibration run

$ wc -l scripts/e1_zfp.py scripts/e2_engine.py scripts/e1_fetch.py
  270 scripts/e1_zfp.py
  783 scripts/e2_engine.py
  784 scripts/e1_fetch.py
-> the files exist. Existence is NOT a proof they work (L1).

$ stat Golden_Operator_Trade_Feedback_EU_GU.md
21,897 B — the 8 EU setups with direction/entry/SL/TP/RRR
-> the golden-week ground truth exists
```

**ABSENT — does not exist**
```
E1 face B in the merged render
the E2 shape chain as boxes, and as a line
E3 trade boxes
the ZFP calibration run (§4.5)
the held-out week set (drawn by the operator after the freeze)
```

---

## §G · THE NEXT ACTION

**Blocked on §13 of the master spec — seven open decisions needing a ruling**, of which the first
four gate everything:

1. ZFP point selection (midpoint)
2. ZFP momentum constant (`0.5 × ATR20`)
3. ZFP clamp (99)
4. ZFP calibration tolerance (±15pp, n ≥ 8)

**Nothing renders a ZFP label until those are ruled and the calibration run passes.** Everything
downstream — shape classification, the chain, the trades — reads ZFP thresholds.

---

## §H · WHERE THE WORKFLOW LIVES

```
spec/PLUTUS_VISION_MASTER_SPEC.md §9.0  the universal phase contract
                                 §9.1  P0  baseline
                                 §9.2  P1  E1 face A      + GATE A + GATE B
                                 §9.3  P2  E1 face B      + GATE A + GATE B
                                 §9.4  P3  E2 boxes       + GATE A + GATE B
                                 §9.5  P4  E2 line        + GATE A + GATE B
                                 §9.6  P5  E3 trades      + GATE A + GATE B
                                 §9.7  P6  acceptance     both gates, 10 held-out weeks
                                 §10   the test framework (two questions, two tiers, five rules)
                                 §11   anti-hardcode
```

**Every phase closes with both gates. Phases do not chain past a failed gate.**
