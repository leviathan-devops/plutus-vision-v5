# V6 Audit — E2+E3 Slice (Kev/Limite fork-and-convert map)

- Date: 2026-09-23. Auditor: V6E2E3Audit (scout, read-only).
- Codebase: `/home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent/` (v4.5.3 clean baseline).
- Blueprint: `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT/reports/Plutus_V6_Master_Blueprint_v1.md` (524 lines: Kev §1, Limite §2, TensorTrade §3, merge §4).
- V6 question inventory used below — Kev Call 2 (E2): Q1 current-shape [BS,WL,RWL,R,SS,consol], Q2 day-element [BS_day,WL_day,R_day], Q3 cascade-valid [valid,invalid,partial], Q4 freshness [unmit,1x_80,2x_50,3x]. Kev Call 3 (E3): Q1 direction [long,short,no_trade], Q2 quality-grade Score [F,C,B,A,A+], Q3 session-valid [yes,no], Q4 SL-in-envelope [yes,no], Q5 shield-coverage [yes,no]. Limite math calls: M1 zone-geometry, M2 SL-distance, M3 RRR, M4 fib-levels, M5 commission. Code gates: G-RRR (rrr<2.5→reject), G-SESSION, G-SLENV (SL>cap→reject), G-CONF (conf<B→flag).
- `trade-computer.ts` lives at `src/kernel/trade-computer.ts` (NOT `src/mdve/` — the assignment path was wrong; the file was located via glob).
- Every `current:` cites `file:line` (1-based, grep/read-verified this session).

## E2 — storyline-engine.ts (`src/brains/storyline-engine.ts`, 567 lines)

### MIGRATION — pipSizeFor
  current: JPY/`/`-less/DXY → 0.01 else 0.0001 pip-size selector, `storyline-engine.ts:123`.
  kev_replacement: NONE (unit lookup, not a judgment).
  limite_replacement: NONE (constant table).
  gate: NONE.
  needs_building: 3-line `pip_size(pair)` helper in the V6 state-constructor (Python dict + `if`).
  notes: Pure deterministic mapping; Kev must never be asked unit questions.

### MIGRATION — weekdayOf
  current: ms → UTC weekday name via getUTCDay, `storyline-engine.ts:130`.
  kev_replacement: NONE.
  limite_replacement: NONE.
  gate: NONE.
  needs_building: Nothing (stdlib datetime in state-constructor).
  notes: Display-only; dies with the narrative layer.

### MIGRATION — fmtBand
  current: (bottom,top) → `[x.xxxxx-y.yyyyy]` evidence string, `storyline-engine.ts:135`.
  kev_replacement: NONE.
  limite_replacement: NONE.
  gate: NONE.
  needs_building: Nothing (f-string in logging only).
  notes: Presentation helper; no V6 runtime role.

### MIGRATION — directionOf
  current: DayShapePrediction.direction UP/LONG→BULLISH, DOWN/SHORT→BEARISH, else null, `storyline-engine.ts:142`.
  kev_replacement: E2-Q2 day-element (Kev emits the day element directly; the string-normalization disappears).
  limite_replacement: NONE.
  gate: NONE (null → honest-absence becomes Kev `no_trade`/low-confidence mass).
  needs_building: State-constructor must render prior day direction tokens into Kev state text verbatim.
  notes: A normalization shim around E2 output; Kev subsumes the judgment, code keeps only token rendering.

### MIGRATION — isStructuralZone
  current: zone id not starting `LMV|` → structural, `storyline-engine.ts:152`.
  kev_replacement: NONE (namespace predicate).
  limite_replacement: NONE.
  gate: G-STRUCT (code predicate `not id.startswith('LMV|')` filtering the candidate-zone list BEFORE Kev Call 2).
  needs_building: One-line filter in the V6 gate layer.
  notes: A structural invariant, not a decision; stays as code by the division-of-labor law (§2.4).

### MIGRATION — readContestedZone
  current: keyZoneId → direction-fallback (supply/demandZoneId) → honest-absence; traces zone.pressure (mitigationCount, lifecycle, absorption, eaten-nested-LQZ clause), `storyline-engine.ts:166`.
  kev_replacement: E2-Q1 current-shape + E2-Q4 freshness (Kev reads the rendered pressure state and returns shape + freshness distribution; the resolution-order heuristic becomes state-constructor ordering: key zone rendered first, fallbacks after).
  limite_replacement: NONE.
  gate: NONE (absence → Kev low-confidence, not a throw).
  needs_building: State-constructor renderer for zone.pressure → Kev state text (band, battles, lifecycle, absorption, eaten clause); ordering rule key-zone-first.
  notes: The pressure is READ (stamped by ZR-1), never recomputed — same in V6: E1 output text is Kev Call 2 input.

### MIGRATION — projectNext
  current: next shape = chain's own next step (day-name else positional match); trigger TEXT narrates contested pressure (FORTRESS/≥3x/2x ladder), `storyline-engine.ts:213`.
  kev_replacement: E2-Q1 current-shape (Kev predicts the next shape directly; the chain-lookup becomes training signal, not runtime code).
  limite_replacement: NONE.
  gate: NONE.
  needs_building: FORTRESS/3x/2x trigger doctrine → Kev fine-tune records (arshares doctrine cards §1.8); trigger prose dies (no narrative consumer in V6).
  notes: The shape VALUE migrates to Kev; the trigger TEXT has no V6 replacement by design (V6 emits TradeDecision, not prose).

### MIGRATION — validateBreak
  current: on BS/PBS days, nearest structural zone on broken side (BEARISH→highest DEMAND top below origin; BULLISH→lowest SUPPLY bottom above); validated ⟺ lifecycle BROKEN or pierced; verdicts CLEAN_BREAK/FALSE_POSITIVE/NOT_A_BREAK_CLAIM, `storyline-engine.ts:254`.
  kev_replacement: E2-Q3 cascade-valid [valid,invalid,partial] (the verdict judgment).
  limite_replacement: M1 zone-geometry (origin vs zone-band comparisons: `z.top < origin` / `z.bottom > origin`, nearest-side selection).
  gate: G-CASCADE (code: if Kev Q3 = invalid → halt, per merge-cycle step 6).
  needs_building: Nearest-broken-side-zone selector as a gate-layer helper (port the sort verbatim); FALSE_POSITIVE prose → training record.
  notes: Textbook split — geometry+selection stays code, break-validity judgment moves to Kev, halt stays gate.

### MIGRATION — compareStrength
  current: largest single-direction 2..8-bar close-to-close run per side in pips; ratio ≥1.5 → BULLISH_STRONGER/BEARISH_STRONGER else BALANCED, `storyline-engine.ts:330`.
  kev_replacement: NONE (pure arithmetic scan — Kev never does arithmetic per §2.4).
  limite_replacement: M1-adjacent (windowed displacement scan; Limite or plain code — prefer plain code, it is O(n\u00b78) deterministic).
  gate: G-STRENGTH (code: verdict BALANCED → dampen Kev Q1 confidence weight; ±1.5 ratio is already a threshold gate).
  needs_building: Port 1:1 to Python (index-order scan, strict-greater first-max-wins determinism must be preserved).
  notes: The 1.5 ratio is ALREADY a gate; only the verdict consumer changes (narrative → confidence weight).

### MIGRATION — warframePhaseOf
  current: ShapeCode → TRENCHES/ZOC_CONTEST/BREAKTHROUGH/COUNTER_ATTACK/STABILIZATION switch, `storyline-engine.ts:378`.
  kev_replacement: NONE.
  limite_replacement: NONE.
  gate: NONE.
  needs_building: NOTHING — warframe vocabulary has no V6 consumer (no narrative, no TradeDecision field). DROP.
  notes: Doctrine-flavored display mapping; V6 blueprint carries no phase field. Explicit drop, not an oversight.

### MIGRATION — warframeProse
  current: phase → war-vocabulary sentence, `storyline-engine.ts:403`.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE.
  needs_building: NOTHING. DROP with warframePhaseOf.
  notes: Prose generator; V6 emits no prose.

### MIGRATION — computeMacroArc
  current: prior-week storyline → sweep origin + range + defended/broken counts + summary; null → honest-absence, `storyline-engine.ts:423`.
  kev_replacement: PARTIAL — prior-week context is rendered into Kev Call 2 state ("prior E2 state" per §1.7 Call 2); the summary sentence dies.
  limite_replacement: NONE (counts are trivial code if needed).
  gate: NONE.
  needs_building: Prior-week state renderer (sweep/range/counts as tokens); defended/broken counting stays 2-line code.
  notes: The DATA (2-week context) survives as state; the ARC (prose summary) is dropped.

### MIGRATION — composeNarrative
  current: assembles operator-style paragraph from all 7 components, `storyline-engine.ts:459`.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE.
  needs_building: NOTHING. DROP — V6 has no narrative artifact (TradeDecision only).
  notes: Largest E2 code block by lines, zero V6 replacement by design.

### MIGRATION — capitalize
  current: first-char upper, `storyline-engine.ts:489`. DROP (narrative-only helper).
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE. needs_building: NOTHING.

### MIGRATION — zoneTypeWord
  current: keyZoneType → SUPPLY/DEMAND else direction fallback else ZONE, `storyline-engine.ts:495`. DROP (narrative-only).
  kev_replacement: NONE (Kev Q1 direction consumes the raw zone type token directly).
  limite_replacement: NONE. gate: NONE. needs_building: NOTHING.

### MIGRATION — computeWeekStoryline (export)
  current: total function mapping days → DayStoryline[] + week phase (last non-SS day), `storyline-engine.ts:512`.
  kev_replacement: E2 Call 2 AS A WHOLE (the 4-question forward pass IS the V6 storyline).
  limite_replacement: NONE at this level (delegated per-component above).
  gate: G-CASCADE (invalid → halt) + week-phase reduction dropped (no phase consumer).
  needs_building: The V6 Call-2 harness (state-text builder + 4 questions + probability capture) — ~60 lines Python replacing 567 lines TS.
  notes: This is the E2 seam: everything above is either absorbed into Call 2 state/questions or explicitly dropped.

## E3 — trade-brain.ts (`src/brains/trade-brain.ts`, 1772 lines) + trade-flow-chain.ts (`src/brains/trade-flow-chain.ts`)

### MIGRATION — TradeBrain.constructor
  current: Injects TimesFM/TV/calendar/evidence/OI/replay/workspace/treasury/FRED/EIA clients; inits chain/master-trade/translator/forecast state, `trade-brain.ts:225`.
  kev_replacement: NONE (wiring).
  limite_replacement: NONE.
  gate: NONE.
  needs_building: V6 `TradeCycle` dataclass holding Kev session + Limite client + TensorTrade OMS handles (~30 lines replacing 9 client deps).
  notes: 9-client fan-in is the harness to delete; V6 needs 3 handles (Kev, Limite, TensorTrade).

### MIGRATION — TradeBrain.setZoneMap / setShapePrediction / getLatestSetupSnapshot
  current: v2.0 local-state injection replacing messenger pub/sub (version-stamped), `trade-brain.ts:242` / `trade-brain.ts:251` / `trade-brain.ts:260`.
  kev_replacement: NONE (transport).
  limite_replacement: NONE.
  gate: NONE.
  needs_building: Function args — Kev Call 2 takes E1 output as state text; no snapshot-version protocol needed.
  notes: Messenger-ectomy scaffolding; V6 passes values, not versions.

### MIGRATION — TradeBrain.getMasterTrades
  current: Returns H-06 Avatar-State composites built in constructSetups, `trade-brain.ts:272`.
  kev_replacement: NONE (reporting accessor).
  limite_replacement: NONE.
  gate: NONE.
  needs_building: NOTHING unless TensorTrade reporting wants a composite view — then a 10-line projector over accepted TradeDecisions. Default: DROP.
  notes: See buildMasterTrade card for the substance; the accessor itself is trivial.

### MIGRATION — TradeBrain.applyMultiPairTranslation
  current: DXY zones x per-pair bundles → TranslationResult[] + CrossPairMatrix; confidence boost/penalty on verified setups (≥STRONG +boost, ≤WEAK −penalty), `trade-brain.ts:285` + application at `trade-brain.ts:518`.
  kev_replacement: E2-Q3 cascade-valid (DXY-inverse existence becomes the per-trade inverse-mapping question) + E3-Q2 quality-grade (translation confidence becomes grade mass).
  limite_replacement: NONE.
  gate: G-CASCADE (code: no DXY inverse for non-DXY pair → refuse, mirroring trade-computer.ts:248).
  needs_building: DXY-inverse lookup helper in gate layer (zone-id map, not a translator class); boost/penalty arithmetic → grade-weight in Kev Q2 rendering.
  notes: MultiPairTranslator class dies; the INVARIANT (every FX trade needs its DXY inverse) survives as a gate.

### MIGRATION — TradeBrain.buildPairDataMap (private)
  current: Fetches 4H OHLC per FX pair via tvClient for translation input, `trade-brain.ts:339`.
  kev_replacement: NONE.
  limite_replacement: NONE.
  gate: NONE.
  needs_building: Market-feed fetcher in V6 state-constructor (the same 3-pair fetch, feeding Kev state text instead of a translator).
  notes: Data plumbing, not logic; port the fetch, delete the class it fed.

### MIGRATION — TradeBrain.tick (protected)
  current: Market-hours guard → weekend-backtest-once → Tokyo/off early-out → constructSetups → hash-dedup → firewall → seedChain → TimesFM → VLM-mark → translation-boost → treasury/FRED/EIA penalties → blind-check → TV-draw, `trade-brain.ts:360`.
  kev_replacement: THE V6 CYCLE (merge §4 steps 1-12: feed → state → Call1 → gate → Call2 → gate → Call3 → Limite → G-RRR → Call4 → gate → TradeDecision).
  limite_replacement: Steps 8 (entry/SL/TP/RRR/fib) inside the cycle.
  gate: G-SESSION (market-closed/tokyo/off early-out survives verbatim as the first gate).
  needs_building: ~300-line Python cycle per the merge diagram; each tick sub-step maps below (firewall→gates, TimesFM→Kev-PVE, VLM→DROP, penalties→grade inputs, blind-check→DROP, TV-draw→DROP).
  notes: tick IS the E3 orchestrator; its replacement is the whole V6 runtime. Sub-cards give the per-step map.

### MIGRATION — TradeBrain.runWeekendBacktest (private)
  current: Once-per-process replay harness when market closed, `trade-brain.ts:660`.
  kev_replacement: NONE.
  limite_replacement: NONE.
  gate: NONE.
  needs_building: TensorTrade walk-forward validation (§3.3) replaces the bespoke replay harness.
  notes: Backtest responsibility moves E3→TensorTrade by design.

### MIGRATION — TradeBrain.hashSetups (private)
  current: setupId:entry:direction join for tick-dedup, `trade-brain.ts:684`.
  kev_replacement: NONE.
  limite_replacement: NONE.
  gate: G-DEDUP (code: identical TradeDecision within one cycle → emit once; trade-dedup.ts identity is the fuller replacement).
  needs_building: One-line emission cache in the cycle; full dedup = trade-dedup.ts cards.
  notes: Tick-level noise guard; V6 is request-scoped so this nearly vanishes.

### MIGRATION — TradeBrain.constructSetups (private): entry/SL/TP/RRR core
  current: Per-BoM-zone: direction from zone type; entry = zone edge to spot; SL = opposing edge + SL_BUFFER_PIPS; cap SL_CAP_PIPS; TP = nearest opposing BoM zone; RRR = |TP−entry|/|entry−SL|; skip RRR < MIN_RRR_CONSTRUCTION, `trade-brain.ts:700` (loop `trade-brain.ts:716`, geometry `trade-brain.ts:719` + `trade-brain.ts:734` + `trade-brain.ts:746`).
  kev_replacement: E3-Q1 direction [long,short,no_trade] (replaces zone-derived direction assignment).
  limite_replacement: M1 zone-geometry (entry/SL/TP selection) + M2 SL-distance + M3 RRR.
  gate: G-RRR (rrr < 2.5 → reject — the merge-cycle step 9 gate; MIN_RRR_CONSTRUCTION is its ancestor) + G-SLENV (slPips > cap → reject).
  needs_building: Limite prompt shapes for "nearest opposing BoM zone TP" + gate-layer RRR/SL-cap comparisons (never model-judged per §2.4).
  notes: The geometric SELECTION (which zone is nearest-opposing) is the hard part to port — it becomes a gate-layer helper feeding Limite numbers.

### MIGRATION — constructSetups: category from shape + DXY regime
  current: BS/PBS→BREAKOUT_SURGE; SS→SWING_SCALP; else DXY conviction NEUTRAL→TRANSITION else HTF_SWING, `trade-brain.ts:766` (+ regime `trade-brain.ts:771`).
  kev_replacement: E2-Q1 current-shape + E3-Q2 quality-grade (category becomes grade mass, not an enum assignment).
  limite_replacement: NONE.
  gate: NONE (category thresholds become G-CONF inputs).
  needs_building: Category → grade-band mapping table for training-data conversion (HTF_SWING→A/A+, SCALP→2→B, etc.).
  notes: SetupCategory enum dies; Kev Score options [F,C,B,A,A+] absorb it.

### MIGRATION — constructSetups: 6-check direction validation
  current: DXY-align + BoM-test + zone-direction + confluence-threshold + counter-zone + RRR-check → directionValidation[], `trade-brain.ts:853`.
  kev_replacement: E3-Q1 direction (the decision) + E3-Q5 shield-coverage (the counter-zone/safety check) + E3-Q2 grade (confluence threshold).
  limite_replacement: NONE (RRR-check leg → M3 + G-RRR).
  gate: G-CONF (confluence floor) + G-CASCADE (DXY leg) + G-RRR (RRR leg) — the 6 prose checks become 3 code gates + 2 Kev questions.
  needs_building: Gate predicates for each leg (all currently inline — extract verbatim); rationale STRINGS die (no prose consumer).
  notes: The checks survive as predicates; the `directionValidation[]` ARTIFACT dies (nothing reads it in V6).

### MIGRATION — constructSetups: scalp types 1-4
  current: DWL→double_whiplash_inverse (`trade-brain.ts:937`); LSZ→liquidity_snipe with tight SL/TP rewrite (`trade-brain.ts:942`); SS+BS-next→ss_bs_transition (`trade-brain.ts:957`); else standard (`trade-brain.ts:962`).
  kev_replacement: E2-Q1 current-shape (DWL/SS/BS discrimination) + E3-Q2 grade (snipe → lower grade, not a rewritten SL).
  limite_replacement: M2/M3 recompute IF Kev elects the snipe path (numbers, not branch logic).
  gate: G-SLENV (snipe SL buffer floor) + G-RRR (snipe TP must still clear 2.5).
  needs_building: Snipe/transition doctrine → Kev training records; the inline SL/TP REWRITE (setup.sl/setup.tp mutation) must NOT be ported as code — it becomes a Limite call conditioned on Kev's grade.
  notes: The type-3 rewrite is the riskiest port: it mutates geometry post-hoc. V6 forbids post-hoc mutation — Limite computes once from Kev's direction+grade.

### MIGRATION — constructSetups: fractal/Avatar-State + reinforcement ladder + stop-limit wiring + master-trade loop
  current: detectFractalSignal → isAvatarState + S-tier boost (`trade-brain.ts:973` + `trade-brain.ts:982`); HTF_SWING → buildReinforcementLadder (`trade-brain.ts:994`); buildStopLimitOrders attach (`trade-brain.ts:1003`); Avatar loop → buildMasterTrade (`trade-brain.ts:1015`).
  kev_replacement: E3-Q2 quality-grade Score (Avatar convergence → A+ mass; no score mutation post-hoc).
  limite_replacement: M2/M3 for ladder legs IF grade warrants (ladder math, not ladder class).
  gate: G-CONF (S-tier boost becomes grade threshold, not `Math.max(conf,95)` mutation).
  needs_building: Elemental-convergence doctrine → Kev training data; reinforcement-lobe/master-trade CLASSES die (TensorTrade OMS owns multi-leg execution per §3.4).
  notes: Three classes (elemental-lobe, reinforcement-lobe, master-trade) collapse into one Kev question + TensorTrade legs. The `Math.max(confidence,95)` line is the exact pattern V6 bans (model output mutated by code into false confidence).

### MIGRATION — constructSetups: session-aware category filter + chain-link
  current: London scalp-only; NY swing (+scalp near BoM within NEAR_ZONE_PIP_TOLERANCE); Tokyo/off guard (`trade-brain.ts:1032`); detectChainEntry stamping (`trade-brain.ts:1074`).
  kev_replacement: E3-Q3 session-valid [yes,no] (the filter judgment).
  limite_replacement: NONE (20-pip near-zone check is gate arithmetic: |zoneMid−entry|/pip ≤ tol).
  gate: G-SESSION (code: session×category matrix verbatim) + chain-identity check (trade-chaining.ts cards).
  needs_building: Session matrix as a code table (London→{SCALP}, NY→{SWING,SURGE}+near-zone exception); chain-link becomes TensorTrade/chain-identity gate.
  notes: The filter is ALREADY a gate (returns boolean); only the session SOURCE changes (wall-clock getCurrentSession → bar-timestamp session).

### MIGRATION — TradeBrain.seedChain / notifyTradeClosed
  current: createChain push + log (`trade-brain.ts:1099`); updateChainStatus + prune terminal (`trade-brain.ts:1123`).
  kev_replacement: NONE (lifecycle).
  limite_replacement: NONE.
  gate: NONE.
  needs_building: TensorTrade Portfolio position tracking (§3.1) replaces the in-memory chain list; TP/SL close events come from the OMS, not a notify callback.
  notes: Chain STATE moves E3→TensorTrade; chain GEOMETRY (Law-27) stays — see trade-chaining.ts cards.

### MIGRATION — TradeBrain.applyVlmVerification (private)
  current: Marks vlmStatus=VLM_UNAVAILABLE (VC daemon removed), never rejects, `trade-brain.ts:1149`.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE.
  needs_building: NOTHING. DROP — a no-op marker with no consumer gate (verified filter at tick `trade-brain.ts:498` keeps everything).
  notes: Dead code by its own comment; do not port.

### MIGRATION — TradeBrain.computeOptionsOiScore (private)
  current: investinglive cached strikes → notional → 0-20 score (CRITICAL/MAGNET/MODERATE/LIGHT thresholds), `trade-brain.ts:1165`.
  kev_replacement: E3-Q2 quality-grade INPUT (OI magnet → grade mass; the threshold LADDER becomes training signal).
  limite_replacement: NONE (notional sums are trivial code if kept).
  gate: NONE (score, not a block).
  needs_building: OI-notional renderer into Kev state text; threshold table → fine-tune records.
  notes: External-client dependency (Cloudflare-blocked, falls back 0) — V6 state-constructor should render absence explicitly so Kev learns the no-data regime.

### MIGRATION — TradeBrain.augmentWithTimesFM / clearForecastCache
  current: Per-instrument TimesFM forecast cache + pTpReach/pSlHit augmentation, `trade-brain.ts:1193` / `trade-brain.ts:1249`.
  kev_replacement: Kev Call 4 PVE SCORING (Q1 TP-probability Score, Q2 entry-reachable) — the probabilistic overlay, neural not statistical.
  limite_replacement: NONE.
  gate: G-CONF (PVE confidence < B → flag, merge-cycle step 11).
  needs_building: PVE state renderer (E3 output + ATR + session-remaining); TimesFM client DELETED.
  notes: The forecast-AUGMENTATION pattern (mutating setups in place with pTpReach) is banned in V6 — Kev PVE emits fresh probabilities, gates consume them.

### MIGRATION — computeConfidence (free)
  current: 9-factor sum (confluence/40 + OI/20 + zone-align/20 + redFolder/−10 + ZFP/10 + BoM±10 + DXY/10 + fib/10 + session/5), ceiling + tier map, `trade-brain.ts:1382`.
  kev_replacement: E3-Q2 quality-grade Score [F,C,B,A,A+] (the ENTIRE formula becomes one Kev question; each factor becomes a state token).
  limite_replacement: NONE (fib-hit counting within tolerance is gate arithmetic IF kept as a state feature — count, don't score).
  gate: G-CONF (min-confidence-per-category table → grade floor; getMinimumConfidence `trade-brain.ts:1457` survives as the floor TABLE).
  needs_building: 9-factor → state-token renderer + Score fine-tune records (the 583 mechanism cards §1.8 are the training source); tier thresholds (TIER_*_MIN) → grade-band boundaries.
  notes: This is the single highest-value Kev conversion in E3: 60 lines of hand-tuned weights → one calibrated Score head (ECE 0.089 in-domain).

### MIGRATION — tierFromConfidence (free)
  current: score → S/A/B/C/D/F via TIER_*_MIN, `trade-brain.ts:1444`. Score→band map; survives as the Kev Score → band decoder.
  kev_replacement: NONE (decoder, not judgment). limite_replacement: NONE. gate: G-CONF consumes its output.
  needs_building: Identical table in Python (boundaries must match training labels exactly).
  notes: Keep byte-identical boundaries; the only survivors of the confidence system as code.

### MIGRATION — getMinimumConfidence (free)
  current: category → MIN_CONF_* floor, `trade-brain.ts:1457`. Survives as G-CONF's floor table.
  kev_replacement: NONE. limite_replacement: NONE. gate: G-CONF (setup below floor → excluded).
  needs_building: Floor table in Python keyed by grade-band (category keys remapped per category→grade card).
  notes: A gate already; just re-key it.

### MIGRATION — mapTradingSessionToSessionWindow (free)
  current: TradingSession + wall-clock hour → SessionWindow enum, `trade-brain.ts:1477`.
  kev_replacement: E3-Q3 session-valid (the judgment); the hour-mapping becomes state rendering.
  limite_replacement: NONE.
  gate: G-SESSION (uses its output).
  needs_building: Port using BAR timestamps, not `new Date()` wall-clock (determinism law — the wall-clock read is the defect to fix in porting).
  notes: Wall-clock read inside a deterministic pipeline is the exact non-reproducibility V6 kills.

### MIGRATION — assignDayAndSession / mapSessionStringToEnum (free)
  current: shapeCode → DayShapePrediction match → day+session (fallback: earliest day + LONDON_OPEN), `trade-brain.ts:1499`; substring → enum, `trade-brain.ts:1527`.
  kev_replacement: E2-Q2 day-element (Kev assigns day/session directly; the shapeCode-match lookup disappears).
  limite_replacement: NONE.
  gate: NONE (fallback LONDON_OPEN default → Kev low-confidence mass, not a silent default).
  needs_building: Day-decomposition renderer into Kev Call 2/3 state; the silent-fallback default must NOT be ported (honest low-confidence instead).
  notes: The fallback (`dayDecomposition[0] ?? Monday`) is a fabricate-to-fill pattern — V6 replaces it with calibrated uncertainty.

### MIGRATION — buildStopLimitOrders (export)
  current: Path zones entry→TP → trigger/stop/slPrice/size-ladder orders, `trade-brain.ts:1551`.
  kev_replacement: NONE.
  limite_replacement: M1-adjacent (stop/limit price arithmetic) — or plain code (it is deterministic zone arithmetic).
  gate: NONE.
  needs_building: TensorTrade Broker stop/limit order construction (§3.1: market, limit, stop orders + partial fills) consumes these levels; port the level SELECTION (which zones) verbatim, let the OMS own lifecycle.
  notes: Level selection survives; order lifecycle moves to the OMS.

### MIGRATION — findSlZone (free, H-04)
  current: Nearest structural defense zone beyond entry zone (highest ceiling below / lowest floor above), `trade-brain.ts:1626`.
  kev_replacement: NONE (selection).
  limite_replacement: M2 SL-distance (consumes the SL zone's edge).
  gate: NONE (helper to M2).
  needs_building: Verbatim port (the sort comparator is the spec).
  notes: Pure selector; feeds Limite.

### MIGRATION — computeEntryPrecision (free, H-04)
  current: 6 reference points (frontEdge/middleZone/backEdge/slZoneFront/slZoneMiddle/slZoneBack), `trade-brain.ts:1659`.
  kev_replacement: NONE.
  limite_replacement: M1 zone-geometry (the 6 points are Limite's INPUT levels).
  gate: NONE.
  needs_building: Verbatim port; outputs become Limite prompt numbers.
  notes: Reference-point computation, not a decision.

### MIGRATION — SCALED_ENTRY_WEIGHTS (const, H-05)
  current: [0.33,0.33,0.34], `trade-brain.ts:1694`. Survives as TensorTrade position-sizing weights.
  kev_replacement: NONE. limite_replacement: M5-adjacent (size × weight → notional) or plain code.
  gate: NONE (assert sum==1.0 in port).
  needs_building: One-line constant + sum-assertion; MUST match STAGGER_WEIGHTS in trade-dedup.ts:57 (same frozen ladder — converge to one constant).
  notes: Two copies of the frozen ladder exist (here + dedup); V6 keeps ONE.

### MIGRATION — buildMasterTrade (free, H-06)
  current: Avatar-gated rocket composite (ladder legs → rockets + same-direction Avatar setups, cap 7), `trade-brain.ts:1704`.
  kev_replacement: E3-Q2 grade A+ (the convergence judgment).
  limite_replacement: NONE at this level (leg math delegated to ladder cards).
  gate: NONE.
  needs_building: TensorTrade multi-leg composition replaces the MasterTrade OBJECT (§3.4: TensorTrade owns execution composition).
  notes: Object-composition moves to the OMS; the cap-7 constant moves with it.

### MIGRATION — trade-flow-chain.ts: nextChainId / lastSetup / isDirectionFlip / entryNearTp
  current: Monotonic id (`trade-flow-chain.ts:63`); tip accessor (`trade-flow-chain.ts:69`); NEUTRAL-safe flip predicate (`trade-flow-chain.ts:79`); %-tolerance proximity (`trade-flow-chain.ts:90`).
  kev_replacement: NONE (all mechanics).
  limite_replacement: NONE (entryNearTp arithmetic stays code).
  gate: G-CHAIN (code: flip-required + proximity-required, evaluated in the gate layer).
  needs_building: Verbatim port of the two predicates; id generation → deterministic (`chain-N` counter, NOT Date.now() — the wall-clock in nextChainId is a determinism defect to drop).
  notes: `Date.now().toString(36)` inside an id is the exact non-determinism V6 bans.

### MIGRATION — trade-flow-chain.ts: createChain / detectChainEntry / appendChain / updateChainStatus / nextChainPosition
  current: Origin stamp (`trade-flow-chain.ts:105`); TP-coincidence + flip scan (`trade-flow-chain.ts:135`); tip-append (`trade-flow-chain.ts:179`); tp/sl status machine (`trade-flow-chain.ts:238`); position counter (`trade-flow-chain.ts:264`).
  kev_replacement: NONE (chain mechanics are deterministic).
  limite_replacement: NONE.
  gate: G-CHAIN (the whole set evaluates as code gates around TensorTrade fills).
  needs_building: Chain STATE → TensorTrade Portfolio (open legs keyed by TP); chain DETECTION (detectChainEntry predicate) → gate-layer helper; status machine → OMS fill callbacks (tp → open next link; sl → mark broken).
  notes: State lives in the OMS, predicates live in gates, nothing lives in Kev.

### MIGRATION — kernel/trade-computer.ts: computeTrades (export) + refuse + RRR_FLOOR
  current: Card+5-verdict validation → CandidateLink[] → TradeProjection[]; refuse() throws per-code (INVALID_CARD/VERDICTS/INPUT, PROVENANCE_INCOMPLETE, CASCADE_FAIL, FIB_MISMATCH, CONFLUENCE_FAIL, RRR_FLOOR_VIOLATION); RRR_FLOOR=2.5 (`trade-computer.ts:9`), `computeTrades` (`trade-computer.ts:96`), `refuse` (`trade-computer.ts:167`), RRR check (`trade-computer.ts:222`).
  kev_replacement: E2-Q3 cascade-valid (CASCADE_FAIL leg) + E3-Q1 direction (designation-link leg `trade-computer.ts:225`) + E3-Q2 grade (CONFLUENCE_FAIL leg).
  limite_replacement: M4 fib-levels (FIB_MISMATCH leg → Limite recompute + compare) + M3 RRR (floor leg → recompute + compare).
  gate: THE GATE PROTOTYPE — every refuse() code maps 1:1 to a V6 gate: INVALID_CARD/VERDICTS/INPUT → input-schema gate; PROVENANCE_INCOMPLETE (`trade-computer.ts:179` anchored-set + `trade-computer.ts:238` overlay-row) → provenance gate; CASCADE_FAIL (`trade-computer.ts:248` DXY-inverse) → G-CASCADE; FIB_MISMATCH (`trade-computer.ts:242`) → fib gate; RRR_FLOOR_VIOLATION → G-RRR.
  needs_building: Port the refuse-code ENUM verbatim as V6 gate codes (it is the best-specified gate contract in the codebase); TradeProjection shape → TradeDecision shape (entryZoneRef/slZoneRef/tpZoneRef + provenance become zone-anchored II fields per R29 — no price anchoring).
  notes: trade-computer.ts is the closest thing v4.5.3 has to the V6 gate layer — its LOUD-FAIL semantics (throw, never substitute) are the Failure-Semantics law already implemented. Keep the codes, replace the card/zone plumbing with Kev+Limite outputs.

## E3 — mdve/setup-gen.ts (`src/mdve/setup-gen.ts`, 1376 lines, the DXY source-trade emitter)

### MIGRATION — dayKeyOf
  current: candle ms → UTC YYYY-MM-DD ISO day key (§8.4 dedup-key component), `setup-gen.ts:147`.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE (key builder for G-DEDUP identity).
  needs_building: One-line date helper in gate layer (identity key needs it).
  notes: Deterministic stdlib; port verbatim.

### MIGRATION — SESSION_RANK + SESSION_DISPLAY
  current: SessionLabel total order TOKYO0/LONDON1/NY2/OFF3 (`setup-gen.ts:155`); display map TOKYO→LONDON_OPEN, LONDON→LONDON_MID, NY→NY_MID, OFF→NY_CLOSE (`setup-gen.ts:165`).
  kev_replacement: E3-Q3 session-valid (the ORDER feeds the session question; the DISPLAY map dies — TradeDecision carries canonical session, not ET-window display).
  limite_replacement: NONE. gate: G-SESSION (RANK survives as sort key; DISPLAY dropped).
  needs_building: RANK table port; DISPLAY deleted ("DISPLAY-ONLY — nothing in the cascade reads this field" per its own doc).
  notes: The file itself marks DISPLAY as unread — V6 takes the hint.

### MIGRATION — significanceOf
  current: OB+1000, BoM+100, TF-rank×10, zfp/100 — TOTAL cross-structure-merge comparator, `setup-gen.ts:173`.
  kev_replacement: E3-Q2 quality-grade (significance becomes grade mass; the merge it served becomes G-DEDUP keep-highest-significance).
  limite_replacement: NONE. gate: G-DEDUP (tiebreak comparator survives inside the merge gate).
  needs_building: Comparator port into dedup gate; weight table → Score training records.
  notes: A ranking that is half gate (total order) half judgment (BoM>MoM weights) — split exactly on that line.

### MIGRATION — defaultCategoryFor
  current: 4H-or-BoM → HTF_SWING else SWING_SCALP, `setup-gen.ts:182`.
  kev_replacement: E3-Q2 quality-grade (category inference becomes grade mass).
  limite_replacement: NONE. gate: G-CONF (floor lookup key remap, same as trade-brain category card).
  needs_building: 2-row mapping table for training-data conversion.
  notes: Trivial but load-bearing (every setup's floor derives from it); keep the rule as a label during fine-tune, then let Kev own it.

### MIGRATION — confidenceOf + tierOf
  current: 75 + BoM10 + 4H5 + min(10,zfp/10), cap 95 (`setup-gen.ts:192`); S/A/B/C/D/F bands (`setup-gen.ts:200`).
  kev_replacement: E3-Q2 quality-grade Score (the whole formula → one Score head).
  limite_replacement: NONE. gate: G-CONF (tier bands survive as grade decoder — same as tierFromConfidence card; converge to ONE band table).
  needs_building: Formula → fine-tune records; bands → shared Python decoder (dedupe with trade-brain TIER_*_MIN).
  notes: Second copy of the hand-tuned-confidence pattern (see computeConfidence card); same conversion.

### MIGRATION — generateSourceSetups (v44 export) / generateSourceSetupsV45 (v45 export)
  current: Thin geometry selectors over generateSourceSetupsImpl (v44 = front-edge/mirror-SL/mirror-TP; v45 = defendedEdge/LMV-SL/refined-TP), `setup-gen.ts:228` / `setup-gen.ts:261`.
  kev_replacement: NONE at this level (dispatch flag, not judgment).
  limite_replacement: M1/M2/M3 (the two geometries are two Limite prompt shapes).
  gate: NONE (the v44 path is the frozen fallback: keep as code fallback when lmvZone==null).
  needs_building: Geometry-flag → Limite prompt selector ("LMV-refined" vs "honest-degradation v44"); v44 path kept as the no-LMV-overlap fallback per §12 Law 3.
  notes: The ADDITIVE-refinement structure (v44 untouched, v45 additive) is the correct fallback pattern — V6 keeps it.

### MIGRATION — lmvZoneForStructure
  current: Side-filtered band-overlap pool; OB-kind → probe-side filter + |defendedEdge−probe| rank; LQZ-kind → candles/zfp/defense-edge rank, `setup-gen.ts:294`.
  kev_replacement: NONE (candidate selection).
  limite_replacement: M1 zone-geometry (its OUTPUT rung is Limite's entry/SL anchor input).
  gate: NONE (helper feeding M1/M2).
  needs_building: Verbatim port (the probe-side predicate — "defendedEdge on the defended side of the battle probe" — is the entry-precision doctrine; the sort chain is the spec).
  notes: The most intricate selector in E3; feeds Limite, never Kev (Kev never sees candidate ranking, only the selected anchor rendered as state).

### MIGRATION — centerOfLmvZoneId
  current: Trailing-number regex over `LMV|pair|center` ids, `setup-gen.ts:333`.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE.
  needs_building: Same regex in gate layer IF the `LMV|pair|center` id namespace survives; else DROP (V6 zone ids are its own choice).
  notes: Namespace-coupled helper; port iff ids port.

### MIGRATION — qDist
  current: Round to 1e-6 comparator-stability guard, `setup-gen.ts:347`.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE (float-hygiene helper used by all rung comparators).
  needs_building: One-line helper wherever rung comparisons port (internal-rung pick, earth selection).
  notes: Epsilon-guard; keep anywhere floats decide picks.

### MIGRATION — RWL_BOUNCE_INSET_PIPS / RWL_HAIR_MISS_RRR_DELTA / RWL_SHELF_LONG_ADJUST_PIPS
  current: 0.2p bounce-inset, 0.1 hair-miss band, 1p shelf best-fill (`setup-gen.ts:364` / `setup-gen.ts:365` / `setup-gen.ts:370`).
  kev_replacement: NONE (constants).
  limite_replacement: M1/M2 consume them (bounce entry = entry−0.2p; shelf entry = floor+1p).
  gate: G-RRR hair-miss window ([floor−0.1, floor) arms the bounce recompute at `setup-gen.ts:1090`).
  needs_building: Three constants + window predicate in gate layer; values are operator-measured (Wednesday RWL case) — do not retune.
  notes: Measured constants, not magic numbers; the hair-miss window is already a gate.

### MIGRATION — internalLmvRungEntry (incl. F1-E recovery shelf)
  current: Internal-LMV-rung near-edge entry (candles-count + sweep-edge rank); prior-week-OB-LONG → floor-shelf search (BUY_SIDE above anchor, day-reach, defended-transit + ≥2 closes) → shelf floor+1p + transitMs, `setup-gen.ts:414` (shelf return `setup-gen.ts:463`).
  kev_replacement: E3-Q1 direction (LONG here) + E3-Q2 grade (shelf-vs-sweep usability becomes grade mass).
  limite_replacement: M1 zone-geometry (the returned entry price IS Limite's entry input; the shelf band feeds M2's probe exclusion).
  gate: NONE (selector, not a block — caller falls back to defendedEdge on null).
  needs_building: Verbatim port (the shelf predicate chain — side/reach/transit/closes/lowest-band — is the spec; transitMs → activation timestamp).
  notes: Earth-vs-reinforcement doctrine ("near edge = trade, defendedEdge = reinforcement, separate trade") must survive as training signal so Kev does not merge the two.

### MIGRATION — sourceLaneShapeDayFor
  current: Fire (strongest opposing S/D beyond entry CONTAINING an internal LMV rung; BoM>MoM, zfp, near-edge) + Earth (internal rung nearest near-edge) → projected `pair|LMV|center` id + price cap for the refinement machine, `setup-gen.ts:518`.
  kev_replacement: E2-Q3 cascade-valid (the Fire selection IS the cascade target judgment, rendered as state for Kev to confirm).
  limite_replacement: M3 TP-target (Earth defendedEdge → Limite TP; day-projected price caps repair stretch).
  gate: G-TP-CAP (code: repair TP must not exceed projected price — the anti-stretch cap).
  needs_building: Fire/Earth selector port verbatim (qDist near-edge ranks are the spec); projected-id format must match Limite TP prompt convention.
  notes: The "TP resolves from the opposing zone's GEOMETRY, never E2 price fields" (ZR-6A/B) ruling is V6-native already (zone-anchored, R29).

### MIGRATION — generateSourceSetupsImpl: battle-group + freshness gate (§2)
  current: (structure,day,session) groups over sorted events; admissibility at battle time: battle-index ≤3 (≤3rd touch), no prior pierce, pierced excluded, window [fromMs,toMs], `setup-gen.ts:596` loop with grouping `setup-gen.ts:690`.
  kev_replacement: E2-Q4 freshness [unmit,1x_80,2x_50,3x] (the admissibility JUDGMENT; 4th-touch/violated → 3x_TP-only mass).
  limite_replacement: NONE.
  gate: G-FRESH (code: i>2 skip + violated skip survive verbatim as the hard gate; Kev Q4 modulates grade, the gate blocks).
  needs_building: Grouping+gate port verbatim (event-order index is the consumption count; pierce-terminal rule is the invariant).
  notes: The gate/question split is cleanest here: code blocks the 4th touch, Kev prices the 1st-3rd.

### MIGRATION — generateSourceSetupsImpl: defended-transit detection (F1-B)
  current: LQZ+v45 only: nearest-center LMV row → first-transit-per-direction → probe-and-reclaim/transit predicate → TRANSIT_DEFEND candidate (no-dup vs reaction groups), `setup-gen.ts:700` block.
  kev_replacement: E2-Q1 current-shape (transit-defend → RWL/SS shape mass) + E3-Q2 grade.
  limite_replacement: M1 (rung CENTER entry — transit candidates anchor center, not defendedEdge).
  gate: G-DEDUP (groups.has(key) check survives as the no-double-emit guard).
  needs_building: Predicate port verbatim (open-beyond/close-center/body≥50% + reclaim variant); Law-31 first-transit-only rule survives as code.
  notes: The transit rung-CENTER entry (vs defendedEdge) must reach Limite as a distinct prompt shape, or V6 re-merges what F1-B split.

### MIGRATION — generateSourceSetupsImpl: SL/TP geometry + PROBE_GUARD (§3)
  current: v45 → computeSL_LMV (+PROBE_GUARD: SL inside own battle probe → probe±Law7 buffer, `setup-gen.ts:960`); v44 → computeMirrorSL; TP → Law-14 walk (passThroughWeakWalls in v45) or transit-near-rung computeLmvTP; recovery-shelf tight-SL + projected-TP override (`setup-gen.ts:1010`).
  kev_replacement: E3-Q4 SL-in-envelope [yes,no] (the envelope judgment); E2-Q3 cascade-valid (TP wall selection).
  limite_replacement: M2 SL-distance + M3 RRR + TP-walk arithmetic (the walks are deterministic rung arithmetic — port as code OR Limite; prefer code for the walk, Limite for the distances).
  gate: G-SLENV (floor/ceiling check) + G-RRR (Law-14 ≥1.2×SL precondition) + probe-guard predicate (structural correctness, keep verbatim).
  needs_building: Walk comparators ported 1:1; PROBE_GUARD ("entry was EARLY, not SL wide") survives as a pre-gate before any SL is accepted.
  notes: The shelf-F1-E override ("NEVER a machine repair") is V6-shaped already: proven levels emitted directly, no post-hoc fixup.

### MIGRATION — generateSourceSetupsImpl: RWL bounce-inset recompute (F1-D)
  current: v45 LONG + internal-rung entry + RRR in [floor−0.1, floor) → entry−0.2p, recompute SL/TP via same machinery, emit iff ≥floor (`setup-gen.ts:1090`).
  kev_replacement: NONE (deterministic repair attempt, not a judgment).
  limite_replacement: M1/M2/M3 recompute at the bounce entry (one extra Limite call, same prompts, shifted entry).
  gate: G-RRR hair-miss window (arms the attempt) + floor (accepts the result).
  needs_building: Bounded-retry wrapper (one attempt, LONG-only, internal-path-only — the SCOPE guard is the spec).
  notes: The anti-pattern it avoids (machine floor-adjust pulling entry INTO the sweep) must be a training negative: bounce goes UP into the ceiling, never down.

### MIGRATION — generateSourceSetupsImpl: refinement-machine repair (R2)
  current: RRR-failed v45 setups → refineSetup ≤3 surgical attempts on SAME anchors → emit repaired (🔧 annotation) or hard-reject with 3-attempt audit trail (`setup-gen.ts:1115` block).
  kev_replacement: E3-Q2 grade (repair changes GRADE, not geometry-behind-Kev's-back — V6 inverts the order: Kev grades first, Limite places once).
  limite_replacement: M1/M2/M3 (the repair ATTEMPTS become alternative Limite placements conditioned on Kev's grade, not post-hoc fixups).
  gate: G-RRR (floor binds repairs equally) + audit-trail reject reason (D36 survives as the reject-reason string).
  needs_building: Repair-attempt budget (≤3) + same-anchor constraint ported as Limite-call policy; 🔧 annotation → TradeDecision provenance flag.
  notes: The doctrine ("RRR-failed \u2260 dead analysis — E/SL/TP wrong on correct analysis") survives; the MECHANISM inverts (place-from-grade vs repair-to-floor). refinement-machine.ts itself is OUT of E2/E3 slice scope — flagged for the owner of that slice.

### MIGRATION — generateSourceSetupsImpl: shelf dual-entry (FIX5/FIX4) + cross-structure merge + final order (§4-5)
  current: LQZ battle-bucket edge Δ15p from defendedEdge → separate BATTLE_ORIGIN trade via same SL/TP machinery (`setup-gen.ts:1271`, separation `setup-gen.ts:1287`); merge: same (day,session,direction) + |Δentry|≤mergeTolerance keeps highest significance, BATTLE_ORIGIN never merge-killed (`setup-gen.ts:1335`); final battle-chronology sort (`setup-gen.ts:1355`).
  kev_replacement: E3-Q2 grade (origin-vs-reinforcement separateness becomes training signal so Kev prices both, never merges).
  limite_replacement: M1/M2/M3 per edge (each edge walks the rungs from its own level).
  gate: G-DEDUP (merge predicate + 15p one-trade band + BATTLE_ORIGIN immunity survive verbatim as the emission gate).
  needs_building: 15p band + 3p-bucket + mergeTolerance (Law7-buffer width) constants ported; merge comparator = significanceOf card.
  notes: The operator quote ("origin vs reinforcement = 2 separate trades; 5-15p = legs, 30p+ = separate") is a first-class fine-tune record — the highest-value E3 doctrine card in the file.

## E3 — mdve/trade-chaining.ts (`src/mdve/trade-chaining.ts`, Law-27 propagation engine)

### MIGRATION — isLateSession
  current: /NY|OFF/ → late (next-day); /TOKYO|LONDON|London/ → early (same-day); unknown → late-conservative, `trade-chaining.ts:91`.
  kev_replacement: E3-Q3 session-valid (the day-rule judgment consumes this classification).
  limite_replacement: NONE.
  gate: G-SESSION (the early/late branch at chainOne step 7 is already a gate).
  needs_building: Verbatim port (the unknown→late default is a conservative gate, keep it).
  notes: Session regexes must match canonical + display forms (London vs LONDON) — the sessionRank helper at `trade-chaining.ts:275` carries the same dual-form logic; port both.

### MIGRATION — chainedSessionOf
  current: sameDay → NY else LONDON (scalps react London, swings NY), `trade-chaining.ts:103`.
  kev_replacement: E3-Q3 session-valid (validates the propagated session).
  limite_replacement: NONE.
  gate: G-SESSION (assignment, not a block).
  needs_building: One-line map in gate layer.
  notes: Operator weekly-rhythm doctrine; becomes a training record for Q3.

### MIGRATION — nextTradingDay
  current: Pure ISO-day +1 with Sat→Mon +2 / Sun→Mon +1 roll (FX Mon–Fri week), `trade-chaining.ts:112`.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE (date helper).
  needs_building: Verbatim port (the weekend-roll is the spec; unparseable→unchanged guard stays).
  notes: Deterministic stdlib-grade; no model touches dates.

### MIGRATION — chainIdentity
  current: pair|direction|anchorBucket(entry)|day (§1.2 canon, additive-safety seed), `trade-chaining.ts:129`.
  kev_replacement: NONE. limite_replacement: NONE.
  gate: G-DEDUP (the seen-set suppression in generateChainedTrades IS the gate; this builds its key).
  needs_building: Reuse the ONE anchorBucket (see dedup card — converge imports, chaining already imports from trade-dedup.js at `trade-chaining.ts:48`).
  notes: Identity keys are gate infrastructure; V6 keeps the exact string format so TensorTrade legs and dedup agree.

### MIGRATION — selectEntryZone
  current: E1 zones containing entry (excl. IP| overlay bands); prefer opposing-type (LONG→DEMAND), then BoM>MoM, lowest zfp, highest confluence, id tiebreak, `trade-chaining.ts:142`.
  kev_replacement: NONE (selection). E2-Q3 cascade-valid consumes the selected zone downstream.
  limite_replacement: NONE (feeds M2's SL computation via entryZone.id → computeLadderStepsSL).
  gate: NONE (helper; honest-absence null → chainOne no-emission).
  needs_building: Verbatim port (the 5-key sort is the spec; IP| exclusion is §8.1 doctrine).
  notes: The BoM/zfp/confluence preference ladder should ALSO become Q2 training signal (why this zone, not the neighbor).

### MIGRATION — chainedTargetTp
  current: First STRUCTURAL opposing wall beyond entry (excl. LMV|/IP|, isStructuralWall-gated); STRONG→close-edge∓1.5p spread, WEAK→far edge, MIDDLE→near edge, `trade-chaining.ts:171` (strength branch `trade-chaining.ts:186`).
  kev_replacement: E2-Q3 cascade-valid (wall validity judgment).
  limite_replacement: M1 zone-geometry (the returned TP price IS a Limite TP input) + M3 RRR (validates it).
  gate: G-TP-STRUCT (code: no structural wall → honest absence, never a fabricated far target).
  needs_building: Port selector verbatim (ZR-3.4 pass-through doctrine + ZR-3.2 strength ladder are the spec); classifyZoneStrength/isStructuralWall are mirror.js deps — port or import them as gate helpers.
  notes: The 1.5p spread adjustment on STRONG walls is measured execution doctrine; keep the constant.

### MIGRATION — chainOne
  current: Single-generation Law-27 propagation: flip direction → entry=parent TP → selectEntryZone → computeLadderStepsSL → chainedTargetTp → side-sanity → RRR∈[categoryFloor, MAX_CHAIN_RRR] → day/session propagate → provenance (CHAIN-id, depth+1), `trade-chaining.ts:197` (SL `trade-chaining.ts:210`, RRR `trade-chaining.ts:231`).
  kev_replacement: E3-Q1 direction (the flip is deterministic, but Kev confirms the reaction direction has grade mass — a no_trade on the flip kills the chain).
  limite_replacement: M2 (ladder-steps SL via mirror helper) + M3 (RRR both bounds).
  gate: G-CHAIN (the whole function evaluates as a gate chain: every null return is a named honest-absence; the RRR floor + Law-13 ceiling `trade-chaining.ts:231` are already gates).
  needs_building: BFS driver stays (see next card); computeLadderStepsSL (mirror.js) → M2 prompt or ported helper; Law-13 MAX_CHAIN_RRR=15 (`trade-chaining.ts:47`) survives as the realism-ceiling gate.
  notes: chainOne is the best-structured E3 function for V6: it ALREADY returns null instead of fabricating (Failure-Semantics law implemented). Port the shape, swap the internals.

### MIGRATION — generateChainedTrades (export)
  current: BFS to maxDepth=3 over session-ranked queue; in-engine §1.2 identity dedup (primaries seeded, collisions suppressed) → additive-safe emission, `trade-chaining.ts:265` (rank `trade-chaining.ts:275`, queue `trade-chaining.ts:281`).
  kev_replacement: NONE (search mechanics).
  limite_replacement: NONE.
  gate: G-DEDUP (in-engine suppression) + G-CHAIN (depth bound: chains run 1–3 deep per operator).
  needs_building: BFS + seen-set port verbatim; maxDepth default 3 stays; TensorTrade consumes the emitted legs as OMS-tracked continuations.
  notes: The EMITS-new-rows-never-mutates contract (header `trade-chaining.ts:29`) is V6-native; keep it as the chaining invariant.

## E3 — mdve/trade-dedup.ts (`src/mdve/trade-dedup.ts`, 524 lines, stats-integrity engine)

### MIGRATION — ANCHOR_TOLERANCE_PIPS / DEFAULT_ANCHOR_TOLERANCE_PIPS / STAGGER_WEIGHTS / MAX_MIRRORS_PER_ANCHOR_PER_DAY
  current: 3p uniform tolerance table (`trade-dedup.ts:44`) + default 3 (`trade-dedup.ts:49`); frozen [0.33,0.33,0.34] ladder (`trade-dedup.ts:57`); 1 mirror/anchor/day cap (`trade-dedup.ts:65`).
  kev_replacement: NONE (constants). limite_replacement: NONE (weights feed M5 sizing).
  gate: G-DEDUP (all three constants parameterize the dedup/emission gates).
  needs_building: Single constants module in V6 gate layer; MUST deduplicate against SCALED_ENTRY_WEIGHTS (`trade-brain.ts:1694`) — two copies of one frozen ladder today.
  notes: The uniform-3p table makes anchorBucket pair-agnostic in practice; keep the table shape (per-pair override point) anyway.

### MIGRATION — anchorOf (export)
  current: entryZone.defendedEdge ?? entry (§1.2 anchor), `trade-dedup.ts:142`.
  kev_replacement: NONE. limite_replacement: NONE (anchor feeds M1 identity, not math).
  gate: G-DEDUP (key builder).
  needs_building: One-line port; the defendedEdge-fallback order is the spec (never entry-first).
  notes: Anchor discipline (defendedEdge, not geometric edge) is shared with sl-lmv/entryPrice — keep consistent.

### MIGRATION — anchorBucket (export)
  current: round(anchor / (tolPips × PIP[pair])), `trade-dedup.ts:147`.
  kev_replacement: NONE. limite_replacement: NONE. gate: G-DEDUP (the bucket IS the dedup resolution).
  needs_building: THE shared helper (chaining imports it; V6 gate layer owns one copy).
  notes: 3p buckets are the dedup resolution for trades AND zones (dedupZonePool) — one function, three consumers.

### MIGRATION — tradeIdentity (export)
  current: pair|direction|anchorBucket|day, NO session (zone+day IS the trade), `trade-dedup.ts:157`.
  kev_replacement: NONE. limite_replacement: NONE. gate: G-DEDUP (the identity string).
  needs_building: Verbatim port (the no-session canon is load-bearing — session variants merge as stagger legs, never separate trades).
  notes: The identity format must match chainIdentity exactly (same buckets) or chaining/dedup disagree.

### MIGRATION — mergeGroup (private) / dedupTrades (export)
  current: Chronological (triggerMs,entry,setupId) sort → E1/E2/E3+ legs with frozen weights; blended entry Σw·e/Σw (normalized — documents the >3-leg GU×10 deviation); ONE SL/TP from first leg; provenance join (`trade-dedup.ts:185`); group-by-identity in sorted-identity order, ANCHOR_DUPLICATE vs STAGGER_LEG_MERGE naming (`trade-dedup.ts:223`).
  kev_replacement: NONE (mechanics; the grade each leg carried is already decided).
  limite_replacement: M3 blendedRrr (next card) recomputes risk on the blend — merge itself stays code.
  gate: G-DEDUP (this IS the gate: N rows → ONE trade; the droppedDuplicates naming is the audit trail).
  needs_building: Verbatim port including the normalization deviation (raw Σw·e breaks for >3 legs — the comment's GU×10 arithmetic proof is the spec); keep the TOTAL leg sort (byte-identical ties).
  notes: The stagger ladder (legs, not trades) is the execution shape TensorTrade inherits — dedup output rows map to OMS multi-leg fills.

### MIGRATION — blendedRrr (export)
  current: Weight-normalized Σ w·(|TP−entry_leg|/|entry_leg−SL|) over stagger legs (degenerate zero-risk legs contribute nothing), `trade-dedup.ts:282`.
  kev_replacement: NONE. limite_replacement: M3 RRR (the per-leg division + weighted sum is Limite-verifiable arithmetic; or plain code — prefer code, it is exact).
  gate: G-RRR (blended RRR < floor → reject the merged trade, not just the legs).
  needs_building: Port verbatim (weightSum normalization must match mergeGroup or blend and RRR disagree).
  notes: Plain-RRR reduction for non-staggered trades keeps one code path.

### MIGRATION — capMirrorEmission (export)
  current: (pair,anchor-bucket,day) first-wins cap at 1 (FX anchor, never DXY source id), `trade-dedup.ts:313`.
  kev_replacement: NONE. limite_replacement: NONE. gate: G-DEDUP (the GU×10 kill — this exact predicate).
  needs_building: Verbatim port (input order = provenance strength is the fairness rule; EMISSION_CAP reason strings survive as gate audit).
  notes: The cap key deliberately excludes source-setup id (N DXY sources → ONE FX emission) — keep that exclusion.

### MIGRATION — qualifyConsumedPoolReadmission (export)
  current: Consumed-anchor re-admission iff ≥1 rejection-anatomy battle in-week AND vol-cleared re-anchored SL (reasons array, admitted = empty), `trade-dedup.ts:364`.
  kev_replacement: E2-Q4 freshness (REACTIVE vs consumed is a freshness judgment) + E3-Q4 SL-in-envelope (vol-clear is an SL judgment).
  limite_replacement: NONE (battle counting is trivial code).
  gate: G-FRESH (the two predicates survive as code gates; cap enforced separately by capMirrorEmission — the compose rule in the doc comment).
  needs_building: Port predicates; reasons[] strings → gate audit trail (keep the §4.4.2/§4.4.3 citations).
  notes: Requirement-1-excluded-by-design (cap composes separately) — preserve the composition, do not fold the cap in.

### MIGRATION — dedupZonePool (export)
  current: Upstream (pair,class,anchor-bucket) zone dedup at 3p tolerance, first-wins, ZONE_POOL_DUPLICATE reasons — kills the ×3 zone-map duplication at the ROOT GENERATOR, `trade-dedup.ts:404`.
  kev_replacement: NONE (upstream hygiene). limite_replacement: NONE.
  gate: G-ZONE-HYGIENE (runs BEFORE Kev Call 2 — Kev must never see the same zone 3×).
  needs_building: Run at state-construction time over the E1 zone list; keep first-wins (input order = provenance).
  notes: Highest-leverage dedup card: every downstream duplicate (trades, emissions, chains) is cheaper to kill here than anywhere else.

### MIGRATION — RowCountIntegrityError / isRowCountIntegrityError / assertRowCountIntegrity / toDedupSetup
  current: |rows|==|uniqueTrades| + identity-multiset match CI assertion naming every duplicate (`trade-dedup.ts:444` + `trade-dedup.ts:453` + `trade-dedup.ts:466`); TradeSetup→DedupSetup adapter (weekday display → ISO day, defendedEdge anchor, direction normalization, `trade-dedup.ts:506`).
  kev_replacement: NONE. limite_replacement: NONE.
  gate: G-DEDUP-ASSERT (the CI assertion becomes a V6 emission invariant: every cycle's emitted rows pass it or the cycle FAILS LOUD — same throw semantics).
  needs_building: Port assertion verbatim (multiset-compare catches disguised mismatches, not just count drift); port adapter (the ISO-day ownership rule — "the pipeline owns battle timestamps" — survives).
  notes: The assertion caught all 23 audit duplicates (6 DXY + 7 EU + 10 GU); it is the regression guard for the whole E3 slice — promote it to the V6 cycle's post-emission check.

## E2/E3 feed — mdve/ob-engine.ts (`src/mdve/ob-engine.ts`, 505 lines; E1-adjacent but E2/E3 consume its output directly)

### MIGRATION — MDVE_TIMEFRAMES / MDVE_TF_OB_PARAMS
  current: 4H+1H+30m ALWAYS (`ob-engine.ts:47`); 1H 300-bar/30p/36-bar/25p + 30m 576-bar/20p/48-bar/15p with BECAUSE comments (`ob-engine.ts:65`).
  kev_replacement: NONE (detection scope constants).
  limite_replacement: NONE.
  gate: NONE.
  needs_building: Detection-scope config in V6 state-constructor (same bars, same floors); keep the BECAUSE comments — they are the calibration record.
  notes: Out-of-slice (E1 detection) but E2-shape quality depends on the 1H/30m lanes existing — V6 must fund all three TFs or E2-Q1 degrades to 4H-only.

### MIGRATION — detectTfOrderBlocks (private)
  current: Last-opposite-candle-before-displacement-leg detector (forward max-excursion ≥ minMove; contiguous runs → one base, LAST candle wins; width ceiling), `ob-engine.ts:141`.
  kev_replacement: NONE (detection, not judgment — Kev reads zones, never bars, at Call 2).
  limite_replacement: NONE (comparisons are integer/float scans — plain code).
  gate: NONE (producer, not a block).
  needs_building: Verbatim port IF V6 re-implements detection in Python; else REPLACE with the E1 producer of choice (Kev never calls this — the state-constructor does). Either way Kev Q1 training needs its outputs as zone tokens.
  notes: The run-collapse rule (multi-bar base = one origin) is the load-bearing detail; flat-data → empty is the totality guard.

### MIGRATION — assembleZone (private)
  current: OB → ZoneModel: §6.3 BoM/MoM classify + §6.4 freshness recurrence from obIndex+1 + zfpFromState + pillar confluence + deterministic id pair|tf|formationMs|floor, `ob-engine.ts:213` (event scan `ob-engine.ts:243`).
  kev_replacement: E2-Q4 freshness (the freshness/zfp VALUES become Kev's freshness question inputs).
  limite_replacement: NONE.
  gate: NONE (producer; the 30m-MoM force below is the gate).
  needs_building: The id format + classification + freshness + zfp quartet is the EXACT zone-token schema Kev Call 2 state rendering needs — port the schema even if detection is replaced.
  notes: bom-mom.ts / freshness.ts are out-of-slice (E1) — flagged for the E1 auditor; this card owns only the assembly contract.

### MIGRATION — obZoneToZoneModel (private)
  current: OBCV ObZone → ZoneModel bridge: FRESH + [] events (honest emptiness) + 0 confluence; drops parent-string/center/internal-provenance per type mismatch, `ob-engine.ts:303`.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE.
  needs_building: Bridge-field table port (the documented DROPS — parent, center, originIdx/bw/bf/prior — must stay dropped, or ZoneModel gains phantom fields Kev then hallucinates on).
  notes: A field-fidelity contract, not logic; the ZR-3.6 backfill (below) later fills the honest-empty events from bars — the two cards compose.

### MIGRATION — buildZoneMap (export): canon-4H wrap + native 1H/30m + OBCV + T2/T3 + sort
  current: 4H construct4HZones wrap with OB-candle recovery + degenerate keep-canon path (`ob-engine.ts:328`); native 1H/30m detect loop with 30m→MoM force (`ob-engine.ts:382`, force `ob-engine.ts:399`); OBCV anchor-from-latest-bar (`ob-engine.ts:415`) + buildObcv (`ob-engine.ts:423`) + ZR-3.6 event backfill from own-TF bars (`ob-engine.ts:448`) + 30m-MoM force (`ob-engine.ts:459`); T2 4H→1H containment (refinedLabel/nestedWithin/refinedBy + Law-32 +3 confluence cap 14, `ob-engine.ts:471`); T3 1H→30m minor refinement (`ob-engine.ts:488`); deterministic TF→price→formationMs sort (`ob-engine.ts:497`).
  kev_replacement: E2-Q1 current-shape + E2-Q4 freshness (the zone MAP is Call-2 state; T2/T3 refinement tags become state tokens Kev learns: refined zones refine entries).
  limite_replacement: NONE (nesting/confluence arithmetic stays code).
  gate: G-ZONE-HYGIENE (30m-MoM force ×2 + Law-32 cap-14 + dedupZonePool composition all survive as code).
  needs_building: Port the assembly ORDER (native → OBCV → backfill → force → T2 → T3 → sort); keep the two 30m forces (belt+suspenders is the spec, not redundancy); keep the degenerate keep-canon path (§12 Law 3 honest-totality).
  notes: The whole function is the E1→E2 handoff schema: zones sorted TF→price with refinement links + TRUE pressure state (ZR-1 doctrine). V6 state-constructor renders exactly this output as Kev text.

## E3 — mdve/sl-lmv.ts (`src/mdve/sl-lmv.ts`, reaction-extreme SL + defended-edge entry)

### MIGRATION — LAW7_SL_BUFFER_PIPS / LAW10_ATR_FRACTION / GOLDEN_SL_MAX_PIPS / SWEEP_ORIGIN_EXTREME_TOL_PIPS
  current: Per-pair buffers EUR2/GBP3/AUD3/DXY5 (`sl-lmv.ts:61`); 0.5×ATR noise fraction (`sl-lmv.ts:74`); 9.5p golden ceiling export (`sl-lmv.ts:84`); 2p sweep-origin tolerance (`sl-lmv.ts:95`).
  kev_replacement: NONE. limite_replacement: M2 SL-distance (all four constants parameterize it).
  gate: G-SLENV (floor = max(0.5×ATR, buffer); ceiling = 9.5p; sweep exception documented-width).
  needs_building: Constants module (third copy of LAW7 buffers alongside mirror.js and setup-gen.ts — converge to ONE); ATR source must be bar-derived, never wall-clock.
  notes: Measured execution constants (golden-week derived); freeze, do not retune.

### MIGRATION — computeSL_LMV (export)
  current: Rung-walk (nearest defended extreme beyond entry, nearest-center sort) → REACTION_EXTREME in [floor,cap] (`sl-lmv.ts:177`, walk `sl-lmv.ts:198`, accept `sl-lmv.ts:215`); sweep-catch (entry zone IS sweep origin within 2p → structural wide SL beyond cap, adverse-side guarded, `sl-lmv.ts:235`); zone-width fallback (far edge + buffer) + Law-10 clamp (wrong-side/razor-thin → entry∓floor, `sl-lmv.ts:252`, clamp `sl-lmv.ts:267`).
  kev_replacement: E3-Q4 SL-in-envelope [yes,no] (the envelope judgment consumes method+distPips).
  limite_replacement: M2 SL-distance (the walk shortlist + buffer arithmetic is Limite-verifiable; or ported code — prefer code for the walk, Limite for the distance).
  gate: G-SLENV (floor/ceiling/adverse-side predicates survive verbatim; SWEEP_ORIGIN beyond-cap is the DOCUMENTED exception, not a violation).
  needs_building: Port the 4-path ladder (REACTION → SWEEP → ZONE_WIDTH → ZONE_WIDTH+LAW10_FLOOR) with method-tag audit trail (SlLmvMethod `sl-lmv.ts:101` survives as the provenance enum); distPips rides into Kev Q4 state.
  notes: The selective-guard partner (PROBE_GUARD in setup-gen) sits at the CALLER — port both or the SL can land inside its own battle probe.

### MIGRATION — entryPrice_LMV (export)
  current: LqzZoneMatrix → defendedEdge (matrix reduction, returned directly); OB ZoneModel + obCandle → defended-side body edge (LONG min(open,close), SHORT max(open,close)); no candle → defended-side geometric edge (honest v4.4 degradation), `sl-lmv.ts:297`.
  kev_replacement: NONE (anchor selection). limite_replacement: M1 zone-geometry (the returned price IS Limite's entry input).
  gate: NONE (helper; the honest-degradation order defendedEdge > body-edge > geometric-edge is the invariant).
  needs_building: Verbatim port (the three-tier fallback order is the spec; NEVER invent a level — §12 Law 3).
  notes: "The entry is AT the level price actually reverses from" (§4.2) — the single sentence that justifies the whole v45 geometry; make it a Kev training record too.

## E3 — trade-brain.ts remaining tick accessories (accessors, firewall, macro penalties, checks)

### MIGRATION — getMultiPairResults / getCrossPairMatrix / getSetups / getState
  current: Cached translation/matrix accessors (`trade-brain.ts:317` / `trade-brain.ts:329`); current-setup copy (`trade-brain.ts:1242`); hook-adapter state envelope (`trade-brain.ts:1274`).
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE.
  needs_building: DELETE the translation accessors with the translator; getSetups → TensorTrade Portfolio read; getState envelope → DROP (v4.1 adapter scaffolding, no V6 consumer).
  notes: Plumbing accessors; nothing to convert.

### MIGRATION — semanticFirewall.filterSetups + macro fib + treasury/FRED/EIA penalties + blind-check + TV-draw
  current: Firewall accept/reject with evidence records (`trade-brain.ts:440`, context `trade-brain.ts:442`); macro fib from zone swing range (`trade-brain.ts:437`, repeat `trade-brain.ts:712`); treasury −5 (`trade-brain.ts:580`), FRED-RRP AUD-LONG −3 (`trade-brain.ts:589`), EIA-shock −5 (`trade-brain.ts:604`); blind-execution warn-only (`trade-brain.ts:627`); TV drawSetup non-blocking (`trade-brain.ts:641`).
  kev_replacement: E3-Q2 quality-grade (firewall rules + all three macro penalties become grade INPUTS — auction-day, RRP-trend, shock-flag rendered as state tokens); PVE Q3 confidence absorbs the blind-check's self-containedness concern.
  limite_replacement: M4 fib-levels (the macro-fib computation is Limite's; the zone-swing high/low selection stays code).
  gate: Firewall hard-blocks → V6 code gates (port the RULE PREDICATES, drop the framework); penalties → G-CONF modifiers (keep the −5/−3/−5 values as initial weights, then let Score calibration own them); blind-check → DROP as warn-only (or promote to a failing G-PROVENANCE if the operator wants teeth — currently it bites nothing).
  needs_building: Penalty values are measured doctrine — keep as training priors, not hardcoded post-hoc mutations (the `setup.confidence = max(0, conf−5)` mutation pattern is banned in V6; Kev prices the penalty into the grade distribution instead).
  notes: TV-draw is observability, not logic — DROP (TensorTrade analytics replaces chart-drawing with P&L/sharpe/drawdown per blueprint §3.1).

## Out-of-slice dependencies (E1 / shared / frozen — NOT converted here, flagged for their slice owners)

- mirror.js: computeMirrorSL / computeMirrorTP / computeLmvTP / proxyAtr1hPips / LAW7_SL_BUFFER_PIPS / computeLadderStepsSL / classifyZoneStrength / isStructuralWall (imported `setup-gen.ts:65`; called `setup-gen.ts:608`, `setup-gen.ts:969`, `setup-gen.ts:990`, `trade-chaining.ts:40`). The E3 SL/TP walks live here. Owner: E1/mirror slice. V6 needs: rung-walk + Law-14 walk as Limite prompt shapes or ported helpers.
- refinement-machine.js: refineSetup (imported `setup-gen.ts:76`). Owner: refinement slice (explicitly out of E2/E3 scope per assignment). V6 needs: attempt-budget + same-anchor policy only.
- util.js: sessionOf / priceDecimals (imported `setup-gen.ts:72`). Trivial; port with the gate layer.
- shape-cascade.js: ShapeDayZone type (imported `setup-gen.ts:74`). The E2 chain type; V6 replaces the chain with Kev Call 2 — type dies with the chain.
- lmv.js: LqzZoneMatrix / LmvTable (imported `setup-gen.ts:73`). The LMV row schema is the M1/M2 input schema — KEEP the field names (defendedEdge, reactionExtreme, center, side, candles, zfp) so Limite prompts stay stable.
- brains/elemental-lobe.js: detectFractalSignal (`trade-brain.ts:52`); brains/reinforcement-lobe.js: buildReinforcementLadder (`trade-brain.ts:54`); brains/dxy-primacy.js: computeDXYConviction/isDirectionAligned/applyPairProfilePenalty (`trade-brain.ts:61`); brains/multi-pair-translator.js: MultiPairTranslator (`trade-brain.ts:62`); semantic-firewall/fib-spiderweb.js: computeFibLevels (`trade-brain.ts:51`); pipeline/blind-execution-check.js (`trade-brain.ts:55`). Owners: their slices. V6 direction: all → Kev Q2 training signal or gates per the cards above.
- kernel/l1-l5 verdict chain (l1-telescope/l2-pressure/l3-fib/l4-cascade/l5-ti-graph, referenced `trade-computer.ts:1`): the card-verdict inputs to computeTrades. Owner: kernel slice. V6: L2→E1 state, L3→M4+fib gate, L4→G-CASCADE, L5→Q2 grade.

## NO-REPLACEMENT inventory (what has NO Kev/Limite equivalent and must be built new as code)

1. Gate layer itself (~150 lines Python): G-RRR, G-SESSION, G-SLENV, G-CONF, G-CASCADE, G-FRESH, G-DEDUP (+assert), G-CHAIN, G-TP-CAP, G-ZONE-HYGIENE, G-PROVENANCE — none exist in V6 today; trade-computer.ts refuse-codes are the spec to copy.
2. State-constructor renderers (bars/zones/pressure/prior-E2/macro/OI → Kev text, ~120 lines): the largest build item; every Kev question depends on it.
3. Kev fine-tune corpus (~700 records from 583 mechanism + 38 ruling + 38 forensic + 23 golden cards per blueprint §1.8, PLUS the E2/E3 doctrine records named in these cards: FORTRESS/3x ladder, FALSE_POSITIVE prose, origin-vs-reinforcement quote, bounce-up-never-down negative, transit-center-vs-defendedEdge split).
4. Limite prompt shapes (M1 entry/TP selection, M2 SL walk, M3 RRR, M4 fib, M5 commission/size) + gate-layer walk comparators they replace-or-keep.
5. TensorTrade wiring (Exchange+Broner+Portfolio+walk-forward+commission sensitivity per blueprint §3.3) replacing replay-harness, chain state, master-trade objects, stop-limit lifecycle.
6. Determinism repairs in port: bar-timestamp sessions (not wall-clock), deterministic chain ids (not Date.now), single STAGGER constant, single LAW7 table, single tier-band decoder.
7. Dropped-by-design (build NOTHING): warframePhaseOf/Prose, composeNarrative, capitalize, zoneTypeWord, SESSION_DISPLAY, applyVlmVerification, TV-draw, getState envelope, nextChainPosition counter (OMS owns it).

## Fork-and-convert map (condensed — the merge owner reads this section first)

| 4.5.3 piece | V6 replacement | Kind |
|---|---|---|
| storyline readContestedZone/projectNext/validateBreak/computeMacroArc | Kev Call 2 Q1+Q3+Q4 + state renderer | Kev |
| storyline compareStrength | ported scan + G-STRENGTH | code |
| storyline warframe/narrative/capitalize/zoneTypeWord + computeWeekStoryline shell | DROP / Call-2 harness | drop/build |
| trade-brain constructSetups geometry | E3-Q1 + M1/M2/M3 + G-RRR/G-SLENV | Kev+Limite+gate |
| trade-brain computeConfidence/confidenceOf + categories | E3-Q2 Score + G-CONF floors | Kev+gate |
| trade-brain 6-check validation + session filter + scalp types + Avatar/ladder/master | Q1/Q3/Q5 + gates + TensorTrade legs | split |
| trade-brain tick orchestration | 12-step V6 cycle (~300-line Python) | build |
| trade-brain TimesFM/VLM/OI-clients | Kev PVE / DROP / Q2 state tokens | Kev/drop |
| trade-flow-chain predicates + status | G-CHAIN + OMS callbacks | gate+OMS |
| trade-computer refuse codes + RRR_FLOOR + provenance | V6 gate-code enum + G-* + TradeDecision provenance | gate |
| setup-gen battles/freshness/transit/bounce/repair/dual-entry/merge | Q4/Q1/Q2 + M1/M2/M3 + G-FRESH/G-RRR/G-DEDUP | split |
| setup-gen selectors (lmvZone/internalRung/sourceLane/selectors) | ported helpers feeding M1/M2 | code |
| trade-chaining Law-27 (chainOne/BFS/identity) | G-CHAIN + seen-set + OMS legs | gate+OMS |
| trade-dedup identity/merge/cap/readmission/zone-pool/assert/adapter | G-DEDUP + G-ZONE-HYGIENE + emission invariant | gate |
| ob-engine detection+assembly+nesting+sort | state-constructor input schema + G-ZONE-HYGIENE | code |
| sl-lmv 4-path SL + defended-edge entry | M2/M1 + G-SLENV + Q4 | Limite+gate+Kev |

## Honest remainder (what this audit did NOT verify)

- Line anchors are grep/read-verified this session against the worktree files; full function BODIES were read for storyline-engine.ts (567), trade-chaining.ts, trade-dedup.ts, sl-lmv.ts, trade-computer.ts (348), ob-engine.ts (505), setup-gen.ts Impl §§2–5 + helpers, trade-brain.ts constructSetups + confidence + tail; the tick mid-body (trade-brain.ts:360–660) was read in summary form — firewall/penalty/check line items verified by targeted grep, not full-body read.
- E1-owned callees (mirror.js walks, freshness/bom-mom classifiers, elemental/reinforcement/dxy-primacy/translator internals, L1–L5 kernel legs, refinement-machine attempts) are mapped only at their E2/E3 call sites; their internals belong to sibling slices (V6E1Audit / V6MPSE / V6HarnessAudit — coordinate, do not duplicate).
- No Kev/Limite runtime exists on this host to test prompts against; the Kev-question assignments follow blueprint §1.7 Call 2/3 inventory exactly, and every Limite assignment respects the §2.4 never-reversed division (judgment→Kev, arithmetic→Limite, comparison→code).
- trade-computer.ts path correction: assignment said src/mdve/trade-computer.ts; actual file is src/kernel/trade-computer.ts (glob-verified) — all anchors above use the real path.
