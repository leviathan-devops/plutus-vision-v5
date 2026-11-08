# EVIDENCE STATE — Plutus (updated 2026-09-24)

> Semantics: APPEND new evidence; the SUMMARY section is replaced each update.
> Full 64-char SHAs are mandatory in this doc — a truncated prefix is not a fingerprint.
> Rule: a claim without its command output is not evidence. Blocked is reported as blocked.

## SUMMARY (current)

**What is proven this session:** three GPU model servers live and measured; the math model
selected from card evidence and proven on a real computation; the kvarn3 KV rate measured by
controlled experiment; a CPU-only embed binary built and proven at zero VRAM; the embed
duplication audited; the wrong model generation caught and deleted; the documentation
placed in the operator's required home; the two missing canon logs created.

**What is NOT proven:** the embed merge (decided, not executed — the layer is DOWN); server
hardening (not started); the D-014 model-lineup question (unresolved); the deterministic
engine + Jev gate on the math path (not wired); the fresh-operator drill (not run).

## THE ARTIFACT SHAs (full 64-char, the fingerprints of record)

```
837bc8d1c2912064974488f6fb8cb4b74697b05d85659c555a194987bfba11d0  models/servers/jevk5.sh
05d875669c1103cae89a9c2d4cd172445d7a983c7cb86d07df4d999008c10f14  models/servers/qwen35-4b.sh
54b8061d21ce47d181408ed7fd92f360f551e3e9cd57620db2b1a16dc6b3f04b  models/servers/ds-math.sh
b41d941c91fd04fff605b29c36292b1133793753a4bfbb25478c92967837782a  llama.cpp/build-cpu/bin/llama-server
dc82ff976b775438221ca894dcb9b67616b05cd2ebb0c3be1082670fd92355e8  MODEL_SERVERS_OPERATOR_MANUAL.md
463294b8390d9c4f603ca6fb1eed35b7bdc33d1f0ab63f662a6209c4a4cb35da  MODEL_SERVERS_RUNBOOK_2026-09-24.md
912940832fac44bc…  (V5 frozen pair — sl-lmv.ts, full SHA in BUILD_STATE)
33914c897e777540…  (V5 frozen pair — trade-dedup.ts, full SHA in BUILD_STATE)
```

## VERIFIED — the model server stack (mechanically proven 2026-09-24)

| Claim | Evidence | Source |
|---|---|---|
| `:8008` JevK5-4B-Q8_0 serving | `curl :8008/health` → `{"status":"ok"}`; `/v1/models` → 1 id | Live |
| `:8008` VRAM 5,136 MiB | `nvidia-smi --query-compute-apps=pid,used_memory` | Measured |
| `:4171` Qwen3.5-4B-Q4_K_M serving | `curl :4171/health` → ok; `/props` → total_slots 1, n_ctx 200192 | Live |
| `:4171` VRAM 4,368 MiB | `nvidia-smi` | Measured |
| `:4172` DeepSeek-R1-Distill-Qwen-1.5B-Q6_K serving | `curl :4172/health` → ok; `/props` → total_slots 1, n_ctx 131072 | Live |
| `:4172` VRAM 2,248 MiB | `nvidia-smi` | Measured |
| Card totals | `12282 MiB, 11832 MiB, 45 MiB` (total, used, free) | `nvidia-smi` |
| **kvarn3 KV rate = 3.625 bits/value** | Controlled two-point: `@32k 3150 MiB` → `@262k 4774 MiB` = 1,624 MiB over 229,376 tok = 7,424 B/tok ÷ 16,384 vals × 8 = 3.625 | Measured |
| Qwen3.5-4B geometry | 32L · 8 full-attn of 32 · 4 KV heads · head_dim 256 · max_pos 262144 · 16,384 KV vals/tok | `config.json` |
| JevK5's base IS Qwen3.5-4B | Identical geometry + JevK5 `architectures: Qwen3_5ForCausalLM` | `config.json` × 2 |
| Qwen3.5-4B throughput | 724 tok/s prompt · 80.6 tok/s gen | `/v1/chat/completions` timings |
| JevK5 throughput | 321 tok/s prompt · 61.5 tok/s gen | Measured |
| DeepSeek throughput | 117 tok/s gen | Measured |
| **DeepSeek math correctness** | F(20), F(1)=1,F(2)=1 → `\boxed{6765}`, `finish_reason: stop`, 2,766 tok (2,121 reasoning + 645 visible) | Live completion |
| DeepSeek VRAM flat under load | 2,248 MiB before and after the 2,766-token run (KV preallocated) | Measured |
| DeepSeek GGUF identity | 1,464,179,296 bytes; header `qwen2`, 28 blocks, emb 1536, 12 heads / 2 kv, ctx 131072 | `stat` + header parse |
| Qwen3.5-4B GGUF size | 2,740,937,888 bytes | `stat` |
| JevK5 GGUF size | 4,482,402,656 bytes | `stat` |
| DS Q8_0 GGUF size | 1,894,532,416 bytes | `stat` |
| CPU-only binary | 6.2 MiB; `ldd` = **0** cudart/cublas/ggml-cuda (CUDA build = 4) | Built + `ldd` |
| CPU-only serves at 0 VRAM | `:18099` → 768-dim embeddings, **absent** from `nvidia-smi --query-compute-apps` | Proven |
| Embed model real context | `nomic-bert.context_length = 2048`, 12 blocks, emb 768, pooling mean | GGUF header parse |
| Embed duplication | `:18082` 322 MiB + `:8001` 820 MiB VRAM for the same 80 MiB GGUF | `nvidia-smi` |
| `:8001` is a SYSTEM unit | `/proc/6062/cgroup` → `/system.slice/llama-embedding.service`; created 2026-07-31; `NRestarts=1` | `/proc` + `systemctl cat` |
| OpenViking live | `curl :1933/health` → `{"status":"ok","healthy":true,"version":"0.2.16.dev3"}` | Live |
| One-model-per-server | `/v1/models` = exactly 1 id on `:4171`, `:8008`, `:8001`, `:18082` | Live |
| No multi-model flag exists | `--help` grep: only `--lora`, `--spec-draft-model`, `--mmproj` (components, not models) | Binary help |
| `-np` is not multi-model | `--kv-unified` = ONE shared pool; `--kv-unified-per-slot N` sizes `n_parallel*N` | Binary help |
| Docs placed in the shared workspace | 14,045 B + 9,851 B at `PLUTUS/MASTER_CONTEXT/`; worktree copies removed | `ls` + `stat` |
| No docs damage from the move | `git status docs/` empty; `git diff HEAD -- docs/` empty; 21 tracked files intact | `git` |
| GPU has only our 3 processes | `nvidia-smi --query-compute-apps` = 3 beellama rows | Measured |
| Display is NOT on this GPU | Wayland; no graphics apps on the NVIDIA card | `nvidia-smi` + `loginctl` |
| Host RAM cannot hold the weights | 30 GiB total / ~730 MiB available; weights 8.5 GB → +7,954 MiB shortfall | `free` + `meminfo` |
| Swap state | `/swapfile-128g` 128G, 39–41G used, swappiness 50 | `swapon` + `/proc/sys/vm/swappiness` |

## VERIFIED — the V5 reference (carried, unchanged from 2026-09-17)

| Claim | Evidence | Source |
|---|---|---|
| V5 canon: 15/15 golden entries | `bun diag-lmv-golden-fx.ts` → ENTRIES 15/15 ≤3p + TPs 2/2 + VERDICT PASS | At HEAD 8f4ac74 |
| V5 frozen pair MATCH | `sha256sum src/mdve/sl-lmv.ts src/mdve/trade-dedup.ts` → both match baseline | At HEAD 8f4ac74 |
| V5 suite: 1195/0 | `bun test src/` → 1195 pass / 0 fail / 84 files / 119,019 expects | Executed |
| V5 tsc: exit 0 | `bunx tsc --noEmit` → exit 0 | Executed |
| Graph: 716 nodes · 0 diagnostics | Engine wire read (overview + diagnostic_counts) | Live daemon |
| 583 mechanism cards on disk | `ls MASTER_CONTEXT/mechanisms/*.md \| wc -l` = 583 | Filesystem |
| 38 rulings, 21 anchored | `grep -l UNANCHORED rulings/*.md \| wc -l` = 17; 38−17=21 | Filesystem + grep |
| kgm heal proven | Journal row: "healed 'daemon-down': daemon restarted, read-back ready=true (pid 446499)" | kgm journal |
| Decider-2B OOD: 0.755 | Model card | Web-verified (2026-09-17) |
| Limite 1B math: 74.25% BeyondAIME | Model card | Web-verified (2026-09-17) |
| V6 build package: 374 lines | `wc -l` on disk | Filesystem |
| E3 blueprint: 977 lines | `wc -l` on disk | Filesystem |
| MPSE blueprint: 398 lines | `wc -l` on disk | Filesystem |
| V6 initial blueprint: 284 lines | `wc -l` on disk | Filesystem |
| V6 master blueprint: 524 lines | `wc -l` on disk | Filesystem |

## VERIFIED — the model-selection evidence (card-sourced, this session)

| Claim | Evidence | Source |
|---|---|---|
| DeepSeek's base IS Qwen2.5-Math-1.5B | DeepSeek's own model table: `\| DeepSeek-R1-Distill-Qwen-1.5B \| Base Model: Qwen2.5-Math-1.5B \|` | Model card |
| The two candidates are parent/successor, not peers | Same table | Model card |
| DeepSeek AIME24 28.9% pass@1 / 52.7% cons@64 | DeepSeek distilled-eval table | Model card |
| Qwen2.5-Math-1.5B AIME24 3/30 CoT · 7/30 TIR | Qwen2.5-Math technical report (arXiv 2409.12122) | Paper HTML |
| Qwen2.5-Math needs TIR for its best scores | MATH 75.8 CoT vs 79.9 TIR; Olympiad 38.1 vs 49.2; AIME 3/30 vs 7/30 | Paper HTML |
| Qwen2.5-Math's authors disclaim general use | Card: "We do not recommend using this series of models for other tasks." | Model card |
| Context 4,096 vs 131,072 | `config.json` `max_position_embeddings` on both | HF config |
| DeepSeek gen config | `temperature 0.6`, `top_p 0.95` | `generation_config.json` |
| Qwen2.5-Math has no gen config | `generation_config.json` → temperature None | HF config |

## UNVERIFIED (stated honestly)

- **DeepSeek kvarn3 rate on THIS architecture:** NOT two-point measured. 3.625 b/v is the
  Qwen3.5 measurement; back-solving DeepSeek's own footprint (2,248 − 1,397 weights − ~150
  buffers ≈ 700 MiB KV over 131,072 tokens) implies ~3.1 b/v. The two-point test on `:4172`
  is open.
- **Embed merge:** NOT EXECUTED. Both units stopped; both ports DOWN. The CPU-only binary is
  proven but not yet serving either port.
- **Server hardening:** NOT DONE. Bare `setsid nohup`, `oom_score_adj=200`, `VmLck=0`, no
  units, no `Restart=always`.
- **Deterministic compute engine + Jev gate on the math path:** NOT WIRED.
- **Fresh-operator drill** against the manual: NOT RUN.
- **The manual's builder-leak scan:** self-assessed, not independently audited.
- **D-014 divergence** (JevK5 vs Decider-2B / DeepSeek vs Limite): **UNRESOLVED.**
- **Canon doc floors:** 8 of 11 docs remain under the 200-line floor (see the gate result).
  Recorded as an open item, not hidden.
- **Decider-2B / Limite deployment:** still NOT deployed (unchanged from 2026-09-17).

## CONTAINER-RUN PROVENANCE

**No container tests this session.** All evidence is host-native: `curl` against live
servers, `nvidia-smi` VRAM reads, real `/v1/chat/completions` completions with token
accounting, `ldd` linkage checks, GGUF header parses, `/proc/<pid>/cgroup` attribution,
`sha256sum` fingerprints, and `git status`/`diff` integrity checks.

Per the container-testing law, a container test is proven by its artifact
(`.omp/container-test-results.json`) — **no such artifact exists for this session**, so no
container claim is made. The model servers are verified by live host probes, which is the
correct instrument for a host-resident service.

---

## APPENDED 2026-09-24 — THE FULL COMMAND TRANSCRIPT (reproducible evidence)

Every measurement below was produced by the command shown. The output is quoted, not
paraphrased. This is the record a future agent re-runs to re-verify.

### The stack is up
```
$ for p in 8008 4171 4172; do echo -n ":$p "; curl -s -m 5 http://127.0.0.1:$p/health; echo; done
:8008 {"status":"ok"}
:4171 {"status":"ok"}
:4172 {"status":"ok"}
```

### The card matches
```
$ nvidia-smi --query-compute-apps=pid,used_memory,process_name --format=csv,noheader
3582435, 5136 MiB, .../beellama-v0.4.6/llama-server
653954, 4368 MiB, .../beellama-v0.4.6/llama-server
680385, 2248 MiB, .../beellama-v0.4.6/llama-server
$ nvidia-smi --query-gpu=memory.total,memory.used,memory.free --format=csv,noheader
12282 MiB, 11832 MiB, 45 MiB
```

### The contexts
```
$ curl -s http://127.0.0.1:4171/props | ... -> total_slots = 1, n_ctx = 200192
$ curl -s http://127.0.0.1:4172/props | ... -> total_slots = 1, n_ctx = 131072
```

### The math proof (F(20))
```
$ curl -s -m 300 http://127.0.0.1:4172/v1/chat/completions -d '{...,"max_tokens":3000}'
final content tail: '...Thus, the 20th Fibonacci number is \\(\\boxed{6765}\\).'
finish: stop
tokens: 2766  reasoning: 2121  visible: 645
117 tok/s gen
```

### The kvarn3 measurement (controlled two-point, only `-c` varying)
```
@32k   total beellama VRAM = 3150 MiB
@262k  total beellama VRAM = 4774 MiB
delta 1624 MiB over 229,376 tokens
   = 7424 B/token = 3.62 bits/value
-> KV window @262,144 = 1856 MiB
```

### The wrong-model geometry (the check that caught it)
```
JevK5 (the decision model)  32 layers   8 full-attn   4 kv_h  hd 256  max_ctx 262144  16,384 vals/tok
Qwen3.5-4B (its BASE)       32 layers   8 full-attn   4 kv_h  hd 256  max_ctx 262144  16,384 vals/tok   <- identical
Qwen3-4B (what ran)         36 layers  36 full-attn   8 kv_h  hd 128  max_ctx  32768  73,728 vals/tok   <- wrong
```

### The CPU-only binary
```
$ ls -la build-cpu/bin/llama-server        -> 6.2 MiB
$ ldd build-cpu/bin/llama-server | grep -cE 'cudart|cublas|ggml-cuda'   -> 0
$ ldd llama.cpp/build/bin/llama-server | grep -cE 'cudart|cublas|ggml-cuda'  -> 4
$ curl :18099/v1/embeddings -> dims: 768
$ nvidia-smi ... | grep 18099's PID -> NOT ON GPU (0 VRAM)
```

### The unit-ownership check (the false "orphan")
```
$ cat /proc/6062/cgroup
0::/system.slice/llama-embedding.service
$ systemctl cat llama-embedding.service
Description=Llama Embedding Server for OpenViking
ExecStart=.../llama.cpp/build/bin/llama-server ... --port 8001 --embeddings -c 8192 ... --mlock
Restart=always
```

### The doc-move integrity check
```
$ cd ~/.omp/wt/plutus-main-66dfa4c && git status --short docs/
(empty)
$ git diff --stat HEAD -- docs/
(empty)
$ git ls-files docs/ | while read f; do stat -c %s "$f"; done
38579 1589 19728 5820 5770 5201 4739 1417 1005 280 2115 176 96 616 111 159 150 270 249 335 194   (21 files, all non-empty)
```

### The embed metadata (GGUF header parse)
```
magic=GGUF ver=3 tensors=112 kv_pairs=23
general.name = nomic-embed-text-v1.5
nomic-bert.block_count = 12
nomic-bert.context_length = 2048
nomic-bert.embedding_length = 768
nomic-bert.attention.head_count = 12
nomic-bert.pooling_type = 1
```

### The device constraints
```
$ free -h          -> Mem: 30Gi total, 2.1Gi free, 730Mi available; Swap: 127Gi, 39Gi used
$ swapon --show    -> /swapfile-128g  file  128G  41.3G  200
$ cat /proc/sys/vm/swappiness -> 50
$ nproc            -> 32
```

### What is NOT in this transcript
No container-test artifact (`.omp/container-test-results.json`) exists — no container claim
is made. The model servers are host-resident services verified by live host probes, which is
the correct instrument. Any future container claim must produce its own artifact.
