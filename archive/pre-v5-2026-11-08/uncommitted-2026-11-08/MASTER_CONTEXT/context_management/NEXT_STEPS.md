# NEXT STEPS — the V6 build plan (2026-09-17)

## THE MISSION
Build the Plutus V6 trading agent: Decider-2B + Limite 1B + TensorTrade on a pi TUI harness. Zero coding agent. Not headless. The 649 doctrine cards become training data.

## PHASE 1 (MVP — prove the concept, 3 workers in parallel)

### W1: pi harness + Decider-2B integration
- Clone earendil-works/pi (TypeScript, MIT, 108k★)
- Strip: coding tools, file editing, subagent dispatch
- Port: MiMoCode memory system (TypeScript→TypeScript copy-paste)
- Register tools: decider, limite, gates, tensortrade, report, tui
- Deploy Decider-2B on the 4080 (pip install decider-ai)
- Write the 17 question templates (E1:5, E2:4, E3:5, PVE:3)
- Write the state constructor (bars → Decider state text, ~200L)
- Files: pi-harness/, decider-wrapper.py, question-templates.py, state-constructor.py
- Lines: ~400
- DONE-WHEN: Decider serves /v1/systemone on localhost, 17 questions return calibrated probabilities, state constructor renders golden-week bars
- GATE: d.decide(state, questions) returns valid distributions with ECE < 0.05 on test cases

### W2: Limite 1B + gate layer
- Deploy Limite 1B on the 4080 via vLLM (temperature=0, NOT the recommended 0.6)
- Write the 6 math queries (L1-L6: zone width, SL distance, RRR, fib levels, commission, TP distance)
- Write the prompt grammar: JSON envelope with quote+anchor (D13 law inside the prompt)
- Write the dual-compute verifier (Python shadow + |diff| ≤ eps)
- Write the 8 deterministic gates (G-RRR, G-SESSION, G-SL, G-CONF, G-CASCADE, G-CHAIN, G-DEDUP, G-DUAL)
- Write the 7 MPSE gates (G-LIM-01..07)
- Files: limite-wrapper.py, math-queries.py, dual-compute.py, gates.py, mpse-gates.py
- Lines: ~500
- DONE-WHEN: L3 RRR query reproduces Tier-A golden RRRs ±0.02, dual-compute fires on deliberately wrong output, all 15 gates produce named refusal tokens
- GATE: Golden RRR reproduction 4.25/4.92/4.60/3.58/3.79/5.84 within tolerance

### W3: State constructor + cached bars
- Load golden week bars from the V5 fixture (bars_raw.json or Checkpoints/v5-W9-open-doctrine/fixture-backup/)
- Render bars → Decider state text format (~200L)
- Handle multiple timeframes (30m, 1H, 4H)
- Session detection (London 02:00-05:00 ET)
- Files: state-constructor.py, bar-renderer.py
- Lines: ~200
- DONE-WHEN: Golden week bars render to valid Decider state, session timestamps match London window
- GATE: State text format matches Decider input requirements

### PHASE 1 → PHASE 2 GATE
- Decider returns valid probabilities on golden week state
- Limite computes correct RRR on golden week zones
- Dual-compute verifier passes on known-good inputs

## PHASE 2 (validation — prove it works, 3 workers in parallel)

### W4: TensorTrade OMS
- pip install tensortrade
- Wire TradeDecision → Exchange.execute_order()
- Configure commission: 0%, 0.1%, 0.2%
- Walk-forward: train on golden week, test on unseen week
- Files: tensortrade-oms.py, commission-analysis.py, walk-forward.py
- Lines: ~200
- DONE-WHEN: Commission sensitivity at 3 levels, P&L tracked, Sharpe computed

### W5: TUI trading pane
- pi TUI pane: live P&L, open positions, probability bar charts, gate decisions, rejection log
- Keyboard: [space] pause, [g] gate log, [p] probabilities, [r] report
- Files: tui-trading-pane.ts
- Lines: ~200
- DONE-WHEN: Every probability visible, every gate decision visible, every rejection has a named token

### W6: Report generator
- 8 sections: Overview, Zones, Shapes, Trades, Chaining, Stats, Storyline, Golden Check
- Golden check: compare against 23 golden trades ≤3p
- Files: report-generator.py
- Lines: ~100
- DONE-WHEN: Report on golden week matches known-good output

### PHASE 2 → PHASE 3 GATE
- TensorTrade profitable at 0.1% commission
- Report generates correctly
- TUI shows live results

## PHASE 3 (quality + cutover, 4 workers in parallel)

### W7: Doctrine fine-tune corpus
- Generate ~700 (state, questions, answers) records from 649 cards
- Fine-tune Decider-2B (the decider package includes the training recipe)
- A/B test: fine-tuned vs prompt-engineered
- Files: corpus-generator.py, fine-tune.py, ab-test.py
- Lines: ~300
- DONE-WHEN: Fine-tuned ≥ 14/15 golden entries, forensic 38 correctly classified

### W8: MPSE predicates
- Write AT-01..AT-10 as Python functions
- Wire into the pipeline (run after every trade decision)
- 3-way trust: oracle AND limite AND script
- Files: mpse-predicates.py, trust-engine.py
- Lines: ~150
- DONE-WHEN: All 10 AT predicates executable, 3-way verification produces named verdict

### W9: Determinism + memory
- Replace Date.now() with counters, wall-clock with bar-indices
- SHA-identical output on same inputs
- MiMoCode memory port for cross-session trade history
- Files: determinism.py, memory-port.ts
- Lines: ~200
- DONE-WHEN: sha256(run1) == sha256(run2), memory persists across restarts

### W10: Integration + golden week test
- Wire everything: pi + Decider + Limite + gates + TensorTrade + TUI + report
- Run on golden week bars
- Compare vs canon (report-v452.ts 15/15)
- Files: main.py, golden-week-test.py, comparison.py
- Lines: ~100
- DONE-WHEN: ≥14/15 entries within 3-pip precision, latency <500ms

## RISK REGISTER
| Risk | Impact | Mitigation |
|---|---|---|
| Decider-2B OOD accuracy insufficient for domain | Low probability decisions | Fine-tune on 649 doctrine cards (W7) |
| Limite hallucinates math | Wrong SL/TP/RRR | Dual-compute verifier (W2) catches all |
| TensorTrade commission kills the edge | False positive strategy | Test at 0.1% before cutover (W4) |
| pi harness too complex to strip | Delayed Phase 1 | Start with minimal config, add features incrementally |
| 4080 memory contention (Decider 3.5GB + Limite 1GB) | OOM | Decider uses CUDA graphs (pre-allocated), Limite uses vLLM (separate process) |
| Fine-tuning overfits to golden week | Poor generalization | Hold out forensic 38 as validation set |
| Determinism impossible with neural models | Violates R32 | Temperature=0 + fixed seed + quantized outputs |

## FINAL V6 CONFIGURATION (2026-09-17 — operator confirmed)
- Decision model: **Decider-0.6B** (not Decider-2B, not Kev — the 0.6B variant of the same family)
- Orchestrator: **Qwen3-4B q8** (BeeLlama kvarn4, 32k context)
- Math engine: **Limite-1B bf16** @131k full context (BeeLlama kvarn4 on global layers)
- VRAM: 10.5GB / 12GB → 1.5GB headroom
- Architecture: **embedded circuit** (the TTE pipeline is ONE self-contained tool the primary agent calls — the agent is NOT in the loop, it receives a pristine report)
- The agent behavior from V4/V5 is UNCHANGED — only the runtime changes (MiMoCode → pi)
- Angels: tiny trained policies as micronodes for data-flow coordination between intelligence gates
- Port list: pi warheads/identity, plutus tools, plutus skills/workflows, MiMoCode memory, TV MCP 3.0, read/write/edit/grep (4 tools, no bash, no coding)
- Qwen3-4B is for "agent reasoning and analysis here" pipeline sections + web data fetching via TV MCP

---

# NEXT STEPS — APPENDED 2026-09-24 (the model-server wave, before V6 Phase 1)

The model server stack is a **runtime prerequisite** for the V6 build: W1 needs a decision
model serving, W2 needs a math engine. Both now exist locally. This wave closes the gaps
that would otherwise bite Phase 1.

## WAVE M0 — EMBED MERGE (URGENT: the layer is DOWN)

**Why now:** both embed units are stopped. OMP memory `v1/recall` fails (`10001`, zero
vectors) and OpenViking embeddings are non-functional. Every agent memory operation is
degraded until this closes.

**Done-when:**
- `curl -s http://127.0.0.1:18082/v1/models` → the nomic model id (OMP memory path)
- `curl -s http://127.0.0.1:8001/v1/models` → the nomic model id (OpenViking path)
- `curl -s http://127.0.0.1:<port>/v1/embeddings -d '{"input":"x"}'` → **768** floats on both
- `curl -s http://localhost:1933/health` → `healthy: true` (OpenViking unaffected)
- both units re-homed to `/home/leviathan/llama.cpp/build-cpu/bin/llama-server`, both unit
  files KEPT, **no consumer reconfigured**
- `nvidia-smi` shows the embed VRAM (previously 1,142 MiB) gone

## WAVE M1 — MODEL SERVER HARDENING

**Why now:** all three are bare `setsid nohup` at `oom_score_adj=200` — the first things
the OOM killer takes, and nothing restarts them. A killed decision model mid-session is a
silent failure.

**Done-when:**
- each server has a systemd unit with `Restart=always`, `OOMScoreAdjust=-1000`, a memory
  floor, a `MemoryMax` cap, `ReadOnlyPaths` on the model dir, `NoNewPrivileges=yes`
- `systemctl show <unit> -p DropInPaths -p OOMScoreAdjust` reflects the config
- **smoke = a REAL completion** (`/v1/chat/completions`), not `/health`
- after restart: `/proc/<pid>/root/<a-blocked-path>` fails, `/proc/<pid>/root/<a-needed-path>` succeeds
- ledger row written per unit (context file with the operator's words verbatim)

## WAVE M2 — D-014 RESOLUTION

**Why now:** the canon describes Decider-2B + Limite; the box runs JevK5 + DeepSeek. Every
fresh agent is currently misled.

**Done-when:** an operator ruling recorded in DECISION_CHAIN as D-014-resolved, and either
D-003 is marked superseded, or JevK5 is scoped to a named layer with the V6 target intact.

## WAVE M3 — MATH PATH INTEGRITY

**Why now:** the operator's requirement is the math model "CANNOT hallucinate/derail/be
wrong". The model is only layer 1 of that guarantee.

**Done-when:**
- layer 2 exists: a deterministic engine that computes the emitted expression (integer
  arithmetic for Fibonacci; `Decimal`/`mpmath` for probabilistic work)
- layer 3 exists: a Jev gate that refuses any mismatch between the model's stated result
  and the computed value
- an adversarial battery proves it: deliberately wrong model output is REFUSED, correct
  output is accepted
- the two-point kvarn3 measurement on `:4172` replaces the back-solved ~3.1 b/v

## THEN — the existing V6 waves (unchanged, now unblocked in their model dependency)
W1 (pi harness + Decider) · W2 (Limite + gates) · W3 (state constructor) — still awaiting
operator GO, and now with the D-014 question open about which models W1/W2 target.

## THE CARRIED-FORWARD BACKLOG (unchanged)
- Cross-link pass (716 nodes / >100 edges)
- Anchor pass (17 flagged rulings)
- graph.db archive decision (126MB legacy)
- OPEN-003 (host-owns-kernel) · OPEN-002 (pipewire rebuild) · EN-007 (ydotool)
- Session-start inject (au-mcp)
- 5.3.3 prompt rebuild
