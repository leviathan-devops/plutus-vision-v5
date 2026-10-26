# V6 HARNESS AUDIT — pipeline composition → V6 migration map (V6HarnessAudit slice)

> Slice: `report-v452.ts` (1494 lines) + `diag-lmv-golden-fx.ts` (121 lines) + `src/engine3/visual-setup-generator.ts` (1952 lines) + `src/engine3/types.ts` (158 lines) + `src/engine3/ladder-generator.ts` (263 lines) + `src/engine3/visual-zone-lobe.ts` (552 lines, extra).
> Codebase: `/home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent/` (v4.5.3 CLEAN BASELINE).
> Blueprint: `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT/reports/Plutus_V6_Master_Blueprint_v1.md` (524 lines; Kev §1, Limite §2, TensorTrade §3, merge cycle).
> Overlap note: peer `V6Harness` claims same target file per IRC 2026-09-23. This file is the V6HarnessAudit landing per ticket acceptance (`/tmp/kg-overhaul/v6-audit-harness.md`); it covers the FULL acceptance (incl. diag-lmv oracle T1–T7 + zone-lobe VLM pipeline) so nothing is lost if the peer lands a narrower slice. Peer should land extras as `v6-audit-harness-plus.md` / `v6-audit-harness-webdata.md`; check mtime before clobbering.
> Read-only: no codebase writes; all claims anchored file:line below. Sibling slices (E1/E2/E3 brains, mdve internals, specs corpus) owned by V6MPSE / V6E1Audit / V6E2E3Audit — referenced, not re-audited.

## §0 — Composition overview (what the harness IS)

`report-v452.ts:1-43` header states the canon chain (§9.1, deterministic, byte-identical markdown, `bun report-v452.ts`):

```
loadFixture (BARS_FIXTURE → /tmp/opencode/bars_raw.json) [report-v452.ts:106,311-380]
→ buildChartModel(DXY/EU/GU, bars ≤ anchor) [report-v452.ts:377-379] [E1]
→ pillarEngine per pair + buildIpZones merge [report-v452.ts:357-360,406-407] [E1-reintegration A1.1]
→ runPriorWeekPreflight per pair [report-v452.ts:1044-1053] [macro context]
→ DXY FULL first: ShapeBrain(DXY) [report-v452.ts:914] → generateSourceSetupsV45(DXY) [report-v452.ts:1091] [E2 CORE + E3 frozen lane]
→ EU: translateCascadeDayMap INVERSE [report-v452.ts:957-959] → EU E2 CORE [report-v452.ts:915] → computeChainDivergence ≤0.35 FLAG ONLY [report-v452.ts:979-981] → cascadeV45 EU lane [report-v452.ts:1117-1120]
→ GU: translateCascadeDayMap KEPT [report-v452.ts:962-964] → GU E2 CORE [report-v452.ts:916] → divergence [report-v452.ts:982-984] → cascadeV45 GU lane (from ACTIVE EU mirrors, mirror.ts:2463 cited [report-v452.ts:1097-1100])
→ cascadeV45 BEFORE lane [report-v452.ts:1109] + AFTER lane v452 refinements (goldenSlLmv, consumedPoolQualifier, guAnchorPoolV453) [report-v452.ts:1117-1120] + shapeChains + translatedDays + storylines ctx
→ activeMirrors filter [report-v452.ts:1138] → generateChainedTrades per pair maxDepth 3 [report-v452.ts:1153-1195] → chainedRows [report-v452.ts:1154-1213]
→ floorSetupsToDedupRows + chainedRows → rows [report-v452.ts:1217] → dedupTrades [report-v452.ts:1218]
→ simulateUniqueTrade per unique trade [report-v452.ts:1222-1224] (§3.1 + §7.2 + ZR-6E bracket)
→ computeAccurateStats [report-v452.ts:1249] → dedupSLvsEntry [report-v452.ts:1268] → wallMap before/after [report-v452.ts:1273-1283] → renderReport [report-v452.ts:1284,1319] → report_v452.md [report-v452.ts:1476-1479]
```

Engine3 (visual E3) sits UNDER the mdve cascade as the visual-precision lane (not in report-v452.ts direct call path — invoked via pipeline engine / legacy TTE pipeline; see §3): `VisualSetupGenerator.generateSetups` [visual-setup-generator.ts:290] + `generateLiquidityLadder` [ladder-generator.ts:107] + `VisualZoneLobe` [visual-zone-lobe.ts] + types [types.ts]. `diag-lmv-golden-fx.ts:1-121` is the ZR-7D FX golden-level oracle gate (EU 10/10 ≤2.5p + GU 7/7 ≤3.0p probe formalized).

V6 target (blueprint merge cycle): `Market Feed → State Constructor (bars→text, 5ms) → Kev Call1 E1 (5Q) → gate → Kev Call2 E2 (4Q) → gate → Kev Call3 E3 (5Q) → Limite (entry/SL/TP/RRR/fib, 200ms) → gate (rrr<2.5 reject, session, SL envelope) → Kev Call4 PVE (3Q) → gate (conf<B flag) → TradeDecision → TensorTrade OMS (execute+measure, async)` — ~250ms GPU, ~300 lines Python, no coding agent. Doctrine (649 cards) → offline Kev training data, never runtime queries.
## §1 — report-v452.ts (1494 lines) stage-by-stage migration cards

### MIGRATION H-01 — fixture load + bar scoping + spot + sim bars
  current: `loadFixture` [report-v452.ts:311] scopes `barsFor(pair,tf)` to bars ≤ ANCHOR_MS [report-v452.ts:321-324], `simBarsFor` unsliced 1H for sim [report-v452.ts:325-327], `spotFor` = last 4H close [report-v452.ts:328-331]; constants ANCHOR_MS=1783702800000/WEEK='2026-07-06'/WEEK_START_MS/FIXTURE/REPORT_PATH [report-v452.ts:99-107]; `sessionStartPrice` session-window first-bar open [report-v452.ts:381-389]; `dayOpenPrice` first 1H bar ≥ dayStart [report-v452.ts:393-397]; `barsByTf` per-pair 1H/4H/30m/15m ≤ anchor returned for preflight [report-v452.ts:311-380].
  kev_replacement: NONE (data plumbing, not judgment).
  limite_replacement: NONE.
  gate: NONE (deterministic Python).
  needs_building: V6 `Market Feed` + `State Constructor` harness block: file/websocket bar loader, anchor/window scoping, spot resolver, session/day open resolvers, barsByTf dict. ~30 lines Python. Deterministic; no model.
  notes: This is the harness-loop skeleton the ~300-line Python runtime hangs off. Blueprint merge diagram `Market Feed → State Constructor (bars→text)` is exactly this card. Keep ZR-6E-relevant session/day open helpers — sim bracket depends on them.

### MIGRATION H-02 — options walls file + OptionsWallsBundle
  current: `loadOptionsWalls` [report-v452.ts:144-179] parses OPTIONS_WALLS_PATH [report-v452.ts:114] (`options_walls.json` walls|strikes, spots, date) into full OptionsExpiryData + perPair + componentSpots + wallDays; absent/unparseable → undefined honest [NO DATA] [report-v452.ts:147-149,166]. Interface OptionsWallsFile [report-v452.ts:119-142].
  kev_replacement: NONE.
  limite_replacement: NONE.
  gate: NONE (I/O + honest-absence).
  needs_building: V6 harness `options_walls.json` loader (same schema) OR web-data-agent artifact consumer (see §12). If options feed becomes live, agent fetches → writes same bundle shape; harness keeps `undefined = [NO DATA]` path — ZR-7A firewall depends on it.
  notes: The [NO DATA] honest-zero path (P8 K-factor 0, P3 P3_NO_DATA 0) must survive into V6 gate layer; never fabricate spots (canon [report-v452.ts:336-360]).

### MIGRATION H-03 — pillarEngine per pair + buildIpZones merge (E1 reintegration A1.1)
  current: `pillarEngine({instrument,bars,currentPrice,optionsData,componentSpots})` per pair DXY-full/EU-own/GU-none [report-v452.ts:357-369]; `buildIpZones(model,pillarResult,pair)` [report-v452.ts:230-289] converts levels → ZoneModel id `IP|pair|price` [report-v452.ts:248], ±10-pip box [report-v452.ts:251-253], classification CONFLUENCE (never MoM — ZR-7B) [report-v452.ts:261], pressure lifecycle CONFLUENCE zero-battle [report-v452.ts:276-279], source PILLAR + ipZone [report-v452.ts:280-281]; `zfpFromConfluence6D` step 10/20/30/40/55/65 [report-v452.ts:182-189]; `isForeignOtcLevel` price-space guard + PAIR_TAGS [report-v452.ts:207-228]; merge `model.zones=[...model.zones,...buildIpZones]` [report-v452.ts:406-407]; ZR-7A NO_DATA provenance filter [report-v452.ts:262-268].
  kev_replacement: Kev Call 1 E1 Q2 OBCV gate / Q4 pressure class / Q5 fortress absorb the *judgment* these zones inform (confluence→pressure degree), but NOT the level construction. Do not ask Kev to invent pivot/MA/options levels.
  limite_replacement: NONE (levels are data lookups + pip arithmetic, not reasoning).
  gate: deterministic code: foreign-space filter, NO_DATA filter, CONFLUENCE label assertion (reject MoM label), ±10-pip box.
  needs_building: V6 harness `build_ip_zones()` Python (pillar-input assembly + level→zone boxing) fed by web-data agent (P1-P9 pillar inputs) OR precomputed fixture; plus Kev fine-tune records mapping confluence→ZFP step. The 9-pillar lobe itself is E1-slice owned — this card is only the harness merge point.
  notes: DECISION-1 canon [report-v452.ts:400-407]: IP zones are confluence/ZFP/context + SL/TP rungs, NEVER entries (§8.1 gate + mirror anchor guard + battle gate). V6 must preserve the NEVER-entries invariant as a gate, not a Kev question.

### MIGRATION H-04 — buildChartModel per pair (E1 zone-map engine entry)
  current: `buildChartModel(pair,WEEK,1H,4H,30m,spot,{pillarResult},15m)` ×3 [report-v452.ts:377-379] with real pillarResult so LQZ×IP merge fires (mergeLqzWithIpZones confluence+2/zfp-5) [report-v452.ts:336-340]; 15m empty→tier skipped [report-v452.ts:375-376].
  kev_replacement: Kev Call 1 E1 consumes the resulting zone map as STATE TEXT (state constructor renders bars+zones+confluence), not as a replacement for building it.
  limite_replacement: NONE.
  gate: NONE at this card (engine internals are E1-slice).
  needs_building: V6 `State Constructor (bars→text)`: renders E1 zone map (S/D/L + IP confluence + ZFP + LMV rungs) into Kev state text ≤8192 tokens. The OB/LQZ construction behind buildChartModel is E1-slice fork-and-convert; harness only owns the renderer.
  notes: The state-text renderer is the highest-risk new build: every Kev question's accuracy depends on zone serialization fidelity (zone id, top/bottom, type, classification, zfp, confluence, freshness, reactionEvents, pressure). Budget tokens: 30m/1H/4H bars + pair + session + DXY ctx per blueprint Call 1.

### MIGRATION H-05 — runPriorWeekPreflight (A1.3 backwards-mapping macro context)
  current: `runPriorWeekPreflight(pair,{barsByTf,weekStartMs,anchorMs})` per pair BEFORE current E2 [report-v452.ts:1044-1053]; log sweepOrigin/range/defended/broken/untested/roleReversals/depleted/chain [report-v452.ts:1052]; consumed via `priorStoryline` handoff on injected ZoneMapSnapshot [report-v452.ts:843-846].
  kev_replacement: Kev Call 2 E2 state includes "prior E2 state + day context" — the preflight output serializes into that state text. No separate Kev call; it is context, not a question.
  limite_replacement: NONE.
  gate: deterministic: priorAnchor scoping (bars ≤ priorAnchor ONLY, current-week bars NEVER visible).
  needs_building: V6 harness `prior_week_context()` (same scoping rule) + state-text injection. If preflight E1/E2 re-runs are too heavy live, precompute weekly and cache; never leak current-week bars backward.
  notes: Golden truth example DXY Jul-3 sweep origin 100.603 [report-v452.ts:1035-1043] becomes a Kev fine-tune record (state→sweep-origin question) if that judgment is kept.

### MIGRATION H-06 — toDxyZone adapter (E2ZoneInput boundary ZR-7C)
  current: `toDxyZone(z)` [report-v452.ts:622-703] maps classification+type→ZoneType enum, freshness→reactionStatus, reactionEvents→reactionCount, FULL pressure lifecycle/absorption/liquidity verbatim [report-v452.ts:623-642], SWEEP/WICK_REJECT→re-act else enter [report-v452.ts:643-646], PILLAR branch → 'IP Confluence Supply/Demand' rejected-by-designation string [report-v452.ts:652-676], honest absence pillars [] [report-v452.ts:604-608].
  kev_replacement: NONE (adapter, not judgment). Its OUTPUT (E2ZoneInput list) is what Kev Call 2 serializes.
  limite_replacement: NONE.
  gate: deterministic: IP-zone rejection string assertion; pressure-enum cast list; reaction-dir mapping.
  needs_building: V6 state-constructor `to_kev_zone()` with identical mapping + tests asserting IP zones never enter designation pools. Port verbatim; this is load-bearing for DECISION-1.
  notes: Bible 4.0 §4.18 "Every field matters" — dropping liquidity/absorption silently degrades Kev E2 accuracy. Serialize all fields.
### MIGRATION H-07 — buildShapeBrain per-pair E2 CORE runner
  current: `buildShapeBrain(pair,model,priorStoryline?)` [report-v452.ts:832-861] builds ZoneMapSnapshot {version,timestamp,instrument,zones: model.zones.map(toDxyZone)} [report-v452.ts:837-842], attaches priorStoryline handoff [report-v452.ts:843-846], ltfZones = model 30m zones mapped [report-v452.ts:853-857], `new ShapeBrain(); setZoneMap(snap,ltfZones); compute()` [report-v452.ts:858-860].
  kev_replacement: Kev Call 2 E2 Q1 current shape / Q2 day element / Q3 cascade valid / Q4 freshness — the ShapeBrain's strength-based designation (projectZoneForDay) becomes 4 Kev questions over the serialized E2ZoneInput state. Blueprint Call 2 state = "E1 output + prior E2 state + day context".
  limite_replacement: NONE.
  gate: NONE (replaced by Kev + deterministic divergence flag below).
  needs_building: (a) Kev fine-tune records: (E2ZoneInput state, shape/day/freshness answers) from 649 doctrine cards + 38 forensic + 23 golden trades; (b) state-text serializer for E2ZoneInput + ltfZones + priorStoryline; (c) retirement of ShapeBrain TS class (E2-slice owns the training-data extraction).
  notes: Do NOT port ShapeBrain rules into Python if/else — that preserves the 10k-line runtime V6 kills. The rules become training labels, not code. Keep the ltfZones (30m MoM reaction points, T4 doctrine [report-v452.ts:853-857]) in the serialized state or Kev loses SS/R reaction fidelity.

### MIGRATION H-08 — buildE2Core three-role cascade + divergence + storylines
  current: `buildE2Core(models,priorStorylines?,barsByPairTf?)` [report-v452.ts:901-1000] runs 3 pair brains [report-v452.ts:914-916], `computeWeekStoryline` per pair narrative-only [report-v452.ts:928-942], `translateCascadeDayMap(dxyBrainDays,dxyModel,euModel,INVERSE,euCoreDays)` [report-v452.ts:957-959] + `(euCoreDays,euModel,guModel,KEPT,guCoreDays)` [report-v452.ts:962-964], `snapshotToCascadedChain` ShapeDayZone contract (dayOpenSpot,keyZoneId,supply+demandZoneId,keyZoneType,deepDemandZoneId,session) [report-v452.ts:784-815], `brainDaysForTranslation` projection [report-v452.ts:750-772], `toEntryDir` UP→LONG/DOWN→SHORT/RANGE→primary-side [report-v452.ts:727-741], `computeChainDivergence ≤0.35 FLAG ONLY never override` [report-v452.ts:979-984], E2 log [report-v452.ts:986-1000], shapeChains assembly [report-v452.ts:1103-1106].
  kev_replacement: Kev Call 2 Q3 "cascade valid? → [valid, invalid, partial]" REPLACES translateCascadeDayMap + computeChainDivergence as a learned structural-equivalence judgment. Kev Call 2 Q1/Q2 replace per-pair designation. The INVERSE (DXY→EU) vs KEPT (EU→GU) mode becomes two option-text variants of Q3, not two code paths.
  limite_replacement: NONE (no arithmetic; divergence is a comparison).
  gate: deterministic code: divergence-flag threshold IF kept as a backstop (compare Kev Q3 partial/invalid vs computed divergence; log both). The §15 anti-goal (never EU_price=f(DXY_price)) [report-v452.ts:1081-1083] stays a hard gate on any cascade math.
  needs_building: (a) Kev Q3 training pairs: (source-days + receiving-zones state, INVERSE|KEPT mode prefix, valid/invalid/partial label) mined from euCascaded/guCascaded entries + divergence values; (b) ShapeDayZone→state-text serializer (dayOpenSpot, keyZone, dual-side ids, session); (c) `computeWeekStoryline` narrative RETIRED from runtime (see H-13 — report-only, optional).
  notes: CASCADE=TRANSLATES / CORE=DESIGNATES / CASCADE-VALIDATES three-role comment [report-v452.ts:1069-1083] is the exact contract Kev Q3 must learn. GU-from-ACTIVE-EU-mirrors (not raw DXY) [report-v452.ts:1097-1100] becomes a harness dataflow rule: GU Kev state includes EU mirror outputs, not DXY source rows.

### MIGRATION H-09 — DXY source lane + cascadeV45 BEFORE/AFTER + shapeChains/ctx threading
  current: `generateSourceSetupsV45(dxyModel)` frozen source lane COMPLETE FIRST [report-v452.ts:1091]; BEFORE lane `cascadeV45(dxySource,models,{sessionStartPrice})` [report-v452.ts:1109]; AFTER lane with v452 refinements + shapeChains + translatedDays + storylines [report-v452.ts:1117-1136]; `activeMirrors` filter [report-v452.ts:1138]; wall-map before/after via beforeByKey [report-v452.ts:1271-1283].
  kev_replacement: Kev Call 3 E3 Q1 direction / Q2 quality grade / Q3 session valid / Q4 SL envelope / Q5 shield coverage replace the mirror-reanchor judgment (which setup survives on which zone/day). The BEFORE/AFTER A-B comparison harness has NO V6 runtime equivalent — it was a refinement-validation device.
  limite_replacement: Limite computes the re-anchored entry/SL/TP numbers once Kev picks direction+zone (MATH CALLs 1-3: zone width, SL distance, RRR).
  gate: deterministic: §4.2 emission cap (MAX 1 mirror per anchor+day) stays code; v452 refinements (weekly-wall TP §5.2, golden SL §5.3, consumed-pool qualifier §4.4) stay gates on Limite outputs until Kev learns them, then retire.
  needs_building: V6 harness `emit_decisions()` loop (Kev E3 → Limite math → gates → TradeDecision list); BEFORE lane + wall-map diff harness RETIRED (keep only as offline Kev-eval, not runtime). shapeChains/translatedDays/storylines ctx threading replaced by Kev state text.
  notes: cascadeV45 internals (reAnchorMirror, selectPairNativeZone, mirror.ts:2463 EU→GU Stage 3) are E2E3-slice owned. This card is the harness call-site only. Do not port the cascade into Python — that re-creates the TS runtime in another language.
### MIGRATION H-10 — Law-27 trade chaining (ZR-4A harness loop + engine3 chained setups)
  current: harness per-pair primaries assembly (DXY source rows via shapeTrigger day/session regex; EU/GU ACTIVE mirrors) [report-v452.ts:1155-1185], `generateChainedTrades(pair,primaries,model,{pipValue,categoryFloor:3.0,maxDepth:3})` [report-v452.ts:1186-1195], chainedRows push with own day/session bracket triggerMs + defendedEdge anchor [report-v452.ts:1196-1213]; engine3 twin `generateChainedSetups` [visual-setup-generator.ts:1790-1947] (TP-zone lookup, LQZ-pivot exemption, reverse direction, chainShapeMap, parent-category RRR floor, §8.4 dedup keys).
  kev_replacement: Kev Call 3 Q1 direction on the chained candidate (reverse-direction reaction judgment) — "does the TP zone produce a reverse trade?" is a Choice/NOUL question over (parent TP + TP-zone state).
  limite_replacement: Limite MATH CALLs 1-3 recompute chained entry/SL/TP/RRR (entry = parent TP edge; SL = ladder-steps; TP = first structural wall).
  gate: deterministic code: categoryFloor 3.0, maxDepth 3 ceiling, week's-end bound, in-engine §1.2 identity dedup (colliding chain suppressed, never merged) [report-v452.ts:1147-1152].
  needs_building: V6 harness `chain_decisions()` post-pass (depth ≤3, same gates) fed by TradeDecision TPs; Kev fine-tune records from golden chains (EU #4→#5→#6 Wed triple, #7→#8 Thu→Fri — the operator's depth-3 proof [report-v452.ts:1190-1194]).
  notes: Chaining is where the 17-oracle-entry diag (diag-lmv §) meets runtime: chained TPs are also entries (EU #2/#3). V6 must keep chain-before-dedup ordering so chains dedup against primaries [report-v452.ts:1147-1152].

### MIGRATION H-11 — floorSetupsToDedupRows + dedupTrades (§1 identity + §2 staggered merge)
  current: `rows=[...floorSetupsToDedupRows(dxySource,activeMirrors),...chainedRows]` [report-v452.ts:1217]; `dedupTrades(rows)` [report-v452.ts:1218] → uniqueTrades + stats(inputRows,uniqueTrades,droppedDuplicateRows,staggeredGroups,maxGroupSize) surfaced in report line [report-v452.ts:1325].
  kev_replacement: NONE (identity/dedup is deterministic).
  limite_replacement: NONE (blended-entry arithmetic already done upstream; dedup compares exact numbers).
  gate: deterministic code — port `floorSetupsToDedupRows` + `dedupTrades` (§1 anchorBucket identity + §2 stagger merge) VERBATIM into V6 harness. This is the anti-double-count law; Kev never votes on identity.
  needs_building: Python port of the two functions + byte-parity test vs TS on the golden week (inputRows→uniqueTrades counts must match).
  notes: The v4.5.1 "SL TOO WIDE=25 was ~11 unique wins with 10 votes from ONE GU trade" lesson [report-v452.ts:1408] is why dedup precedes ALL stats/votes. V6 TensorTrade must consume uniqueTrades only.

### MIGRATION H-12 — sessionBracketOf + simulateUniqueTrade (§3.1 trigger + §7.2/ZR-6E expiry)
  current: `sessionBracketOf(ms,sessionLabel)` [report-v452.ts:445-474]: ET-label verbatim window or SESSION_HOUR canonical [report-v452.ts:445-452], weekend rule Fri/Sat/Sun→21:00Z close [report-v452.ts:454-458], else next-day same-session start [report-v452.ts:458]; `simulateUniqueTrade(t,bars)` [report-v452.ts:490-577]: staggered legs or single-leg fallback [report-v452.ts:491-493], DXY-lane canonical-session vs mirror-lane verbatim-session rule [report-v452.ts:503-524], formation floor [report-v452.ts:524-527], bracketed fill scan [report-v452.ts:528-545], trigger→SL-first-pessimistic resolution [report-v452.ts:546-573], OPEN / NOT_TRIGGERED + expiredLegs + MAE [report-v452.ts:490-577]; per-trade loop [report-v452.ts:1222-1224]; UniqueSimResult interface [report-v452.ts:460-475].
  kev_replacement: NONE — simulation is the execution model, not a judgment. (Kev PVE Q2 "entry reachable?" is a pre-filter, not a fill simulator.)
  limite_replacement: NONE (MAE/slDist pip division is trivial arithmetic inside the sim, not a Limite reasoning call).
  gate: deterministic code — but DO NOT port into the V6 live loop as the execution engine.
  needs_building: TWO artifacts: (a) BACKTEST-ONLY Python port of bracket+sim for offline Kev-eval parity (must reproduce golden-week outcomes byte-identical); (b) LIVE path REPLACED by TensorTrade OMS (Exchange execute_order + Broker lifecycle + Portfolio P&L/drawdown/Sharpe/Sortino + commission 0%/0.1%/0.2% sensitivity + walk-forward). The blueprint §3.2 commission thesis (profitable at 0% dies at 0.1%) is validated in TensorTrade, never in the ported sim.
  notes: The DXY-canonical vs mirror-verbatim session split [report-v452.ts:514-524] and the 21:00Z weekend clamp are the two most load-bearing sim behaviors — parity-test them explicitly (DXY Tue 100.842 Tokyo 01:00-03:00Z case cited [report-v452.ts:514-524]). SL-before-TP pessimistic ordering [report-v452.ts:546-573] must match TensorTrade's intrabar assumption or backtest comparison is invalid.

### MIGRATION H-13 — computeAccurateStats + dedupSLvsEntry + wallMap + renderReport + report markdown
  current: trades assembly UniqueTradeInput (§6.3 mandatory fields) [report-v452.ts:1227-1248]; `computeAccurateStats(trades,EVAL_WEEK)` [report-v452.ts:1249] with EVAL_WEEK 2026-07-06→10 [report-v452.ts:291]; headline/inWeekTriggered/overall/stale semantics [report-v452.ts:1326]; voteRows (WIN/LOSS + mae only) [report-v452.ts:1253-1267] → `dedupSLvsEntry` [report-v452.ts:1268]; wallMap before→after [report-v452.ts:1273-1283]; `renderReport` [report-v452.ts:1319-1473] §§1-8 + STORYLINE + helpers f5/f2/fp/iso/statsLine/tradeRow/TRADE_TABLE_HEADER [report-v452.ts:1292-1317]; E1 §8 table [report-v452.ts:1425-1440]; STORYLINE per pair from computeWeekStoryline (narrative-only, never read by selection) [report-v452.ts:1440-1472,918-942]; ChainResult interface [report-v452.ts:579-601].
  kev_replacement: NONE for stats/render (deterministic). Kev Call 4 PVE Q3 confidence Score replaces the *interpretation* of stats (which trades to trust), not the computation.
  limite_replacement: NONE (R/win-rate/avgRRR are closed-form aggregates).
  gate: deterministic code: headline = triggered_in_week AND resolved_in_week; STALE never in headline [report-v452.ts:1326]; fp 7dp FX / 5dp DXY precision rule [report-v452.ts:1295-1301].
  needs_building: (a) Python `accurate_stats` port (headline/inWeek/overall/stale + per-pair + trade table + stale detail + SL_vs_ENTRY deduped votes + wall-map diff) for offline parity; (b) LIVE V6 report = TensorTrade Portfolio analytics (P&L, drawdown, Sharpe/Sortino, win rate, commission sensitivity) + TradeDecision log; (c) `computeWeekStoryline` RETIRED from runtime (narrative-only [report-v452.ts:597-600]) — optionally rehomed as an offline LLM explainer, never in the decision path.
  notes: The report renderer is the largest CANNOT-REPLACE-AS-MODEL block: it is pure formatting + aggregation. Keep it code. The storyline section is the only prose-generation block and it is explicitly non-load-bearing — ideal first deletion in V6.

### MIGRATION H-14 — main entry (import.meta.main) + ChainResult plumbing
  current: `if (import.meta.main)` [report-v452.ts:1476] → runChainV452 → writeFileSync(REPORT_PATH) [report-v452.ts:1477-1478] + console HEADLINE/PER-PAIR/SL_vs_ENTRY [report-v452.ts:1479-1493]; REPORT_PATH='report_v452.md' relative (SF-AST no-absolute-paths) [report-v452.ts:107].
  kev_replacement: NONE.  limite_replacement: NONE.  gate: NONE.
  needs_building: V6 Python `main.py` (~300-line loop per blueprint): feed → state → Kev×4 → Limite → gates → TradeDecision → TensorTrade; pi-agent-core optional (agent loop + tool calling + TUI, coding stripped) per blueprint pi-harness option. Determinism: same fixture → byte-identical TradeDecision log (no wall-clock in chain; note `timestamp: Date.now()` [report-v452.ts:838] is the one wall-clock leak to remove).
  notes: The `Date.now()` in buildShapeBrain snapshot [report-v452.ts:838] violates the determinism header [report-v452.ts:39-43]; V6 harness must use anchorMs everywhere (cf. formationMs=anchorMs [report-v452.ts:279]).
## §2 — diag-lmv-golden-fx.ts (121 lines) ZR-7D oracle gate → V6 map

### What it is (read-only finding)
Backtest-validation diag, not runtime: rebuilds EU/GU ChartModels from fixture bars ≤ ANCHOR_MS [diag-lmv-golden-fx.ts:19-21,56-64,67-70], reads `models[pair].lmv?.table` rungs [diag-lmv-golden-fx.ts:78], nearest-rung per ORACLE level [diag-lmv-golden-fx.ts:77-103], ENTRY tol 3p [diag-lmv-golden-fx.ts:24] vs TP tol 5p [diag-lmv-golden-fx.ts:87], counts entriesWithin3/entriesTotal + tpsWithin5/tpsTotal [diag-lmv-golden-fx.ts:73-103], T7 hardcode detector (non-empty maps = data-derived) [diag-lmv-golden-fx.ts:105-113], VERDICT PASS/FAIL + exit code [diag-lmv-golden-fx.ts:115-121]. ORACLE = 17 operator levels from Golden_Operator_Trade_Feedback_EU_GU.md [diag-lmv-golden-fx.ts:26-48]: EU 10 (8 ENTRY + 2 TP-role) + GU 7 ENTRY; chained TPs double as entries (EU #1 TP 1.14110 = EU #2 E [diag-lmv-golden-fx.ts:30-31]).

### MIGRATION D-01 — oracle level table
  current: ORACLE array 17 rows with pair/label/level/role [diag-lmv-golden-fx.ts:28-48].
  kev_replacement: NONE (measurement targets, not judgments).
  limite_replacement: NONE.
  gate: deterministic: nearest-rung Δpips ≤ tol comparison.
  needs_building: V6 offline eval `golden_levels.json` (same 17 rows) + `eval_oracle.py` asserting Limite-computed entries within tol of oracle. The oracle is the permanent regression bar for V6 math — keep byte-identical.
  notes: These 17 levels are also Kev fine-tune answers (state→entry question) AND Limite eval targets. Dual-use; never train AND eval on the same split without holding out (walk-forward discipline §12).

### MIGRATION D-02 — LMV rung reconstruction (buildChartModel EU/GU + lmv.table read)
  current: `buildChartModel('EUR/USD'/'GBP/USD',WEEK,1H,4H,30m,spot,undefined,15m)` [diag-lmv-golden-fx.ts:67-70] (note: `undefined` options = EMPTY_PILLAR path, unlike report harness real pillarResult) + `lmv?.table` rung scan [diag-lmv-golden-fx.ts:78] + spotFor last-4H-close [diag-lmv-golden-fx.ts:60-63].
  kev_replacement: NONE for rung construction (E1-slice). Kev Call 1 E1 Q-state consumes rungs as zone text.
  limite_replacement: Limite MATH CALL 1 (zone geometry) recomputes rung centers/widths from bars at runtime; the diag's nearest-rung search becomes a Limite-eval assertion (computed center within tol).
  gate: deterministic: T7 non-empty + data-derived invariant [diag-lmv-golden-fx.ts:105-113] stays as a V6 harness self-test (fixture swap → different rungs; hardcoded levels fail).
  needs_building: V6 `eval_lmv_parity.py`: given fixture bars, assert Limite rung centers match TS lmv.table within epsilon + oracle tol. Keep the `undefined`-options variant as a documented ablation (pillar-off baseline), not the primary eval.
  notes: The diag's `undefined` pillar arg vs report's real pillarResult [report-v452.ts:377-379] is an intentional coverage gap — V6 eval must run BOTH (pillar-on primary, pillar-off ablation) or ZFP-conditioned rung shifts go unmeasured.

### MIGRATION D-03 — T1-T6 per-level loop + T7 + verdict/exit
  current: T1-T6 loop [diag-lmv-golden-fx.ts:72-103] with float epsilon boundary (`dp <= tol + 1e-6`) [diag-lmv-golden-fx.ts:88]; T7 hardcode detector [diag-lmv-golden-fx.ts:105-113]; console PASS/FAIL + `process.exit(failures>0?1:0)` [diag-lmv-golden-fx.ts:115-121]; pass/fail helpers [diag-lmv-golden-fx.ts:65-66].
  kev_replacement: NONE. limite_replacement: NONE. gate: deterministic code (the gate IS this card).
  needs_building: Port loop verbatim to V6 eval harness (keep 1e-6 epsilon + ENTRY 3p / TP 5p split + exit-code contract so CI gates survive the language move). The 2026-08-05 measured result (EU 10/10 ≤2.5p, GU 7/7 ≤3.0p [diag-lmv-golden-fx.ts:11-14]) is the V6 acceptance bar — record as constants, not prose.
  notes: NOTHING here needs a model. This is the cheapest V6 keep: ~50 lines Python, highest regression value. The "TEMPORARY ARCHITECTURE" label [diag-lmv-golden-fx.ts:1-14] refers to the oracle-as-measurement doctrine, not the diag mechanics — mechanics are permanent.
## §3 — src/engine3/types.ts (158 lines) interface-by-interface map

### Types inventory (all anchors types.ts)
- `TradingViewScreenshot` [types.ts:22] {pair, timeframe 4H|1H|30m|15m, capturedAt, ...} — VC-daemon capture per spec §3.3.
- `VLMExtraction` [types.ts:47] {setupType, entryPoints{primary,secondary?,tertiary?}, stopLoss, ...} + `VLMZoneDetail` [types.ts:63] {top,bottom,tested,...} + `VLMCandlePattern` [types.ts:71] {level, pattern engulfing|pin_bar|inside_bar|doji|hammer|shooting_star|string, direction?} — unstructured-markdown VLM return (SYNTHESIS/03).
- `VisualZoneType` [types.ts:87] SUPPLY|DEMAND|LIQUIDITY; `VisualZoneSource` [types.ts:102] VLM_WICK|VLM_BODY_EDGE|VLM_REACTION_POINT|VLM_LQZ_BOUNDARY|VLM_NEW|VLM_CONFIRMED|FALLBACK_IP_EDGE (+SCAFFOLD_* at runtime).
- `VisualSDZone` [types.ts:120-151] {pair, type, top, bottom, timeframe 4H|1H|30m|15m telescoping, source, classification? BoM|MoM|BOSM|UNMITIGATED, mappedIPZoneName, mappedShapeDay, confidence 0-100 (VLM_CONFIRMED +20 cap 95), reactionCount, liquidityScore? 0-10, pattern?, ipZoneRef?} — Engine 3's S/D/L zone from VLM screenshot analysis.
- `VLMAnalysisResult` [types.ts:153-158] {visualZones, vlmExtraction, confidence, vcSourced}.

### MIGRATION T-01 — VisualSDZone → Kev state schema
  current: VisualSDZone [types.ts:120-151] is the visual-precision fact the generator consumes (entry edges, SL/TP rungs, Law-14 walk, significance ranking).
  kev_replacement: NONE as a question — but the zone SERIALIZES into Kev Call 3 E3 state ("E1+E2 outputs + candidate zone"). Every field (top/bottom/timeframe/source/classification/mappedIPZoneName/mappedShapeDay/confidence/reactionCount/liquidityScore/pattern) must survive into state text; reactionCount+classification drive Q4/Q5.
  limite_replacement: Limite reads the same zone for MATH CALLs 1-2 (width, SL distance) — numeric fields only.
  gate: deterministic: schema validator asserting top>bottom, timeframe enum, classification enum, confidence 0-100.
  needs_building: V6 `VisualZone` dataclass (same fields, Python) + `zone_to_state_text()` renderer + JSON-schema gate. The VLM_* source values become a provenance flag Kev Q5 (shield coverage) conditions on.
  notes: mappedIPZoneName + ipZoneRef are the E1↔E3 join keys — dropping them orphans visual zones from confluence/ZFP context (findNearestIPZone [visual-setup-generator.ts:1679] depends on them).

### MIGRATION T-02 — VLMExtraction / VLMZoneDetail / VLMCandlePattern → retired-from-runtime
  current: VLM return shapes [types.ts:47,63,71]; consumed by VisualZoneLobe verdict resolution (CONFIRMED|REJECTED|NEW line format).
  kev_replacement: NONE — VLM judgment (confirm/reject/add zones) is REPLACED by Kev Call 1/Call 3 questions over bar-derived state, not by a ported VLM call. No VLM at V6 runtime.
  limite_replacement: NONE.
  gate: NONE.
  needs_building: NOTHING at runtime. Offline: mine (screenshot-bars, VLM verdict, zone outcome) triples as Kev fine-tune records so Kev learns what the VLM used to judge. The extraction structs survive only as training-data column names.
  notes: This is the "primary coding agent NO LONGER NEEDED" thesis applied to vision: the VLM validator lane (TvChartController screenshots per TF) is the most expensive runtime block and the first to retire. Bar-derived LQZ detection (wick clusters, body edges, FVG — the lobe METHODOLOGY) must be rebuilt as deterministic Python (see Z-01) BEFORE Kev can replace the verdicts, or Kev has no visual facts to judge.

### MIGRATION T-03 — TradingViewScreenshot + VLMAnalysisResult → harness I/O retired
  current: screenshot capture struct [types.ts:22] + combined result [types.ts:153].
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE.
  needs_building: DELETE from V6 runtime. Screenshots persist only as offline training artifacts (zone-lobe corpus). V6 live loop never captures, never calls VLM. The vcSourced boolean's only successor is a data-source flag in the state text ("visual: bar-derived" vs "visual: none").
  notes: Explicit non-goal — do not build a screenshot pipeline in Python. That preserves the cost V6 is supposed to kill.
## §4 — visual-setup-generator.ts (1952 lines) function-by-function map

### G-00 orientation (read-only)
Class `VisualSetupGenerator` [visual-setup-generator.ts:240] with accumulators `rejectRecords` [visual-setup-generator.ts:242-245,249] + `ladders` [visual-setup-generator.ts:249-253]; tiers `isModelVerifiedSource` (VLM*|SCAFFOLD_CONFIRMED) [visual-setup-generator.ts:256-259] + `isBlindFallbackSource` (FALLBACK_IP_EDGE|SCAFFOLD_UNVERIFIED; FALLBACK_LQZ explicitly NOT blind) [visual-setup-generator.ts:261-263]; main `generateSetups(zoneMap,shapePrediction,visualZones,pair,spot,setupCounter,priorWeekMomentum,atr,opts{dxyMacroBias,bars1HByDay})` [visual-setup-generator.ts:290-315]. Module constants: FORWARD_SPREAD 1/1.5/2pips + DXY 0.02 [visual-setup-generator.ts:49-54]; SL_BUFFER_PIPS EUR2/GBP3/AUD3/DXY5 [visual-setup-generator.ts:61-64]; SHAPE_FAMILY_MAP incl. variant folds DWL→SS_DWL/STORM→SS/PBS→BS/PWL→WL/PRWL→RWL/RS→R [visual-setup-generator.ts:155-169]; CONSOLIDATION_WEEK_FLOORS 1.2-1.5 [visual-setup-generator.ts:146-153]; BASE_MAX_DIST_PIPS 300 + ATR_DIST_MULT 4 + RELAX_NEAREST_ZONES 3 [visual-setup-generator.ts:184-202]; MIN_CONFIDENCE 60/50 [visual-setup-generator.ts:205-206]; SESSION_BY_VALUE/resolveSessionWindow import-boundary enum re-resolution [visual-setup-generator.ts:122-131]; categoryKeyOf UPPER_SNAKE [visual-setup-generator.ts:138-140]; helpers normalizeAtrToPips (price<1 → /pipValue) [visual-setup-generator.ts:80-83] + computeWeeklyAtrPips (42×4H TR mean or atr1h×20 proxy) [visual-setup-generator.ts:93-114].

### MIGRATION G-01 — day×category iteration + distance gate (the eligibility harness)
  current: days resolve (dayDecomposition or single-day fallback) [visual-setup-generator.ts:355-363]; isConsolidationWeek (all SS/R/WLS) [visual-setup-generator.ts:366-369]; dedup sets seenKeys/usedZones/emittedGeometry [visual-setup-generator.ts:376-378]; per-day categories getCategoriesForShape [visual-setup-generator.ts:381] + §8.1 scalp lane (holding-wall zfp<30 at ceiling/floor, non-AUD) [visual-setup-generator.ts:383-391] + §8.13 AUD filter (HTF_SWING+REINFORCEMENT only) [visual-setup-generator.ts:393-396]; per-zone side gate (SUPPLY above / DEMAND below spot) [visual-setup-generator.ts:424-435] + direction from zone type [visual-setup-generator.ts:428-431] + distPips (DXY points vs FX pips) [visual-setup-generator.ts:434-436] + category cap vs ATR cap effectiveMaxDist [visual-setup-generator.ts:414-418] + relax-to-nearest-N within 1.5× bound (DXY 3.00 / FX 300) [visual-setup-generator.ts:441-463].
  kev_replacement: Kev Call 3 Q1 direction + Q3 session-valid absorb the per-zone direction/session judgment; Q2 quality absorbs category selection. The DISTANCE gate itself stays code (see gate).
  limite_replacement: NONE (distPips is one subtraction + division).
  gate: deterministic code: side-of-spot gate, distPips cap, relax bound, AUD category filter, scalp-lane ceiling/floor structural test (isAtCeilingOrFloor [visual-setup-generator.ts:1757-1773]: 3-nearest-supply-above / 3-nearest-demand-below).
  needs_building: V6 harness `eligible_zones()` (same gates, Python) producing the Kev E3 candidate list; scalp-lane + AUD rules as pure functions with unit tests (boundary: distPips == cap passes; relax beyond 1.5× never).
  notes: The old day-level direction lock (GBP/AUD 0-setup class) is already dead — per-zone direction [visual-setup-generator.ts:424-435] is the fix. V6 must not regress to day-level direction; Kev Q1 is per-candidate-zone, never per-day.

### MIGRATION G-02 — WL/SS category filters + reaction-validity (no-touch) gate
  current: WL entries (WHIPLASH or WL-family HTF_SWING) only at Hard Walls zfp<20 [visual-setup-generator.ts:484-487]; SS only at holding walls zfp<30 [visual-setup-generator.ts:488-491] + lane-driven SS also needs ceiling/floor [visual-setup-generator.ts:494-498]; C2 reaction-validity: entry band (zone range + Law-7 buffer on approach side) must intersect the day's 1H bars, missing-bars → inert [visual-setup-generator.ts:500-525].
  kev_replacement: Kev Call 3 Q5 shield coverage + Call 2 Q4 freshness LEARN these filters (hard-wall/holding-wall/no-touch become training labels), but the V6 harness keeps the deterministic versions as pre-filters until Kev parity is proven — they are the slop-killers (DXY-40 class).
  limite_replacement: NONE.
  gate: deterministic code (BOTH gates stay): zfp-threshold filter + no-touch band intersection. Deleting no-touch reopens the 13-zones × re-fire slop class documented inline.
  needs_building: Python `hard_wall_filter()`, `holding_wall_filter()`, `reaction_validity()` + Kev fine-tune records (zone-day-bars → touch/no-touch label). Parity-test against TS skip-log counts on the golden week.
  notes: zoneZfp inherits via findNearestIPZone [visual-setup-generator.ts:1748-1750,1679-1746] (name→IoU>0.5 type-class→same-pair-midpoint priority). That inheritance is load-bearing for BOTH filters — port it exactly (W6-4 Fix 2) or zfp-gated Kev labels go noisy.

### MIGRATION G-03 — 3-confluence minimum + countConfluences
  current: `countConfluences` [visual-setup-generator.ts:978-1010]: 1 zone→direction + 2 correct-side (both free by construction) + 3 shape alignment (SS/R/WLS both-valid else bias match) + 4 VLM-sourced + 5 IP-mapped + 6 bias aligned; floor ≥3 [visual-setup-generator.ts:528-532].
  kev_replacement: Kev Call 3 Q2 quality grade + Q5 shield coverage DIRECTLY replace confluence counting — the six checks become (state, question, options) training rows, not code branches. This is the single cleanest Kev conversion in engine3.
  limite_replacement: NONE.
  gate: deterministic during transition: keep ≥3 floor as a Kev-output backstop (reject Kev-passing candidates with <3 computable confluences) until Q2 calibration (ECE) is proven; then retire.
  needs_building: Kev fine-tune set: (zone+day+chain-bias state, "quality grade?" Score F/C/B/A/A+, label from realized outcome) + ("shield coverage?" NOUL). Retire countConfluences after calibration.
  notes: Checks 1-2 are free by construction — a Kev training renderer must NOT present them as discriminative features or the model learns a constant. Render only checks 3-6 as state text.

### MIGRATION G-04 — computeStaggeredEntries (3-entry + forward spread)
  current: `computeStaggeredEntries` [visual-setup-generator.ts:1075-1094]: LONG front=top+fwdSpread/back=bottom+fwdSpread; SHORT front=bottom-fwdSpread/back=top-fwdSpread; mid=midpoint. Consumed at primary path [visual-setup-generator.ts:534] + chained path [visual-setup-generator.ts:1844] + LQZ-overlap ladder-entry annotation (no order effect) [visual-setup-generator.ts:540-550].
  kev_replacement: NONE (geometry).
  limite_replacement: Limite MATH CALL 2 (SL distance) + MATH CALL 1 (zone geometry) take staggered entries as INPUTS; the stagger computation itself is one addition per leg — keep in code, not a model call.
  gate: deterministic code — port verbatim (sign errors here invert fills; test LONG front>top, SHORT front<bottom).
  needs_building: Python `staggered_entries(zone,direction,fwd_spread)` + TensorTrade mapping (3 legs → 3 limit orders 33/33/34 weights [visual-setup-generator.ts:858-862]).
  notes: Blended RRR (front .33/mid .33/back .34) [visual-setup-generator.ts:828-831] + realizedRrr=front [visual-setup-generator.ts:831] must survive as the TensorTrade position-aggregation rule, or multi-leg P&L diverges from the report's R.
### MIGRATION G-05 — D36 retry loop (attempts 1-3, ENTRY fixed, SL/TP re-anchor)
  current: loop attempt 1..3 [visual-setup-generator.ts:595-670]: SL `computeSLNextLqzRung(entry,vz,dir,zones,pair,atr1h,attempt)` [visual-setup-generator.ts:596] with attempt-3 Law-8-direct fallback + D17 36p ceiling on EVERY path [visual-setup-generator.ts:599-614]; SL null → SL_CEILING trail [visual-setup-generator.ts:615-618]; zero-dist → SL_ZERO [visual-setup-generator.ts:619-622]; TP `computeTPSignificancePath(...,attempt)` [visual-setup-generator.ts:627-630] with attempt-3 TP_NULL → HARD REJECT (ATR-projected fantasy fallback REMOVED — Phase-4.5 Defect A) [visual-setup-generator.ts:631-643]; RRR floor gate as repair TARGET [visual-setup-generator.ts:646-656]; fail → rejectRecords.push + [reject] log, never silent [visual-setup-generator.ts:659-667]; success fixes sl/slMethod/tp/tpResultFinal [visual-setup-generator.ts:647-650]; GOLDEN T1 trace DXY SS LONG entry 100.945 → SL 100.905 shelf 4p → TP 101.115 17p → RRR 4.25 PASS attempt 1 [visual-setup-generator.ts:561-567]. Floor minRrr = rrrForCategory(category).tp1 or CONSOLIDATION_WEEK_FLOORS [visual-setup-generator.ts:577-582]; firstSlPips/firstRrr recorded for repair annotation [visual-setup-generator.ts:589-594,645].
  kev_replacement: Kev Call 3 Q4 "SL in envelope? → [yes,no]" + Q2 quality LEARN the accept/reject judgment the loop approximates by search. The loop is search-as-judgment; Kev is judgment-direct. Keep loop as fallback until Kev calibration proven, then Kev-first with loop as repair-only.
  limite_replacement: Limite MATH CALLs 2-3 compute each attempt's SL/TP/RRR numbers; the loop CALLS Limite per attempt (≤3 math rounds per candidate). Attempt index → Limite prompt prefix ("nearest rung" vs "one shelf deeper" vs "law-8 direct").
  gate: deterministic code: ENTRY NEVER MOVES during repair [visual-setup-generator.ts:553-560]; 36p D17 ceiling on every SL path; 3-fails = HARD REJECT with audit trail (RepairAttempt/RejectRecord [visual-setup-generator.ts:227-239]); no fantasy TP targets ever.
  needs_building: V6 `anchor_sl_tp()` (loop port, Limite-backed) + `reject_records` ledger + Kev Q4/Q2 training rows from (attempt-N state, pass/fail label) — the repair trail IS fine-tune data.
  notes: Operator ruling "MINIMUM 3 RRR NOTHING LESS" [visual-setup-generator.ts:1491-1500] vs category floors rrrForCategory: V6 gate uses max(category floor, 3.0) until doctrine reconciles; the classifyQuality bands already enforce ≥3.0 [visual-setup-generator.ts:1501-1512].

### MIGRATION G-06 — computeSLNextLqzRung (Law 7 / Law 10 / Law 8 / D17 / T6)
  current: `computeSLNextLqzRung` [visual-setup-generator.ts:1126-1257]: Step 1 LQZ-rung preferred anchor (LIQUIDITY|FALLBACK_LQZ|name-has-LQZ|sdOverlap LQZ) [visual-setup-generator.ts:1138-1145]; Step 1b structural general anchor (SUPPLY|DEMAND, Law 7 verbatim) [visual-setup-generator.ts:1152]; Step 2 next-beyond-entryZone ordered LQZ-first then structural, attempt-N walks N deep, adjacency <= [visual-setup-generator.ts:1159-1180]; Law 7 INSIDE placement (LONG top-buffer / SHORT bottom+buffer) [visual-setup-generator.ts:1183-1194]; Step 3 T6 UM-BoM-block near-edge within 40p [visual-setup-generator.ts:1199-1219]; Step 4 Law-8 max(zoneWidth×2, 1.5×ATR) [visual-setup-generator.ts:1124-1136]; Step 5 Law-10 max(0.5×ATR,buffer) floor-push (atr=0 skips) [visual-setup-generator.ts:1140-1151]; Step 6 D17 36p → null [visual-setup-generator.ts:1155-1157].
  kev_replacement: Kev Call 3 Q4 "SL in envelope?" judges the RESULT (envelope validity), never computes the anchor. Do not ask Kev for pip distances.
  limite_replacement: Limite MATH CALL 2 (SL distance) computes each candidate SL + distance + floor/ceiling checks; V6 keeps the rung-SEARCH in code (zone list scan) and calls Limite for the arithmetic + Law-10/D17 verification.
  gate: deterministic code — port search + placement verbatim; buffer table SL_BUFFER_PIPS is law (duplicated in ladder-generator.ts:40-42 — single-law duplication by design, keep both, test equality).
  needs_building: Python `sl_next_rung()` + `sl_buffer_table` + Kev Q4 labels (SL, envelope verdict) from golden SLs (4-9.5p dense-rung class cited [visual-setup-generator.ts:1099-1105]).
  notes: The golden-T1 4p SL is the precision proof: next-shelf closeness is WHY golden RRRs clear 3.0. Any V6 SL path that widens SLs (e.g. Law-8-only fallback) collapses RRR — the D17 ceiling + rung-first ordering prevent exactly this.

### MIGRATION G-07 — computeTPSignificancePath (Laws 11/12/13/14 + significance + mitigation walk)
  current: `computeTPSignificancePath` [visual-setup-generator.ts:1289-1424]: viable-RRR precondition |TP-entry| ≥ 1.2×|entry-SL| [visual-setup-generator.ts:1300]; opposing filter (LONG SUPPLY|LIQUIDITY above / SHORT DEMAND|LIQUIDITY below) [visual-setup-generator.ts:1304-1308]; significance UM-BoM +100 / liq≥5 +50 / BoM +25 / MoM≤1× +15 / 3×+ −100 excluded (sig>−50, significance-first proximity-second) [visual-setup-generator.ts:1315-1327]; Law 12 TP-tf ≥ entry-tf (15m1/30m2/1H3/4H4) [visual-setup-generator.ts:1331-1333]; simulated mitigation effectiveReactionCount (static + priorSetups earlier-days entry-or-TP-inside) [visual-setup-generator.ts:1337-1345]; Law-14 walk capped at first UM between entry and target with hasRealFreshness filter (BoM|MoM|VLM*|SCAFFOLD_CONFIRMED-structural-rung; CONFIRMED passive PIVOT/FIB/SWING/MA/OPTION_WALL pass-through — W7-B mesh fix) [visual-setup-generator.ts:1363-1395]; Law 11/33 midpoint if liq≥5 else near edge [visual-setup-generator.ts:1399-1402]; Law 13 >3×weeklyATR skip, >2× ambitious flag, 0=unknown no-constraint [visual-setup-generator.ts:1409-1410]; attempt-Nth pass returned [visual-setup-generator.ts:1412-1416].
  kev_replacement: Kev Call 3 Q1 direction + Q2 quality + PVE Q1 TP-probability Score learn target SELECTION (which pool price is drawn to); the walk mechanics stay code until Kev parity, then Kev proposes / walk verifies.
  limite_replacement: Limite MATH CALL 3 (RRR) + CALL 4 (fib levels for confluence) verify each candidate TP (distances, 1.2× precondition, ATR multiples); the zone scan stays code.
  gate: deterministic code — port walk verbatim; the hasRealFreshness placeholder-IP exclusion [visual-setup-generator.ts:1363-1383] is the DXY=0-evidence fix, never relax it; Law-13 skip (not reject) preserves candidates for deeper attempts.
  needs_building: Python `tp_significance_walk()` + weekly-ATR provider + Kev TP-selection labels (entry-state → chosen pool) from golden TPs (55.5p T6 simulated-mitigation case [visual-setup-generator.ts:1310-1314] is the flagship training row).
  notes: PriorSetups ledger [visual-setup-generator.ts:329-332] (entry-or-TP-inside mitigates for LATER days only, dayIndex-guarded) must be rebuilt in the V6 harness loop or multi-day TP walks over-extend.
### MIGRATION G-08 — SL cap + dedup + IP map + confidence + quality + session + validation + notes
  current: SL_CAP_PIPS uniform-pips cap (DXY Defect-C fix) [visual-setup-generator.ts:674-682]; dedupKey direction_entry_sl_tp_day_category [visual-setup-generator.ts:690-694] + zoneDayKey pair_zone_day_session (same zone+day+session = same trade; different day DISTINCT — W6-1 fingerprint DELETED) [visual-setup-generator.ts:706-711] + globalGeomKey pair_geom_day cross-zone guard [visual-setup-generator.ts:717-722]; `findNearestIPZone` [visual-setup-generator.ts:1679-1746] (name→IoU>0.5 type-class→same-pair-midpoint); cascadeAligned from INJECTED dxyMacroBias (inverse; HTF_SWING|BREAKOUT_SURGE only; SS neutral) [visual-setup-generator.ts:735-744]; `scoreConfidence` [visual-setup-generator.ts:1427-1489] (vz.conf + min(15,confluence×1.5) + BoM5 + cascade10 + zoneAlign8 + bias5 + VLM7 + RRR5/3 − SL10/5 − dist8/4 − momentum+3/−8, clamp 0-100); floor MIN_CONFIDENCE_CONDITIONAL [visual-setup-generator.ts:751-755]; `classifyQuality` [visual-setup-generator.ts:1501-1512] (GOD_TIER 90+3.0+VLM / HIGH 80 / STANDARD 60 / CONDITIONAL 50 / REJECTED; sub-3.0 never above CONDITIONAL); session resolve SHAPE_SESSION_MAP→CATEGORY_SESSION_MAP→LONDON_OPEN [visual-setup-generator.ts:764-766] + AUD NY-kill Gate B [visual-setup-generator.ts:773-778]; `buildDirectionValidation` exactly 6 checks CS12 (Zone Category / Zone Direction / Confluence ≥3 / RRR 3.0 PASS-2.5 WARN-else FAIL / Session / Sniper Precision) [visual-setup-generator.ts:1531-1593]; `buildNotes` [visual-setup-generator.ts:1606-1675] (src VLM-LQZ|DATA-FALLBACK, 3-entry, SL method, TP zone, RRR/conf/Q, phase, dist, SESSION-enforcement, candlePatternFor [visual-setup-generator.ts:1596-1602] Hammer|Bullish-Engulfing / Pin-Bar|Bearish-Engulfing, momentum) + REPAIRED(attempt) + AMBITIOUS + LADDER annotations [visual-setup-generator.ts:813-826]; TradeSetup assembly [visual-setup-generator.ts:834-886] (entryWeights 33/33/34, blendedRrr, realizedRrr=front, quality, slDistancePips, entryEdge, cascadeSource, vlmStatus); ledger priorSetups.push + usedZones/emittedGeometry record [visual-setup-generator.ts:888-900].
  kev_replacement: Q2 quality Score ← confidence+quality+variance; Q3 session-valid ← session assignment; 6-check validation → (state → 6 parallel Kev NOUL/Choice questions) for auditability; notes/candle-pattern → RETIRED from decision path (execution-discipline text, not judgment).
  limite_replacement: blendedRrr/realizedRrr/slDistancePips/proximityPips arithmetic → Limite MATH CALL 3 verification (recompute + assert equal).
  gate: deterministic code: dedup triple (never Kev); SL cap; confidence floor; AUD session gate; RRR band in validation; zone-day consumption.
  needs_building: Python ports of dedup keys + confidence (as backstop) + session resolve + validation builder; Kev Q2/Q3 labels from (setup-state, realized outcome); notes renderer kept for human audit log only.
  notes: The confidence formula is the richest single source of Kev training features (every bonus/penalty term → a state-text sentence). Port it as a feature renderer first, backstop second, retire third — in that order.

### MIGRATION G-09 — generateChainedSetups (engine3 twin) + ladder pass
  current: `generateChainedSetups` [visual-setup-generator.ts:1790-1947]: TP-zone lookup ±pipValue [visual-setup-generator.ts:1798-1800]; LQZ-pivot exemption [visual-setup-generator.ts:1806-1810]; freshness (tpIpZone.reactionCount>1 kills unless pivot) [visual-setup-generator.ts:1825-1828]; reverseDir [visual-setup-generator.ts:1831-1832]; chainShapeMap SHORT|SS→RWL etc [visual-setup-generator.ts:1835-1841]; stagger+SL+TP reuse [visual-setup-generator.ts:1844-1857]; parent-category floor (consolidation-aware) [visual-setup-generator.ts:1866-1870]; §8.4 chain dedup keys + consumption [visual-setup-generator.ts:1876-1892]; chained assembly (confidence ×0.85, NY_MID, chainedFrom, chainShape) [visual-setup-generator.ts:1898-1945]. Ladder pass [visual-setup-generator.ts:928-962]: BS-family only via SHAPE_FAMILY_MAP [visual-setup-generator.ts:933-935] → `generateLiquidityLadder` → this.ladders.push + notes annotate [visual-setup-generator.ts:948-952].
  kev_replacement: chained reverse-direction judgment → Kev Q1 on chained candidate (same as H-10); ladder PARENT eligibility (BS-family) → Kev Call 2 Q1 shape (BS/PBS) — no separate ladder question.
  limite_replacement: chained geometry → Limite MATH CALLs 1-3 (same as H-10); ladder sizing/combined-RRR → Limite MATH CALL 3 variant (weighted-reward ÷ primary-risk).
  gate: deterministic: parent-category floor; chain dedup; BS-family ladder gate; MAX_ROCKETS 2.
  needs_building: Python `chained_setups()` + `liquidity_ladder()` (ladder-generator.ts port, see §5) + Kev rows for chained outcomes.
  notes: Engine3 chaining and harness ZR-4A chaining (H-10) are TWINS with different inputs (visual zones vs mirror lanes) — V6 unifies into one `chain_decisions()` over TradeDecisions. Keep both golden behaviors (LQZ-pivot exemption + depth-3 proof) in the unified version.
## §5 — ladder-generator.ts (263 lines) full map

### L-00 inventory (read-only)
Constants SL_BUFFER_PIPS (EUR2/GBP3/AUD3/DXY5, restated import-cycle-free) [ladder-generator.ts:40-42]; DEFAULT_PIP_VALUE 0.0001 [ladder-generator.ts:45]; MIN_RUNG_SPACING_PIPS 15 (doctrine 20-30) [ladder-generator.ts:48]; MAX_ROCKETS 2 (30%/20%) [ladder-generator.ts:51]; BS_FAMILY_SHAPES {BS,PBS} [ladder-generator.ts:54]. Interfaces LadderRung {kind primary|rocket, entry, sl, tp shared, sizePct 50/30/20, riskPips, zoneName, beTrigger?} [ladder-generator.ts:60-69]; LadderStructure {parentSetupId, pair, direction LONG|SHORT, rungs, sharedTP, combinedRrr, shape} [ladder-generator.ts:71-80]; LadderParentSetup minimal view {setupId, pair, direction, entry, sl, tp, shape, category?, zoneName?} [ladder-generator.ts:82-92]. Function `generateLiquidityLadder(parentSetup,allZones,pipValue)` [ladder-generator.ts:107-263].

### MIGRATION L-01 — preconditions (BS-family + geometry)
  current: Precondition 1 BS-family reject with log [ladder-generator.ts:121-125]; Precondition 2 direction LONG|SHORT + finite entry/sl/tp + LONG tp>entry / SHORT tp<entry + primaryRiskPips>0 [ladder-generator.ts:127-151]; tag `[ladder] pair setupId` [ladder-generator.ts:119].
  kev_replacement: Kev Call 2 Q1 shape (BS/PBS verdict) IS the parent-eligibility judgment — no separate ladder question. Geometry validity stays code.
  limite_replacement: NONE (comparisons).
  gate: deterministic code — port preconditions verbatim; Bible 5.12 (WL isolated energy can't guarantee piercing) cited at call-site [visual-setup-generator.ts:928-932] stays as comment.
  needs_building: Python `ladder_preconditions()` returning (ok, reason); log reason on reject (parity with TS log strings for diff-testing).
  notes: WL/RWL/WLS/SS/R rejection is doctrine, not tuning — Kev must not learn to arm ladders on WL even if backtest flatters it. Hard gate, never a question.

### MIGRATION L-02 — MoM rung candidates + spacing + ≥2 precondition
  current: candidates = pair-matched + classification MoM ONLY (BoM excluded — primary/target, never rocket) [ladder-generator.ts:158-180]; entry at NEAR edge toward TP (SHORT bottom / LONG top), SL at FAR edge ∓ buffer (SHORT top+buffer / LONG bottom-buffer, Law 7) [ladder-generator.ts:182-184]; strictly-between parent entry and shared TP [ladder-generator.ts:187-190]; sort nearest-from-entry [ladder-generator.ts:193-194]; ≥15p spacing between successive ROCKET rungs (primary↔rocket1 exempt — triggers on leaving primary) [ladder-generator.ts:196-199]; Precondition 3 ≥2 spaced rungs else reject+log [ladder-generator.ts:201-205].
  kev_replacement: NONE for search (deterministic scan). Kev Call 3 Q5 shield coverage may LEARN rung-density preference, but the candidate list stays code.
  limite_replacement: Limite verifies each candidate (entry/SL/riskPips arithmetic) — MATH CALL 2 per rung; search itself is code.
  gate: deterministic code — port scan verbatim; MoM-only + BoM-exclusion + strictly-between + spacing are all load-bearing (rockets inside the entry→TP corridor only).
  needs_building: Python `ladder_candidates()` + unit tests (BoM ignored; outside-corridor ignored; spacing drops near-duplicates; <2 → None).
  notes: The primary↔rocket1 spacing exemption is the subtle rule — test it explicitly or V6 ladders under-arm on dense rung stacks (the golden T1-T4 chains sit on dense rungs).

### MIGRATION L-03 — primary + rockets + BE cascade + combined RRR
  current: primary {entry,sl,tp,sizePct 50,riskPips} [ladder-generator.ts:207-215]; rockets sizes [30,20] sliced to MAX_ROCKETS [ladder-generator.ts:219-220] with BE cascade (rocket1-fill → primary SL to entry; rocket2-fill → rocket1 SL to rocket1 entry) [ladder-generator.ts:228-234]; weightedRewardPips = Σ(|tp-entry|/pv × sizePct/100) [ladder-generator.ts:240-241]; combinedRrr = weighted ÷ primaryRisk [ladder-generator.ts:242]; armed log (direction, shape, rungs, primary risk, shared TP, combined, BE) [ladder-generator.ts:244-248]; return LadderStructure [ladder-generator.ts:250-258].
  kev_replacement: NONE (position engineering).
  limite_replacement: Limite MATH CALL 3 variant computes weighted reward + combined RRR (the 16-61x class claim lives here — verify, don't trust).
  gate: deterministic code — sizes 50/30/20, BE cascade wiring, combined formula; TensorTrade maps rungs → staged limit orders + stop-move rules.
  needs_building: Python `build_ladder()` + TensorTrade adapter (primary order + 2 rocket orders + BE triggers as broker stop-update callbacks) + eval asserting combined RRR recomputes from rung legs (independent R recomputation like fp-precision rule [report-v452.ts:1295-1301]).
  notes: Ladders accumulate across generateSetups calls (this.ladders [visual-setup-generator.ts:249-253], armed total log [visual-setup-generator.ts:958-960]) — V6 harness keeps a per-week ladder ledger for the same auditability.
## §6 — visual-zone-lobe.ts (552 lines) VLM pipeline → V6 map

### Z-00 pipeline (read-only)
METHODOLOGY header [visual-zone-lobe.ts:1-16]: 4H OB S/D (last-bullish-before-bearish = supply, last-bearish-before-bullish = demand, zone = that candle's range); 1H/30m/15m LQZ (wick clusters 2-4+ tips, body edges 3+ bodies, FVG boundaries, tight consolidations 3-5 candles ≤25p); LQZ NESTED INSIDE S/D; LTF narrower, snap to 15m wicks (telescoping). PIPELINE identifyZones [visual-zone-lobe.ts:94-100]: Step 1 telescoping capture 4H→1H→30m→15m via TvChartController (playwright CDP input-injection navigate→timeframe→zoom→screenshot, headed Chrome :9228) [visual-zone-lobe.ts:101-128]; Step 2 per-TF VLM validation (E1 zone map as BASE MAP with exact levels; VLM = VALIDATOR not identifier) [visual-zone-lobe.ts:130-147]; Step 3 verdict resolution (CONFIRMED inherit name/reactionCount/liquidityScore; REJECTED excluded; NEW medium confidence) [visual-zone-lobe.ts:149]; Step 4 multi-TF merge (4H containers, LTF refinements, narrower wins) [visual-zone-lobe.ts:149]. NO FALLBACK LAW [visual-zone-lobe.ts:32-35]: never uses E1 IP zones as visual zones; controller/fetch/VLM failure → THROW with context (controller-required [visual-zone-lobe.ts:103-105], capture-failed [visual-zone-lobe.ts:126-128], 0-zones [visual-zone-lobe.ts:145-147], fetch-required [visual-zone-lobe.ts:284-286], empty-VLM [visual-zone-lobe.ts:291-293]). Verdict grammar CONFIRMED|TYPE|TOP|BOTTOM|CLASS|TF / REJECTED|ZONE_NAME / NEW|... [visual-zone-lobe.ts:175-177,230-233] with confidence CONFIRMED 85 / NEW 65 [visual-zone-lobe.ts:302-305,364-371]; legacy bare-TYPE lines → NEW; LQZ→LIQUIDITY [visual-zone-lobe.ts:307-313]; parse [visual-zone-lobe.ts:314-371]; validateVisualZones inheritance via 8-pip geometric match (verdict from VLM, matching metadata-only) [visual-zone-lobe.ts:384-433]; REJECTED-ref resolver (positional Zone N + name/id forms) [visual-zone-lobe.ts:451-532]; alias captureWeekZones [visual-zone-lobe.ts:533-551]. Deps tvSymbolForPair/TvChartController [visual-zone-lobe.ts:40-43] + TvChartImageFetch.analyzeScreenshot (opencode-SDK primary, MiMo-HTTP net) [visual-zone-lobe.ts:270-296] + engine1BaseMap same-slice rule [visual-zone-lobe.ts:244-248].

### MIGRATION Z-01 — bar-derived zone detector (the VLM's deterministic successor)
  current: zones come from screenshots+VLM; bar methodology (OB candle rule, wick-cluster/body-edge/FVG/consolidation thresholds, nesting, telescoping) lives as PROSE in the header, not as code.
  kev_replacement: NONE for detection. Kev judges candidate zones; it does not scan bars for wick clusters.
  limite_replacement: NONE (detection is pattern scanning, not equation solving; pip arithmetic inside is trivial code).
  gate: deterministic code — THIS IS THE LARGEST MUST-BUILD: `detect_ob_zones_4h()` (last-opposite-candle-before-displacement rule) + `detect_lqz_ltf()` (wick-cluster ≥2-4 tips within tolerance / body-edge ≥3 bodies / FVG / consolidation 3-5 candles ≤25p) + `nest_lqz_in_sd()` + `telescope_refine()` (LTF narrows, snap to 15m wicks) + `merge_multitf()` (4H containers, narrower wins). Every threshold above becomes a named constant with the header prose as its docstring.
  needs_building: Python detector module + parity eval vs VLM corpus ((bars, VLM verdict) pairs → detector must CONFIRM the CONFIRMED set and flag the REJECTED set as artifacts at measured precision/recall; NEW-zone recall is the stretch goal). Without this, Kev has no visual facts and V6 falls back to E1-only entries.
  notes: The NO-FALLBACK law inverts in V6: bar-derived detection IS the primary (always available, deterministic); VLM becomes at most an offline labeler. The throw-on-failure semantics [visual-zone-lobe.ts:103-147,284-293] become a data-quality gate (no zones detected → no-trade, loudly, not a fallback entry).

### MIGRATION Z-02 — verdict resolution + inheritance + merge → Kev training + code
  current: CONFIRMED→85/NEW→65 confidence [visual-zone-lobe.ts:302-305,364-371]; inheritance (name/reactionCount/liquidityScore via 8-pip match) [visual-zone-lobe.ts:384-433]; REJECTED exclusion [visual-zone-lobe.ts:402-412]; merge narrower-wins [visual-zone-lobe.ts:149].
  kev_replacement: The CONFIRMED/REJECTED/NEW verdict becomes Kev Call 3 Q5-adjacent training rows (zone-state → confirm/reject/add label) once the bar detector proposes candidates.
  limite_replacement: NONE.
  gate: deterministic: confidence assignment (85/65) + inheritance match + REJECTED exclusion + merge priority — port as the detector's post-processor.
  needs_building: Python `resolve_verdicts()` (detector candidates × E1 map → CONFIRMED/NEW + REJECTED ids + merged VisualZone list) + Kev rows from historical verdicts.
  notes: Keep the engine1BaseMap same-slice rule [visual-zone-lobe.ts:244-248] (prompt slice ≡ resolver slice) as an eval-consistency rule: the state text Kev judges must be the same slice the labels were made from, or positional refs ("Zone N") misalign.

### MIGRATION Z-03 — capture stack (TvChartController + TvChartImageFetch + headed Chrome) → RETIRED
  current: playwright CDP :9228 headed-Chrome capture + opencode-SDK/MiMo VLM send [visual-zone-lobe.ts:69-83,270-296] + tv-chart-controller.ts + tv-chart-image-fetch.ts siblings.
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE.
  needs_building: NOTHING in V6 runtime. Archive the two sibling modules + headed-Chrome ops runbook as training-corpus tooling only. The web-data agent (see §7) fetches BARS, never screenshots.
  notes: This is the clearest cost kill in the slice: headed browser + VLM calls per TF per pair per week → zero. Name it in the fork-and-convert map as RETIRE-01 so no one re-adds screenshot capture "for precision" without relitigating Z-01 parity numbers.
## §7 — web-data agent mapping (E1 market-data fetching → V6 Market Feed tools)

### W-00 why a web-data agent exists in V6 (read-only finding)
The v4.5.3 harness runs OFFLINE from fixtures (`BARS_FIXTURE` [report-v452.ts:106] + `OPTIONS_WALLS_FIXTURE` [report-v452.ts:114]); the LIVE data acquisition lives in `src/clients/` + `src/brains/9-pillar-lobe.ts` PillarInputs. V6 live trading cannot run from `/tmp/opencode/*.json` — every network fetch below becomes a web-data-agent TOOL whose cached result feeds the Python harness `Market Feed → State Constructor`. The honest-[NO DATA] doctrine (ZR-7A) is the agent's failure contract: fetch failure → dimension scores 0 + provenance `*_NO_DATA`, never a proxy.

### MIGRATION W-01 — OHLC bars + spot (the Market Feed core)
  current: `tradingview-client.ts:60-64 getOHLCHistory(symbol,timeframe,bars)` (tvDatafeed WebSocket, 120s cache `ohlcCache` [tradingview-client.ts:45-46], retry-after-5s on 0 bars [tradingview-client.ts:92-96]); `_DEPRECATED_yahoo-finance-client.ts:89 getOHLCHistory` (query1.finance TradingView HTTP, 60s cache [yahoo:53-54], 10s abort [yahoo:119-127], 1H→4H aggregation [yahoo:230-231]); `market-data-client.ts:62 fetchSpot` (5s TTL [market-data-client.ts:19-20], SYMBOL_MAP [market-data-client.ts:23], poll `fetchSpot` per instrument [market-data-client.ts:136-138], `getSpot/getAllSpots` [market-data-client.ts:113-125]). Harness consumes via `barsFor/simBarsFor/spotFor/sessionStartPrice/dayOpenPrice` [report-v452.ts:321-397].
  kev_replacement: NONE. limite_replacement: NONE. gate: NONE (I/O).
  needs_building: web-data-agent tools `fetch_bars(pair,tf,n)` (TradingView primary, Yahoo fallback, TTL 60-120s, 0-bars retry) + `fetch_spot(pair)` (5s TTL) + `snapshot_bars(anchorMs)` (≤anchor scoping for backtest parity). V6 harness calls tools, never fetch() directly; backtest mode replays fixture files instead of calling tools (same return shape).
  notes: Cache TTLs are load-bearing (5s spot vs 120s bars) — port as tool metadata, not comments. The `Date.now()` cache clocks in all three clients violate harness determinism; V6 backtest freezes time at anchorMs (cf. H-14 leak [report-v452.ts:838]).

### MIGRATION W-02 — P2 external MA + technicals (barchart + tradingview-technicals)
  current: `barchart-client.ts:98 fetchCheatSheet(instrument)` (fetch+regex, 1h TTL [barchart:105-109], unknown-instrument guard [barchart:100-102], `getAllInstruments` allSettled partial [barchart:184-212]); `tradingview-technicals-client.ts:106 fetchTechnicals` (same shape, 1h TTL [tv-tech:113-117]); consumed as `PillarInput.barchartData/tradingviewTechnicals` → `computeP2` 12-MA grid (6 EMA+6 SMA, 15p cluster) [9-pillar-lobe.ts:1293-1305].
  kev_replacement: NONE (inputs, not judgments). limite_replacement: NONE.
  gate: NONE (absent → P2 bar-only path; never fabricate MA).
  needs_building: agent tools `fetch_barchart_ma()` + `fetch_tv_technicals()` (1h TTL, partial-success tolerated, unknown-instrument hard error). Training: (MA-grid state → P2 score) rows for Kev E1.
  notes: Partial-fetch tolerance (`allSettled` + warn [barchart:210-212]) must survive — one blocked scrape must not kill the whole feed.

### MIGRATION W-03 — P3/P8 options (investinglive VLM pipeline + K-factor spots)
  current: `investinglive-client.ts:3-18` header — strikes live in an IMAGE, CloudFront 403 blocks headless, so NO direct HTTP; agent executes CaptureInstruction pipeline [investinglive:63-64] (webfetch Orders/ → expiry URL → fetch page → extract image URLs → download /tmp/ → `visual-cortex_analyze`); `storeData` [investinglive:100-103] + `getCached` [investinglive:89] (1h TTL [investinglive:79]) + `refreshAll` non-blocking warn-to-run-`plutus-options-extract` [investinglive:121-140]; `convertOptionStrikeToDXY` geometric-mean K-factor [9-pillar-lobe.ts:1480-1496] (missing component → null [9-pillar-lobe.ts:1494]); `computeP3` CRITICAL ≥$1.5B / SIGNIFICANT ≥$850M, else P3_NO_DATA honest zero [9-pillar-lobe.ts:1511-1578]; `computeP8` ≥$500M conversion bands ±0.07/0.10/0.15, needs BOTH optionsData AND componentSpots else empty [9-pillar-lobe.ts:2071-2087]. Harness file path H-02 is the OFFLINE snapshot of this pipeline.
  kev_replacement: NONE for extraction (agent+VLM procedure, not a Kev question). Kev E1 consumes the resulting walls as state text.
  limite_replacement: NONE (notional thresholds are comparisons; K-factor is closed-form code — keep in Python, never a Limite call).
  gate: deterministic: notional thresholds, ≥$500M P8 gate, null-on-missing-component, P3/P8_NO_DATA honest zero.
  needs_building: agent tool `refresh_options()` (the 6-step pipeline as a tool chain with 1h cache + stale-warn) + Python `k_factor_to_dxy()` port + `options_walls.json` writer (H-02 schema). This is the highest-maintenance agent tool (CloudFront + image-VLM) — budget accordingly; the [NO DATA] path must be first-class, not an exception.
  notes: JUL-6 image is EUR/USD-only (GU [NO DATA] honest [report-v452.ts:344-354]) — V6 eval must assert GU options-absent behavior, not just EU walls-present.

### MIGRATION W-04 — P4 analyst + web commentary (forex-research + web-search)
  current: `forex-research-client.ts:169 fetchResearch` (shared page once + keyword filter [forex-research:10-12], 1h TTL [forex-research:175-179], unknown-instrument guard [forex-research:170-172], allSettled [forex-research:220-250]); `web-search-client.ts` DuckDuckGo HTML + support/resistance regex near keywords [web-search:7-10], 2h TTL [web-search:16,238-242]; consumed as `PillarInput.analystConsensus/webSearchCommentary` → `computeP4` (web R/S ≤MAX_WEB_LEVELS + bias alignment, else P4_NO_DATA) [9-pillar-lobe.ts:1595-1686].
  kev_replacement: NONE for fetching. Kev E1 Q-state includes analyst-bias sentence; the bias-READING (bullish/bearish from commentary) is a future Kev fine-tune candidate, not V6-day-1.
  limite_replacement: NONE. gate: NONE (absent → 0).
  needs_building: agent tools `fetch_analyst()` + `fetch_commentary()` (TTL 1h/2h, source-URL preservation for provenance). Commentary S/R regex stays code until Kev parity proven.
  notes: Source URLs are provenance (PillarAudit inputs [9-pillar-lobe.ts:630-645]) — the agent must return URLs, not just levels, or auditability dies.

### MIGRATION W-05 — macro/structural inputs (calendar, treasury, EIA, FRED, H10, derivatives, regime, TimesFM)
  current: `economic-calendar-client.ts:184 fetchCalendar` (5min TTL [econ:104,114-116]); `treasury-client.ts:98 fetchAuctions` (1h [treasury:42,50-52]); `eia-client.ts:80 fetchReport` (6h [eia:36,43-47]); `fred-client.ts:116 fetchRRP` (1h [fred:38,46-48]); `fed-h10-client.ts:65 refreshRates` (24h [h10:58,66-68]) + supplementary-spot merge with widened bands [h10:142-149]; `PillarInput.derivativesData` → `computeP7` OI arena else P7_NO_DATA [9-pillar-lobe.ts:2013-2059]; `dxyRegime` → `computeP9` else P9_NO_DATA [9-pillar-lobe.ts:2157-2173]; `timesfm-client.ts` forecast+shape+TP/SL-probability service (zod schemas [timesfm:37-61], ohlc matrix call [timesfm:716-720], first-passage TP/SL touch [timesfm:374-379]).
  kev_replacement: Kev Call 2 Q2 day-element / Q4 freshness may eventually absorb regime/calendar context, but V6-day-1 keeps them as state-text sentences, not questions.
  limite_replacement: NONE (rates/auctions/RRP are lookups; TimesFM probabilities are a separate model, not Limite math).
  gate: deterministic: TTLs per source; absent → honest zero (P7/P9 pattern for all).
  needs_building: agent tools `fetch_calendar/fetch_auctions/fetch_eia/fetch_fred/fetch_h10/fetch_derivatives_oi/fetch_regime` (each with its TTL + evidence record `calendar_refreshed/petroleum_refreshed/treasury_refreshed/spot_fetched` pattern) + TimesFM adapter decision (keep as PVE adjunct or retire — E2E3-slice owns; harness only needs the call-site contract).
  notes: Evidence-DB writes (`recordEvidence` in every client) are the observability layer — V6 agent tools must log (tool, latency, rows, TTL-hit/miss) to the same ledger or feed outages become undebuggable.
## §8 — CANNOT be replaced (stays deterministic code) vs MUST be built new

### §8.1 CANNOT-be-replaced inventory (no Kev / no Limite — code forever)
These blocks are deterministic plumbing, identity law, measurement, or formatting. Routing any of them through a model is a category error (blueprint §2.4 division of labor: comparisons and aggregation are NEVER model calls).

1. `dedupTrades` + `floorSetupsToDedupRows` identity/merge (H-11) — port verbatim; Kev never votes on identity.
2. Dedup triple keys (direction_entry_sl_tp_day_category / zone-day / geometry-day) + zone-day consumption (G-08) — the anti-double-count law.
3. Session bracket mechanics + weekend clamp (H-12) as the BACKTEST parity artifact; live execution moves to TensorTrade but the bracket stays the offline truth.
4. Stats aggregation + headline/STALE semantics + fp precision rule (H-13) — formatting + closed-form math.
5. `renderReport` markdown renderer + TRADE_TABLE_HEADER + helpers (H-13) — the permanent record format.
6. Staggered-entries geometry + forward-spread signs (G-04) — one addition per leg; model call would add latency + nondeterminism for zero gain.
7. SL/TP rung SEARCH (zone-list scans in G-06/G-07/L-02) — search stays code; only the arithmetic verification goes to Limite and only the selection judgment goes to Kev.
8. Buffer/threshold tables (SL_BUFFER_PIPS, FORWARD_SPREAD, SESSION_HOUR, SHAPE_FAMILY_MAP, CONSOLIDATION_WEEK_FLOORS, notional tiers) — law, not inference. Test equality of the duplicated SL table across modules.
9. Foreign-price-space + NO_DATA + CONFLUENCE-label + IP-never-entries guards (H-03/H-06) — anti-fabrication firewall; a model must never be able to vote these off.
10. D17 36p ceiling + ENTRY-fixed repair + 3-fails-HARD-REJECT + no-fantasy-TP (G-05) — the repair discipline; Kev proposes, code disposes.
11. WL-ladder prohibition (Bible 5.12, L-01) + MAX_ROCKETS 2 + BE cascade wiring (L-03) — position-engineering doctrine.
12. NO-FALLBACK throw semantics inverted as no-trade-loudly (Z-01) — silence is the enemy, not absence.
13. Anchor/window scoping + fixture determinism + no-wall-clock rule (H-01/H-14) — the reproducibility contract.
14. The diag oracle loop + T7 + exit-code contract (D-03) — the cheapest permanent regression gate.
15. Placements INSIDE zones (Law 7 verbatim, G-06) + midpoint-vs-near-edge (Law 11/33, G-07) — geometry doctrine, not judgment.

### §8.2 MUST-be-built-new inventory (no 4.5.3 equivalent — greenfield V6 work)
1. `zone_to_state_text()` serializers (E1 zone map + E2ZoneInput + visual zones + prior storyline + session/DXY ctx, ≤8192 tokens) — H-04/H-06/H-08. No TS renderer exists; the prompt-slice ≡ label-slice consistency rule (Z-02) is new discipline.
2. Bar-derived OB/LQZ detector + telescoping + nesting + merge (Z-01) — the methodology exists only as lobe-header prose; zero code exists.
3. Kev fine-tune corpus (~700+ records from 649 doctrine cards + 38 rulings + 38 forensic + 23 golden + verdict/confidence/repair-trail rows) — H-07/H-08/G-03/G-05. Offline pipeline: card → (state, questions, answers) triples (blueprint §1.8 pattern).
4. Limite prompt pack (MATH CALLs 1-5 shapes: zone width / SL distance / RRR / fib / commission) + attempt-index prefixes for the D36 loop (G-05) + rung-verification variant (L-02/L-03) — no caller exists today.
5. Deterministic gate layer (RRR floor max(category,3.0) reconciliation, session window, SL envelope, confidence flag, divergence backstop, §15 anti-goal) — H-09/H-13/G-05. New Python module; the TS gates are scattered across generator + firewall and were never one layer.
6. TensorTrade adapter (TradeDecision → Exchange orders + Broker lifecycle + Portfolio analytics + commission 0/0.1/0.2% sensitivity + walk-forward) — H-12/H-13/L-03. Replaces sim + stats + wall-map for LIVE; sim survives as offline parity only.
7. Web-data agent tool surface (W-01..W-05: fetch_bars/spot/snapshot + MA/technicals + refresh_options + analyst/commentary + macro 7-pack) with TTL metadata + evidence ledger + honest-zero contract — the clients exist as TS classes; the AGENT TOOL wrapping (schemas, caching, failure contract, backtest replay mode) is new.
8. `chain_decisions()` unified chaining over TradeDecisions (H-10/G-09) — the two twins (harness ZR-4A + engine3 chained) never shared code; unification + depth-3 + parent-floor + chain-before-dedup ordering is new.
9. Ladder ledger + BE-trigger broker callbacks (L-03) — the TS ladder annotates notes; V6 must execute staged orders + stop-moves.
10. V6 `main.py` loop + pi-harness TUI-loop slice (peer V6Harness `v6-audit-harness-piloop.md` owns the TUI pane detail) — H-14. The loop (feed → state → Kev×4 → Limite → gates → TensorTrade) has no current equivalent; report-v452 runs the week backward from a fixture, never forward through sessions.
11. Parity-eval battery (dedup counts + sim outcomes + LMV rungs + oracle tol + SL/TP recompute + combined-RRR recompute) — H-11/H-12/D-02/G-08/L-03. The diags exist as TS scripts; the cross-language byte-parity battery is new and is the merge gate for every port above.
12. `options_walls.json` writer from the live options pipeline (W-03) — the file is currently hand-supplied by a parallel agent from a JUL-6 image; a standing producer is new.

### §8.3 Visual-validation answer (the acceptance question, directly)
"What CANNOT be replaced (report formatting? visual validation?) and must be built new": report formatting CANNOT be replaced — it stays code (H-13, §8.1 items 4-5). Visual validation (VLM CONFIRMED/REJECTED/NEW over screenshots) CAN be replaced — by Kev verdict-questions over bar-detector candidates — BUT the replacement is gated on building the bar-derived detector first (Z-01, §8.2 item 2); until parity is measured, V6 ships E1-only entries with the visual lane flagged absent, never with a ported VLM lane. The capture stack (headed Chrome + per-TF screenshots + VLM calls) is RETIRE-01: delete, do not port (Z-03).
## §9 — V6 harness loop assembly (how the cards compose into ~300 lines Python)

```
main.py (H-14; peer piloop file owns TUI pane wiring)
│
├── tools/feed.py (H-01 + W-01..W-05): snapshot_bars() | fetch_spot() | eligible pillar-input fetch
│   └── backtest mode: fixture replay (same return shape, anchor-scoped); live mode: web-data-agent tools
│
├── state.py (H-04 + H-06 + T-01 + Z-02): zone_to_state_text() — E1 map + E2ZoneInput + visual zones + prior ctx (H-05) + session/DXY
│   ├── to_kev_zone() (H-06 verbatim mapping + IP-rejection assertion)
│   ├── build_ip_zones() (H-03 merge + foreign/NO_DATA/CONFLUENCE gates)
│   └── resolve_verdicts() post-processor (Z-02: 85/65 confidence + inheritance + REJECTED exclusion + merge)
├── detect.py (Z-01, NEW): detect_ob_zones_4h() + detect_lqz_ltf() + nest + telescope + merge_multitf()
├── kev.py: Call1 E1 (zone+pressure Q) → gate → Call2 E2 (shape+cascade Q; Q3 replaces H-08 cascade+divergence) → gate → Call3 E3 (direction+quality+session+SL+shield; replaces G-02/G-03/G-05 judgments + H-09 mirror judgment + L-01 eligibility) → PVE Q (confidence)
│   └── training corpus (§8.2 item 3): doctrine cards + verdicts + repair trails + golden chains
├── math.py (Limite client, §8.2 item 4): zone-width | sl-distance | rrr | fib | commission per candidate/attempt
├── anchor.py (G-05..G-09 + L-01..L-03, code + Limite-backed):
│   ├── eligible_zones() (G-01) → hard/holding/no-touch filters (G-02) → confluence backstop (G-03)
│   ├── staggered_entries() (G-04) → anchor_sl_tp() D36 loop (SL search G-06 + TP walk G-07, ENTRY fixed, D17, hard-reject ledger)
│   ├── confidence backstop + quality + session + 6-check validation + notes (G-08, audit log)
│   ├── build_ladder() (L-01..L-03: preconditions + MoM scan + primary/rockets/BE/combined)
│   └── dedup (H-11 verbatim: floor rows + identity + stagger merge)
├── chain.py (H-10 + G-09 unified, NEW unification): chain_decisions() depth ≤3, parent-floor, chain-before-dedup
├── gates.py (§8.2 item 5, NEW single layer): rrr max(category,3.0) | session | SL envelope | conf flag | divergence backstop | §15 anti-goal | WL-ladder ban | IP-never-entries
├── oms.py (TensorTrade adapter, §8.2 item 6): execute + Broker lifecycle + Portfolio analytics + commission sensitivity + walk-forward
│   └── backtest parity: bracket_sim.py (H-12 port) runs OFFLINE ONLY, byte-parity vs TS required
├── report.py (H-13 port): accurate_stats + trade table + stale detail + SL_vs_ENTRY + wall-map diff (offline) + live TradeDecision log + TensorTrade analytics
└── eval/ (§8.2 item 11): golden_levels.json (D-01) + eval_oracle + eval_lmv_parity (D-02) + diag loop port (D-03) + dedup/sim/rung/RRR parity
```

Latency budget (blueprint): feed 0ms + state 5ms + Kev×4 ~40ms GPU + Limite ~200ms (attempts multiply: worst-case 3 SL/TP rounds → budget Limite calls per candidate, pre-filter hard so the loop rarely reaches attempt 3) + gates <1ms + TensorTrade async. The D36 loop is the latency risk — cap candidates entering the loop via G-01/G-02/G-03 pre-filters (that is their V6 function: cost control, not just quality).

## §10 — Fork-and-convert row (the parent's merge input)

| 4.5.3 piece (file:line) | V6 replacement | No-replacement → build new |
|---|---|---|
| loadFixture/bars/spot/session/day-open [report-v452.ts:311-397] | Python harness feed (H-01) | — |
| options walls file [report-v452.ts:114,144-179] | agent `refresh_options` + json writer (W-03/H-02) | standing producer is new (§8.2 item 12) |
| pillarEngine + buildIpZones [report-v452.ts:230-289,357-369,406-407] | harness merge + Kev E1 state (H-03) | web-data agent pillar tools (W-02..W-05) |
| buildChartModel zone maps [report-v452.ts:377-379] | state constructor renderer (H-04) | serializer is new (§8.2 item 1) |
| prior-week preflight [report-v452.ts:1044-1053] | prior ctx injection (H-05) | weekly cache discipline is new |
| toDxyZone [report-v452.ts:622-703] | `to_kev_zone` port (H-06) | — |
| ShapeBrain runs [report-v452.ts:832-861,914-916] | Kev Call 2 (H-07) | fine-tune corpus (§8.2 item 3) |
| cascade translate + divergence + ShapeDayZone [report-v452.ts:750-815,957-984] | Kev Q3 (H-08) | mode-prefix training pairs |
| DXY source + cascadeV45 lanes + ctx [report-v452.ts:1091-1138] | Kev Call 3 + Limite + gates (H-09) | `emit_decisions` loop |
| ZR-4A chaining [report-v452.ts:1153-1213] + engine3 chained [visual-setup-generator.ts:1790-1947] | Kev reverse-judgment + Limite recompute | unified `chain_decisions` (§8.2 item 8) |
| floor/dedup [report-v452.ts:1217-1218] | verbatim Python port (H-11) | byte-parity test |
| bracket + sim [report-v452.ts:445-577,1222-1224] | TensorTrade live; sim port offline-only (H-12) | oms adapter (§8.2 item 6) |
| stats/votes/wall-map/render [report-v452.ts:1227-1284,1319-1473] | Python port offline + TensorTrade analytics live (H-13) | live decision log |
| main + ChainResult [report-v452.ts:579-601,1476-1493] | main.py loop (H-14) | pi-TUI slice (peer file) |
| oracle table [diag-lmv-golden-fx.ts:28-48] | golden_levels.json (D-01) | — |
| LMV rung build + table scan [diag-lmv-golden-fx.ts:67-78] | Limite MATH 1 + eval parity (D-02) | pillar-on/off dual eval |
| T1-T6/T7/verdict [diag-lmv-golden-fx.ts:72-121] | verbatim eval port (D-03) | — |
| VisualSDZone schema [types.ts:120-151] | state dataclass + validator (T-01) | renderer |
| VLM return structs [types.ts:47,63,71] | retired; labels only (T-02) | detector (Z-01) |
| screenshot/result I/O [types.ts:22,153] | retired (T-03) | — (RETIRE-01) |
| eligibility/distance [visual-setup-generator.ts:355-463] | harness `eligible_zones` + Kev Q1/Q3 (G-01) | — |
| WL/SS + no-touch [visual-setup-generator.ts:481-525] | code pre-filters + Kev labels (G-02) | parity vs skip-logs |
| confluence ≥3 [visual-setup-generator.ts:978-1010,528-532] | Kev Q2/Q5, floor backstop (G-03) | calibration gate |
| staggered entries [visual-setup-generator.ts:1075-1094] | verbatim port (G-04) | TensorTrade 3-leg mapping |
| D36 loop [visual-setup-generator.ts:595-670] | Limite-backed `anchor_sl_tp` + Kev Q4/Q2 (G-05) | repair-trail training rows |
| SL rung anchor [visual-setup-generator.ts:1126-1257] | search port + Limite verify (G-06) | buffer-table equality test |
| TP walk [visual-setup-generator.ts:1289-1424] | walk port + Limite verify (G-07) | weekly-ATR provider |
| cap/dedup/conf/quality/session/validation/notes [visual-setup-generator.ts:674-900,1427-1675] | ports + Kev Q2/Q3 + audit log (G-08) | feature renderer |
| chained twin + ladder pass [visual-setup-generator.ts:928-962,1790-1947] | unified chain + `build_ladder` (G-09) | ladder ledger |
| ladder preconditions [ladder-generator.ts:121-151] | port + Kev shape (L-01) | reason-log parity |
| MoM scan + spacing + ≥2 [ladder-generator.ts:158-205] | verbatim port (L-02) | exemption test |
| primary/rockets/BE/combined [ladder-generator.ts:207-258] | Limite verify + OMS stage (L-03) | broker callbacks |
| VLM lobe pipeline [visual-zone-lobe.ts:94-147] | bar detector + Kev verdicts (Z-01/Z-02) | detector module |
| capture stack (CDP/VLM) [visual-zone-lobe.ts:69-83,270-296] | RETIRED (Z-03) | — (RETIRE-01) |
| clients (bars/spot/MA/tech/options/analyst/macro/TimesFM) | web-data-agent tools (W-01..W-05) | tool surface + ledger (§8.2 item 7) |

## §11 — Honest remainder (what this slice did NOT verify)
1. `src/mdve/` internals (buildChartModel OB/LMV construction, setup-gen.ts, ob-engine.ts, sl-lmv.ts, trade-computer.ts, mirror.ts, cascade-translation.ts, prior-week-preflight.ts) — E1/E2E3 slices own; this audit cites only their harness call-sites. No claim on their line-level V6 mapping beyond H-04/H-08/H-09 state-text requirements.
2. `src/brains/` (trade-brain, storyline-engine beyond computeWeekStoryline-narrative-only, trade-flow-chain) and `src/e1/` (core/engine.ts, machines/) — sibling slices own; storyline retirement (H-13) is this slice's only claim on them.
3. Specs corpus + 649-card training-data authoring mechanics — referenced via blueprint §1.8 pattern; record-level QC belongs to the training-data wave, not this harness map.
4. TensorTrade API surface (Exchange/Broker/Portfolio/Wallet method signatures, RLLib integration) — blueprint §3 architecture cited; version pinning + adapter spikes are build-phase work.
5. Kev/Limite serving substrates (ONNX q4 export, vLLM CUDA, 8192-token packing, LoRA r=16) — blueprint §§1-2 cited as given; inference-harness integration is build-phase work.
6. Live triple-verification of every file:line anchor above was established by read + grep tool output in-session (1494/121/1952/158/263/552 line counts verified [shell]; key symbols grepped with line hits); a final `grep -c` sweep per anchor table is recommended at merge time but no anchor was emitted from memory — all trace to tool output above.
7. Overlap with peer `V6Harness` piloop slice (`v6-audit-harness-piloop.md`): that file owns pi-agent-core loop/tool/TUI-pane detail; on conflict of loop ownership, this file owns the DECISION→MATH→GATE→OMS dataflow and the peer owns the agent-runtime hosting — the §9 diagram marks the boundary at `main.py` vs TUI pane.
