# TASK QUEUE (2026-09-17)

## GATES
- Phase 1 gate: NOT CLEARED (awaiting operator GO + hydra dispatch)
- Phase 2 gate: blocked by Phase 1
- Phase 3 gate: blocked by Phase 2
- Ship gate: all 10 success criteria

## ACTIVE TASKS
| Task | Owner | Done-when | Dependencies |
|---|---|---|---|
| Dispatch Phase 1 (W1+W2+W3) | operator GO | 3 hydra workers dispatched | operator says "dispatch Phase 1" |
| W1: pi harness + Decider | hydra worker | Decider serves /v1/systemone, 17 questions return | Phase 1 dispatch |
| W2: Limite + gates | hydra worker | Golden RRRs ±0.02, 15 gates with named tokens | Phase 1 dispatch |
| W3: State constructor | hydra worker | Golden week bars → Decider state text | Phase 1 dispatch |
| Cross-link pass (graph) | operator or agent | 716 nodes / >100 edges | none |
| Anchor pass (17 rulings) | operator confirms | 17 UNANCHORED → anchored | grep + operator |
| OPEN-003 fix verification | agent | In-app OMP session spawns | host restart after hub kill |

## COMPLETED (with evidence)
- Knowledge graph overhaul: 583 mechanism cards, 716 nodes, 0 diagnostics (engine read)
- V6 architecture blueprinted: 5 documents, 2,557 lines total (on disk)
- E3 architecture extracted: 977 lines (e3-wiring 270 + e3-mdve 637 + macro composition)
- MPSE/Limite fusion designed: 398 lines (6 queries, 7 gates, 10 AT predicates, 5 unlocks)
- Decider-2B vs Kev audit: operator confirmed Decider (0.755 vs 0.620 OOD, ECE 0.037 vs 0.089)
- V6 build package: 374 lines, 10 specs, 3 phases (on disk)
- V5 canon verified: 15/15 golden entries at ≤3p (diag-lmv-golden-fx at HEAD 8f4ac74)
- Frozen pair verified: both SHAs MATCH at HEAD (2026-09-16)
- arsumbris KG deployed: engine + host + kernel + kgm (all operational)
- Thread system: plutus master + knowledge-graph micro + arsumbris + system-debugging
- Operator manual: OPERATOR_MANUAL.md in-graph (with v2+v3 addenda)
- Interactive graph map: Knowledge_Graph_Map_v2.md (7,795 lines, hyperlinked)

## BACKLOG (prioritized)
1. Phase 1 dispatch → Phase 2 → Phase 3 → cutover (the V6 build)
2. Cross-link pass (add [[links]] between mechanism cards — fastest value-add)
3. Anchor pass (17 flagged rulings — operator 30-minute confirmation pass)
4. graph.db archive decision (126MB legacy in the corpus)
5. OPEN-003: in-app OMP session (host-owns-kernel fix)
6. OPEN-002: omp pipewire rebuild decision
7. Session-start inject (au-mcp — the last automation step)
8. 5.3.3 prompt rebuild (feed E3 + V6 blueprints to the prompt agent)

## BLOCKED
| Item | Blocker | Unblock path |
|---|---|---|
| Phase 1 dispatch | Operator GO needed | Operator says "dispatch Phase 1" |
| Phase 2 | Phase 1 gate | Phase 1 workers complete + gate clears |
| Phase 3 | Phase 2 gate | Phase 2 workers complete + gate clears |
| Fine-tune Decider | Phase 1 must prove prompt-engineered baseline | W1 completes + golden week tested |

---

# TASK QUEUE — APPENDED 2026-09-24 (model server layer)

## ACTIVE — MODEL SERVER LAYER

| Task | Owner | Done-when | Dependencies |
|---|---|---|---|
| **Execute the embed merge** | agent | both `:18082` and `:8001` serve 768-dim from the CPU-only binary; OpenViking `:1933` recall confirmed | none — **the layer is DOWN right now** |
| **Harden the 3 model servers** | agent | each has a unit with `Restart=always` + `OOMScoreAdjust=-1000` + memory floors/caps; smoke passes on REAL completions; `/proc/<pid>/root` bindings verified post-restart | none |
| **Resolve D-014** | operator | a ruling: JevK5 supersedes Decider-2B / serves a different layer / is a stopgap | operator decision |
| **DeepSeek two-point kvarn3 measurement** | agent | a measured b/v on `:4172` from a 16k-vs-131k pair | none |
| **Wire deterministic engine + Jev gate on the math path** | agent | the model emits the expression, the engine computes, the gate refuses any mismatch | engine design |
| **Fresh-operator drill** | agent (zero-context) | a cold agent completes §3→§5 of the manual with ZERO questions | the manual (written) |
| **Build the minimal CPU embed unit(s)** | agent | `-c 2048`, `--embeddings --pooling mean`, `-np 1`, `--cache-ram 0` unless latency proves otherwise | the merge |

## COMPLETED — 2026-09-24 (with evidence)
- Three model servers live and measured: `:8008` 5,136 · `:4171` 4,368 · `:4172` 2,248 MiB (nvidia-smi)
- Math model selected from card evidence and deployed (DeepSeek-R1-Distill-Qwen-1.5B-Q6_K)
- DeepSeek correctness proven: F(20) → `\boxed{6765}` (live completion, finish `stop`)
- kvarn3 KV rate measured: 3.625 b/v (controlled two-point, 3150 → 4774 MiB)
- Wrong model generation caught and deleted (Qwen3-4B → Qwen3.5-4B; see RUNNING_DEBUG_LOG)
- CPU-only embed binary built and proven at 0 VRAM (6.2 MiB, 0 CUDA linkage)
- Embed duplication audited: 1,142 MiB VRAM for CPU work; merge decided (D-012)
- Runbook + operator manual written and placed in the shared workspace (D-013)
- The 2 missing canon logs created (RUNNING_BUILD_LOG, RUNNING_DEBUG_LOG)
- Canon updated: CURRENT_STATE, COMPACTION_SURVIVAL, POST_COMPACTION_PROMPT, DECISION_CHAIN (D-008..D-014), EVIDENCE_STATE, CHANGELOG

## BACKLOG (re-prioritized with the model layer first)
1. **Embed merge execution** (the layer is down — highest urgency)
2. **Model server hardening** (they are unprotected and first-killed)
3. **D-014 ruling** (the canon misleads until resolved)
4. Phase 1 dispatch → Phase 2 → Phase 3 → cutover (the V6 build)
5. Cross-link pass (add [[links]] between mechanism cards — fastest value-add)
6. Anchor pass (17 flagged rulings — operator 30-minute confirmation pass)
7. graph.db archive decision (126MB legacy in the corpus)
8. OPEN-003: in-app OMP session (host-owns-kernel fix)
9. OPEN-002: omp pipewire rebuild decision
10. Session-start inject (au-mcp — the last automation step)
11. 5.3.3 prompt rebuild (feed E3 + V6 blueprints to the prompt agent)

## BLOCKED
| Item | Blocker | Unblock path |
|---|---|---|
| D-014 resolution | Operator ruling needed | Operator states the JevK5/Decider relationship |
| Phase 1 dispatch | Operator GO needed | Operator says "dispatch Phase 1" |
| Phase 2 | Phase 1 gate | Phase 1 workers complete + gate clears |
| Phase 3 | Phase 2 gate | Phase 2 workers complete + gate clears |
| Fine-tune Decider | Phase 1 must prove prompt-engineered baseline | W1 completes + golden week tested |

---

# TASK QUEUE — THE GATE DEFINITIONS + ACCEPTANCE CRITERIA

## THE GATES (what must be true to advance)

| Gate | Criteria | Status |
|---|---|---|
| **M0 — Embed merge** | both ports serve 768-dim; `:1933` healthy; embed VRAM gone | **OPEN — layer is DOWN** |
| **M1 — Hardening** | each server has a unit; `Restart=always`; `OOMScoreAdjust=-1000`; real-completion smoke passes post-restart | OPEN |
| **M2 — D-014** | an operator ruling recorded; D-003 annotated | **BLOCKED — needs operator** |
| **M3 — Math integrity** | deterministic engine + Jev gate wired; adversarial battery proves wrong output is REFUSED | OPEN |
| **Phase 1** | W1+W2+W3 dispatched and their gates clear | BLOCKED — operator GO + D-014 |
| **Phase 2** | Phase 1 complete | blocked by Phase 1 |
| **Phase 3** | Phase 2 complete | blocked by Phase 2 |
| **Ship** | all 10 V6 success criteria | blocked |

## THE ACCEPTANCE CRITERIA IN DETAIL

### M0 — EMBED MERGE
- `curl -s http://127.0.0.1:18082/v1/models` returns the nomic model id
- `curl -s http://127.0.0.1:8001/v1/models` returns the nomic model id
- `curl -s http://127.0.0.1:<port>/v1/embeddings -d '{"input":"x"}'` → `dims 768` on BOTH
- `curl -s http://localhost:1933/health` → `"healthy":true`
- `nvidia-smi --query-compute-apps` no longer shows the two embed processes
- both unit files present and enabled; neither deleted
- the CPU-only binary's sha256 unchanged: `b41d941c91fd04fff605b29c36292b1133793753a4bfbb25478c92967837782a`

### M1 — HARDENING (per server)
- `systemctl show <unit> -p Restart` → `always`
- `systemctl show <unit> -p OOMScoreAdjust` → `-1000`
- `systemctl show <unit> -p DropInPaths` non-empty
- `cat /proc/<pid>/oom_score_adj` → `-1000` on the LIVE process (not just the unit file)
- `/proc/<pid>/root/<blocked-path>` fails; `/proc/<pid>/root/<needed-path>` succeeds
- **smoke = a real `/v1/chat/completions` round-trip**, not `/health`
- a ledger row per unit with the operator's words in the context file

### M3 — MATH INTEGRITY
- layer 2: a deterministic engine computes the emitted expression (integer arithmetic for
  Fibonacci; `Decimal`/`mpmath` for probabilistic)
- layer 3: a Jev gate refuses any mismatch between the model's stated result and the computed value
- adversarial battery: a deliberately wrong model output is REFUSED; a correct one is accepted
- the two-point kvarn3 measurement on `:4172` replaces the back-solved rate

## THE COMPLETED REGISTER (with the evidence each carries)

| Task | Evidence |
|---|---|
| Three model servers live | `curl` × 3 → `ok`; `nvidia-smi` 5,136 / 4,368 / 2,248 MiB |
| Math model selected + deployed | card audit (parent/successor); geometry; F(20) → 6765 |
| kvarn3 rate measured | two-point 3,150 → 4,774 MiB over 229,376 tok |
| Wrong model caught + deleted | geometry table; files removed; Qwen3.5 installed + verified |
| CPU-only binary | 6.2 MiB; `ldd` 0 CUDA; `:18099` 768-dim at 0 VRAM |
| Embed duplication audited | 1,142 MiB for CPU work; two units traced to two consumers |
| Runbook + manual written | 9,851 B + 14,045 B; SHAs recorded |
| 2 canon logs created | 5 + 7 timestamped entries |
| Canon updated | CURRENT_STATE, COMPACTION_SURVIVAL, POST_COMPACTION_PROMPT, DECISION_CHAIN (D-008..D-014), EVIDENCE_STATE, CHANGELOG, BUILD_STATE, TASK_QUEUE, NEXT_STEPS, CANON_MANIFEST |

## THE OWNERSHIP RULE

- **Operator-only:** doctrine, model selection, sizing floors, placement.
- **Agent (within the band):** which port, which quant inside the band, the order of work,
  the measurement method.
- **Zero-context agent:** the fresh-operator drill, the adversarial battery.

## THE BLOCKED REGISTER (with the exact unblock path)

| Item | Blocker | Unblock |
|---|---|---|
| D-014 | operator has not ruled | operator states the JevK5/Decider relationship |
| Phase 1 dispatch | operator GO | operator says "dispatch Phase 1" |
| Phase 2 | Phase 1 gate | Phase 1 workers complete |
| Phase 3 | Phase 2 gate | Phase 2 workers complete |
| Decider fine-tune | Phase 1 must prove the prompt-engineered baseline first | W1 completes + golden week tested |
| M1 hardening of `:8001`'s consumer | OpenViking's unit is SYSTEM scope | `sudo` (available — exit 0) |

## THE WORK ORDER (the recommended sequence, with the reason)

1. **M0 embed merge FIRST.** The layer is DOWN and every agent memory operation is degraded
   (OMP `v1/recall` fails `10001`; zero vectors stored). Nothing else is as urgent.
2. **M1 hardening SECOND.** Once the layer serves, protect it before it is depended on. A
   server at `oom_score_adj=200` with no restart policy is a silent failure waiting.
3. **M2 the D-014 ruling THIRD.** Before any V6 work, because W1/W2 target models that may
   be wrong in the canon. Building on an unresolved model question compounds it.
4. **M3 math integrity FOURTH.** The math model is proven correct; the *guarantee* the
   operator asked for ("CANNOT hallucinate/derail/be wrong") needs the engine + gate.
5. **The V6 waves LAST** — they depend on 1–4 being settled.

## THE ANTI-PATTERNS IN THIS QUEUE

- **Do not start V6 Phase 1 before M2.** W1 targets the decision model; if D-014 resolves
  to "Decider is the V6 target", W1's spec is correct as written; if it resolves to "JevK5
  supersedes", W1's spec must change first.
- **Do not declare M0 done from `/health`.** The merge's acceptance is a 768-dim embedding
  on BOTH ports plus a healthy `:1933`. A listening socket is not a working service.
- **Do not hand-tune `oom_score_adj` per PID.** It resets on relaunch. The fix is the unit.
- **Do not delete either embed unit file.** Both consumers are live and legitimate.
- **Do not treat "the tests pass" as M3.** M3's bar is an adversarial battery that proves a
  deliberately wrong answer is REFUSED.
