# PLUTUS V6 — BUILD PACKAGE SYNTHESIS (FULL-CONTEXT, VERIFIED)

**Artifact class:** ARCHITECTURE / CONTEXT PACKAGE (the V6 full-context synthesis)
**Generated:** 2026-09-28 · **Method:** the 18-desk context-extraction wave (6 V6 desks + 6 supplement) + primary first-hand reads
**Spec home:** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/V6/` (13 DPL1 docs, 794,506 B) + `MASTER_CONTEXT/reports/`
**Build home:** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/V6_BUILD/` (7 worktrees, its own git repo)
**Quote convention:** profanity-bearing verbatim quotes are elided as `[…]` with the source anchor preserved.

---

## §0 THE STATE BANNER (verified by tool result THIS session)

| Fact | Measured value | Source |
|---|---|---|
| V6 spec set | `V6/*.md` — 14 files, 7,897 lines, 794,506 B | `wc -lc V6/*.md` |
| The 12 component DPL1s + 2 canon | 00_CANON_CONTEXT (149L) · 00_MASTER_V6_OVERHAUL (266L) · 01 AGENT (816L) · 02 SHELL (767L) · 03 ENGINE (631L) · 04 BRAIN (715L) · 05 JOURNAL (477L) · 06 REVIEW (575L) · 07 PIPELINE (452L) · 08 INTELLIGENCE (595L) · 09 GRAPHS (724L) · 10 RSI (544L) · 11 FEED (692L) · 12 RAILS (494L) | `wc -lc V6/*.md` |
| V6_BUILD git HEAD | **`3bc6da5`** (newer than the CURRENT_STATE's `ff5eb6a`) | `git log --oneline -5` |
| V6_BUILD uncommitted | `integration/circuit.py`, `ship_docs/FAILURE_LOG.md`, `tests/*.py` (5 files modified) | `git status --short` |
| The 7 worktrees | `.wt/{wa-decider, wb-limite, wc-exec, wd-tui, we-train, wf-det, wg-integ}` | `ls -la .wt/` |
| The container artifact | `.trident/container-test-results.json` — sha256 `71016e6a2813bebd…`, 11,135 B, **13 scenarios, overallVerdict PASS** (5 adversarial + 8 happy) | BUILD_STATE + the desk read |
| The two engines | Decider `Mapika/decider-2b` @127.0.0.1:8008 · Limite `paradigma-inc/limite-1b-violetto` @127.0.0.1:8100 | BUILD_REPORT |
| The GPU | RTX 4080 Laptop 12,282 MiB total; Decider ~4,014 · Limite ~4,060 · llama-embed ×2 1,144 · free ~1,000 | BUILD_STATE |
| The corpus | `corpus/records.jsonl` 1,267 records, zero provenance violations | BUILD_REPORT |
| The 14-condition board | **13 of 14 MET; #11 (audit GATE: PASS) NOT MET** (0 critical, 8-11 high) | BUILD_STATE (2026-09-24) |

**THE DRIFT LEDGER (recorded):**
1. **HEAD DRIFT:** CURRENT_STATE pins `ff5eb6a`; the live HEAD is `3bc6da5` (the operator-caught "decider output discarded" fix `d4fb0df` is between them).
2. **MODEL DRIFT:** the GOAL_PIN named **Decider-0.6B**; the PLANNING_SUITE (2026-09-17) names **Decider-2B v10** (replaces Kev 0.6B); the live engine is `Mapika/decider-2b`. **The 2B is current.**
3. **MODEL-SEAT DRIFT:** the V6 E3/MPSE desks name **Kev-0.6B-ONNX** (the fusion planning) while the live build uses Decider-2b + Limite. The Kev→Limite→Decider lineage is a documented sequence, not a contradiction.
4. **SPEC-vs-BUILD GAP:** the 13 DPL1s are **Status PLANNING** (2026-09-15) and describe a DIFFERENT (larger) system than `V6_BUILD` (the pi-TUI circuit). The DPL1s (01-12) = the **V6 ENTERPRISE blueprint** (agent + shell + engine + brain + journal + review + pipeline + intelligence + graphs + RSI + feed + rails); `V6_BUILD` = the **pi-TUI embedded circuit** actually built. **These are two V6 surfaces; the operator's "build package" spans both.**

---

## §1 THE MISSION — WHAT V6 IS

**THE GOAL (verbatim, `PLUTUS_V6_GOAL_PIN.md` §GOAL):**
> "Build the complete Plutus V6 trading agent — an embedded circuit (Decider-0.6B + Limite-1B + TensorTrade + gates + angels on a pi TUI harness with MiMoCode memory ported in, NOT headless, zero coding) that reproduces ≥14/15 golden-week entries at ≤3p precision with <500ms decision latency and every probability visible in the TUI — running end-to-end on the RTX 4080 Laptop 12GB."

**THE CLASSIFICATION (verbatim, `PLANNING_SUITE_Plutus_V6_Build_Package.md` §0):**
> "ARCHITECTURAL. Replace the MiMoCode-based Plutus runtime with a Decider-2B + Limite 1B + TensorTrade pipeline on a pi TUI harness. The primary Plutus coding agent is ELIMINATED. NOT headless. The 649 doctrine cards become Decider's fine-tune corpus."

**THE REDUCED CORE (verbatim, §2):**
> "ONE MECHANISM: a judgment loop on a pi TUI — market state enters, Decider-2B produces calibrated probability distributions over 17 typed questions (4 calls), Limite computes 6 numeric queries with dual-compute verification, 8+7 deterministic gates consume both outputs, TensorTrade validates, a trade decision exits with every probability inspectable."

**THE DIFFERENTIAL (§1):**
| Existing | Does | Does NOT |
|---|---|---|
| MiMoCode/OMP | Coding agents, TTSR, sessions, subagent dispatch | Make trading decisions. Be fast. Be deterministic. |
| TS E1/E2/E3 pipeline | Zone detection, shape chains, trade mapping in code | Learn. Be portable. Run without Bun. |
| Decider-2B v10 | State + typed questions → calibrated probabilities. Single forward pass. 4ms CUDA graphs. RL-trained beliefs. 93% browser. 32k context. Vision variant. | Generate code. Compute math. Produce free text. |
| Limite 1B | Competition-level math (74.25% BeyondAIME). 131k context. vLLM. | Make decisions. Classify. Score confidence. |
| TensorTrade | OMS + commission modeling + portfolio + walk-forward. | Make decisions. Compute geometry. Store doctrine. |
| pi harness | Agent loop, tool calling, TUI, state management. 108k★. Supply-chain hardened. | Coding (stripped). Subagent dispatch. |
| arsumbris KG | 649 doctrine cards, live-indexed, queryable. | Execute trades. Runtime queries. |

**THE ROLE SPLIT (the module contract):** **Kev/Decider = WHAT** (the typed decision) · **Limite = HOW-MUCH** (the arithmetic) ·
**GATE = accept/reject** (never reversed) · **E2 DESIGNATES** (zone/side/day/session/conf/shape) → **E3 OBEYS** (price engineering only) ·
**S-corpus cards-before-code** (Iron Law 1).

---

## §2 THE TWO V6 SURFACES (never conflate them)

| Surface | What | Where | Status |
|---|---|---|---|
| **THE V6 ENTERPRISE SPEC SET** | 13 DPL1 build specs (00-12): agent, shell, trading-engine, brain, journal, review, pipeline, shell-intelligence, journal-graphs, RSI loops, data-feed, production-rails | `V6/*.md` (794KB) | **Status PLANNING** (2026-09-15) — nothing built; each defines the artifacts its build must emit |
| **THE V6 INTELLIGENCE BLUEPRINTS** | E3 (977L) · MPSE/Limite (398L) · Kev/Limite fusion (386L) · the master blueprint (524L) · initial (284L) · the planning suite (374L) | `MASTER_CONTEXT/reports/` | DESIGN + plan |
| **THE V6_BUILD CIRCUIT** | market feed → state → Decider → Limite → 8 gates → TensorTrade OMS → report + TUI | `V6_BUILD/` | **BUILT** — 7 worktrees, container PASS (13/13) |

**THE SPEC-vs-BUILD MAP:** the DPL1s describe the enterprise surface (12 components); `V6_BUILD` implements the *circuit* subset
(Decider + Limite + gates + MPSE + OMS + report + TUI + determinism + memory + corpus). The DPL1 components 05/06/09/10 (journal/review/graphs/RSI)
and 07/08/11/12 (pipeline/intelligence/feed/rails) are the **next wave** surface — spec'd, not built in V6_BUILD.

---

## §3 THE ARCHITECTURE AS BUILT (the V6_BUILD pipeline)

```
  bars fixtures → state_constructor (anchor filter, NO_BARS / FUTURE_BAR_LEAK)
      → decider/client  POST /v1/systemone  Mapika/decider-2b :8008   (17 typed questions, calibration layer)
      → limite/client   limite-1b-violetto :8100                        (TEMP 0.0, L1-L6 shadows, dual_compute eps 0.02)
      → gates.py (9 fail-closed pure gates, ZERO model calls) + mpse predicates (10 AT, witness panel)
      → oms (TensorTrade)  → report (8 sections)  → tui/pane (76-col) + coding_surface scanner
  cross-cutting: determinism · memory (append-only, one-writer) · circuit.py · pi-harness (7 plutus_* tools, --no-builtin-tools)
```
**OWNERSHIP (7 workers, disjoint):** WA decider/harness/state · WB limite/gates/mpse · WC oms/report · WD tui ·
WE corpus/finetune (**finetune EMPTY**) · WF determinism/memory · WG integration.

**THE TWO MODEL ENGINES (both REAL, both measured):**
| Engine | Identity | Endpoint | Verified |
|---|---|---|---|
| **Decider** | `Mapika/decider-2b` (published, base Qwen3.5-2B-Base, 3.5GB bf16) | `uvicorn decider.serve:app` 127.0.0.1:8008 | `/health` → `{"ok":true,"model":"Mapika/decider-2b","device":"cuda"}`; 17/17 questions non-uniform |
| **Limite** | `paradigma-inc/limite-1b-violetto` (1B math, 131k ctx, 74.25% BeyondAIME) | vLLM 0.26.0 + the official `limite-vllm` plugin, port 8100 | live `17+25=42`, byte-identical ×2 at temp=0 |

**THE 8 DETERMINISTIC GATES (pure Python if/else — NO model appears in any path through `gates/gates.py`):**
`G-RRR` (floor 2.5) · `G-SESSION` (London 02:00-05:00 ET) · `G-SL` (≤55p envelope) · `G-CONF` (≥0.50) ·
`G-CASCADE` (E2 valid) · `G-CHAIN` (shape integrity) · `G-DEDUP` (60m window) · `G-DUAL` (`|Limite−code| ≤ 0.02`).
*(The DPL1 03 spec names a 9-gate set: G-GEOMETRY · G-RRR · G-SESSION · G-SL · G-CONF · G-CASCADE · G-CHAIN · G-DEDUP · G-DUAL — the 9th, G-GEOMETRY, reads direction + price geometry, "which NO gate read before the audit".)*

**THE PERTURBATIONS (the measured env facts):** flashinfer 0.6.14's JIT sampling kernel fails against this CUDA/cub →
`VLLM_USE_FLASHINFER_SAMPLER=0`; Limite needs `VLLM_PLUGINS=limite` or it cannot resolve `LimiteForCausalLM`; the Decider server is a long-running process started outside the build.

**THE VENVS:** `/home/leviathan/venvs/plutus-v6` (py 3.12.3, torch 2.14.0+cu130 — the circuit's tests + TensorTrade 1.0.4) ·
`V6_BUILD/vendor/limite-violetto/.venv` (py 3.12, torch 2.11.0+cu130 — vLLM 0.26.0 + the Limite plugin, 7.5GB) ·
`JevManager/vendor/decider/.venv` (the published Decider, uvicorn :8008).

---

## §4 THE 15 TARGET CRITERIA + THE 14-CONDITION BOARD

**THE 15 TARGETS (verbatim, `V6_BUILD/.trident/worker-plan.md` §T):**
| T-n | Criterion | Verification |
|---|---|---|
| T-1 | ≥14/15 golden-week entries at ≤3p precision | `test_golden_week_e2e` exit 0 |
| T-2 | every probability visible in the TUI | `test_tui_renders_probabilities` |
| T-3 | <500ms decision latency | `test_decision_latency` |
| T-4 | 6 Tier-A RRRs within ±0.02 | `test_rrr_golden_reproduction` |
| T-5 | profitable at 0.1% commission | `test_commission_0_1pct` (net_pips > 0) |
| T-6 | SHA-identical determinism | `test_determinism_sha_match` |
| T-7 | zero coding capability in the agent | `test_zero_coding_surface` (bash absent) |
| T-8 | Decider returns non-trivial distributions | `test_pass_e1_questions` |
| T-9 | ECE < 0.05 calibration | `test_decider_calibration_ece` |
| T-10 | all 38 forensic trades correctly classified | `test_forensic_trade_classification` |
| T-11 | Limite runs temperature=0 | `test_limite_serves_temp0` |
| T-12 | dual-compute catches divergence | `test_dual_compute_catches_divergence` |
| T-13 | 10 MPSE AT predicates executable | `test_mpse_predicate_at03` |
| T-14 | audit gate GATE: PASS | `qwen-code-audit` → `GATE: PASS (0 critical/high)` |
| T-15 | all 6 ship docs + 11 canon docs current | floor checks + cross-consistency SHA |

**THE 14-CONDITION STOP BOARD (2026-09-24 — 13 of 14 MET):**
| # | Condition | Verdict |
|---|---|---|
| 1 | golden week ≥14/15 ≤3p | **MET** (15/15, max_delta 0.000p) |
| 2 | 38 forensic classified | MET |
| 3 | profitable at 0.1% unseen week | MET |
| 4 | latency <500ms (model IN the loop) | **MET — 402ms warm** (`test_decider_live_pipeline`); was BLOCKED-VRAM, then MET |
| 5 | zero coding agent | MET |
| 6 | TUI shows every probability/gate | MET |
| 7 | determinism SHA-identical | MET |
| 8 | golden RRR ±0.02 | MET (6/6) |
| 9 | mutant tests fire | MET (AT-03 side-inversion) |
| 10 | ECE < 0.05 | **MET — 0.03238** (was 0.2139 in the earlier report) |
| 11 | **audit gate GATE: PASS** | **NOT MET** (0 critical, 8-11 high) |
| 12 | checkpoint sealed | MET (10) |
| 13 | 6 ship docs | MET |
| 14 | 11 canon docs | MET |
**13 of 14 MET. #11 is NOT MET.**

**THE MEASURED RESULTS (verbatim, BUILD_REPORT):**
| Claim | Measured |
|---|---|
| 6 Tier-A canon RRRs ±0.02 | 6/6 (max delta 0.0043) |
| Tier-A accepted by all 8 gates | 6/6 |
| 15 FX canon entries ≤3p | 15/15 (max delta 0.000p) |
| latency < 500ms | mean 0.058ms offline (8639× headroom) / 402ms warm with the model in the loop |
| golden week profitable at 0.1% | +183.3 pips (from +184.5 gross) |
| determinism SHA-identical | True (digest excludes latency fields) |
| zero coding surface | 0 violations across 8 agent roots |
| corpus records ≥700 | 1,267 (621 real cards × 2 signals + 18 golden + 7 forensic) |
| 17/17 non-uniform distributions | 17/17, zero uniform |
| container suite | 13/13 (5 adversarial + 8 happy) |

---

## §5 THE COMPONENTS 01-12 (the V6 DPL1 set — Status PLANNING, 2026-09-15)

### 5.1 V6-01 PLUTUS AGENT (816L)
The V6 agent component spec. *(A first desktop attempt returned a placeholder; the retry covers 01+02+00_CANON.)*

### 5.2 V6-02 PLUTUS SHELL (767L)
The shell component spec — the TUI pane host. **T-2:** every probability visible in the TUI. **T-7:** zero coding capability (bash absent).

### 5.3 V6-03 TRADING ENGINE (631L) — the JESL cast-envelope trade-verb surface
**M1 cli-dispatch** (Bun `plutus` binary: trade/pipeline/tv/mt5/gates, `--json`, exit 0/1/2) → **M5 review-bind**
(L3 triplet `setup_hash`+`receipt_id`+`fresh_until`, opaque, the V6-06 registry) → **M3 precast-gates** (JESL gate+math-eval+detect,
`eq`-only else `GATE-FAILED`) → **M4 rails-guard** (allowlist/hours/daily-loss/idempotency/dup/kill) → **M9 paragon-ring**
(`allow→work→judge→claim`, 4-family derail detector, 2-key bypass hatch) → **M6 mt5-exec** (SOLE ZMQ transport
`ipc:///tmp/plutus-mt5.sock`) → **M7 journal-sink** (`self=sha256(canonicalSerialize(base)+"|jesl|"+prev)`, 1 row per verb
incl. refusals, returns `journal_self`) → **M8 post-verify** (broker re-read positions/account, `E-ENG-UNVERIFIED` on mismatch) →
**M9 judge/claim** → **M1 stdout**; **M10 kill-chain** (latched, flatten-spared); **M11 tui-render** (display only).

### 5.4 V6-04 PLUTUS BRAIN (715L) — the interrupt machine
**BR-1 core anchor** (Rust v0.6.9 lineage, NEW home `~/.plutus-brain` PROPOSED, :4220 PROPOSED, the Jarvis home never written) →
**BR-3 bus** (own `bus.db`, 72h TTL/GC-50/caps-50, `chart.events`/`trade.events`/`data.events`, L6 event-first, T7 source_version required) →
**BR-4 PFC-T1..T5** (shadow/grounding/refinement/macro/quiet-breach, thresholds PROPOSED) → **BR-7 governor** (cooldowns/caps
3-kick+10-steer PROPOSED, suppression rows, storm auto-mute) → **BR-9 preempt** (`user_active.json` TTL300s, kick→steer downgrade,
critical-T1 escape PROPOSED, kill-halt suppresses all) → **BR-5 actuators** (`orchestration send=kick`, `terminal.sendText=steer`,
channel-only; TOOL-RESULT receipts, L5 no-spawn, T2) → **BR-6 channels** (trades+alerts digests, Discord-lineage PROPOSED,
Telegram excluded) → **BR-8 receipts+audit** (`kick_receipts`/`suppressed`/`channel_posts`, `/api/audit`); **BR-2 hands**
(`plutus/plutus-reasoning/plutus-agent`, 96L/206L shape); **BR-10 watch** (row-on-death, hand-off never terminate). Flows F1 chart/F2 trade/F3 data/F4 self/F5 presence.

### 5.5 V6-05 TRADE JOURNAL (477L) — the primary DB
**J1** store SQLite/Drizzle THE record · **J2** journal-sink ONLY live writer · **J3** schema (intents/fills/outcomes/receipts/exceptions/review-refs) ·
**J4** the 6th JOURNAL panel + DATA-MACRO page hosted by 02 · **J5** 14-format importers (MT4/5 first, source=import) ·
**J6** reconcile zero-diff + exceptions · **J7** same-second edge emitter to 09 · **J8** RSI read API · **J9** FIFO/LIFO/WAVG + Edge Score v2 ·
**J10** verifyChain/covers. Contracts **C1 single-writer · C2 chained receipts per domain · C3 1:1:1 linkage · C4 same-second edges p99≤900ms PROPOSED · C5/L8 read-only downstream.**

### 5.6 V6-06 TRADE REVIEW (575L) — the second computer
**M1** cli exits 0/1/2 · **M2** factory seat TOKEN `jt-job-hex8` wipe · **M3** ≥8 TTE universals (R1) · **M4** fresh scope manifest+TTL (R2) ·
**M5** corpus-match (the 20,322-row replica, 4 class tokens, R4) · **M6** bias-guard (R3) · **M7** verdict `PASS|FAIL|CAUTION`+precedence ·
**M8** verify-fence exit-0 accept · **M9** receipt store + journal sink · **M10** 3-doc doctrine bundle. **T6 zero-self-apply**; T1 engine gate VERIFY_OK; T3 ephemeral scope; L3 triplet-or-no-action.

### 5.7 V6-07 ANALYSIS PIPELINE (452L) — 7 GM cards
A build on a GM card shell scripting runtime + a custom SuperGoal engine (23 files, 12,325 LOC @`bb2c5b79`, 259/259 `goal:{engine:super}`) +
a **plutus-skeptic panel** (wired like the trident bug-hunter+auditor with trading intelligence + failed-trade root causes) — pressure-testing
each phase, forcing micro-loops. **N=3 2/3 PROPOSED**; OD-3 pause operator-only; OD-4 receipt TTL 30m+new-bars. **Gate: `gm-compile` 7/7 + S0-all-cmd.**

### 5.8 V6-08 SHELL INTELLIGENCE (595L) — the know-verbs
4 know-verbs + a fabric + a probe; versioned know-answers; **pinned probe-sealed envelopes or named refusals**; a 89+J fabric;
`:9420`-only; T7 probe guards, 4-class, 0-verdict. OD-2 refuse n<10; OD-4 brief 60s/V6-06. **16 items SC-1..12, 6 angles, ST-01..08.**

### 5.9 V6-09 JOURNAL GRAPHS (724L) — the graph projection
**writer** (`projectSameSecond` atomic) + **3 projectors** (context/data/code) + **edge-chain** `sha256 |graph| domain` +
**store** (`graphs.db`, OD-1 default join `tradeId`+`committedSeq`) + **5 verbs** (`contextAt`/`similars`/`edgeStat`/`ruleLineage`/`failureCluster`,
all Sourced with `{graph,version,batchSelf}`) + **guard** (budget/dedup/quarantine/small-n). **09 atomic-triple-or-nothing-visible.**

### 5.10 V6-10 RSI LOOPS (544L) — the self-improvement
**R1** scheduler single-flight · **R2-R6** miners (rootcause/baserate/lexicon-quarantine/derail/ev-seed-pinned) · **R7** proposal store
(own SQLite, 6-state machine, fingerprint sha256) · **R8** battery-gate · **R9** promotion-gate (golden × determinism ×2 × frozen) ·
**R10** `|rsi|` receipts · **R11** t6-enforcer (fingerprints + SelfApplyProof). **10 proposals-only + separate promotion verb/gate/cadence.**

### 5.11 V6-11 DATA FEED LAYER (692L) — the frozen contract
`RawFeed` 12-matrix + the `PIP`/venues; **8 modules** + a firewall. **Laws:** frost honesty · zero-write venue · exact-gap ·
no-synthesis · censor census · provenance firewall · oracle fabrication-five · IL-8. **NINE_PILLAR_404 — do NOT fabricate.**
Seeds: Vibe/Air 4,573/7,817; dropped: databento + dukascopy PROPOSED alternates quarantined; COT/GEX E1-only.
**BEHAVIORAL acceptance 5/5 4/4 ×2 + frozen pair, NEVER 1H→4H.** **18 items S-1..12 / F-1..6 / ST-1..7 / D.9.**

### 5.12 V6-12 PRODUCTION RAILS (494L) — the substrate survival
4-service supervision: a supervisor store (7 tables) + a prober (tick 5s) + rails (7) + kill (row+sentinel) + recorder + backup + drill +
secrets + ramp + ledger + CLI ops (closed 30 codes). **Death ≤1 tick, restart-armed, 7 denies, recorder, drilled-backup, names-secrets,
gated-ramp, chained-ledger, portmap.** `flatten` = deny-new + close-all; `micro` = 0.1× min; vault pre-live.
**Ports: KEEP 6768/9420/2222/4200 · DELETE 9430/9431/3690/9333.** **16 items R-01..12 / A1..A6 / ST-01..06.**

---

## §6 THE BLUEPRINTS (E3 + MPSE/Limite + Kev-fusion)

### 6.1 PLUTUS E3 MASTER BLUEPRINT v1 (977L, 107KB)
The v4.5.3 trade-engine extraction → V6 migration. The composition (E1 pillar pre-flight + IP merge + prior-week pre-flight → E2 core →
E3 cascade), the cascade (INVERSE/KEPT modes), the MDVE lane (`ob-engine` zone factory + `setup-gen` 5 stages + Law-27 chaining + dedup/caps),
the constant ledger, the V6 implications. **E2 DESIGNATES, E3 OBEYS.**

### 6.2 PLUTUS MPSE × LIMITE MASTER BLUEPRINT v1 (398L, 49KB)
The deterministic-math predicate layer. **Fusion thesis:** Limite computes, code verifies. The 6 math queries **L1 width · L2 SL distance ·
L3 RRR · L4 fib levels · L5 commission · L6 TP distance** — each a D13-checked JSON envelope `{query_id, rule_id, quote, anchor:"doc.md:line", inputs:{E,SL,TP,pip}, task:"arithmetic-only", forbidden[]}` → steps + a terminal `ANSWER` line. **Dual-compute:**
a Python shadow recomputes each query; `|Limite − code| ≤ eps` (0.01 ratio / 0.1p width) else `LIMITE_CODE_DIVERGENCE` → FAIL. Temp=0 mandatory.

### 6.3 PLANNING SUITE — KEV/LIMITE FUSION (386L, 24KB)
The architectural intent + differential + laws + phases + the Kev question mapping (A.1-A.5) + the runtime topology (B.1-B.4).
**The fusion = Kev-0.6B-ONNX decides / Limite-1B computes / code gates.** *(Superseded in the live build by Decider-2b for the decide role — the same architectural shape, a newer model.)*

---

## §7 THE KEV/LIMITE/DECIDER LINEAGE + THE V6 TARGET LOOP

**THE TARGET LOOP (the v6-audit desk's §architecture, ~300-line Python, ~1.05s GPU):**
```
  Market Feed (W-01..W-05 tools, TTLs, honest [NO DATA])
    → State Constructor  zone_to_state_text ≤8192 tok  (H-04/H-06/T-01/Z-02; to_kev_zone verbatim + IP-rejection assert)
    → Kev Call1 E1 5Q   (zone/OBCV/mitigation/pressure/fortress) → gate
    → Kev Call2 E2 4Q   (shape/day-element/cascade-valid/freshness; Q3 INVERSE vs KEPT modes REPLACE translate+divergence) → gate (invalid→HALT)
    → Kev Call3 E3 5Q   (direction/quality-grade Score F/C/B/A/A+/session-valid/SL-envelope/shield)
    → Limite manager    L1 width / L2 SL / L6 TP_dist / L3 RRR / L4 fib / L5 commission
                        (temp 0, D13 quote+anchor, parse→quantize→dual-compute |Δ|≤0.01/0.1p, 1 retry → CONTRADICTED)
    → Gate layer        G1 rrr≥2.5 / G2 session / G3 SL∈[4,36]+0.5×ATR / G4 side / G5 cascade / G6 containment / G7 totality /
                        G8 no-clock / G9 anchor-member / G-DEDUP / G-CHAIN / G-CONF / G-SESSION / G-SLENV / G-FRESH / G-ZONE-HYGIENE / G-PROVENANCE
    → TradeDecision{dir,E,SL,TP,rrr,quality,conf,session,provenance{cardSetupId,cardZoneId,designationId,kevRunId,limiteRunIds,gateFp}}
    → TensorTrade OMS   (Exchange/Broker/Portfolio/commission 0/0.1/0.2% sensitivity/walk-forward/Sharpe/Sortino/drawdown, async)
    → report.py + eval/
```
**DETERMINISM:** `anchorMs` everywhere, no `Date.now`, single LAW7/STAGGER/tier tables, byte-identical `TradeDecision` log;
**chain-before-dedup ordering; ENTRY fixed during repair.** **DOCTRINE OFFLINE:** the 649 cards → an offline Kev fine-tune
(~700-1000 records, LoRA r16) + the Limite quote bank; **NEVER runtime queries.**

**THE CRITICAL OPERATOR-CAUGHT DEFECT (verbatim, `V6_BUILD` git log `d4fb0df`):**
> "THE DECIDER'S OUTPUT WAS DISCARDED ON EVERY CALL — found by the operator asking 'why are you not using decider'. The circuit called the published Decider (~430ms per decision) and threw the answer away: the Decider returns a NESTED answer (`{"type":"score","score":2.03,"legend":{...},"probabilities":{...}}`) while `grade_from_probs` expects a FLAT `{LEVEL: prob}` dict, so it raised `EMPTY_DISTRIBUTION` and the caller's confidence passed through. PROOF: caller=0.20 → 0.20 and caller=0.99 → 0.99 BEFORE; caller=0.20 → 0.65 and caller=0.99 → 0.65 AFTER (the MODEL's grade, caller-independent). **NO TEST CAUGHT IT:** `test_decider_live_pipeline` asserted the model ANSWERS but never that its grade CHANGES a verdict."

**THE 8 DEFECTS FOUND BY ADVERSARIAL PROBES (verbatim, BUILD_REPORT):** (1) `expected_level` 0-indexed → 2.73 vs the blueprint's 3.73 ·
(2) `G-SESSION` read `s[-5:]` = the UTC OFFSET suffix, so every EDT timestamp passed · (3) `G-SESSION` rejected the state constructor's
`LONDON 02:00` label · (4) pointer head weights stayed on CPU while hidden states were on CUDA · (5) the digest's volatile filter applied
only at depth ≥1 · (6) `circuit` hardcoded pip=0.0001 → DXY's 4p SL read as 400p · (7) empty feed raised bare `ValueError: max() iterable empty`
(fixed to `EmptyBars("NO_BARS")`) · (8) corpus dedup keyed on (source,quote) collapsed the intentional multi-signal records.

---

## §8 THE GATES + THE MPSE AT PREDICATES

**THE GATE LAYER (Task 2 — where the V6 gate machinery DOES NOT yet exist; the 15-AT predicate contract is the plan):**
- **The 8 live gates** (§3) — pure Python, fail-closed.
- **The MPSE AT-01..AT-10 predicates** (10, each pairing a Limite semantic verdict with a script mechanical check):
  the **trust equation `accept = oracle AND limite AND script` (3-way)** — no single point of trust.
  **AT-03 catches translation fidelity (the side-inversion); AT-06 catches wall-clock contamination; AT-07 catches determinism break (run twice, compare SHA).**

**THE MPSE-LIMITE FUSION JOINTS (v6-audit):** `G-LIM-01..04`, the gates table, AT-01..10, the unlocks U-1..U-5, the routing, per-spec S-1..S-7,
N-1..N-10, Kev K-01..K-07, the prompts, V-1..V-5, FM-1..FM-10, MW-0..MW-5. **Honest-absence ledger** present.

**THE TENSION (recorded):** the **RRR** — the golden Tier-A RRRs (4.25-5.84) vs the gate floor 2.5 vs the DPL1 §7 targets. The v6-audit desk names it as an open tension the L2 must pin.

---

## §9 THE V6 AUDIT — 40 ROUNDS (the honest FAIL)

**THE COMPLETE HIGH/CRITICAL SERIES (verbatim, `.trident/SCAN_ACCEPTANCE.md`):**
```
r9 0c/21h  r10 1c/13h  r11 2c/12h  r12 0c/13h  r13 0c/9h   r14 0c/11h
r15 1c/9h  r16 1c/8h   r17 0c/11h  r18 0c/10h  r19 0c/6h   r20 1c/11h
r21 0c/4h  r22 0c/7h   r23 0c/9h   r24 0c/10h  r25 0c/11h  r26 (root cause)
r27 BLOCKED  r28 1c/9h  r29 0c/4h  r30 0c/6h  r31 (r30 mediums)  r32 0c/3h
r33 0c/8h  r34 0c/4h   r35 0c/7h   r36 (the public bypass)  r37 0c/4h
r38 0c/6h  r39 0c/8h   r40 BLOCKED (OCR_RUN_DEGRADED)
```
**THE THREE MEASURED PROPERTIES:**
1. **The criticals are ZERO except when MY OWN FIXES introduce one.** 5 of 18 completed rounds produced a critical; EVERY one was a defect the agent created while fixing the prior round (r11, r15/16, r20, r28).
2. **The highs do NOT converge** — a band of 3-21 with no downward trend.
3. **The dominant source of findings is the agent's OWN INCOMPLETE FIXES**, not the code: r33 5/8 findings were incomplete r32 fixes; r35 4/7 were incomplete r34 fixes; r38 1 was an r37 over-correction; r39 1 was an r38 fix applied at ONE of TWO sites.

**THE FOUR INCOMPLETE-LANDING CLASSES:** (1) **Never applied** (a batch script that aborted at its first anchor miss — r24's five fixes; r40 found an r24 fix STILL unlanded) · (2) **Applied but inert** (a helper defined but never called; an attribute that exists nowhere; a dict built but never read; a list appended to but never read) · (3) **Changed at one site, not both** (the dual epsilon r34→35; the `in bars_by_tf` rule r38→39) · (4) **Over-corrected** (a section terminator that broke its own case; a single-vote rule that made four predicates unable to return).

**THE MECHANICAL GUARD (the durable output):** `tests/test_fix_effectiveness.py` — **30+ behavioural invariants, each of which FAILS if its fix is INERT.** A fix that does not TAKE EFFECT fails the battery.

**THE FINAL ACCEPTANCE (verbatim):** "0 CRITICAL: MET — across the last EIGHT consecutive completed rounds. 0 REGRESSION: MET — 30/30 host · 13/13 runtime · 16/16 container · STOP 4 at ~400ms with the model in the loop, green after EVERY change. THE HIGHS: OPERATOR-REVIEW DEBT. Real, none critical, cataloged. **CONDITION 11 (`GATE: PASS`): NOT MET and NOT reported as met.** The gate is FAIL (0 critical, 8 high) at its last completed run, and BLOCKED (OCR_RUN_DEGRADED) at the last attempt."

**WHAT THE 40 ROUNDS FOUND THAT NO TEST CAUGHT:** three real gate bypasses · a corpus supervising wrong labels · a CT runner that could not reproduce its own artifact · probes that tested nothing · a superseded model in the production path · a token guard undershooting 4.13× · a state rendered 4× the blueprint's spec · a public trust bypass · a fail-open negative distance · a LIMITE vote testing the wrong quantity.

**THE AUDIT-DEBT CATALOG (the 11 highs, for operator review):** **H1** `run_ct_suite.py:220` an empty passToken passes vacuously (one-line fix) · **H2** `mpse/predicates.py:60` fail-closed broken on a NON-MAPPING input (TypeError instead of INCONCLUSIVE) · **H3** `mpse/predicates.py:276` `c.get('direction')` before the try guard · **H4** `tui/coding_surface.py:397` `scan_text` claims the FULL lexicon but omits `WRITE_SUSPECT` · **H5** `determinism/determinism.py:62` `round(o,10)` collapses distinct decisions (a PINNED design trade — operator's call) · **H6** `oms/oms.py:127` the unknown-pair check stays LAZY · **H7** `oms/oms.py:196` `Portfolio.starting_equity` unvalidated (NaN poisons max_drawdown) · **H8** `oms/oms.py:180` `TradeResult.outcome` never cross-checked · **H9** `corpus/build_corpus.py:158` KIND questions keep a FIXED option order (the constant-index positional shortcut) · **H10** `corpus/build_corpus.py:388` substring-replace hits the FIRST occurrence · **H11** `corpus/build_corpus.py:326` the floor negative only handles `a/b/c RRR` rows.
**THE RECOMMENDATION:** FIX NOW (near-zero risk): H1, H2, H3, H4 · YOUR CALL: H5, H9 · LEAVE AS DOCUMENTED DEBT: H6, H7, H8, H10, H11.

---

## §10 THE KG SUBSTRATE — ARSUMBRIS (what V6's doctrine corpus rides on)

**AS IT EXISTS (2026-09-17 measured):**
```
  S1 AUTHOR   MASTER_CONTEXT/*.md operator-only cards
  S2 INDEX    au Rust daemon — socket ~/.arsumbris/au-engine/run/<fnv1a64>.sock, WIRE schema 29, ~1s re-index, version++ per save
  S3 RENDER   au-host Electron 42.3.0+b49c705, workspace-layout.yaml composition, 14 projections, intents
  S4 GATE     au-mcp kernel 44 tools, mediate→act→observe, MCP stdio via omp-server.ts + AU_MCP_SESSION
  S5 HARNESS  terminal pane, omp adapter contractVersion 0
  S6 SUPERVISE kgm fleet.ts Desired daemon+lint, SQLite+journal
  S7 MINE     Semantica PROPOSED, candidates/ wall
```
**CORPUS:** 39 roots + 5 reload + 38 rulings + 16 HL + 1 lesson + 3 gates + 3 state + terms + 7 type-defs + 3 profiles + mechanisms/583 + legacy graph.db.
**CONTRACTS:** frontmatter typed claim + body quote+`[[wikilink]]`; singular `type/` with slash-regex; failures = diagnostics never block;
one kernel per socket owned by host; heal requires read-back; X11+AX flags; built-dist law; absolute binaries; append-only.
**THE MEASURED CENSUS:** v1 map 121 nodes/21 edges (4 doctrine + 17 structural)/66 cards → post-overhaul **703 nodes/24 edges/649 cards**
(66 original + 583 mechanisms by 7 scouts) → V6-pin 716 nodes/583 mechanisms/649 cards/27 edges. Diagnostics 106→42→3→0.
**THE CARD LAW (D13):** each card carries the operator's exact words + `file:line`. **The cards → the Decider/Kev fine-tune corpus (offline only).**
**ENGINE:** cargo 1.98.1, 50.72s build, version=4, WIRE 29; socket = `fnv1a64(realpath)`.
**THE KNOWLEDGE GRAPH MAP v2** (`Knowledge_Graph_Map_v2.md`, 330KB/7,795L) = the generated interactive map (703 nodes / 24 edges / 649 cards, the 583-entry mechanism ToC).

---

## §11 THE V6 BUILD PACKAGE (the deliverable class the operator named)

### 11.1 THE PACKAGE STACK
| Artifact | Lines | Role |
|---|---|---|
| `PLUTUS_V6_GOAL_PIN.md` | ~180 | **the paste-ready build pin** — GOAL · BASELINE · BUILD PACKAGE · WAVES (W1-W10) · LAWS · PROOF CONTRACT · RUNTIME SEAT · ADVERSARIAL LOOP · DOC CONTRACT · CHECKPOINT · HARD STOPS · STOP · ANTI-DERAIL · ANTI-STOP · RESUME POINTERS |
| `PLANNING_SUITE_Plutus_V6_Build_Package.md` | 374 | the Decider-2B edition build package: differential · reduced core · SPEC-W1..W10 · evidence · the 3-phase hydra plan · 10 success criteria · the checklist · anti-patterns · resolved decisions · residual |
| `Plutus_V6_Master_Blueprint_v1.md` | 524 | Bp-1 Kev pointer-readout (delimiters, LoRA r=16, 4-call 17-Q pipeline, 649-card training map) · Bp-2 Limite math engine · Bp-3 TensorTrade OMS · the V6 merge (~250ms cycle, the component table, V5-vs-V6) |
| `Plutus_V6_Initial_Blueprint.md` | 284 | the initial blueprint |
| `PLANNING_SUITE_Plutus_V6_Architecture.md` | ~200 | the architecture planning suite |
| `Plutus_V6_NEXT_STEPS_BLUEPRINT_v1.md` | ~230 | the next-steps blueprint |
| `Plutus_E3_Master_Blueprint_v1.md` | 977 | the E3 trade-engine extraction + V6 migration |
| `Plutus_MPSE_Limite_Master_Blueprint_v1.md` | 398 | the deterministic-math predicate layer |
| `PLANNING_SUITE_Kev_Limite_Fusion.md` | 386 | the Kev/Limite fusion planning |
| `V6/*_DPL1.md` | 7,897 (14 files) | the 12-component enterprise build specs |
| `v6-audit/*.md` | 2,931 (6 files) | the forensic audits + the 133 migration cards |

### 11.2 THE WAVE PLAN (W1-W10, verbatim from the GOAL_PIN)
| Wave | Scope | Gate | Files |
|---|---|---|---|
| **W1** | pi-harness + Decider — clone pi, strip coding tools, port MiMoCode memory, deploy Decider on the 4080, write the 17 question templates + the state constructor | `decider.decide()` returns calibrated probabilities on golden-week state, `test_pass_e1_questions` | pi-harness/ decider/ question-templates.py |
| **W2** | Limite-1B + gates — deploy via vLLM temp=0, write 6 math queries L1-L6, the dual-compute verifier, 8 gates + 7 MPSE gates | golden RRR reproduction ±0.02, `test_rrr_golden_reproduction` | limite/ gates/ mpse/ |
| **W3** | State constructor + bars — render golden-week bars → Decider state text, session detection | state text validates against the Decider input contract, `test_state_constructor_golden` | state/ bars/ |
| **W4** | TensorTrade OMS — wire `TradeDecision` → `Exchange`, commission 0%/0.1%/0.2%, walk-forward | commission sensitivity at 3 levels with P&L tracked, `test_commission_0_1pct` | oms/ |
| **W5** | TUI trading pane — live P&L, probability bar charts, gate decisions, rejection log | every probability + gate + rejection visible, `test_tui_renders_probabilities` | tui/ |
| **W6** | Report generator — 8-section report + golden check | report on the golden week matches canon output, `test_report_golden_check` | report/ |
| **W7** | Doctrine fine-tune — generate 700+ records from the 649 cards, fine-tune | fine-tuned ≥14/15 golden, `test_finetuned_golden_precision` | corpus/ finetune/ |
| **W8** | MPSE predicates — 10 AT predicates + the 3-way trust engine | all predicates executable with named verdicts, `test_mpse_predicate_at03` | mpse/ |
| **W9** | Determinism + memory — SHA-identical runs, the MiMoCode memory port | `sha256(run1)==sha256(run2)`, `test_determinism_sha_match` | determinism/ memory/ |
| **W10** | Integration + golden week — full pipeline end-to-end | ≥14/15 ≤3p, <500ms, `test_golden_week_e2e` | main.py integration/ |

### 11.3 THE LAWS + THE PROOF CONTRACT (verbatim, GOAL_PIN §LAWS / §PROOF)
**THE LAWS:** RIPWIRE FIRST-CLASS (map before every edit; blind edits FAIL the wave) · D13 QUOTE LAW · **DECIDER SCORES, NEVER EDITS** (the gate layer is pure Python if/else — no model in the gate path) · **LIMITE COMPUTES, CODE VERIFIES** (dual-compute `|Limite-code| ≤ eps` or `LIMITE_CODE_DIVERGENCE` FAIL) · DOCTRINE OFFLINE (cards → training data, NEVER runtime) · **TEMPERATURE=0** (non-zero on the MPSE path = AUTOMATIC-FAIL) · **NOT HEADLESS** (the pi TUI is the visible runtime) · **NO CODING** (bash removed, code execution disabled) · **E2 DESIGNATES, E3 OBEYS**.
**THE PROOF CONTRACT:** every pass token MUST appear in a tool-result context (exit code, JSON field, container artifact) — never agent free text. The results artifact at `.trident/container-test-results.json` records per-scenario `passTokenMatch`/`failTokenAbsent`/`toolResultContext`/`verdict`. **Without this artifact there is NO test.** Independent re-verification: **a zero-context subagent re-runs the golden-week test and confirms the entry count independently.** AUDIT GATE: qwen-code-audit must produce `GATE: PASS (0 critical/high)` before any ship claim.
**AUTOMATIC-FAIL:** any wave marked done without its gate's tool-result evidence · any temperature > 0 on Limite · any headless run · any bash in the trading agent.
**THE ADVERSARIAL LOOP:** adversarial-first — before any happy-path run, probe (1) empty bars → named error, (2) bars past the temporal anchor → `FUTURE_BAR_LEAK` must fire, (3) RRR below 2.5 → `G-RRR` must reject, (4) session outside London 02:00-05:00 ET → `G-SESSION` must reject, (5) deliberately wrong Limite output → `G-DUAL` must catch `LIMITE_CODE_DIVERGENCE`. **Happy path runs LAST.**
**THE STOP (14 conditions, §4):** all must hold. **THE HARD STOPS:** secrets never in repo/chat/rows · rig-down (4080 unavailable) = BLOCKED not a pass · **the final cutover (V5→V6 primary) waits for the operator's GO** · VRAM overflow = BLOCKED + report which model to downgrade.

### 11.4 THE HONEST GAPS (verbatim, BUILD_REPORT)
1. **ECE = 0.2139 over 60 corpus decisions** in the early report (gate <0.05) — the published Decider ACCURATE (58/60 = 0.967) but UNDER-CONFIDENT (mean stated 0.753). *(LATER: the 2026-09-24 board reads ECE 0.03238 MET — the temperature-scale fix landed.)*
2. **No doctrine fine-tune was performed** (W7-D2) in V6_BUILD — the Decider is the published checkpoint; the 1,267-record corpus is built + ready but no LoRA was trained.
3. **The FX Tier-D rows are not an oracle** — the cascade doc marks the EU/GU per-trade E/SL/TP as pixel-inferred; only the 6 DXY Tier-A rows are documented-exact and only they serve as acceptance.
4. **The "15/15 FX entries" claim is an ENTRY-LEVEL identity check**, not an independent precision measurement — the circuit is fed the canon entry and returns it. The load-bearing precision evidence is the Tier-A RRR table.
5. **No container isolation was used** — the suite ran on the host with the live models; a true container run was not performed.

---

## §12 THE OPEN QUEUE (prioritized)

### 12.1 THE V6_BUILD QUEUE (verbatim, NEXT_STEPS)
**IMMEDIATE (the two open gates):** (1) **ECE** — the Decider is accurate (0.967) but under-confident (0.753); two routes: (a) temperature-scale the published logits against the 1,267-record corpus and re-measure, (b) fine-tune (Q-2). Route (a) is cheap, no training run. *(The 2026-09-24 board reads ECE 0.03238 MET.)* (2) **Fine-tune** — the corpus is built; the training harness is not written.
**THEN:** (3) **Walk-forward** — harvest a second week ending at its own anchor, run the same 6-row Tier-A protocol, write the test. (4) **Container isolation** — a container run needs the two model servers reachable from inside.
**THE OPERATOR-OWNED DECISION:** **the cutover (V5 → V6 as the primary pipeline).** V5 is green at 1,195/0 with the canon oracle at 15/15; V6 is green at 13/13 container scenarios with two open gates.
**THE AUDIT DEBT (the 8-11 highs):** the operator's review — `.trident/AUDIT_DEBT_CATALOG.md` (H1-H4 fix-now, H5/H9 operator's call, H6/H7/H8/H10/H11 documented debt).

### 12.2 THE V6 DPL1 QUEUE (the enterprise surface, per the desks)
**P0 (operator choices):** OD-1 the feed choice (databento + dukascopy) · OD-3 the pause authority · OD-3/OD-4 the TTL pair jointly · flatten+micro · OD-2 the refuse floor · OD-4 the GAP lift.
**P1 (build order):** 11-W1 first → then 07-W1..W3, 08-W1..W2, 12-W1 → then integrations.
**P2:** the G-honesty pre-W8 unmasked · calendars PROPOSED · COT shapes UNKNOWN · quota UNKNOWN · TV/pine/mobile/multihost excluded · terminology + J for L2.
**Excluded by scope:** the JevK5 context study (build-state owned).

---

## §13 THE CROSS-REFERENCES + THE SUPERSESSION LEDGER

### 13.1 THE TWO V6 ARCHITECTURES (the central cross-reference)
| | **(A) Sept-15 — THE SIX-STATION CANON** | **(B) Sept-17 — THE pi-TUI JUDGMENT LOOP** |
|---|---|---|
| **Shape** | SIX STATIONS + FOUR SYSTEMS: BRAIN · SHELL · AGENT · ENGINE · JOURNAL · REVIEW COMPUTER | ONE embedded judgment loop on a pi TUI |
| **Runtime** | mimocode + Jarvis core + Orca + SuperGoal harness | pi (TypeScript TUI) |
| **Substrate** | 12 DPL1 components (00-12), 7,895L, W0-W10 | Decider-2B + Limite-1B + TensorTrade + gates |
| **Decide engine** | Kev-0.6B-ONNX | **Decider-2B** (v10) |
| **Threading** | agent emits PENDING intents → engine → review → journal; shell renders rev-hashed snapshots; kick/steer via orchestration | state → Decider (4 calls, 17 Q) → Limite (6 Q) → 8+7 gates → TradeDecision → OMS → report + TUI |
| **Doctrine** | 649 arsumbris cards, live-indexed, queryable | cards → offline fine-tune only (NEVER runtime) |
| **Status** | PLANNING (nothing built) | **BUILT** (V6_BUILD, container PASS 13/13) |
**THE RESOLUTION:** (B) OVERTAKES (A) in the live build — the pi-TUI circuit IS what V6_BUILD implements. (A) remains the **enterprise/next-wave blueprint** (journal/review/graphs/RSI/feed/rails spec'd, not built). **The operator's "V6 build package" spans both: (A) the component canon + (B) the executed circuit package.**

### 13.2 THE SUPERSESSION LEDGER (V6)
| Era | Contributed | Superseded-by | Current authority |
|---|---|---|---|
| Sept-15 V6 canon | the 12-component station registry + the 00_MASTER_V6_OVERHAUL | Sept-17 | the enterprise blueprint (spec'd, not built) |
| Sept-15 Kev-fusion planning | the Kev-decides/Limite-computes/code-gates architecture | Sept-17 | the architecture shape survives; the decide model advanced |
| Sept-17 V6 master blueprint | Bp-1 Kev (later Decider-2B) + Bp-2 Limite + Bp-3 OMS + the merge | — | the merged blueprint |
| Sept-17 V6 build package | the Decider-2B edition + SPEC-W1..W10 + the 3-phase hydra plan | — | **THE EXECUTED PACKAGE** |
| V6_BUILD | the built circuit (7 worktrees, container PASS) | — | **THE CURRENT BUILD** |

### 13.3 THE DOCUMENTED CONFLICTS (V6)
1. **THE DECIDE MODEL:** Kev-0.6B (fusion planning) → Decider-0.6B (goal pin) → Decider-2B (planning suite + live). **Newest governs: `Mapika/decider-2b`.**
2. **THE HEAD:** CURRENT_STATE `ff5eb6a` vs the live `3bc6da5`.
3. **ECE:** 0.2139 (early BUILD_REPORT) vs 0.03238 MET (2026-09-24 board) — the temperature-scale fix landed between.
4. **GATE COUNT:** 8 gates (live `gates/gates.py`) vs the 9-gate DPL1 03 set (+G-GEOMETRY).
5. **§11 SPECS vs V6_BUILD:** the DPL1s are Status PLANNING; V6_BUILD is built. **Do not read a PLANNING row as green.**

### 13.4 WHAT AGREES (the stable spine)
The proof contract (pass tokens in tool-result context) · the artifact-first rule (no artifact = no test) · D13 quote law ·
determinism SHA-identical · the adversarial-first ordering · the 3-way trust (oracle ∧ limite ∧ script) · NOT headless ·
zero coding · temp=0 on the arithmetic path · E2-designates-E3-obeys · the 649-card corpus as training-only data.

---

## §14 THE READING ORDER + THE RESUME SEQUENCE

**THE V6 READING ORDER:** `00_CANON_CONTEXT` → `PLUTUS_V6_GOAL_PIN` → `PLANNING_SUITE_Plutus_V6_Build_Package` →
`Plutus_V6_Master_Blueprint_v1` → the 12 component DPL1s (01-12) → the E3/MPSE/fusion blueprints → `v6-audit/*` → `V6_BUILD/context_management/CURRENT_STATE`.

**THE RESUME SEQUENCE:**
1. Verify: `V6_BUILD` git HEAD, the container artifact sha, the two model servers (`curl :8008/health`, `:8100`), the GPU free.
2. Read the GOAL_PIN (the 14-condition board) + `V6_BUILD/context_management/CURRENT_STATE` + `BUILD_STATE` + `NEXT_STEPS`.
3. Read `V6_BUILD/.trident/SCAN_ACCEPTANCE.md` (the 40-round audit ruling) + `AUDIT_DEBT_CATALOG.md` (the 11 highs).
4. **The first tasks:** (a) ECE — verify the 0.03238 MET is real (re-run `test_decider_calibration_ece`); (b) the W7 fine-tune harness;
(c) the H1-H4 near-zero-risk fixes (if the operator authorizes a wave); (d) **the V5→V6 cutover decision (OPERATOR-OWNED).**

**THE PATHS (the V6 operating table):**
| Path | What |
|---|---|
| `PLUTUS_V6_GOAL_PIN.md` | the paste-ready build pin (15 criteria, W1-W10, the proof contract) |
| `PLANNING_SUITE_Plutus_V6_Build_Package.md` | the Decider-2B build package (SPEC-W1..W10) |
| `Plutus_V6_Master_Blueprint_v1.md` | the merged blueprint (Bp-1/2/3) |
| `V6/*_DPL1.md` | the 12-component enterprise spec set (13 docs, 794KB) |
| `v6-audit/*.md` | the forensic audits + the 133 migration cards |
| `V6_BUILD/` | the built circuit (7 worktrees, its own git) |
| `V6_BUILD/.trident/worker-plan.md` | `WORKERS: 7` + T-1..T-15 + B-1..B-15 + OR-1..28 |
| `V6_BUILD/.trident/container-test-results.json` | the 13-scenario runtime artifact (verdict PASS) |
| `V6_BUILD/context_management/{CURRENT_STATE,BUILD_STATE,EVIDENCE_STATE,NEXT_STEPS}.md` | the canon set (11 docs) |
| `V6_BUILD/ship_docs/*.md` | the 6 ship docs |
| `MASTER_CONTEXT/reports/ARSumbris_KG_*.md` | the KG substrate (the 649-card engine) |

<!-- V6-SYNTHESIS-COMPLETE -->

---

## §15 THE V6_BUILD MODULE DETAIL (the as-built circuit)

### 15.1 THE 7 WORKTREES + OWNERSHIP
| worker | worktree | owns | tests |
|---|---|---|---|
| WA decider | `.wt/wa-decider` | pi-harness/ decider/ state/ bars/ memory/ | 4 |
| WB limite | `.wt/wb-limite` | limite/ gates/ mpse/ | 7 |
| WC exec | `.wt/wc-exec` | oms/ report/ | 3 |
| WD tui | `.wt/wd-tui` | tui/ | 4 |
| WE train | `.wt/we-train` | corpus/ finetune/ | 1 |
| WF det | `.wt/wf-det` | determinism/ | 3 |
| WG integ | `.wt/wg-integ` | integration/ main.py .trident/ | 4 |
**Total: 23 test files.** HEAD chain: `ff5eb6a` → `f8b9250` → `2a21fa8` → … → `f39d0dd` → `53dc0dd` → `f0fe013` → `9ff2c92` → **`d4fb0df`** (the decider-discard fix) → **`3bc6da5`** (HEAD).

### 15.2 THE V6_BUILD DIRECTORIES (the as-built tree)
```
V6_BUILD/  bars/ bin/ corpus/ decider/ determinism/ finetune/ fixtures/ forensic/ gates/ integration/
           limite/ logs/ memory/ mpse/ oms/ pi-harness/ report/ research/ shared/ specs/ state/ tests/
           tui/ vendor/ workers/ context_management/ ship_docs/ .trident/ Checkpoints/(1521) .wt/(7 worktrees)
```
**V6_BUILD/ship_docs (6):** BUILD_REPORT · DEBUG_LOG (41KB, EN-001..EN-036) · FAILURE_LOG (F-01..F-06) · SPEC_VIOLATION_LOG · TESTING_LOG (25KB) · THEATRICALITY_LOG.
**V6_BUILD/context_management (11):** BUILD_STATE · CHANGELOG · COMPACTION_SURVIVAL · CURRENT_STATE · DECISION_CHAIN (D-001..D-006) · EVIDENCE_STATE (15KB per-claim table) · NEXT_STEPS · POST_COMPACTION_PROMPT · RUNNING_BUILD_LOG · RUNNING_DEBUG_LOG · TASK_QUEUE (Q-1..Q-8).
**V6_BUILD/.trident:** worker-plan.md (23.9KB) · container-test-results.json · ct-plan.md · ct-capture.json · ct-results.json · SCAN_ACCEPTANCE.md · AUDIT_DEBT_CATALOG.md · VRAM_BLOCKER.md · seat-evidence/.

### 15.3 THE STATE CONSTRUCTOR + THE 17 QUESTION TEMPLATES
**State = bars → Decider state text** (`state/state_constructor.py`, `zone_to_state_text` ≤8192 tok): bars_30m/1h/4h + ATR + session + DXY ctx.
The **17 typed questions** (E1:5, E2:4, E3:5, PVE:3): E1 zone/OBCV/mitigation/pressure/fortress · E2 shape/day-element/cascade-valid/freshness
(Q3 INVERSE vs KEPT modes REPLACE translate+divergence) · E3 direction/quality-grade (Score F/C/B/A/A+)/session-valid/SL-envelope/shield ·
PVE 3. **4 Decider calls** per cycle. The circuit hardcodes `--no-builtin-tools` and registers **7 `plutus_*` tools**.

### 15.4 THE CORPUS GENERATOR
`corpus/build_corpus.py` → `corpus/records.jsonl`, **1,267 records** = 621 real cards × 2 signals + 18 golden + 7 forensic,
each carrying its D13 verbatim quote + file:line provenance. **Zero provenance violations.** Dedup keyed on (source, quote, question).
*(The W7 fine-tune harness is NOT written — the corpus is ready. H9/H10/H11 are corpus-refinement items.)*

### 15.5 THE JEVK5 CONTEXT STUDY
`research/jevk5-context/{brief.md, findings/F1.md}` — a context study (build-state owned; excluded from this synthesis's scope).

---

## §16 THE V6 DPL1 MODULE CONTRACTS (per component, in brief)

### 16.1 V6-01 AGENT (the disciplined station-caller)
A port + hardening of the mimocode primary trading agent (`agent/src/index.ts` 282L, 6 hooks, 6 module groups, **13 tools**,
vkg 106, `pipeline/` 17 modules). **Intelligence moves OUT of agent turns INTO stations.** The agent = a disciplined station-caller
on the mimo runtime (header + cache + before/after guards + 13 tools + in-session subagents). **In-session subagents ONLY.**
Emits PENDING intents → engine → review → journal. S-01..16, A-01..06, ST+D+E suites.

### 16.2 V6-02 SHELL (the unprivileged viewport host)
An Orca fork (417L, `PLUTUS_ORCA_FORK_PLAN.md`) — **6 sandboxed panels** + a full-node worker + a loopback sidecar `:9420`.
**Renders + steers only, NEVER executes.** Renders rev-hashed snapshots and Vela↔TV ±3p-verified charts.
Substrate: `plutus-sidecar/server.ts` 570L + 7 pipeline POSTs · `tv-controller` 420L CDP 127.0.0.1:3690 ·
`mt5-controller` 307L ZMQ `ipc:///tmp/plutus-mt5.sock` · `vlm-analyzer` 412L (mimo-v2.5, 120s/2 retries) ·
the dashboard 5 tabs (`tab-manager.js:15`, `app.js:545-569`, `api.js:4` :9430, `websocket.js:14` :9431, `server.ts:293` proxy :9420→:9430).
SC-1..15, T-1..T-6.

### 16.3 V6-05 JOURNAL (J1-J10) + V6-06 REVIEW (M1-M10)
The journal: `J1` the SQLite/Drizzle store is THE record; `J2` journal-sink the ONLY live writer; `J3` schema (intents/fills/outcomes/receipts/exceptions/review-refs);
`J4` the 6th JOURNAL panel + DATA-MACRO page; `J5` the 14-format importers (MT4/5 first); `J6` reconcile zero-diff; `J7` the same-second edge emitter;
`J8` the RSI read API; `J9` FIFO/LIFO/WAVG + Edge Score v2; `J10` verifyChain/covers. LuxAlgo journal-core lineage.
The review: the second computer between agent and engine — `M1` cli exits 0/1/2; `M2` factory seat TOKEN `jt-job-hex8` (heartbeat 5s, silence 90s/600s, VERDICT=exit0);
`M3` ≥8 TTE universals (R1); `M4` fresh scope manifest+TTL (R2); `M5` corpus-match (the 20,322-row replica, 4 class tokens, R4); `M6` bias-guard (R3);
`M7` verdict PASS|FAIL|CAUTION+precedence; `M8` verify-fence exit-0 accept; `M9` receipt store + journal sink; `M10` 3-doc doctrine bundle. R1..R4 + G1..G2.

### 16.4 V6-09 GRAPHS + V6-10 RSI
The graphs: writer (`projectSameSecond` atomic) + 3 projectors (context/data/code) + edge-chain `sha256 |graph| domain` + store
(`graphs.db`, OD-1 default join tradeId+committedSeq) + 5 verbs (`contextAt`/`similars`/`edgeStat`/`ruleLineage`/`failureCluster`, all Sourced
with `{graph,version,batchSelf}`) + guard (budget/dedup/quarantine/small-n). The **8-code taxonomy**; SC-1..SC-12; A-1..A-7; OD-1..OD-5.
The RSI: `R1` scheduler single-flight; `R2-R6` miners (rootcause/baserate/lexicon-quarantine/derail/ev-seed-pinned); `R7` proposal store
(own SQLite, 6-state machine, fingerprint sha256); `R8` battery-gate; `R9` promotion-gate (golden × determinism ×2 × frozen);
`R10` `|rsi|` receipts; `R11` t6-enforcer (fingerprints + SelfApplyProof). C1..C6, S1..S12, A1..A7, ST-RSI-01..07, F1..F5.

### 16.5 V6-11 FEED + V6-12 RAILS
The feed: `RawFeed` 12-matrix + the `PIP`/venues; 8 modules + a firewall. **Frost honesty · zero-write venue · exact-gap · no-synthesis ·
censor census · provenance firewall · oracle fabrication-five · IL-8.** Seeds Vibe/Air 4,573/7,817; dropped databento + dukascopy PROPOSED;
COT/GEX E1-only; **NINE_PILLAR_404 do NOT fabricate.** Flows live/seed/enrich/receipt; 9 codes. S-1..S-12, F-1..F-6, ST-1..7, D.9.
The rails: a supervisor store (7 tables) + a prober (tick 5s) + rails (7) + kill (row+sentinel) + recorder + backup + drill + secrets + ramp +
ledger + CLI ops (closed 30 codes). Death ≤1 tick, restart-armed, 7 denies, chained-ledger, portmap. R-01..R-12, A1..A6, ST-01..06.

---

## §17 THE HARNESS AUDIT (the H/D/T/G/L/Z/W census)

The v6-audit harness doc maps the **v4.5.3 harness composition → V6** with a complete census:
**H-01..H-14** (the harness functions) · **D-01..D-03** (data feeds) · **T-01..T-03** (tokens) · **G-01..G-09** (the gates) ·
**L-01..L-03** (Limite calls) · **Z-01..Z-03** (zone/state) · **W-01..W-05** (web/feed tools) + the cannot/must-build lists +
the `main.py` assembly + the fork row.
**THE BASELINE (all six audit files agree):** the codebase at `/home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent/`
@ `v4.5.3_CLEAN_BASELINE` (the worktree `plutus-main-66dfa4c`). Harness: `report-v452.ts` 1,494 lines + `storyline-engine.ts` 567 lines.
MDVE `src/mdve/`: `setup-gen.ts` 1,376 + `trade-chaining.ts` 301 + `trade-dedup.ts` 524 + `ob-engine.ts` 505 = 2,706 lines.
**This is the SAME V5 reference the V6 goal pin names** (V5 baseline `@ omp-worker-1 8f4ac74`).

**THE 133 MIGRATION CARDS:** 93 from `v6-audit-e2e3.md` (768 lines) + 40 from `v6-audit-harness.md` (480 lines), plus
378 lines of MPSE/Limite fusion from `v6-mpse-limite-authoritative.md`, 637 lines of MDVE E3 architecture from `e3-mdve.md`,
and 270 lines of E3 composition from `e3-wiring.md` (127 file:line anchors). **These cards → the doctrine corpus (the W7 generation source).**

---

## §18 THE EVIDENCE + THE PROVENANCE (V6)

**THE EVIDENCE STATE (per-claim table):** every claim in the V6 build carries its command. The canon pins (cited across all specs):
V5 dist `261343a9` (earlier `95f92ae`, container-verified `b2f3d954`) · gates 11/11 green · battery `646/0/59865/46` ·
frozen pair `91294083…`/`33914c89…` INTACT · compile 46→46 fp `8acfe74f…` · graph `1940/3647/5674/4611` pin `bc6ce1a0584a` ·
Monday 5/5 gold (DXY L 100.945 / S 101.140 · EU S 1.14395 / L 1.14110 · GU L 1.33330) · tolerances ORACLE 3p / G1 2p / wall 5min · anchor `1783317600000`.
**THE FAILURE CORPUS:** `MASTER_CONTEXT/plutus-reasoning-failures.db` (12.1MB) — `chain_failures` **20,322 rows**
(SHADOW_DEGRADE 10,919 / GROUNDING_WARN 8,913 / REFINEMENT_EXHAUSTED 399 / MACRO_DIVERGENCE 91).
**THE JESL CHAIN (V6 side):** `self=sha256(canonical + "|jesl|" + prev)`, `verifyChain`/`covers`, `runId` 16-hex, MAX_NODES_FIRING=15, RUN_DEADLINE_MS=60000.

**THE INDEPENDENT RE-VERIFICATION (verbatim, `f0fe013`):** "the runtime seat proven live (the pi TUI rendered the golden-week table from the
push-set prompt) and the independent re-verification confirmed (**a zero-context subagent returned 15/15 at max_delta 0.000p twice**)."

---

## §19 THE V6 CROSS-COMPONENT THREADS (how the stations connect)

```
  agent (01) emits PENDING intents ─────────────► engine (03) OWNS the action
        │                                              │
        │  shell (02) renders rev-hashed snapshots     ├─► review (06) JUDGES (receipt + TTL)
        │  + Vela↔TV ±3p-verified charts               ├─► journal (05) RECORDS (the ONE writer)
        ▼                                              └─► pipeline (07) PRESSURE-TESTS (GM cards × skeptic)
  brain (04) STEERS via events (kick/steer)
        │
        ├─ 08 know-verbs INSIDE shell/engine
        ├─ 09/10 graphs + RSI = the feedback root
        └─ 11 feed (the frozen contract) + 12 rails (the survival)
```
**THE CONTRACTS:** engine verbs ONLY on the trade path (L1) · journal-sink append intent→fill→outcome (C1-C3) · review receipt+TTL consumed by the
engine gate (T1) · kick/steer via orchestration send (same session) · know-answers carry `{data,evidence,source-version}` (T7) · accept=shell-exit-0 ·
**tokens TOOL-RESULT-BOUND** (never prose).

### 19.1 THE KG AS THE DOCTRINE ROOT (the wiring)
```
  649 arsumbris cards (S1 author) ─► au daemon index (S2, WIRE 29) ─► au-host render (S3, 14 projections)
        │                                                                     │
        ├─► au-mcp kernel (S4, 44 tools) ─► the harness (S5) ─► kgm supervise (S6)
        │
        └─► THE DECIDER/Kev FINE-TUNE CORPUS (offline ONLY — NEVER runtime queries: the determinism law)
```
**THE LAW:** the cards carry the operator's exact words + file:line (D13). The runtime NEVER queries them (determinism). The cards →
the training data. **The 89+J fabric / the 20,322-row replica / the 133 migration cards** are the corpus surface.

<!-- V6-SYNTHESIS-1000 -->

---

## §20 THE V6 FAILURE LEDGER + THE ANTI-PATTERN SET

### 20.1 F-01..F-06 (the derailment ledger, `ship_docs/FAILURE_LOG.md`)
| # | The derailment | The lesson |
|---|---|---|
| F-01 | the decider's output was DISCARDED on every call (the nested-vs-flat answer shape) | a test that asserts the model ANSWERS is not a test that the answer CHANGES a verdict |
| F-02 | a fixture/gate interface mismatch (the `LONDON 02:00` label vs the ISO form) | accept BOTH forms at the boundary; the label is a real interface |
| F-03 | a UTC-offset parse (`s[-5:]` read `-04:00` → every EDT timestamp passed) | parse the component between `T` and the offset |
| F-04 | the pointer head on CPU while hidden states were on CUDA | device co-location is a correctness property |
| F-05 | the pair-pip hardcode (`pip=0.0001` → DXY's 4p SL read as 400p) | the pair's own pip scale is the ONLY scale |
| F-06 | the corpus dedup collapsing intentional multi-signal records | the dedup key must include the question |

### 20.2 THE 8 FIXES FOUND BY ADVERSARIAL PROBES (not by review)
| # | Defect | Where | Fix |
|---|---|---|---|
| 1 | `expected_level` used 0-indexing → 2.73 (blueprint §1.4 says 3.73) | `decider/question_templates.py` | 1-indexed to match the blueprint's own worked value |
| 2 | `G-SESSION` read the UTC OFFSET suffix → every EDT timestamp passed | `gates/gates.py` | parse the component between `T` and the offset |
| 3 | `G-SESSION` rejected the state constructor's `LONDON 02:00` label | `gates/gates.py` | accept BOTH the label and the ISO form |
| 4 | pointer head weights on CPU while hidden states on CUDA | `decider/model.py` | `head.W.to(device)` — then SUPERSEDED by the published model |
| 5 | the digest's volatile filter applied only at depth ≥1 | `determinism/determinism.py` | filter at depth 0 too; added latency_ms/stage_latency |
| 6 | circuit hardcoded `pip=0.0001` for every pair → DXY's 4p SL read as 400p | `integration/circuit.py` | the pair's own pip scale from `math_queries.PIP` |
| 7 | empty feed raised bare `ValueError: max() iterable empty` | `state/state_constructor.py` | named `EmptyBars("NO_BARS")` |
| 8 | corpus dedup keyed on (source,quote) collapsed the intentional multi-signal records | `corpus/build_corpus.py` | key on (source, quote, question) |

### 20.3 THE EN-001..EN-036 DEBUG CHAIN (`ship_docs/DEBUG_LOG.md`, 41KB)
Thirty-six root-caused defects, including: **EN-035 the batch-script law** (a batch-edit script that ABORTED at its first anchor miss,
silently killing every later edit — five round-24 fixes were written but never applied; fixed with a non-aborting script + a grep verification
after every batch); the type-erasure class; the public trust bypass; the token guard undershooting 4.13×; the state rendered 4× the blueprint's spec.

### 20.4 THE ANTI-PATTERN SET (the pin's ANTI-DERAIL / ANTI-STOP, verbatim)
**ANTI-DERAIL:** SCOPE SHRINK ("too big" is never a finding) · THEATRICAL COMPLETION ("it works" without the passToken is VOID) ·
MODEL SUBSTITUTION (do not swap without the operator) · HEADLESS DRIFT (any run without the pi TUI = AUTOMATIC-FAIL) ·
KIMOCODE RELAPSE (any reference to MiMoCode/OMP as the runtime = derailed — pi IS the runtime) · GATE BYPASS (any path that skips a
deterministic gate to "get the answer through" = AUTOMATIC-FAIL).
**ANTI-STOP:** STATIONARITY STOP ("no change in N turns" is not done — re-probe, widen, escalate) · MEMORY-COMPLETE ("I already verified this"
without a THIS-TURN re-run is STALE) · SUB-INNER PASS (W1 green alone is progress, not completion) · BLOCKED-AS-DONE (a BLOCKED entry has a
resume condition — never a pass) · THEATER-COMPLETE (prose summaries, screenshots without artifacts, verdicts without quoted tool results).

---

## §21 THE V6 TESTING DETAIL (the suite tables + the two-suite distinction)

### 21.1 THE SUITES
| Suite | Scope | Result |
|---|---|---|
| **Host suite** | `pytest` on the host with the live models | **30/30** (final), green after EVERY change |
| **Runtime suite** | the in-process circuit (models in the loop) | **13/13** |
| **Container suite** | `.trident/container-test-results.json` — 13 scenarios (5 adversarial + 8 happy) | **PASS** |

**THE TWO-SUITE DISTINCTION (verbatim, `TESTING_LOG.md`):** the host suite and the runtime suite are DIFFERENT instruments;
the container suite is the artifact. **STOP 4 at ~400ms with the model in the loop** — the live-latency condition met.

### 21.2 THE AUDIT ROUNDS (the two-suite audit trail)
The V6 audit ran **40 rounds** (see §9). The criticals zero in 13 of 17 measured rounds; every critical round was self-inflicted.
**THE DURABLE GUARD:** `tests/test_fix_effectiveness.py` — 30+ behavioural invariants.

### 21.3 THE MEASURED TABLE (the standup numbers)
| Claim | Value | Where |
|---|---|---|
| 6 Tier-A canon RRRs ±0.02 | 6/6, max delta 0.0043 | `test_rrr_golden_reproduction` |
| 15 FX canon entries ≤3p | 15/15, max delta 0.000p | `test_golden_week_e2e` |
| latency < 500ms | mean 0.058ms (offline) / 402ms warm | `test_decision_latency` |
| commission | +184.5p @0% → +183.3p @0.1% → +182.1p @0.2% | `test_commission_0_1pct` |
| determinism | two runs byte-identical | `test_determinism_sha_match` |
| zero coding surface | 0 violations / 8 roots | `test_zero_coding_surface` |
| corpus | 1,267 records, zero provenance violations | `test_corpus_record_count` |
| 17/17 non-uniform | 17/17, zero uniform | `test_pass_e1_questions` |

---

## §22 THE V6 OMS / FINANCIAL DETAIL

**TensorTrade OMS (SPEC-W3 / Bp-3):** wire `TradeDecision` → `Exchange.execute_order()`; the commission models 0%/0.1%/0.2%;
portfolio tracking (base/quote wallets per pair); **walk-forward** (train on the golden week, test on an unseen week);
metrics: Sharpe / Sortino / max drawdown / win rate. `oms/oms.py` — `Fill.__post_init__` (numerics + direction),
`Portfolio` (base/quote), `TradeResult(entry/exit/outcome)`, `PIP` (the pair's own pip table). Async. **The measured commission
sensitivity on the golden week: +184.5p @0% → +183.3p @0.1% → +182.1p @0.2%** — profitable at 0.1%.

**THE RRR DISCIPLINE (V6):** `G-RRR` floor 2.5; the golden Tier-A RRRs `4.25 / 4.92 / 4.60 / 3.58 / 3.79 / 5.84` each within ±0.02.
The RRR tension (the golden 4-6 vs the 2.5 floor) is named as an open L2 item.

**THE DETERMINISM MECHANISM:** `anchorMs` everywhere; no `Date.now`; single LAW7/STAGGER/tier tables; the byte-identical `TradeDecision` log;
**chain-before-dedup ordering; ENTRY fixed during repair.**

---

## §23 THE V6 SECURITY / SECRETS / DR DETAIL

**SECRETS:** never in repo / chat / rows — keys stay in the rig's out-of-band path. The rails own a names-secrets step + a gated ramp.
**THE VAULT:** pre-live (a design decision).
**DR (disaster recovery):** a recorder + a drilled backup; **death ≤1 tick, restart-armed**; 7 closed denies; a chained ledger.
**THE KILL:** row + sentinel (durable); `flatten` = deny-new + close-all; `micro` = 0.1× min.
**THE PORT MAP:** KEEP 6768 / 9420 / 2222 / 4200-loopback · DELETE 9430 / 9431 / 3690 / 9333.
**THE ORCA STORE:** Merkle ~/.plutus-orca/data.db; KEEP 6768/9420/2222/4200, DELETE 9430/9431/3690/9333.

---

## §24 THE V6 GOLDEN ORACLE (the acceptance target — shared with V5)

**THE MONDAY 5/5 (tolerance 3 pips):** `DXY SHORT 101.14` · `DXY LONG 100.945` · `EU SHORT 1.14395` · `EU LONG 1.14110` · `GU LONG 1.33330`.
**THE 6 TIER-A RRRs (±0.02):** `4.25 / 4.92 / 4.60 / 3.58 / 3.79 / 5.84`.
**THE FULL WEEK:** EU 8 trades (Mon S/L, Tue S, Wed L/S/L, Thu L, Fri S) + 2 reinforcements; GU 7 trades (Mon L, Tue S, Wed S/L, Thu S/L, Fri S) + 3 LRs.
**THE CANON ORACLE FILES:** `MASTER_CONTEXT/PLUTUS_GOLDEN_CASCADE_23.md` (lines 19-24 = the DXY Tier-A rows) · `specs/fixtures/golden-week.json`.
**THE ANALYSIS POINT:** `1783317600000` (Mon 2026-07-06 06:00 UTC — the London pre-market hour). **ALL trades CLOSE Friday.**
**THE V6 ACCEPTANCE:** ≥14/15 entries ≤3p (met: 15/15 at max_delta 0.000p) + the independent zero-context re-verification.

<!-- V6-SYNTHESIS-FINAL -->

---

## §25 THE V6 ENGINE PROMPTS + THE STATE TEXT CONTRACT

### 25.1 THE DECIDER QUESTION TEMPLATES (the 17, structured)
**E1 (5):** zone-class · OBCV-grade · mitigation-state · pressure-degree · fortress-flag.
**E2 (4):** shape-class · day-element · **cascade-valid (Q3: the INVERSE vs KEPT mode selector — REPLACES the TS `translate`+`divergence` pair)** · freshness.
**E3 (5):** direction · quality-grade (`Score` on the F/C/B/A/A+ legend) · session-valid · SL-envelope · shield.
**PVE (3):** the probability inputs.
**THE OUTPUT SHAPE (the trap that cost the operator find):** the Decider returns a **NESTED** answer
(`{"type":"score","score":2.03,"legend":{"0":"F","1":"C","2":"B","3":"A","4":"A+"},"probabilities":{"0":0.156,…}}`),
NOT a flat `{LEVEL: prob}` dict. `grade_from_probs` must consume the nested form and return the model's grade — proof: caller=0.20 → 0.65 and
caller=0.99 → 0.65 AFTER (caller-independent), vs both passing through BEFORE.

### 25.2 THE LIMITE QUERY ENVELOPE (the D13 contract)
`{ query_id, rule_id, quote, anchor:"doc.md:line", inputs:{E,SL,TP,pip}, task:"arithmetic-only", forbidden[] }`
→ the steps + a terminal `ANSWER` line. **L1 width · L2 SL distance · L3 RRR · L4 fib levels · L5 commission · L6 TP distance.**
**temp=0** (NOT the model card's recommended 0.6 — the MPSE law). The **dual-compute** verifier: a Python shadow recomputes each query;
`|Limite − code| ≤ eps` (0.01 ratio / 0.1p width) else `LIMITE_CODE_DIVERGENCE`; 1 retry → `CONTRADICTED`.

### 25.3 THE STATE CONSTRUCTOR CONTRACT
`zone_to_state_text(bars) ≤ 8192 tok`: bars_30m/1h/4h + ATR + session + DXY ctx. **`to_kev_zone` verbatim** + an **IP-rejection assert**
(H-04/H-06/T-01/Z-02). **The anchor filter:** bars past the analysis point → `FUTURE_BAR_LEAK`; empty → `EmptyBars("NO_BARS")`.

### 25.4 THE 8-SECTION REPORT (SPEC-W6)
1 Overview · 2 Zones · 3 Shapes · 4 Trades · 5 Chaining · 6 Stats · 7 Storyline · 8 Golden Check.
A port of the `report-v452.ts` format to Python; the golden check compares entry prices ≤3p; deterministic (same inputs → same output).

---

## §26 THE V6 SIDECAR / ORCA / BROWSER SURFACE

### 26.1 THE SIDECAR (`plutus-sidecar/server.ts`, 570L)
A loopback `:9420` HTTP sidecar with 7 pipeline POSTs + helpers. **The sidecar is the shell's data plane** — it serves the snapshots
the shell renders. Routes: the pipeline POSTs (analyze/plan/execute), the mt5 helpers, the fang helpers.

### 26.2 THE ORCA FORK (`PLUTUS_ORCA_FORK_PLAN.md`, 417L / 74.5KB)
**6 sandboxed panels** + a full-node worker + the loopback sidecar. The shell renders **rev-hashed snapshots** and **Vela↔TV ±3p-verified charts**.
**F5 gate (SC-14):** the shell MUST NOT regress the rendering contract. **Dual-render** (Vela + TV cross-checked at ±3p).

### 26.3 THE BROWSER CONTROLLERS
`tv-controller` 420L — CDP **127.0.0.1:3690** (the Orca-era port) · `mt5-controller` 307L — ZMQ `ipc:///tmp/plutus-mt5.sock` ·
`vlm-analyzer` 412L — mimo-v2.5, 120s timeout, 2 retries.
**⚠ PORT CONFLICT (recorded):** the V6 sidecar uses **:3690** for TV CDP; the V5 injector/Bible 4.0 uses **:6930**; the T1 v2.0 doc uses **:9333**.
**Three eras, three ports.** The V6 rails list 3690 + 9333 as DELETE and 4200 as the loopback KEEP. **Verify live before wiring.**

### 26.4 THE DASHBOARD (the legacy 5 tabs)
`tab-manager.js:15` + `app.js:545-569` + `api.js:4` (:9430) + `websocket.js:14` (:9431) + `server.ts:293` (the proxy `:9420`→`:9430`).
**The dashboard lineage → the shell's panel host.**

---

## §27 THE V6 MEMORY PORT + THE DETERMINISM MECHANICS

### 27.1 THE MIMOCODE MEMORY PORT (SPEC-W9)
"Copy the TypeScript memory banking system; adapt for pi's agent context (not MiMoCode sessions); cross-session: remember past trades,
zone patterns, gate decisions." **The memory is append-only, one-writer.** Loopback sidecar `:9420`.
**❌ THE KIMOCODE RELAPSE LAW:** "any reference to MiMoCode/OMP as the runtime = derailed — pi IS the runtime." The memory SYSTEM is ported; the RUNTIME is pi.

### 27.2 THE DETERMINISM REPAIRS (SPEC-W9)
Replace `Date.now()` IDs with deterministic counters · replace wall-clock session checks with bar-index checks · ensure `sha256(run1) == sha256(run2)`
on same inputs. **The digest** (`determinism/determinism.py`): canonical serialization excluding volatile fields (latency_ms/stage_latency),
filtered at EVERY depth (depth 0 included — the fix). **H5** (`round(o,10)` collapse) is a PINNED design trade — the operator's call.
**The measured:** two runs byte-identical; the digest excludes latency fields.

### 27.3 THE 3-WAY TRUST ENGINE (SPEC-W8)
`accept = oracle AND limite AND script` — no single point of trust. The 10 AT predicates pair a Limite semantic verdict with a script
mechanical check. **AT-03 catches translation fidelity (the side-inversion) · AT-06 wall-clock contamination · AT-07 determinism break.**
`trust_engine.py` produces a named verdict.

---

## §28 THE V6 APPENDIX — THE FILE INVENTORY + THE CONVENTIONS

### 28.1 THE V6 SPEC FILES (13 DPL1 + the canon)
```
V6/00_CANON_CONTEXT.md            149L   29KB   the grounding root (v1.0 BINDING)
V6/00_MASTER_V6_OVERHAUL_DPL1.md  266L   28KB   the umbrella (6-station map, SC-V6-01..13, W0-W10)
V6/01_PLUTUS_AGENT_DPL1.md        816L   67KB   V6-01 the agent
V6/02_PLUTUS_SHELL_DPL1.md        767L   75KB   V6-02 the shell
V6/03_TRADING_ENGINE_DPL1.md      631L   57KB   V6-03 the engine
V6/04_PLUTUS_BRAIN_DPL1.md        715L   78KB   V6-04 the brain
V6/05_TRADE_JOURNAL_DPL1.md       477L   41KB   V6-05 the journal
V6/06_TRADE_REVIEW_DPL1.md        575L   57KB   V6-06 the review
V6/07_ANALYSIS_PIPELINE_DPL1.md   452L   49KB   V6-07 the pipeline
V6/08_SHELL_INTELLIGENCE_DPL1.md  595L   64KB   V6-08 the intelligence
V6/09_JOURNAL_GRAPHS_DPL1.md      724L   61KB   V6-09 the graphs
V6/10_RSI_LOOPS_DPL1.md           544L   55KB   V6-10 the RSI
V6/11_DATA_FEED_LAYER_DPL1.md     692L   68KB   V6-11 the feed
V6/12_PRODUCTION_RAILS_DPL1.md    494L   65KB   V6-12 the rails
                                 7897L 794KB   TOTAL
```

### 28.2 THE MASTER_CONTEXT/reports FILES (the V6 blueprints + the audits)
```
PLUTUS_V6_GOAL_PIN.md                    10.8KB   the paste-ready pin
PLANNING_SUITE_Plutus_V6_Build_Package.md 16.6KB  the Decider-2B build package (SPEC-W1..W10)
PLANNING_SUITE_Plutus_V6_Architecture.md   8.9KB  the architecture planning suite
PLANNING_SUITE_Kev_Limite_Fusion.md       24.3KB  the fusion planning
Plutus_V6_Master_Blueprint_v1.md          38.4KB  the merged blueprint (Bp-1/2/3)
Plutus_V6_Initial_Blueprint.md            22.0KB  the initial blueprint
Plutus_V6_NEXT_STEPS_BLUEPRINT_v1.md      23.2KB  the next-steps blueprint
Plutus_E3_Master_Blueprint_v1.md         106.9KB  the E3 engine blueprint (977L)
Plutus_MPSE_Limite_Master_Blueprint_v1.md  48.7KB the MPSE/Limite blueprint (398L)
Arsumbris_KG_Master_Blueprint_v1.md       23.2KB the KG blueprint
Arsumbris_Semantica_Blueprints_v1.md      32.8KB the Semantica layer
Arsumbris_KG_Engineering_Report_v1.md     15.0KB the KG deploy receipt
Knowledge_Graph_Map_v1.md                 31.6KB the pre-overhaul map (121n/21e)
Knowledge_Graph_Map_v2.md                330.1KB the post-overhaul map (703n/24e/649 cards)
v6-audit/{e3-mdve,e3-wiring,v6-audit-e2e3,v6-audit-harness,v6-mpse-limite-authoritative,v6-mpse-limite}.md  371.8KB / 2931L
```

### 28.3 THE CONVENTIONS (V6)
- **The DPL1 artifact contract:** each component spec carries FR-1..FR-N with the objective, the steps, the tokens, the pass/fail criteria, the evidence,
  the anchors, the container-test angles, the anti-patterns, the open decisions, the registry.
- **The token convention:** pass/fail tokens are TOOL-RESULT-BOUND (never prose). Every claim carries the command.
- **The status convention:** every row is PLANNING / BUILT / MET / NOT MET / BLOCKED — never softened.
- **The `PROPOSED` convention:** uncheckable values are marked PROPOSED (e.g. the br-1 home, the :4220 port, the PFC thresholds, the TTLs).
- **The two-suite convention:** host suite ≠ runtime suite ≠ container artifact — the container artifact is the proof.

### 28.4 THE V6 ↔ V5 RELATION (the cutover surface)
| | V5 (LIVE) | V6 (V6_BUILD) |
|---|---|---|
| Language | TypeScript (bun) | Python (the circuit) + TS (pi harness) |
| Entry | `report-v452.ts` (`runChainV452`) | `integration/main.py` (the circuit) |
| Decide | the TS E1/E2/E3 pipeline | Decider-2b + Limite-1b + the 8 gates |
| Runtime | the canon pipeline + the JESL kernel | the pi TUI (NOT headless) |
| Tests | 528/0 (V5.1/V5.2) · 1,195/0 (the pin) | 30/30 host · 13/13 runtime · 13/13 container |
| Golden | the canon oracle 15/15 | 15/15 at max_delta 0.000p |
| Status | V5.2 14/21 in progress; the guard fired | 13/14 board; the audit gate NOT MET |
**THE CUTOVER IS OPERATOR-OWNED.** The comparison lives in the V6 BUILD_REPORT.

<!-- V6-SYNTHESIS-1000-DONE -->

---

## §29 THE V6 EXECUTION RECORD (the build's own history)

### 29.1 THE BUILD TURNS (`RUNNING_BUILD_LOG.md`)
The build ran in **rounds** — the ROUND-N STAMP chain in the docs records each: `ROUND-4 STAMP` (build HEAD `bf04465`, container artifact `6a3eaee694e44fcc`, 2026-09-23) ·
`ROUND-9 STAMP` (HEAD `f8b9250`, container artifact `9f8dfc263d58dca3`) · … · `ROUND-26` (the root cause: the aborting batch script) ·
`ROUND-32/33/35` (the fix-effectiveness guard) · `ROUND-40` (BLOCKED, OCR_RUN_DEGRADED) · the resume pointer "ROUND-4/9 STAMP" pattern continuing.
**HEAD chain:** `ff5eb6a` → `f8b9250` → `2a21fa8` → … → `d4fb0df` (the decider-discard fix) → **`3bc6da5`**.

### 29.2 THE CHECKPOINTS (10, sealed)
The V6 build sealed **10 checkpoints**, including the **seat-proven checkpoint** (`f0fe013`): "the runtime seat proven live (the pi TUI rendered
the golden-week table from the push-set prompt) and the independent re-verification confirmed (a zero-context subagent returned 15/15 at max_delta 0.000p twice)."
The **round-zero checkpoint** was saved BEFORE Phase 1 dispatch (the confirmed-working state: the blueprints + the corpus + the canon docs + the pin).

### 29.3 THE OPERATOR-CAUGHT DEFECT (the decisive moment)
The most important V6 finding was caught by the OPERATOR, not by any test: **"why are you not using decider"** → the discovery that the circuit
called the published Decider (~430ms/decision) and **THREW THE ANSWER AWAY** (the nested-vs-flat shape mismatch). The fix (`d4fb0df`) made the
model's grade authoritative and caller-independent. **NO TEST CAUGHT IT** — `test_decider_live_pipeline` asserted the model ANSWERS but never that
its grade CHANGES a verdict. **THE LESSON:** a test that observes a component is not a test that the component's output CHANGES a downstream verdict.

---

## §30 THE V6 HONEST RESIDUAL + THE READY STATE

### 30.1 WHAT IS PROVEN (V6)
- The circuit runs end-to-end on the golden week: **15/15 entries at max_delta 0.000p**, **6/6 Tier-A RRRs ±0.02 (max 0.0043)**.
- The two engines are REAL and measured: Decider-2b (17/17 non-uniform) + Limite-1b (byte-identical at temp=0).
- Determinism SHA-identical; zero coding surface (0/8 roots); the corpus 1,267 records, zero provenance violations.
- The container artifact exists (13 scenarios, verdict PASS); the runtime seat proven live; an independent zero-context re-verification (15/15 ×2).

### 30.2 WHAT IS NOT PROVEN / OPEN (V6)
1. **The audit gate (§11 / T-14): NOT MET** — 0 critical, 8-11 high, operator-review debt.
2. **The W7 fine-tune: NOT DONE** — the corpus is built; the harness is unwritten.
3. **The H1-H11 audit highs** — the near-zero-risk four unlanded; the pinned trade + the corpus design decision need the operator.
4. **The container ISOLATION** — the suite ran on the host with live models; no true container run.
5. **The "15/15 FX entries" is an ENTRY-LEVEL identity check**, not independent precision — the load-bearing evidence is the Tier-A RRR table.
6. **The V5→V6 cutover** — OPERATOR-OWNED.

### 30.3 THE ONE-LINE V6 STATE
> **V6_BUILD is a working embedded trading circuit: 13/14 stop conditions met, the golden week reproduced 15/15 at 0.000p, the two engines
> real and measured, the container artifact PASS — with the audit gate open (0c/8h), the fine-tune unwritten, and the cutover the operator's call.**

---

## §31 THE DOCTRINE QUOTES (V6 — the operator's exact words)

1. **THE GOAL (GOAL_PIN):** "Build the complete Plutus V6 trading agent — an embedded circuit (Decider-0.6B + Limite-1B + TensorTrade + gates + angels on a pi TUI harness with MiMoCode memory ported in, NOT headless, zero coding) that reproduces ≥14/15 golden-week entries at ≤3p precision with <500ms decision latency and every probability visible in the TUI — running end-to-end on the RTX 4080 Laptop 12GB."
2. **THE CLASSIFICATION (planning suite §0):** "ARCHITECTURAL. Replace the MiMoCode-based Plutus runtime with a Decider-2B + Limite 1B + TensorTrade pipeline on a pi TUI harness. The primary Plutus coding agent is ELIMINATED. NOT headless. The 649 doctrine cards become Decider's fine-tune corpus."
3. **THE REDUCED CORE (§2):** "ONE MECHANISM: a judgment loop on a pi TUI — market state enters, Decider-2B produces calibrated probability distributions over 17 typed questions (4 calls), Limite computes 6 numeric queries with dual-compute verification, 8+7 deterministic gates consume both outputs, TensorTrade validates, a trade decision exits with every probability inspectable."
4. **THE OPERATOR-CAUGHT DEFECT (git `d4fb0df`):** "why are you not using decider" → the circuit threw the Decider's answer away.
5. **THE PIN'S ANTI-DERAIL:** "SCOPE SHRINK: 'too big' is never a finding — decompose and dispatch, never a smaller promise. THEATRICAL COMPLETION: 'it works' without the tool-result passToken is VOID — the artifact is the proof."

*(Sources: `PLUTUS_V6_GOAL_PIN.md`; `PLANNING_SUITE_Plutus_V6_Build_Package.md`; `V6_BUILD` git log; `.trident/SCAN_ACCEPTANCE.md`.)*

---

## §32 THE SYNTHESIS PROVENANCE (what this doc distills)

| Layer | Source | Method |
|---|---|---|
| §0-§4 | the V6_BUILD state docs + the GOAL_PIN + the planning suite + the container artifact | primary first-hand reads + the desks' measured facts |
| §5 | the 12 component DPL1s (V6/*.md) | 6 E2 desks (agent-shell, engine-brain, journal-graphs, feed-rails, canon, + the retries) |
| §6 | the E3/MPSE/fusion blueprints | the e3-mpse-blueprints desk |
| §7 | the V6 target loop + the engines | the v6-audit desk + the BUILD_REPORT |
| §8 | the V6 gate + MPSE design | the v6-audit + the v6-engine-brain desks |
| §9 | the 40-round audit + the debt catalog | the v6-audit desk + `.trident/SCAN_ACCEPTANCE.md` + `AUDIT_DEBT_CATALOG.md` |
| §10 | the arsumbris KG | the v6-kg-arsumbris desk |
| §11-§14 | the build package + the queue + the cross-refs | the v6-canon desk + the GOAL_PIN + the NEXT_STEPS |
| §15-§19 | the as-built module detail + the threads | the v6-build-state + v6-engine-brain + v6-feed-rails desks |
| §20-§24 | the failure ledger + testing + OMS + security + oracle | the v6-build-state desk + the BUILD_REPORT + the GOAL_PIN |
| §25-§32 | the prompts + the sidecar + the memory + the appendix + the residual + the quotes + this provenance | the v6-agent-shell + v6-canon + v6-audit desks + the primary |

**A fact appears ONCE.** Doctrine is QUOTED, never synthesized (D13/R19). Where this doc and a source conflict, THE SOURCE WINS —
re-verify the anchor, update this doc. Where two sources conflict, the newest era governs (the drift ledger §0).

<!-- PLUTUS-V6-SYNTHESIS-COMPLETE -->

---

## §33 THE DIRECT ANSWER (what a fresh agent must execute for V6)

**THE QUESTION:** "fully read the specs and build packages for both v5 and v6."
**THE V6 ANSWER, in the operating form:**
1. **THE BUILD PACKAGE IS TWO-LAYERED.** Layer (A) = the 12-component enterprise canon (`V6/*.md`, 7,897L, Status PLANNING) — the journal/review/graphs/RSI/feed/rails
   next-wave surface. Layer (B) = the executed pi-TUI judgment loop (`V6_BUILD/`, BUILT, container PASS) — Decider-2b + Limite + 8 gates + OMS + TUI.
2. **THE EXECUTABLE CONTRACT IS THE GOAL_PIN.** It carries the 15 criteria, the W1-W10 waves, the LAWS, the PROOF CONTRACT, the adversarial loop, the DOC CONTRACT,
   the CHECKPOINT, the HARD STOPS, the STOP, the ANTI-DERAIL, the ANTI-STOP. **A fresh agent re-verifies the baseline, then dispatches W1+W2+W3 in parallel as hydra workers.**
3. **THE PROOF STANDARD IS MECHANICAL.** Every pass token MUST appear in a tool-result context (exit code, JSON field, container artifact) — never agent free text.
   `.trident/container-test-results.json` is the artifact; without it there is NO test. A zero-context subagent independently re-runs the golden week.
4. **THE CURRENT STATE IS 13/14.** The 14-condition stop board is 13 MET; #11 (the audit gate) is NOT MET (0 critical, 8 high — operator-review debt).
5. **THE FIRST THREE TASKS:** (a) verify the ECE MET (0.03238) with a fresh `test_decider_calibration_ece`; (b) write the W7 fine-tune harness (the corpus is ready);
   (c) the H1-H4 near-zero-risk audit fixes (if the operator authorizes a wave). **Then the V5→V6 cutover decision (OPERATOR-OWNED).**
6. **THE ENTRY SEQUENCE:** `00_CANON_CONTEXT` → `PLUTUS_V6_GOAL_PIN` → `PLANNING_SUITE_Plutus_V6_Build_Package` → the master blueprint → the component DPL1s → `v6-audit/*`.

---

## §34 THE GLOSSARY (the V6 canon terms)

| Term | Meaning |
|---|---|
| **Decider** | the published decision model (`Mapika/decider-2b`) — state + typed questions → calibrated distributions, single forward pass |
| **Limite** | the 1B math engine (`paradigma-inc/limite-1b-violetto`) — arithmetic at temp=0, dual-compute verified |
| **Kev** | the earlier decision model (Kev-0.6B-ONNX) — the fusion-planning era; superseded by Decider-2b |
| **pi** | the TypeScript TUI harness (earendil-works/pi) — the visible runtime (NOT headless) |
| **the 17 typed questions** | E1:5 + E2:4 + E3:5 + PVE:3 — the Decider's structured inputs (4 calls) |
| **L1-L6** | the 6 Limite math queries (width / SL / RRR / fib / commission / TP) |
| **AT-01..AT-10** | the 10 MPSE anti-theatrical predicates — `accept = oracle ∧ limite ∧ script` |
| **the 8 gates** | G-RRR/G-SESSION/G-SL/G-CONF/G-CASCADE/G-CHAIN/G-DEDUP/G-DUAL (+ G-GEOMETRY in the DPL1 9-set) |
| **dual-compute** | the Python shadow recomputes each Limite query; `|Δ| ≤ eps` or `LIMITE_CODE_DIVERGENCE` |
| **the trust equation** | `accept = oracle AND limite AND script` (3-way; no single point of trust) |
| **`EMPTY_DISTRIBUTION`** | the failure when a flat dict is expected but a nested answer arrives (the discarded-Decider trap) |
| **the proof contract** | pass tokens in tool-result context only; the artifact is the proof |
| **the fixed-point** | the container artifact `.trident/container-test-results.json` |
| **arsumbris** | the typed knowledge graph substrate (649 doctrine cards; the fine-tune corpus) |
| **the corpus** | `corpus/records.jsonl` — 1,267 records (the U13 quote + file:line provenance) |
| **the seat** | the pi TUI runtime seat the operator watches (every probability/gate/rejection visible) |
| **the push set** | the operator sends "run EUR/USD golden week" via the pi TUI chat; the circuit returns a pristine report |
| **the cutover** | the V5 → V6 primary-pipeline decision (OPERATOR-OWNED) |
| **KIMOCODE relapse** | any reference to MiMoCode/OMP as the V6 runtime (the runtime is pi) |

<!-- PLUTUS-V6-1000-DONE -->

---

## §35 THE CLOSING STATEMENT

**V6 IN ONE PARAGRAPH.** Plutus V6 is the EMBEDDED TRADING CIRCUIT: a market feed → a state constructor → the **Decider-2b**
(4 calls over 17 typed questions → calibrated distributions) → **Limite-1b** (6 arithmetic queries at temp=0, dual-compute verified) →
**8 deterministic fail-closed gates** + **10 MPSE AT predicates** → **TensorTrade** OMS → an 8-section report + a **pi TUI** where every
probability and rejection is visible. Zero coding capability, not headless. It lives in `V6_BUILD/` (7 worktrees, its own git), is
container-tested (13/13 PASS), reproduces the golden week **15/15 at max_delta 0.000p** with **6/6 Tier-A RRRs within ±0.02**,
and stands at **13 of 14 stop conditions met** — the open one being the audit gate (0 critical, 8 high of operator-review debt).
The 12-component enterprise canon (`V6/*.md`, 7,897L, Status PLANNING) is the next-wave surface. **The cutover is the operator's call.**

**THE STANDING LAW (both versions):** evidence over prose · artifacts over assertions · verification over claims ·
the deployed thing is the truth · doctrine is QUOTED · a claim without its artifact is a false report.

<!-- FILE END -->
