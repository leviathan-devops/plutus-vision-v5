# CURRENT STATE — per-module status (updated 2026-09-24)

> Semantics: OVERWRITE. This describes NOW, not history. History lives in
> `CHANGELOG.md` (sessions) and `DECISION_CHAIN.md` (rulings).
> Prior content (the KG/V5/V6/E3/MPSE state of 2026-09-17) is preserved below
> unchanged where it remains true; the model-server layer is NEW this session.

---

## 0. THE MODEL SERVER STACK — LIVE (NEW 2026-09-24)

Three GPU-resident llama.cpp servers, one model each, plus a CPU-only embed binary.
**This is what is actually running. See the D-014 divergence warning below.**

| # | Role | Model | Port | Flags | VRAM (measured) |
|---|---|---|---|---|---|
| 1 | Decision | `jevk5-4b-Q8_0.gguf` (4.17 GB) | `:8008` | `-c 16384`, f16 KV, `--kv-unified`, `-np 1` | **5,136 MiB** |
| 2 | Orchestrator | `Qwen3.5-4B-Q4_K_M.gguf` (2.55 GB) | `:4171` | `-c 200000`, kvarn3 + `--kv-tail-tokens 1024`, `--kv-unified` | **4,368 MiB** |
| 3 | Math (E3/E4) | `DeepSeek-R1-Distill-Qwen-1.5B-Q6_K.gguf` (1,464,179,296 B) | `:4172` | `-c 131072`, kvarn3, `--kv-unified`, temp 0.6 / top_p 0.95 | **2,248 MiB** |
| — | Card | RTX 4080 Laptop | — | total 12,282 / used 11,832 / **free 45** | — |

- Runtime: `/home/leviathan/beellama.cpp/beellama-v0.4.6/llama-server` for all three.
- Scripts: `/home/leviathan/models/servers/{jevk5,qwen35-4b,ds-math}.sh` (sha256 prefixes `837bc8d1c2912064`, `05d875669c1103ca`, `54b8061d21ce47d1`).
- Health: all three return `{"status":"ok"}`. `/props`: `:4171` n_ctx 200192, `:4172` n_ctx 131072, all `total_slots 1`.
- Throughput (measured): Qwen 724 tok/s prompt / 80.6 gen · JevK5 321 / 61.5 · DeepSeek 117 gen.
- **DeepSeek math proof:** F(20) with F(1)=1,F(2)=1 → `\boxed{6765}`, `finish_reason: stop`, 2,766 tokens (2,121 reasoning + 645 visible), VRAM flat at 2,248 MiB through the run (KV preallocated).
- **KV rate (measured, not documented):** kvarn3 = **3.625 bits/value** = 7,424 B/token at 16,384 vals — from a controlled 32k-vs-262k pair on Qwen3.5 (3150 → 4774 MiB over 229,376 tokens).
- **Band law:** nothing below Q4 weights or below kvarn3 KV on any Plutus server.
- **One server = one model**, proven: `/v1/models` returns exactly one id per port; no router/multi-model flag exists in the binary; `-np` is same-model slot concurrency over a shared `--kv-unified` pool.

### ⚠ D-014 — THE CANON AND THE MACHINE DISAGREE (UNRESOLVED)
The V6 blueprint (`D-003`) rules **Decider-2B** as the decision model and **Limite 1B via vLLM** as the math engine. `EVIDENCE_STATE` (2026-09-17) recorded both as **"NOT YET DEPLOYED"**. The machine runs **JevK5** for decisions and **DeepSeek-R1-Distill** on llama.cpp for math. **No rationale is invented.** Whether JevK5 supersedes Decider-2B, serves a different layer, or is a stopgap is an **open operator ruling**. Until ruled: D-003 is the V6 target; D-008..D-010 describe what runs.

## 0b. THE EMBED LAYER — MERGE DECIDED, NOT EXECUTED

Two services served the identical `nomic-embed-text-v1.5.Q4_K_M.gguf` (80 MiB, 12 blocks, real context **2048**, 768-dim) on two ports, burning **1,142 MiB VRAM for CPU work** (CUDA contexts on CUDA-linked binaries).

| Port | Unit | Scope | Build | Consumer |
|---|---|---|---|---|
| `:18082` | `llama-embed.service` | user | buun, `-ngl 0` | OMP/TencentDB memory — its absence breaks gateway `v1/recall` (`10001`) and stores ZERO vectors (dims=0) |
| `:8001` | `llama-embedding.service` | **system** (created 2026-07-31, `Restart=always`) | llama.cpp, GPU, `-c 8192`, `--mlock` | OpenViking — chain: Hive Mind plugin → OpenViking `:1933` → `:8001` → nomic-embed |

- **STATUS: both units STOPPED, both ports DOWN.** The merge is decided, not done.
- CPU-only binary ready: `/home/leviathan/llama.cpp/build-cpu/bin/llama-server` — **6.2 MiB, zero CUDA linkage**, proven serving 768-dim at **0 VRAM** (`:18099`, since killed).
- Plan: both ports on the CPU-only binary, both unit files KEPT, no consumer reconfigured. OpenViking `:1933` (live, v0.2.16.dev3) must keep answering through the cutover.

## 0c. PROTECTION STATUS — NOT HARDENED

All three model servers are bare `setsid nohup` processes: **no systemd units**, `oom_score_adj=200` (first killed under memory pressure — backwards), `VmLck=0` (fully swappable). Nothing restarts them if they die. cgroup2 + systemd 255 + `sudo -n` are available; the hardening recipe is staged, not applied.

## 0d. DOCUMENTATION HOMES (operator-mandated)

- **Model-server operator manual (HOW):** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/MODEL_SERVERS_OPERATOR_MANUAL.md` — **at the shared workspace TOP DIR**
- **Model-server runbook (WHAT):** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/MODEL_SERVERS_RUNBOOK_2026-09-24.md` — same directory
- **This canon set:** `PLUTUS/MASTER_CONTEXT/context_management/`
- **Never** an omp worktree (`~/.omp/wt/...`) — operator: *"what is this bullshit filepath PUT IT IN THE SHARED WORKSPACE"*.

---

## 1. THE KNOWLEDGE GRAPH (arsumbris) — OPERATIONAL
- Engine daemon: running on MASTER_CONTEXT (built 50.72s, cargo 1.98.1)
- Graph: 716 components · 27 edges · 0 diagnostics (live engine read)
- Cards: 38 rulings (21 anchored, 17 flagged UNANCHORED) · 16 hard-limits · 1 lesson · 3 gates · 3 state · 5 terms · 583 mechanisms = 649 total
- Type-defs: 8 in type/ (ruling, hard-limit, lesson, gate, state, term, doc, mechanism)
- Mechanism type: slug + kind[mechanism|taxonomy|lesson|gate|limit] + quote + source + mechanics + links
- The 583 mechanism cards were extracted from the full corpus by 7 forensic scouts (bible-40: 84, bible-45: 86, macro-core: 99, specs-e2e3: 120, math-cascade: 84, feedback-scope: 58, laws-ops: 55 = 586 extracted, 3 slug-dupes dropped)
- Interactive map: Knowledge_Graph_Map_v2.md (7,795 lines, hyperlinked ToC + connection footnotes)
- Map v1 (66 cards) kept as the "before" snapshot
- The graph is node-rich/edge-poor: 716 nodes / 27 edges = the cross-link pass is P1

## 2. THE V5 PIPELINE — REFERENCE ONLY (DO NOT MODIFY)
- Location: `/home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent` (branch omp-worker-1 @ 8f4ac74)
- Canon pipeline (report-v452.ts): 15/15 golden entries at ≤3p precision (verified 2026-09-16, same HEAD + same fixture as the W9 re-port that scored 1/5)
- Frozen pair: sl-lmv.ts `912940832fac44bc…` + trade-dedup.ts `33914c897e777540…` byte-identical (MATCH at HEAD)
- The canon NEVER stopped hitting — the 1/5 was the W9 re-port's regression, confined to its +7,968 lines of re-implemented machinery
- Suite: 1195/0 pass · tsc exit 0 · 119,019 expects across 84 files
- The W9 wave (the mistake): re-implemented the canon reasoning chain in violation of P2-1 and §1.11 #15 — this is R38's origin

## 3. THE V6 ARCHITECTURE — BLUEPRINTED, AWAITING PHASE 1 DISPATCH
- Decision model: Decider-2B v10 (1.9B, Qwen3.5-2B-Base, letter-logits readout, RL-trained, ECE 0.037, OOD 0.755, 32k context, 4ms CUDA graphs, Apache 2.0) — REPLACES Kev 0.6B (operator confirmed after head-to-head audit). **⚠ See D-014: the machine runs JevK5, not Decider-2B.**
- Math engine: Limite 1B (74.25% BeyondAIME, 131k context, vLLM, temperature=0 for MPSE) — replaces hardcoded TS functions. **⚠ See D-014: the machine runs DeepSeek-R1-Distill on llama.cpp, not Limite on vLLM.**
- Validation: TensorTrade OMS (commission 0%/0.1%/0.2%, portfolio, walk-forward, Sharpe/Sortino) — replaces custom golden-gate harness
- Harness: pi (earendil-works/pi, TypeScript, 108k★, MIT, TUI) — replaces MiMoCode (coding agent ELIMINATED)
- Memory: MiMoCode memory system copy-paste ported into pi (both TypeScript)
- NOT headless — pi TUI is the visible runtime (operator ruling: "headless is banned")
- 10 component specs (W1-W10), 3 phases, in PLANNING_SUITE_Plutus_V6_Build_Package.md (374 lines)

## 4. THE ARSUMBRIS STACK — DEPLOYED WITH KNOWN ISSUES
- Engine: au daemon running, 0 diagnostics on the corpus
- Host: Electron app with 2 vendored patches (commit b49c705: WebGL graceful-degrade in au-avatar)
- Kernel (au-mcp): hub service plutus-aumcp — but OPEN-003: the host wants to OWN its kernel child; a hub kernel on the same socket reads "mcp off" and "+ New session" fails silently
- OMP adapter (au-mcp-adapter-omp): DISCOVERY works (subtypes lists mcp.adapter.omp), SELECTION works (UI shows OMP·OMP), LAUNCH CONTRACT works (bin/launch.ts prints correct JSON), but the in-app session spawn is BROKEN (OPEN-003)
- kgm supervisor: fleet.ts running, heal proven with read-back, lint raises on diagnostics>0

## 5. THE THREAD SYSTEM — LIVE
- plutus (master, kind=master): charter + the 4 operator rulings + the V5 state + the open queue
  - micro/knowledge-graph: the KG overhaul workstream (wave 1 logged: 583 cards)
- arsumbris (log): working state + KG build charter
- system-debugging (log): EN-001..007 + active-bugs (OPEN-001 CLOSED, OPEN-002 pipewire rebuild, OPEN-003 OMP session BROKEN)
- common-sense (shared, pinned): computer-use rules (DISPLAY law, focus law, protocol law, channel priority)

## 6. THE E3 ARCHITECTURE — FULLY EXTRACTED
- E3 Master Blueprint: 977 lines (reports/Plutus_E3_Master_Blueprint_v1.md)
- Sources: e3-wiring (270 lines, 127 anchors) + e3-mdve (637 lines) + E3Core2 + E3Visual2 structured outputs
- Key finding: E2 DESIGNATES, E3 OBEYS — 7 obey sites in reAnchorMirror, every session bracket from E2
- The cascade: DXY → EU (inverse) → GU (from-active-EU) — three roles: CASCADE translates, CORE designates, Cascade validates

## 7. THE MPSE/LIMITE FUSION — DESIGNED
- Master blueprint: 398 lines (reports/Plutus_MPSE_Limite_Master_Blueprint_v1.md)
- 6 Limite SPEC queries (L1-L6) replacing TS oracle-registry expressions
- 7 Limite gates (G-LIM-01..07) replacing TS assertions
- 10 anti-theatrical predicates (AT-01..AT-10) pairing Limite verdicts with script checks
- 5 quality-key unlocks (U-1..U-5) — what Limite UNLOCKS in MPSE
- Dual-compute verifier: |Limite_result - code_result| ≤ eps or LIMITE_CODE_DIVERGENCE
- Determinism: temp=0, pip-quantized integers, parse-then-quantize, one-retry-then-CONTRADICTED

## 8. THE DEVICE — MEASURED (2026-09-24)
- GPU: RTX 4080 Laptop, 12,282 MiB. Three compute processes only (the three servers). Wayland display is on the **iGPU**, not this card.
- Headroom: **45 MiB free is sufficient.** All pools preallocate at load; failures are loud at load (`cudaMalloc failed`), never mid-inference. Real floor ≈10–20 MiB driver bookkeeping, not 100–200.
- RAM: 30 GiB total, ~730 MiB available, 39–41 GiB in swap (`/swapfile-128g`, swappiness 50). **8.5 GB of weights cannot live in host RAM** (+7,954 MiB shortfall) — models stay on GPU by measurement.
- CPU: 32 cores. Observed saturation was a **respawning `kev-decide.ts` batch** (~11 cores), NOT the model servers (<7% combined). Diagnose load by `ps --sort=-pcpu` before acting.

## 9. WHAT IS SOLID (proven, do NOT re-open)
- The arsumbris engine deployment (0 diagnostics, live indexing ~1s/save)
- The 649-card doctrine corpus (verbatim quotes, 21 anchored)
- The V5 canon pipeline (15/15 golden entries — the reference)
- The E3 architecture extraction (977 lines, every function mapped)
- The V6 blueprints (524 + 284 + 398 + 374 lines)
- The Decider-2B vs Kev verdict (operator-confirmed) — **but see D-014 re: JevK5**
- The MPSE/Limite fusion design (scout-audited, first-hand anchored)
- The kgm supervisor (heal proven, lint proven)
- The thread system (plutus master + knowledge-graph micro)
- The operator manual (OPERATOR_MANUAL.md, in-graph)
- **NEW:** the three-model server stack (live, measured, proven on real completions)
- **NEW:** the CPU-only embed binary (6.2 MiB, 0 CUDA linkage, 0 VRAM proven)
- **NEW:** the kvarn3 KV rate (3.625 b/v, measured)
- **NEW:** the model-server runbook + operator manual (shared workspace)

## 10. WHAT IS BROKEN (with failure mode + last insight)
- OPEN-003: in-app OMP session spawn fails (host.mcp.start() → mcp off → no spawn). Last insight: the host must OWN its kernel child; hub kernels squat the socket. Fix: kill hub kernel, restart host, verify badge flips on.
- OPEN-002: OMP native Wayland capture (pipewire feature missing from official builds). Decision pending: rebuild omp from source vs stay on X11+import.
- EN-007: ydotool client hangs (daemon active, client socket/version mismatch). Fix candidates listed in the thread.
- 17 UNANCHORED rulings (R02, R08, R10, R12, R14, R21-R26, R28, R30-R32, R34, R38) — quotes verbatim but corpus line not verified
- Edge-poverty: 716 nodes / 27 edges — the cross-link pass is the fastest value-add
- knowledge-graph/graph.db: 126MB legacy corbell sqlite sitting in the corpus — archive decision pending
- **NEW — the embed layer is DOWN** (both units stopped mid-merge; `:18082` and `:8001` both refuse). OMP memory `v1/recall` and OpenViking embeddings are non-functional until the merge executes.
- **NEW — the model servers are unprotected** (no units, `oom_score_adj=200`, no restart policy).
- **NEW — D-014 unresolved** (the canon's model lineup ≠ the machine's).

## 11. WHAT IS OPEN (with blocker + next attempted fix)
- **Embed merge execution** — both units to the CPU-only binary, both ports kept, smoke both `/v1/models`, confirm `:1933` recall path.
- **Model-server hardening** — units + `Restart=always` + `OOMScoreAdjust=-1000` + `MemoryMin`/`MemoryLow` floors + `MemoryMax` caps + `ReadOnlyPaths`/`NoNewPrivileges`.
- **D-014 ruling** — supersede D-003, scope JevK5 to a different layer, or schedule Decider/Limite.
- **DeepSeek two-point kvarn3 measurement** on `:4172` (16k vs 131k) to replace the back-solved rate.
- **Deterministic compute engine + Jev gate on the math path** — the "cannot be wrong" guarantee is the engine + gate, not the model.
- **Fresh-operator drill** against the new manual.
- Phase 1 dispatch (W1: pi harness + Decider, W2: Limite + gates, W3: state constructor) — blocked on operator GO
- V6 build execution: 10 specs written, 3 phases defined, all in the build package
- The 5.3.3 prompt rebuild: feed the E3 blueprint + V6 blueprints to the prompt agent
- The cross-link pass: add [[links]] between mechanism cards (HL→R refs, SL cluster, etc.)
- The anchoring pass: verify 17 flagged rulings against real corpus lines

## 12. THE DEPENDENCY MAP (what needs what)

```
THE DEVICE (12,282 MiB VRAM · 30 GiB RAM · 32 cores)
  │
  ├── THE MODEL SERVER STACK  (the runtime layer)
  │     ├── :8008 JevK5-4B          decision model      ── needed by: the Jev gate layer
  │     ├── :4171 Qwen3.5-4B        orchestrator        ── needed by: agent orchestration
  │     └── :4172 DeepSeek-R1-1.5B  math (E3 + E4)      ── needed by: MPSE, the E3 cascade,
  │                                                        Fibonacci/probabilistic work
  │
  ├── THE EMBED LAYER  (CPU-only, MERGE PENDING)
  │     ├── :18082  ── needed by: OMP/TencentDB memory (v1/recall, vector storage)
  │     └── :8001   ── needed by: OpenViking (:1933) ── needed by: the Hive Mind plugin
  │
  ├── THE ARSUMBRIS KNOWLEDGE GRAPH
  │     └── 716 nodes / 649 cards ── the trading doctrine ── needed by: the V6 training data
  │
  └── THE V6 ARCHITECTURE  (blueprinted)
        ├── W1 pi harness + decision model  ── depends on: D-014 (which model?)
        ├── W2 math engine + gates          ── depends on: D-014 (Limite or DeepSeek?)
        └── W3 state constructor            ── depends on: W1
```

## 13. THE DATA FLOWS (how a trade decision is meant to move)

```
E1 zone data  ──┐
                ├──> E2 DESIGNATES (shape day) ──> E3 OBEYS (session brackets, reAnchorMirror)
E2 shape data ──┘                                        │
                                                          ▼
                                          the decision model (:8008 or Decider)
                                                          │
                                          ┌───────────────┴───────────────┐
                                          ▼                               ▼
                                    the gate layer                  the math engine
                                    (pure Python if/else)           (:4172 or Limite)
                                    accept / reject                  compute + verify
                                          │                               │
                                          └───────────┬───────────────────┘
                                                      ▼
                                              the TUI (pi — headless is BANNED)
```

**The law that governs every edge:** E2 designates, E3 obeys. The model SCORES; it never
edits zone data. The gate layer decides. The math engine verifies. No single point of trust.

## 14. THE STATE OF EACH LAYER (one line each)

| Layer | State |
|---|---|
| Model servers | **LIVE, measured, unprotected** |
| Embed layer | **DOWN** (merge decided, not executed) |
| Knowledge graph | OPERATIONAL (0 diagnostics) |
| V6 architecture | BLUEPRINTED (awaiting D-014 + operator GO) |
| V5 reference | FROZEN, verified (15/15 golden) |
| E3 architecture | EXTRACTED (977 lines) |
| MPSE/Limite fusion | DESIGNED (398 lines) |
| Thread system | LIVE |
| Documentation | Canon 11 docs + runbook + manual, in the shared workspace |
| Hardening | NOT STARTED |
| Math-path integrity (engine + gate) | NOT WIRED |
