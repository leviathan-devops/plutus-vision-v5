# DECISION_CHAIN (2026-09-17)

## D-001: The knowledge graph substrate
- RULING: "graph built ONLY from /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT"
- CONTEXT: The initial seed used PLUTUS_Knowledge as a separate repo — operator corrected to corpus-only
- RATIONALE: The corpus IS the knowledge; no external card sources
- ALTERNATIVES REJECTED: PLUTUS_Knowledge as a separate graph (rejected — single source of truth)
- IMPLICATIONS: All cards live in MASTER_CONTEXT, indexed by the engine watching that folder

## D-002: The adapter architecture (OMP as harness)
- RULING: Build au-mcp-adapter-omp following the decoded adapter contract
- CONTEXT: Operator wanted OMP connected as an in-app agent harness in au-host
- RATIONALE: The adapter contract is self-declaring type-defs — any CLI can become launchable
- ALTERNATIVES REJECTED: Only cc/codex adapters (insufficient — operator wanted OMP)
- IMPLICATIONS: The adapter works for discovery+selection but the session spawn is BROKEN (OPEN-003)

## D-003: Model choice — Decider-2B over Kev 0.6B
- RULING: "decider it is then"
- CONTEXT: Head-to-head audit of both models' specs, benchmarks, and architecture
- RATIONALE: Decider-2B wins on OOD accuracy (0.755 vs 0.620 = +13.5 pts), calibration (ECE 0.037 vs 0.089 = 2.4× better), context (32k vs 8k = 4×), RL-trained beliefs, vision variant, browser agents (93%)
- ALTERNATIVES REJECTED: Kev 0.6B (lower OOD, worse calibration, smaller context, no RL, no vision)
- IMPLICATIONS: All V6 specs updated for Decider; Kev references are historical

## D-004: Harness choice — pi over MiMoCode
- RULING: "we don't need a coding agent to run a trading agent"
- CONTEXT: Operator realized the trading agent needs ZERO coding capabilities; MiMoCode was chosen because it was familiar, not because it was right
- RATIONALE: pi provides agent loop + tool calling + TUI without any coding capability; 108k★, MIT, supply-chain hardened
- ALTERNATIVES REJECTED: MiMoCode (coding overhead irrelevant to trading), vanilla Python (headless = BANNED), TensorTrade as harness (it's a library, not a runtime)
- IMPLICATIONS: The V6 runtime is pi + Decider + Limite + TensorTrade, no MiMoCode, no OMP, no TTSR, no subagents

## D-005: Headless banned
- RULING: "headless is banned" / "BANNED"
- CONTEXT: TensorTrade was described as headless; operator immediately banned headless operation
- RATIONALE: The operator must be able to see every probability, every gate decision, every rejection
- ALTERNATIVES REJECTED: Headless Python script, background process, no TUI
- IMPLICATIONS: pi TUI is mandatory; the trading pane is a first-class component (SPEC-W4)

## D-006: The MPSE/Limite fusion
- RULING: Operator demanded full analysis of MPSE unlocked with Limite
- CONTEXT: MPSE was Math-as-Spec (TS strings) + Code-as-Implementation (TS functions) + Tests-as-Proof (battery)
- RATIONALE: Limite adds an INDEPENDENT math authority that cross-verifies code — closing the circular trust problem
- ALTERNATIVES REJECTED: Code-only verification (circular), LLM-as-judge (not deterministic enough)
- IMPLICATIONS: 7 Limite gates + 10 AT predicates + 5 quality-key unlocks + dual-compute verifier

## D-007: Memory system port
- RULING: "default to pi w/ mimocode exactly memory system copy paste ported in both are typescript should be easy"
- CONTEXT: The trading agent needs cross-session memory (past trades, zone patterns, gate decisions)
- RATIONALE: MiMoCode's memory system is TypeScript; pi is TypeScript; copy-paste port
- ALTERNATIVES REJECTED: New memory system from scratch (unnecessary when MiMoCode's works)
- IMPLICATIONS: SPEC-W9 includes the memory port as part of determinism work

---

# DECISION_CHAIN — APPENDED 2026-09-24 (model server stack)

## D-008: The three-model server layout (ONE SERVER = ONE MODEL)
- RULING: "3 servers now 1 for each model"
- CONTEXT: The Plutus runtime needs a decision model, an orchestrator, and a dedicated math model, each resident and answering locally.
- RATIONALE: llama.cpp serves exactly one model per process — proven, not assumed: `/v1/models` returns exactly one id per port on every server; the binary exposes NO router/multi-model flag (the only second-model flags are `--lora`, `--spec-draft-model`, `--mmproj`, all components, not models); `-np N` is same-model slot concurrency over a `--kv-unified` shared pool, not multi-model serving.
- ALTERNATIVES REJECTED: one server hosting several models (does not exist in this runtime); `-np` as a multi-model mechanism (it slices one model's context across slots).
- IMPLICATIONS: three ports — `:8008` decision, `:4171` orchestrator, `:4172` math. A fourth model requires an eviction, not a flag.

## D-009: The math model — DeepSeek-R1-Distill-Qwen-1.5B (Q6_K + kvarn3)
- RULING: "ok lower qwen to 200k and do Q6 at kvarn 3 this works"
- CONTEXT: A dedicated math model for all E3 + future E4 (Fibonacci + probabilistic) data, which "CANNOT hallucinate/derail/be wrong". Two candidates were offered, both 1.5B: `Qwen/Qwen2.5-Math-1.5B` and `deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B`.
- RATIONALE (from the cards, not a live eval): DeepSeek's own table lists its base as **Qwen2.5-Math-1.5B** — the candidates are parent and successor, not peers. On AIME 2024 the successor scores 28.9% pass@1 / 52.7% cons@64 versus the parent's 3/30 (10.0%) CoT and 7/30 (23.3%) TIR. The parent's best numbers REQUIRE Tool-Integrated Reasoning (an external Python interpreter): its MATH is 75.8 CoT vs 79.9 TIR, and its own card warns "We do not recommend using this series of models for other tasks." Context: 4,096 (parent) vs 131,072 (successor). DeepSeek-R1's RL training produced self-verification and reflection, distilled into the 1.5B.
- ALTERNATIVES REJECTED: Qwen2.5-Math-1.5B (needs an interpreter to be competent, 32x less context, and its authors disclaim general use); DeepSeek at Q8_0 (fits NOTHING at full 131k context — short by 258–529 MiB at every KV level).
- IMPLICATIONS: `:4172` at `-c 131072`, Q6_K weights + kvarn3 KV, temperature 0.6 / top_p 0.95 (the card's gen config). Measured 2,248 MiB.

## D-010: The compression band floor — nothing below Q4 / kvarn3
- RULING: "anything below q4/kvarn3 = banned"
- CONTEXT: Sizing the math model inside the freed VRAM budget, choosing among weight quants (Q8/Q6/Q5/Q4) and KV compression levels (f16/kvarn8..kvarn2).
- RATIONALE: Accuracy-first positioning for a model whose entire purpose is correctness; the floor bounds the search space to configurations that preserve fidelity.
- ALTERNATIVES REJECTED: kvarn2 KV (below floor); Q3/Q2 weights (below floor); f16 uncompressed KV (fits nowhere usable at 131k).
- IMPLICATIONS: Every Plutus model server respects the floor. f16 KV is allowed where it fits (JevK5 at 16k uses f16, uncompressed, as originally ordered).

## D-011: The Qwen orchestrator context floor — 200k
- RULING: "lower qwen to 200k" (operator supplied the 200k figure directly)
- CONTEXT: The orchestrator at 262k native consumed 4,824 MiB; the math model needed a slot.
- RATIONALE: Measured saving: 262k → 200k released ~440 MiB (4,824 → 4,368 MiB measured). The model card's own guidance ("maintain a context length of at least 128K tokens to preserve thinking capabilities") still clears by 1.56x.
- ALTERNATIVES REJECTED: staying at 262k (no room for the math model); 128k (unnecessarily tight).
- IMPLICATIONS: `-c 200000` on `:4171`. Note `/props` reports n_ctx 200192 (slot-aligned).

## D-012: Embed servers merge to ONE CPU-only process
- RULING: "merge them into 1" then "leave notes on it for future agents as well"
- CONTEXT: Two services served the identical GGUF on two ports for two consumers, holding **1,142 MiB of VRAM for CPU work** (CUDA contexts on CUDA-linked binaries).
- RATIONALE: Same model file, same 768-dim output, two ports only because they were set up at different times. A CPU-only build (6.2 MiB, zero CUDA linkage) was proven serving 768-dim at 0 VRAM.
- ALTERNATIVES REJECTED: keeping two servers on CPU (a second ~150 MiB RSS process for no benefit); deleting either unit (both consumers are live and legitimate).
- IMPLICATIONS: Keep BOTH ports alive on the CPU-only binary so no consumer reconfigures; keep both unit files; do NOT delete. Consumers: `:18082` → OMP/TencentDB memory; `:8001` → OpenViking (chain via `:1933`). NOT YET EXECUTED — both units are currently stopped.

## D-013: Documentation lives in the shared workspace, never in an omp worktree
- RULING: "what is this bullshit filepath PUT IT IN THE SHARED WORKSPACE"
- CONTEXT: The runbook + operator manual were first written into `~/.omp/wt/plutus-main-66dfa4c/`, an agent worktree.
- RATIONALE: A fresh agent looks in the shared workspace. `PLUTUS/MASTER_CONTEXT/` already holds `OPERATOR_MANUAL.md` and `CORBELL_GRAPH_OPERATOR_MANUAL.md` — the established home.
- ALTERNATIVES REJECTED: the omp worktree (not where agents look); `PLUTUS/LIVE/docs` (handover material, not the reference home).
- IMPLICATIONS: `MODEL_SERVERS_OPERATOR_MANUAL.md` + `MODEL_SERVERS_RUNBOOK_2026-09-24.md` in `PLUTUS/MASTER_CONTEXT/`; worktree copies removed (one source of truth).

## D-014: ⚠ UNRESOLVED DIVERGENCE — the canon's V6 model lineup vs the machine
- RULING: **NONE YET — this is an OPEN QUESTION, recorded so no future agent is misled.**
- THE FACTS:
  | Layer | The canon says (2026-09-17, D-003 + EVIDENCE_STATE) | The machine has (2026-09-24, D-008..D-010) |
  |---|---|---|
  | Decision model | Decider-2B v10 (1.9B, Qwen3.5-2B-Base, letter-logits, ECE 0.037, 32k) | **JevK5-4B-Q8_0** on `:8008`, `-c 16384`, f16 KV |
  | Math engine | Limite 1B (74.25% BeyondAIME, **vLLM**) | **DeepSeek-R1-Distill-Qwen-1.5B-Q6_K** on llama.cpp `:4172` |
  | Orchestrator | (not specified in the canon) | **Qwen3.5-4B-Q4_K_M** on `:4171` |
  | Serving runtime | vLLM (Limite) + Decider runtime | llama.cpp / BeeLlama v0.4.6 for all three |
  - `EVIDENCE_STATE` explicitly recorded "Decider-2B on the 4080: NOT YET DEPLOYED" and "Limite 1B via vLLM: NOT YET DEPLOYED".
- WHY IT MATTERS: A fresh agent reading the canon will hunt for Decider-2B and Limite on the box and find neither. The canon currently describes a lineup the machine does not have.
- WHAT IS NOT KNOWN: whether JevK5 **supersedes** Decider-2B as the decision model, whether the two are for **different layers** (e.g. JevK5 for the Jev gate / orchestration vs Decider for V6 trade decisions), or whether one is a stopgap. **No rationale is invented here.**
- ACTION REQUIRED: operator ruling to resolve — supersede D-003, scope JevK5 to a different layer, or schedule Decider/Limite deployment. Until ruled, D-003 stands as the V6 target and D-008..D-010 describe what is actually running.

---

# DECISION_CHAIN — THE EARLIER RULINGS (context + rationale, for completeness)

## D-001: The knowledge graph substrate
- RULING: "graph built ONLY from `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT`"
- CONTEXT: The initial seed used `PLUTUS_Knowledge` as a separate repo — the operator corrected to corpus-only.
- RATIONALE: The corpus IS the knowledge; no external card sources.
- ALTERNATIVES REJECTED: `PLUTUS_Knowledge` as a separate graph (rejected — single source of truth).
- IMPLICATIONS: All cards live in MASTER_CONTEXT, indexed by the engine watching that folder.

## D-002: The adapter architecture (OMP as harness)
- RULING: Build `au-mcp-adapter-omp` following the decoded adapter contract.
- CONTEXT: The operator wanted OMP connected as an in-app agent harness in au-host.
- RATIONALE: The adapter contract is self-declaring type-defs — any CLI can become launchable.
- ALTERNATIVES REJECTED: Only cc/codex adapters (insufficient — the operator wanted OMP).
- IMPLICATIONS: discovery+selection work; the session spawn is BROKEN (OPEN-003).

## D-003: Model choice — Decider-2B over Kev 0.6B
- RULING: "decider it is then"
- CONTEXT: A head-to-head audit of both models' specs, benchmarks, and architecture.
- RATIONALE: Decider-2B wins on OOD accuracy (0.755 vs 0.620 = +13.5 pts), calibration (ECE 0.037 vs 0.089 = 2.4× better), context (32k vs 8k = 4×), RL-trained beliefs, vision variant, browser agents (93%).
- ALTERNATIVES REJECTED: Kev 0.6B (lower OOD, worse calibration, smaller context, no RL, no vision).
- IMPLICATIONS: all V6 specs updated for Decider; Kev references are historical.
- **⚠ SUPERSEDED-IN-QUESTION by D-014 (2026-09-24): the machine runs JevK5.**

## D-004: Harness choice — pi over MiMoCode
- RULING: "we don't need a coding agent to run a trading agent"
- CONTEXT: the operator realized the trading agent needs ZERO coding capability; MiMoCode was chosen because it was familiar, not because it was right.
- RATIONALE: pi provides agent loop + tool calling + TUI without any coding capability; 108k★, MIT, supply-chain hardened.
- ALTERNATIVES REJECTED: MiMoCode (coding overhead irrelevant to trading), vanilla Python (headless = BANNED), TensorTrade as harness (it is a library, not a runtime).
- IMPLICATIONS: the V6 runtime is pi + Decider + Limite + TensorTrade — no MiMoCode, no OMP, no TTSR, no subagents.

## D-005: Headless banned
- RULING: "headless is banned" / "BANNED"
- CONTEXT: TensorTrade was described as headless; the operator immediately banned headless operation.
- RATIONALE: the operator must be able to see every probability, every gate decision, every rejection.
- ALTERNATIVES REJECTED: headless Python script, background process, no TUI.
- IMPLICATIONS: pi TUI is mandatory; the trading pane is a first-class component (SPEC-W4).

## D-006: The MPSE/Limite fusion
- RULING: the operator demanded a full analysis of MPSE unlocked with Limite.
- CONTEXT: MPSE was Math-as-Spec (TS strings) + Code-as-Implementation (TS functions) + Tests-as-Proof (battery).
- RATIONALE: Limite adds an INDEPENDENT math authority that cross-verifies code — closing the circular trust problem.
- ALTERNATIVES REJECTED: code-only verification (circular), LLM-as-judge (not deterministic enough).
- IMPLICATIONS: 7 Limite gates + 10 AT predicates + 5 quality-key unlocks + the dual-compute verifier.

## D-007: Memory system port
- RULING: "default to pi w/ mimocode exactly memory system copy paste ported in both are typescript should be easy"
- CONTEXT: the trading agent needs cross-session memory (past trades, zone patterns, gate decisions).
- RATIONALE: MiMoCode's memory system is TypeScript; pi is TypeScript; copy-paste port.
- ALTERNATIVES REJECTED: a new memory system from scratch (unnecessary when MiMoCode's works).
- IMPLICATIONS: SPEC-W9 includes the memory port as part of the determinism work.

---

# DECISION_CHAIN — THE DECISION ANALYSIS (how rulings get made here)

## THE SHAPE OF EVERY RULING

A Plutus decision records five things, always in this order:

1. **RULING** — the operator's words, verbatim where possible. A paraphrase is not a ruling.
2. **CONTEXT** — what forced the decision. What was on the table.
3. **RATIONALE** — why the ruling is correct, with MEASURED numbers where numbers exist.
4. **ALTERNATIVES REJECTED** — every option considered and the specific reason it lost.
5. **IMPLICATIONS** — what changes downstream. What must be updated because of this.

## THE DECISION CLASSES

| Class | Who rules | Example |
|---|---|---|
| **Doctrine** | Operator only | RRR floor 2.5; headless banned; quote law |
| **Architecture** | Operator rules; agent proposes with evidence | pi over MiMoCode; one server per model |
| **Model selection** | Operator confirms after a card/benchmark audit | Decider over Kev; DeepSeek over Qwen2.5-Math |
| **Sizing** | Operator sets the floor; agent measures the consequence | Qwen at 200k; Q4/kvarn3 band floor |
| **Placement** | Operator, sometimes sharply | "PUT IT IN THE SHARED WORKSPACE" |
| **Operational** | Agent, within the band | which port; which quant within the band |

## THE EVIDENCE STANDARD FOR A RULING

- A **doctrine** ruling needs the operator's words. Nothing else.
- An **architecture** or **model** ruling needs a measured comparison: card benchmarks, a
  geometry check, or a live measurement. "It seemed better" is not a rationale.
- A **sizing** ruling needs the arithmetic: what it costs, what it frees, what it breaks.
  The Qwen 200k ruling carries a measured 440 MiB delta; the Q4/kvarn3 floor bounds a
  search space that was enumerated before the ruling.
- A **placement** ruling needs no evidence — it is a preference, and preferences are law.

## THE ANTI-PATTERNS THIS CHAIN EXISTS TO PREVENT

1. **Inventing a rationale for an unresolved question.** D-014 is recorded as OPEN with no
   rationale invented. If the operator has not ruled, the chain says so.
2. **Letting a doc outlive its ruling.** D-003 (Decider-2B) is still in this chain and is
   still the V6 target — but it is now flagged as superseded-in-question. A future agent
   must not read D-003 alone and assume Decider is deployed.
3. **Silent supersession.** When a new ruling contradicts an old one, the OLD one gets a
   pointer to the new one. Nothing is deleted; history is preserved and annotated.
4. **A ruling without its downstream updates.** D-009 (DeepSeek) required CURRENT_STATE,
   EVIDENCE_STATE, BUILD_STATE, TASK_QUEUE, NEXT_STEPS, and the runbook to all change. A
   ruling that does not propagate is a ruling half-made.

## THE OPEN QUESTIONS REGISTER (things awaiting a ruling)

| Ref | Question | Blocks |
|---|---|---|
| D-014 | Does JevK5 supersede Decider-2B, serve a different layer, or is it a stopgap? | V6 Phase 1 (W1 targets which decision model?) |
| — | Does DeepSeek replace Limite, or is Limite still the V6 math engine? | V6 Phase 2 (W2 targets which math engine?) |
| — | Is the `kev-decide.ts` respawn loop to be killed or capped? | host load |
| — | Archive `knowledge-graph/graph.db` (126 MB legacy)? | corpus cleanliness |
| — | omp pipewire rebuild vs stay on X11+import (OPEN-002)? | native Wayland capture |

## D-015: The model-server docs move to the SHARED WORKSPACE TOP DIR
- RULING: "put this manual in the jarvs shared workspace top dir."
- CONTEXT: D-013 had placed both docs in `PLUTUS/MASTER_CONTEXT/` (correcting an earlier omp-worktree path). The operator then ruled for a shallower home: the root of the shared workspace itself.
- RATIONALE: A top-level doc in the shared workspace is found without knowing any project's internal layout. The operator wants the model-server reference to be a first-class workspace artifact, not a sub-project artifact.
- ALTERNATIVES REJECTED: staying in `PLUTUS/MASTER_CONTEXT/` (too deep — requires knowing the PLUTUS tree); a symlink at the top (two paths, one of which goes stale); copying (two sources of truth = drift).
- IMPLICATIONS: **both** docs moved (they are a named pair — the manual's header cross-references the runbook, so splitting them would recreate the findability problem D-013/D-015 exist to kill):
  - `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/MODEL_SERVERS_OPERATOR_MANUAL.md`
  - `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/MODEL_SERVERS_RUNBOOK_2026-09-24.md`
  - All canon path references updated (CURRENT_STATE §0d, COMPACTION_SURVIVAL, POST_COMPACTION_PROMPT, BUILD_STATE, CANON_MANIFEST, EVIDENCE_STATE).
  - The manual's own header was stale — it pointed at `docs/integrations/model-servers-2026-09-24.md` (the ORIGINAL worktree path, never updated by D-013's move). Corrected to `MODEL_SERVERS_RUNBOOK_2026-09-24.md (same directory)`.
  - **The manual's SHA changed** (`7c8004ad…` → `dc82ff976b775438221ca894dcb9b67616b05cd2ebb0c3be1082670fd92355e8`) because of the header fix; EVIDENCE_STATE + BUILD_STATE updated to match. The runbook's SHA is unchanged (`463294b8390d9c4f603ca6fb1eed35b7bdc33d1f0ab63f662a6209c4a4cb35da`).
- LESSON: **a doc's own cross-references go stale when the doc moves.** D-013 moved both files but left the manual's header pointing at the pre-D-013 path — the move was recorded in the canon while the artifact itself kept the old pointer. When a doc moves, grep the doc for its own internal paths, not just the references to it.
