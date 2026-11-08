# THE THREE MASTER BLUEPRINTS — Kev · Limite · TensorTrade → Plutus V6
**(2026-09-17, preserved verbatim per the operator order)**

---

# BLUEPRINT 1 — KEV 0.6B: THE DECISION ENGINE

## 1.1 What it IS (mechanism, not description)

Kev is a **pointer-readout decision model**. It is NOT a language model, NOT a text generator, NOT a chatbot. It takes one document (the "state") plus any number of typed questions, and returns a **probability distribution over each question's options** in a single forward pass. No generation, no sampling, no chain-of-thought.

```
┌──────────────────────────────────────────────────────────────────┐
│                     KEV 0.6B — INTERNAL ARCHITECTURE            │
│                                                                  │
│  INPUT SEQUENCE (one packing, one forward pass):                │
│                                                                  │
│  ┌─────────┐  ┌────────┐  ┌────────┐  ┌──────┐  ┌─────────┐   │
│  │ STATE   │  │ Q1     │  │ OPT A  │  │ OPT B│  │ DECIDE  │   │
│  │ 8192    │  │ text   │  │ text ◄─│──│ text │  │ token   │   │
│  │ tokens  │  │        │  │ </opt> │  │</opt>│  │         │   │
│  └─────────┘  └────────┘  └────────┘  └──────┘  └─────────┘   │
│       │            │            │          │          │        │
│       ▼            ▼            ▼          ▼          ▼        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         BLOCK-CAUSAL ATTENTION MASK                    │    │
│  │  State is visible to ALL questions                     │    │
│  │  Each question sees: state + itself + its options     │    │
│  │  Questions CANNOT see each other                      │    │
│  │  (independence guaranteed, max delta 4e-6)            │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         POINTER HEAD (trained from scratch)            │    │
│  │  Scores each option's </opt> token against the         │    │
│  │  question's <decide> token                             │    │
│  │  logits[</opt>_i] = relevance(option_i, question)      │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│                 softmax([score_A, score_B])                     │
│                 → [0.73, 0.27] = P(A)=73%, P(B)=27%            │
└──────────────────────────────────────────────────────────────────┘
```

## 1.2 The delimiter tokens (the packing grammar)

```
Token              Purpose                    Qwen3 Special Token
─────              ───────                    ───────────────────
<|fim_prefix|>     STATE delimiter            marks where state begins
<|fim_middle|>     QUESTION delimiter         marks where a question begins
<|box_start|>      OPTION delimiter           marks where an option begins
<|box_end|>        END option                 marks where an option ends
<|fim_suffix|>     DECIDE delimiter           the pointer's query anchor
```

The model derives segments, positions, and the block-causal mask **from the delimiter IDs in-graph** — the caller only provides `input_ids` and `attention_mask`. No external segment IDs needed.

## 1.3 The backbone

```
Qwen3-0.6B-Base (Apache 2.0)
├── 0.6B parameters
├── Causal LM (prefill-only, no KV cache needed)
├── LoRA r=16 adapter (trained on attention + MLP projections)
│   └── ~12M trainable parameters on top of the frozen base
└── Pointer head (trained from scratch)
    └── A linear layer that scores </opt> tokens against <decide> tokens
```

## 1.4 The three question primitives

```
┌─────────────────────────────────────────────────────────┐
│ CHOICE (pick one from N options)                       │
│   State: market bars + context                         │
│   Q: "What is the pressure classification?"            │
│   Options: {strong_demand: "multiple holds",           │
│             weak_demand: "partial holds",              │
│             neutral: "no clear bias",                  │
│             weak_supply: "partial absorption",         │
│             strong_supply: "multiple rejections"}     │
│   Output: softmax → [0.05, 0.12, 0.03, 0.08, 0.72]   │
│   → strong_supply at 72%                              │
├─────────────────────────────────────────────────────────┤
│ NOUL (binary yes/no)                                   │
│   Q: "Is this a FORTRESS zone?"                       │
│   Options: {no: "fewer than 4 defense events",        │
│             yes: "4+ holds, ~95% flip probability"}   │
│   Output: softmax → [0.18, 0.82] → yes at 82%        │
├─────────────────────────────────────────────────────────┤
│ SCORE (position on an ordered scale)                   │
│   Q: "What is the confidence grade?"                   │
│   Options: {F: "<0.50 reject",                        │
│             C: "0.50-0.59 manual review",             │
│             B: "0.60-0.69 pass",                      │
│             A: "0.70-0.79 pass",                      │
│             Aplus: "≥0.80 pass"}                      │
│   Output: [0.02, 0.08, 0.25, 0.45, 0.20]             │
│   → expected level = Σ(i × p_i) = 3.73 → between      │
│     A and Aplus, closer to A                           │
└─────────────────────────────────────────────────────────┘
```

## 1.5 Training data (how it learned)

12,576 records from 10 public sources + 896 policy minimal pairs + 1,680 records from 60 random rule structures. LoRA r=16, lr 1e-4, ~12 minutes on one H100. Cross-entropy on the option distribution.

**The minimal pairs technique** (the key innovation): the same state rendered with the true option present and removed — teaches the model to handle "none of the above" correctly (accuracy jumped from 0.25 to 0.80).

## 1.6 Performance envelope

| Metric | Value |
|---|---|
| In-distribution accuracy (dev) | 0.801 |
| In-distribution accuracy (locked test) | 0.808 |
| Out-of-domain accuracy | 0.620 |
| None-option accuracy | 0.80 |
| Confident-error rate (OOD) | 11% (≥0.9 confidence and wrong) |
| ECE in-domain | 0.089 |
| State limit | 8,192 tokens |
| Options per question | 1-255 |
| Questions per call | unlimited (block-causal) |
| Inference | single forward pass |
| Runtime | ONNX q4 (CPU) / q4f16 (WebGPU) |
| Memory | ~400MB (q4 quantized) |

## 1.7 Kev's role in Plutus V6

```
┌──────────────────────────────────────────────────────────────┐
│ PLUTUS V6 — THE KEV DECISION PIPELINE                        │
│                                                              │
│  CALL 1: E1 PRESSURE (5 questions, one forward pass)        │
│  ┌────────────────────────────────────────────────────┐     │
│  │ State: 30m/1H/4H bars + pair + session + DXY ctx  │     │
│  │ Q1: zone type?       → [BoM, MoM, PHANTOM, LQZ]  │     │
│  │ Q2: OBCV gate?       → [pass, fail]               │     │
│  │ Q3: mitigation?      → [unmit, 1x, 2x, 3x_depl]  │     │
│  │ Q4: pressure class?  → [strong_dem...strong_sup]  │     │
│  │ Q5: fortress?        → [no, yes]                  │     │
│  └────────────────────────────────────────────────────┘     │
│                          │ probabilities per option          │
│                          ▼                                   │
│  CALL 2: E2 STORYLINE (4 questions)                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ State: E1 output + prior E2 state + day context    │     │
│  │ Q1: current shape?    → [BS, WL, RWL, R, SS, consol]│   │
│  │ Q2: day element?      → [BS_day, WL_day, R_day]    │     │
│  │ Q3: cascade valid?    → [valid, invalid, partial]  │     │
│  │ Q4: freshness?        → [unmit, 1x_80, 2x_50, 3x] │     │
│  └────────────────────────────────────────────────────┘     │
│                          │                                    │
│                          ▼                                   │
│  CALL 3: E3 TRADE (5 questions)                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ State: E1 + E2 outputs + candidate zone            │     │
│  │ Q1: direction?        → [long, short, no_trade]    │     │
│  │ Q2: quality grade?    → Score [F,C,B,A,A+]         │     │
│  │ Q3: session valid?    → [yes, no]                  │     │
│  │ Q4: SL in envelope?   → [yes, no]                  │     │
│  │ Q5: shield coverage?  → [yes, no]                  │     │
│  └────────────────────────────────────────────────────┘     │
│                          │                                    │
│                          ▼                                   │
│  CALL 4: PVE SCORING (3 questions)                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ State: E3 output + ATR + session remaining         │     │
│  │ Q1: TP probability?   → Score [vlow...vhigh]       │     │
│  │ Q2: entry reachable?  → [yes, no]                  │     │
│  │ Q3: confidence?       → Score [F,C,B,A,A+]         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  TOTAL: 4 forward passes, 17 questions, ~250ms GPU          │
│  GATE LAYER: deterministic Python if/else on the outputs     │
└──────────────────────────────────────────────────────────────┘
```

## 1.8 How the 649 doctrine cards become Kev training data

```
Card format (existing):           → Kev training record:
---                                  
type: plutus-mechanism             State: "30m EUR/USD zone 1.14100-
slug: obcv-displacement-gate         1.14200, body=45p range=60p ATR=35p"
kind: mechanism                    Q: "Does this zone pass OBCV?"
quote: "body ≥1.5× avg AND            Options: [pass, fail]
  range ≥1.5× ATR"                 Answer: pass (45/35=1.29 < 1.5 → FAIL)
source: MACRO.md:57
---                                 
```

Each of the 583 mechanism cards + 38 rulings + 38 forensic trades + 23 golden trades converts to a (state, questions, answers) triple. ~700 records from existing data. Fine-tune LoRA on these → a Plutus-native decision model.

---

# BLUEPRINT 2 — LIMITE 1B: THE MATH ENGINE

## 2.1 What it IS

Limite 1B Violetto is a **dense autoregressive transformer trained from scratch for mathematical reasoning**. It is NOT an assistant, NOT a chatbot, NOT a general-purpose LLM. It takes a math problem and produces a step-by-step solution with a numeric answer.

```
┌──────────────────────────────────────────────────────────────┐
│                 LIMITE 1B — INTERNAL ARCHITECTURE            │
│                                                              │
│  Dense autoregressive transformer                           │
│  ├── 1B parameters                                          │
│  ├── Trained from scratch (NOT fine-tuned from a base)      │
│  ├── <300B curated training tokens                          │
│  ├── 131k token context window                              │
│  ├── Architecture: community speedrun-inspired              │
│  │   (modded-nanogpt lineage:高效 attention,                │
│  │    rotary embeddings, SwiGLU, deep+wide)                │
│  └── Post-training: synthetic data + SFT + RL               │
│                                                              │
│  INFERENCE:                                                  │
│  ├── vLLM serving (CUDA required)                           │
│  ├── temperature=0.6, top_p=0.95 (recommended)              │
│  └── Single-turn math reasoning (not conversational)       │
│                                                              │
│  PERFORMANCE:                                                │
│  ├── 74.25% on BeyondAIME (beats 30B models)               │
│  ├── Competition-level: AIME, HMMT, APEX                   │
│  └── 131k context: processes full weeks of bars            │
└──────────────────────────────────────────────────────────────┘
```

## 2.2 Why it exists (the sample efficiency thesis)

Limite proves that **1B parameters + curated data + targeted post-training** beats **30B parameters + brute-force scaling** on math. The same thesis applies to trading: a small model trained specifically on Plutus's zone geometry and RRR calculations will be faster, cheaper, and more precise than a general-purpose LLM guessing at math.

## 2.3 Limite's role in Plutus V6

```
┌────────────────────────────────────────────────────────────┐
│ PLUTUS V6 — THE LIMITE MATH CALLS                           │
│                                                            │
│ Kev decides WHAT → Limite computes HOW MUCH               │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ MATH CALL 1: Zone Geometry                          │   │
│ │ Input: "Zone top=1.14200, bottom=1.14100,           │   │
│ │         pair=EUR/USD, pip=0.0001"                   │   │
│ │ Output: "Zone width = |1.14200 - 1.14100|           │   │
│ │          = 0.00100 = 10.0 pips"                    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ MATH CALL 2: SL Distance                            │   │
│ │ Input: "Zone width=10.0 pips, buffer=3.0 pips       │   │
│ │         (3-5 pip range, dominant is 3-5)"           │   │
│ │ Output: "SL distance = zone width + buffer           │   │
│ │          = 10.0 + 3.0 = 13.0 pips"                 │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ MATH CALL 3: RRR Calculation                        │   │
│ │ Input: "Entry=1.14110, SL=1.13925, TP=1.14395       │   │
│ │         SL_dist=|1.14110-1.13925|=18.5p             │   │
│ │         TP_dist=|1.14395-1.14110|=28.5p"            │   │
│ │ Output: "RRR = TP_dist / SL_dist                     │   │
│ │          = 28.5 / 18.5 = 1.54"                     │   │
│ │ GATE: 1.54 < 2.5 → REJECT (deterministic code)     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ MATH CALL 4: Fibonacci Levels                       │   │
│ │ Input: "Swing high wick=1.14315, swing low          │   │
│ │         reaction wick=1.13925"                       │   │
│ │ Output: "0.382=1.14070, 0.5=1.14120,               │   │
│ │          0.618=1.14170, 0.786=1.14227,             │   │
│ │          1.272=1.14439, 1.618=1.14727"             │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ MATH CALL 5: Commission Impact                      │   │
│ │ Input: "Gross profit=28.5 pips, entry=1.14110       │   │
│ │         commission=0.1% round trip                  │   │
│ │         position_size=100000 units"                 │   │
│ │ Output: "Commission cost = 100000 × 0.001 × 2       │   │
│ │          = $200 = 20.0 pips                         │   │
│ │          Net = 28.5 - 20.0 = 8.5 pips"             │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ LATENCY: ~200ms per call (vLLM on 4080)                   │
│ TOTAL: 5 calls ≈ 1 second for full trade math             │
└────────────────────────────────────────────────────────────┘
```

## 2.4 The division of labor (Kev vs Limite — NEVER reversed)

| Judgment | Engine | Why |
|---|---|---|
| "Is this a strong demand zone?" | **Kev** | Classification over defined options |
| "What shape is forming?" | **Kev** | State machine transition |
| "Trade direction?" | **Kev** | Choice from {long, short, no_trade} |
| "Confidence grade?" | **Kev** | Score on ordered levels |
| "Zone width in pips?" | **Limite** | Precise arithmetic |
| "SL distance?" | **Limite** | Geometry + buffer calculation |
| "RRR ratio?" | **Limite** | Division with precision |
| "Fib 0.618 level?" | **Limite** | Retracement calculation |
| "Commission impact?" | **Limite** | Percentage + pip conversion |
| "RRR ≥ 2.5?" | **GATE (code)** | Deterministic comparison, never a model |

---

# BLUEPRINT 3 — TENSORTRADE: THE VALIDATION + EXECUTION ENGINE

## 3.1 What it IS

TensorTrade is an **RL training + backtesting framework** for trading agents. It provides a Gymnasium-compatible TradingEnv with a full OMS (Order Management System) for realistic simulated execution.

```
┌───────────────────────────────────────────────────────────────┐
│              TENSORTRADE — INTERNAL ARCHITECTURE              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ TradingEnv (Gymnasium-compatible)                      │ │
│  │   ├── Observer: windowed features from DataFeed       │ │
│  │   ├── ActionScheme: BSH (Buy/Sell/Hold) or custom     │ │
│  │   ├── RewardScheme: PBR (position-based returns)      │ │
│  │   ├── Stopper: episode termination criteria           │ │
│  │   └── Informer: internal env metrics                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ OMS (Order Management System)                          │ │
│  │   ├── Exchange: simulated price + order execution     │ │
│  │   │   ├── commission model (0% to 0.2%+)              │ │
│  │   │   ├── price from DataFeed                          │ │
│  │   │   └── execution via Broker                         │ │
│  │   ├── Broker: order lifecycle                          │ │
│  │   │   ├── market, limit, stop orders                  │ │
│  │   │   └── partial fills                               │ │
│  │   ├── Portfolio: multi-wallet position tracking       │ │
│  │   │   ├── base/quote wallet pairs                     │ │
│  │   │   └── P&L, exposure, allocation                   │ │
│  │   └── Wallet: balance + locked funds                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Validation + Analytics                                 │ │
│  │   ├── Walk-forward on unseen data                     │ │
│  │   ├── Commission sensitivity (0%, 0.1%, 0.2%)         │ │
│  │   ├── Sharpe, Sortino, max drawdown                   │ │
│  │   └── Ray RLlib integration for RL training           │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## 3.2 The key research finding (why this matters for Plutus)

TensorTrade's own research proved: **agents that are profitable at 0% commission lose money at 0.1% commission.** This is the single most important validation question for Plutus — how much edge do the 23 golden trades have after execution costs?

## 3.3 TensorTrade's role in Plutus V6

```
┌──────────────────────────────────────────────────────────────┐
│ PLUTUS V6 — TENSORTRADE INTEGRATION                          │
│                                                              │
│  Kev/Limite pipeline produces:                               │
│  TradeDecision {direction, entry, sl, tp, rrr, quality,     │
│                 confidence, session, pair}                   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ TensorTrade Exchange                                │    │
│  │   execute_order(entry, sl, tp, pair, size)          │    │
│  │   → commission applied (0% / 0.1% / 0.2%)          │    │
│  │   → order lifecycle managed                         │    │
│  │   → fills tracked                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Portfolio                                           │    │
│  │   P&L per trade · cumulative P&L · drawdown        │    │
│  │   Sharpe ratio · Sortino ratio · win rate          │    │
│  │   commission impact analysis                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Walk-Forward Validation                             │    │
│  │   Train on golden week → test on unseen week 2     │    │
│  │   → does the edge persist?                          │    │
│  │   → commission sensitivity: profitable at 0.1%?    │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## 3.4 What TensorTrade does NOT do in V6

| NOT TensorTrade's job | Belongs to |
|---|---|
| Make trading decisions | Kev |
| Compute zone geometry / RRR | Limite |
| Store doctrine | arsumbris KG |
| Classify pressure / shapes | Kev |
| Score confidence | Kev (PVE call) |
| Gate accept/reject | Deterministic Python code |

TensorTrade is purely the **execution simulation + performance measurement + validation** layer.

---

# THE V6 MERGE — HOW ALL THREE INTEGRATE

```
┌────────────────────────────────────────────────────────────────────┐
│                    PLUTUS V6 RUNTIME                               │
│          (vanilla Python, ~300 lines, no coding agent)            │
│                                                                    │
│  ┌──────────┐    ┌───────────────┐    ┌─────────────────────┐    │
│  │ Market   │───▶│ State         │───▶│ Kev 0.6B (ONNX)     │    │
│  │ Feed     │    │ Constructor   │    │                     │    │
│  │ (bars)   │    │ (bars→text)   │    │ 4 calls:            │    │
│  └──────────┘    └───────────────┘    │ E1: zone+pressure   │    │
│                                       │ E2: shape+cascade   │    │
│                                       │ E3: direction+qual  │    │
│                                       │ PVE: confidence     │    │
│                                       └──────────┬──────────┘    │
│                                                  │ probabilities  │
│  ┌──────────┐    ┌───────────────┐               │               │
│  │ Limite   │───▶│ Gate Layer    │◀──────────────┘               │
│  │ 1B       │    │ (pure Python  │                               │
│  │ (vLLM)   │    │  if/else)     │                               │
│  │          │    │               │                               │
│  │ computes:│    │ GATES:        │                               │
│  │ zone wdt │    │ rrr < 2.5→rej │                               │
│  │ SL dist  │    │ session?→rej  │                               │
│  │ RRR      │    │ SL>55p→rej    │                               │
│  │ fib lvls │    │ conf<B→flag   │                               │
│  │ comissn  │    └───────┬───────┘                               │
│  └──────────┘                    │ accept/reject + reason         │
│                                  ▼                                │
│                    ┌─────────────────────────────┐               │
│                    │ TradeDecision output        │               │
│                    └─────────────┬───────────────┘               │
│                                  │                               │
│                    ┌─────────────▼───────────────┐               │
│                    │ TensorTrade OMS             │               │
│                    │ backtest: execute+measure   │               │
│                    │ live: route to broker API   │               │
│                    └─────────────────────────────┘               │
│                                                                    │
│  DOCTRINE: arsumbris KG (649 cards)                              │
│    → offline → training data → fine-tune Kev                    │
│    → never queried at inference (determinism law)               │
│                                                                    │
│  HARNESS OPTIONS:                                                │
│    A. Vanilla Python (~300 lines) — simplest                    │
│    B. pi harness (earendil-works/pi) — if agent features needed │
│       (agent loop, tool calling, TUI, but NO coding needed)     │
│    C. TensorTrade's env wrapper — if RL training is wanted      │
└────────────────────────────────────────────────────────────────────┘
```

## The pi harness option

The operator mentioned `earendil-works/pi` (108k★, MIT, TypeScript). It's an **agent toolkit** with:
- Unified LLM API (pi-ai)
- Agent runtime with tool calling (pi-agent-core)
- TUI (pi-tui)
- Coding agent CLI (pi-coding-agent)

For Plutus V6, you'd use **pi-agent-core** (the agent runtime) but strip the coding agent entirely:
- The agent loop calls Kev instead of an LLM
- Tools = market data feed + Limite math + gate layer + TensorTrade
- No file editing, no code generation, no subagents
- Just: observe → decide → execute → report

This gives you a proven, maintained agent loop (108k stars, active CI, supply-chain hardened) without any coding capability — exactly what "coding is literally disabled on the plutus agent" demands.

## The complete V6 cycle (one trading decision)

```
1. Market feed delivers bars                        [0ms]
2. State constructor renders bars → Kev state text  [5ms]
3. Kev Call 1 (E1): 5 questions                     [10ms GPU]
4. Gate: if neutral → output "no_zone", wait        [<1ms]
5. Kev Call 2 (E2): 4 questions                     [10ms]
6. Gate: if cascade invalid → halt                  [<1ms]
7. Kev Call 3 (E3): 5 questions                     [10ms]
8. Limite: entry, SL, TP, RRR, fib                  [200ms]
9. Gate: if rrr < 2.5 → reject                      [<1ms]
10. Kev Call 4 (PVE): 3 questions                   [10ms]
11. Gate: if confidence < B → flag                  [<1ms]
12. Output TradeDecision                            [<1ms]
13. TensorTrade: execute + measure                  [async]

TOTAL LATENCY: ~250ms (GPU) / ~450ms (CPU)
TOTAL CODE: ~300 lines Python + Kev ONNX + Limite vLLM + TensorTrade
NO CODING AGENT. NO MIMOCODE. NO TTSR. NO SUBAGENTS.
```

## What each component contributes to V6

| Component | Contributes | Does NOT contribute |
|---|---|---|
| **Kev 0.6B** | ALL trading judgments (17 questions per cycle). Probability distributions. Deterministic inference. ONNX portable. | Math (no arithmetic). Code generation. Text generation. |
| **Limite 1B** | ALL numeric computation (zone geometry, SL, TP, RRR, fib, commission). 74.25% math accuracy. 131k context. | Trading decisions. Classifications. Confidence scoring. |
| **TensorTrade** | Simulated execution + commission modeling + portfolio tracking + walk-forward validation + Sharpe/Sortino/drawdown. RL training infrastructure. | Trading decisions. Math computation. Doctrine storage. |
| **Gate Layer** | Deterministic accept/reject. The RRR floor, session window, SL envelope. Pure Python if/else. | Any intelligence. Any judgment. Any probability. |
| **arsumbris KG** | 649 doctrine cards → offline training data for Kev fine-tuning. The law that governs the system. | Runtime queries. Inference-time lookups. Trading decisions. |
| **pi harness (optional)** | Agent loop + tool calling + TUI + state management. Proven, maintained, supply-chain hardened. | Coding capability (stripped). Subagent dispatch. File editing. |

## The V6 vs V5 comparison

| Axis | V5 (current) | V6 (proposed) |
|---|---|---|
| Decision engine | TypeScript rules interpreted by coding LLM | Kev 0.6B neural decision model |
| Math engine | Hardcoded TypeScript functions | Limite 1B competition-level math |
| Validation | Custom golden-gate harness | TensorTrade OMS + walk-forward |
| Runtime | MiMoCode/OMP agent stack | Vanilla Python (~300 lines) or pi |
| Doctrine | Arsumbris cards → code via agents | Arsumbris cards → Kev training data |
| Lines of runtime | 10,000+ | ~300 |
| Decision latency | Seconds (agent turns) | ~250ms (4 forward passes) |
| Coding needed | Yes (agents write code) | ZERO |
| Determinism | Enforced by discipline (R32) | Architectural (ONNX, no sampling) |
| Portability | Requires full OMP stack | ONNX runs anywhere |
