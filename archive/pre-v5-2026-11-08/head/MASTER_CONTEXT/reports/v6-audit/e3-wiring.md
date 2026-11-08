# E3 WIRING — the E1→E2→E3 composition (Plutus v4.5.2 canon, report-v452.ts 1494 lines + storyline-engine.ts 567 lines)

> Scope: `PLUTUS/agent/report-v452.ts` (the FULL 1494-line canon pipeline: E1 reintegration → E2 core → E3 cascade → dedup → sim → stats → report) + `PLUTUS/agent/src/brains/storyline-engine.ts` (567 lines, the E2 narrative layer). Every claim carries a file:line anchor. Lines below are 1-indexed grep-verified anchors (see acceptance note at bottom for how they were derived).

---

## 0. THE COMPOSITION IN ONE DIAGRAM

```
FIXTURE (/tmp/opencode/bars_raw.json, bars ≤ ANCHOR_MS)          report-v452.ts:100-106 (ANCHOR_MS 1783702800000 = 2026-07-10T17:00Z; WEEK 2026-07-06; WEEK_START_MS; FIXTURE env)
OPTIONS WALLS (/tmp/opencode/options_walls.json, may be absent)      report-v452.ts:108-114,144-180 (loadOptionsWalls; absent → undefined → honest [NO DATA])
        │                                                                          │
        ▼                                                                          ▼
PILLAR PRE-FLIGHT (per pair, BEFORE buildChartModel)                 report-v452.ts:369-380 (pillarEngine loop; ZR-7B comment)
  DXY: FULL walls + componentSpots (P8 ICE K-factor DXY conversion)   report-v452.ts:369-380; 9-pillar-lobe.ts:1503-1504 (K-factor), 339-341 (pillarEngine entry)
  EU:  OWN walls only, NO K-factor spots (pair-native price space)     report-v452.ts:369-380
  GU:  [NO DATA] (JUL-6 image is EUR-only → P3_NO_DATA honest 0)   report-v452.ts:369-380; 9-pillar-lobe.ts:599-600,608,1571-1577 (P3_NO_DATA)
        │
        ▼
E1 PER PAIR: buildChartModel(pair, WEEK, 1H, 4H, 30m, spot, {pillarResult}, 15m)   report-v452.ts:375-380; src/mdve/index.ts:129-136 (signature)
  ├─ zone map §6.1 (multi-TF OB + §6.3 class + §6.4 freshness)              src/mdve/index.ts:150-160 (buildZoneMap call)
  ├─ LQZ matrix §6.2 + LMV table v4.5 §2 + 30m/15m telescoped tiers        src/mdve/index.ts:162-230 (buildLqzMatrix, buildLmvTable, buildMatrixTier, tiered merges)
  ├─ scaffold ladder §7 (pillar rungs ONLY when pillarResult present)    src/mdve/index.ts:232-245 (options?.pillarResult ?? EMPTY_PILLAR_RESULT; EMPTY at :316-319)
  ├─ ladder enrichment (matrix rungs → ladder, TOTAL sort)              src/mdve/index.ts:246-260
  ├─ narrative §6.5 (sweep origin, range)                               src/mdve/index.ts:262-280
  └─ LMV bridge (rungs → ZoneModels `LMV|pair|center`)                   src/mdve/index.ts:280-283,360-363 (matrixZonesToZoneModels)
        │
        ▼
IP MERGE (Wave A1.1, ADDITIVE, S/D/L lane byte-identical)              report-v452.ts:230-289 (buildIpZones), :393-403 (merge loop); :182-189 (zfpFromConfluence6D)
  IP ZoneModel: id `IP|pair|price`, CONFLUENCE class, source PILLAR,      report-v452.ts:230-289
    ipZone=true, reactionEvents=[], pressure {CONFLUENCE,0,false,INTACT,[]},
    zfp = 6D step (12+→10 EXTREME / 10+→20 HEAVY / 8+→30 / 6+→40 / 4+→55 / else 65 MINIMAL)
  FOREIGN-OTC filter (price-space hygiene) + NO_DATA firewall            report-v452.ts:221-228 (isForeignOtcLevel; PAIR_TAGS), :240-248 (provenance _NO_DATA filter)
  §8.1 STRUCTURAL GATE rejects IP as entries (source ∉ {ORDER_BLOCK,LQZ})  src/mdve/mirror.ts:1015-1029 (isValidEntryAnchor; STRUCTURAL_ENTRY_SOURCES at :141)
  LQZ×IP promotion (inside MDVE ladder build): overlap → confluence+2, zfp−5  report-v452.ts:246-252 comment (mergeLqzWithIpZones canon); src/brains/lqz-lobe.ts:497-540 (merge impl: +2 at :523, −5 at :532)
        │
        ▼
PRIOR-WEEK PRE-FLIGHT (Wave A1.3, per pair, BEFORE current E2)          report-v452.ts:1035-1053 (runChainV452 pre-flight loop); src/mdve/prior-week-preflight.ts:152-263
  bars scoped ≤ priorAnchor (= WEEK_START_MS; NEVER current week)      prior-week-preflight.ts:160-168 (scope fn); report-v452.ts:102-105 (WEEK_START_MS doc)
  prior E1 (same buildChartModel, prior weekStartStr) + prior E2 (ShapeBrain)  prior-week-preflight.ts:180-200
  extract: sweepOrigin + rangeTop/Bottom + DEFENDED/BROKEN/UNTESTED (Law 28) + depleted 3x+ + role reversals (Law 29)  prior-week-preflight.ts:210-263
  golden truth (computed, never hardcoded): DXY Jul-3 sweep origin 100.603  report-v452.ts:1035-1042 comment
        │
        ▼ (handoff: snap.priorStoryline on the injected ZoneMapSnapshot)
E2 CORE (Wave G2, buildE2Core)                                          report-v452.ts:901-1028 (buildE2Core); :832-861 (buildShapeBrain)
  3× ShapeBrain runs (OWN zones → DXYZone via toDxyZone + OWN 30m ltfZones)  report-v452.ts:832-861; :622-720 (toDxyZone incl ZR-7C pressure boundary + PILLAR branch); shape-brain.ts:2397-2406 (setZoneMap + priorStoryline read), :2421-2442 (compute)
  E2 DESIGNATION inside brain: projectZoneForDay per day (strength-based,   shape-brain.ts:1257-1330 (projectZoneForDay), :1731-1935 (buildDayDecomposition), :2345 (dayDecomp call)
    E1 output: keyZoneId/keyZoneType/supplyZoneId/demandZoneId/deepDemandZoneId/dayOpenSpot/session/confidence)
  STORYLINE per pair (ZR-2B, narrative-only): computeWeekStoryline(         report-v452.ts:905-950 (storyline block); storyline-engine.ts:512-567 (computeWeekStoryline)
    model + chain + dayDecomposition + priorStoryline + 1H bars) → storylines[pair]
  CASCADE TRANSLATIONS (structural equivalent, NEVER designation):        report-v452.ts:955-968
    EU ← DXY-inverse (INVERSE); GU ← EU-core (KEPT)                    src/mdve/cascade-translation.ts:518-560 (translateCascadeDayMap); :138-155 (TranslatedDayMap)
  DIVERGENCE VALIDATION (35% rule, FLAG ONLY, never override):            report-v452.ts:973-985; cascade-translation.ts:615-660 (computeChainDivergence; families + master SS→BS→R→WL ±1)
    computeChainDivergence(coreDays, cascadeDays) ≤ 0.35 → VALIDATED else DIVERGED-flag
  CHAINS for E3: shapeChains = { dxy?, eu: euCoreChain, gu: guCoreChain }  report-v452.ts:1103-1106; :784-810 (snapshotToCascadedChain); :750-782 (brainDaysForTranslation); :727-747 (toEntryDir ZR-6D)
        │  (NOTE: the mirrors' shapeDay source is the PAIR BRAINS' days, NOT the cascade's translated days — report-v452.ts:1093-1100 comment, mirror.ts:1172-1181 ctx doc)
        ▼
E3 (the setups: DXY source lane + EU/GU mirror cascade)                  report-v452.ts:1091 (dxySource), :1109-1138 (before + after cascadeV45 calls)
  DXY FULL FIRST: generateSourceSetupsV45(dxyModel) — frozen source lane src/mdve/setup-gen.ts:261-268 (entry); report-v452.ts:1-37 header chain doc
  EU: DXY-inverse E3 (reAnchorMirror per DXY setup, zone-anchored via       src/mdve/mirror.ts:3718-3780 (cascadeV45 EU loop; euShapeDay from shapeChains.eu by signal-day idx)
       shapeChains.eu day; 80% signal INVERT direction, 20% pair-native anchor)
  GU: EU-cascade E3 (reAnchorMirror per ACTIVE EU mirror ONLY,              src/mdve/mirror.ts:3782-3815 (GU loop; guShapeDay from shapeChains.gu; NEVER raw DXY — :2463 ref in header)
       zone-anchored via shapeChains.gu day; direction KEPT)
  E2 DESIGNATES → E3 OBEYS at every anchor (authoritative exact-match,   mirror.ts:1422-1440 + :1608-1640 (E2 blocks); :3075-3200 (reAnchorMirror anchor resolution)
    direction-appropriate LONG→demandZoneId / SHORT→supplyZoneId — 2026-08-05 fix)
  E3 PRICE RESOLUTION (E2 price GONE): e2ZoneResolvedEntry vs defendedEdge   mirror.ts:2416-2480 (e2ZoneResolvedEntry; deepShapes RWL/PRWL/R/RS); :1704-1780 (defendedEdgeEntry fallback)
  SL: ZR-3.1 ladder-steps PRIMARY (operative defense), golden SL fallback    mirror.ts:3229-3260 (ladderSl + computeGoldenSL_V452; mirrorConfidenceScore at :2183-2210 gates branch)
  TP: Law-14 LMV walk w/ shapeDay projected opposing zone + ladder fallback  mirror.ts:3262-3300 (computeLmvTP + computeMirrorTP fallback at :546-600)
  3D REFINEMENT AUDIT (Wave I1, P1-P8/C1-C6/T1-T8) when translatedDays       mirror.ts:3302-3490 (auditSetup3D; REJECT_GENUINE hard-discard; RE_TRANSLATE loop — INVERSE lane ONLY; B1.5: NEVER re-anchor E2-designated)
    present; RRR<floor → refineSetup on SAME anchors (R2 doctrine)        mirror.ts:3492-3520 (R2 repair; floor = rrrForCategory(category).tp1 = 3.0)
  DAY ATTRIBUTION: tradeMs/tradeDay from SOURCE signal day (battleMs /       mirror.ts:3522-3560 (tradeMs block; WAVE H1/G2-flag-3 comment)
    carried mirror day), NOT anchor reaction time; session = E2 shapeDay.session when e2Designated (B1.3), else sessionOf(tradeMs)
  GUARDS: CS-1 day-native (dayOpenSpot, CHANGE 3) + narrative gate §7.2    mirror.ts:3562-3600 (CS-1 at :2911 structurallyValid; narrative at :2980 narrativeAligned; ZFP bands :1205-1215)
  EMISSION: in-cascade distribution (usedEu/GuAnchors + alt-retry exclusion) src/mdve/mirror.ts:3740-3815; §4.2 cap capMirrorEmission (trade-dedup.ts:313-333) documented in report §7 (report-v452.ts:1400-1406 render)
        │
        ▼
FLOOR → DEDUP → CHAIN → SIM → STATS → REPORT  (report-v452.ts:1216-1286)
  floorSetupsToDedupRows(dxySource, activeMirrors) + ZR-4A chainedRows       src/pipeline/mdve-stage.ts:1206-1240 (floor); report-v452.ts:1140-1215 (Law-27 chaining, maxDepth 3, CHAINED_SESSION_HOUR)
  dedupTrades(rows): identity pair|dir|anchorBucket|day (§1.2), stagger   src/mdve/trade-dedup.ts:147-159 (anchorBucket/tradeIdentity), :223-280 (dedupTrades), :190-222 (mergeGroup E1/E2/E3 0.33/0.33/0.34 blend)
  simulateUniqueTrade per unique (ZR-6E brackets; SL-first pessimistic)      report-v452.ts:445-577 (sessionBracketOf + simulateUniqueTrade); src/mdve/util.ts:29-34 (sessionOf)
  computeAccurateStats(trades, EVAL_WEEK) + dedupSLvsEntry(votes)             src/report/accurate-stats.ts:287-330 (computeAccurateStats), :383-410 (dedupSLvsEntry); report-v452.ts:1249-1268
  wallMap (before→after per mirror) + renderReport (HEADLINE/PER-PAIR/     report-v452.ts:1270-1284 (wallMap + renderReport call); :1319-1470 (renderReport: §1-7, §8 E1 map at :1407-1433, STORYLINE at :1435-1470)
    TRADE TABLE/STALE/SLvsENTRY/WALLMAP/CAP/§8 E1 MAP/STORYLINE) → report_v452.md
```

---

## 1. THE CASCADE (DXY→EU→GU) — WHAT EACH ARROW CARRIES

### 1.1 DXY FULL FIRST (the frozen source lane — COMPLETE FIRST)

- E1: `buildChartModel('DXY', WEEK, 1H, 4H, 30m, spot, {pillarResult: pillarByPair['DXY']}, 15m)` — report-v452.ts:375-380 (inside `loadFixture`, :311-403). Bars scoped `b.timestamp <= ANCHOR_MS` sorted ascending (:340-360 `barsFor`/`simBarsFor`/`spotFor`). This is E1 for DXY: zone map + LQZ/LMV + ladder + narrative (mdve/index.ts:129-283).
- E2: `buildShapeBrain('DXY', dxyModel, priorStorylines['DXY'])` — report-v452.ts:916-918 (inside `buildE2Core`, :901-1028). Snapshot `{version:1, timestamp:Date.now(), instrument, zones: model.zones.map(toDxyZone), spots}` + `priorStoryline` handoff field (:832-861). 30m MoM zones as `ltfZones` (T4 doctrine — report-v452.ts:845-855 comment; shape-brain.ts:332-340 Phase-2-T4 comment). Brain `compute()` → `ShapePredictionSnapshot` (shape-brain.ts:2421-2442).
- E3: `generateSourceSetupsV45(dxyModel)` — report-v452.ts:1091 (in `runChainV452`, :1032-1286). The v4.5 source impl `generateSourceSetupsImpl(model, opts, 'v45')` (setup-gen.ts:261-268). Battle-gated structural entries (`isValidEntryAnchor` §8.1 — mirror.ts:1015-1029), LMV defendedEdge entry (`lmvZoneForStructure` — setup-gen.ts:290-343), probe-side pool + `DUAL_ENTRY_MIN_SEPARATION_PIPS = 15` (setup-gen dual-entry doctrine, referenced mirror.ts:3680-3690 D11 comment). Every EU/GU mirror cascades from THIS lane (report-v452.ts:1085-1091 comment: "COMPLETE FIRST").
- DXY chain `dxyChain = snapshotToCascadedChain(dxyShape, 'DXY')` carried "for completeness" — the cascade reads only eu/gu (mirror.ts:1172-1181 `shapeChains` doc; report-v452.ts:1103-1106).

### 1.2 EU: DXY-inverse E2 CASCADE (translation) → EU E2 CORE → divergence → DXY-inverse E3 cascade

Three distinct operations share the "EU" name — do not conflate them:

1. **E2 CASCADE (translation, structural equivalent, NOT designation).** `translateCascadeDayMap(dxyBrainDays, dxyModel, euModel, 'INVERSE', euCoreDays)` — report-v452.ts:959-963. Contract: per cascade day resolve designation (element + role), match EU's OWN structurally-equivalent zone by PRIMARY matrix (element + translated role + ±48h window + position), rank ties by SECONDARY strength noise filter (lowest-zfp wins) — cascade-translation.ts:500-560 header + :518-560 impl. Output `TranslatedDayMap {pair, direction:'INVERSE', entries, divergence}` (:138-155). Divergence here = macro-signal directionMatch clause (:540-560). EU direction INVERTED (DXY SHORT day → EU LONG day) — report-v452.ts:955-959 comment; mirror.ts:3120-3125 (`source.pair==='DXY' ? invert : keep`).
2. **E2 CORE (designation, strength-based, exactly like DXY).** `buildShapeBrain('EUR/USD', euModel, priorStorylines['EUR/USD'])` → `euCoreChain = snapshotToCascadedChain(euShape, 'EUR/USD')` — report-v452.ts:916-918 + :973-980. Inside: `projectZoneForDay` strength designation over EU's OWN zones (shape-brain.ts:1257-1330) driven by `buildDayDecomposition` (shape-brain.ts:1731-1935) with DayBand carry (Monday priorDayClose = model spot; Tue→Fri = prior predicted London-open + shape travel — shape-brain.ts:1750-1760) and ZR-7C chain anchor (prior day's projected TP zone = day's PRIMARY — shape-brain.ts:1266-1268). `toEntryDir` maps day direction to trade direction with the ZR-6D primary-side rule (RANGE + keyZoneType SUPPLY→SHORT / DEMAND→LONG — report-v452.ts:727-747).
3. **DIVERGENCE VALIDATION (flag only).** `computeChainDivergence(euCoreDays, dxyBrainDays)` — report-v452.ts:981-985. Shape-family alignment (SS≈SS/RWL/STORM/PRWL; BS≈BS/PBS; R; WL≈WL/WLS/PWL) OR ±1 step on master SS→BS→R→WL; `divergence = (5-aligned)/5`, missing day = not-aligned — cascade-translation.ts:575-660. `<= 0.35 VALIDATED` else `DIVERGED, flag only — pair E2 stands` (report-v452.ts:995-1000 log lines). The cascade VALIDATES, never designates (report-v452.ts:967-972 comment; mirror.ts:1172-1181).
4. **E3 CASCADE (zone-anchored mirrors).** `cascadeV45(dxySource, models, {sessionStartPrice, dayOpenPrice, v452:{...}, shapeChains, translatedDays, storylines})` — report-v452.ts:1117-1136. EU loop (mirror.ts:3730-3780): per DXY setup resolve `euDayIdx = floor((srcSignalMs - weekStartMs)/86400000)` where `srcSignalMs = setup.battleMs ?? sourceFormationMs` (B1.4 — mirror.ts:3745-3760 comment: day from SOURCE signal day, never source-zone formationMs), `euShapeDay = shapeChains.eu.days[clamp(euDayIdx)]`, `reAnchorMirror(setup, euModel, 'EUR/USD', {...ctx, sourceFormationMs: srcSignalMs, shapeDay: euShapeDay})`. Distribution: `usedEuAnchors` + alt-retry with `excludedAnchorIds` on collision (mirror.ts:3760-3780; D11 doctrine at :3650-3716 — Δ≤15p = one signal shares, beyond = distinct must spread; ORCHESTRATOR ADJUDICATION reverted the price-window gate). No price conversion (§15 anti-goal — report-v452.ts:1025-1031 comment: "never EU_price = f(DXY_price)").

### 1.3 GU: EU E2 CASCADE → GU E2 CORE → divergence → EU E3 cascade (NEVER raw DXY)

1. **E2 CASCADE:** `translateCascadeDayMap(euCoreDays, euModel, guModel, 'KEPT', guCoreDays)` — report-v452.ts:964-968. Same structural-equivalence matcher, direction KEPT (operator's "EU E2 Cascade → E2" — report-v452.ts:964-968 comment).
2. **E2 CORE:** `buildShapeBrain('GBP/USD', guModel, priorStorylines['GBP/USD'])` → `guCoreChain` — report-v452.ts:916-918 + :973-980. Own strength-based designation (the RESTORED per-pair brain run — report-v452.ts:1-37 header). `toEntryDir` ZR-6D fixes the GU-Friday LONG-label/SHORT-zone confusion (keyZoneType SUPPLY → SHORT — operator's #7 Fri SHORT RWL — report-v452.ts:727-747; shape-brain.ts:1106-1108).
3. **DIVERGENCE:** `computeChainDivergence(guCoreDays, euCoreDays)` — report-v452.ts:985-990.
4. **E3 CASCADE:** GU loop over ACTIVE EU mirrors only (mirror.ts:3782-3815): `guDayIdx = floor((m.tradeMs - weekStartMs)/86400000)`, `guShapeDay = shapeChains.gu.days[clamp(guDayIdx)]`, `reAnchorMirror(m, guModel, 'GBP/USD', {...ctx, sourceFormationMs: m.anchorFormationMs, shapeDay: guShapeDay})` + `usedGuAnchors` distribution. Source is the ACTIVE EU mirror (mirror.ts:2463 ref in report-v452.ts:1093-1100 comment: "GU lane mirrors the ACTIVE EU mirrors (the EU E3 cascade), NEVER the raw DXY setups"). DXY Fri SS → EU LONG → GU LONG while GU CORE resolves own Friday SHORT via keyZoneType fix (shape-cascade.ts:237-242 comment).

### 1.4 BEFORE vs AFTER lanes (the wall-map substrate)

- `before = cascadeV45(dxySource, models, {sessionStartPrice})` — v4.5.x defaults, pre-refinement geometry — report-v452.ts:1109.
- `cascade = cascadeV45(dxySource, models, {sessionStartPrice, dayOpenPrice, v452:{goldenSlLmv:true, consumedPoolQualifier:true, guAnchorPoolV453:true}, shapeChains, translatedDays, storylines})` — the INTERLEAVED E3 cascade with §5.2 wall TP + §5.3 golden SL + §4.4 qualifier + §4.2 cap — report-v452.ts:1111-1136.
- `wallMap` = per constructed mirror `{pair, sourceSetupId, direction, before:{entry,sl,tp,status}|null, after:{entry,sl,tp,status,slMethod,flags}}` keyed `pair|sourceSetupId` — report-v452.ts:1270-1282; rendered §6 (report-v452.ts:1418-1432).

---

## 2. PILLAR PRE-FLIGHT + IP MERGE (Wave A1.1 / ZR-7A / ZR-7B / ZR-7C)

### 2.1 pillarEngine runs BEFORE buildChartModel (the E1 reintegration)

- Loop `for (pair of ['DXY','EUR/USD','GBP/USD']) pillarByPair[pair] = pillarEngine({instrument:pair, bars:barsFor(pair,'1H'), currentPrice:spotFor(pair), optionsData, componentSpots})` — report-v452.ts:369-380. Inputs are model-independent (no double compute — report-v452.ts:375-380 comment; ZR-7B DERAILMENT-8 fix at :340-368 comment: ladder build inside MDVE `options?.pillarResult ?? EMPTY_PILLAR_RESULT` (mdve/index.ts:232) must receive the REAL result so the LQZ×IP merge FIRES).
- `pillarEngine(input: PillarInput): PillarResult` — 9-pillar-lobe.ts:339-341. Minimum-bars guard (`ENGINE_MIN_BARS` — :342). Dimensions: pivots, MAs, options P3/P8, analyst P4, structural P5, Fib P6, regime P9 (report render §8 text — report-v452.ts:1407-1412).
- Options wiring (Wave A1.1): `loadOptionsWalls()` parses `{date, walls|strikes:[{pair,strike,notional(BILLIONS — never divide),expiry,tier,optionsDim,day}], spots?, dxyEquivalents?}` → `{data:full(all strikes, maxPain, totalNotional), perPair:{DXY|EU|GU}, componentSpots, wallDays}` — report-v452.ts:116-180. Absent/unparseable → `undefined` → honest `[NO DATA]` (:144-150 try/catch).
  - DXY gets FULL walls + real component spots (P8 ICE K-factor EUR strikes → DXY equivalents, file spots never fabricated) — report-v452.ts:369-380 comment; 9-pillar-lobe.ts:1503-1504.
  - EU gets OWN walls WITHOUT K-factor spots (pair-native price space) — report-v452.ts:369-380.
  - GU gets nothing (JUL-6 image EUR-only → `[NO DATA]`) — report-v452.ts:369-380.
- ZR-7A honest-data firewall: P8 K-factor path scores 0 without spots + P3 returns `P3_NO_DATA` honest zero (Options-Derived dimension 0, NEVER Gamma-histogram proxy) — 9-pillar-lobe.ts:599-600,608,1571-1577; report-v452.ts:108-114 (`OPTIONS_WALLS_PATH` doc), :1410-1432 (render §8 WIRED vs [NO DATA] branches + ZFP temporal modifiers + component-spots line).

### 2.2 buildIpZones → the ONE zone map (ADDITIVE; DECISION-1: NEVER entries)

- `buildIpZones(model, pillarResult, pair): ZoneModel[]` — report-v452.ts:230-289. Per level: `pipValue = PIP_VALUE[pair]`, `spot = model.spot`, `zfp = zfpFromConfluence6D(compositeScore)`, `anchorMs = model.anchor.anchorMs` (deterministic, no wall-clock — :195-215 DECISION-1 comment).
- `zfpFromConfluence6D(confluence)` = the 6D CONFLUENCE pressure-degree step, Bible 4.0 §4.11 (12-14 EXTREME <10% … 0-3 MINIMAL >60%; pipeline's computeZfpFromConfluence engine.ts:124-136) — report-v452.ts:168-189: ≥12→10 EXTREME / ≥10→20 HEAVY / ≥8→30 MODERATE-HEAVY / ≥6→40 MODERATE / ≥4→55 LIGHT / else 65 MINIMAL. High confluence = strong institutional defense = LOW ZFP (brain strength semantics zfp<30 = strong).
- Each IP ZoneModel: `id IP|pair|price.toFixed(5)`, type by `price>spot ? SUPPLY : DEMAND`, band `[price, price+pip*10]`, timeframe 1H, `classification 'CONFLUENCE'` (ZR-7B DERAILMENT-5, spec Part 6.5: NEVER 'MoM' — would drag IP into S/D battle semantics/virgin-MoM death rules — report-v452.ts:255-270), `formationMs anchorMs`, `freshness 'FRESH'`, `reactionEvents []`, `zfp`, `confluence compositeScore`, `pressure {lifecycle:'CONFLUENCE', mitigationCount:0, pierced:false, absorption:'INTACT', liquidity:[]}` (honest minimal — S/D battle stamp cannot apply, runs before merge — :270-289), plus `source='PILLAR'` + `ipZone=true` (added post-construction — :287-289).
- Two hygiene filters before map: `isForeignOtcLevel` (price-space: `→DXY`/P8-StrikeDXY → DXY map only; `P3-OTC-Option-<tag>` → strike's own map only; missing USD/SEK spot → DXY conversion null → raw foreign strike would contaminate DXY at ~1.14 — report-v452.ts:200-228) and the `_NO_DATA` provenance firewall (`!lvl.provenance?.source.endsWith('_NO_DATA')` — ZR-7A defense-in-depth: ZERO NO_DATA-scored zones EVER — :240-248).
- Merge: `model.zones = [...model.zones, ...buildIpZones(model, pillarResult, pair)]` per pair — report-v452.ts:393-403 (A1.1 reintegration comment: ADDITIVE, S/D/L lane byte-identical, MDVE emission untouched; ZR-7B: precomputed results, loop only merges).
- DECISION-1 enforcement (IP = confluence/ZFP/context + SL/TP rungs, NEVER entries): `§8.1 structural gate isValidEntryAnchor` rejects `source ∉ {ORDER_BLOCK, LQZ}` (mirror.ts:1015-1029; STRUCTURAL_ENTRY_SOURCES :141) + mirror anchor-search skips `source==='PILLAR'` (additive guard — report-v452.ts:195-215) + DXY source lane battle gate requires non-pierced battle on the day (passive no-battle level never produces setup — :195-215). Render §8 DECISION-1 line — report-v452.ts:1430-1433.
- E2 consumption of IP (toDxyZone PILLAR branch): type → `'IP Confluence Supply/Demand'` (suffix-compatible but non-enum string) so `isSupplyZone/isDemandZone` REJECT from `projectZoneForDay` candidate pools (NEVER entries) while STILL feeding transition landscape (`identifyCurrentShape` zfp distribution/avgZfp/WLS/zonesAbove-Below read floor/ceiling/zfp type-free; `.endsWith("Supply")` piercing detection matches suffix) — report-v452.ts:655-700 (toDxyZone IP branch).

### 2.3 ZR-7C: the E2ZoneInput boundary (FULL pressure crosses into E2)

- `toDxyZone(z)` maps `pressure {lifecycle, mitigationCount, pierced, absorption, liquidity[]}` verbatim (lifecycle cast to VIRGIN|ACTIVE_1|ACTIVE_2|DEPLETED|FORTRESS|BROKEN|CONFLUENCE; liquidity kind NESTED|SHIELD with rungId→zoneId, eaten/eatenAtMs/defendedAtMs) + `formationMs` + `reactionEvents` (anatomy→dir: SWEEP/WICK_REJECT='re-act' else 'enter') — report-v452.ts:622-720 (ZR-7C comment at :623-640: "Engine 2 consumes the COMPLETE Engine 1 output. Every field matters" Bible 4.0 §4.18; operativeDefense computed E3-side, honest absence here). S/D zones get stamped ZR-1 pressure; IP zones carry constructed CONFLUENCE state (:270-289).

### 2.4 The OTHER merge (LQZ×IP promotion, canon)

- `mergeLqzWithIpZones(ipZones, lqzList, pair)` (lqz-lobe.ts:497-540): side-compatible overlap (gap ≤ 5-pip tolerance + BUY_SIDE↔supply / SELL_SIDE↔demand) → `confluence = min(CAP, +2)`, `zfp = max(0, zfp-5)` when zfp defined (honest-data law: zfp-less zone skipped, never fabricated — :523-532), `sdOverlap='LQZ'`, liquidityScore/keyLevels merge; no overlap → standalone MoM LQZ zone (base zfp 20 Hard Wall +5/2-touches-beyond-3, cap 60 — :542-570). Report path threads REAL pillarResult into `buildChartModel` so this promotion FIRES with real confluence (report-v452.ts:340-368 ZR-7B comment; mdve/index.ts:232).

---

## 3. THE SESSION BRACKETS (ZR-6E + §3.1 + §7.2) — WHEN ORDERS LIVE

### 3.1 Canon clocks

- `sessionOf(ms)`: UTC-hour bucket TOKYO 00-07 / LONDON 07-13 / NY 13-21 / OFF 21-24 (deterministic, no calendar/DST) — src/mdve/util.ts:29-34 (§8.4 dedup-key component).
- `SESSION_HOUR = {TOKYO:0, LONDON:7, NY:13, OFF:21}` + `ET_UTC_OFFSET_H = 4` (EDT July, trading-constants.ts:277) + `LABELED_WINDOW_RE = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*ET/` — report-v452.ts:293-303.
- `sessionStartPrice(pair, ms)` (CS-1 provider): OPEN of first 1H bar in the session window containing ms — report-v452.ts:381-391. `dayOpenPrice(pair, dayStartMs)` (v4.5.4 FIX 4, onSide gate): first 1H bar of the SIGNAL day — report-v452.ts:392-400.

### 3.2 sessionBracketOf (Wave ZR-6E fill reality)

- `sessionBracketOf(ms, sessionLabel?): {start, end}` — report-v452.ts:445-470 (full ZR-6E comment at :420-444):
  - ACTIVATION = E2-designated session window's START on trade day (ET label verbatim e.g. "London Open 02:00-05:00 ET"=06:00Z; coarse TOKYO/LONDON/NY/OFF = 00/07/13/21Z via sessionOf). Orders NOT live pre-session (pre-session dip ≠ fill — phantom-loss class).
  - EXPIRY = NEXT trading day's SAME session start (`dayStart + 86400000 + startMin*60000`) — overnight into next-day reaction window (operator's #7 filled Thu NY, TP ran Fri; v4.5.3 same-day 21:00Z cut KILLED next-day reactions incl DXY Tue chain filled Wed 01:00Z, 4h past cut — 3361 STALE).
  - WEEKEND RULE (operator verbatim): Friday (defensive Sat/Sun too) expires trade-day 21:00Z NY close — extension NEVER crosses weekend; SL/TP resolution AFTER fill stays UNBOUNDED (first touch; breakeven-by-close allowed).
  - v4.5.5 formation floor PRESERVED: `activationMs = max(bracket.start, baseMs)` — order cannot exist before setup forms; floor never defers past E2 session's DAY (simulateUniqueTrade comment — report-v452.ts:545-560).

### 3.3 Who supplies the session label (the DXY/mirror split)

- DXY SOURCE lane `session` field = DISPLAY mapping (setup-gen.ts:165-170 TOKYO→"London Open 02:00-05:00 ET") which would DEFER activation 6h past battle's canonical session (DXY Tue 100.842 Tokyo fill 01:00-03:00Z missed → 3361 STALE) — so sim uses `sessionOf(baseMs)` as the E2 reaction window for DXY (mdve-stage TRANSIT_DEFEND precedent :1226) — report-v452.ts:545-560 comment.
- MIRROR lane carries E2-designated session VERBATIM (`reAnchorMirror` shapeDay.session — mirror.ts:3546 "E2 DESIGNATES, E3 OBEYS"; B1.3 comment names fill model as consumer): `sessionLabel = pair==='DXY' ? sessionOf(baseMs) : (leg.session ?? t.session ?? null)` — report-v452.ts:561-566. ACTIVE return sets `session = e2Designated && shapeDay.session ? shapeDay.session : sessionOf(tradeMs)` (B1.3: E2's "NY Overlap 08:00-10:00 ET for EU Mon", NOT source battle session TOKYO — mirror.ts:3590-3600).
- Floor rows: `TRANSIT_DEFEND` session label = battle's CANONICAL session (display SessionWindow maps TOKYO→London Open, would defer 6h past reclaim and starve fill) — mdve-stage.ts:1226-1240 (floorSetupsToDedupRows TRANSIT_DEFEND branch).
- Chained rows (ZR-4A): `triggerMs = dayStartMs + CHAINED_SESSION_HOUR[session]*3600000` (own day/session bracket start; parent TP fill = trigger event; sim fills on touch = parent TP) — report-v452.ts:1140-1215 (CHAINED_SESSION_HOUR {TOKYO:0,LONDON:7,NY:13,OFF:21}).

### 3.4 simulateUniqueTrade (§3.1 + §7.2 + ZR-6E)

- `simulateUniqueTrade(t: UniqueTrade, bars)` — report-v452.ts:490-577: legs = `staggeredEntries` else single E1 leg; degenerate (no bars / entry==sl) → NOT_TRIGGERED. Per leg (chronological total order — §2.2 merge): bracket from `baseMs = leg.triggerMs ?? t.triggerMs`, `activationMs = max(bracket.start, baseMs)`, first bar `≥ activationMs`; fill `LONG ? low<=entry : high>=entry` within `[activationMs, bracket.end)`; on trigger resolve SL/TP from there (SL FIRST pessimistic — verify-mirror-fix.ts:145 canon), ONE SL ONE TP (§2.2); MAE vs blended entry for §6.4 vote; all legs expire → NOT_TRIGGERED "every order leg expired unfilled within its bracket" + `expiredLegs[]` (§7.2 evidence; zombie "live to Jul 28" dead — audit 4/6). OPEN when triggered never resolved at data end.

---

## 4. HOW E2 DESIGNATES AND E3 OBEYS (the mechanical contract)

### 4.1 What E2 emits per day (the ShapeDayZone contract)

- `ShapeDayZone {dayIdx, day, shape, direction LONG|SHORT, keyZoneId, keyZonePrice, supplyZonePrice, demandZonePrice, floor, ceiling, confidence, dayOpenSpot?, supplyZoneId?, demandZoneId?, keyZoneType?, deepDemandZoneId?, session?}` — src/mdve/shape-cascade.ts:34-64 (Phase-5 E1 fields + G1 retirement note + ZR-6D additions). `CascadedShapeChain {pair, storylineBias, days: ShapeDayZone[]}` (:66-69). DayBand carry: Monday priorDayClose = model spot (only Friday-spot use); Tue→Fri dayOpenSpot = f(prior predicted London-open + shape travel) — shape-brain.ts:1224-1228 + :1750-1760; RANGE-day reachability band via priorStoryline (:1251-1255, :1321-1330).
- Producers: `brainDaysForTranslation(snap)` (translation input incl keyZoneType/deepDemandZoneId — report-v452.ts:750-782) and `snapshotToCascadedChain(snap, pair)` (mirror shapeDay source incl dayOpenSpot/supplyZoneId/demandZoneId/keyZoneType/deepDemandZoneId/session from `d.session ?? d.keyTransitionTime` — :784-810). `toEntryDir` (:727-747) resolves RANGE/NEUTRAL via primary side (keyZoneType SUPPLY→SHORT / DEMAND→LONG; sides heuristic fallback).
- E2 objection law (ZR-6A/B): E2 emits ZONE ANCHORS ONLY — `keyZonePrice` GONE from output, never read (mirror.ts:1634-1639 centerKey comment; :3160-3180 e2MatchId comment: "E2 generates SHAPE CHAIN from ZONE ANCHORS (prices are not even a variable for E2). E3 generates trade setups at specific price levels on top of the E2 shape chain"). Center-suffix fallback derives from designation's OWN numeric tail (resolved zone center geometry), never E2 price.

### 4.2 E3 obeys, site by site (all inside reAnchorMirror — mirror.ts:3075-3716)

1. **ANCHOR (authoritative exact-match, full-model first).** `selectPairNativeZone(lmv.table, zones, zoneClass, direction, sourceFormationMs, spot, {excludedIds, week, classFlexibleLQZFallback}, shapeDay)` (mirror.ts:1380-1400 signature; call at :3130-3155 + LQZ fallback :3156-3165). E2 block #1 (:1422-1500): direction-appropriate `e2MatchId = LONG ? demandZoneId ?? keyZoneId : supplyZoneId ?? keyZoneId` (2026-08-05 decisive fix: LONG mirrors MUST anchor DEMAND — inverse cascade DXY-supply→EU-demand; old primary-keyZoneId anchored LONGs at SUPPLY, wrong side), checked against FULL model (every OB + every LMV rung) BEFORE class/group/price filtering (2026-08-01 overhaul: E2 overrides class lock/freshness/price-range; old class-locked pool lost E2's 1H OB to June rung). Returns IMMEDIATELY, no ranking/heuristics (operator: "E2 DESIGNATES the zone, E3 OBEYS"). Exclusion-aware (distribution: exact id + `|center.toFixed(5)` suffix must not re-admit used anchor — ZR-4.1/C1 pile-up fix :1430-1445 + :1618-1630) with pair-prefixed-LMV numeric-tail normalization (B1 fix: `LMV|pair|center` vs `LMV|LMV|center` never string-equal — :1466-1480). E2 block #2 (:1608-1665): legacy keyZoneId path + mirrorDir side paths (SHORT→supplyZoneId first even on chain-LONG day — golden Mon has BOTH SHORT 1.14544 + LONG 1.14004, chain designates ONE side per day; dual-side D16.15 designation). Fallback only after authoritative checks: class+side+strength tier sort (advisory +2 bonus GONE; without shapeDay byte-identical pre-E2 — :1667-1700). Day-native reference `daySpot = shapeDay.dayOpenSpot ?? targetSpot` governs on-side + VIOLATED band (Phase 5: "E2 waveform based not dumb Friday spot" — :1395-1405).
2. **ENTRY (E3 price resolution).** `e2MatchId` recomputed (:3168-3175); `e2Designated = (e2MatchId===anchorZoneId)` → `e2ZoneResolvedEntry(anchor, direction, model, pair, pip, shapeDay.shape)` else `defendedEdgeEntry` fallback (:3176-3180 + ZR-6A/B comment). `e2ZoneResolvedEntry` (mirror.ts:2416-2480): LMV anchor → own near edge (LONG top / SHORT bottom); OB anchor → strongest same-side internal rung (SHORT: rung floor; LONG: zone top normally, DEEP rung top for RWL/PRWL/R/RS recovery trades — #4 E 1.14020 = rung-1.14010 ceiling Δ0.7p, #6 E 1.13935 = deep shield Δ0.2p; SS/BS/WL near — #7 Δ2.6p HIT, #1 SHORT floor Δ0.5p HIT); no internal rung → honest defendedEdge fallback (§12 Law 3). Same §8.1 internal-rung edge semantics as DXY F1-C (`LONG ? rung.top : rung.bottom` — setup-gen internalLmvRungEntry, cited :2475-2480).
3. **SESSION.** ACTIVE `session = e2Designated && shapeDay.session ? shapeDay.session : sessionOf(tradeMs)` — B1.3 (mirror.ts:3590-3600). Fill model consumes verbatim (report-v452.ts:545-566).
4. **SL.** `computeLadderStepsSL(model, ladderEntryZoneId, entry, direction, pip, {asOfMs: battleMs?, confidence: mirrorConfidenceScore(...)})` PRIMARY (ZR-3.1: 3p outside current-step far edge CURRENT_STEP, or 1-2p inside next-step close edge NEXT_STEP; relevant zone = ZR-1 operative defense — fuel INTACT→LQZ SHIELD_FUEL, ABSORBED→S/D PRESSURE_STRUCTURE; null → golden fallback) — mirror.ts:3229-3260. `mirrorConfidenceScore(shapeConf, anchor, direction, shapeDay, model, pair)` (mirror.ts:2183-2210: base 0.5 +0.2 if shapeConf≥0.65 +0.15 VIRGIN/ACTIVE_1 −0.2 DEPLETED +0.15 INTACT −0.2 ABSORBED +0.1 shapeDay.direction===direction; LMV pressure via `bridgedLmvZone` :2115-2121 `LMV|pair|center` — zone-pressure VIRGIN-by-convention) → ZR-6B Rule S3: ≥0.6 RR-tight (3p back edge), <0.6 safety (next-rung) (:3245-3260). Fallback `computeGoldenSL_V452` (v4.5.5 re-port: computeSL_LMV 4-9.5p reaction-extreme + selective util guard tighten iff util<0.40 + §4.4.3 wick-clear; D17 36p ceiling :101) when no operative defense (:3260-3270).
5. **TP.** `computeLmvTP(entry, sl, direction, model, pair, pip, {structuralExtension:true, e1PressureClassification:true}, shapeDay)` (mirror.ts:2648-2800: Law-14 walk; E2-shapeDay projected opposing zone defendedEdge FIRST then significance walk; fresh-wall zfp≤20 cap; E1-walls strengthDrivenRungTp; weak-shelf pass-through REJECTED by measurement) else ladder `computeMirrorTP` fallback (:546-600) else `TP_NULL` discard (:3300-3320). Refine input threads `shapeDay` (:1160-1170 setup-gen source lane; :231-248 refinement-machine RefineInput).
6. **RE_TRANSLATE NEVER overrides E2.** 3D audit `RE_TRANSLATE` + `e2Designated` → `E2_DESIGNATION_HELD` flag, skip re-anchor, SL/TP repair on E2 zone only (B1.5 — mirror.ts:3360-3390). Non-E2 INVERSE lane may `retranslateSetup` (C1-C4 primary matrix) and re-anchor (correctedAnchors ride card + anchorInfo); KEPT lane DEFERS (no safe BoM-wall substrate — drift 1.33970→1.32822 measured — verdict + C-fails on card for Wave-K review) (:3390-3470). RRR<floor → `refineSetup` SAME anchors, E/SL/TP placement only (R2: "entry is hard-won insight; SL/TP are engineering" — :3492-3520).
7. **TRADE DAY + CS-1 + NARRATIVE obey day-native E2.** `tradeMs` from SOURCE signal day (shapeDay.dayIdx + battleMs/carried day; WAVE H1/G2-flag-3: "Mon EU SHORT = Monday"; pre-fix anchor-reaction time gave pre-week 2026-06-18 labels + misbracketed fills — :3522-3560) → `tradeDay = dayKeyOfMs(tradeMs)`. CS-1 `structurallyValid({sl}, openPrice, direction)` with `openPrice = shapeDay.dayOpenSpot ?? sessionStartPrice` (CHANGE 3/G2-flag-2: day-native, not pre-week anchor session; `CS1_DAY_NATIVE` flag else `CS1_UNCHECKED` honest — :3562-3585; structurallyValid :2911-2930). Narrative gate `narrativeAligned` with ZFP bands (suppress >30 WEAK, exempt <20 Hard Wall, 20-30 flagged — :1205-1215 + :2980-3030 + :3586-3600).

### 4.3 The one-line obedience chain (E2 field → E3 consumer)

See §6 table (9 rows). Net: E2 decides WHAT zone / WHAT side / WHAT day / WHAT session / HOW confident; E3 decides AT WHAT PRICE (entry/SL/TP engineering) on those anchors and NOTHING else — same-zone RRR repair explicitly preserves anchors (R2), re-translate explicitly refuses E2 zones (B1.5), distribution explicitly works AROUND the designation (ZR-4.1/C1).

---

## 5. STORYLINE-ENGINE (E2 narrative, 567 lines) — READS E1+E2, WRITES NARRATIVE ONLY

- Doctrine header: E1 (zone map + pressure) PROVIDES STRUCTURE → E2 (shape chain + STORYLINE) BUILDS ON E1 → E3 (setups) FITS WITHIN; module READS `zone.pressure` (ZR-1 frozen) + E2 chain (ZFP-conditioned canon), NEVER changes shapes/zones/E/SL/TP — storyline-engine.ts:1-35. Operator doctrine quoted (E1 pressure + E2 chain → narrative; no WATER ELEMENT flow if fucked) + 7 components/day (Part 16.2) + determinism (no clock/random, sorted iteration).
- Contract types (verbatim, parallel agents code against): `ContestedZoneRead` (zoneId/band/class/lifecycle/mitigation/absorption/summary) :40-55; `BreakValidation` (claimedBreak/zoneId/validated/CLEAN_BREAK|FALSE_POSITIVE|NOT_A_BREAK_CLAIM/reason) :57-70; `StrengthComparison` (bullishPips/bearishPips/BULLISH_STRONGER|BEARISH_STRONGER|BALANCED/reason) :72-82; `WarframePhase` TRENCHES|ZOC_CONTEST|BREAKTHROUGH|COUNTER_ATTACK|STABILIZATION :84-85; `DayStoryline` (day/shape/contestedZone/projectedNext/breakValidation/strengthComparison/warframeArc/narrative) :87-102; `WeekStoryline` (pair/macroArc{...}/strengthComparison/warframePhase/days) :104-117.
- Task 1 contested read (:160-210 `readContestedZone`): keyZoneId → direction-typed fallback (BEARISH→supplyZoneId, BULLISH→demandZoneId) → honest absence; traces `zone.pressure` (never recomputed); eaten-fuel clause from first eaten NESTED link w/ eatenAtMs ISO. Helpers: `pipSizeFor` :123-126 (no-`/`→0.01 incl DXY, JPY→0.01 else 0.0001), `weekdayOf` :130-132 (UTC), `directionOf` :142-145 (UP/LONG→BULLISH, DOWN/SHORT→BEARISH), `isStructuralZone` :152-154 (non-`LMV|` only — LMV VIRGIN-by-convention never validates structure).
- Task 2 projected next (:212-252 `projectNext`): chain's OWN next shape UNCHANGED (match by day name else positional; fallback day.shape/confidence); trigger TEXT narrates pressure (FORTRESS 0-pierce→RWL reversal quote; ≥3x "fail on THIRD mitigation" pierce; 2x minor-recovery-then-pierce; else ZFP-conditioned transition).
- Task 3 break validation (:253-328 `validateBreak`): BS/PBS only else undefined; dir from day.direction else key-zone type (DEMAND→BEARISH through-demand = bearish break) else NOT_A_BREAK_CLAIM honest; allegedly-broken = nearest structural zone on broken side (BEARISH: highest DEMAND top < origin; BULLISH: lowest SUPPLY bottom > origin; origin = keyZonePrice ?? dayOpenSpot ?? spot; deterministic id tiebreak); validated ⟺ lifecycle BROKEN or pierced=true → CLEAN_BREAK ("pierced with a battle") else FALSE_POSITIVE (operator quote: "looking purely at E1 pressure mechanics, this ZONE has not yet been broken" + macro still BULLISH/BEARISH).
- Task 4 strength (:329-375 `compareStrength`): per side LARGEST single-direction 2-8-bar run (consecutive same-direction close-to-close displacement, first-max-wins ties) in pips; verdict ratio≥1.5 else BALANCED; reason prose ("X was extremely weak compared to Y — Z definitively stronger").
- Task 5 warframe (:377-414 `warframePhaseOf` + `warframeProse`): SS/DWL→TRENCHES / WLS/STORM→ZOC_CONTEST / BS/PBS→BREAKTHROUGH / WL/RWL/PRWL/PWL→COUNTER_ATTACK / R/RS→STABILIZATION; prose vocab Part 2.3/2.5.
- Task 6 macro arc (:422-456 `computeMacroArc`): from `priorStoryline` (sweepOrigin price/ms, rangeTop/Bottom, defended/broken counts) else honest absence ("opens without 2-week macro arc", range falls back to model.narrative only when prior carried none — sourced never invented).
- Task 7 assembly (:458-510 `composeNarrative` + `zoneTypeWord` + `capitalize`): `${day}: ${shape} (${dir}). Contested... is Nx mitigated (...). ${trigger}. ${breakReason}. Warframe: phase — prose. [Monday: macro.][strength when non-balanced.]`; `computeWeekStoryline(model, chain, days, priorStoryline, bars)` (:512-567): macro + strength once, per-day contested/projected/break/phase/narrative, week phase = last non-SS else last day.
- Wiring (report side): `storylines[pair] = computeWeekStoryline(model, snap.shapeChain.chain, snap.shapeChain.dayDecomposition ?? [], priorStorylines[pair] ?? null, barsByPairTf[pair]?.['1H'] ?? [])` + log warframe/strength/pips/days (:939-950); null brain → skip + log honest absence. Threads into `cascadeV45` ctx as `storylines` (additive; pre-ZR-3 lanes never read — :1128-1136 + local type extension precedent) for ZR-3+ E3 conditional anchors (TP's E2-projected zone + refinement rejection contexts) + `renderReport` THE STORYLINE section (:1435-1470: per-pair header warframe/strength/pips, macro summary, reason, day table shape|contested|projection|warframe, narratives + break reasons; `[NO STORYLINE]` honest branch).

---

## 6. THE 9-ROW E2→E3 DATA-FLOW TABLE (DESIGNATES → OBEYS)

| # | E2 field (E2 producer:line) | E3 consumer (consumer:line) | Flow rule (designate → obey) |
|---|---|---|---|
| 1 | `keyZoneId` + direction-appropriate `demandZoneId` / `supplyZoneId` — projectZoneForDay (shape-brain.ts:1257) → dayDecomposition (:1731) → brainDays (:750 report-v452.ts) / chain (:784) | `selectPairNativeZone` authoritative exact-match + `reAnchorMirror` `e2MatchId/e2Designated` (mirror.ts:1438 e2MatchId, :1439-1440 AUTHORITATIVE return; :1608-1640 second block; :3168-3180 e2Designated flag) | LONG obeys `demandZoneId ?? keyZoneId`, SHORT obeys `supplyZoneId ?? keyZoneId` (2026-08-05 fix); FULL-model check BEFORE class/price filters; exclusion-aware (used-anchor + center-suffix); center-suffix fallback from zone geometry (E2 price never read). RE_TRANSLATE refuses E2 zones (B1.5). |
| 2 | `dayOpenSpot` (DayBand forward-projected London-open — shape-brain.ts:1224 dayOpenSpot doc, :1750 DayBand carry) via chain (:784) | on-side predicate + VIOLATED band (`daySpot = shapeDay.dayOpenSpot ?? targetSpot` — mirror.ts:1395-1405) + CS-1 day-native reference (mirror.ts:3562-3585) + v4.5.4 `dayOpenPrice` provider (report-v452.ts:392-400) | Supply-above/ Demand-below tested against DAY's open, not Friday spot (Phase 5); CS-1 uses day open when present (`CS1_DAY_NATIVE` flag). |
| 3 | `direction` LONG\|SHORT (toEntryDir — report-v452.ts:727 incl ZR-6D keyZoneType rule) + `keyZoneType` SUPPLY\|DEMAND + sides | `mirrorDir` side selection in select (mirror.ts:1647-1665: SHORT→supplyZoneId first even on LONG chain day — D16.15 dual-side) + cascade 80% direction (INVERT DXY→EU, KEEP EU→GU — mirror.ts:3120-3125) | E2 side picks the anchor side; mirror direction = E2-day-aware (RANGE primary SUPPLY→SHORT fixes GU-Friday #7). |
| 4 | `session` (E2-designated window, e.g. "NY Overlap 08:00-10:00 ET" — chain :784 `d.session ?? d.keyTransitionTime`) | ACTIVE `session` field (mirror.ts:3590-3600 B1.3) → `sessionBracketOf` label (report-v452.ts:445) → `simulateUniqueTrade` activation (report-v452.ts:490) | `e2Designated && shapeDay.session ? shapeDay.session : sessionOf(tradeMs)`; fill bracket activates on E2 session verbatim (DXY lane excepted → sessionOf(baseMs)). |
| 5 | `confidence` (day confidence pass-through — shape-brain.ts:1250 + :1930) | `mirrorConfidenceScore` (mirror.ts:2183) → `computeLadderStepsSL` branch (mirror.ts:3229-3260, ZR-6B S3) | ≥0.6 RR-tight CURRENT_STEP (3p back edge); <0.6 safety NEXT_STEP (1-2p next rung); lifecycle/absorption/shapeDay-match adjust base 0.5. |
| 6 | `shape` (SS/BS/R/WL family + deep variants RWL/PRWL/R/RS — cascade-translation.ts:575-600 families) | `e2ZoneResolvedEntry(..., shapeDay.shape)` near-vs-deep (mirror.ts:2416-2480) + `computeLmvTP(..., shapeDay)` Law-14 E2 walk (mirror.ts:2648-2800 + :3262-3300) + `refineSetup({shapeDay})` (mirror.ts:3492-3520; refinement-machine.ts:231-248 RefineInput.shapeDay) | RWL/PRWL/R/RS LONG → DEEP internal rung top (#4/#6); SS/BS/WL → NEAR (zone top / rung floor; #7/#1); TP = E2-projected opposing-zone defendedEdge first. |
| 7 | `keyZoneType` + `deepDemandZoneId` (ZR-6D second demand beneath primary — report-v452.ts:750-782 brainDays; :784-810 chain; shape-brain.ts:1108-1128 deepDemand doc) | RANGE-day direction (toEntryDir — report-v452.ts:727-747) + E3 deep-demand structure (cascade ctx + GU/EU day logs — report-v452.ts:973-985 `DD:` field) | Primary side signal disambiguates RANGE days; deep demand = extended-reach structure after primary mitigated. |
| 8 | `day` + `dayIdx` (chain position Mon→Fri — shape-cascade.ts:34-64; euDayIdx/guDayIdx math — mirror.ts:3745-3760 + :3782-3795) + source `battleMs` (B1.4) | `tradeMs/tradeDay` attribution (mirror.ts:3522-3560 WAVE H1) + per-day `shapeDay` resolution (`shapeChains.eu|gu.days[clamp(dayIdx)]`) + 3D audit dayIdx (mirror.ts:3330-3350 battle-day, not formation-day) | Day comes from SOURCE signal day (battleMs → dayIdx → chain day), never anchor reaction/formation time; pre-week-zone clamp bug fixed by B1.4. |
| 9 | `WeekStoryline` / `DayStoryline` (computeWeekStoryline — storyline-engine.ts:512; threaded as `storylines` — report-v452.ts:1128-1136 + :939-950) | ZR-3+ E3 conditional anchors (TP's E2-projected zone + refinement rejection contexts — report-v452.ts:1128-1136 comment) + `refinement-machine.ts:231-248 storyline?` input + report THE STORYLINE section (report-v452.ts:1435-1470) | NARRATIVE-ONLY: selection logic NEVER reads storyline (report-v452.ts:905-915 comment); it conditions SL/TP anchoring + review, never designation. |

---

## 7. FLOOR → DEDUP → SIM → STATS (post-E3, for completeness of the wire)

- `activeMirrors = [...cascade.eu, ...cascade.gu].filter(m => status==='ACTIVE')` — report-v452.ts:1138. `failedAnchors` (NO_PAIR_NATIVE_ZONE honest) + `discarded` (EMISSION_CAPPED/CS1/NARRATIVE/RRR/SL_INVALID/TP_NULL/SOURCE_INVALID) ride `cascade` (mirror.ts:3718-3830 return `{eu, gu, failedAnchors, discarded}`; floor `checkMirrorFloorV45` :3840-3880 invariants + temporal G(discarded→∃reason)).
- ZR-4A Law-27 chaining: per pair primaries (DXY: direction-filtered `generateSourceSetupsV45` mapped via `shapeTrigger` day/session regex `@ (YYYY-MM-DD) (SESSION)`; EU/GU: ACTIVE mirrors) → `generateChainedTrades(pair, primaries, model, {pipValue, categoryFloor:3.0, maxDepth:3})` (trade-chaining.ts:265) → rows `{setupId: CHAIN-<parent>-D<depth>, entry=parent TP, SL=ZR-1 ladder-steps, TP=ZR-3 strength-driven first structural wall, triggerMs=own day/session}` appended BEFORE dedup (in-engine §1.2 identity dedup keeps primaries byte-identical; colliding chain suppressed in-engine) — report-v452.ts:1140-1215.
- `rows = [...floorSetupsToDedupRows(dxySource, activeMirrors), ...chainedRows]` (floor: DXY rows anchor on entry + `battleMs ?? battleMsOfShapeTrigger` activation + TRANSIT_DEFEND canonical session; mirrors via `mirrorToDedupSetupV452` defendedEdge+tradeDay — mdve-stage.ts:1206-1240; mirror.ts:3908-3921 adapter `MIRV45-pair-sourceSetupId`) — report-v452.ts:1216-1218.
- `dedup = dedupTrades(rows)` (trade-dedup.ts:223): identity `pair|direction|anchorBucket|day` (no session — zone+day IS trade; :157-159; bucket :147-150), sorted-identity deterministic groups, `mergeGroup` (:190-222: chronological TOTAL sort triggerMs/entry/setupId → legs E1/E2/E3 weights 0.33/0.33/0.34 normalized by Σw [documented >3-leg GU×10 fix], blended entry, ONE SL/TP from first leg, provenance join), dropped reasons ANCHOR_DUPLICATE/STAGGER_LEG_MERGE (:223-280), stats {inputRows, uniqueTrades, droppedDuplicateRows, staggeredGroups, maxGroupSize, perPair} (:280-300). §4.2 cap `capMirrorEmission` (:313-333: key pair|bucket|day, MAX 1, FIRST kept) enforced in-cascade via distribution + documented §7 casualties (report-v452.ts:1400-1406).
- `sims` per unique via `simulateUniqueTrade` (§3.4) — report-v452.ts:1220-1224. `trades: UniqueTradeInput[]` (§6.3 mandatory: trade_id/pair/direction/day/intendedSession/entry/sl/tp/is_staggered/legs/triggerMs/exitMs/exitPrice/outcome/provenance) — :1226-1248. `report = computeAccurateStats(trades, EVAL_WEEK)` (accurate-stats.ts:287: HEADLINE=in-week trigger+resolve, IN-WEEK-TRIGGERED=triggered_in_week operator default, OVERALL, STALE either-false-never-headline, per-pair, §6.3 table; EVAL_WEEK 2026-07-06→10 — report-v452.ts:291) — :1249. `voteRows` (resolved WIN/LOSS + maePips; anchorPrice = entryZone.defendedEdge ?? entry) → `slVsEntry = dedupSLvsEntry` (raw→unique identity-collapse; v4.5.1 "SL TOO WIDE=25" ≈11 unique wins/10-votes-one-GU-tale — accurate-stats.ts:383-410; report-v452.ts:1251-1268; render §5 :1390-1405).
- `markdown = renderReport({...})` → `report_v452.md` (main writes REPORT_PATH + console HEADLINE/PER-PAIR/SLvsENTRY — report-v452.ts:1475-1494). Sections: §1 HEADLINE (n on everything) :1330-1345; §2 PER-PAIR :1347-1355; §3 TRADE TABLE (§6.3 fields, 7dp FX/5dp DXY precision :1310-1318) :1357-1365; §4 STALE (+trigger/exit/expired-legs detail) :1367-1380; §5 SL_vs_ENTRY :1382-1405; §6 WALL MAP :1418-1432; §7 CAP+CASUALTIES :1400-1406; §8 E1 MAP :1407-1433; STORYLINE :1435-1470.

---

## 8. ANCHOR INDEX (where to read each mechanism)

- Pipeline entry/header chain: report-v452.ts:1-37 (chain doc), :1032-1090 (runChainV452 + pre-flight + DXY-first).
- Constants: :100-106 (ANCHOR/WEEK/WEEK_START/FIXTURE/REPORT_PATH), :108-114 (OPTIONS_WALLS_PATH), :291 (EVAL_WEEK), :293-303 (SESSION_HOUR/ET offset/LABELED_WINDOW_RE).
- E1: loadOptionsWalls :144-180; zfp step :182-189; isForeignOtcLevel :200-228 (PAIR_TAGS :195-199); buildIpZones :230-289; loadFixture :311-403 (pillar loop :369-380, models :375-380, session/dayOpen providers :381-400, IP merge :393-403); mdve/index.ts:129 buildChartModel, :232 pillarResult, :316 EMPTY, :280-283 bridge, :360 matrixZonesToZoneModels; lqz-lobe.ts:497 mergeLqzWithIpZones; 9-pillar-lobe.ts:339 pillarEngine, :599-600/:1571-1577 P3_NO_DATA.
- Pre-flight: prior-week-preflight.ts:59 PriorWeekStoryline, :152 runPriorWeekPreflight, :160 scope, :180 E1, :190 E2, :210-263 extraction; report-v452.ts:1035-1053 loop; shape-brain.ts:123 openingConsolidates, :325 identifyCurrentShape (+:351 prior override), :2207 computeChain (+:2232 opening override), :2397 setZoneMap (+:2403 priorStoryline read), :2421 compute.
- E2 core: toDxyZone :622-720 (ZR-7C :623-640, PILLAR :655-700); toEntryDir :727-747; brainDaysForTranslation :750-782; snapshotToCascadedChain :784-810; buildShapeBrain :832-861; E2CoreResult :863-880; buildE2Core :901-1028 (storyline :905-950 incl computeWeekStoryline call :939-950, translations :955-968, chains :973-980, divergence :981-1000, logs :985-1028).
- E2 designation inside brain: shape-brain.ts:1257 projectZoneForDay, :1731 buildDayDecomposition (:1750 DayBand carry, :1922 project call, :2345 dayDecomp call), :1106 E2-DESIGNATES label law, :1266 ZR-7C chain anchor.
- Cascade translation: cascade-translation.ts:138 TranslatedDayMap, :518 translateCascadeDayMap, :615 computeChainDivergence, :575-600 families/master; shape-cascade.ts:34 ShapeDayZone, :66 CascadedShapeChain, :237 GU-Friday note.
- Storyline: storyline-engine.ts:1 header, :40/:57/:72/:84/:87/:104 contracts, :123 pipSizeFor, :130 weekdayOf, :142 directionOf, :152 isStructuralZone, :166 readContestedZone, :213 projectNext, :254 validateBreak, :330 compareStrength, :378 warframePhaseOf, :403 warframeProse, :423 computeMacroArc, :459 composeNarrative, :512 computeWeekStoryline.
- E3 obey: mirror.ts:141 STRUCTURAL_ENTRY_SOURCES, :1015 isValidEntryAnchor, :1172 shapeChains doc, :1183 translatedDays doc, :1380 selectPairNativeZone, :1422 + :1608 E2 blocks, :1704 defendedEdgeEntry, :2115 bridgedLmvZone, :2183 mirrorConfidenceScore, :2229 computeLadderStepsSL, :2416 e2ZoneResolvedEntry, :2648 computeLmvTP, :2911 structurallyValid, :2980 narrativeAligned, :3075 reAnchorMirror (:3120 direction, :3130 anchor call, :3168 e2Designated, :3229 ladder SL, :3262 TP, :3302 3D audit, :3360 B1.5, :3492 R2 repair, :3522 tradeMs, :3562 CS-1, :3586 narrative, :3603 ACTIVE return w/ :3590 B1.3 session), :3718 cascadeV45 (:3730 EU loop, :3782 GU loop, :3840 checkMirrorFloorV45, :3908 mirrorToDedupSetupV452), :3650 D11 doctrine.
- Brackets/sim: util.ts:29 sessionOf; report-v452.ts:445 sessionBracketOf (:420 ZR-6E comment), :490 simulateUniqueTrade (:545 DXY-vs-mirror label split); mdve-stage.ts:1206 floorSetupsToDedupRows (:1226 TRANSIT_DEFEND); trade-chaining.ts:265 generateChainedTrades.
- Dedup/stats/report: trade-dedup.ts:147 anchorBucket, :157 tradeIdentity, :190 mergeGroup, :223 dedupTrades, :313 capMirrorEmission; accurate-stats.ts:287 computeAccurateStats, :383 dedupSLvsEntry; report-v452.ts:1138 activeMirrors, :1140 chaining, :1216 rows, :1218 dedup, :1220 sims, :1249 report, :1251 votes, :1268 slVsEntry, :1270 wallMap, :1284 markdown, :1319 renderReport (:1407 §8, :1435 STORYLINE), :1475 main.

---

## WHAT E3 ACTUALLY IS

E3 is the price-engineering layer on top of E2-designated zone anchors: it takes each E2 ShapeDayZone day (which zone, which side, which day/session, how confident, what shape) as authoritative and resolves only the executable geometry — the entry at the anchor's internal-LQZ near/deep edge, the SL at the ZR-1 operative-defense ladder step (or the golden reaction-extreme fallback), the TP at the Law-14 opposing-rung walk — then proves the result through the 3D audit, the RRR repair on the same anchors, the day-native CS-1 and narrative guards, the per-anchor emission cap, the dedup identity, and the session-bracketed fill simulation, never re-designating, never converting prices, never inventing levels.

---

*Anchor method: line numbers above are the author's read positions in the v4.5.3 worktree (`PLUTUS/agent/report-v452.ts` 1494 lines; `src/brains/storyline-engine.ts` 567 lines; `src/mdve/*`, `src/brains/shape-brain.ts`, `src/mdve/index.ts`, `src/pipeline/mdve-stage.ts`, `src/report/accurate-stats.ts`, `src/mdve/util.ts`, `src/brains/lqz-lobe.ts`, `src/brains/9-pillar-lobe.ts`, `src/mdve/shape-cascade.ts`, `src/mdve/cascade-translation.ts`, `src/mdve/prior-week-preflight.ts`, `src/mdve/setup-gen.ts`) at commit worktree `plutus-main-66dfa4c`; a one-line drift from Prettier/insertion does not change the named symbol — search the named symbol (e.g. `sessionBracketOf`, `e2ZoneResolvedEntry`, `computeWeekStoryline`) if a number is off by one.*
