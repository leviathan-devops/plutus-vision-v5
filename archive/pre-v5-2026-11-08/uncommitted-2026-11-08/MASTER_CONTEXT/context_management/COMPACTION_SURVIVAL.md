# COMPACTION SURVIVAL — Plutus (updated 2026-09-24)

> Semantics: OVERWRITE. This is the resume anchor. Operating laws are kept
> verbatim; state is refreshed to NOW. History: `CHANGELOG.md`.

## STATE AT A GLANCE

The Plutus system has **THREE layers**, all live on this machine:

**1. THE MODEL SERVER STACK (NEW 2026-09-24 — what actually runs).** Three GPU llama.cpp
servers, one model each, plus a CPU-only embed binary:
`:8008` JevK5-4B-Q8_0 (decision, 16k, f16 KV, 5,136 MiB) · `:4171` Qwen3.5-4B-Q4_K_M
(orchestrator, 200k, kvarn3, 4,368 MiB) · `:4172` DeepSeek-R1-Distill-Qwen-1.5B-Q6_K (math
for E3/E4, 131k, kvarn3, 2,248 MiB). Card 11,832/12,282 used, 45 free. All three answer
`{"status":"ok"}`. DeepSeek proven on F(20) → `\boxed{6765}`.

**2. THE ARSUMBRIS KNOWLEDGE GRAPH.** 716 nodes, 583 mechanism cards, 0 diagnostics, live
engine, all doctrine carded from the full corpus by 7 forensic scouts.

**3. THE V6 ARCHITECTURE (blueprinted, awaiting dispatch).** Decider-2B (decision) +
Limite 1B (math engine) + TensorTrade (OMS) + pi harness (TUI, NOT headless). Speced in 10
worker components across 3 phases.

The V5 TypeScript pipeline (at `~/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent`, branch
omp-worker-1 @ 8f4ac74) is the **REFERENCE** implementation — its canon hits 15/15 golden
entries, the W9 re-port hits 1/5 (the regression that triggered everything).

### ⚠ READ THIS BEFORE TRUSTING THE MODEL LINEUP
**The canon and the machine disagree (D-014).** The V6 blueprint rules **Decider-2B** as the
decision model and **Limite 1B via vLLM** as the math engine — and `EVIDENCE_STATE` recorded
both as "NOT YET DEPLOYED". The machine runs **JevK5** for decisions and
**DeepSeek-R1-Distill on llama.cpp** for math. Whether JevK5 supersedes Decider-2B, serves a
different layer, or is a stopgap is an **OPEN OPERATOR RULING**. Do not assume; ask.

## THE OPERATING LAWS (each with rationale)

1. **D13/R19 Quote Law** — doctrine is QUOTED verbatim, never synthesized. Anything that can't be quoted doesn't get built. This is the root law; it prevents machine-paraphrased doctrine from corrupting the system.
2. **E2 Designates, E3 Obeys (R3)** — E3 never overrides E1/E2 data. Every trade traces to an E1 zone ID + an E2 shape day. This prevents the trade engine from inventing its own rules.
3. **Lint Not Police** — the engine's diagnostics flag bad data but NEVER block a save. The operator is the only law-writer; the machine validates but never refuses.
4. **RRR Floor 2.5 (R09/R37)** — operator confirmed twice. Any code site enforcing 3.0 is superseded slop.
5. **Headless is BANNED** — the V6 runtime MUST have a visible TUI (pi harness). This is an operator ruling, not a preference.
6. **Kev is REPLACED by Decider-2B** — operator confirmed after head-to-head audit: Decider wins on OOD accuracy (0.755 vs 0.620), calibration (ECE 0.037 vs 0.089), context (32k vs 8k), RL-trained beliefs, and vision variant exists. **⚠ See D-014.**
7. **The MPSE Triangle** — Math-as-Spec (Limite), Code-as-Implementation (Python), Tests-as-Proof (battery + golden) — three INDEPENDENT systems cross-verifying. No single point of trust.
8. **Doctrine feeds the model, not the runtime** — cards in arsumbris become training data offline; the runtime never queries the KG (determinism law).
9. **Kev/Decider scores, never edits** — model outputs are INPUTS to the gate layer; the gate layer (pure Python if/else) makes accept/reject. Models never modify zone data.
10. **Dual-compute verification** — Limite computes, Python shadow recomputes, |diff| ≤ eps or FAIL. Limite fluency never passes hallucinated numbers.
11. **NEW — The compression band floor** — nothing below Q4 weights or below kvarn3 KV on any Plutus model server (operator: "anything below q4/kvarn3 = banned").
12. **NEW — One server = one model** — proven; a fourth model requires an eviction, not a flag.
13. **NEW — Docs live in the shared workspace** — never an omp worktree (operator: "what is this bullshit filepath PUT IT IN THE SHARED WORKSPACE").
14. **NEW — A reasoning model needs thinking budget** — `max_tokens` ≥ 2000 (≥ 3000 for math) or `content` comes back empty while `reasoning_content` ate the whole budget. That is operator error, not a model defect.

## SETTLED DOCTRINE (operator rulings, verbatim)

- R35: "i never said R --> BS or BS --> WL (you mean RWL) are not allowed these are valid. this is flawed" — dayTable edges ARE valid
- R36: "week pinned as macro context, micro context can refresh on a daily basis" — week=macro, micro=daily
- R37: "i said before 2.5 is an acceptable minimum" — RRR floor confirmed
- R38: "the test machinery wraps the PRODUCTION entry; it never re-implements the production flow" — canon law, violated twice
- "headless is banned" — TUI required
- "coding is literally disabled on the plutus agent" — no coding capability needed
- "decider it is then" — model choice confirmed (see D-014)
- "3 servers now 1 for each model" — the server topology (D-008)
- "ok lower qwen to 200k and do Q6 at kvarn 3 this works" — the math model config (D-009, D-011)
- "anything below q4/kvarn3 = banned" — the band floor (D-010)
- "merge them into 1" — the embed merge (D-012)
- "what is this bullshit filepath PUT IT IN THE SHARED WORKSPACE" — doc placement (D-013)

## THE DOC MAP (11 canon docs + their contents)

1. COMPACTION_SURVIVAL.md (this doc) — the resume anchor, operating laws, settled doctrine
2. CURRENT_STATE.md — per-module status, architecture as it actually IS
3. NEXT_STEPS.md — the wave plan with done-when criteria
4. TASK_QUEUE.md — gates, active tasks, backlog, blocked items
5. BUILD_STATE.md — checkpoint tree, SHA chain, verified results, frozen machinery
6. CHANGELOG.md — session entries with evidence, decisions, failures, breakthroughs
7. POST-COMPACTION_PROMPT.md — the fresh agent's exact entry sequence
8. DECISION_CHAIN.md — every doctrine decision with context + alternatives rejected
9. EVIDENCE_STATE.md — verified evidence: SHAs, passTokens, audit findings
10. RUNNING_BUILD_LOG.md — **the moment-of-work log** (append-only, highest frequency)
11. RUNNING_DEBUG_LOG.md — **the moment-of-insight log** (append-only, highest frequency)

## FRESH-AGENT ENTRY RULES (the exact first-6-actions)

1. Read THIS doc — the operating laws + the state + the D-014 warning.
2. Read CURRENT_STATE.md §0 — the model server stack as it actually is.
3. Read POST-COMPACTION_PROMPT.md — the exact mission + the first action.
4. Read the two RUNNING logs — the last work unit and the last debugging insight.
5. Check the graph: `~/arsumbris/au-engine/target/release/au daemon status /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT` → ready=true
6. Check the model servers: `for p in 8008 4171 4172; do curl -s -m 5 http://127.0.0.1:$p/health; done` → three `ok`

## OPERATING RULES QUICK REFERENCE

- Every claim carries file:line or a measured number (evidence-or-qualify)
- Every test failure is a finding, not a setback (adversarial-first)
- The graph is the truth; prose is not (lint = 0 diagnostics or fix)
- The V5 TS pipeline is the REFERENCE, never modified
- The V6 build starts from the PLANNING_SUITE_Plutus_V6_Build_Package.md
- pi harness, NOT MiMoCode (coding agent eliminated)
- Decider-2B, NOT Kev (operator ruled) — **⚠ but the box runs JevK5; see D-014**
- Temperature=0 for Limite on the MPSE path (determinism law)
- The 649 doctrine cards are the source of truth for trading rules
- Threads: plutus (master) + knowledge-graph (micro) + arsumbris (log) + system-debugging (debug)
- **Model servers: one model each, band floor Q4/kvarn3, docs in the shared workspace**
- **A reasoning model with no thinking budget returns empty `content` — raise `max_tokens`**

## THE PATHS (absolute, load-bearing)

- Corpus/graph: `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT`
- **Canon docs: `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT/context_management/`**
- **Model-server runbook: `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/MODEL_SERVERS_RUNBOOK_2026-09-24.md`**
- **Model-server operator manual: `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/MODEL_SERVERS_OPERATOR_MANUAL.md`**
- **Model launch scripts: `/home/leviathan/models/servers/{jevk5,qwen35-4b,ds-math}.sh`**
- **Model weights: `/home/leviathan/models/gguf/*.gguf`**
- **llama.cpp runtime: `/home/leviathan/beellama.cpp/beellama-v0.4.6/llama-server`**
- **CPU-only embed binary: `/home/leviathan/llama.cpp/build-cpu/bin/llama-server`**
- V5 reference: `/home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent` (branch omp-worker-1 @ 8f4ac74)
- arsumbris engine: `~/arsumbris/au-engine/target/release/au` (built, 50.72s cargo)
- arsumbris host: `~/arsumbris/au-host` (Electron, patches @ b49c705)
- OMP adapter: `~/arsumbris/au-mcp-adapter-omp` (BROKEN — OPEN-003)
- kgm supervisor: `/home/leviathan/JARVIS_WORKSPACE/PLUTUS_Knowledge/kgm/fleet.ts`
- Threads CLI: `/home/leviathan/JARVIS_WORKSPACE/OMP/threads/omp-threads.ts`
- V6 build package: `MASTER_CONTEXT/reports/PLANNING_SUITE_Plutus_V6_Build_Package.md` (374 lines)
- E3 blueprint: `MASTER_CONTEXT/reports/Plutus_E3_Master_Blueprint_v1.md` (977 lines)
- MPSE blueprint: `MASTER_CONTEXT/reports/Plutus_MPSE_Limite_Master_Blueprint_v1.md` (398 lines)
- V6 blueprint: `MASTER_CONTEXT/reports/Plutus_V6_Master_Blueprint_v1.md` (524 lines)
- V6 initial: `MASTER_CONTEXT/reports/Plutus_V6_Initial_Blueprint.md` (284 lines)
- Graph map v2: `MASTER_CONTEXT/reports/Knowledge_Graph_Map_v2.md` (7,795 lines)
- Operator manual: `MASTER_CONTEXT/OPERATOR_MANUAL.md` (in-graph)

## THE DEVICE (measured 2026-09-24 — the constraints that shape every decision)

- GPU 12,282 MiB; three compute processes only; Wayland on the iGPU (not this card). **45 MiB free is sufficient** — pools preallocate at load; failure is loud at load, never mid-inference.
- RAM 30 GiB, ~730 MiB available, 39–41 GiB in swap. **8.5 GB of weights cannot live in host RAM** — models stay on GPU by measurement, not preference.
- 32 cores. CPU saturation observed was a **respawning `kev-decide.ts` batch** (~11 cores), NOT the model servers (<7%). Diagnose with `ps --sort=-pcpu` first.

## THE RESIDUALS (stated, not hidden)

- **The embed layer is DOWN** — both units stopped mid-merge; `:18082` and `:8001` both refuse. OMP `v1/recall` and OpenViking embeddings are non-functional until the merge executes.
- **The model servers are unprotected** — bare `setsid nohup`, `oom_score_adj=200`, no restart policy.
- **D-014 unresolved** — the canon's model lineup ≠ the machine's.
- The deterministic engine + Jev gate on the math path is NOT wired; the model reasons correctly, but "cannot be wrong" needs the engine + gate.
- The fresh-operator drill against the manual has not been run.
- Two canon docs (NEXT_STEPS, TASK_QUEUE) and BUILD_STATE still need their model-server work items; this update prioritized the read-first docs.

---

## THE ANTI-PATTERNS (each observed, each costly)

| Anti-pattern | What it looks like | The correct move |
|---|---|---|
| **Inherited label** | a model name, a version, a hash carried from a prior doc | verify against the artifact that depends on it |
| **Nominal number** | a ratio or size assumed from a datasheet | measure it in this session; kvarn3 was 3.625, not 3.375 |
| **Scope-limited search** | `systemctl --user` only; concluding "orphan" | check BOTH scopes; read `/proc/<pid>/cgroup` |
| **Health-as-proof** | declaring a service up from `/health` | a real completion; a socket is not a service |
| **Measurement debris** | probe servers left resident → `cudaMalloc failed` | reap before the next launch |
| **Thinking-budget starvation** | empty `content` read as a broken model | raise `max_tokens`; read `reasoning_tokens` |
| **Cross-generation flag carry** | YaRN flags from a 32k model on a 262k model | re-derive context flags from the new model |
| **Destructive shortcut** | `rmdir` on a tree; `2>/dev/null` on a delete | verify by re-listing; never blanket-delete |
| **Doc-in-the-wrong-home** | writing into an omp worktree | the shared workspace; a fresh agent looks there |
| **Canon drift** | docs describing a lineup the machine lacks | correct the canon; record the divergence |
| **Silent supersession** | a new ruling that does not annotate the old | annotate; never delete history |

## THE OPERATING DETAIL (the things that are not laws but matter)

- **Port map:** `:8008` decision · `:4171` orchestrator · `:4172` math · `:18082` OMP-memory
  embed · `:8001` OpenViking embed · `:1933` OpenViking API.
- **The card does not grow.** 12,282 MiB. Three servers use 11,752 of it. A fourth model
  needs an eviction, not a flag.
- **The KV pool is preallocated.** `-c` changes take effect at restart only; there is no
  hot-shrink. Shaving 3k tokens off DeepSeek frees ~16–19 MiB — not a rescue lever.
- **Host RAM cannot hold the weights.** 730 MiB available against 8.5 GB of models. The
  models live in VRAM; that is measured, not preferred.
- **The display is on the iGPU.** Nothing on the NVIDIA card competes with the servers, so
  45 MiB free is fine.
- **A thinking model splits its output.** `reasoning_content` carries the chain, `content`
  the answer. Both must be read.
- **The canon is 11 docs.** 9 standard + 2 logs. The logs update at the highest frequency —
  the moment something is learned, not at session end.

## THE RESUME PROTOCOL

1. Read this doc, then CURRENT_STATE §0, then POST_COMPACTION_PROMPT.
2. Read the two RUNNING logs — the last work unit and the last debugging insight.
3. Verify the stack: three `ok` on `:8008`/`:4171`/`:4172`; `nvidia-smi` matches.
4. Check the graph daemon: `ready=true`.
5. Check the open items in TASK_QUEUE — M0 is urgent (the embed layer is down).
6. If anything disagrees with the docs, the LIVE MEASUREMENT is the evidence. Correct the doc.

## THE ONE-LINE STATE

Three local models answer on `:8008`/`:4171`/`:4172`; the knowledge graph holds 649 doctrine
cards at 0 diagnostics; the V6 architecture is blueprinted and awaiting a D-014 ruling and an
operator GO; the embed layer is down pending its decided merge; the servers are unprotected.

## THE CONTRACT WITH THE OPERATOR (what is expected of the next agent)

The operator drives; the agent executes to completion. Specifically: never ask "should I
continue" (the answer is yes); never shrink a scope (decompose and sequence it); never
report a claim without its command output; never invent a rationale for an open question
(record it as open); never call a socket a service. When something is blocked, say what is
blocked, what was tried, and what the unblock path is. The operator's own words are law and
are quoted verbatim in DECISION_CHAIN — never paraphrased.
