# RUNNING DEBUG LOG — Plutus (append-only, newest at the end)

> Semantics: APPEND ONLY. One entry per debug/root-cause event, written the moment
> the insight lands. Never edit or delete a prior entry — a fixed bug with no entry
> is an un-learned lesson. Shape: `## [ISO] — <bug>` with SYMPTOM / ROOT CAUSE /
> FIX / LESSON / EVIDENCE.

## [2026-09-24T17:05+04] — WRONG MODEL GENERATION SERVED (Qwen3-4B where Qwen3.5-4B belonged)

- **SYMPTOM:** A Qwen server was running and healthy, but its architecture did not match
  the decision model it was supposed to share a family with. Operator challenge:
  *"where did a 4gb replacement come from"* → then the direct question that exposed it.
- **ROOT CAUSE:** The model was chosen by **filename**, not by architecture. A prior
  session's table said "Qwen3-4B"; I searched `Qwen/Qwen3-4B-GGUF`, got an HTTP 200 and a
  valid GGUF, and never checked whether the name matched JevK5's actual base. It did not.
  ```
  JevK5 (the decision model)   32L   8 full-attn   4 kv_h   hd 256   262144 ctx   16,384 KV vals/tok
  Qwen3.5-4B (its BASE)        32L   8 full-attn   4 kv_h   hd 256   262144 ctx   16,384   <- identical
  Qwen3-4B (what I ran)        36L  36 full-attn   8 kv_h   hd 128    32768 ctx   73,728   <- wrong
  ```
- **FIX:** Deleted `Qwen3-4B-Q4_K_M.gguf` + `Qwen3-4B-Q8_0.gguf` from disk. Downloaded
  `Qwen3.5-4B-Q4_K_M.gguf` (unsloth). Verified via config.json `architectures:
  Qwen3_5ForCausalLM` and identical geometry, then by real completions.
- **LESSON:** **Verify a model by its ARCHITECTURE against the artifact that depends on
  it — never by filename.** The correct model also turned out to be 4.5x cheaper on KV
  (hybrid attention: 8 of 32 layers cache) and 4x the native context. The name matched
  the family; the generation did not. This is the same class of error as inheriting a
  version number from a doc instead of checking the binary.
- **EVIDENCE:** Geometry table above (from both models' `config.json`); `Qwen/Qwen3.5-4B`
  HTTP 200 vs `Qwen/Qwen3.5-4B-GGUF` HTTP 401; unsloth GGUF listing; the deleted files'
  removal output.

## [2026-09-24T17:35+04] — CUDA OOM ON A CARD THAT SHOULD HAVE HAD ROOM

- **SYMPTOM:** `cudaMalloc failed: out of memory` / `failed to allocate CUDA0 buffer of
  size 2729969664` / `llama_model_load: error loading model: unable to allocate CUDA0
  buffer`. A relaunch of an already-working config failed.
- **ROOT CAUSE:** **My own measurement probes were still resident.** I had launched
  short-lived test servers on `:4197` / `:4198` to measure KV scaling and never reaped
  them before launching the real stack. Four beellama servers on a 12,282 MiB card →
  the fifth allocation failed. The operator's arithmetic was right (the two-model stack
  is 9.66 GiB); the card was full of *my debris*, not the intended models.
- **FIX:** Kill every probe PID before launching the stack. Re-measure with
  `nvidia-smi --query-compute-apps` between steps, not just at the end.
- **LESSON:** **A measurement harness is a GPU consumer.** Budget for it explicitly and
  reap it before the next launch. When an allocation fails, check for your own residue
  before blaming the config — the config had already worked.
- **EVIDENCE:** The three `cudaMalloc` error lines; the `nvidia-smi` row set showing 4
  beellama processes at the moment of failure; the successful launch after the cleanup.

## [2026-09-24T18:20+04] — FALSE "ORPHAN" CLAIM ABOUT A LEGITIMATE SYSTEM UNIT

- **SYMPTOM:** I reported `:8001` (PID 6062) as an orphan — PPID=1, no unit, nothing
  referencing the port — and killed it. It came back. I then called it "my kill didn't
  even stick."
- **ROOT CAUSE:** **Scope-limited search.** I checked `systemctl --user list-units` only.
  `:8001` is a **system** unit:
  ```
  /proc/6062/cgroup -> 0::/system.slice/llama-embedding.service
  systemctl cat llama-embedding.service -> "Llama Embedding Server for OpenViking"
                                          created 2026-07-31, enabled, Restart=always
  ```
  `PPID=1` was systemd adopting it, not orphanhood. The respawn was `Restart=always`
  working correctly.
- **FIX:** Read `/proc/<pid>/cgroup` to attribute a process to its unit, and check BOTH
  scopes (`systemctl` and `systemctl --user`) before concluding anything.
- **LESSON:** **`PPID=1` means "adopted by init", not "orphaned".** Attribute ownership
  by cgroup, never by parent PID. And never call a process garbage before checking the
  scope you didn't check. The operator asked *"where did openviking come from? this has
  been sitting on gpu for the last 3 months?"* — the answer was in the unit file's own
  description, which I had not read.
- **EVIDENCE:** `/proc/6062/cgroup`; `systemctl cat llama-embedding.service` (ExecStart +
  `Restart=always` + `OOMScoreAdjust=-17`); `NRestarts=1`; the file's creation timestamp.

## [2026-09-24T18:45+04] — "EMPTY RESPONSE" FROM A WORKING MODEL

- **SYMPTOM:** A chat completion returned `"content": ""` from a healthy server. Looked
  like a broken model.
- **ROOT CAUSE:** **My test was wrong, not the model.** The request set
  `"max_tokens": 16` (and later 600) on a **reasoning** model. The model spent the entire
  budget on `reasoning_content` and had zero tokens left for `content`:
  ```
  max_tokens 600  -> completion_tokens 600, reasoning_tokens 600, visible_tokens 0, content ''
  max_tokens 3000 -> completion_tokens 2766, reasoning_tokens 2121, visible_tokens 645, content present
  ```
- **FIX:** Set `max_tokens` ≥ 2000 for any real question, ≥ 3000 for math. Read
  `reasoning_content` and `content` as separate fields.
- **LESSON:** **On a thinking model, a small `max_tokens` reads exactly like a broken
  model.** Check `completion_tokens_details.reasoning_tokens` before concluding anything —
  if reasoning consumed the whole budget, raise it and resend. This is an operator error
  class, and it belongs in the manual's symptom table.
- **EVIDENCE:** The two `usage` blocks above; the F(20)=6765 proof at 3000 tokens with
  `finish_reason: stop`.

## [2026-09-24T19:05+04] — YaRN FLAGS COPIED ACROSS MODEL GENERATIONS

- **SYMPTOM:** A launch script for Qwen3.5-4B carried
  `--rope-scaling yarn --rope-scale 4 --yarn-orig-ctx 32768`.
- **ROOT CAUSE:** Those flags were written for the **wrong** model (Qwen3-4B, native
  32,768). Qwen3.5-4B is native **262,144**. Scaling YaRN from a 32,768 origin on a
  262k-native model would have **destroyed** its native range — silently, since the
  server starts fine.
- **FIX:** Removed the YaRN flags entirely. Qwen3.5-4B at 262k needs none — that is its
  trained window. Verified `/props` reports the intended `n_ctx`.
- **LESSON:** **RoPE-scaling flags are model-specific and survive a model swap as silent
  corruption.** When the base model changes, re-derive every context-related flag from the
  NEW model's `max_position_embeddings`; never carry them over.
- **EVIDENCE:** `grep -A2 'rope-scaling' qwen35-4b.sh` showing the stale line; the help
  text for `--yarn-orig-ctx`; the corrected script; live `/props` n_ctx 200192.

## [2026-09-24T20:50+04] — `rmdir -v` REPORTED SUCCESS ON A NON-EMPTY DIRECTORY

- **SYMPTOM:** `rmdir -v docs/integrations docs` printed `removing directory, 'X'` for
  both — which reads as success — yet both still existed afterwards with 21 real files
  inside (`RECON.md` 19,728 B, `PUFFER_KERNEL_BRIEF.md` 38,579 B, `quotes/`, layouts).
- **ROOT CAUSE:** Two compounding mistakes: (1) `rmdir` only removes **empty**
  directories, and these were not empty; (2) I had `2>/dev/null` on the calls, which
  **swallowed the failure messages**, while `-v`'s stdout line is emitted regardless. I
  read the verbose banner as confirmation.
- **FIX:** Verified with `git status docs/` (empty) and `git diff HEAD -- docs/` (empty)
  plus per-file `stat -c %s` on all 21 files — nothing was lost. No fix needed because no
  damage occurred; the near-miss is the lesson.
- **LESSON:** **Never delete a directory tree in a git worktree with `rmdir`.** Use the
  right tool for the intent, never blanket-delete a `docs/` dir, and never send stderr to
  `/dev/null` on a destructive command. Verify deletion by re-listing, never by the
  command's own output.
- **EVIDENCE:** The `rmdir -v` output vs the subsequent `find`; the 21 intact files with
  sizes; `git status docs/` empty; `git diff --stat HEAD -- docs/` empty.

## [2026-09-24T20:58+04] — ALL CORES SATURATED, SUSPECTED THE MODEL SERVERS

- **SYMPTOM:** Device lag; all 32 cores pegged; load average 65.77 (27 → 52 → 65, rising).
  Operator: *"is that from the llama servers or something else"*.
- **ROOT CAUSE:** **Not the model servers.** They measured 0.5% + 0.9% + 6.0% CPU — idle,
  GPU-bound, waiting. The eater was a **respawning batch**: a `bun` process at 1,087% and
  `kev-decide.ts` (a Jev judgment over `Graph_Intelligence`, subject `arsumbris`) at 597%.
  The two PIDs died; a fresh `kev-decide.ts` appeared at `ELAPSED 00:00` already at 1,078%
  — a supervisor/retry loop re-firing the same judgment. Operator asked again whether I
  killed it: **I had not touched it**; the load fell on its own when the pair exited.
- **FIX:** None applied (out of scope, operator's call). The diagnostic stands: the model
  servers are exonerated by measurement, and the loop's parent is the thing to fix.
- **LESSON:** **Attribute load by measurement before acting.** `ps -eo pid,pcpu,args
  --sort=-pcpu` names the eater in one call; the GPU servers are trivially exonerated by
  their own percentages. A respawning batch is identified by a child at `ELAPSED 00:00`
  with the parent's CPU profile — kill the child and it returns; find the loop first.
- **EVIDENCE:** The `ps` table (808168 bun 1087%, 808282 kev-decide 597%; llama-servers
  0.5/0.9/6.0%); `loadavg 65.77 52.17 27.23`; the follow-up showing both PIDs gone and a
  new `kev-decide.ts` (847512) at 00:00 elapsed / 1078% CPU.
