# PLUTUS V6 — INITIAL BLUEPRINT
**(2026-09-17, preserved verbatim per the operator order)**

## THE STACK (every layer, every component, every integration)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLUTUS V6 RUNTIME                            │
│         pi harness (TUI, not headless) + Kev + Limite +            │
│         TensorTrade + arsumbris KG (training data only)            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐   bars   ┌──────────────────┐                 │
│  │ MARKET DATA     │────────▶│ STATE CONSTRUCTOR │                 │
│  │ AGENT           │          │ (bars → Kev text) │                 │
│  │                 │          └────────┬─────────┘                 │
│  │ • TradingView   │                    │                            │
│  │   screenshots   │                    ▼                            │
│  │   (Jev computer │          ┌──────────────────┐                 │
│  │   use skills)   │          │ KEV 0.6B (ONNX)  │                 │
│  │ • Broker bars   │          │                  │                 │
│  │   (fetch-bars)  │          │ CALL 1: E1       │                 │
│  │ • Macro feeds   │          │   Q1 zone type?  │                 │
│  │   (7-pack)      │          │   Q2 OBCV gate?  │                 │
│  │ • Treasury/FRED │          │   Q3 mitigation? │                 │
│  │   /EIA data     │          │   Q4 pressure?   │                 │
│  └─────────────────┘          │   Q5 fortress?   │                 │
│                               └────────┬─────────┘                 │
│                                        │ probabilities             │
│                                        ▼                           │
│                               ┌──────────────────┐                 │
│                               │ KEV CALL 2: E2   │                 │
│                               │   Q1 shape?      │                 │
│                               │   Q2 day elem?   │                 │
│                               │   Q3 cascade?    │                 │
│                               │   Q4 freshness?  │                 │
│                               └────────┬─────────┘                 │
│                                        │                           │
│                                        ▼                           │
│  ┌─────────────────┐          ┌──────────────────┐                 │
│  │ LIMITE 1B       │────────▶│ KEV CALL 3: E3   │                 │
│  │ (vLLM on 4080)  │          │   Q1 direction?  │                 │
│  │                 │          │   Q2 quality?    │                 │
│  │ L1 zone width   │          │   Q3 session?    │                 │
│  │ L2 SL distance  │          │   Q4 SL envelope?│                 │
│  │ L3 RRR ratio    │          │   Q5 shield?     │                 │
│  │ L4 fib levels   │          └────────┬─────────┘                 │
│  │ L5 commission   │                    │                           │
│  │ L6 TP distance  │                    ▼                           │
│  └─────────────────┘          ┌──────────────────┐                 │
│                               │ KEV CALL 4: PVE  │                 │
│                               │   Q1 TP prob?    │                 │
│                               │   Q2 reachable?  │                 │
│                               │   Q3 confidence? │                 │
│                               └────────┬─────────┘                 │
│                                        │                           │
│                                        ▼                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ GATE LAYER (pure Python, zero models)                      │   │
│  │                                                             │   │
│  │  G-RRR:      if rrr < 2.5 → REJECT                        │   │
│  │  G-SESSION:  if session_valid == no → REJECT              │   │
│  │  G-SL:       if sl > 55p or sl < 3p → REJECT              │   │
│  │  G-CONF:     if confidence < B → FLAG manual review       │   │
│  │  G-CASCADE:  if cascade == invalid → HALT pair            │   │
│  │  G-CHAIN:    Law-27 propagation (verbatim port)           │   │
│  │  G-DEDUP:    identity + stagger merge + emission cap      │   │
│  │  G-DUAL:     |Limite_result - code_result| > eps → FAIL   │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                       │
│                            ▼                                       │
│               ┌────────────────────┐                              │
│               │ TradeDecision      │                              │
│               │ {direction, entry, │                              │
│               │  sl, tp, rrr,      │                              │
│               │  quality, session, │                              │
│               │  confidence, pair} │                              │
│               └─────────┬──────────┘                              │
│                         │                                         │
│          ┌──────────────┼──────────────┐                         │
│          ▼              ▼              ▼                         │
│  ┌─────────────┐ ┌───────────┐ ┌─────────────┐                  │
│  │ TensorTrade │ │ REPORT    │ │ pi TUI      │                  │
│  │ OMS         │ │ GENERATOR │ │ TRADING     │                  │
│  │             │ │           │ │ PANE        │                  │
│  │ • execute   │ │ • 8-section│ │             │                  │
│  │ • commission│ │   report  │ │ • live P&L  │                  │
│  │ • portfolio │ │ • golden  │ │ • open pos  │                  │
│  │ • Sharpe    │ │   check   │ │ • Kev probs │                  │
│  │ • drawdown  │ │ • forensic│ │ • gate log  │                  │
│  │ • walk-fwd  │ │   stats   │ │ • rejection │                  │
│  └─────────────┘ └───────────┘ │   reasons   │                  │
│                               └─────────────┘                  │
├─────────────────────────────────────────────────────────────────────┤
│  DOCTRINE LAYER (offline, never at runtime)                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ arsumbris knowledge graph (649 cards)                       │   │
│  │ ├── 38 rulings (operator law, verbatim)                     │   │
│  │ ├── 16 hard limits (never-do rules)                          │   │
│  │ ├── 583 mechanism cards (the full doctrine)                 │   │
│  │ ├── 3 gates (verification commands)                         │   │
│  │ ├── 3 state cards (proven fingerprints)                     │   │
│  │ └── MPSE spec cards (math-as-spec contracts)                │   │
│  │                                                             │   │
│  │ → OFFLINE: generates (state, questions, answers) triples   │   │
│  │ → OFFLINE: fine-tunes Kev LoRA r=16 on ~700 records        │   │
│  │ → NEVER queried at inference (determinism law)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  MPSE / LIMITE FUSION (the quality-control layer)                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Limite as MATH SPEC:                                        │   │
│  │   RuleCard.expected → Limite fills the VALUE                │   │
│  │   Python shadow recomputes → dual-compute |diff| ≤ eps     │   │
│  │   If |Limite - code| > eps → LIMITE_CODE_DIVERGENCE → FAIL │   │
│  │                                                             │   │
│  │ 7 Limite Gates:                                             │   │
│  │   G-LIM-01: mathiness check (is the spec mathematically    │   │
│  │             coherent?)                                       │   │
│  │   G-LIM-02: translation fidelity (spec → code match)       │   │
│  │   G-LIM-03: mutant generation (perturb inputs, verify      │   │
│  │             outputs change correctly)                       │   │
│  │   G-LIM-04: calibration audit (reproduce golden RRRs       │   │
│  │             within ±0.02)                                   │   │
│  │   G-LIM-05: RRR floor (L3 computes, gate compares)         │   │
│  │   G-LIM-06: SL envelope (L2 computes, gate bounds-checks)  │   │
│  │   G-LIM-07: containment (L1 computes, gate subset-checks)  │   │
│  │                                                             │   │
│  │ 10 Anti-Theatrical Predicates (AT-01..AT-10):              │   │
│  │   Each pairs a Limite semantic verdict with a script        │   │
│  │   mechanical check. Trust = oracle AND Limite AND script.   │   │
│  │                                                             │   │
│  │ 5 Quality-Key Unlocks (U-1..U-5):                           │   │
│  │   Limite UNLOCKS MPSE tiers based on:                       │   │
│  │   U-1: golden RRR reproduction (±0.02)                      │   │
│  │   U-2: mutant fires (rrr-drift, tp-cap, tolerance-drift)    │   │
│  │   U-3: E4 7-leg proof (worked SLs within ±0.1p)            │   │
│  │   U-4: E5 tier gating (uncalibrated = NOT_CALIBRATED)      │   │
│  │   U-5: dual-compute standing army (20/46 → 46/46)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  HARNESS: pi (earendil-works/pi)                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ pi-agent-core (TypeScript, 108k★, MIT)                      │   │
│  │ ├── Agent loop: observe → decide → act → report            │   │
│  │ ├── Tool calling: Kev, Limite, gates, TensorTrade as tools │   │
│  │ ├── State management: MiMoCode memory system (ported)      │   │
│  │ ├── TUI: visible trading pane, NOT headless                │   │
│  │ ├── Supply-chain hardened (pinned deps, CI, SLSA)          │   │
│  │ └── STRIPPED: coding tools, file editing, subagent dispatch │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## THE 17 KEV QUESTIONS (the complete decision surface)

| Call | Stage | # | Question | Primitive | Options |
|---|---|---|---|---|---|
| 1 | E1 | Q1 | Zone type? | Choice | BoM · MoM · PHANTOM_BOM · LQZ · S/D |
| 1 | E1 | Q2 | OBCV displacement gate? | Noul | pass · fail |
| 1 | E1 | Q3 | Mitigation count? | Choice | unmitigated · 1x · 2x · 3x_depleted |
| 1 | E1 | Q4 | Pressure classification? | Choice | strong_demand · weak_demand · neutral · weak_supply · strong_supply |
| 1 | E1 | Q5 | Fortress zone? | Noul | no · yes |
| 2 | E2 | Q1 | Current shape? | Choice | BS · WL · RWL · R · SS · consolidation |
| 2 | E2 | Q2 | Day element? | Choice | BS_day · WL_day · R_day · Recovery_day |
| 2 | E2 | Q3 | Cascade valid? | Choice | valid · invalid · partial |
| 2 | E2 | Q4 | Zone freshness? | Choice | unmitigated · 1x_80% · 2x_50% · 3x_depleted |
| 3 | E3 | Q1 | Trade direction? | Choice | long · short · no_trade |
| 3 | E3 | Q2 | Entry quality? | Score | F_reject · C_flagged · B_pass · A_pass · Aplus |
| 3 | E3 | Q3 | Session valid? | Noul | yes · no |
| 3 | E3 | Q4 | SL in 3-55p envelope? | Noul | yes · no |
| 3 | E3 | Q5 | Shield coverage? | Noul | yes · no |
| 4 | PVE | Q1 | TP hit probability? | Score | very_low · low · medium · high · very_high |
| 4 | PVE | Q2 | Entry reachable? | Noul | yes · no |
| 4 | PVE | Q3 | Confidence grade? | Score | F · C · B · A · Aplus |

## THE 6 LIMITE MATH CALLS

| ID | Query | Input | Output |
|---|---|---|---|
| L1 | Zone geometry | zone top/bottom + pair + pip | width in pips |
| L2 | SL distance | zone width + buffer (3-5p) | SL in pips |
| L3 | RRR | entry + SL + TP | ratio (TP_dist / SL_dist) |
| L4 | Fibonacci | swing high wick + swing low wick | 0.382 · 0.5 · 0.618 · 0.786 · 1.272 · 1.618 levels |
| L5 | Commission | gross_pips × rate × size | net_pips after costs |
| L6 | TP distance | entry + target zone | TP in pips |

## THE 8 DETERMINISTIC GATES

| Gate | Logic | Source doctrine |
|---|---|---|
| G-RRR | `if rrr < 2.5: REJECT` | R09/R37 (operator confirmed 2.5) |
| G-SESSION | `if session_valid == false: REJECT` | R30 (London pre-market anchor) |
| G-SL | `if sl_pips < 3 or sl_pips > 55: REJECT` | Forensic 38-trade envelope |
| G-CONF | `if confidence < B: FLAG` | PVE grade bands |
| G-CASCADE | `if cascade == invalid: HALT` | R12 (EU↔DXY inverse) |
| G-CHAIN | Law-27 BFS (TP→entry, opposite dir, max 3) | trade-chaining.ts verbatim port |
| G-DEDUP | identity + stagger merge + cap 1/day | trade-dedup.ts verbatim port |
| G-DUAL | `if abs(limite_val - code_val) > eps: FAIL` | MPSE dual-compute law |

## THE 12 MUST-BUILD-NEW ITEMS

| # | Item | Est. lines | Why it can't be ported |
|---|---|---|---|
| 1 | Gate layer | ~100 | New concept — didn't exist as a unified layer |
| 2 | State constructor | ~200 | Renders bars→Kev text — new for ONNX inference |
| 3 | Kev fine-tune corpus | ~700 records | Derives from 649 doctrine cards — new data format |
| 4 | Limite prompt shapes | ~50 | 6 query templates — new for vLLM |
| 5 | TensorTrade wiring | ~100 | New integration |
| 6 | Report generator | ~100 | 8-section report — port from TS but rewrite in Python |
| 7 | TUI trading pane | ~200 | New — pi TUI integration |
| 8 | Web-data agent | ~600 | Jev computer use → TradingView screenshots → bars |
| 9 | Determinism repairs | ~50 | Fix wall-clock sessions, Date.now IDs in ports |
| 10 | MPSE gate wiring | ~150 | G-LIM-01..07 as executable Python |
| 11 | MiMoCode memory port | ~TBD | TypeScript→TypeScript, copy-paste + adaptation |
| 12 | pi harness config | ~50 | Agent loop tool registration |

## THE 15 CANNOT-REPLACE ITEMS (stay as deterministic code forever)

| # | Item | Why |
|---|---|---|
| 1 | RRR floor (2.5) | A number, not a judgment |
| 2 | SL envelope (3-55p) | A range, not a classification |
| 3 | Session window (London 02:00-05:00 ET) | A time bound, not a probability |
| 4 | Mirror floor f(T)=24 | A count, not a score |
| 5 | Totality forall (90-row) | A coverage check, not a model |
| 6 | Side match (zone→direction) | A lookup, not a judgment |
| 7 | TF restriction (LQZ never 4H) | A rule, not a probability |
| 8 | No wall-clock in decisions | A constraint on the runtime itself |
| 9 | Divergence bounds (≤0.35, ≤3p) | A tolerance, not a confidence |
| 10 | Chain identity (pair\|dir\|bucket\|day) | A key format, not semantic |
| 11 | Stagger merge (ONE SL/TP) | A merge rule, not a judgment |
| 12 | Emission cap (1/anchor/day) | A count limit |
| 13 | Row-count CI assertion | An integrity check |
| 14 | Blended RRR formula | Arithmetic, not classification |
| 15 | Anchor bucket quantization | A bucketing function |

## THE V6 CYCLE (one trading decision, timed)

```
 1. Market feed delivers bars                          [0ms]
 2. State constructor renders bars → Kev state         [5ms]
 3. Kev Call 1 (E1): 5 questions                       [10ms GPU]
 4. Gate: if neutral → "no_zone", wait                 [<1ms]
 5. Kev Call 2 (E2): 4 questions                       [10ms]
 6. Gate: if cascade invalid → halt pair               [<1ms]
 7. Kev Call 3 (E3): 5 questions                       [10ms]
 8. Limite: L1-L6 (entry, SL, TP, RRR, fib, commission) [200ms]
 9. Gate: if rrr < 2.5 → reject                        [<1ms]
10. Gate: if SL outside 3-55p → reject                 [<1ms]
11. Kev Call 4 (PVE): 3 questions                      [10ms]
12. Gate: if confidence < B → flag manual review       [<1ms]
13. Gate: G-DUAL dual-compute verification             [<1ms]
14. Output TradeDecision                               [<1ms]
15. TensorTrade: execute + measure                     [async]
16. TUI pane: render decision + probabilities          [async]
17. Report generator: 8-section report                 [async]

TOTAL: ~250ms GPU / ~450ms CPU
TOTAL CODE: ~300 lines Python core + pi harness + ~1,200 lines new builds
NO CODING AGENT. NO MIMOCODE. NO TTSR. NO SUBAGENTS. NO BUN. NO TYPESCRIPT PIPELINE.
```

## THE V5 → V6 TRANSFORMATION

| Axis | V5 (current) | V6 |
|---|---|---|
| Decision engine | TypeScript rules interpreted by coding LLM | Kev 0.6B neural decision model |
| Math engine | Hardcoded TypeScript functions | Limite 1B competition-level math |
| Validation | Custom golden-gate harness | TensorTrade OMS + walk-forward |
| Runtime | MiMoCode/OMP agent stack (10,000+ lines) | pi harness (~300 lines core) |
| Doctrine | Cards → code via agents | Cards → Kev training data |
| Lines of runtime | 10,000+ | ~300 core + ~1,200 new builds |
| Decision latency | Seconds (agent turns) | ~250ms (4 forward passes) |
| Coding needed | Yes (agents write code) | **ZERO** |
| Determinism | Enforced by discipline (R32) | Architectural (ONNX, temp=0) |
| Portability | Requires full OMP stack | ONNX runs anywhere |
| UI | au-host (knowledge graph only) | pi TUI (trading pane + probabilities) |
| MPSE | TS assertions in test files | Limite gates + dual-compute verification |
| Memory | OMP mnemopi + mimo | MiMoCode memory system (ported to pi) |
| Data feed | fetch-bars.ts (manual/scheduled) | Jev computer use agent (TradingView) |
