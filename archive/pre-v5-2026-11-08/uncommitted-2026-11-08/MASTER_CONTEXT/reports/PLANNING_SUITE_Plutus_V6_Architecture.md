# PLANNING SUITE — PLUTUS V6 ARCHITECTURE (Kev + Limite + TensorTrade on pi harness)
**Classification:** ARCHITECTURAL (complete runtime replacement)
**Date:** 2026-09-17 · **Baseline:** v4.5.3_CLEAN_BASELINE · **Harness:** pi (earendil-works/pi, TypeScript, 108k★) with MiMoCode memory system ported in · **NOT headless** (pi TUI)

## §0 READ RECEIPTS
- brainstorming: READ — HARD GATE (intent approved: "we don't need a coding agent to run a trading agent")
- blueprinting: READ — DIFFERENTIAL (what MiMoCode does NOT do = the spec for pi+Kev)
- focus: READ — MEASURE >> WRITE
- fable-plan: READ — PARALLEL FAN-OUT (8 forensic scouts dispatched)
- trident-problem-solving: READ — HARD BOUND (3 cycles)

## 1 THE INTENT
Replace the MiMoCode-based Plutus trading runtime with a Kev 0.6B + Limite 1B + TensorTrade pipeline running on a pi harness TUI. The primary Plutus agent (coding LLM) is ELIMINATED. The 583 doctrine cards become Kev's training data. The system is NOT headless — pi provides the visible TUI.

## 2 THE DIFFERENTIAL

| Existing | Does | Does NOT |
|---|---|---|
| MiMoCode/OMP | Coding agents, TTSR, sessions, subagent dispatch, TypeScript execution | Make trading decisions. Be fast. Be deterministic. |
| TS E1/E2/E3 pipeline | Zone detection, shape chains, trade mapping in code | Learn. Be portable. Run without Bun. |
| Kev 0.6B | State + typed questions → probability distributions. Single forward pass. ONNX. | Generate code. Compute math. Produce text. |
| Limite 1B | Competition-level math (74.25% BeyondAIME). 131k context. vLLM. | Make decisions. Classify. Score confidence. |
| TensorTrade | OMS + commission modeling + portfolio + walk-forward. Gymnasium env. | Make decisions. Compute geometry. Store doctrine. |
| pi harness | Agent loop, tool calling, TUI, state management. TypeScript. MIT. 108k★. Supply-chain hardened. | Coding (stripped). Subagent dispatch. |
| arsumbris KG | 649 doctrine cards, live-indexed, queryable. | Execute trades. Make decisions. Runtime queries. |

## 3 THE REDUCED CORE
ONE MECHANISM: a judgment loop on a pi TUI — market state enters, Kev produces probability distributions over 17 typed questions (4 calls), Limite computes 6 numeric queries, 8 deterministic gates consume both outputs, TensorTrade validates, a trade decision exits.

Derived laws:
1. Kev decides WHAT; Limite computes HOW MUCH; code gates accept/reject. Never reversed.
2. Doctrine is training data (offline), never a runtime query.
3. The TUI is the operator's window: every decision visible, every probability inspectable, every rejection explained.

## 4 THE MIGRATION MAP (from 93 MIGRATION cards + E1 audit + harness audit)

### E1: Zone/Pressure Detection → Kev Call 1 (5 questions)
| 4.5.3 function (file:line) | Kev question | Notes |
|---|---|---|
| candle-pressure.ts: 18 predicates | E1.Q4: pressure class? | Choice: [strong_dem...strong_sup] |
| zone-classification.ts: 24 predicates | E1.Q1: zone type? | Choice: [BoM, MoM, PHANTOM, LQZ, S_D] |
| obcv-engine.ts: bw/bf gates | E1.Q2: OBCV gate? | Noul: [pass, fail] |
| zone-pressure.ts: 28 predicates (lifecycle) | E1.Q3: mitigation? | Choice: [unmit, 1x, 2x, 3x_depleted] |
| zone-pressure.ts: fortress detection | E1.Q5: fortress? | Noul: [no, yes] |
| market-data-adapter.ts: bar decode | State constructor | Python renders bars → Kev state text |
| fetch-bars.ts: web data | Web-data agent | Jev computer use skills → TradingView |

### E2: Storyline → Kev Call 2 (4 questions)
| 4.5.3 function | Kev question | Notes |
|---|---|---|
| storyline-engine.ts: shape detection | E2.Q1: current shape? | Choice: [BS, WL, RWL, R, SS, consol] |
| storyline-engine.ts: day element | E2.Q2: day element? | Choice: [BS_day, WL_day, R_day, Recovery_day] |
| report-v452.ts: cascade validation | E2.Q3: cascade valid? | Choice: [valid, invalid, partial] |
| zone-pressure.ts: freshness ladder | E2.Q4: freshness? | Choice: [unmit, 1x_80, 2x_50, 3x] |

### E3: Trade Decision → Kev Call 3 (5 questions) + Limite (6 calls)
| 4.5.3 function | Replacement | Notes |
|---|---|---|
| trade-brain.ts: constructSetups | Kev E3.Q1: direction? | Choice: [long, short, no_trade] |
| trade-brain.ts: confidence scoring | Kev E3.Q2: quality? | Score: [F, C, B, A, A+] |
| trade-brain.ts: session filter | Kev E3.Q3: session valid? | Noul |
| sl-lmv.ts: SL computation | Limite L2: SL distance | zone_width + buffer |
| sl-lmv.ts: entry computation | Limite L1: zone geometry | width in pips |
| setup-gen.ts: RRR floor check | Gate: `if rrr < 2.5: reject` | Code, never a model |
| setup-gen.ts: TP computation | Limite L4: fib levels | 0.382/0.5/0.618/0.786/1.618 |
| trade-chaining.ts: Law-27 propagation | Gate: chain logic (verbatim port) | BFS, TP→entry |
| trade-dedup.ts: identity/merge/cap | Gate: dedup (verbatim port) | Session-free identity |

### PVE: Scoring → Kev Call 4 (3 questions)
| 4.5.3 function | Kev question |
|---|---|
| PVE confidence | PVE.Q3: confidence? Score: [F, C, B, A, A+] |
| PVE TP probability | PVE.Q1: TP probability? Score |
| PVE reachability | PVE.Q2: entry reachable? Noul |

### Harness: pi TUI Agent Loop
| 4.5.3 component | V6 replacement |
|---|---|
| report-v452.ts: main loop | pi agent loop (~150L Python) |
| report-v452.ts: report rendering | New: report generator (~100L) |
| — | New: TUI trading pane (~200L) |
| — | New: web-data agent (~600L, Jev computer use) |
| — | New: state constructor bridge (~200L) |

## 5 THE EVIDENCE
- 93 MIGRATION cards from the E2+E3 audit (768 lines, every card file:line anchored)
- E1 audit: 147 predicates across 6 lexicon machines → collapse into 5 Kev questions
- Harness audit: 3,867 lines TS → ~300 lines Python + pi TUI
- MPSE/Limite fusion design: Limite as math-spec layer with dual-compute verification
- V6 blueprint (524 lines) preserved at reports/Plutus_V6_Master_Blueprint_v1.md

## 6 THE APPROACH
Phase 1: pi harness skeleton + Kev ONNX + state constructor → golden week test
Phase 2: Limite vLLM deployment + math query wiring
Phase 3: Fine-tune Kev on 649 doctrine cards → A/B test
Phase 4: TensorTrade OMS + walk-forward + commission sensitivity
Phase 5: TUI trading pane + web-data agent → cutover

## 7 SUCCESS CRITERIA
1. ≥14/15 golden entries at ≤3p precision
2. All 38 forensic trades correctly classified
3. TensorTrade: profitable at 0.1% commission on unseen week
4. Decision latency <500ms (GPU)
5. Zero coding agent in the loop
6. TUI visible: every probability, every gate decision, every rejection reason

## 8 EXECUTION CHECKLIST
```
Phase 1:
  □ Clone pi, strip coding tools
  □ Port MiMoCode memory system (TypeScript→TypeScript)
  □ Install Kev ONNX (q4f16 for 4080)
  □ Write state constructor (bars→text, ~200L)
  □ Write 17 question templates
  □ Write 8 gates (~100L Python)
  □ Golden week: compare vs canon 15/15
Phase 2:
  □ Deploy Limite 1B on 4080 via vLLM
  □ Wire 6 math queries
  □ Verify: same numbers as TS pipeline
Phase 3:
  □ Generate training records from 649 cards
  □ Fine-tune Kev LoRA r=16
  □ A/B test on golden + forensic
Phase 4:
  □ Install tensortrade
  □ Wire TradeDecision → Exchange
  □ Commission sensitivity (0%, 0.1%, 0.2%)
  □ Walk-forward on unseen week
Phase 5:
  □ Build TUI trading pane (~200L)
  □ Build web-data agent (~600L, Jev computer use)
  □ Cutover decision
```

## 9 ANTI-PATTERNS
| Failure | Detection |
|---|---|
| Kev used for math | Limite handles ALL arithmetic |
| Kev edits E1/E2 data | Gate layer only READS Kev output |
| LLM in the gate layer | Gates are pure Python if/else |
| Doctrine at runtime | Training data generated OFFLINE |
| Randomness in inference | ONNX temperature=0 |
| Headless operation | pi TUI is the visible runtime |
| MiMoCode still in the loop | The harness is pi + Python |

## 10 OPEN DECISIONS
1. MiMoCode fork vs pi from scratch → **DEFAULT: pi + MiMoCode memory port** (both TS, copy-paste)
2. Kev fine-tune vs prompt-engine → **DEFAULT: prompt-engine first, fine-tune Phase 3**
3. Web-data agent: Jev computer use vs TradingView API → **DEFAULT: Jev computer use** (operator specified)
4. TUI pane: pi-native vs Electron → **DEFAULT: pi-native** (keep it simple)

## 11 THE RESIDUAL
- Kev 0.6B OOD accuracy 0.620 — fine-tuning pushes to ~0.75+ (UNPROVEN until Phase 3)
- VLM visual validation (screenshot zone confirmation) has NO Kev replacement — needs the web-data agent or a vision model
- TV chart drawing/rendering is dropped by design (report-only feature in 4.5.3)
- TS pipeline remains as reference until Phase 5 cutover

## 12 THE HANDOFF
This planning document + the V6 master blueprint (524 lines) + the E3 master blueprint (from the 3 running scouts) + the MPSE/Limite fusion design → feed to the 5.3.3 prompt agent → that agent rebuilds the prompt for the V6 runtime.
