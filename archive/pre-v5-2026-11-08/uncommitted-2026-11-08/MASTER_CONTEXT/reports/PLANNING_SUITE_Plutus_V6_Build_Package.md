# PLANNING SUITE — PLUTUS V6 BUILD PACKAGE (Decider-2B Edition)
**Classification:** ARCHITECTURAL (complete runtime replacement)
**Date:** 2026-09-17 · **Model decision:** Decider-2B v10 (replaces Kev 0.6B)
**Harness:** pi (TypeScript, TUI, not headless) + MiMoCode memory system ported in
**Stack:** Decider-2B + Limite 1B + TensorTrade + pi + arsumbris KG (training data)

## §0 READ RECEIPTS
- brainstorming: READ — HARD GATE (operator approved: "decider it is then")
- blueprinting: READ — DIFFERENTIAL (what every existing thing does NOT do)
- focus: READ — MEASURE >> WRITE
- fable-plan: READ — PARALLEL FAN-OUT (8 forensic scouts completed)
- trident-problem-solving: READ — HARD BOUND (3 cycles)

## 0 CLASSIFICATION + INTENT
ARCHITECTURAL. Replace the MiMoCode-based Plutus runtime with a Decider-2B + Limite 1B + TensorTrade pipeline on a pi TUI harness. The primary Plutus coding agent is ELIMINATED. NOT headless. The 649 doctrine cards become Decider's fine-tune corpus.

## 1 DIFFERENTIAL

| Existing | Does | Does NOT |
|---|---|---|
| MiMoCode/OMP | Coding agents, TTSR, sessions, subagent dispatch | Make trading decisions. Be fast. Be deterministic. |
| TS E1/E2/E3 pipeline | Zone detection, shape chains, trade mapping in code | Learn. Be portable. Run without Bun. |
| Decider-2B v10 | State + typed questions → calibrated probabilities. Single forward pass. 4ms CUDA graphs. RL-trained beliefs. 93% browser. 32k context. Vision variant. | Generate code. Compute math. Produce free text. |
| Limite 1B | Competition-level math (74.25% BeyondAIME). 131k context. vLLM. | Make decisions. Classify. Score confidence. |
| TensorTrade | OMS + commission modeling + portfolio + walk-forward. | Make decisions. Compute geometry. Store doctrine. |
| pi harness | Agent loop, tool calling, TUI, state management. 108k★. Supply-chain hardened. | Coding (stripped). Subagent dispatch. |
| arsumbris KG | 649 doctrine cards, live-indexed, queryable. | Execute trades. Runtime queries. |

## 2 REDUCED CORE
ONE MECHANISM: a judgment loop on a pi TUI — market state enters, Decider-2B produces calibrated probability distributions over 17 typed questions (4 calls), Limite computes 6 numeric queries with dual-compute verification, 8+7 deterministic gates consume both outputs, TensorTrade validates, a trade decision exits with every probability inspectable.

## 3 THE COMPONENT SPECS (10 components, each a hydra worker)

### SPEC-W1: PI HARNESS + DECIDER INTEGRATION
```
WHAT: The agent runtime + the decision engine
BUILD:
  1. Clone earendil-works/pi (TypeScript, MIT)
  2. Strip: coding tools, file editing, subagent dispatch
  3. Port: MiMoCode memory system (TypeScript→TypeScript copy-paste)
  4. Register tools: decider, limite, gates, tensortrade, report, tui
  5. Deploy Decider-2B on the 4080:
     pip install decider-ai (or transformers + flash-linear-attention)
     from decider.infer import Decider
     d = Decider("Mapika/decider-2b")
     # 4ms per request with CUDA graphs
  6. Write the 17 question templates (E1:5, E2:4, E3:5, PVE:3)
  7. Write the state constructor (bars → Decider state text, ~200L)
FILES: pi-harness/, decider-wrapper.py, question-templates.py, state-constructor.py
LINES: ~400 (harness config + question templates + state constructor)
ACCEPTANCE:
  - Decider serves /v1/systemone on localhost
  - 17 questions return probability distributions
  - State constructor renders golden-week bars → state text
  - Question templates produce correct format
VERIFICATION:
  - d.decide(state, questions) returns calibrated probabilities
  - Golden week E1 questions return non-trivial distributions
  - Latency < 10ms per call (CUDA graphs)
```

### SPEC-W2: LIMITE INTEGRATION + GATE LAYER
```
WHAT: The math engine + the deterministic gates
BUILD:
  1. Deploy Limite 1B on the 4080 via vLLM:
     vllm serve paradigma-inc/limite-1b-violetto
     # temperature=0 (MPSE law, NOT the recommended 0.6)
  2. Write the 6 math queries (L1-L6):
     L1: zone width | L2: SL distance | L3: RRR
     L4: fib levels | L5: commission | L6: TP distance
  3. Write the prompt grammar: JSON envelope with quote+anchor (D13)
  4. Write the dual-compute verifier:
     - Python shadow recomputes each query
     - |Limite_result - code_result| <= eps (0.01 ratio / 0.1p width)
     - Else: LIMITE_CODE_DIVERGENCE → FAIL
  5. Write the 8 deterministic gates (G-RRR, G-SESSION, G-SL, G-CONF,
     G-CASCADE, G-CHAIN, G-DEDUP, G-DUAL)
  6. Write the 7 MPSE gates (G-LIM-01..07)
FILES: limite-wrapper.py, math-queries.py, dual-compute.py, gates.py, mpse-gates.py
LINES: ~500 (wrapper + queries + verifier + gates)
ACCEPTANCE:
  - Limite serves at temperature=0
  - L3 RRR query reproduces Tier-A golden RRRs ±0.02
  - Dual-compute verifier fires on deliberately wrong Limite output
  - All 15 gates produce named refusal tokens
VERIFICATION:
  - Golden RRR reproduction: 4.25/4.92/4.60/3.58/3.79/5.84 within tolerance
  - Mutant tests: perturb inputs → outputs change in correct direction
  - Gate codes: every rejection carries a named token + delta
```

### SPEC-W3: TENSORTRADE OMS
```
WHAT: The execution simulation + validation engine
BUILD:
  1. pip install tensortrade
  2. Wire TradeDecision → Exchange.execute_order()
  3. Configure commission models: 0%, 0.1%, 0.2%
  4. Set up portfolio tracking (base/quote wallets per pair)
  5. Walk-forward validation: train on golden week, test on unseen week
  6. Performance metrics: Sharpe, Sortino, max drawdown, win rate
FILES: tensortrade-oms.py, commission-analysis.py, walk-forward.py
LINES: ~200
ACCEPTANCE:
  - TradeDecision executes with commission applied
  - P&L tracked per trade and cumulative
  - Commission sensitivity analysis runs at 3 levels
  - Walk-forward on golden week + 1 unseen week
VERIFICATION:
  - Golden week trades profitable at 0.1% commission
  - Sharpe ratio computed
  - Max drawdown < 20%
```

### SPEC-W4: TUI TRADING PANE
```
WHAT: The visible trading interface in the pi TUI
BUILD:
  1. pi TUI pane showing:
     - Live P&L and open positions
     - Decider probability distributions (bar chart per question)
     - Gate decisions (accept/reject with reason)
     - Rejection log (token + delta)
     - Session status (London/NY/Asian)
  2. Keyboard controls:
     - [space] pause/resume the agent loop
     - [g] toggle gate log visibility
     - [p] show/hide probability distributions
     - [r] regenerate report
FILES: tui-trading-pane.ts (pi TUI component)
LINES: ~200 (TypeScript pi TUI)
ACCEPTANCE:
  - Pane renders in pi TUI
  - Live updates on each trading cycle
  - Probability distributions visible as bar charts
  - Gate decisions visible with named tokens
VERIFICATION:
  - Operator can see every probability, every gate, every rejection
  - No headless operation (the BANNED state)
```

### SPEC-W5: WEB-DATA AGENT
```
WHAT: The market data feed (TradingView screenshots → bars)
BUILD:
  1. Use Jev computer use skills to capture TradingView charts
  2. Alternative: broker API for OHLCV bars
  3. Render captured data → Decider state text format
  4. Handle multiple timeframes (30m, 1H, 4H)
  5. Session detection (London 02:00-05:00 ET)
FILES: web-data-agent.py, chart-capture.py, bar-renderer.py
LINES: ~600
ACCEPTANCE:
  - Bars fetched for DXY, EUR/USD, GBP/USD
  - Multiple timeframes available
  - Session window detection works
  - State text format matches Decider input requirements
VERIFICATION:
  - Golden week bars reproducible from TradingView
  - State text renders correctly for Decider
  - Session timestamps match the London window
```

### SPEC-W6: REPORT GENERATOR
```
WHAT: The 8-section trading report
BUILD:
  1. Port the report format from report-v452.ts to Python
  2. Sections: 1-Overview, 2-Zones, 3-Shapes, 4-Trades, 5-Chaining,
     6-Stats, 7-Storyline, 8-Golden Check
  3. Golden check: compare against the 23 golden trades
  4. Forensic stats: entry precision, SL accuracy, RRR distribution
FILES: report-generator.py
LINES: ~100
ACCEPTANCE:
  - 8-section report generates from TradeDecision history
  - Golden check compares entry prices ≤3p precision
  - Report is deterministic (same inputs → same output)
VERIFICATION:
  - Report on golden week matches known-good output
  - Golden check reports 14-15/15 entries ≤3p
```

### SPEC-W7: DOCTRINE FINE-TUNE CORPUS
```
WHAT: The training data pipeline (649 cards → Decider fine-tune records)
BUILD:
  1. Generate (state, questions, answers) triples from 649 cards:
     - 38 rulings → labeled decision examples
     - 583 mechanism cards → mechanism→question mappings
     - 38 forensic trades → full pipeline test cases
     - 23 golden trades → the validation oracle
  2. Fine-tune Decider-2B:
     - The decider package includes the training recipe
     - Supervised: cross-entropy on option distributions
     - Optional RL: calibration-aware on golden outcomes
  3. A/B test: fine-tuned vs prompt-engineered on golden + forensic
FILES: corpus-generator.py, fine-tune.py, ab-test.py
LINES: ~300
ACCEPTANCE:
  - 700+ training records generated from doctrine cards
  - Fine-tune improves golden week accuracy vs prompt-engineered
  - Forensic trade classification ≥ 90%
VERIFICATION:
  - Golden week: fine-tuned Decider ≥ 14/15 entries ≤3p
  - Forensic 38: direction + quality correctly classified
  - Calibration ECE < 0.05 after fine-tuning
```

### SPEC-W8: MPSE GATE WIRING
```
WHAT: The quality-control layer (10 AT predicates as executable code)
BUILD:
  1. Write AT-01..AT-10 as Python functions:
     Each pairs a Limite semantic verdict with a script mechanical check
  2. Wire into the pipeline: AT predicates run after every trade decision
  3. Trust equation: accept = oracle AND limite AND script (3-way)
FILES: mpse-predicates.py, trust-engine.py
LINES: ~150
ACCEPTANCE:
  - All 10 AT predicates executable
  - Trust engine: 3-way verification produces named verdict
  - Anti-theatrical: no single point of trust
VERIFICATION:
  - Deliberately wrong code → AT-03 catches (translation fidelity)
  - Wall-clock contamination → AT-06 catches
  - Determinism break → AT-07 catches (run twice, compare SHA)
```

### SPEC-W9: DETERMINISM REPAIRS + MEMORY PORT
```
WHAT: Fix the TS→Python port's determinism issues + MiMoCode memory
BUILD:
  1. Determinism repairs:
     - Replace Date.now() IDs with deterministic counters
     - Replace wall-clock session checks with bar-index checks
     - Ensure sha256(run1) == sha256(run2) on same inputs
  2. MiMoCode memory system port:
     - Copy the TypeScript memory banking system
     - Adapt for pi's agent context (not MiMoCode sessions)
     - Cross-session: remember past trades, zone patterns, gate decisions
FILES: determinism.py, memory-port.ts
LINES: ~200
ACCEPTANCE:
  - Same input → SHA-identical output across runs
  - Memory persists across pi restarts
  - Past trade outcomes accessible for pattern matching
VERIFICATION:
  - Run pipeline twice on golden week → identical report SHA
  - Memory bank read/write works in pi
```

### SPEC-W10: INTEGRATION + GOLDEN WEEK TEST
```
WHAT: Wire everything together + prove it works
BUILD:
  1. Integration: pi harness + Decider + Limite + gates + TensorTrade + TUI + report
  2. Golden week test: run the full pipeline on the golden week bars
  3. Compare: pipeline output vs canon (report-v452.ts 15/15 entries)
  4. Stabilise: fix discrepancies until ≥14/15 match
FILES: main.py, golden-week-test.py, comparison.py
LINES: ~100
ACCEPTANCE:
  - Full pipeline runs end-to-end on golden week bars
  - ≥14/15 entries within 3-pip precision of canon
  - Every rejection carries a named gate token
  - Report generated, TUI shows results
VERIFICATION:
  - comparison.py: entry-by-entry precision vs canon
  - Latency < 500ms per decision (CPU) / < 250ms (GPU)
  - Zero coding agent in the loop
```

## 4 EVIDENCE (from the forensic audits)
- 93 MIGRATION cards from v6-audit-e2e3.md (768 lines)
- 40 MIGRATION cards from v6-audit-harness.md (480 lines)
- 378 lines MPSE/Limite fusion from v6-mpse-limite-authoritative.md
- 637 lines MDVE E3 architecture from e3-mdve.md
- 270 lines E3 composition from e3-wiring.md (127 file:line anchors)
- Decider-2B model card: 0.805/0.755 accuracy, ECE 0.037, 93% browser, 4ms
- Limite model card: 74.25% BeyondAIME, 131k context, vLLM

## 5 APPROACH: HYDRA WORKERS (3 phases)

### PHASE 1 (MVP — prove the concept, 3 workers in parallel):
  W1: pi harness + Decider integration (SPEC-W1)
  W2: Limite + gates (SPEC-W2)
  W3: State constructor + web-data stub (SPEC-W5, partial — use cached bars)

### PHASE 2 (validation — prove it works, 3 workers in parallel):
  W4: TensorTrade OMS (SPEC-W3)
  W5: TUI trading pane (SPEC-W4)
  W6: Report generator (SPEC-W6)

### PHASE 3 (quality + cutover, 4 workers in parallel):
  W7: Doctrine fine-tune (SPEC-W7)
  W8: MPSE gates (SPEC-W8)
  W9: Determinism + memory (SPEC-W9)
  W10: Integration + golden week test (SPEC-W10)

## 6 SUCCESS CRITERIA (mechanical)
1. ≥14/15 golden entries at ≤3p precision (SPEC-W10)
2. All 38 forensic trades correctly classified (SPEC-W7)
3. TensorTrade: profitable at 0.1% commission on unseen week (SPEC-W3)
4. Decision latency <500ms CPU / <250ms GPU (SPEC-W10)
5. Zero coding agent in the loop (architectural)
6. TUI visible: every probability, every gate, every rejection (SPEC-W4)
7. Determinism: same input → SHA-identical output (SPEC-W9)
8. Golden RRR reproduction ±0.02 (SPEC-W2)
9. Mutant tests fire correctly (SPEC-W8)
10. ECE < 0.05 after fine-tuning (SPEC-W7)

## 7 EXECUTION CHECKLIST
```
Phase 1:
  □ W1: pi cloned, coding stripped, memory ported
  □ W1: Decider deployed on 4080, 17 questions returning
  □ W1: State constructor renders golden week bars
  □ W2: Limite deployed via vLLM temperature=0
  □ W2: 6 math queries with dual-compute
  □ W2: 15 gates with named tokens
  □ W3: Cached golden week bars loaded
Phase 2:
  □ W4: TensorTrade executes TradeDecisions
  □ W4: Commission sensitivity at 3 levels
  □ W5: TUI pane renders probabilities + gates
  □ W6: 8-section report generates
Phase 3:
  □ W7: 700+ training records from doctrine
  □ W7: Fine-tuned Decider beats prompt-engineered
  □ W8: 10 AT predicates executable
  □ W9: SHA determinism proven
  □ W9: Memory persists across restarts
  □ W10: Full pipeline on golden week
  □ W10: ≥14/15 entries ≤3p
Gates (between phases):
  Phase 1→2: Decider returns valid probabilities + Limite computes correct RRR
  Phase 2→3: TensorTrade profitable at 0.1% + report generates
  Phase 3→done: all 10 success criteria pass
```

## 8 ANTI-PATTERNS
| Failure | Detection |
|---|---|
| Decider used for math | Limite handles ALL arithmetic |
| Decider edits E1/E2 data | Gate layer only READS Decider output |
| LLM in the gate layer | Gates are pure Python if/else |
| Doctrine at runtime | Training data generated OFFLINE |
| Randomness in inference | temperature=0, fixed seed |
| Headless operation | pi TUI is the visible runtime — BANNED otherwise |
| MiMoCode still in the loop | The harness is pi + Python |
| Limite at temperature>0 | MPSE determinism law requires temp=0 |
| Single-point trust | 3-way verification (code + Limite + battery) |
| Kev still referenced | Decider-2B replaces Kev everywhere |

## 9 OPEN DECISIONS (all resolved)
1. ✅ Decider-2B (not Kev) — operator confirmed
2. ✅ pi harness (not vanilla Python) — operator confirmed ("headless banned")
3. ✅ MiMoCode memory ported in — operator confirmed ("copy paste")
4. ✅ Jev computer use for web data — operator specified
5. ✅ MPSE gates wired in — operator demanded
6. Limite deployment: vLLM on 4080 (shared with Decider) — DEFAULT: yes
7. Fine-tune approach: supervised first, RL if needed — DEFAULT

## 10 RESIDUAL
- Decider-2B fine-tuning on Plutus doctrine is UNPROVEN (0.755 OOD → expected ~0.80+ in-domain after fine-tune)
- Vision variant (decider-2b-vision) not included in V1 — future for TradingView chart reading
- VLM visual validation (screenshot zone confirmation) has NO Decider replacement — needs web-data agent or vision variant
- TensorTrade is Python-only — introduces a Python dependency into the pi (TypeScript) harness
- The 3.5GB Decider memory + 1GB Limite memory share the 4080's 16GB — tight with other workloads

## 11 HANDOFF
This planning suite + the V6 blueprints (524 + 284 + 398 lines) + the E3 blueprint (977 lines) + the forensic audits (2,931 lines) → feed to the hydra worker dispatch for Phase 1 (W1 + W2 + W3 in parallel).
