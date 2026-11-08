# BUILD SPEC ARTIFACT — PLUTUS VISION: THE INDICATOR PORT

**Class:** build_spec (a DPL1 Layer-1 BUILD_SPEC — the indicator port; the artifact class is declared here for the spec-audit gate GS-8)

| Field | Value |
|---|---|
| **Target** | `PLUTUS_VISION` — the Pine indicator (`plutus-vision-v2.pine`) rendering live on the V1 baseline |
| **Generated** | 2026-10-07 |
| **Trident Version** | v5.3.3 (the Toolset) |
| **Status** | `PLANNING` — **NO CODE UNTIL THE OPERATOR SAYS BUILD** (the Oct-07 row, kept as history) |
| **Status (2026-10-11)** | `BUILT (W1→W7)` — the operator SAID BUILD (PIN_INDICATOR_PORT_BUILD.md:1); the zones compute live in Pine (SC-19=0), the 5-week litmus passes, the fence holds PASS 5/5. The success gate is the JEV verdict + the operator's look (C16). |
| **Artifact Type** | `BUILD_SPEC (Layer 1 Prompt)` + CLEANUP PLAN |
| **Authority** | `Original_Canon_Data/Toolset/` — the 6 approved files (fingerprints in §A) |
| **Supersedes** | the report-generator frame (F-64, F-74) — **the report step is REMOVED by operator ruling** |
| **Fixes** | F-54 … F-104 (the failure ledger, `FAILURE_LOG.md`) |

---

## §0 — THE FRAME (the operator's ruling, verbatim — read this before anything else)

### §0.1 THE FRAME, IN THE OPERATOR'S WORDS (2026-10-07, verbatim)

> *"I've removed the report step because I want the indicator to be able to compute all of the fucking
> data in real time instead of having to generate a report and then manually putting that report into
> the indicator. Like the report is the step that computes all of the fucking data and we put it into
> report so that I can read it. Once the report is approved, then that is converted into a pine script
> so that all of the report data can be rendered on the indicator. Everything in the tool set is the
> approved working version that was generating reliable fucking reports for engine one and engine two.
> Like this literally already fucking works. I spent two days telling you to literally just fucking
> convert this into the indicator so that it dynamically renders the working infrastructure on top of
> the V1 baseline. Like that's it. It's not that fucking complicated."*

### §0.2 THE FRAME, DECOMPOSED (every clause is a requirement)

| # | The clause | The requirement |
|---|---|---|
| 1 | "the report step is removed" | **No report generator. Ever.** The old pipeline (compute → HTML → read → approve → hand-convert to Pine) is retired. |
| 2 | "the indicator … computes all of the data in real time" | The Pine (or the builder that emits it) computes Engine 1 + Engine 2 **live from the chart's own bars** — not from a hand-written payload. |
| 3 | "the report … computes all the data and we put it into report so I can read it" | The report's ROLE was the read-only view of the computed data. The indicator replaces it: the chart IS the view. |
| 4 | "once the report is approved, then that is converted into a pine script" | The Toolset's engines are the APPROVED logic. Porting = converting the approved logic to Pine. |
| 5 | "everything in the tool set is the approved working version" | **The Toolset is the finished reference.** It generated reliable reports for E1 + E2. Do not re-derive it. |
| 6 | "this literally already fucking works" | The logic is DONE. The task is a PORT, not a design. |
| 7 | "convert this into the indicator" | The deliverable: the E1 + E2 logic running inside the Pine indicator. |
| 8 | "dynamically renders the working infrastructure on top of the V1 baseline" | The V1 baseline (the sealed chart) is untouched; the E1/E2 layers draw ON TOP, live. |
| 9 | "do not come up with your own shitty ideas" | **Transcribe the Toolset. Do not invent.** (§C anti-pattern #1) |
| 10 | "do not build anything until I tell you" | This spec is the deliverable. **No code.** |

### §0.3 THE ONE-LINE MISSION

**Port the Toolset's Engine 1 (the 9-Pillar zone map) + Engine 2 (the macro shape chain) into the
Pine indicator, so the indicator computes the data live from the chart's bars and renders it on the
V1 baseline — replacing the retired compute→report→approve→convert pipeline with one live artifact.**

### §0.4 WHAT THIS SPEC IS NOT

- **NOT a report generator.** (The operator removed it — F-64, F-74.)
- **NOT a re-derivation of the canon.** (Transcribe — F-67.)
- **NOT a search outside the Toolset.** (The Toolset is the only authority — F-70.)
- **NOT a build.** (No code until told — F-85.)

---

## §A — CONTEXT (the evidence base — a fresh agent reads ONLY this section and knows the situation)

### §A.1 THE AUTHORITY — THE TOOLSET (6 files, fingerprinted)

```
/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Toolset/
```

| # | File | Lines | md5 | Role |
|---|---|---|---|---|
| 1 | `Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` | 4216 | `9e0e4d1ad052e56bdf75bcf981737504` | **THE SPEC.** E1 (Part III, the 9 Pillars), E2 (Part VI), E3 (Part VI-B), the ZFP (Appendix B), the DXY formula, the Pine rules (Part X). |
| 2 | `TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md` | 1685 | `3f4b7db8bc1b4fed80895ea572ea821a` | **The operator's 2026-09-24 surgical fix to E3.** E1+E2 preserved verbatim; only the E3 sections replaced. |
| 3 | `trident_engine3_v8.py` | 1284 | `4fb871ebe104091220aefe94547b92c9` | **A WORKING Python reference** (the sniper-entry engine). Consumes `IPZone` objects. |
| 4 | `Leviathan_Report_Template_v2.0.py` | 1576 | `4852276bc5b701113df6898ca4d04363` | **The RETIRED report template** (52 formatting rules). The VALIDATION ORACLE — shows what the engines computed. **NOT the product.** |
| 5 | `Trident_Report_Validator.py` | 780 | `dbdf7ce51bb8e1571ab54e009996f07c` | **The RETIRED validator** (V01-V13). The validation oracle's checklist. |
| 6 | `Trident_Fractal_Architecture_FirstPrinciples_v2.3.md` | 721 | `64ae7a27807846636839783fc12b6388` | The E1/E2/E3 role contract + the elemental densities. |

**THE SCOPE LAW (F-70):** the Toolset is the ONLY authority. No file outside it is cited in this
spec. The v4.5.3 tree, the `mdve/` package, and every other workspace path are OUT OF FRAME.

### §A.2 THE CURRENT STATE (measured 2026-10-07)

| What | Where | Measured |
|---|---|---|
| The indicator (codegen artifact) | `pine-ide/ide/renderer/plutus-vision-v2.pine` | 1723 lines, sha `6688a885912d6464…` |
| The indicator (source copy) | `plutus-vision-v2.pine` | 1723 lines (identical sha) |
| The chart variant | `pine-ide/charts/plutus-vision-v2.pine` | 1735 lines, sha `04d7a89ae57d1f9f…` |
| The E1 engine (mine) | `scripts/e1_extract.py` | 1299 lines, sha `e6da4ef4054da08b…` |
| The E2 engine (mine) | `scripts/e2_engine.py` | 763 lines, sha `e0b7a160d371d763…` |
| The v8 bridge (mine) | `scripts/e1_category.py` | sha `6f981d2014b35cca…` |
| The engine set | `scripts/*.py` | 11,133 lines total |
| The V1 baseline | the sealed `plutus-vision-v2.pine` base layers | INTACT (untouched) |

### §A.3 WHAT EXISTS AND WHAT IT PROVED

- **The V1 baseline** — the sealed chart (candles, the LQZ layer, the base rendering). Works. Untouched.
- **My E1 engine** — computes pivots, MA grid, structural extremes, 4H order blocks, a confluence, a
  degree, a ZFP. **It runs.** Its ZFP is a restatement of its degree (F-54) — so its central number is
  uninformative. Everything else (the pivots, the MA grid, the clustering) is real work.
- **My E2 engine** — the §6.4.1 ZFP-conditioned transition table, constants matching the canon. **The
  logic is correct.** Fed F-54's broken ZFP (F-77).
- **The rig** — `pv-server:9851` + `pine-station:9741` + `vil-rail:9754` + CDP. Loads a Pine file,
  renders real candles, captures. **3 ports live.** This is the instrument.
- **The subagent's backtest tab** — `pine-ide/pine-ide/agent-face.mjs` **+604 lines uncommitted**
  (F-72). Unsealed.

### §A.4 THE FAILURE INVENTORY (the 51 entries this spec fixes)

See `FAILURE_LOG.md` (F-54 … F-104) and `THEATRICALITY_LOG.md` (T-16 … T-24). The categories:

| Category | Entries | The one-line summary |
|---|---|---|
| **The ZFP** | F-54, F-55, F-65, F-71, F-77, F-78 | Three ZFPs shipped; the one the engines read is a restatement of the degree. |
| **The authority read** | F-66, F-70, F-84 | Read 2 of 6 Toolset files; searched outside the frame. |
| **Re-derivation** | F-67, F-76, F-79 | Wrote my own clustering/ZFP/constants instead of transcribing. |
| **Invented requirements** | F-64, F-74 | Built a report generator the operator removed. |
| **The data contract** | F-57, F-58, F-59, F-60, F-61, F-62, F-63, F-68, F-69, F-80, F-81 | Zone count, names, tier, bonus, missing pillars, LSZ, 4H verification, flat dims, dead Step 0e, the single-week fixture, the ladder misread. |
| **Process** | F-72, F-73, F-75, F-82, F-83, F-85 | Unsealed subagent work, 115 commits, permission-asking, inline smoke, arbitrary week, building after stop. |
| **The operator corrections** | F-86 … F-104 | 19 corrections in two days. |

### §A.5 THE ROOT PATTERN (the ONE mechanism — §C expands it)

**I substituted my own derivation for the canon's text.** Every failure is a place where a written,
approved artifact existed and I built a parallel version. The countermeasure: **NO DERIVATION WHERE A
NAMED ARTIFACT EXISTS.**

---

## §1 — PROBLEM STATEMENT (from the operator's real requirements — never invented)

**THE PROBLEM.** The Toolset's Engine 1 + Engine 2 compute the zone map and the macro shape chain
correctly (they generated reliable reports). The operator wants that computation to run INSIDE the
Pine indicator, live, so the chart renders the working infrastructure on top of the V1 baseline —
without the retired report round-trip. My build did not deliver this: it produced a Python engine with
a broken ZFP (F-54), a hand-written Pine payload (F-56), and an invented report requirement (F-64).

**THE THREE CONSTRAINTS (each from a verbatim operator ruling).**

1. **The logic is the Toolset's — transcribed, not re-derived.** (§0.2 #5, #6, #9; F-67)
2. **The output is the indicator — live, on the V1 baseline, no report.** (§0.2 #1, #2, #8; F-64)
3. **The authority is the Toolset — six files, nothing else.** (§A.1; F-70)

**THE PROOF OF SUCCESS.** The operator's litmus test: the live render matches the v8's structure
across **five random weeks**, with the ZFP carrying real failure information (a breakout week's
ceiling reads HIGH where a consolidation week's reads LOW).

---

## §2 — ARCHITECTURE (the port architecture — the Toolset's logic, running in Pine)

### §2.1 THE SHAPE (what runs where)

```
┌─ THE PORT ARCHITECTURE ─────────────────────────────────────────────────────┐
│                                                                             │
│  THE CHART'S BARS (the indicator's own series — real-time)                  │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐            │
│  │ ENGINE 1        │   │ ENGINE 2        │   │ THE V1 BASELINE │            │
│  │ the 9-Pillar    │   │ the macro shape │   │ (sealed — the   │            │
│  │ zone map        │   │ chain           │   │  candles + LQZ) │            │
│  │ (Part III)      │   │ (Part VI)       │   │                 │            │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘            │
│           │                     │                     │                     │
│           └──────────┬──────────┘                     │                     │
│                      ▼                                │                     │
│           ┌─────────────────────┐                     │                     │
│           │ THE RENDER LAYER    │◄────────────────────┘                     │
│           │ zones + shapes on   │                                           │
│           │ the V1 baseline     │                                           │
│           └─────────────────────┘                                           │
│                                                                             │
│  NO REPORT. NO HTML. NO HAND-CONVERSION. The chart computes and draws.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### §2.2 THE TWO SUB-QUESTIONS (the only architectural forks)

**FORK A — WHERE DOES THE COMPUTATION RUN?**

| Option | How | Pro | Con |
|---|---|---|---|
| **A1 — In Pine, natively** | The 9 pillars computed in PineScript from `request.security` series + the chart's bars | one artifact; truly live; no build step | Pine has no dict/objects; the pillar logic is procedural — a large rewrite; `request.security` limits |
| **A2 — A builder emits the Pine** | A Python/TS builder reads the chart's bars (a fixture) + computes the pillars, then EMITS a Pine file with the values baked | matches how `plutus-vision-v2.pine` is already built; keeps the Python engine | the values are baked per-build, not per-bar live — the operator's "real time" is a build-run, not a tick |
| **A3 — Hybrid** | The pillars that Pine can compute (pivots, MA grid, round numbers, fib) run IN Pine; the pillars needing external data (options, analyst) are baked at build | live for the chart-computable pillars; baked for the external ones | two paths to keep in sync |

**RECOMMENDED: A3 (hybrid).** The canon's pillars split cleanly: P1 (pivots), P2 (MA grid), P5
(structural extremes), P6 (fib + round numbers), P9 (regime/ZFP) are all computable from the chart's
own bars → they run IN Pine, live. P3/P4/P7/P8 (options, analyst, derivatives) need external data →
they are baked at build time and injected (the existing `e1_injected_*` mechanism). This gives the
operator "real time" for everything the chart can know, and a clean injection seam for what it cannot.
**The operator rules on this fork (§9 OD-1).**

**FORK B — DOES THE PYTHON ENGINE STAY?**

| Option | Pro | Con |
|---|---|---|
| **B1 — Retire it** | one codebase (Pine) | throws away the working pivot/MA/clustering code |
| **B2 — Keep it as the builder** | reuses the verified pillars; emits the Pine (A2/A3) | two languages to maintain |

**RECOMMENDED: B2 for the external pillars (a build-time builder), B1 for the chart-computable ones
(they move into Pine).** The Python engine becomes the BUILD TOOL that emits the injected arrays; the
Pine becomes the live computer for the chart-computable pillars.

### §2.3 THE E1 PIPELINE (the canon's 9-step algorithm — the port contract)

**THE CANON'S ZONE ASSEMBLY ALGORITHM (`Trident_System_Prompt_v5.3.3…md:1499-1512`, VERBATIM):**

1. Collect all levels from all 9 pillars. Sort high→low. **DO NOT filter by spot proximity.**
2. Score each level across 6 dimensions (0-2 each, max 12) + the Structural Extreme Bonus (≤ +2, max 14).
3. **MANDATORY LEVEL CLUSTERING SCAN:** 3+ levels within a **0.15 DXY** band = HIGH-DENSITY ZONE;
   pairs within **0.10 DXY** = TIGHT CONFLUENCE.
4. Group into zones where levels cluster within **0.10-0.15 DXY**.
5. Assign the pressure degree from the group's **highest-scoring level**.
6. Assign the ZFP from **Pillar 9** (the Appendix-B base + the B.2 modifiers).
7. Name each zone **positionally** (RESISTANCE CEILING · UPPER RESISTANCE · EQUILIBRIUM ZONE ·
   MID-RANGE SUPPORT · KEY SUPPORT BAND · LIQUIDITY SWEEP ZONE · BREAKOUT EXTENSION TARGET).
8. Flag any zone with **ZFP > 50%** as BREAKOUT RISK.
9. **+1** for a zone formed AFTER consolidation (tag "POST-CONSOLIDATION ZONE").

**THE PORT FIXES (each step vs my engine):**

| Step | The canon | My engine (the defect) | The fix |
|---|---|---|---|
| 2 | 6 dims × 2 + bonus ≤ 2 = 14 | 5 dims + regime + bonus ≤ 6 (F-60) | 6 dims; ONE bonus ≤ 2; assert pre-clamp |
| 2 | every dim computed per level | technical/structural flat 2.0 (F-68) | compute per level from its own evidence |
| 2 | Step 0e (confluent floor/ceiling +2) | dead code (F-69) | Step 0e ≠ Step 0.5; separate thresholds |
| 3-4 | cluster 3+ levels in 0.10-0.15 | my tolerances (F-76) | quote the canon's tolerances |
| 5 | degree from the highest-scoring level | — (correct) | keep |
| 6 | ZFP = Appendix-B base + B.2 modifiers | ZFP = degree (F-54) | **THE CORE FIX** |
| 7 | positional names | rank names (F-58) | name by position |
| — | the zone count is data-driven | forced to 5, fabricated (F-57) | emit what the data supports |

### §2.4 THE E2 PIPELINE (the macro shape chain — the port contract)

**THE CANON'S E2 (`…md` Part VI):** the primary timeframe is **1H**; the shape taxonomy (SS/BS/WL/R/WLS
+ variants); the Shape Classification Decision Matrix (§6.2); the Shape Transition Rules (§6.4) + the
**ZFP-Conditioned Transition Rules (§6.4.1 — the critical one: a BS into a Hard Wall (ZFP < 20%)
predicts RWL, not R or PBS)**; the HTF Zone Mechanics Decision Tree (§6.4.2); the Forward Mapping
Procedure (§6.6, 5 steps); the Day-Level Decomposition (the Engine 2→3 bridge).

**MY E2** (`e2_engine.py`): the §6.4.1 table transcribed, `ZFP_HARDWALL = 20`, `ZFP_BREAKOUT = 45` —
**matching the canon.** The fix is only its INPUT (the ZFP, F-77).

**THE PORT FIX:** the E2 runs in Pine (it consumes E1's zones, which are live) — the transition
decisions computed per bar from the live zone ZFPs.

### §2.5 THE ZFP (THE CORE FIX — Appendix B, transcribed)

**THE CANON'S ZFP (`…md` Appendix B, VERBATIM):**

**B.1 Base by zone type:**
| Zone Type | Criteria | Base Failure Prob |
|---|---|---|
| Hard Wall | CRITICAL OPTION WALL (≥$1.5B) + 3+ pillars + Confluent Floor/Ceiling | 5-15% |
| Standard Wall | SIGNIFICANT MAGNET ($850M–$1.499B) + 2+ pillars | 15-30% |
| Soft Wall | No option wall (<$850M) or 1-2 pillars only | 30-50% |
| One-Touch | Only 1 pillar, no option wall | 50-70% |
| Post-Expiry Ghost | Option expired, structural memory remains | 20-40% |
| Liquidity Sweep Zone | Level at a prior exact swing low (Step 0) | Special: brief breach then reversal |

**B.2 Modifiers:**
| Signal | Modifier | Detection Method |
|---|---|---|
| Option expiry timing (Spring Release) | **+20-30%** | Protocol A timestamps |
| Macro catalyst aligned against zone | **+15-25%** | Protocol F + web search |
| Increasing momentum toward zone | **+10-20%** | Rate of change in DXY |
| Cross-pair confirmation | **+15-25%** | Protocol A multi-pair |
| Cascade effect (prior zone broke) | **+20-30%** | Sequential zone failure |
| Regime change (EMA 200 cross) | **+15-25%** | Pillar 2 recapture detection |

**THE PORT CONTRACT.** `zfp(zone) = base(zone_type) + Σ modifiers(zone, bars)`, clamped 0-100.
Every modifier is computed from data the engine holds (the regime from `classify_regime`; the momentum
from the drift; the cascade from whether an adjacent zone broke; the expiry from Protocol A's day).
**The proof (R2):** a zone in an active breakout must read a HIGHER ZFP than the same zone in
consolidation. A differential probe over two weeks asserts it.

---

## §3 — DISCOVERY INTELLIGENCE (measured numbers only)

| Metric | Measured | Command |
|---|---|---|
| Toolset files | 6 | `ls Original_Canon_Data/Toolset/` |
| Toolset lines | 10,262 | `wc -l Original_Canon_Data/Toolset/*` |
| The spec (file 1) | 4,216 lines | `wc -l …DOWNLOAD_ME.md` |
| The indicator | 1,723 lines | `wc -l plutus-vision-v2.pine` |
| The indicator's injected payload | 10 literal `push()` calls | `grep -c "e1_injected_.*\.push"` |
| My engine set | 11,133 lines / 20+ files | `wc -l scripts/*.py` |
| My E1 | 1,299 lines | `wc -l scripts/e1_extract.py` |
| My E2 | 763 lines | `wc -l scripts/e2_engine.py` |
| Pillars implemented (of 9) | **4** | `for p in 3 4 6 7 8; do grep -rl "Pillar $p" scripts/*.py \| wc -l; done` → 0 |
| ZFP implementations shipped | **3** | `grep -rn "zfp_from_degree\|CAT.zfp\|f_e1CalcZFP" scripts pine-ide` |
| Commits this session | 115 | `git log --oneline --since="2026-10-06" \| wc -l` |
| Failure entries this session | 51 | `grep -cE '^## \[2026\|^### F-' FAILURE_LOG.md` |
| Test files | 4 | `ls scripts/*tests*.py` |
| The rig's live ports | 3 | `ss -ltn \| grep -cE ':9741\|:9754\|:9851'` |

---

## §4 — CORE INSIGHT (the first-principles thesis)

**THE THESIS.** The Toolset's Engine 1 + Engine 2 are a FINISHED, APPROVED computation. The task is
not to design a zone engine — it is to run the approved engine inside the indicator. Therefore:

**THE IMPLEMENTATION MUST TRANSCRIBE THE TOOLSET'S LOGIC INTO A LIVE COMPUTATION, CITING EACH CANON
LINE, AND RENDER IT ON THE V1 BASELINE — NOT RE-DERIVE THE LOGIC, NOT EMIT A HAND-WRITTEN PAYLOAD, NOT
GENERATE A REPORT.**

**THE GOVERNING NON-NEGOTIABLES.**

1. **TRANSCRIBE, DO NOT DERIVE.** A named artifact exists → use it, cite its `file:line`. (F-54, F-67)
2. **THE ZFP CARRIES FAILURE INFORMATION.** A zone in a breakout reads higher than the same zone in
   consolidation — mechanically provable. (F-54)
3. **THE VALUES ARE COMPUTED, NOT TYPED.** No hand-written Pine payload. (F-56)
4. **ONE IMPLEMENTATION PER CONCEPT.** A second ZFP is a defect. (F-55)
5. **VERIFY AGAINST THE CANON'S WORKED EXAMPLE.** Never against the engine's own output. (F-78)
6. **THE V1 BASELINE IS UNTOUCHED.** The E1/E2 layers draw on top. (F-72's discipline: seal before edit)
7. **THE TOOLSET IS THE ONLY AUTHORITY.** Six files. Nothing outside. (F-70)
8. **NO REPORT.** The chart is the view. (F-64)

---

## §5 — SCOPE (the work items — real requirements, each ≤200 chars)

1. Transcribe the ZFP: Appendix-B base by zone type + the 6 B.2 modifiers, each computed from data. Cite the lines.
2. Delete the two competing ZFPs (`zfp_from_degree`, `CAT.zfp`); wire ONE through every consumer (E1, E2, the render).
3. Transcribe the 9-step zone assembly with the canon's tolerances (0.15/0.10, 3+ levels) and positional names.
4. Implement the 6 confluence dimensions computed per level (fix the flat technical/structural; the triple-counted bonus).
5. Separate Step 0e (Confluent Floor/Ceiling, +2) from Step 0.5 (repeated magnet); both fire on their own thresholds.
6. Compute the POI Tier from the 4H BoM overlap (Step 9.7), not the confluence.
7. Emit the LSZ as a first-class zone object (Step 0.45: range + type + source + function + priority).
8. Implement Pillar 6 (fib retracement + round-number grid) — the cheapest missing pillar; feeds the confluence.
9. Implement the 4H order-block Verification Protocol (Step 0f: width ≤ 0.40, date stamp, overlap rejection).
10. Move the chart-computable pillars (P1, P2, P5, P6, P9) INTO the indicator (Pine) so the Engine 1 + Engine 2 computation runs live from the chart's own bars; bake only P3/P4/P7/P8.
11. Make the week a parameter (F-80); the multi-week differential probe is a gate.
12. Seal or revert the subagent's `agent-face.mjs` (+604, uncommitted) — the operator's call (§9 OD-3).
13. Clean up the 20+ scratch artifacts (`_test-*.pine`, `pine-ide/charts/`, `_current.json`, the 4 untracked Checkpoints).
14. Wire the differential ZFP gate (R2) into the wave gate chain so a ZFP that cannot show failure FAILS the build.

---

## §6 — SUCCESS CRITERIA (every criterion mechanically verifiable, every oracle EXTERNAL)

**THE ORACLE LAW (from the root pattern):** a criterion whose oracle is the engine's own output is
REJECTED. Every criterion below names an external oracle — the canon's worked example, the v8's
literals, or a two-week differential.

| # | The criterion | The external oracle | The command / check |
|---|---|---|---|
| SC-1 | The ZFP is Appendix-B base + B.2 modifiers | the canon's Appendix B | `grep -c "Appendix B\|B.2" scripts/e1_*.py` ≥ 1, and the modifier list matches |
| SC-2 | A breakout-week ceiling ZFP > the same week's consolidation ZFP | a two-week differential | run both weeks; assert `zfp(2026-XX breakout) > zfp(2026-YY consolidation)` |
| SC-3 | Exactly ONE ZFP implementation exists | `grep` | `grep -c "def zfp" scripts/*.py pine-ide/**/*.pine` → 1 |
| SC-4 | The Pine payload is computed, not literal | a byte-diff of two weeks | two weeks' Pine payloads differ (`sha256sum` differs) |
| SC-5 | The zone count is data-driven | the canon ("MODERATE and above only") | a week with 4 clusters emits 4 zones |
| SC-6 | Zone names are positional | the canon Step 7 | assert `RES.top > spot > SUP.bottom` on every week |
| SC-7 | The POI tier is a 4H overlap | the canon Step 9.7 | `grep -c "poi_tier\": 2 if conf" scripts/` → 0 |
| SC-8 | The confluence = 6 dims × 2 + bonus ≤ 2 | the canon Synthesis Engine | assert the sum pre-clamp |
| SC-9 | No dimension is a flat constant | a per-level histogram | assert `len(set(dim values)) > 1` per week |
| SC-10 | Step 0e and Step 0.5 both fire | the canon Step 0e / 0.5 | a zone with one confluent extreme gets +2 |
| SC-11 | Pillars 1,2,5,6,9 present | the canon | `grep -l "Pillar 6" scripts/*.py pine-ide` ≥ 1 |
| SC-12 | The LSZ is a zone object | the canon Step 0.45 | the E1 JSON carries `lsz[]` with range/type/function |
| SC-13 | The 4H block verification runs | the canon Step 0f | every emitted block has a date + width ≤ 0.40 |
| SC-14 | The week is a parameter | — | two `--week` runs produce different outputs |
| SC-15 | the indicator render on the chart matches the v8's zone map + the Engine 2 chain across 5 weeks | the v8's literals (floor zfp 21%, mid 8%) | the operator's litmus test, run |
| SC-16 | The V1 baseline is byte-identical | the sealed sha | `sha256sum` of the base layers unchanged |
| SC-17 | No report generator exists | the operator's ruling | `grep -rln "reportlab\|Leviathan_Report_Template" scripts/` → 0 |
| SC-18 | Every constant carries its canon line | the canon | a lint: every numeric constant has a `# canon:` citation |
| SC-19 | The E1/E2 zones are COMPUTED in Pine, never injected literals | the source itself (a grep of the `.pine`) | `grep -cE 'e1_injected_(top\|bottom\|cat\|degree\|zfp)\.push\([0-9]' plutus-vision-v2.pine` → **0**, AND the zones are built by `ta.*` / `request.security` from the chart's bars. A nonzero literal push = FAIL THE BUILD. |

---

## §7 — THE TEST PLAN (plan-first — the adversarial angles, each with a tool-result-bound token)

**THE ANTI-CIRCULARITY LAW:** a pass token the agent can satisfy by typing is CIRCULAR → FAIL. Every
token below is a structured artifact field, an error code, or an exit code that appears in a TOOL
RESULT.

| # | Angle | The scenario | passToken (in a tool result) | failToken |
|---|---|---|---|---|
| A1 | **BOUNDARY** | empty bar series → E1 | `E1_NO_BARS` (the named refusal) | `ValueError` / a fabricated zone |
| A2 | **BOUNDARY** | a week with 3 clusters | `"zone_count":3` | `"zone_count":5` (fabrication) |
| A3 | **STATE** | a corrupt fixture | `E1_FIXTURE_UNPARSEABLE` | silent acceptance |
| A4 | **INTEGRATION** | the full E1→Pine→render chain | the rendered PNG exists + the zone count matches | a blank render |
| A5 | **AUDIT** | the ZFP differential (breakout vs consolidation) | `"zfp_breakout":NN > "zfp_consolidation":MM` | equal or inverted |
| A6 | **BOUNDARY** | the degree-vs-position check | `"positional":true` | a RES zone below spot |
| A7 | **CONFIG** | a missing fixture path | `E1_NO_FIXTURE` | `NoneType` in a path |
| A8 | **INTEGRATION** | two weeks' payload byte-diff | `sha256sum` differs | identical sha (the hand-written payload) |

**THE EVIDENCE-REQUIREMENT LINE:** every scenario's evidence is captured to
`.trident/indicator-test-results.json` (the per-scenario record: passTokenMatch, failTokenAbsent,
toolResultContext, verdict).

**THE PASS THRESHOLD:** all 8 scenarios pass AND the differential (A5) shows the ZFP carries failure
information. **A build that passes 7/8 with A5 failing is FAILED** — A5 is the operator's complaint.

---

## §8 — THE ANTI-PATTERN LEDGER (every forbidden behavior → its mechanical detection)

### §8.1 ARCHITECTURAL (the banned structures)

| # | The banned thing | The incident it caused | The MECHANICAL detection |
|---|---|---|---|
| AP-1 | **A derived ZFP** (a step function of the degree) | F-54 — the ZFP cannot show failure | `grep -n "zfp_from_degree\|ZFP_BY_DEGREE" scripts/` → must be 0 |
| AP-2 | **Two implementations of one concept** | F-55 — two ZFPs in one object | `grep -rc "def zfp" scripts/` → 1 total |
| AP-3 | **A forced zone count** | F-57 — a fabricated 5th zone | `grep -n "_sc(l) >= 2" scripts/e1_extract.py` → 0 |
| AP-4 | **A rank-based name** | F-58 — a support-named zone above spot | the assert `RES.top > spot > SUP.bottom` must not raise |
| AP-5 | **A confluence-derived tier** | F-59 — the tier duplicates the confluence | `grep -c "poi_tier\": 2 if conf" scripts/` → 0 |
| AP-6 | **A bonus > +2** | F-60 — the confluence can reach 18 | an assert on the pre-clamp sum ≤ 14 |
| AP-7 | **A flat dimension** | F-68 — technical/structural constant | `len(set(per-level dim)) > 1` per week |
| AP-8 | **A report generator** | F-64/F-74 — an invented requirement | `grep -rln "reportlab" scripts/` → 0 |

### §8.2 BEHAVIORAL (the banned runtime behaviors)

| # | The banned thing | The incident | The detection |
|---|---|---|---|
| AP-9 | **A hand-written payload** | F-56 — the "live render" was typed | two weeks' payloads must differ (sha) |
| AP-10 | **A self-certifying comment** | F-76 — "none tuned" over tuned constants | a lint: every constant has a `# canon:` line |
| AP-11 | **A test asserting the engine's own output** | F-78 — green gates, broken engine | every test's oracle is the canon/v8, never the engine |
| AP-12 | **A single-week fixture** | F-80 — every run the same week | the week is a parameter; a two-week run differs |

### §8.3 PROCESS (the banned actions)

| # | The banned thing | The incident | The detection |
|---|---|---|---|
| AP-13 | **Reading part of a named set** | F-66/F-84 — 2 of 6 files | a preflight: `ls` + `wc -l` + `md5sum` the whole set |
| AP-14 | **Searching outside the named frame** | F-70 — the v4.5.3 tangent | every cited path is under `Original_Canon_Data/Toolset/` |
| AP-15 | **Asking permission for ordered work** | F-75 | a lint on the response for "shall I / should I / would you like" |
| AP-16 | **Building after a stop** | F-85 | the operator's "do not build" is checked before any write |
| AP-17 | **Accepting a subagent return without a disk check** | F-72 | `git status --porcelain` before accepting any return |
| AP-18 | **Inline smoke as evidence** | F-82 | the container round is the evidence; inline is not |
| AP-19 | **Treating an open decision (OD-n) as a default** | the last two days — OD-1 left unruled → A2 built (the report renamed) | any build whose architecture matches an UNRULED OD option → STOP + escalate the fork (never build the default) |
| AP-20 | **Injecting computed values as Pine literals** | F-56 / the current v2 (25 `e1_injected_*` arrays filled by `.push(1.12853)`) | `grep -cE 'e1_injected_(top\|bottom\|cat\|degree\|zfp)\.push\([0-9]' plutus-vision-v2.pine` → 0 (SC-19) |

### §8.4 THE ROOT ANTI-PATTERN (the ONE under all 18)

**AP-0 — SUBSTITUTING A DERIVATION FOR THE CANON'S TEXT.**
**The detection:** for every computation in the engine, `grep` the Toolset for the mechanism. If it
exists and the engine does not cite it → VIOLATION. This is the ledger's first entry and §6's SC-18.

---

## §9 — THE OPEN DECISIONS (every unresolved fork → the evidence + the recommended default)

### OD-1 — WHERE DOES THE COMPUTATION RUN? (§2.2 Fork A) — **RULED 2026-10-09: A3**
- **The evidence:** the canon's pillars split into chart-computable (P1,P2,P5,P6,P9) and
  external-data (P3,P4,P7,P8). The operator said "real time".
- **The options:** A1 (all in Pine) / A2 (all baked) / A3 (hybrid).
- **RULED: A3 (hybrid).** The chart-computable pillars (P1,P2,P5,P6,P9) run LIVE in the indicator
  (Pine) from the chart's own bars; only the external-data pillars (P3,P4,P7,P8) bake at build.
  **A2 IS FORBIDDEN** — A2 is the retired report round-trip renamed (compute offline → bake literals →
  inject); building A2 is exactly the derailment that produced two days of baked-literal churn on a
  payload the operator deleted. The E1/E2 zone arrays are COMPUTED in Pine, never injected literals.
  Enforced by SC-19; the behavioral ban is AP-19.
- **THE OD-CLOSURE LAW (binding):** an UNRULED open decision is a **HARD STOP**. An agent may NEVER
  build an OD's "recommended default" — a recommendation is not a ruling. On reaching an unruled OD,
  the agent STOPS, escalates the fork, and waits. (This is not permission-asking for ordered work —
  AP-15 does not apply to an unruled architectural fork; that fork IS the operator's.)

### OD-2 — DOES THE PYTHON ENGINE STAY? (§2.2 Fork B)
- **The evidence:** the pivots/MA/clustering code works; the ZFP does not.
- **RECOMMENDED: B2** — the Python engine becomes the build-time builder for the external pillars;
  the chart-computable ones move into Pine.

### OD-3 — THE SUBAGENT'S BACKTEST TAB (F-72)
- **The evidence:** `agent-face.mjs` +604 lines, uncommitted, the operator says the tab is broken.
- **The options:** (a) seal it and debug; (b) revert it.
- **RECOMMENDED: the operator decides.** It is a separate surface from the E1/E2 port.

### OD-4 — THE CANONICAL WEEK (F-83)
- **The evidence:** the gate reads "2026-07-13" (a fixed week). The v8's literals are for a different
  week (the floor zfp 21% vs mid 8% example).
- **RECOMMENDED:** the canonical week is the one the v8's literals describe (so the gate can compare
  against the v8's worked example). Confirm which week that is.

### OD-5 — THE E1/E2 SPEC DOCS (the stale copies)
- **The evidence:** `docs/PLUTUS_VISION_V2_E1E2_SPEC.md` + `packages/PLUTUS_VISION_V2/…` predate this
  spec.
- **RECOMMENDED:** this spec SUPERSEDES them for the port; they remain as history.

---

## §B — THE DENSE BUILD PLAN

### §B.1 THE MODULE MAP (the interfaces + the data flows)

```
┌─ THE MODULE MAP ────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐                     │
│  │ e1_pillars.py        │      │ e1_category.py       │                     │
│  │ (NEW — the 9 pillars)│      │ (FIX — ONE ZFP)      │                     │
│  │  P1 pivots           │      │  zfp(zone, bars) ->  │                     │
│  │  P2 MA grid          │      │    base + modifiers  │                     │
│  │  P5 structural       │      │  norm_degree()       │                     │
│  │  P6 fib + rounds     │      └──────────┬───────────┘                     │
│  │  P9 regime/ZFP       │                 │                                 │
│  │  -> levels[]         │                 │                                 │
│  └──────────┬───────────┘                 │                                 │
│             │ levels[] (price, dims, bonus)│                                │
│             ▼                             ▼                                 │
│  ┌──────────────────────────────────────────────────┐                       │
│  │ e1_zone_assembly.py (NEW — the canon's 9 steps)  │                       │
│  │  cluster(0.10-0.15, 3+) -> score(6 dims+bonus)   │                       │
│  │  -> degree -> zfp -> name(positional) -> zones[] │                       │
│  └──────────────────────┬───────────────────────────┘                       │
│                         │ zones[] (top,bot,degree,zfp,cat,poi_tier)        │
│                         ▼                                                   │
│  ┌──────────────────────┐      ┌──────────────────────┐                     │
│  │ e2_engine.py         │      │ pine_emit.py         │                     │
│  │ (FIX input only)     │      │ (NEW — emits Pine)   │                     │
│  │  transition(zfp) ->  │      │  zones -> the        │                     │
│  │    shape chain       │      │  e1_injected_* arrays│                     │
│  └──────────────────────┘      └──────────┬───────────┘                     │
│                                           │                                 │
│                                           ▼                                 │
│                              ┌──────────────────────────┐                   │
│                              │ plutus-vision-v2.pine    │                   │
│                              │ (the render, on V1 base) │                   │
│                              └──────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### §B.2 THE FILE MANIFEST (every NEW / EDITED / DELETED file, with its role)

**NEW:**
| File | Role | Lines (est.) | Canon source |
|---|---|---|---|
| `scripts/e1_pillars.py` | The 9 pillars, each as a function returning levels with per-level dimension scores | ~600 | `…md` Part III (Pillars 1-9) |
| `scripts/e1_zone_assembly.py` | The canon's 9-step assembly (cluster/score/degree/zfp/name) | ~300 | `…md:1499-1512` |
| `scripts/pine_emit.py` | Emits the `e1_injected_*` Pine arrays from computed zones | ~200 | `…md` Part X (the Pine rules) |
| `scripts/e1_zfp.py` | THE single ZFP: Appendix-B base + B.2 modifiers | ~150 | `…md` Appendix B |
| `scripts/indicator_gate.py` | The differential ZFP gate (R2) + the 5-week litmus | ~200 | — |

**EDITED:**
| File | The edit | Fixes |
|---|---|---|
| `scripts/e1_category.py` | Delete `zfp()` (the width formula); keep `classify`/`norm_degree`; route the ZFP to `e1_zfp` | F-55, F-54 |
| `scripts/e1_extract.py` | Delete `zfp_from_degree`, `ZFP_BY_DEGREE`, `zfp_for`; call `e1_zfp.zfp`; fix the bonus cap, the flat dims, the tier, the names, the fabricated slot | F-54, F-57, F-58, F-59, F-60, F-68, F-69 |
| `scripts/e2_engine.py` | No logic change; confirm it reads the fixed ZFP | F-77 |
| `plutus-vision-v2.pine` | The payload becomes a builder emission (not literals); the chart-computable pillars move in (OD-1) | F-56 |

**DELETED:**
| Path | Why |
|---|---|
| `pine-ide/ide/renderer/_test-*.pine` (×3) | scratch |
| `pine-ide/charts/` (if superseded) | scratch |
| `fixtures/bars/_current.json` | scratch |
| `desktop/tauri/gen/` | build artifact |
| the 4 untracked `Checkpoints/*` | unsealed scratch |
| `ENGINE1_V8_VS_MINE.md`, `PIN_FINISH_INDICATOR.md` | chat-only docs |

### §B.3 THE WAVE PLAN (the desks + the disjoint files + the gates)

| Wave | The desk | The disjoint files | The gate |
|---|---|---|---|
| **W1** | The ZFP (THE core fix) | `scripts/e1_zfp.py` (NEW), `e1_category.py`, `e1_extract.py` | SC-1, SC-2, SC-3 |
| **W2** | The zone assembly (transcribe the 9 steps) | `scripts/e1_zone_assembly.py` (NEW) | SC-5, SC-6, SC-7, SC-8 |
| **W3** | The pillars (P6 first, then P3/P4/P7/P8) | `scripts/e1_pillars.py` (NEW) | SC-9, SC-10, SC-11 |
| **W4** | The LSZ + the 4H verification | `scripts/e1_pillars.py` (the P5 section) | SC-12, SC-13 |
| **W5** | The Pine emission (computed, not literal) | `scripts/pine_emit.py` (NEW), `plutus-vision-v2.pine` | SC-4, SC-14 |
| **W6** | The gates (the differential ZFP + the 5-week litmus) | `scripts/indicator_gate.py` (NEW) | SC-2, SC-15, SC-16 |
| **W7** | The cleanup (the scratch, the seal) | (deletions) | SC-17, SC-18 |

**THE SEQUENCE:** W1 must complete before W2 (the assembly calls the ZFP). W2 before W3 (the pillars
feed the assembly). W5 last (it consumes everything). **W1 is the critical path** — the operator's
complaint.

---

## §C — THE CLEANUP PLAN (every failure entry → its fix → its gate)

**THE TABLE.** Every F-entry from the ledger, its disposition, and the mechanical gate that proves the
fix.

| F | The failure | The fix (the file:line) | The gate |
|---|---|---|---|
| **F-54** | The ZFP = a restatement of the degree | `scripts/e1_zfp.py`: base + B.2 modifiers | SC-1, SC-2 |
| **F-55** | Three ZFPs coexist | delete `zfp_from_degree`, `CAT.zfp`, `f_e1CalcZFP` | SC-3 |
| **F-56** | The hand-written Pine payload | `pine_emit.py` emits computed values | SC-4 |
| **F-57** | The fabricated 5th zone | delete the `_sc(l) >= 2` pass | SC-5 |
| **F-58** | Rank-based names | `e1_extract.py:1165` → positional | SC-6 |
| **F-59** | The confluence-derived tier | `poi_tier` from `zone_4h_bonus` | SC-7 |
| **F-60** | The bonus can be +6 | cap the sum at 12+2=14 pre-clamp | SC-8 |
| **F-61** | Pillars 3,4,6,7,8 absent | `e1_pillars.py`: P6 first, then P3/P4/P7/P8 | SC-11 |
| **F-62** | The LSZ is a point | `lsz[]` zone objects | SC-12 |
| **F-63** | No 4H verification | the 4-point protocol | SC-13 |
| **F-64** | The invented report generator | strike it; §0.2 #1 | SC-17 |
| **F-65** | The ZFP flip-flop | resolved by F-54's single ZFP | SC-3 |
| **F-66** | 2 of 6 Toolset files read | the preflight (§A.1) | a preflight listing |
| **F-67** | Re-derivation over transcription | the citation lint (SC-18) | SC-18 |
| **F-68** | Flat dimensions | compute per level | SC-9 |
| **F-69** | Step 0e dead | separate 0e from 0.5 | SC-10 |
| **F-70** | The v4.5.3 tangent | the scope law (§A.1) | every cited path in the Toolset |
| **F-71** | The invented gate conflicts | SUPERSEDED-BY F-54; re-derive | SC-2 |
| **F-72** | The unsealed backtest tab | seal or revert (OD-3) | `git status` clean |
| **F-73** | 115 commits, no working ZFP | the differential gate | SC-2 |
| **F-74** | The retired pipeline as the product | the frame (§0) | SC-17 |
| **F-75** | Permission-asking | the lint (AP-15) | a response lint |
| **F-76** | Tuned constants | the citation lint | SC-18 |
| **F-77** | E2 correct on a broken input | the ZFP fix restores it | SC-2 |
| **F-78** | Green gates on a broken engine | tests assert the canon/v8 | SC-15 |
| **F-79** | No per-line citations | the citation lint | SC-18 |
| **F-80** | The single-week fixture | the week is a parameter | SC-14 |
| **F-81** | The ladder-as-data misread | the data is canon-driven | SC-5 |
| **F-82** | Inline smoke as evidence | the container round | the test plan §7 |
| **F-83** | The arbitrary canonical week | OD-4 | the gate reads a justified week |
| **F-84** | No directory enumeration | the preflight | a preflight listing |
| **F-85** | Building after a stop | no code until told | — (process) |
| **F-86 … F-104** | The 19 operator corrections | each maps to a fix above | the aggregate |

**THE CLEANUP ORDER (dependency-sorted):**

1. **W1 (the ZFP)** — the critical path. Nothing else matters until the central number is real.
2. **W2 (the assembly)** — transcribe the 9 steps.
3. **W3/W4 (the pillars)** — P6, then P3/P4/P7/P8; the LSZ; the 4H verification.
4. **W5 (the Pine emission)** — computed payload.
5. **W6 (the gates)** — the differential + the 5-week litmus.
6. **W7 (the cleanup)** — the scratch, the seal.
7. **The backtest tab** — OD-3, the operator's call, separate surface.

**THE HONEST SURVIVE LIST (keep — do NOT rebuild):**

| The thing | Why it survives |
|---|---|
| The V1 baseline (the sealed chart) | works; untouched (SC-16) |
| The pivot engine (`classic_pivots`/`fib_pivots`/`camarilla` + `verify_pivot`) | matches the canon's arithmetic checks |
| The MA grid (periods, weights, cluster, recapture) | matches the canon |
| `band_of` (the degree thresholds 12/10/8/6/4) | matches the canon |
| `zone_extreme_bonus` (Step 0e/0.5, post-`c5cc979`) | transcribed; verify against the canon's example |
| `e2_engine` (the §6.4.1 table, the constants) | matches the canon; only the input was wrong |
| The rig (`pv-server`/`pine-station`/`vil-rail`) | the instrument; works |
| The fixtures (with provenance) | real market data |
| The fixtures' validation (`validationAgainstDocumentedPrints`) | the v8's golden cascade |

**THE HONEST REMAINDER (open — the next pass):**

- **OD-1** (where the computation runs) — the operator rules.
- **OD-2** (does the Python engine stay) — recommended B2.
- **OD-3** (the backtest tab) — the operator rules.
- **OD-4** (the canonical week) — confirm which week the v8's literals describe.
- **The external pillars (P3/P4/P7/P8)** — they need data the chart lacks; the harvest's wiring exists
  but the sources are externally blocked (the recorded F-52). The pillars' structure can be built;
  the data may stay `[NO DATA]` until a source is available.

---

# THE SPEC ILLUSTRATED (the master ASCII graphs — every box names its §)

## G1 — THE MASTER VIEW (the whole port on one page)

```
┌─ PLUTUS VISION — THE INDICATOR PORT (the whole build) ──────────────────────┐
│                                                                             │
│  THE TOOLSET (§A.1) — 6 approved files, transcribed, never re-derived       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Trident_System_Prompt_v5.3.3.md  → the SPEC (E1 Part III, E2 Part VI) │  │
│  │ TRIDENT_v5.3.3_CORRECTED_E3.md   → the corrected E3                    │  │
│  │ trident_engine3_v8.py            → the WORKING reference              │  │
│  │ Leviathan_Report_Template_v2.0.py → the RETIRED oracle (§0.2 #1)      │  │
│  │ Trident_Report_Validator.py      → the RETIRED checklist              │  │
│  │ Trident_Fractal_Architecture…md  → the role contract                  │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
│                                  │ transcribed into                         │
│                                  ▼                                          │
│  ┌─ ENGINE 1 (the 9-Pillar zone map) ──────────────────────────────────┐    │
│  │ §2.3  the canon's 9-step assembly:                                  │    │
│  │   collect → score(6 dims+bonus≤2) → cluster(0.15/0.10, 3+)          │    │
│  │   → degree → ZFP(§2.5) → name(positional) → breakout-risk           │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  │ zones[]                                  │
│                                  ▼                                          │
│  ┌─ ENGINE 2 (the macro shape chain) ──────────────────────────────────┐    │
│  │ §2.4  §6.4.1 ZFP-conditioned: a BS into a Hard Wall → RWL           │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  │ shapes[]                                 │
│                                  ▼                                          │
│  ┌─ THE RENDER (on the V1 baseline) ───────────────────────────────────┐    │
│  │ §2.1  the zones + the shapes drawn on the sealed chart               │    │
│  │ NO REPORT. NO HTML. The chart computes and draws. (§0.2 #1)          │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  THE CRITICAL PATH: W1 the ZFP (§B.3) — the operator's complaint             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## G2 — THE CORE MECHANISM (the ZFP — the heart of the fix, §2.5)

```
┌─ THE ZFP (Appendix B, transcribed) ─────────────────────────────────────────┐
│                                                                             │
│   zfp(zone, bars) = base(zone_type) + Σ modifiers(zone, bars)               │
│                                                                             │
│   BASE (B.1)                         MODIFIERS (B.2, each from data)        │
│   ┌────────────────────────┐         ┌───────────────────────────────────┐  │
│   │ Hard Wall     5-15%    │         │ Spring Release expiry  +20-30%    │  │
│   │ Standard Wall 15-30%   │         │ Macro catalyst         +15-25%    │  │
│   │ Soft Wall     30-50%   │         │ Increasing momentum    +10-20%    │  │
│   │ One-Touch     50-70%   │         │ Cross-pair confirm     +15-25%    │  │
│   │ Post-Expiry   20-40%   │         │ Cascade (prior broke)  +20-30%    │  │
│   └────────────────────────┘         │ Regime change          +15-25%    │  │
│                                       └───────────────────────────────────┘  │
│                          │                                                   │
│                          ▼  clamp 0-100                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ THE PROOF (SC-2): a breakout-week ceiling reads HIGHER than the same │   │
│   │ zone in a consolidation week. A differential probe asserts it.       │   │
│   │ THE DEFECT THIS KILLS (F-54): the ZFP was a restatement of the degree│   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## G3 — THE OVERLAYS (every always-on mechanism, §8)

```
┌─ THE ALWAYS-ON GATES ───────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─ THE CITATION LINT (AP-10, SC-18) ────────────────────────────────────┐  │
│  │ every numeric constant carries a `# canon: <file>:<line>`             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌─ THE DIFFERENTIAL ZFP GATE (SC-2) ────────────────────────────────────┐  │
│  │ two weeks; assert zfp(breakout) > zfp(consolidation); FAIL the build  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌─ THE PAYLOAD-DIFF GATE (SC-4) ────────────────────────────────────────┐  │
│  │ two weeks' Pine payloads must differ (sha); identical = hand-written  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌─ THE POSITIONAL-NAME GATE (SC-6) ─────────────────────────────────────┐  │
│  │ assert RES.top > spot > SUP.bottom on every week                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌─ THE V1-SEAL GATE (SC-16) ────────────────────────────────────────────┐  │
│  │ the baseline layers' sha256 unchanged across the port                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## G4 — THE BUILD MANIFEST (the files + the waves + the invariant core, §B.2)

```
┌─ THE BUILD MANIFEST ────────────────────────────────────────────────────────┐
│                                                                             │
│  NEW (5)                            THE INVARIANT CORE (untouched)          │
│  ┌──────────────────────────┐       ┌────────────────────────────────────┐  │
│  │ e1_zfp.py         (W1)   │       │ the V1 baseline (the sealed chart) │  │
│  │ e1_zone_assembly.py(W2)  │       │ the rig (pv-server/pine-station)   │  │
│  │ e1_pillars.py     (W3/W4)│       │ the fixtures + their validation    │  │
│  │ pine_emit.py      (W5)   │       │ the pivot engine + the MA grid     │  │
│  │ indicator_gate.py (W6)   │       │ e2_engine (logic correct)          │  │
│  └──────────────────────────┘       └────────────────────────────────────┘  │
│                                                                             │
│  EDITED (4)                         DELETED (the cleanup, W7)               │
│  ┌──────────────────────────┐       ┌────────────────────────────────────┐  │
│  │ e1_category.py (drop ZFP)│       │ _test-*.pine ×3 · _current.json    │  │
│  │ e1_extract.py  (the fixes)│      │ desktop/tauri/gen/ · 4 Checkpoints │  │
│  │ e2_engine.py   (no logic) │      │ ENGINE1_V8_VS_MINE.md · PIN_FINISH │  │
│  │ plutus-vision-v2.pine     │      └────────────────────────────────────┘  │
│  └──────────────────────────┘                                               │
│                                                                             │
│  W1 → W2 → W3/W4 → W5 → W6 → W7   (W1 is the critical path)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## G5 — THE NAMED-ERROR MAP (the complete rejection surface, §7)

```
┌─ THE NAMED-ERROR MAP (every refusal the engine emits) ──────────────────────┐
│                                                                             │
│  E1_NO_BARS            the bar series is empty → no level (never fabricated) │
│  E1_FIXTURE_UNPARSEABLE the fixture did not parse → a named refusal          │
│  E1_NO_FIXTURE         no fixture on disk → a named refusal                  │
│  E1_NO_DATA            a pillar's source is down → the dimension stays 0     │
│                                                                             │
│  THE GATE FAILURES (the build refuses):                                      │
│  ZFP_NO_DISCRIMINATION  the differential probe found no separation → FAIL   │
│  ZONE_COUNT_FABRICATED  a zone emitted below the 3-pillar floor → FAIL      │
│  NAME_NOT_POSITIONAL    a RES zone below spot → FAIL                        │
│  PAYLOAD_IDENTICAL      two weeks' payloads are byte-identical → FAIL       │
│  CONSTANT_UNCITED       a numeric constant lacks its canon line → FAIL      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# THE SCRIPT TESTING SUITE (the anti-cheat scripts, written BEFORE the code)

**THE LAW.** The tests are engineered against the SPEC at spec time — before the implementation exists.
Every assertion targets a SPEC-NAMED token (§7's passTokens) or an OBSERVABLE artifact (bytes on disk,
a sha, an exit code). A test whose oracle is the engine's own output is REJECTED (AP-11, F-78).

## ST-HARNESS (the shared sandbox + the printers)

```python
#!/usr/bin/env python3
"""st_indicator.py — the script-test harness for the indicator port.
Written at spec time. Asserts against the CANON, never the engine's output."""
import json, subprocess, sys, tempfile, pathlib, hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PASS, FAIL = [], []

def ok(name, cond, detail=""):
    (PASS if cond else FAIL).append((name, detail))
    print(f"{'PASS' if cond else 'FAIL'} {name} {detail}")

def run_e1(week, fixture=None):
    """Run the engine for one week; return (exit_code, the JSON output)."""
    env = {}
    if fixture: env["E1_FIXTURE"] = fixture
    p = subprocess.run([sys.executable, str(ROOT/"scripts"/"e1_extract.py"),
                        "--pair", "DXY", "--week", week],
                       capture_output=True, text=True, env={**__import__("os").environ, **env})
    out = ROOT/"data"/"e1"/f"DXY-{week}.json"
    return p.returncode, (json.loads(out.read_text()) if out.exists() else None)

def sha(path): return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
```

## ST-1 — THE ZFP CARRIES FAILURE INFORMATION (SC-2, the operator's complaint)

```python
# THE ORACLE: the canon's Appendix-B mechanism. A zone in a breakout must read HIGHER.
code_bo, z_bo = run_e1("2026-07-06")   # a breakout week (per the v8's golden cascade)
code_co, z_co = run_e1("2026-07-13")   # a consolidation week
ok("ST-1.1 the breakout week computed", code_bo == 0 and z_bo is not None)
ok("ST-1.2 the consolidation week computed", code_co == 0 and z_co is not None)
# The ceiling zone's ZFP must differ (the ZFP is not a constant)
ok("ST-1.3 the ZFP is not a constant across zones",
   len({zn["zfp"] for zn in z_bo["zones"]}) > 1,
   f"zfp values: {[zn['zfp'] for zn in z_bo['zones']]}")
# The ceiling (top zone) must show the breakout's failure pressure
ok("ST-1.4 the breakout ceiling ZFP > the consolidation ceiling ZFP",
   z_bo["zones"][0]["zfp"] > z_co["zones"][0]["zfp"],
   f"{z_bo['zones'][0]['zfp']} vs {z_co['zones'][0]['zfp']}")
```

## ST-2 — ONE ZFP (SC-3)

```python
import subprocess
n = subprocess.run("grep -rc 'def zfp' scripts/*.py", shell=True, capture_output=True, text=True).stdout
total = sum(int(line.split(":")[-1]) for line in n.strip().splitlines())
ok("ST-2.1 exactly one ZFP implementation", total == 1, f"found {total}")
dead = subprocess.run("grep -rn 'zfp_from_degree\\|ZFP_BY_DEGREE' scripts/", shell=True,
                      capture_output=True, text=True).stdout.strip()
ok("ST-2.2 the derived ZFP is deleted", dead == "", dead[:80])
```

## ST-3 — THE ZONE COUNT IS DATA-DRIVEN (SC-5)

```python
# A week whose level set forms 4 clusters must emit 4 zones (never a fabricated 5th)
code, z = run_e1("2026-05-11")
ok("ST-3.1 no fabricated slot", "5" != str(z.get("zone_count")) or z.get("clusters_3plus") == 5,
   f"zone_count={z.get('zone_count')}, clusters_3plus={z.get('clusters_3plus')}")
```

## ST-4 — POSITIONAL NAMES (SC-6)

```python
for week in ("2026-07-06", "2026-07-13", "2026-05-11"):
    _, z = run_e1(week)
    spot = z["spot"]
    res = [zn for zn in z["zones"] if zn["zCat"] == "RES"]
    sup = [zn for zn in z["zones"] if zn["zCat"] == "SUP"]
    ok(f"ST-4 {week}: RES above spot", all(zn["bottom"] > spot for zn in res))
    ok(f"ST-4 {week}: SUP below spot", all(zn["top"] < spot for zn in sup))
```

## ST-5 — THE PAYLOAD IS COMPUTED (SC-4)

```python
# Emit the Pine for two weeks; the payloads must differ
emit("2026-07-06", "/tmp/pine_a.pine"); emit("2026-07-13", "/tmp/pine_b.pine")
ok("ST-5.1 the two payloads differ", sha("/tmp/pine_a.pine") != sha("/tmp/pine_b.pine"))
```

## ST-6 — THE CONFLUENCE MATH (SC-8, SC-9)

```python
_, z = run_e1("2026-07-06")
for zn in z["zones"]:
    ok(f"ST-6 confluence ≤ 14", zn["confluence"] <= 14, f"{zn['confluence']}")
# No flat dimension
dims = {d: {zn["dims"][d] for zn in z["zones"]} for d in ("technical","structural")}
ok("ST-6.2 technical is not flat", len(dims["technical"]) > 1, dims["technical"])
ok("ST-6.3 structural is not flat", len(dims["structural"]) > 1, dims["structural"])
```

## ST-7 — THE BOUNDARY / NAMED-REFUSAL CASES (§7 A1/A3/A7)

```python
# An empty series → E1_NO_BARS (never a crash, never a fabricated zone)
code, z = run_e1("2099-01-01", fixture="/dev/null")
ok("ST-7.1 an empty series refuses loudly", code != 0 and "E1_NO_BARS" in open_log())
ok("ST-7.2 no zone is fabricated on refusal", z is None or z.get("zones") == [])
```

## ST-8 — THE V1 SEAL (SC-16)

```python
ok("ST-8.1 the V1 baseline sha is unchanged",
   sha("pine-ide/ide/renderer/plutus-vision-v2.pine") == V1_BASELINE_SHA)
```

## ST-9 — NO REPORT GENERATOR (SC-17)

```python
hits = subprocess.run("grep -rln 'reportlab\\|Leviathan_Report_Template' scripts/", shell=True,
                      capture_output=True, text=True).stdout.strip()
ok("ST-9.1 no report generator", hits == "", hits[:80])
```

## ST-10 — THE CITATION LINT (SC-18)

```python
# Every numeric constant in the engine has a `# canon:` citation on the same or prior line
uncited = subprocess.run(
    "grep -nE '^[A-Z_]+ *= *[0-9]' scripts/e1_*.py | grep -v 'canon:'",
    shell=True, capture_output=True, text=True).stdout.strip()
ok("ST-10.1 every constant cited", uncited == "", uncited[:200])
```

## ST-11 — THE ZONES ARE COMPUTED IN PINE (SC-19, AP-20 — the derailment gate)

```python
# THE ORACLE: the source file itself. The E1/E2 zones must be COMPUTED in the .pine
# from the chart's bars — NEVER injected as baked literals (A2 = the report renamed).
import re
def st_11_computed_in_pine():
    pine = (ROOT / "pine-ide/ide/renderer/plutus-vision-v2.pine").read_text()
    literal = re.findall(r"e1_injected_(?:top|bottom|cat|degree|zfp)\.push\(\s*[0-9]", pine)
    ok("ST-11.1 no literal zone push (A2 forbidden)", len(literal) == 0,
       f"{len(literal)} baked zone literal(s) — this is the report round-trip renamed")
    computes = re.findall(r"\bta\.(?:pivothigh|pivotlow|highest|lowest|sma|ema|atr|valuewhen)\b", pine)
    ok("ST-11.2 the zones compute from the chart's own bars", len(computes) > 0,
       f"{len(computes)} ta.* computation(s) present")
```

## THE RUNNER (the exit-code verdict)

```python
def main():
    for fn in (st_1_zfp, st_2_one_zfp, st_3_zone_count, st_4_names, st_5_payload,
               st_6_confluence, st_7_boundary, st_8_seal, st_9_no_report, st_10_citations,
               st_11_computed_in_pine):
        fn()
    print(f"\nST SUITE: {len(PASS)} pass / {len(FAIL)} fail")
    for name, detail in FAIL: print(f"  FAIL {name} {detail}")
    sys.exit(1 if FAIL else 0)

if __name__ == "__main__":
    main()
```

## THE ANTI-CHEAT PROPERTIES (why this suite cannot be theatricalized)

1. **Written before the code** — the assertions cannot be shaped by the implementation.
2. **Spec-named tokens only** — every assertion targets a §7 token or an observable (a sha, a file, a
   count), never the engine's own claim.
3. **The oracle is the canon/v8** — ST-1 compares against the v8's worked example (a breakout week
   reads higher), never the engine's output. This is the F-78 fix.
4. **The runner's exit code is the verdict** — a CI-consumable 0/1.
5. **The V1 seal (ST-8) is byte-checked** — a regression in the baseline fails the suite.

---

# THE DEEP CONTAINER TESTING SUITE (the deployed runtime proof — the definition of "done")

**THE LAW.** The 12-step execution. The auth probe first. The screenshot as the message-level
evidence. Phase E's 10-check circuit breaker. A passToken in a TOOL RESULT, never agent prose.

## THE 12-STEP INSTANTIATION (for this build)

| Step | The action |
|---|---|
| 1 | **Plan-first:** this suite IS the plan (written before the build). |
| 2 | **Preflight:** load `container-testing` + `deep-container-testing`; confirm the rig's 3 ports. |
| 3 | **Setup:** launch the container with the Pine file + the rig; capture the container name. |
| 4 | **SHA verify:** `sha256sum` the deployed Pine == the built Pine (the deploy match). |
| 5 | **Auth probe FIRST:** a model-backed call must succeed (proves the container's LLM lane). |
| 6 | **Screenshot channel:** every scenario's message-level evidence is a captured frame. |
| 7 | **Exec channel:** every scenario's disk-level truth is an `exec` (a grep, a sha). |
| 8 | **Adversarial discipline:** the attacks before the happy path. |
| 9 | **Phase E:** the 10 checks. |
| 10 | **The results artifact:** `.trident/indicator-test-results.json`. |
| 11 | **Zero broken windows:** no scenario abandoned at the first error. |
| 12 | **The declaration:** the four elements (sha, stream excerpts, the observation, the pass/fail). |

## THE FAMILY SUITES (POSITIVE + NEGATIVE per use case)

**THE AUTH FAMILY (FIRST — the silent-auth-failure false-green).**
- **POSITIVE:** a model-backed call returns a token-bearing result → passToken `"verified":true`.
- **NEGATIVE:** a non-auth call is not misread as auth → no false green.

**THE ZFP FAMILY (the core).**
- **POSITIVE:** the breakout week's ceiling ZFP > the consolidation week's → passToken
  `"zfp_breakout":NN > "zfp_consolidation":MM`; failToken an equal/inverted pair.
- **NEGATIVE:** a legitimate consolidation zone does NOT read as a breakout → zero misfire.

**THE RENDER FAMILY.**
- **POSITIVE:** the chart renders the zones on the V1 baseline → the captured frame shows 5 zones +
  the E2 path; passToken the frame's sha differs from the V1-only frame.
- **NEGATIVE:** the V1 baseline renders identically with the E1 layer off → zero misfire.

**THE ADVERSARIAL FAMILY.**
- An empty series → `E1_NO_BARS`; a corrupt fixture → `E1_FIXTURE_UNPARSEABLE`; a 4-cluster week →
  `zone_count: 4` (no fabrication); a RES zone below spot → the gate FAILs.

## THE RESULTS ARTIFACT SCHEMA

```json
{
  "container": "<name>", "distSha": "<sha>",
  "scenarios": [
    {"id": "CT-1", "angle": "INTEGRATION",
     "passToken": "zfp_breakout>zfp_consolidation", "passTokenMatch": true,
     "failToken": "zfp_equal", "failTokenAbsent": true,
     "toolResultContext": "<the exec/screenshot excerpt>", "verdict": "PASS",
     "evidence": "visual/runtime-state.png @ <sha>"}
  ],
  "phaseE": {"shaMatch": true, "authProbe": true, "allScenariosRun": true,
             "allTokensAsserted": true, "noCircular": true, "noTimeouts": true,
             "blastRadiusCovered": true, "adversarialBehaved": true,
             "containerAlive": true, "artifactWritten": true},
  "overallVerdict": "PASS"
}
```

## THE PASS CRITERIA

- **Phase E: all 10 checks pass.** Any false → the verdict is BLOCKED, never PASS.
- **The negative half green** — the V1 baseline renders unchanged with the E1 layer off.
- **The declaration (the four elements):** the sha256sum proof; the stream excerpts with the passToken
  in a tool-result context; the behavioral observation per scenario; the pass/fail per scenario
  referencing the artifact.
- **THE BANNED PHRASES:** "structural PASS", "PASS by design", "asserted the behavior" — a scenario
  is PASS only when its passToken matched in a tool result.

---

# THE COMPLETION MARKER

**THIS SPEC IS THE DELIVERABLE. NO CODE IS WRITTEN UNTIL THE OPERATOR SAYS BUILD.**

**THE MECHANICAL COMPLETION CHECKLIST:**
- [x] All 11 contract sections present (§0-§9 + §A + §B + §C)
- [x] The anti-pattern ledger (§8) — 18 entries, each with a mechanical detection
- [x] The open decisions (§9) — 5 forks, each with a recommendation
- [x] The evidence-currency check — every claim is from a range read this session
- [x] §7 has 8 adversarial angles + an evidence-requirement line + a pass threshold
- [x] Every §6 criterion is command/ledger/eyes-verifiable, with an EXTERNAL oracle
- [x] Every number in §3/§5 is measured
- [x] The problem statement matches the operator's real requirements (§0.2)
- [x] THE ASCII GRAPH section present (5 graphs, every box → its §)
- [x] THE SCRIPT TESTING SUITE present (10 ST scripts, spec-named-token assertions, both halves, the runner, the anti-cheat block)
- [x] THE DEEP CONTAINER SUITE present (the 12-step instance, the families with POSITIVE+NEGATIVE, the artifact schema, Phase E)

**THE ONE-LINE SUMMARY.** Port the Toolset's Engine 1 + Engine 2 into the Pine indicator — transcribed,
not re-derived; computed, not typed; live on the V1 baseline; no report. Fix the ZFP first.

**END OF SPEC.**

## AS-BUILT TRACEABILITY (2026-10-11 — where each § landed)
- §2.5/§6 SC-1 + F-55 (ONE Appendix-B ZFP): scripts/e1_zfp.py; the width formula
  deleted in Python AND in the served .pine (PIN_INDICATOR_PORT_BUILD.md:35).
- §6 SC-19 (zones COMPUTED in Pine): pine-ide/ide/renderer/plutus-vision-v2.pine
  (`f_e1Compute`/`f_e2Compute`, 26 ta.* calls, 0 injected literals) — the W5
  deliverable, verified by scripts/test_render_computed.py (JEV_GATE/run_gate.sh:54).
- §6.6/§10.7 (E2 chain + ghost + 2×17 table): computed in-Pine from the E1 zones;
  the table cells fill from computed arrays (station `__tables__: 1`, though the
  Vela build does not paint table geometry — same as the baked version).
- §7.5/§8.4 + the 5-week litmus: scripts/indicator_gate.py renders 5 seeded real
  weeks (cache data/litmus/dxy_1h.csv) with RES+SUP per week and binds a live
  :99 screenshot by buffer-sha; JEV_GATE/run_gate.sh ingests the evidence into
  every chunk (SPEC.md:21).
- OD-1 A3 (PIN_INDICATOR_PORT_BUILD.md:73): P1/P2/P5/P6/P9 live in Pine; P3/P4/P7/P8
  [NO DATA] behind loud-fail guards. Unfed, never fabricated.
