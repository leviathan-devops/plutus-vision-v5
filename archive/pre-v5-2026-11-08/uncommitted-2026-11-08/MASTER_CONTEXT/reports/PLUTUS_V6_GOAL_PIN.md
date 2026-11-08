## GOAL
Build the complete Plutus V6 trading agent — an embedded circuit (Decider-0.6B + Limite-1B + TensorTrade + gates + angels on a pi TUI harness with MiMoCode memory ported in, NOT headless, zero coding) that reproduces ≥14/15 golden-week entries at ≤3p precision with <500ms decision latency and every probability visible in the TUI — running end-to-end on the RTX 4080 Laptop 12GB.

## BASELINE
- V5 reference: /home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent @ omp-worker-1 8f4ac74, tree clean
- Canon pipeline (diag-lmv-golden-fx.ts): ENTRIES 15/15 ≤3p + TPs 2/2 ≤5p VERDICT PASS
- Frozen pair: sl-lmv.ts 912940832fac44bc + trade-dedup.ts 33914c897e777540 MATCH
- V5 suite: 1195/0, tsc exit 0, 119,019 expects, 84 files
- KG: 716 components, 27 edges, 0 diagnostics, 649 cards, engine live
- V6 blueprints: 5 docs (524+284+398+977+374 lines) at MASTER_CONTEXT/reports/
- V6 audit: 6 files, 2,931 lines, 133 migration cards at reports/v6-audit/
- GPU: RTX 4080 Laptop 12GB GDDR6X, model budget 10.5GB, headroom 1.5GB
- Config: Qwen3-4B q8 (orchestrator) + Decider-0.6B bf16 (decisions) + Limite-1B bf16 @131k (math)

## BUILD PACKAGE
- Blueprint: MASTER_CONTEXT/reports/Plutus_V6_Master_Blueprint_v1.md (524L)
- Initial: MASTER_CONTEXT/reports/Plutus_V6_Initial_Blueprint.md (284L)
- E3: MASTER_CONTEXT/reports/Plutus_E3_Master_Blueprint_v1.md (977L)
- MPSE: MASTER_CONTEXT/reports/Plutus_MPSE_Limite_Master_Blueprint_v1.md (398L)
- Build plan: MASTER_CONTEXT/reports/PLANNING_SUITE_Plutus_V6_Build_Package.md (374L, 10 specs W1-W10)

## WAVES
W1: pi-harness + Decider-0.6B — clone pi, strip coding tools, port MiMoCode memory, deploy Decider on 4080, write 17 question templates + state constructor. Gate: decider.decide() returns calibrated probabilities on golden-week state, test_pass_e1_questions. Files: pi-harness/, decider/, question-templates.py
W2: Limite-1B + gates — deploy Limite via BeeLama vLLM temp=0, write 6 math queries L1-L6, dual-compute verifier, 8 gates + 7 MPSE gates. Gate: golden RRR reproduction ±0.02, test_rrr_golden_reproduction. Files: limite/, gates/, mpse/
W3: State constructor + bars — render golden-week bars → Decider state text, session detection. Gate: state text validates against Decider input contract, test_state_constructor_golden. Files: state/, bars/
W4: TensorTrade OMS — wire TradeDecision → Exchange, commission 0%/0.1%/0.2%, walk-forward. Gate: commission sensitivity at 3 levels with P&L tracked, test_commission_0_1pct. Files: oms/
W5: TUI trading pane — pi TUI: live P&L, probability bar charts, gate decisions, rejection log. Gate: every probability + gate + rejection visible, test_tui_renders_probabilities. Files: tui/
W6: Report generator — 8-section report + golden check. Gate: report on golden week matches canon output, test_report_golden_check. Files: report/
W7: Doctrine fine-tune — generate 700+ records from 649 cards, fine-tune Decider-0.6B. Gate: fine-tuned ≥14/15 golden, test_finetuned_golden_precision. Files: corpus/, finetune/
W8: MPSE predicates — 10 AT predicates + 3-way trust engine. Gate: all predicates executable with named verdicts, test_mpse_predicate_at03. Files: mpse/
W9: Determinism + memory — SHA-identical runs, MiMoCode memory port. Gate: sha256(run1)==sha256(run2), test_determinism_sha_match. Files: determinism/, memory/
W10: Integration + golden week — full pipeline end-to-end. Gate: ≥14/15 entries ≤3p, <500ms, test_golden_week_e2e. Files: main.py, integration/

## LAWS
- RIPWIRE FIRST-CLASS: ripwire verb=map before every coding edit, verb=callers on every symbol change, verb=quality-delta after structural edits — blind edits are THEATRICAL and FAIL the wave on sight
- D13 QUOTE LAW: doctrine is QUOTED verbatim, never synthesized — every card in arsumbris carries the operator's exact words + file:line
- DECIDER SCORES, NEVER EDITS: model outputs are INPUTS to the gate layer; the gate layer (pure Python if/else) makes accept/reject — no model in the gate path
- LIMITE COMPUTES, CODE VERIFIES: dual-compute |Limite-code| ≤ eps or LIMITE_CODE_DIVERGENCE FAIL
- DOCTRINE OFFLINE: cards → training data, NEVER runtime queries (determinism law)
- TEMPERATURE=0: Limite on the MPSE path runs at temp=0 — non-zero = non-deterministic = AUTOMATIC-FAIL
- NOT HEADLESS: pi TUI is the visible runtime — headless operation is BANNED (operator ruling)
- NO CODING: zero coding capability in the trading agent — bash REMOVED, code execution DISABLED
- E2 DESIGNATES, E3 OBEYS: every trade traces to an E1 zone ID + E2 shape day

## PROOF CONTRACT
Every pass token MUST appear in a tool-result context (exit code, JSON field, container artifact) — never agent free text. The results artifact at .trident/container-test-results.json records per-scenario: passTokenMatch, failTokenAbsent, toolResultContext, verdict. Without this artifact there is NO test.
- test_pass_e1_questions: Decider returns non-trivial distributions (all 17 questions have argmax != uniform)
- test_rrr_golden_reproduction: 6 Tier-A RRRs (4.25/4.92/4.60/3.58/3.79/5.84) each within ±0.02
- test_commission_0_1pct: golden-week profitable at 0.1% commission (net_pips > 0)
- test_tui_renders_probabilities: screenshot shows probability bar chart + gate decisions
- test_golden_week_e2e: ≥14/15 entries within 3 pips of canon, exit code 0
- test_determinism_sha_match: sha256 of two identical runs byte-identical
Independent re-verification: a zero-context subagent re-runs the golden-week test and confirms the entry count independently.
AUDIT GATE: qwen-code-audit must produce GATE: PASS (0 critical/high) before any ship claim — a FAIL or BLOCKED stops everything.
AUTOMATIC-FAIL: any wave marked done without its gate's tool-result evidence, any temperature > 0 on Limite, any headless run, any bash in the trading agent — FAILS the wave on sight.

## RUNTIME SEAT
The pi TUI IS the runtime seat. The operator sees every probability, every gate decision, every rejection with its named token. The second operator: a zero-context subagent that independently runs the golden-week test and verifies the entry count. Push set: the operator sends "run EUR/USD golden week" via the pi TUI chat; the circuit returns a pristine report; the operator reads it on screen.

## ADVERSARIAL LOOP
Adversarial-first: before any happy-path golden-week run, probe the circuit with (1) empty bars → circuit must reject with named error, (2) bars past the temporal anchor → FUTURE_BAR_LEAK must fire, (3) RRR below 2.5 → G-RRR must reject, (4) session outside London 02:00-05:00 ET → G-SESSION must reject, (5) deliberately wrong Limite output → G-DUAL must catch LIMITE_CODE_DIVERGENCE. Each adversarial probe is a named scenario in the results artifact. Corpus expands until a full pass returns zero confirmed defects. Happy path runs LAST.

## DOC CONTRACT
Canon docs (11): context_management/ COMPACTION_SURVIVAL CURRENT_STATE NEXT_STEPS TASK_QUEUE BUILD_STATE CHANGELOG POST_COMPACTION_PROMPT DECISION_CHAIN EVIDENCE_STATE RUNNING_BUILD_LOG RUNNING_DEBUG_LOG — 200+ line floor, 3+ file:line refs, cross-consistency SHA gate.
Ship docs (6): BUILD_REPORT DEBUG_LOG FAILURE_LOG SPEC_VIOLATION_LOG TESTING_LOG THEATRICALITY_LOG — 50+ line floor, append-only, audit gate mandatory.
Both fire after EVERY completed wave and EVERY milestone — never deferred.

## CHECKPOINT
Round-zero checkpoint saved BEFORE Phase 1 dispatch (the confirmed-working state: the blueprints + the corpus + the canon docs + this pin). Sealed with chattr +i (Mode A — full tree lock). Subsequent checkpoints at each phase gate. Checkpoint manifest records the state + honest gaps + next work.

## HARD STOPS
- Secrets never in repo/chat/rows — keys stay in the rig's out-of-band path
- Rig-down (4080 unavailable): BLOCKED state, not a pass — resume when GPU returns
- Operator-owned: the final cutover decision (V5 → V6 as primary) waits for the operator's GO
- VRAM overflow: if the 3-model stack exceeds 12GB, BLOCKED + report which model to downgrade

## STOP
Legal stop = ALL of: (1) ≥14/15 golden entries ≤3p (test_golden_week_e2e exit 0), (2) all 38 forensic trades correctly classified, (3) TensorTrade profitable at 0.1% commission on unseen week, (4) decision latency <500ms, (5) zero coding agent in the loop, (6) TUI shows every probability/gate/rejection, (7) determinism SHA-identical, (8) golden RRR ±0.02, (9) mutant tests fire, (10) ECE < 0.05, (11) audit gate GATE: PASS, (12) checkpoint sealed, (13) all 6 ship docs current, (14) all 11 canon docs current. Anything less is OPEN.
FIRST REPLY: re-verify the baseline (run diag-lmv-golden-fx.ts, check KG diagnostics, confirm the 5 blueprint SHAs), then dispatch W1+W2+W3 in parallel as hydra workers. A session that does not re-verify and fire W1 in the first reply is derailed.

## ANTI-DERAIL
- SCOPE SHRINK: "too big" is never a finding — decompose and dispatch, never a smaller promise
- THEATRICAL COMPLETION: "it works" without the tool-result passToken is VOID — the artifact is the proof
- MODEL SUBSTITUTION: Decider-0.6B is the confirmed decision model — do not swap for Kev/other without the operator
- HEADLESS DRIFT: any run without the pi TUI visible = AUTOMATIC-FAIL
- KIMOCODE RELAPSE: any reference to MiMoCode/OMP as the runtime = derailed — pi IS the runtime
- GATE BYPASS: any path that skips a deterministic gate (RRR floor, session window) to "get the answer through" = AUTOMATIC-FAIL

## ANTI-STOP
- STATIONARITY STOP: "no change in N turns" is not done — re-probe, widen the corpus, escalate
- MEMORY-COMPLETE: "I already verified this" without a THIS-TURN re-run is STALE — re-run or downgrade
- SUB-INNER PASS: W1 green alone is progress, not completion — the board must read all-green
- BLOCKED-AS-DONE: a BLOCKED entry (VRAM, GPU-down) has a resume condition — it is never a pass
- THEATER-COMPLETE: prose summaries, screenshots without artifacts, verdicts without quoted tool results

## RESUME POINTERS
- This pin: /tmp/create-pin-v6.txt (copy to project root as GOAL_PIN.md)
- Blueprints: MASTER_CONTEXT/reports/Plutus_V6_*.md + Plutus_E3_*.md + Plutus_MPSE_*.md
- Build plan: MASTER_CONTEXT/reports/PLANNING_SUITE_Plutus_V6_Build_Package.md
- V6 audits: MASTER_CONTEXT/reports/v6-audit/ (6 files, 2,931 lines)
- Canon docs: MASTER_CONTEXT/context_management/ (9 docs)
- Threads: plutus (master) + knowledge-graph (micro) + arsumbris + system-debugging
- KG: MASTER_CONTEXT (716 nodes, 583 mechanisms, engine live at ~/.arsumbris/au-engine/run/)
- V5 reference: ~/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent @ omp-worker-1 8f4ac74
- Operator manual: MASTER_CONTEXT/OPERATOR_MANUAL.md
- Graph map: MASTER_CONTEXT/reports/Knowledge_Graph_Map_v2.md (7,795 lines)
