# CHANGELOG (2026-09-17 session)

## ACCOMPLISHED (with evidence)
- Knowledge graph overhaul: dispatched 7 forensic scouts → 586 cards extracted → 583 assembled into mechanisms/ → 716 graph nodes · 0 diagnostics (engine read)
- Interactive graph map v2: 7,795 lines, hyperlinked ToC + connection footnotes (Knowledge_Graph_Map_v2.md)
- E3 master blueprint: 977 lines from 4 E3 scouts (wiring + MDVE + core + visual)
- V6 architecture: Decider-2B replaces Kev (operator confirmed after head-to-head: 0.755 vs 0.620 OOD, ECE 0.037 vs 0.089)
- MPSE/Limite fusion: 398 lines (6 queries, 7 gates, 10 AT predicates, 5 unlocks, dual-compute verifier)
- V6 build package: 374 lines, 10 component specs, 3 phases (PLANNING_SUITE_Plutus_V6_Build_Package.md)
- 8 forensic audit scouts: 2,931 lines of migration cards (93 E2E3 + 40 harness + MPSE)
- Thread system: plutus master thread + knowledge-graph micro + arsumbris log + system-debugging
- Multiple bug fixes (EN-001..007, OPEN-001..003)

## KEY DECISIONS (operator rulings verbatim)
- "decider it is then" — Decider-2B replaces Kev for the V6 decision engine
- "headless is banned" — the V6 runtime MUST have a visible TUI
- "coding is literally disabled on the plutus agent" — no coding capability needed
- "we don't need a coding agent to run a trading agent" — the V6 thesis
- "default to pi w/ mimocode exactly memory system copy paste ported in" — harness choice

## WHAT FAILED (root causes)
- Host crash wiped /tmp (all scout outputs lost) → re-dispatched all scouts → outputs now copied to permanent storage in reports/v6-audit/
- The first assembler had re.match vs re.search bug (0 cards written) → fixed → 283 cards
- The body field was reserved in the grammar → renamed to mechanics → all 583 cards re-generated
- 8 YAML parse errors from nested quotes → fixed with single-quoted YAML style → 0 diagnostics
- The KG map v2 had HTML comments triggering code-mode rendering in Orca → stripped → renders as markdown
- OPEN-003: the host's mcp.start() fails because the hub kernel squats the socket → fix identified (host owns kernel) but verification pending

## HONEST DISCLOSURES
- The in-app OMP session (OPEN-003) is BROKEN — the adapter is a stub, not a working launcher
- 17 of 38 rulings are UNANCHORED (quotes verbatim but corpus line not verified)
- The graph is edge-poor (716 nodes / 27 edges) — the cross-link pass is the visible gap
- The V6 build has NOT STARTED — blueprints and specs only, no code written
- Decider-2B fine-tuning on Plutus doctrine is UNPROVEN (expected ~0.80+ in-domain but no evidence yet)

## 2026-09-17 (final session entry) — V6 architecture confirmed + goal pin minted
- ACCOMPLISHED: Full V6 build package + goal pin (106 lines, validator PASS, all 6 gates green) + 9 canon docs + E3/MPSE/V6 master blueprints + knowledge graph overhaul (583 mechanism cards) + Decider-0.6B selected over Kev and Decider-2B (VRAM fit) + VRAM calculation from actual model configs (not assumptions)
- KEY DECISIONS: Decider-0.6B (operator: "lol decider has a 0.6b why didnt you mention this before yes do that"), embedded circuit architecture (operator: "THE ENTIRE TTE PIPELINE IS 1 EMBEDDED CIRCUIT PRIMARY AGENT IS NOT IN THE FUCKING LOOP"), pi harness with MiMoCode memory (operator: "default to pi w/ mimocode exactly memory system copy paste ported in"), headless banned, bash removed, Qwen3-4B for orchestration only
- The pin is at reports/PLUTUS_V6_GOAL_PIN.md — paste-ready for the next session

## 2026-09-24 (session entry) — the model server stack stood up; the wrong model caught and killed

- **ACCOMPLISHED:**
  - Three GPU model servers live, one model each: `:8008` JevK5-4B-Q8_0 (16k, f16 KV, 5,136 MiB) · `:4171` Qwen3.5-4B-Q4_K_M (200k, kvarn3, 4,368 MiB) · `:4172` DeepSeek-R1-Distill-Qwen-1.5B-Q6_K (131k, kvarn3, 2,248 MiB). Card 11,832/12,282 used.
  - Math model chosen from card evidence and deployed: DeepSeek-R1-Distill-Qwen-1.5B (its base IS Qwen2.5-Math-1.5B, so the two offered candidates were parent/successor). Proven on F(20) → `\boxed{6765}`.
  - Measured the kvarn3 KV rate by controlled experiment: **3.625 bits/value** (7,424 B/token at 16,384 vals) — a real number, replacing documentation guesses.
  - Built a CPU-only `llama-server`: 6.2 MiB, zero CUDA linkage, proven serving 768-dim embeddings at **0 VRAM**.
  - Audited both embed services: same GGUF, two ports, **1,142 MiB VRAM for CPU work**. Merge decided (one CPU-only server, both ports kept, both unit files kept).
  - Wrote the runbook (WHAT) + operator manual (HOW), placed in `PLUTUS/MASTER_CONTEXT/` after the operator rejected the omp-worktree location.
  - Created the two missing canon logs (`RUNNING_BUILD_LOG.md`, `RUNNING_DEBUG_LOG.md`) — they did not exist.
- **KEY DECISIONS (operator rulings verbatim):** "3 servers now 1 for each model" · "ok lower qwen to 200k and do Q6 at kvarn 3 this works" · "anything below q4/kvarn3 = banned" · "merge them into 1" · "what is this bullshit filepath PUT IT IN THE SHARED WORKSPACE". Recorded as D-008..D-013.
- **WHAT FAILED (root causes):**
  - **The wrong model generation was served.** The prior session's CHANGELOG entry — visible directly above this one — reads *"Qwen3-4B for orchestration only"*. That name was inherited and never verified against JevK5's actual base. The correct model is **Qwen3.5-4B** (identical geometry to JevK5; the two differ by a whole generation: 32L/8-full-attn/hybrid vs 36L/dense). Deleted from disk, replaced, verified. Full entry in `RUNNING_DEBUG_LOG.md`.
  - CUDA OOM from my own leftover measurement probes on a card that had room. Probes are GPU consumers; reap them.
  - False "orphan" claim about `:8001` — `PPID=1` means adopted by init, not orphaned. It is a system unit; attribute ownership by cgroup.
  - `rmdir -v` reported success on a non-empty directory (stderr was swallowed). 21 files survived; verified with git + per-file sizes.
  - YaRN flags copied across model generations (would have wrecked the native context range). Removed.
  - "Empty response" from a healthy model was a `max_tokens` starvation artifact on a thinking model, not a model defect.
- **HONEST DISCLOSURES:**
  - **The canon's V6 lineup does not match the machine.** D-003 ruled Decider-2B as the decision model; `EVIDENCE_STATE` recorded it "NOT YET DEPLOYED". The box runs **JevK5**, and the math engine is DeepSeek on llama.cpp, not Limite on vLLM. Recorded as **D-014 — UNRESOLVED, no rationale invented, awaiting an operator ruling.**
  - Embed merge DECIDED but NOT EXECUTED — both embed units are stopped, both ports DOWN.
  - Server hardening NOT DONE — all three are bare `setsid nohup` at `oom_score_adj=200`, no units, nothing restarts them.
  - The deterministic compute engine + Jev gate for the math path is NOT wired. The model reasons correctly; "cannot be wrong" is a property of the engine + gate, not the model.
  - Canon docs were 35–132 lines against a 200 floor and two logs were missing entirely. This entry begins the repair.

---

# CHANGELOG — HISTORICAL SESSIONS (reconstructed for the record)

## 2026-09-15 — the path-confusion incident + the canon discipline
- ACCOMPLISHED: V5 work scoped to `PLUTUS/agent/` as the workspace (nested git, default branch `plutus/main`). `00_WHERE_IS_EVERYTHING.md` written to end path confusion.
- KEY DECISION: checkpoints go in `agent/Checkpoints/` (hyphens, no spaces). "never `git add -A` for a checkpoint".
- WHAT FAILED: sessions had been building in ambiguous locations; the index file was the fix.

## 2026-09-15 — V6 scoped under Shared_Workspace/PLUTUS
- ACCOMPLISHED: the V6 spec set (14 files) ruled under `PLUTUS/V6/` — explicitly NOT the V5 build line.
- KEY DECISION: V6 is a separate line from V5; V5 stays the reference.

## 2026-09-16 — the W9 regression discovered
- ACCOMPLISHED: identified that the W9 wave re-implemented the canon reasoning chain (+7,968 lines) in violation of P2-1 and §1.11 #15. The canon itself never stopped hitting 15/15; the re-port scored 1/5.
- WHAT FAILED: **the re-implementation itself** — the root cause of R38 ("the test machinery wraps the PRODUCTION entry; it never re-implements the production flow").
- LESSON: a wave that re-implements working machinery is a regression wearing progress as a costume.

## 2026-09-17 — the knowledge graph overhaul
- ACCOMPLISHED: 7 forensic scouts → 586 cards extracted → 583 assembled into `mechanisms/` → 716 graph nodes · 0 diagnostics. Interactive map v2 (7,795 lines). E3 blueprint (977 lines). MPSE/Limite fusion (398 lines). V6 build package (374 lines). 8 audit scouts → 2,931 lines of migration cards.
- KEY DECISIONS: Decider over Kev; pi over MiMoCode; headless banned.
- WHAT FAILED: a host crash wiped `/tmp` (all scout outputs lost) → re-dispatched, outputs now in permanent storage. The first assembler had a `re.match` vs `re.search` bug (0 cards written) → fixed → 283 cards. The `body` field was reserved in the grammar → renamed to `mechanics` → 583 cards regenerated. 8 YAML parse errors from nested quotes → single-quoted style → 0 diagnostics. The KG map v2 had HTML comments triggering code-mode rendering in Orca → stripped.
- HONEST DISCLOSURES: OPEN-003 BROKEN; 17 of 38 rulings UNANCHORED; the graph is edge-poor (716/27); the V6 build had NOT started.

## 2026-09-17 (final) — V6 architecture confirmed + goal pin minted
- ACCOMPLISHED: full V6 build package + goal pin (106 lines, validator PASS, all 6 gates green) + 9 canon docs + the three master blueprints + the KG overhaul + **Decider-0.6B selected over Kev and Decider-2B on VRAM fit** + VRAM calculated from actual model configs (not assumptions).
- KEY DECISIONS: Decider-0.6B ("lol decider has a 0.6b why didnt you mention this before yes do that"); the embedded-circuit architecture ("THE ENTIRE TTE PIPELINE IS 1 EMBEDDED CIRCUIT PRIMARY AGENT IS NOT IN THE FUCKING LOOP"); pi with the MiMoCode memory port; headless banned; bash removed.
- **⚠ THE ORIGIN OF THE 2026-09-24 WRONG-MODEL BUG:** this entry's closing line reads **"Qwen3-4B for orchestration only"**. That name was inherited and never verified against JevK5's actual base (Qwen3.5-4B) until 2026-09-24, when the divergence was caught and the wrong model deleted. The lesson is in `RUNNING_DEBUG_LOG.md`.

---

# CHANGELOG — THE FAILURE REGISTER (every root cause, chronologically)

A session-by-session accumulation of what broke and why. Append-only. A repeated entry
means the lesson did not stick — that is itself the finding.

| # | Date | Symptom | Root cause | Fix | Lesson |
|---|---|---|---|---|---|
| 1 | 2026-09-17 | Host crash wiped `/tmp`; all scout outputs lost | outputs written only to ephemeral storage | re-dispatched; outputs moved to `reports/v6-audit/` | never leave the only copy in `/tmp` |
| 2 | 2026-09-17 | Assembler wrote 0 cards | `re.match` where `re.search` was needed | switched to `re.search` | a regex anchored at the string start silently matches nothing |
| 3 | 2026-09-17 | Cards failed the grammar | `body` was a reserved field name | renamed to `mechanics`; regenerated all 583 | check the grammar before mass-generating |
| 4 | 2026-09-17 | 8 YAML parse errors | nested quotes in unquoted scalars | single-quoted YAML style | quote style is a correctness concern, not cosmetics |
| 5 | 2026-09-17 | KG map v2 rendered as code in Orca | HTML comments in a `.md` triggered MDX mode | stripped all HTML comments | a viewer's rendering mode is a delivery constraint |
| 6 | 2026-09-16 | V6 pipeline scored 1/5 golden | the W9 wave re-implemented the canon chain (+7,968 lines) | canon restored as the reference | R38: the test machinery wraps the PRODUCTION entry, never re-implements it |
| 7 | 2026-09-24 | A Qwen server ran the wrong model generation | the model was chosen by filename; "Qwen3-4B" was inherited from a prior CHANGELOG line and never verified against JevK5's base | deleted both Qwen3-4B files; installed Qwen3.5-4B; verified by geometry + real completions | verify a model by ARCHITECTURE against the artifact that depends on it — never by name |
| 8 | 2026-09-24 | `cudaMalloc failed` on a card with room | my own measurement probes were still resident (4 beellama servers) | reaped the probes before launching | a measurement harness is a GPU consumer; budget and reap it |
| 9 | 2026-09-24 | Called a legitimate unit an "orphan" and killed it; it respawned | checked `systemctl --user` only; `PPID=1` read as orphanhood | read `/proc/<pid>/cgroup`; check BOTH scopes | `PPID=1` means adopted by init, not orphaned |
| 10 | 2026-09-24 | A healthy model returned `"content": ""` | `max_tokens` 16 (then 600) on a reasoning model — the whole budget went to `reasoning_content` | raised to 3000; read both fields | on a thinking model a small `max_tokens` reads exactly like a broken model |
| 11 | 2026-09-24 | A launch script carried YaRN flags from another model | the flags were written for Qwen3-4B (32k native) and carried onto Qwen3.5-4B (262k native) | removed them; native range needs none | RoPE flags are model-specific and survive a model swap as silent corruption |
| 12 | 2026-09-24 | `rmdir -v` reported success on a non-empty directory | `rmdir` only removes empty dirs; `2>/dev/null` swallowed the failures; `-v`'s banner printed anyway | verified with `git status` + per-file `stat`; 21 files intact | never delete a tree with `rmdir`; verify deletion by re-listing, not by the command's output |
| 13 | 2026-09-24 | All 32 cores pegged; device lag | a respawning `kev-decide.ts` batch (~11 cores), NOT the model servers (<7%) | none applied (out of scope); diagnosed by measurement | attribute load with `ps --sort=-pcpu` before touching anything |
| 14 | 2026-09-24 | Docs written into an omp worktree | habit; the worktree was the session cwd | moved to `PLUTUS/MASTER_CONTEXT/`; worktree copies removed | docs live in the shared workspace — a fresh agent looks there |
| 15 | 2026-09-24 | 8 canon docs under floor; 2 logs missing entirely | no manifest; the canon set was never completed | created the 2 logs; wrote the manifest; began the expansion | the canon decays silently without a manifest and a maintenance loop |

## THE NUMERIC RECORD (what changed, measured)

| Metric | Before 2026-09-24 | After 2026-09-24 |
|---|---|---|
| GPU model servers | 2 (one running the WRONG Qwen generation) | 3 (correct models, one per role) |
| Math model | none | DeepSeek-R1-Distill-Qwen-1.5B-Q6_K on `:4172` |
| Embed VRAM burned for CPU work | 1,142 MiB | 0 (CPU-only binary proven; merge pending) |
| Embed servers | 2 (same model, 2 ports) | merge decided → 1 binary, 2 ports kept |
| Qwen context | 262,144 | 200,000 (freed ~440 MiB measured) |
| kvarn3 KV rate known? | no (documentation guesses) | **yes — 3.625 bits/value, measured** |
| Canon docs | 9, all 35–132 lines, no manifest | 11 (+2 logs), manifest written, expansion in progress |
| Canon logs | 0 (both missing entirely) | 2, with 5 + 7 timestamped entries |
| Wrong-model files on disk | 2 (Qwen3-4B Q4_K_M + Q8_0) | 0 (deleted) |
| Docs location | n/a | `PLUTUS/MASTER_CONTEXT/` (operator-mandated) |

## THE HONEST SCOREBOARD (what this session did NOT finish)

- The embed merge is DECIDED but NOT EXECUTED — **the embed layer is currently DOWN**.
- The three model servers are UNPROTECTED (no units, `oom_score_adj=200`).
- D-014 is UNRESOLVED — the canon's model lineup does not match the machine.
- The deterministic engine + Jev gate on the math path is NOT WIRED.
- The fresh-operator drill was NOT RUN.
- 8 canon docs remained under the 200-line floor at the first gate run.
- The DeepSeek kvarn3 rate on its own architecture is BACK-SOLVED, not measured.

## THE SESSION NARRATIVE (2026-09-24, in order)

1. **The operator asked a direct question** — which of two 1.5B math models to deploy.
   Answering it from the cards revealed the candidates were parent and successor, not peers.
2. **The stack was audited** and found running two servers with no units, no protection, and
   `oom_score_adj=200`.
3. **The wrong model generation surfaced** during a routine geometry check: the running
   Qwen was 36-layer dense; JevK5's base is 32-layer hybrid. A whole generation off.
4. **The operator challenged it directly** and was right. Both wrong files were deleted, the
   correct model installed, verified by geometry and then by real completions.
5. **The embed layer was audited** — two services, one model, 1,142 MiB of VRAM burned for
   CPU work. A CPU-only binary was built (6.2 MiB, zero CUDA linkage) and proven at 0 VRAM.
6. **The VRAM budget was enumerated** — every weight/KV combination at every context size,
   so the operator could choose from measured numbers instead of estimates.
7. **The operator ruled**: Qwen to 200k, DeepSeek at Q6_K + kvarn3. Both executed and measured.
8. **The math model was proven** on F(20) → 6765 with VRAM flat through a 2,766-token run.
9. **The docs were written and then moved** — the operator rejected the omp-worktree path.
10. **The canon was audited** and found to describe a model lineup the machine does not have.
    That divergence is recorded as D-014, unresolved, with no rationale invented.

## THE LESSON OF THIS SESSION

Every defect found today shared one shape: **a name or a number inherited instead of
verified.**

- "Qwen3-4B" — inherited from a prior CHANGELOG line; the base was Qwen3.5-4B.
- The kvarn3 rate — assumed from a nominal ratio; measured at 3.625 b/v, not 3.375.
- The "orphan" — concluded from `PPID=1`; it was a system unit.
- The "empty response" — read as a model failure; it was a `max_tokens` starvation.
- The 200-line floor — assumed satisfied; the docs were 35–132 lines.

**The counter-pattern that worked every time:** measure the thing itself, in this session,
with a command whose output you read. `sha256sum`. `nvidia-smi`. `/proc/<pid>/cgroup`.
`config.json`. `/v1/chat/completions`. A geometry table. Every one of today's corrections
came from running the instrument instead of trusting the label.

## THE COMMANDS THAT PRODUCED THIS SESSION (for reproduction)

```bash
# the stack
for p in 8008 4171 4172; do curl -s -m 5 http://127.0.0.1:$p/health; done
nvidia-smi --query-compute-apps=pid,used_memory,process_name --format=csv,noheader
curl -s http://127.0.0.1:4171/props | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['total_slots'],d['default_generation_settings']['n_ctx'])"
# the math proof
curl -s -m 300 http://127.0.0.1:4172/v1/chat/completions -H 'Content-Type: application/json' \
 -d '{"messages":[{"role":"user","content":"Compute the 20th Fibonacci number (F(1)=1,F(2)=1)."}],"temperature":0.6,"top_p":0.95,"max_tokens":3000}'
# the geometry check that caught the wrong model
curl -s "https://huggingface.co/Qwen/Qwen3.5-4B/raw/main/config.json"
# the kvarn3 measurement
#   launch @32k and @262k with only -c varying; diff the nvidia-smi totals
# the CPU-only build
cmake -B build-cpu -DCMAKE_BUILD_TYPE=Release -DGGML_CUDA=OFF -DGGML_NATIVE=ON -DGGML_OPENMP=ON \
  -DLLAMA_BUILD_WEBUI=OFF -DLLAMA_CURL=OFF -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF
cmake --build build-cpu --target llama-server -j 32
ldd build-cpu/bin/llama-server | grep -cE 'cudart|cublas|ggml-cuda'   # → 0
# the ownership check that killed the "orphan" claim
cat /proc/<pid>/cgroup
systemctl cat llama-embedding.service
```
