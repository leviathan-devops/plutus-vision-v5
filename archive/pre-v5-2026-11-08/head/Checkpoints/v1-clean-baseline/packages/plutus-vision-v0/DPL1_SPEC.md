# BUILD SPEC ARTIFACT — PLUTUS VISION v0
Target: TradingView Pine v6 indicator (the Plutus Vision chart layer)
Status: PLANNING · Artifact Type: BUILD_SPEC (Layer 1 Prompt)

## §1 PROBLEM STATEMENT (verbatim requirements)
"The SMC and the three liquidity indicators, all four together, is the
supply-demand liquidity from the fractal architecture and Plutus Canon…
we can literally just bundle that together." · "make sure that its clean
that it fills the whole screen… make some minor cleanup and polishing to
the liquidity indicators when theyre all fused together but beyond that
dont touch anything." · "assemble production grade components > build
from scratch."

## §2 CORE INSIGHT
E1 computes zones as DATA; nothing renders them as GEOMETRY. The four
LuxAlgo open-source indicators already render four of E1's constructs
(SMC structure/O B/FVG, Liquidity Sweeps, Liquidity Voids, B/S Pools).
The build is therefore an ASSEMBLY: merge + rename + budget, zero new
logic. Non-negotiables: zero behavior change in the merge; every
threshold keeps its canon rationale; no claim without a chart.

## §3 MEASURED BASELINE (this turn)
- corpus: ~/JARVIS_WORKSPACE/Shared_Workspace/luxalgo-smc/sources/ 48 files,
  14,234 lines total; core 4 = SMC 847L, SWEEPS 160L, VOIDS 112L, POOLS 347L
- core SHAs: a8046ad353c1b495 · c81921370a81425e · e2a5223d726f43fa ·
  6cc2fd6ea98cfa77
- collisions: `type bar` ×2 (voids:37, bsliq:59); 7 shadowed globals
  (atr,b,i,mode,per,ph,pl); object demand 2,000 boxes vs Pine ceiling 500
- prior art: trident_v8_multi_pair_template.pine 792L + trident_phase2.pine 686L
- PLUTUS tree @ e99377f (plutus/main)

## §4 SCOPE
1-6 merge (renames, decl, budget) · 7 voids-off · 8 full-width check ·
9 chart defaults · 10 compile 0 · 11 starvation 4/4 · 12 behavior diff 0 ·
13 attribution retained · 14 save as Plutus Vision v0 · 15 parity ·
16 manifest · 17 Tier-1 batch 1 · 18 CISD↔E3 TP calibration ·
19 session base-rate validation · 20 license ruling + v1 timing.

## §5 SUCCESS CRITERIA (command/eyes-verifiable)
| ID | Criterion | Check |
|---|---|---|
| SC-1 | no `type bar` twice | grep -c "^type bar" merged = 0 |
| SC-2 | compiles | TradingView save 0 errors |
| SC-3 | all four draw | EURUSD H4 render, 4 groups on |
| SC-4 | no logic drift | behavior diff 0 non-identifier deltas |
| SC-5 | provenance intact | grep -c LuxAlgo merged >= 1 |
| SC-6 | manifest honest | no UNFILLED markers |

## §6 ANTI-PATTERN LEDGER
ARCHITECTURAL: a second indicator() decl (detect: grep -c ^indicator = 1) ·
per-subsystem 500 caps (detect: sum of declared caps > 500).
BEHAVIORAL: a formula "improved" while renaming (detect: behavior diff != 0) ·
a subsystem silently starving (detect: its drop counter > 0 while a peer = 0).
PROCESS: claiming a chart without a chart (detect: no parity artifact) ·
stripping the CC header (detect: grep -c LuxAlgo = 0).

## §7 CONTAINER/RUNTIME TEST PLAN (plan-first)
Angles >=5, each with tool-result-bound tokens:
| Angle | Prompt | passToken | failToken |
|---|---|---|---|
| COMPILE | paste, save | editor `0 errors` | any error string |
| RENDER | EURUSD H4 | 4/4 groups visible | a group missing |
| STARVATION | dense chart | all 4 counters > 0 | any counter = 0 |
| PARITY | v0 vs 4 originals | same drawings | any divergence |
| LICENSE | grep header | `LuxAlgo` | absent |
Evidence: the chart screenshot + the manifest counters. Happy path LAST.

## §8 OPEN DECISIONS
License fork (derivative vs clean-room; default derivative+attribution) ·
v1 export channel (Pine cannot read local files; default later) ·
budget split (default 200/125/100/75) · Tier-1 order (default EQH/EQL,
CISD, Trap) · place (default e1/vision/).

## §9 SPEC ILLUSTRATED
See PLUTUS_VISION_V0_BLUEPRINT.md (1057L) §0-§20 for the master graph,
the mechanism pseudocode, the component tree, and the full rename table.

## §10 SCRIPT + CONTAINER SUITES
See the blueprint's §7 verdict block + §21 runbook; the wave-plan's
test ids are the G3 surface. Lexcheck is instrument I-1; the starvation
probe is I-3; the behavior diff is I-4.
