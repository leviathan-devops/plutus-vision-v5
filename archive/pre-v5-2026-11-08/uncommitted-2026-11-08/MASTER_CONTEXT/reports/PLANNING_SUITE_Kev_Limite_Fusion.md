# PLANNING SUITE — Kev/Limite Fusion for the Plutus Trading Agent
**Classification:** ARCHITECTURAL (new runtime, replacing the coding-agent harness)
**Date:** 2026-09-17 · **Baseline:** v4.5.3_CLEAN_BASELINE (the canon pipeline) · **New models:** Kev 0.6B (ONNX) + Limite 1B (vLLM)

---

## §0 THE READ RECEIPTS
- brainstorming: READ — the law is the HARD GATE (intent approved before implementation)
- blueprinting: READ — the law is the DIFFERENTIAL (what existing things do NOT do = the spec)
- focus: READ — the law is MEASURE >> WRITE (verify claims mechanically, never trust prose)
- fable-plan: READ — the law is the PARALLEL FAN-OUT (evidence first, one batch)
- trident-problem-solving: READ — the law is the HARD BOUND (3 failed cycles → hand back diagnosis)

## 1 THE CLASSIFICATION + INTENT

**ARCHITECTURAL.** This replaces the MiMoCode-based trading agent runtime with a Kev/Limite decision pipeline. The trading agent needs ZERO coding capabilities (operator ruling: "coding is literally disabled on the plutus agent"). The harness is a thin Python process that:
1. Feeds market data to Kev (decision model) and Limite (math reasoner)
2. Collects probability distributions per question
3. Applies deterministic gates on the outputs
4. Emits trade decisions for execution + validation

**The intent:** "RESTART FROM 4.5.3 CHECKPOINT. LOOK AT THE NEW MODELS — TELL ME HOW EVERYTHING INTEGRATES FOR A CLEAN AND EASY FUSION THAT SHOULD BE MUCH SIMPLER AND INSTANTLY FUNCTIONAL."

## 2 THE DIFFERENTIAL

| Existing thing | What it does | What it does NOT do |
|---|---|---|
| MiMoCode/OMP runtime | Spawns coding agents, manages sessions, runs TS code, TTSR rules, subagent dispatch | Make trading decisions. Be fast. Run without an agent stack. Be deterministic (an LLM interprets code). |
| The TypeScript E1/E2/E3 pipeline | Implements zone detection, shape chains, trade mapping in code | Learn from new data. Be portable. Run without Bun. Be modifiable without a coding agent. |
| Kev 0.6B | Takes state + typed questions → probability distributions. Single forward pass. No generation. ONNX portable. | Generate code. Produce text. Replace the math (no arithmetic capability). |
| Limite 1B | Competition-level math reasoning (74.25% BeyondAIME). Computes precise numeric answers. 131k context. | Make trading decisions. Classify zones. Score confidence. |
| TensorTrade OMS | Simulated execution, commission modeling, portfolio tracking, walk-forward validation. | Make trading decisions. Compute zone geometry. Store doctrine. |
| arsumbris KG | 649 typed cards storing the doctrine verbatim, live-indexed, queryable. | Execute trades. Make decisions. Compute math. |

**The empty cells are the spec:** nothing existing combines a decision model + math reasoner + OMS + doctrine store into a unified trading agent. That fusion IS the new architecture.

## 3 THE REDUCED CORE

**ONE MECHANISM:** a **judgment loop** — market state enters, Kev produces probability distributions over typed questions (zone class, shape, direction, quality, session validity), Limite computes the numeric anchors (entry/SL/TP distances, RRR, fib levels), deterministic gates consume both outputs, and a trade decision (or a rejection with reason) exits.

**Derived laws:**
1. Kev decides WHAT (direction, quality, validity); Limite computes HOW MUCH (distances, levels, ratios). Never reversed.
2. Every gate is deterministic code consuming Kev/Limite outputs — no LLM in the gate layer.
3. Doctrine stored in arsumbris → becomes Kev's training data → improves decisions as cards grow.

## 4 THE DESIGN (the blueprint canon, focused)

### §0 THE FIRST-PRINCIPLES CORE

The Plutus trading agent is a **judgment pipeline over structured market state**, not a coding task. Every stage — E1 (zone/pressure classification), E2 (storyline state), E3 (trade decision) — is fundamentally a set of typed questions about market state that produce probability distributions. Kev's architecture (state + typed questions → softmax over options, block-causal attention, single forward pass) is a direct structural match for this pipeline.

### §5 THE ENFORCEMENT LAWS

1. **Kev scores, never edits (PVE law).** Kev's probability distributions are INPUTS to the gate layer. The gate layer (deterministic code) makes the final accept/reject. FORBIDDEN: using Kev to modify zone data, shape assignments, or E1/E2 output.
2. **Every question carries its full state.** Kev sees the raw bars + the E1/E2 outputs + the doctrine context. FORBIDDEN: asking Kev to reason from partial state (this causes hallucinated classifications).
3. **The RRR floor is code, not judgment.** `if rrr < 2.5: reject` is a gate, never a Kev question. FORBIDDEN: asking Kev "is this RRR good enough?" — compute it with Limite, gate it with code.
4. **ONNX means deterministic inference.** Same input → same output, every time. FORBIDDEN: introducing randomness (temperature, sampling) into the Kev inference path.
5. **The doctrine feeds the model, not the runtime.** Cards in arsumbris become training examples for Kev fine-tuning. FORBIDDEN: querying arsumbris at inference time (too slow, breaks determinism).

### §6 THE FALSIFICATION INSTRUMENTS

1. **The golden-23 oracle:** the fine-tuned Kev must reproduce the canon pipeline's decisions on the 23 golden trades (15/15 entry precision, 2/2 TP precision). If it doesn't, the training data or the question mapping is wrong.
2. **The forensic-38 check:** every trade in the 38-trade forensics must be classified correctly (direction, quality grade, session validity).
3. **The commission sensitivity test:** TensorTrade runs the Kev-based decisions at 0%, 0.1%, 0.2% commission — profitability must survive at 0.1%.

### §12 THE OPEN DECISIONS

1. **Fine-tune vs prompt-engineer Kev.** Fine-tuning on the 649 cards gives better in-domain accuracy but requires a training pass. Prompt-engineering (crafting the state text carefully) works immediately but is less precise. DEFAULT: start with prompt-engineering, fine-tune when the question mapping is proven.
2. **Kev local vs Jev API.** Kev 0.6B local (ONNX, free, ~0.62 OOD accuracy) vs Jev API (~0.86 OOD accuracy, costs tokens). DEFAULT: local Kev for the loop, Jev for validation/debugging.
3. **Limite deployment.** Limite 1B needs vLLM + CUDA. Can it share the 4080 with other workloads? DEFAULT: yes, 1B is small enough.
4. **Replace the TS pipeline entirely, or run parallel?** DEFAULT: parallel first (Kev pipeline alongside the TS pipeline, compare outputs on the golden week), then cut over when Kev matches.

## 5 THE EVIDENCE

- The E3 canon pipeline (report-v452.ts) already implements the cascade DXY→EU→GU with zone-anchored entries, 3-pip precision, session filtering, RRR floors — all of which map to Kev questions + code gates.
- The L2 spec (V4.5.4_REASONING_CHAIN_ARCHITECTURE) describes E3 as "a classification + precision alignment engine of the E1 + E2 data" — this is literally what Kev does.
- Kev's block-causal attention (questions see state, not each other) matches E1/E2/E3's constraint that each engine builds on the previous without overriding.
- The 649 doctrine cards in arsumbris are already structured as (state, rule, verdict) — directly convertible to Kev training records.
- Kev 0.6B in-distribution accuracy: 0.801 (dev) / 0.808 (locked test). Out-of-domain: 0.620 (capacity-limited; 4B reaches 0.75).
- Limite 1B achieves 74.25% on BeyondAIME, beating 30B models at math reasoning.

## 6 THE APPROACH (5 phases)

**Phase 1 — Prompt-Engineered Prototype (1 session):**
- Serve Kev locally (ONNX, ~400MB RAM)
- Write the Python harness (~200 lines): data feed → state construction → Kev calls → gate layer → trade output
- Test against the golden week: does the Kev pipeline produce the same 15/15 entries?

**Phase 2 — Limite Math Engine (1 session):**
- Deploy Limite on the 4080 via vLLM
- Replace hardcoded zone geometry / RRR calculations with Limite computations
- Verify: same numbers as the TS pipeline

**Phase 3 — Fine-Tune on Doctrine (1 training pass):**
- Generate ~1,000 (state, questions, answers) records from the 649 cards
- LoRA fine-tune Kev on these (same protocol as Kev's training: r=16, lr 1e-4)
- Compare fine-tuned vs prompt-engineered on the golden + forensic sets

**Phase 4 — TensorTrade Validation (1 session):**
- Wire the Kev pipeline output into TensorTrade's OMS
- Run walk-forward validation + commission sensitivity
- Compare P&L / Sharpe / drawdown vs the TS pipeline

**Phase 5 — Cutover (when Phase 4 passes):**
- The Kev pipeline replaces the TS pipeline as the primary
- The TS pipeline becomes the reference implementation

## 7 SUCCESS CRITERIA (mechanical)

1. Kev pipeline reproduces ≥ 14/15 golden entries at ≤3p precision
2. Every forensic trade's direction + quality grade is correctly classified
3. TensorTrade walk-forward: profitable at 0.1% commission on ≥ 2 unseen weeks
4. End-to-end decision latency < 100ms (GPU) / < 500ms (CPU)
5. Zero network dependency at inference time

## 8 THE EXECUTION CHECKLIST

```
Phase 1:
  □ Install onnxruntime + transformers.js
  □ Download kev-0.6b-ONNX (q4 for CPU, q4f16 for GPU)
  □ Write the state constructor (bars → Kev state text)
  □ Write the question templates (E1: 5q, E2: 4q, E3: 5q, PVE: 3q)
  □ Write the gate layer (deterministic Python, ~100 lines)
  □ Run the golden week: compare Kev output vs canon 15/15
Phase 2:
  □ Deploy Limite 1B via vLLM on the 4080
  □ Write the math queries (zone width, SL, RRR, fib)
  □ Verify numbers match the TS pipeline
Phase 3:
  □ Generate training records from the 649 doctrine cards
  □ Fine-tune Kev (LoRA r=16, pointer head)
  □ A/B test on golden + forensic
Phase 4:
  □ Install tensortrade
  □ Wire Kev output → TensorTrade Exchange
  □ Commission sensitivity at 0%, 0.1%, 0.2%
  □ Walk-forward on unseen weeks
Phase 5:
  □ Cutover decision
  □ TS pipeline → reference implementation
```

## 9 THE ANTI-PATTERNS

| Failure class | Detection |
|---|---|
| Kev used for math (arithmetic) | Limite handles ALL numeric computation |
| Kev asked to edit E1/E2 data | The gate layer only READS Kev output |
| LLM in the gate layer | Gates are pure Python if/else |
| Doctrine queried at inference | Training data generated OFFLINE |
| Randomness in inference | ONNX temperature=0, deterministic |
| MiMoCode still in the loop | The harness is vanilla Python |

## 10 THE RESIDUAL

- Kev 0.6B OOD accuracy is 0.620 — fine-tuning should push to ~0.75+ in-domain (UNPROVEN until Phase 3)
- Limite requires a GPU for vLLM (the 4080 works but shares resources)
- The TS pipeline remains the reference until Phase 5 cutover
- TensorTrade introduces a Python dependency

## 11 THE HANDOFF

The next artifact is the **E3 master blueprint** (from the scouts) + this planning document → feed both to the agent producing the 5.3.3 prompt → that agent rebuilds the prompt with Kev/Limite infrastructure context.

---


---

# APPENDIX A — THE COMPLETE KEV QUESTION MAPPING

## A.1 E1 Pressure Detection (Kev Call 1)

**State construction:** the 30m/1H/4H OHLCV bars for the pair, rendered as a structured text block with zone annotations, plus the pair identity and session context.

```
State = {
  "pair": "EUR/USD",
  "session": "London Open 02:00-05:00 ET",
  "tf_hierarchy": "4H→1H→30m→15m",
  "bars_30m": [{"t":"2026-07-06T02:00","o":1.14120,"h":1.14280,"l":1.14080,"c":1.14220,"v":1200,"body":100,"range":200}, ...],
  "bars_1h": [...],
  "bars_4h": [...],
  "atr_14_30m": 0.00120,
  "context": "Monday of the golden week. DXY macro SHORT context."
}
```

**Questions (all in ONE forward pass):**

| ID | Primitive | Instructions | Options |
|---|---|---|---|
| E1.Q1 | Choice | "What is the zone type at the current price level?" | BoM: Break-of-Momentum origin zone · MoM: Momentum continuation zone · PHANTOM_BOM: Type-2 virgin MoM (all-4 predicate) · LQZ: Liquidity zone (3-candle gate) · S_D: Supply/Demand zone |
| E1.Q2 | Noul | "Does this zone pass the OBCV displacement gate?" | pass: body ≥1.5× avg AND range ≥1.5× ATR · fail: either dimension short |
| E1.Q3 | Choice | "What is the mitigation count of this zone?" | unmitigated: no touch since formation · 1x: one retest (80% strength) · 2x: two retests (50% strength) · 3x_depleted: three+ retests (TP-only, no entry) |
| E1.Q4 | Choice | "What is the pressure classification?" | strong_demand: multiple holds, clear reactions · weak_demand: partial holds, some penetration · neutral: no clear bias · weak_supply: partial supply absorption · strong_supply: multiple rejections from above |
| E1.Q5 | Noul | "Is this a FORTRESS zone?" | yes: 4+ strong holds + Fire→Earth transition (~95% flip probability) · no: fewer than 4 defense events |

**Output consumption:** the gate layer reads the argmax + confidence. If E1.Q4 = neutral with confidence < 0.6, the pipeline outputs "no_zone" and skips E2/E3 for this pair. If E1.Q3 = 3x_depleted, the zone is marked TP-only (excluded from entry generation but retained for exit targeting).

## A.2 E2 Storyline State (Kev Call 2)

**State:** E1 output + prior E2 state + day context.

```
State = {
  "e1_output": {"zone_type": "BoM", "pressure": "strong_demand", "mitigation": "1x", "obcv": "pass", "fortress": false},
  "prior_e2_state": {"shape": "BS", "position": "post_BS", "day_element": "BS_day"},
  "day": "Monday",
  "pair": "EUR/USD",
  "dxy_context": "DXY macro SHORT, EU expected inverse LONG"
}
```

**Questions:**

| ID | Primitive | Instructions | Options |
|---|---|---|---|
| E2.Q1 | Choice | "What shape is currently forming in the price action?" | BS: first surging impulse breaking structure (1-3 dense candles or 6-12 with micro-consolidations) · WL: follow-up surging impulse after BS+Recovery · RWL: whiplash immediately reversing with zero recovery · R: recovery move after a BS · SS: strong surge with sustained momentum · consolidation: range-bound with no directional bias |
| E2.Q2 | Choice | "What day element is active?" | BS_day: the day that breaks structure · WL_day: whiplash day following the break · R_day: recovery day · Recovery_day: the recovery after whiplash |
| E2.Q3 | Choice | "Is the DXY→EU→GU cascade valid?" | valid: DXY direction confirmed + EU inverse matches + GU injection consistent · invalid: any leg contradicts · partial: DXY confirmed but EU/GU pending |
| E2.Q4 | Choice | "What is the zone freshness ladder position?" | unmitigated: strongest entry (no retest) · 1x_80pct: one retest, 80% strength · 2x_50pct: two retests, 50% strength · 3x_depleted: TP-only |

**Output consumption:** if E2.Q3 = invalid, the pipeline halts for this pair (the cascade gate). If E2.Q1 = consolidation, no trade is generated (wait state). The shape + day_element are stored for E3.

## A.3 E3 Trade Decision (Kev Call 3)

**State:** E1 + E2 outputs + the specific zone being evaluated.

```
State = {
  "e1": {"zone_type": "BoM", "pressure": "strong_demand", ...},
  "e2": {"shape": "BS", "day_element": "BS_day", "cascade": "valid", ...},
  "candidate_zone": {"top": 1.14200, "bottom": 1.14100, "type": "BOM_DEMAND", "tf": "30m"},
  "pair": "EUR/USD",
  "session": "London Open",
  "dxy_inverse": "LONG"
}
```

**Questions:**

| ID | Primitive | Instructions | Options |
|---|---|---|---|
| E3.Q1 | Choice | "What is the trade direction?" | long: demand zone + bullish shape + inverse DXY · short: supply zone + bearish shape + DXY-aligned · no_trade: conflicting signals or insufficient confluence |
| E3.Q2 | Score | "What is the entry zone quality?" | F_reject: sub-floor RRR or invalid session · C_flagged: marginal, manual review required · B_pass: adequate quality, meets minimum gates · A_pass: strong confluence, multiple confirmations · Aplus: fortress + unmitigated + strong cascade |
| E3.Q3 | Noul | "Is the session window valid for entry?" | yes: price touched the entry level during the assigned session (London 02:00-05:00 ET) · no: level touched outside the window (Asian fill = rejected) |
| E3.Q4 | Noul | "Is the SL within the 3-55 pip envelope?" | yes: zone width + 3-5p buffer falls in 3-55p range · no: SL outside the observed envelope |
| E3.Q5 | Noul | "Does the entry have liquidity shield coverage?" | yes: the entry zone itself is the shield (84% of golden trades) · no: a separate LSZ between entry and SL is missing |

**Output consumption:** if E3.Q1 = no_trade, the pipeline emits nothing for this zone. If E3.Q2 = F_reject, the setup is rejected. The direction + quality + session_validity are passed to the Limite math call + the gate layer.

## A.4 PVE Scoring (Kev Call 4)

**State:** E3 output + market context for probability assessment.

```
State = {
  "e3": {"direction": "long", "quality": "A_pass", "entry": 1.14110, "sl": 1.13925, "tp": 1.14395},
  "atr_14_30m": 0.00120,
  "session_remaining_pct": 0.65,
  "um_walls_between": 1,
  "zone_age_hours": 18
}
```

**Questions:**

| ID | Primitive | Instructions | Options |
|---|---|---|---|
| PVE.Q1 | Score | "What is the TP hit probability?" | very_low: <20% chance · low: 20-40% · medium: 40-60% · high: 60-80% · very_high: >80% |
| PVE.Q2 | Noul | "Is the entry reachable within the remaining session time?" | yes: expected travel ≤ session ATR budget · no: entry too far (P_entry_fill collapses) |
| PVE.Q3 | Score | "What is the overall confidence grade?" | F: <0.50 reject · C: 0.50-0.59 flagged manual · B: 0.60-0.69 pass · A: 0.70-0.79 pass · Aplus: ≥0.80 pass |

## A.5 Limite Math Engine (parallel with Kev, or sequential)

Limite computes the NUMBERS that Kev cannot:

| Query | Input | Output |
|---|---|---|
| Zone width | zone top/bottom from bars | width in pips (e.g., 1.14200-1.14100 = 10.0 pips) |
| SL distance | zone width + buffer (3-5p) | SL in pips (e.g., 10.0 + 3.0 = 13.0 pips) |
| TP distance | distance from entry to target zone | TP in pips |
| RRR | TP_dist / SL_dist | ratio (e.g., 28.5 / 13.0 = 2.19) |
| Fib levels | swing high/low anchors | 0.382, 0.5, 0.618, 0.786, 1.272, 1.618 levels |
| Commission impact | gross_pips × commission_rate | net_pips after costs |

**RRR gate (deterministic code, NOT Kev):**
```python
rrr = limite.compute_rrr(tp_dist, sl_dist)
if rrr < 2.5:
    return Reject(f"RRR {rrr:.2f} < 2.5 floor")
```

---

# APPENDIX B — THE NEW RUNTIME ARCHITECTURE

## B.1 The Process Topology

```
┌──────────────────────────────────────────────────────────────────┐
│ PLUTUS TRADING RUNTIME (vanilla Python, ~300 lines total)       │
│                                                                  │
│   ┌─────────┐     ┌──────────────┐     ┌────────────────────┐   │
│   │ Market  │────▶│ State        │────▶│ Kev 0.6B (ONNX)    │   │
│   │ Feed    │     │ Constructor  │     │ 4 calls per cycle: │   │
│   │ (bars)  │     │ (bars→text)  │     │ E1 → E2 → E3 → PVE │   │
│   └─────────┘     └──────────────┘     └─────────┬──────────┘   │
│                                                  │ probabilities│
│   ┌─────────┐     ┌──────────────┐              │              │
│   │ Limite  │────▶│ Gate Layer   │◀─────────────┘              │
│   │ 1B      │     │ (pure Python │                              │
│   │ (math)  │     │  if/else)    │                              │
│   └─────────┘     └──────┬───────┘                              │
│                          │ accept/reject + reason               │
│   ┌─────────────────────▼──────────────────────┐               │
│   │ Output: TradeDecision                      │               │
│   │ {direction, entry, sl, tp, rrr,            │               │
│   │  quality, confidence, session, pair}       │               │
│   └─────────────────────┬──────────────────────┘               │
│                         │                                       │
│   ┌─────────────────────▼──────────────────────┐               │
│   │ TensorTrade OMS (backtesting)              │               │
│   │ or Broker API (live/paper)                 │               │
│   └────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

## B.2 The Cycle (one trading decision)

```
1. Market feed delivers new bars
2. State constructor renders bars → Kev state text (~2000 tokens)
3. Kev Call 1 (E1): 5 questions, one forward pass → zone classification
4. If E1 says neutral: output "no_zone", wait for next bars
5. Kev Call 2 (E2): 4 questions + E1 output in state → shape/state
6. If E2 says invalid cascade: output "halt", wait
7. Kev Call 3 (E3): 5 questions + E1+E2 in state → direction + quality
8. Limite computes: entry price, SL distance, TP distance, RRR
9. Gate layer: if rrr < 2.5 → reject; if session invalid → reject; etc.
10. Kev Call 4 (PVE): 3 questions + E3 output → confidence grade
11. Gate layer: if confidence < B → flag for review
12. Output TradeDecision to TensorTrade/Broker
```

**Latency budget:** 4 × Kev forward pass (~10ms each on GPU, ~50ms on CPU) + 1 × Limite call (~200ms on vLLM) + gate layer (<1ms) = **~250ms GPU / ~450ms CPU per decision cycle.**

## B.3 The Doctrine → Training Data Pipeline

```
arsumbris knowledge graph (649 cards)
  │
  ├── 38 rulings → labeled decision examples
  │   ("RRR ≥ 2.5 → accept" → E3 RRR question: yes)
  │   ("zone-anchored, never price-anchored" → E3 entry zone question)
  │
  ├── 583 mechanism cards → (state, question, answer) triples
  │   ("OBCV displacement: body ≥1.5× AND range ≥1.5×" → E1.Q2: pass)
  │   ("BS = first surging impulse breaking structure" → E2.Q1: BS)
  │   ("FORTRESS = 4+ holds → 95% flip" → E1.Q5: yes)
  │
  ├── 38 forensic trades → full pipeline test cases
  │   (state = actual bars from trade, questions = full set,
  │    answers = what actually happened)
  │
  └── 23 golden trades → the validation oracle
      (state = golden week bars, questions = full set,
       answers = the canon pipeline's verified output)
```

## B.4 Why This Is Simpler Than MiMoCode

| Axis | MiMoCode harness | Kev harness |
|---|---|---|
| Runtime processes | OMP daemon + session + subagent dispatch + TTSR + extensions | 1 Python process |
| Lines of infrastructure | 10,000+ | ~300 |
| Dependencies | Bun, OMP, agent runtime, MCP servers, skills system | Python + onnxruntime (+ vLLM for Limite) |
| Decision latency | Seconds (agent turns, tool calls, session overhead) | Milliseconds (forward passes) |
| Portability | Requires the full OMP stack | ONNX runs anywhere: CPU, GPU, WebGPU, browser |
| Doctrine coupling | Doctrine is code (agents read it, interpret it, write code that implements it) | Doctrine is training data (fine-tuned into the model's weights) |
| Modification path | Edit TypeScript → rebuild → test | Add doctrine cards → regenerate training data → fine-tune |
| Coding requirement | An agent that can code | ZERO — the pipeline IS the model |

<!-- DOC-COMPLETE -->
