# BUILD STATE (2026-09-17)

## CHECKPOINT STRUCTURE
No formal checkpoint saved yet for V6 (blueprints only). The V5 reference is the live codebase at ~/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent (branch omp-worker-1 @ 8f4ac74, tree clean).

## THE V6 ARTIFACT INVENTORY
| Document | Lines | SHA-16 | Purpose |
|---|---|---|---|
| Plutus_V6_Master_Blueprint_v1.md | 524 | e3ce24ec | Kev/Limite/TensorTrade integration (now Decider) |
| Plutus_V6_Initial_Blueprint.md | 284 | c143163d | Architecture diagram + 17 questions + 6 math + 8 gates |
| Plutus_E3_Master_Blueprint_v1.md | 977 | a5944b35 | Working E3 architecture (for the 5.3.3 prompt agent) |
| Plutus_MPSE_Limite_Master_Blueprint_v1.md | 398 | 8cc06fce | Quality-control layer (7 gates, 10 AT predicates, 5 unlocks) |
| PLANNING_SUITE_Plutus_V6_Build_Package.md | 374 | 3b87f02f | The dispatchable plan: 10 specs, 3 phases |
| PLANNING_SUITE_Kev_Limite_Fusion.md | 386 | d8278046 | Question mapping (Kev-era, needs Decider update) |
| PLANNING_SUITE_Plutus_V6_Architecture.md | 160 | 9e4874e3 | Planning skeleton (superseded by Build_Package) |
| Knowledge_Graph_Map_v2.md | 7,795 | (in-graph) | Interactive transcription (649 cards) |
| Knowledge_Graph_Map_v1.md | (in-graph) | (in-graph) | Before-snapshot (66 cards) |

## V6-AUDIT ARTIFACTS (in reports/v6-audit/)
| File | Lines | Content |
|---|---|---|
| e3-mdve.md | 637 | MDVE E3 architecture (ob-engine, setup-gen, chaining, dedup) |
| e3-wiring.md | 270 | E1→E2→E3 composition (cascade, session brackets, 127 anchors) |
| v6-audit-e2e3.md | 768 | 93 MIGRATION cards (E2+E3 → Kev/Limite/gates) |
| v6-audit-harness.md | 480 | 40 MIGRATION cards (pipeline → V6 harness loop) |
| v6-mpse-limite-authoritative.md | 378 | MPSE/Limite fusion (grounded in first-hand bible reads) |
| v6-mpse-limite.md | 398 | MPSE/Limite fusion (V6MPSE-2's cross-reference) |

## THE V5 VERIFIED STATE (reference, do not modify)
- Branch: omp-worker-1 @ 8f4ac74 (tree clean)
- Canon pipeline (report-v452.ts): ENTRIES 15/15 at ≤3p + TPs 2/2 at ≤5p (VERDICT: PASS)
- Frozen pair: sl-lmv.ts 912940832fac44bc... + trade-dedup.ts 33914c897e777540... (MATCH)
- Suite: 1195 tests / 0 fail / 84 files / 119,019 expects
- tsc: exit 0
- W9 re-port (the mistake): 1/5 golden convergence (the regression confined to +7,968 lines of re-implemented machinery)

## THE ARSUMBRIS DEPLOYMENT
- Engine: au daemon running on MASTER_CONTEXT (built 50.72s)
- Graph: 716 components · 27 edges · 0 diagnostics
- Cards: 38 rulings + 16 hard-limits + 1 lesson + 3 gates + 3 state + 5 terms + 583 mechanisms = 649
- Host: Electron with 2 patches @ b49c705 (WebGL graceful-degrade)
- Kernel: hub service plutus-aumcp (OPEN-003: host wants to own its kernel)
- kgm: fleet.ts running (heal proven, lint proven)

## FROZEN MACHINERY (do not open)
- V5 pipeline (entire branch omp-worker-1) — reference only
- sl-lmv.ts + trade-dedup.ts — frozen pair (SHA-pinned)
- Checkpoints/monday-gold-standard-achieved/ + v4.5.1_LIVE_MARKET_CAPABLE — locked immutable
- The arsumbris type-defs (8 files in type/) — operator-authored schemas
- The 38 rulings (R01-R38) — operator-authored law

---

# BUILD STATE — APPENDED 2026-09-24 (the model server stack)

## THE MODEL SERVER ARTIFACTS (live, 2026-09-24)

| Artifact | Identity | Purpose |
|---|---|---|
| `models/servers/jevk5.sh` | `837bc8d1c2912064974488f6fb8cb4b74697b05d85659c555a194987bfba11d0` | JevK5 `:8008` launch (`-c 16384`, f16 KV) |
| `models/servers/qwen35-4b.sh` | `05d875669c1103cae89a9c2d4cd172445d7a983c7cb86d07df4d999008c10f14` | Qwen3.5-4B `:4171` launch (`-c 200000`, kvarn3 + 1024 tail) |
| `models/servers/ds-math.sh` | `54b8061d21ce47d181408ed7fd92f360f551e3e9cd57620db2b1a16dc6b3f04b` | DeepSeek `:4172` launch (`-c 131072`, kvarn3) |
| `llama.cpp/build-cpu/bin/llama-server` | `b41d941c91fd04fff605b29c36292b1133793753a4bfbb25478c92967837782a` | CPU-only embed binary (6.2 MiB, 0 CUDA linkage) |
| `MODEL_SERVERS_OPERATOR_MANUAL.md` | `dc82ff976b775438221ca894dcb9b67616b05cd2ebb0c3be1082670fd92355e8` | HOW to use the stack |
| `MODEL_SERVERS_RUNBOOK_2026-09-24.md` | `463294b8390d9c4f603ca6fb1eed35b7bdc33d1f0ab63f662a6209c4a4cb35da` | WHAT is true about the stack |

## THE MODEL WEIGHTS (byte-identity, on disk)

| Model | Bytes | Port |
|---|---|---|
| `jevk5-4b-Q8_0.gguf` | 4,482,402,656 | `:8008` |
| `Qwen3.5-4B-Q4_K_M.gguf` | 2,740,937,888 | `:4171` |
| `DeepSeek-R1-Distill-Qwen-1.5B-Q6_K.gguf` | 1,464,179,296 | `:4172` |
| `DeepSeek-R1-Distill-Qwen-1.5B-Q8_0.gguf` | 1,894,532,416 | (retained, accuracy-ceiling reference — do NOT delete without operator sign-off) |

## THE RUNTIME

| Component | Path | Notes |
|---|---|---|
| llama.cpp / BeeLlama | `/home/leviathan/beellama.cpp/beellama-v0.4.6/llama-server` | serves all three models; CUDA-linked |
| CPU-only build | `/home/leviathan/llama.cpp/build-cpu/bin/llama-server` | 6.2 MiB, 0 CUDA linkage, for the embed layer |
| Embed model | `/home/leviathan/models/nomic-embed-text-v1.5.Q4_K_M.gguf` | 80 MiB, 12 blocks, ctx 2048, 768-dim |

## MEASURED FOOTPRINTS (the budget of record)

```
:8008 JevK5      5,136 MiB VRAM   68 MiB host RSS
:4171 Qwen200k   4,368 MiB VRAM   68 MiB host RSS
:4172 DeepSeek   2,248 MiB VRAM   68 MiB host RSS
card total 12,282  used 11,832  free 45
kvarn3 KV rate (measured) = 3.625 bits/value = 7,424 B/token @ 16,384 vals
```

## CHECKPOINT STRUCTURE (unchanged for V6 — blueprints only)
No formal checkpoint saved yet for V6. The V5 reference is the live codebase at
`~/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent` (branch omp-worker-1 @ 8f4ac74, tree clean).
The model-server work of 2026-09-24 is a **runtime layer**, not a V6 code checkpoint — its
"checkpoint" is the script SHA set + the model byte-identities above.

## THE VERIFICATION LEDGER (what was run, what it returned)

| Command | Result | Date |
|---|---|---|
| `curl :8008/health` | `{"status":"ok"}` | 2026-09-24 |
| `curl :4171/health` | `{"status":"ok"}` | 2026-09-24 |
| `curl :4172/health` | `{"status":"ok"}` | 2026-09-24 |
| `curl :4171/props` | `total_slots 1`, `n_ctx 200192` | 2026-09-24 |
| `curl :4172/props` | `total_slots 1`, `n_ctx 131072` | 2026-09-24 |
| `curl :4172/v1/chat/completions` (F(20)) | `\boxed{6765}`, `finish_reason: stop`, 2,766 tok | 2026-09-24 |
| `nvidia-smi --query-compute-apps` | 3 rows: 5,136 / 4,368 / 2,248 MiB | 2026-09-24 |
| `nvidia-smi --query-gpu` | `12282, 11832, 45` | 2026-09-24 |
| Two-point KV (32k vs 262k) | 3,150 → 4,774 MiB = 1,624 MiB / 229,376 tok | 2026-09-24 |
| `ldd build-cpu/bin/llama-server` | 0 CUDA libs | 2026-09-24 |
| `:18099/v1/embeddings` (CPU-only) | 768 dims, 0 VRAM | 2026-09-24 |
| `curl :1933/health` | `healthy: true`, v0.2.16.dev3 | 2026-09-24 |
| `git status docs/` (post-move) | empty | 2026-09-24 |
| `git diff --stat HEAD -- docs/` | empty | 2026-09-24 |
| `bun diag-lmv-golden-fx.ts` (V5) | ENTRIES 15/15 ≤3p + TPs 2/2 + PASS | 2026-09-16 |
| `bun test src/` (V5) | 1195 pass / 0 fail / 84 files / 119,019 expects | 2026-09-16 |
| `bunx tsc --noEmit` (V5) | exit 0 | 2026-09-16 |

## FROZEN MACHINERY (do not open — with the reason)

| Artifact | Why frozen |
|---|---|
| V5 pipeline, entire branch `omp-worker-1` @ 8f4ac74 | It is the REFERENCE — 15/15 golden. Modifying it destroys the baseline the V6 build is measured against. |
| `sl-lmv.ts` + `trade-dedup.ts` | The SHA-pinned frozen pair (`912940832fac44bc…`, `33914c897e777540…`). Any change is a regression by definition. |
| `Checkpoints/monday-gold-standard-achieved/` | Locked immutable — a sealed historical state. |
| `Checkpoints/v4.5.1_LIVE_MARKET_CAPABLE/` | Locked immutable — a sealed historical state. |
| The arsumbris type-defs (8 files in `type/`) | Operator-authored schemas. Changing a type changes the grammar of every card. |
| The 38 rulings (R01-R38) | Operator-authored law. Only the operator amends law. |
| `models/gguf/DeepSeek-R1-Distill-Qwen-1.5B-Q8_0.gguf` | Retained as the accuracy-ceiling reference (1.76 GB). Do NOT delete without operator sign-off. |

## THE ARTIFACT INVENTORY — V6 blueprints (carried from 2026-09-17)

| Document | Lines | SHA-16 | Purpose |
|---|---|---|---|
| `Plutus_V6_Master_Blueprint_v1.md` | 524 | `e3ce24ec` | Kev/Limite/TensorTrade integration (now Decider) |
| `Plutus_V6_Initial_Blueprint.md` | 284 | `c143163d` | Architecture diagram + 17 questions + 6 math + 8 gates |
| `Plutus_E3_Master_Blueprint_v1.md` | 977 | `a5944b35` | Working E3 architecture (for the 5.3.3 prompt agent) |
| `Plutus_MPSE_Limite_Master_Blueprint_v1.md` | 398 | `8cc06fce` | Quality-control layer (7 gates, 10 AT predicates, 5 unlocks) |
| `PLANNING_SUITE_Plutus_V6_Build_Package.md` | 374 | `3b87f02f` | The dispatchable plan: 10 specs, 3 phases |
| `PLANNING_SUITE_Kev_Limite_Fusion.md` | 386 | `d8278046` | Question mapping (Kev-era — needs a Decider update) |
| `PLANNING_SUITE_Plutus_V6_Architecture.md` | 160 | `9e4874e3` | Planning skeleton (superseded by Build_Package) |
| `Knowledge_Graph_Map_v2.md` | 7,795 | (in-graph) | Interactive transcription (649 cards) |
| `Knowledge_Graph_Map_v1.md` | (in-graph) | (in-graph) | Before-snapshot (66 cards) |

## THE V6-AUDIT ARTIFACTS (in `reports/v6-audit/`)

| File | Lines | Content |
|---|---|---|
| `e3-mdve.md` | 637 | MDVE E3 architecture (ob-engine, setup-gen, chaining, dedup) |
| `e3-wiring.md` | 270 | E1→E2→E3 composition (cascade, session brackets, 127 anchors) |
| `v6-audit-e2e3.md` | 768 | 93 MIGRATION cards (E2+E3 → Kev/Limite/gates) |
| `v6-audit-harness.md` | 480 | 40 MIGRATION cards (pipeline → V6 harness loop) |
| `v6-mpse-limite-authoritative.md` | 378 | MPSE/Limite fusion (grounded in first-hand bible reads) |
| `v6-mpse-limite.md` | 398 | MPSE/Limite fusion (V6MPSE-2's cross-reference) |

## THE V5 VERIFIED STATE (reference, do not modify)

- Branch: `omp-worker-1` @ `8f4ac74` (tree clean)
- Canon pipeline (`report-v452.ts`): ENTRIES 15/15 at ≤3p + TPs 2/2 at ≤5p — **VERDICT: PASS**
- Frozen pair: `sl-lmv.ts` `912940832fac44bc…` + `trade-dedup.ts` `33914c897e777540…` — **MATCH**
- Suite: 1195 tests / 0 fail / 84 files / 119,019 expects
- `tsc`: exit 0
- W9 re-port (the mistake): 1/5 golden convergence — the regression confined to its +7,968 lines of re-implemented machinery

## THE ARSUMBRIS DEPLOYMENT

- Engine: `au` daemon running on MASTER_CONTEXT (built 50.72s)
- Graph: 716 components · 27 edges · 0 diagnostics
- Cards: 38 rulings + 16 hard-limits + 1 lesson + 3 gates + 3 state + 5 terms + 583 mechanisms = **649**
- Host: Electron with 2 patches @ `b49c705` (WebGL graceful-degrade)
- Kernel: hub service `plutus-aumcp` (OPEN-003: the host wants to own its kernel)
- kgm: `fleet.ts` running (heal proven, lint proven)

## THE DEPLOYMENT DETAIL (how each server is launched, and why)

```
jevk5.sh        -m jevk5-4b-Q8_0.gguf      --port 8008  -c 16384   f16 KV uncompressed
                (the decision model; f16 because it was ordered uncompressed and 16k is cheap)
qwen35-4b.sh    -m Qwen3.5-4B-Q4_K_M.gguf  --port 4171  -c 200000  kvarn3 + 1024-token tail
                (native is 262144; 200000 frees ~440 MiB for the math slot — measured)
ds-math.sh      -m DeepSeek-...-Q6_K.gguf  --port 4172  -c 131072  kvarn3
                (card gen config: temperature 0.6, top_p 0.95; the model is a reasoning model)
```

Common to all three: `--n-gpu-layers 999` (full offload), `--flash-attn on`, `--kv-unified`
(one shared KV pool), `-np 1` (single slot owning the full context), `--metrics --jinja`.

## THE RUNTIME LINEAGE

| Binary | Linkage | Used for |
|---|---|---|
| `/home/leviathan/beellama.cpp/beellama-v0.4.6/llama-server` | CUDA | the three model servers |
| `/home/leviathan/llama.cpp/build-cpu/bin/llama-server` | **none** (0 CUDA) | the embed layer (6.2 MiB) |
| `/home/leviathan/llama.cpp/build/bin/llama-server` | CUDA | legacy — the old `:8001` embed unit's binary |
| `/home/leviathan/buun-llama-cpp/build/bin/llama-server` | CUDA | the `:18082` embed unit's binary |

**The embed merge replaces the last two with the CPU-only build.** Both legacy binaries stay
on disk (harmless; nothing will launch them once the units are re-homed).
