# PLUTUS 5.0 — MIMOCODE ARCHITECTURE SPEC

The build authority for the Plutus 5.0 MiMoCode port. Created 2026-09-10 from the
session's chat-delivered architecture, preserved verbatim per the operator order.

## §1 THE CHAT-DELIVERED ARCHITECTURE (2026-09-10, preserved verbatim per the operator order)

All five absorption returns are in. The decisive discovery: **the V5 baseline you remembered is real and built** — `src/e1/` (~30 files, W2), `src/e2/` (~25 files, W3), `src/card/` (W4), `src/kernel/` (~20 files, W5), `specs/mpse/` (W0) all exist in-tree (explore-15, measured). **Plutus 5.0 is a fork-and-continue, not a rebuild.** Here is the full architecture.

---

# PLUTUS 5.0 — THE MIMOCODE ARCHITECTURE

## 0 · The fork verdict — what crosses into `MIMOCODE/Plutus`, what is noise

**FORK IN (0 context loss):**

| Source | What | Why |
|---|---|---|
| `src/e1, src/e2, src/card, src/kernel` | The V5 build (W0–W5, substantially built) | The 5.0 engines — already LASME-shaped |
| `src/mdve/` | LMV/OBCV engines + **frozen pair** (sl-lmv `91294083…`, trade-dedup `33914c89…`, byte-verified) | E1's vision substrate; frozen law |
| `specs/mpse/ + specs/fixtures/` | MathExpr oracles (oracle-registry 19KB), 46-predicate battery, golden-week.json + 9 D17 mutants | W0 built — the MPSE instantiation |
| JESL `jesl/` core | runtime, trading profile, kernel-builder, mpse bridge | The E3 kernel substrate |
| **19 canon docs** | NON-NEGOTIABLE-RELOAD (5) · Golden Feedback (THE oracle) · GOLDEN_CASCADE_23 · TTE_GOLDEN_STANDARD (7 laws) · MACRO_SHAPES · SHAPE_ZONE_MECHANICS · TELESCOPE_T2 · 11-Token design · T1_MULTI_TOOL_CHAIN (root 867L w/ appendix) · Plutus_JESL_Blueprints · CORBELL_GRAPH_OPERATOR_MANUAL · HANDOVER_37_LAWS · ANCHOR_DOCTRINE · ORCHESTRATOR_PRINCIPLES · the 2 V5 specs | The law corpus (fork-listed below) |
| `plutus-reasoning-failures.db` | 20,322 rows — the empirical failure lexicon | Gate seed (§4) |
| `tv-browser-mcp/` | The CDP chart surface | Visual lane unchanged |

**NOISE (stays behind):** both stale-lineage src backups · `engine/` (self-marked legacy) · `pipeline/` opencode chain (superseded by `/plutus-pipeline`; its firewalls are *translated*, not ported) · `hooks/`, `identity/`, `agents/` (opencode SDK couplings) · VIBE_TRADING_REF · v3.4-kronos · the ~40 versioned v4.2–v4.5 build logs · root `report_v452.md` (stale baseline) · 4.2 ITER1 (superseded) · container/browser caches.

## 1 · The master architecture

```
┌─────────────────────────────────────────────────────────┐
│ MIMOCODE/Plutus — the 5.0 fork                          │
├─────────────────────────────────────────────────────────┤
│ ├─ src/e1/       lexicon actors — W2 BUILT             │
│ ├─ src/e2/       6 state machines — W3 BUILT           │
│ ├─ src/card/     Plutus Card assembler — W4 BUILT      │
│ ├─ src/kernel/   L1-L5 trade computer — W5 BUILT       │
│ ├─ src/mdve/     LMV + OBCV engines, frozen pair       │
│ ├─ specs/mpse/   MathExpr oracles + 46-battery         │
│ ├─ jesl/         JESL runtime, trading profile         │
│ ├─ canon/        19-doc fork list + failures.db        │
│ └─ .mimocode/    plutus agent, command, hooks          │
└─────────────────────────────────────────────────────────┘
```

The engine chain, as wired:

```
┌──────────────────────────────────────────────────┐
│ E1 · MASTER LEXICONS  (src/e1 + src/mdve)        │
│ 6 machines · PatternFamily predicates            │
│ zoneMapActor + pressureActor · XState            │
│ out: ZoneMap + LexiconVerdict triplets           │
└──────────────────────────────────────────────────┘
   │
   ▼  gate: no verdict triplet = no classification
┌──────────────────────────────────────────────────┐
│ E2 · ACTORS + STATE MACHINES  (src/e2)           │
│ ShapeChain · Designation · Cascade               │
│ Pressure · Freshness · workflow                  │
│ out: designations = zone IDs, no price           │
└──────────────────────────────────────────────────┘
   │
   ▼  gate: D50 side-inversion · totality 90 rows
┌──────────────────────────────────────────────────┐
│ PLUTUS CARD  (src/card)                          │
│ zod schema · provenance · assembly               │
│ the E1+E2 contract the kernel consumes           │
└──────────────────────────────────────────────────┘
   │
   ▼  gate: card schema-valid + hash pinned
┌──────────────────────────────────────────────────┐
│ E3 · JESL TRADE KERNEL  (src/kernel)             │
│ card-load → L1..L5 → trade-compute               │
│ → report-gen → journal-sink                      │
│ MathExpr oracle gates · risk breaker             │
└──────────────────────────────────────────────────┘
```

## 2 · How we build the engines correctly (LASME overhaul, before any JS workflows)

The V5 spec already made the engines LASME-shaped; the 5.0 work is **finishing the wiring, in this order — before a single workflow is written**:

**E1 = Master Lexicons on MPSE/OHLC vision.** The OHLC-Intelligence-Lexicon IS the master lexicon (6 machines, ~150 typed predicates, 4-bank scoring descriptive/suggestive/substitute/use, fail-closed, triplets). `src/e1` ports it verbatim with predicates re-pointed at **real LMV/OBCV outputs** (V5 §8-W2). The mimocode-side LASME wiring: E1's PatternFamily members compile into `specs/mpse/` as **MathExpr RuleCards** (`compileOracle` append-only registry) so every predicate is dischargeable; the phantom-BoM ALL-4 predicate, DEATH_SCOPE [30m,1H], and the golden-LQZ oracle (7 rungs ≤1p from own-week data) are the acceptance. **The cleanup fixes that make golden prediction possible live here** (§4).

**E2 = Actors, State Machines, Engines.** Already built: ShapeChain (7 shapes, ZFP-conditioned guards, P(S→S′) forward matrix), Designation (OPEN→DESIGNATED→CONSUMED, **IDs only — the type has no price field**), Cascade (requires/forbids/detectLoop), Pressure, Freshness. LASME wiring: XState machines with **math-backed guards** (KB-MPSE-03 substrate: MathExpr as XState guard pre-conditions), every transition recording `{Pattern, State, Evidence}`; MPSE computations enforced as invariants: f(T)=24, divergence ≤0.35, zfp ladder, **totality ∀(day,dir)∃! designation (90 rows = 15d×3p×2dir)**.

**E3 = JESL card in, trades out.** The Trade Computer Kernel authored per the 10-step kernel recipe: kernel-spec `kind: tier1-machine`, caps `[Shell, Fs, Http]`, nodes `card-load(file-io) → L1-telescope → L2-pressure → L3-fib → L4-cascade-oracle → L5-warhead → trade-compute(math-eval) → report-gen → journal-sink`, gates as MathExpr RuleCards (float tolerances mandatory — `FLOAT_EPSILON_MISSING` refusal kills the 2p/3p tolerance-split class by construction), circuit-breaker bracket floor 0.6, fixtures = golden-week.json (PASS) + the 9 D17 mutants (FAIL). V5 B.W5.3 already sketches this exact 9-node graph. The **MiMoCode-live driver** is minimal: HostTransport {invokeTool, dispatchSubagent, callModel, ask} implemented over the plutus-engine custom tool + `mimo llm-server issue` tokens for any Llm node — deterministic kernel needs only Shell/Fs/Http/Journal/sha256.

## 3 · Agent trading memory systems

Native mimocode gives the four-file layout, checkpoints, dream/distill — **but no agent-scoped second memory** (explore-14 Q3: zero `memory.*` config keys). So we build the plutus duplicate with four pieces:

1. **`.mimocode/agent/plutus.md`** (`mode: primary`) — the plutus system prompt: identity, R-laws digest, D13 quote-law, the stop-condition discipline. Tab-switching into plutus mode = entering trading context.
2. **Plutus memory set** — `plutus/MEMORY.md` (law spine: R1–R34, 16 limits, 37 laws, anchor doctrine, frozen SHAs, oracle anchors), `sessions/<id>/plutus-checkpoint.md` (state-verify 6-check slots, golden-convergence table, pinned graph generation), `plutus-notes.md`, `tasks/<id>/progress.md` — seeded per the memory-seed map (wave-2 graph brief §6), exclusions applied (no phantom computeLmvTP move, no Tier-D pixel rows as final).
3. **Injection hooks** (evolve): `experimental.chat.system.transform` + `experimental.session.compacting`, gated on agent==plutus — the injector's §0 contract becomes code: law load → 6-check verify → bounded canon navigate. A `session.post` hook runs the plutus checkpoint writer.
4. **The canon store**: forked `shared.db` (the 126MB corbell graph — 5,674 rule cards; graph.db alone has no cards) queried by the 10 verbs read-only by symbol + the failures.db as the live failure lexicon. DB is truth; docs are audit trail.

## 4 · Cleanup plan — making golden targets accurately predictable

Ordered from the forensic evidence:

1. **E1 murder chain (D100)** — the five stacked mechanisms killing zones before E2 ever sees them: freshness DEPLETED-at-3-held-defenses (fortress confusion), 4H maxBars=60 truncating Jun-22 zones, OBCV single-candle model emitting 0 zones on 1H/30m, matrix-LQZ never bridging into `model.zones`, E2 reach cap excluding 1.14460. Fix in `src/e1` + `src/mdve` adapters — this unblocks everything downstream (per the law: E1 broken ⇒ everything broken).
2. **E2 authoritative** — designations consume the lexicon-verdict zone map (already the V5 DesignationMachine contract); DayBand London-open forward projection; Friday spot feeds Monday-E2 only.
3. **Full-week harness restoration** — the 23-trade oracle (8 DXY Tier-A + 8 EU + 7 GU operator-real) at ±3p as THE acceptance; the four proving tests (tolerance restate, Friday-close recount, uncapped-SL survival, Tue–Fri holdout) become standing kernel fixtures.
4. **Targeted convergence items**: EU#2 (rung 1.14100/top 1.14120/Δ1.0p per V5 SC), GU SHORT geometry (sweep −30 inversion, class-flexible fallback, distribution-as-signal), MACRO_DIVERGENCE handling (GU Monday macro-wins rule — 80/91 rows).
5. **Failure-DB → gate lexicon**: RRR_BELOW_GATE ×3,410 → `rrrGate` + L3 anchor verification; W-1..W-6 ×~860 → STEP A/B out-gates; INVENTED-id classes → provenance totality gate; ADM_REJECT/NO_STRUCTURAL_TP ×1,818 → DEGENERATE_TP_CAP code; Monday 92% concentration → designation-totality first.

## 5 · Finishing the MPSE overhaul

W0 built the pattern; 5.0 finishes it: (a) **every remaining prose rule becomes a RuleCard** — R1–R34 + the 37 laws + the 18 derailments compiled into `specs/mpse/oracle-registry.ts` with verbatim-quote provenance (the corbell PATH-B compiler already does doc→card; point it at the forked canon and bind); (b) **calibrate all 46+ predicates** — each fires on its violation-fixture and stays silent on golden, else FLAGGED (the d17-report's ~20/46 calibrated → 46/46); (c) **count invariants as data** — f(T)≥24, mirror floor, emitted+rejected=oracle-total (kills the /6-vs-/5 drift); (d) **MathContract ladder** on the Part-B checklist: PRE→REJECT (never ran), POST→THROW (discard), INV→DIE, TEMPORAL→ESCALATE — the abort idiom (|setups| divergence → ABORT) as the first new card; (e) the **paper-anchors ban** becomes a mechanical sweep (`member(projection, oracleRows)` provenance gate, SC-14).

## 6 · JS workflows + goal — executing the functions correctly

**The T1 lifecycle is the translation source** (found: 3 copies, byte-identical base `fb69e7b5…` + the root 867L appendix; the live 7-tool D5 chain). Translation table — every opencode tool becomes workflow/agent/gate:

| T1 (opencode 7-tool chain) | 5.0 (MiMoCode) |
|---|---|
| `plutus-pipeline-harvest` tool | workflow `e0-harvest` (deterministic fetch via plutus-engine tool) |
| MANUAL STEP A (agent reads options PNG) | **goal-loop agent turn**: `read()` PNG → optionsData → args |
| `plutus-pipeline-zones` + firewall | workflow `e1-zones` (runs src/e1; FATAL/BLOCKED firewalls become workflow asserts) |
| `plutus-pipeline-reason-step-a` | **agent proposes designations → schema-validated return → JESL gate** (zoneId ∈ map, rationale ≥40c + price regex) |
| `plutus-pipeline-shapes` | workflow `e2-shapes` (consumes card; totality gate) |
| `plutus-pipeline-reason-step-b` | **agent judgment tokens T8/T10/T11 → W-1..W-7 gate loop** (WARN refines, never kills; 3-attempt budget) |
| `plutus-pipeline-charts` | visual workflow (tv-browser MCP draw/capture) + **agent reads PNGs** (agent IS the VLM — P1 law) |
| `plutus-pipeline-setups` + `placed` guard | **`e3-kernel` JESL cast** — runJeslWorkflow, runId=hash(docHash:seed); placed-guard = kernel idempotency (re-cast replays, never recomputes) |
| `plutus-pipeline-gate` (G1–G10, resetContext) | JESL gate cards + golden gate → **judge stop condition**; context reset = workflow scope end (fixes the weekStart-only clobber) |
| `PipelineRunContext` module global | workflow state + files + JESL journal (session-scoped, tamper-evident) |

The deterministic-execution seam: workflows have no `exec` — a **custom tool `.mimocode/tools/plutus-engine.ts`** shells `bun run` against the engines and returns JSON; workflows call it, gate in JS, and the goal-pinned agent calls it directly mid-loop. LLM-needing nodes use `mimo llm-server issue` /v1 tokens (never a provider key).

**`/plutus-pipeline` — the goal duplicate** (per the mimocode internals): `/goal` is session-scoped (`session_goal` store), judge-verified, cleared via `/goal clear`; custom commands live at `.mimocode/command/<name>.md` and a same-named custom command overrides nothing built-in. So:

- **`.mimocode/command/plutus-pipeline.md`** — frontmatter `{agent: build}`, body expands `$ARGUMENTS` (weekStart) into the full lifecycle pin and instructs pinning it as the session goal. The pin:
- **`.mimocode/skills/plutus-pipeline-prompt/SKILL.md`** — the sibling generator (mirrors your existing `goal-prompt` command/skill pair verbatim in structure): measures the week state, writes the pin, validates it, emits one fence.

```
┌──────────────────────────────────────────────────────┐
│ /plutus-pipeline 2026-07-06                          │
│   PHASE 0  workflow e0-harvest {week}                │
│   PHASE 1  workflow e1-zones {bars}                  │
│            agent verify: charts + options (Step A)   │
│   PHASE 2  agent designates → gate IDs ∈ E1          │
│   PHASE 3  workflow e2-shapes {card}                 │
│   PHASE 4  agent T8/T10/T11 → gate W-1..W-7          │
│   PHASE 5  cast e3-kernel {card} → trades            │
│   PHASE 6  workflow e6-report → hash ×2              │
│   STOP     judge: all gates green ∧ hashes match     │
└──────────────────────────────────────────────────────┘
```

The weekly lifecycle as swimlane (the agent/gate/workflow division — mechanical anchoring of the agent loop):

```
┌───────────┬──────────────────┬──────────────────┬─────────────────┐
│ PHASE     │ WORKFLOW (math)  │ AGENT (judgment) │ GATE (JESL)     │
├───────────┼──────────────────┼──────────────────┼─────────────────┤
│ P0 HARV   │ e0-harvest       │ Step A: options  │ SPAN + NO GAPS  │
│ P1 E1     │ e1-zones         │ map vs charts    │ 7 rungs ≤ 1pip  │
│ P2 STEP-A │ — (agent)        │ designations     │ IDs ∈ E1 map    │
│ P3 E2     │ e2-shapes        │ storyline judge  │ totality 90     │
│ P4 STEP-B │ — (agent)        │ T8/T10/T11       │ W-1..W-7 clean  │
│ P5 E3     │ e3-kernel cast   │ refine loop 3x   │ RRR≥3 + counts  │
│ P6 REPORT │ e6-report        │ review + sign    │ 23@±3p · det ×2 │
│ P7 JUDGE  │ —                │ stop verify      │ ALL GREEN       │
└───────────┴──────────────────┴──────────────────┴─────────────────┘
```

## 7 · Build order (fork → engines → harness → convergence)

1. **W-FORK** — execute the fork manifest into `MIMOCODE/Plutus`; verify frozen-pair SHAs; nothing else changes (byte-identical baseline).
2. **W-ENGINES** — E1 murder-chain fixes + predicate re-pointing + LMV/OBCV bridge; E2 authoritative + DayBand; totality/fix fixtures green (all before workflows exist).
3. **W-KERNEL** — Trade Computer Kernel per the 10-step recipe; 7-leg proof harness; D17 mutants FAIL, golden PASS.
4. **W-HARNESS** — `.mimocode/` set: plutus agent mode, memory duplicate + hooks, `plutus-engine` tool, `/plutus-pipeline` + prompt-generator skill, the 7 workflows, cron (Mon ~06:00 London).
5. **W-MPSE** — full RuleCard compilation + 46/46 calibration + count invariants.
6. **W-CONVERGE** — full-week 23-trade acceptance; the four proving tests; phase-2 multi-week; Vibe decision.

**Next concrete step:** write the formal DPL1 spec for W-FORK→W-HARNESS (the trident-deep-planning artifact, with the container test plan carrying tool-result-bound tokens — `cardHash:`, `overall:true`, `FROZEN_PAIR_GUARD` per the V5 §7 plan) into `MIMOCODE/Plutus/MASTER_CONTEXT/`. Say go and I'll author it.

## §2 THE DETERMINISTIC-EXECUTION SEAM + THE SUPER-GOAL SUBSTRATE (2026-09-11, authored per the operator order)

### 2A — THE DETERMINISTIC-EXECUTION SEAM (operator directive, documented in full)

OPERATOR ORDER (verbatim): "The deterministic-execution seam: workflows have no exec — a custom tool .mimocode/tools/plutus-engine.ts shells bun run against the engines and returns JSON; workflows call it, gate in JS, and the goal-pinned agent calls it directly mid-loop. LLM-needing nodes use mimo llm-server issue /v1 tokens (never a provider key)." — make sure this is clearly documented. It is, here, as law:

1. THE CONSTRAINT (measured, mimocode-docs workflows.md): the JS workflow sandbox is an
   orchestration-only jail — NO exec, NO fetch, NO Date/crypto/timers/process in the
   script body (determinism law; network and time live INSIDE agent() or tools).
   Deterministic ENGINE work (E1/E2 runs, kernel casts, report renders, sha256 ×2)
   therefore cannot execute inside the workflow script itself.
2. THE SEAM: a custom evolve tool at `.mimocode/tools/plutus-engine.ts` (next-turn
   reload). Its contract:
   - input: `{ engine: "e1" | "e2" | "e3-kernel" | "report" | "battery", args: {...} }`
   - behavior: shells `bun run` against the Plutus 5.0 engines
     (e.g. `bun run src/e1/run-fixture.ts --week <w>`, kernel casts via
     `runJeslWorkflow(docHash, seed, doc, ctx)`, `bun run specs/mpse/calibrate.ts`)
   - output: structured JSON (engine verdicts, gate deltas, journal receipts,
     determinism hashes) — never prose; exit-code truth preserved in the payload.
3. THE THREE CALLERS (all legal, all same seam):
   - WORKFLOWS call it as their deterministic node (`agent()`-free phases); the
     workflow gates in JS on the returned JSON (schema-validated).
   - THE GOAL-PINNED AGENT calls it directly mid-loop (the /plutus-pipeline phases).
   - JESL `shell-exec` nodes reach it through the MiMoCode-live driver
     (HostTransport.invokeTool → the tool surface).
4. THE LLM BOUNDARY (mirror law): LLM-needing nodes use `mimo llm-server issue`
   tokens against the session's own OpenAI-compatible `/v1` (chat/completions) —
   NEVER a provider API key. Mechanics (capability-api): tokens are directory-bound;
   spawned children are TOLD the endpoint (never read `<state>/llm-server/` state
   files); the port dies with the session — NEVER cache base_url across runs;
   401-expired → reissue + retry same URL, 401-invalid → stop.
5. THE DIVISION LAW (the seam's whole point): MATH NEVER PASSES THROUGH AN LLM, AND
   JUDGMENT NEVER BYPASSES A GATE. Engines compute; the agent judges between phases;
   JESL cards dispose. Any architecture change that routes engine math through a
   model call, or lets an agent emission skip its oracle discharge, is a §8-class
   violation.

### 2B — /plutus-pipeline RIDES THE SUPER-GOAL SUBSTRATE (operator directive)

OPERATOR ORDER (verbatim): "this will be built on the same substrate and codebase architecture as Shared Workspace Context/MIMOCODE/MIMOCODE_MASTER_CONTEXT/SUPER_GOAL_DPL1_SPEC.md" — adopted. /plutus-pipeline is therefore NOT a plain `/goal` pin; it is a DOMAIN PROFILE on the SuperGoalDriver engine:

| SuperGoal substrate (per SUPER_GOAL_DPL1_SPEC.md) | /plutus-pipeline binding |
|---|---|
| L3 SuperGoalDriver — harness-owned loop over the L2 turn engine; model cannot stop while Active (N1) | the TTE weekly lifecycle runs unattended: phases re-invoke until gates pass |
| Tracker — 8-state, persisted metaDir(sid)/goal.json, fail-closed restore | tracker persists the WEEK RUN: phase, gate verdicts, journal runId, hashes; restart → UserPaused, resume re-enters |
| Planner (fail-closed) → plan.md T-1..T-n | plan.md = the phase contract: P0 harvest → P1 E1 → P2 STEP-A → P3 E2 → P4 STEP-B → P5 E3 kernel → P6 report → P7 judge |
| Evaluator per turn-end: continue / candidate_complete / blocked | evaluator criteria = MECHANICAL: JESL cast verdicts, gate deltas, golden counts, hash ×2 — from journal receipts, not model prose |
| Skeptic panel N=3 hidden subagents, quorum ≥2/3 | skeptics verify GATE EVIDENCE (journal rows, oracle discharges, determinism hashes) — the anti-theatrical panel |
| update_goal tool, deferred-to-turn-end ack taxonomy | the agent's phase-complete claims defer; SG_* acks apply verbatim |
| Strategist on stall (same-gaps ×2) + PlanGuard | rerun strategy on repeated gate failures (E1 murder-chain class), plan bytes snapshotted |
| goal_rules.md injected every continuation | carries the plutus law: D13 quote-law, anti-shrink, no-test-theater, honest-data |
| /super-goal verbs set/status/pause/resume/stop/clear + goal.engine config | /plutus-pipeline <weekStart> expands the profile and enters the engine; legacy /goal untouched; mutual exclusion per session |

THE MAPPING LAW: the TTE phases are the plan; the JESL gate casts are the mechanical
success conditions; the skeptic panel reads journal receipts. Where §1 (preserved)
says "judge stop condition", read "SuperGoalDriver Complete sealed by panel quorum on
gate evidence". The `.mimocode/command/plutus-pipeline.md` + `plutus-pipeline-prompt`
skill from §1 generate and pin THIS profile; the engine underneath is the super-goal
codebase (fork: Grok_Build/reference/mimo-code, branch super-goal), never a reimplementation.

## §3 THE BROWSER RUNTIME LAYER — TV_Browser v3 + plutus-browser-manager (2026-09-11, authored from the 3-wave absorption)

OPERATOR ORDER (verbatim intent): TV_Browser_v3.0 "needs to be loaded in mimocode and added to plutus agent's allowlist for browser use"; /container-virtual-display "needs to be hardened into a manager tool... plutus-browser-manager that has container virtual display fully upgraded into a runtime engine for active trading use. plutus should be able to easily manage N trading view tabs on a dedicated browser w/ cookies and session persistence long horizon and use TV mcp tools across all tabs w/ zero issue and full vision processing on memory safe browser rendered properly."

### 3A — TV_Browser v3.0 LOADS INTO MIMOCODE (measured: self-contained — dist prebuilt + node_modules shipped; node v24.13.1 present; no build step)

Project `.mimocode/mimocode.json` block (array-form command carries the space in the path):

```jsonc
{ "mcp": { "tv-browser": {
    "type": "local",
    "command": ["node", "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/MIMOCODE/Plutus/vendor/tv-browser-v3/dist/index.js"],
    "environment": { "PLUTUS_PROJECT_DIR": "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/MIMOCODE/Plutus" },
    "enabled": true, "timeout": 600000 } } }
```

LAWS: (1) `timeout: 600000` is mandatory — default 5000ms kills the container path
(spawn alone waits 25s+). (2) `PLUTUS_PROJECT_DIR` drives the profile dir
(`<root>/container_data/profiles/desktop`) — cookie persistence lives there.
(3) FORK the package into `MIMOCODE/Plutus/vendor/tv-browser-v3/` (supersedes the
§1 fork-list entry for the old tv-browser-mcp — v3 is canonical: 38 tools incl.
`tv_browser_desktop`/`tv_browser_container`, CDP 9333, DISPLAY :1).
(4) VERIFY with `mimo mcp list` after edit.
KNOWN QUIRKS (fix in the fork): the `tv_browser_container` description string says
"6930" — stale; code default is 9333 (src:1258). Desktop path and container path
COLLIDE on 9333 under --network host — the manager owns port allocation (3C).
`tv_screenshot` returns base64 ONLY in v3 (no /tmp write) — vision flows decode
base64 or use `tv_find_element`'s /tmp/tv-element-search.png. `loggedIn:true` in
tv_browser_container output is HARDCODED, not checked — never trust it as auth
evidence. HOST STATE: desktop path viable now (DISPLAY :1 socket present;
google-chrome-stable present); container path BLOCKED until
`plutus-container-testing:master` is imported + `plutus-browser` volume created.

### 3B — PLUTUS AGENT ALLOWLIST (38 entries)

`.mimocode/agent/plutus.md` frontmatter gains `tool_allowlist` with the 38 tv tools
+ the plutus-native set (plutus-engine, plutus-browser-manager, read, glob, grep,
workflow, task). MCP tools are server-prefixed in this lineage — the expected form:

```
tool_allowlist: [plutus-engine, plutus-browser-manager, workflow, task,
  read, write, glob, grep, tv-browser_tv_browser_desktop,
  tv-browser_tv_browser_container, tv-browser_tv_screenshot, tv-browser_tv_reset,
  tv-browser_tv_get_state, tv-browser_tv_navigate, tv-browser_tv_click,
  tv-browser_tv_double_click, tv-browser_tv_right_click, tv-browser_tv_drag,
  tv-browser_tv_scroll, tv-browser_tv_type, tv-browser_tv_press_key,
  tv-browser_tv_value_overwrite, tv-browser_tv_draw_long_position,
  tv-browser_tv_draw_short_position, tv-browser_tv_draw_fib_retracement,
  tv-browser_tv_draw_rectangle, tv-browser_tv_draw_trend_line,
  tv-browser_tv_draw_horizontal_line, tv-browser_tv_open_drawing_settings,
  tv-browser_tv_zoom, tv-browser_tv_canvas_pan, tv-browser_tv_canvas_zoom,
  tv-browser_tv_set_timeframe, tv-browser_tv_get_view, tv-browser_tv_find_empty_area,
  tv-browser_tv_navigate_to, tv-browser_tv_refine_element_coordinates,
  tv-browser_tv_find_element, tv-browser_tv_find_price_y, tv-browser_tv_find_y_price,
  tv-browser_tv_open_flyout, tv-browser_tv_select_tool, tv-browser_tv_evaluate,
  tv-browser_tv_list_drawings, tv-browser_tv_select_drawing,
  tv-browser_tv_open_drawing_settings_by_id]
```

VERIFY the join char from a live session's tool list after registration (drop the
`tv-browser_` prefix if the runtime exposes bare names). The allowlist REPLACES the
opencode FIREWALL allowlist from §1's T1 chain — one list, one place, agent-scoped.

### 3C — plutus-browser-manager (the manager tool; hardens /container-virtual-display into a runtime engine)

DESIGN LAW (synthesized from the 4 verified trident managers — container-test,
wave-manager, omni-vision, context-synthesis): action-based API over raw shell ·
per-action strict arg allowlists with self-correcting named errors · session-scoped
SQLite state (never a global file; never persist volatile config) · 3-layer
observation channel with persistent cursors (typed records primary, render stream
fallback, point-in-time capture) · status from observed data, never the job
registry · recovery verbs as first-class actions · closed named-error vocabulary ·
no arbitrary timeouts · SHA manifests on exports.

ACTION TABLE (evolve tool `.mimocode/tools/plutus-browser-manager.ts`):
| Action | Strict args | Semantics |
|---|---|---|
| session-up | name, port(630X), profile, gpus? | container (or host-display mode) + Weston/dbus boot (the verified recipe: mkdir /tmp/.X11-unix && chmod 777, XDG_RUNTIME_DIR, dbus-launch, weston --backend=headless-backend.so --xwayland); bounded readiness on the X-socket |
| connect | name | adopt existing browser/container; STATE from evidence (docker inspect, /json/version, profile dir) |
| health | — | composite: container / display(X-socket+weston pid) / CDP HTTP / renderer-liveness WS probe (Runtime.evaluate 1+1 — the zombie-Chrome detector, watchdog:69-99) / tab count / session age |
| gpu-verify | — | the RENDERER probe; PASS token "ANGLE (NVIDIA" (or SwiftShader fallback declared); FAIL tokens WEBGL_UNAVAILABLE/llvmpipe → webgl_unavailable |
| tab-open | symbols[N], layout? | N TradingView tabs, one per symbol; tabId→symbol map into state; returns tabIds |
| tab-focus / navigate / close | tabId | CDP target routing per tab |
| read / check | tabId?, offset/limit, pattern | page-event log with persistent cursor (the container-test cursor law: reset AT truncation, never deferred) |
| capture | tabId?, outPath? | CDP Page.captureScreenshot (rendering-independent — the canon rule) → per-tab PNG + sha256 |
| cookies-save / cookies-load | profile | CDP Storage API + user-data-dir snapshot; SHA manifest; session-validity probe (logged-in marker check — NEVER trust hardcoded loggedIn) |
| restart-display | — | the pkill→dbus→weston→X0-verify recipe; cursors reset atomically |
| restart-browser | hardKill? | kill-by-binary-path + verify loop → GPU-flag relaunch → bounded readiness → TAB LAYOUT RESTORE from state (fixes the current restart-lands-on-TVC:DXY state loss) |
| auth-bridge | port | the container-browser-auth interactive path (CDP screencast + renderer-level input; NEVER x11vnc/xdotool — the XWayland SIGABRT law) |
| status / stop | — | compact tab/display/health view; teardown |

NAMED ERRORS (closed set): not_initialized, container_dead, container_not_found,
display_dead, x11_socket_missing, gpu_missing, webgl_unavailable, cdp_unreachable,
launch_failed, tab_not_found, navigation_timeout, capture_failed, cookies_failed,
port_conflict, singleton_lock_stale, daemon_dead (the exec-cgroup law: every daemon
docker exec -d + nohup + setsid), unknown_action. Every error: code + stage + remedy.

THE FLAG LAW (container-virtual-display, verbatim): ALWAYS --gpus all · ALWAYS
__EGL_VENDOR_LIBRARY_FILENAMES=10_nvidia.json · --use-angle=gl-egl (NEVER =gl) ·
--use-cmd-decoder=passthrough · --ignore-gpu-blocklist · --disable-dev-shm-usage ·
--no-sandbox. Software fallback set (browser-auth canon):
--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --disable-gpu-sandbox.
BANNED: --disable-gpu, --use-angle=gl, host-desktop GUI spawns.

### 3D — THE N-TAB TRADING ENGINE (the target state)

The manager owns ONE dedicated long-horizon browser (profile: docker volume or
bind-mounted container_data/profiles/desktop) with: tab→symbol map (DXY, EUR/USD,
GBP/USD, AUD/USD × TFs); the tv-browser-v3 MCP attached to the MANAGER-ALLOCATED
CDP port — every tv_* call carries an optional tabId the manager resolves (closing
gap #1/#3: tools-across-all-tabs); layout persisted → restart-browser restores the
exact tab set (closing gap #6); cookies long-horizon via profile + validity probe +
the auth-bridge re-login runbook (gap #2); memory-safe rendering per the flag law
with GPU verify on every session-up (gap #4); per-tab vision capture feeding the
agent-reads-PNGs law from §1 P1 (gap #5); health surfaced as an MCP-visible action,
not a log file (gap #7); display recovery wired (gap #8). CDP PLANE UNIFICATION
(gap #9): the old two-browser split (MCP 6930 + harvester 9228) collapses — the
manager's single browser serves both the tv_* tools AND the E3 chart-controller
contract (never-spawn/never-close becomes manager-owned lifecycle); tv-chart-
controller's CDP_ENDPOINT re-points to the manager-allocated port.
