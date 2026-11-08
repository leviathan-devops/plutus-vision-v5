# RUNNING BUILD LOG — Plutus (append-only, newest at the end)

> Semantics: APPEND ONLY. One entry per meaningful work unit, written at the
> moment the work happens — never at session end. Never edit or delete a prior
> entry. Entry shape: `## [ISO] — <name>` with WHAT / WHY / HOW / EVIDENCE / NEXT.

## [2026-09-24T17:20+04] — MODEL SERVER STACK: the three-model GPU layout

- **WHAT:** Stood up three GPU-resident llama.cpp servers, one model each, plus a
  CPU-only embed binary. Killed and deleted a wrong-generation model. Recorded the
  layout in the shared workspace (operator-mandated location).
- **WHY:** The Plutus E3 (and future E4) work needs a dedicated math model that
  cannot be wrong, an orchestrator, and the decision model. Operator: "3 servers now
  1 for each model" and "this is going to be THE dedicated math model for all E3 +
  future E4 (fibonacci + probabilistic calculations) so it CANNOT hallucinate/derail/
  be wrong."
- **HOW:** See the runbook for the full procedure. Key moves: verified each candidate
  model's architecture against the decision model's own geometry (JevK5's base is
  Qwen3.5-4B, not Qwen3-4B); measured the kvarn3 KV rate by controlled two-point test
  instead of trusting documentation; gated the DeepSeek launch on a measured free-VRAM
  floor rather than a guess.
- **EVIDENCE:**
  - `:8008` JevK5-4B-Q8_0, `-c 16384`, f16 KV — **5,136 MiB** VRAM, health ok
  - `:4171` Qwen3.5-4B-Q4_K_M, `-c 200000`, kvarn3 + `--kv-tail-tokens 1024` — **4,368 MiB**, health ok, `/props` n_ctx 200192
  - `:4172` DeepSeek-R1-Distill-Qwen-1.5B-Q6_K, `-c 131072`, kvarn3 — **2,248 MiB**, health ok
  - Card: 12,282 total / 11,832 used / 45 free
  - Real completions: Qwen 724 tok/s prompt, 80.6 tok/s gen; JevK5 321/61.5; DeepSeek 117 tok/s gen
  - DeepSeek math proof: F(20) with F(1)=1,F(2)=1 → `\boxed{6765}`, finish `stop`, VRAM flat through a 2,766-token reasoning run
  - Measured kvarn3 = **3.625 bits/value** (7,424 B/token at 16,384 vals), from a controlled 32k-vs-262k pair on Qwen3.5
- **NEXT:** (a) re-home both embed units to the CPU-only binary, ports kept; (b) harden all three model units (units + `Restart=always` + `OOMScoreAdjust=-1000` + memory floors) — currently bare `setsid nohup` at `oom_score_adj=200`; (c) DeepSeek two-point KV measurement to replace the back-solved rate; (d) wire the deterministic compute engine + Jev gate on the math path.

## [2026-09-24T18:05+04] — MINIMAL CPU-ONLY EMBED BINARY

- **WHAT:** Built a CPU-only `llama-server` with every unneeded feature off, and
  proved it serves embeddings with zero VRAM.
- **WHY:** Both embed servers were burning **1,142 MiB of VRAM for CPU work** — they
  carry the CUDA context (322 + 820 MiB) plus libcublas/libcudart, purely because the
  binaries were CUDA-linked. The operator's ask: "make the RAM footprint of each server
  AS LIGHT AS POSSIBLE Since they don't need to do anything other than host these three
  specific models" and "disable any dumb fucking unnecessary features".
- **HOW:** `cmake -B build-cpu -DGGML_CUDA=OFF -DGGML_NATIVE=ON -DGGML_OPENMP=ON
  -DLLAMA_BUILD_WEBUI=OFF -DLLAMA_CURL=OFF -DLLAMA_BUILD_TESTS=OFF
  -DLLAMA_BUILD_EXAMPLES=OFF`, then build the `llama-server` target.
- **EVIDENCE:**
  - Binary: `/home/leviathan/llama.cpp/build-cpu/bin/llama-server` — **6.2 MiB**, `ldd`
    shows **0** cudart/cublas/ggml-cuda (the CUDA build showed 4)
  - Proven on `:18099`: served **768-dim** embeddings with **0 VRAM** (not on the GPU at
    all), RSS ~146 MiB at `-t 8`
  - Baseline measured before: embed RSS was already light at 71.6 / 77.6 MiB (mmap);
    the waste was the CUDA context in VRAM, not RSS
- **NEXT:** Re-home `llama-embed.service` (`:18082`, OMP memory) and
  `llama-embedding.service` (`:8001`, OpenViking) onto this binary, keeping both ports
  and both unit files.

## [2026-09-24T19:40+04] — EMBED MERGE DECIDED (one CPU-only server)

- **WHAT:** Audited both embed services, proved the duplication, and got the operator's
  merge ruling.
- **WHY:** Two services served the **same GGUF** (`nomic-embed-text-v1.5.Q4_K_M.gguf`,
  80 MiB, 12 blocks, real context 2048, 768-dim) on two ports, for two consumers, with
  `:8001` additionally at `-c 8192` — 4x the model's real context.
- **HOW:** Traced each consumer: `:18082` → OMP/TencentDB memory (its absence breaks
  gateway `v1/recall` with `10001` and stores ZERO vectors, dims=0); `:8001` →
  OpenViking (chain: Hive Mind plugin → OpenViking `:1933` → `:8001` → nomic-embed).
  OpenViking's own source pins the 2048-token truncation and its tests probe
  `curl http://localhost:8001/v1/models`.
- **EVIDENCE:**
  - `:18082` = user unit `llama-embed.service`, buun build, `-ngl 0`, 322 MiB VRAM
  - `:8001` = **system** unit `llama-embedding.service`, created 2026-07-31, auto-restart
    (`NRestarts=1` after a kill), 820 MiB VRAM
  - Nothing was connected to `:8001` except through `:1933`
  - Operator ruling: **"merge them into 1"**; then **"leave notes on it for future agents"**
- **NEXT:** Execute the merge — both ports on the CPU-only binary, both unit files kept,
  no consumer reconfigured. OpenViking `:1933` must keep answering through the cutover.

## [2026-09-24T20:55+04] — DOCS PLACED IN THE SHARED WORKSPACE

- **WHAT:** Wrote the runbook (WHAT is true) + the operator manual (HOW to use it) and
  placed both in the operator's required home.
- **WHY:** Operator rejected the first location outright: **"what is this bullshit
  filepath PUT IT IN THE SHARED WORKSPACE"**. The docs were first written into an omp
  worktree (`~/.omp/wt/plutus-main-66dfa4c/`), which is not where a fresh agent looks.
- **HOW:** Moved to `PLUTUS/MASTER_CONTEXT/` — the established home, already holding
  `OPERATOR_MANUAL.md` and `CORBELL_GRAPH_OPERATOR_MANUAL.md`. Matched the directory's
  permission convention (`670` + its ACL: grok read-exec, jarvis read-write-exec).
  Removed the worktree copies so there is one source of truth.
- **EVIDENCE:**
  - `PLUTUS/MASTER_CONTEXT/MODEL_SERVERS_OPERATOR_MANUAL.md` — 14,045 B, 12 sections
  - `PLUTUS/MASTER_CONTEXT/MODEL_SERVERS_RUNBOOK_2026-09-24.md` — 9,851 B, 9 sections
  - Post-move verification: `git status docs/` empty, `git diff HEAD -- docs/` empty
- **NEXT:** Run the fresh-operator drill (a zero-context agent with ONLY the manual);
  every question it asks is a hole to file back into the manual.

## [2026-09-24T21:20+04] — CANON SET AUDITED; DIVERGENCE FOUND

- **WHAT:** Invoked `canon-doc-update`; found the canon set at
  `PLUTUS/MASTER_CONTEXT/context_management/` incomplete and stale, and — more
  importantly — **describing a model lineup that does not match the machine**.
- **WHY:** A fresh agent that reads the canon will hunt for models that are not on the
  box. That is the exact fiction the canon exists to prevent.
- **HOW:** Read the manifest (absent → embedded defaults), inventoried the docs, read
  `CURRENT_STATE.md` + `COMPACTION_SURVIVAL.md`, compared against the live server stack.
- **EVIDENCE — the divergence, stated plainly:**
  | Layer | The canon says (2026-09-17) | The machine has (2026-09-24) |
  |---|---|---|
  | Decision model | Decider-2B v10 (1.9B, Qwen3.5-2B-Base, letter-logits) | **JevK5-4B-Q8_0** on `:8008` |
  | Math engine | Limite 1B (74.25% BeyondAIME, **vLLM**) | **DeepSeek-R1-Distill-1.5B-Q6_K** on llama.cpp `:4172` |
  | Orchestrator | (not specified in the canon) | **Qwen3.5-4B-Q4_K_M** on `:4171` |
  | Embed | (not specified) | nomic-embed-text-v1.5, CPU-only, two ports |
  Also: no `CANON_MANIFEST.md`; **no `RUNNING_BUILD_LOG.md` / `RUNNING_DEBUG_LOG.md`**
  (both high-frequency logs missing entirely); all 9 docs 35–132 lines against a
  200-line floor.
- **NEXT:** Record the divergence in `DECISION_CHAIN.md` (append) + `CURRENT_STATE.md`
  (overwrite) so no future agent is misled; create the 2 missing logs; write the
  manifest; raise every doc to floor.

## [2026-09-24T21:55+04] — MODEL-SERVER DOCS MOVED TO THE SHARED WORKSPACE TOP DIR

- **WHAT:** Moved both model-server docs from `PLUTUS/MASTER_CONTEXT/` to the shared workspace root, and repaired every reference to them.
- **WHY:** Operator ruling: *"put this manual in the jarvs shared workspace top dir."* A top-level doc needs no knowledge of the PLUTUS tree to find.
- **HOW:** Moved both (they are a named pair — the manual's header cross-references the runbook). Updated the editable canon docs by sed (longest-path-first to avoid partial matches). Respected the append-only law: `DECISION_CHAIN` and the logs got NEW entries (D-015, this entry) rather than edits to prior text. Recomputed the manual's SHA after its header fix and propagated it to `EVIDENCE_STATE` + `BUILD_STATE`.
- **EVIDENCE:**
  - `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/MODEL_SERVERS_OPERATOR_MANUAL.md` — 14,052 B, sha256 `dc82ff976b775438221ca894dcb9b67616b05cd2ebb0c3be1082670fd92355e8`
  - `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/MODEL_SERVERS_RUNBOOK_2026-09-24.md` — 9,851 B, sha256 `463294b8390d9c4f603ca6fb1eed35b7bdc33d1f0ab63f662a6209c4a4cb35da`
  - `ls PLUTUS/MASTER_CONTEXT/MODEL_SERVERS_*.md` → clean (moved, not copied — one source of truth)
  - 9 stale path references replaced across 5 canon docs (2 in CURRENT_STATE, 2 in COMPACTION_SURVIVAL, 1 in POST_COMPACTION_PROMPT, 2 in BUILD_STATE, 2 in CANON_MANIFEST)
- **THE DEFECT FOUND:** the manual's own header still pointed at `docs/integrations/model-servers-2026-09-24.md` — the ORIGINAL omp-worktree path from before D-013's move. The canon recorded the move; the artifact kept the dead pointer. Fixed, and the manual's SHA updated everywhere it is cited.
- **NEXT:** re-run the canon gate; then the M0 embed merge (the layer is still down).

## [2026-09-24T22:30+04] — V6 NEXT-STEPS BLUEPRINT v1 (from the operator's audit)

- **WHAT:** Read the operator's 1,418-line audit + the 4-file build package, reconciled both against the live 3-model stack, and produced the forward plan with three predicates + a runnable firewall.
- **WHY:** The audit supersedes the prior v6 spec. The task was the FORWARD plan for v6 with the 3 models as they actually are on disk.
- **HOW:** STEP 1 read the audit/package (not re-derived). STEP 2 quoted the build's own root causes verbatim with anchors. STEP 3 measured three proofs. STEP 4 wrote three predicates with named errors + counterfactuals. STEP 5 the wave table is edge-organized (11 waves). STEP 6 wrote AND RAN the firewall. STEP 8 the artifact with all 13 sections.
- **EVIDENCE:**
  - `reports/Plutus_V6_NEXT_STEPS_BLUEPRINT_v1.md` — 525 lines, 14 file:line anchors, 13 sections, box-law clean
  - `reports/scripts/v6-firewall.sh` — exists, runs, **EXIT CODE 1** (4 detectors fired)
  - Firewall output: JEV_ENDPOINT_ABSENT · RECIPE_UNWIRED · DECISION_DOUBLE_SOURCED · TELESCOPING_ROOT_CAUSE_LIVE
- **THE THREE FINDINGS THAT MATTER:**
  1. **JevK5 does NOT serve `/v1/systemone`** — HTTP 404. The entire v6 architecture calls that endpoint. It is the W1 gate; nothing proceeds first.
  2. **The package's math model is wrong for this machine.** It names Qwen2.5-Math-1.5B; disk has DeepSeek-R1-Distill, which is that model's SUCCESSOR (DeepSeek's own card lists its base as Qwen2.5-Math-1.5B). Default ruled: USE DeepSeek.
  3. **★ THE ROOT CAUSE LIVES INSIDE A FILE ON THE KEEP LIST.** `src/pipeline/engine.ts:322` hardcodes `'4H'` — 10 sites total. The build's own post-mortem names this *"the #1 root cause of ALL macro derailments."* **A KEEP list that preserves the #1 root cause is a KEEP list that fails.** W8 now carries the extra edge: keep the orchestration, remove the nine hardcoded defaults, keep the zod enum at :1115.
- **THE FIREWALL CORRECTED MY OWN NUMBERS:** I wrote "326 branches / 2 sites"; it measured "308 branches / 10 sites." Running the detector was the point.
- **NEXT:** W1 — make JevK5 answer a typed question (`/v1/systemone` or the llama.cpp logits readout).
