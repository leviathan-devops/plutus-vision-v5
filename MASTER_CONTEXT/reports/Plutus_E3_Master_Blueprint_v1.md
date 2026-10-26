# PLUTUS E3 — MASTER BLUEPRINT v1 (THE WORKING ARCHITECTURE)
**Series:** Plutus_E3 (the working v4.5.3 trade engine, extracted for the V6 rebuild)
**Date:** 2026-09-17 · **Sources:** 8 forensic scouts, ~8,000 lines of TypeScript read
**Purpose:** the agent producing the 5.3.3 prompt needs this to not fuck up

---

## MACRO — What E3 Actually Is

E3 is NOT a trade generator. E3 is a **classification + precision alignment engine** that consumes E1's zone map + E2's storyline designation and produces TradeSetups — each one anchored to a specific E1 zone ID + E2 shape day, never fabricating its own rules.

```
┌──────────────────────────────────────────────────────────────────┐
│                    THE E3 COMPOSITION                            │
│                                                                  │
│  E1 (WHERE: zones, pressure)  ──▶  E2 (WHEN: shapes, days) ──▶ │
│  ZoneMapSnapshot                    ShapePredictionSnapshot      │
│  + pillar IP zones                  + shapeChains (day zones)    │
│                                         │                        │
│                                         ▼                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ E3: THE TRADE ENGINE                                     │   │
│  │                                                          │   │
│  │ ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │   │
│  │ │ MDVE LANE   │  │ TRADE BRAIN  │  │ VISUAL LANE     │  │   │
│  │ │ (source)    │  │ (legacy      │  │ (VLM-validated  │  │   │
│  │ │ setup-gen   │  │  overlay)    │  │  precision)     │  │   │
│  │ │ chaining    │  │  confidence  │  │  VisualSDZone   │  │   │
│  │ │ dedup       │  │  session     │  │  stagger entry  │  │   │
│  │ │ ob-engine   │  │  TimesFM     │  │  D36 SL/TP      │  │   │
│  │ └──────┬──────┘  └──────┬───────┘  └────────┬────────┘  │   │
│  │        │                │                    │           │   │
│  │        ▼                ▼                    ▼           │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ FLOOR: RRR ≥ 2.5 · session · SL envelope        │   │   │
│  │  │ DEDUP: identity + stagger merge + emission cap   │   │   │
│  │  │ SIM: session-bracket fill simulation             │   │   │
│  │  │ STATS: accurate + votes + wallmap + report       │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│              TradeSetup[] (E/SL/TP/RRR/confidence/session)      │
└──────────────────────────────────────────────────────────────────┘
```

**E2 DESIGNATES, E3 OBEYS.** Every order leg's session bracket comes from the E2 session label. Every anchor traces to an E1 zone ID + an E2 shape day. E3 never overrides E1/E2 data (the R3 law).

---

## PART 1 — THE COMPOSITION (from e3-wiring, 270 lines, 127 anchors)

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

---

## PART 2 — THE MDVE LANE (from e3-mdve, 637 lines, complete)

# E3 MDVE Layer — Architecture (Plutus v4.5.3 working codebase)

Source root `PLUTUS/agent/src/mdve/`. Four files, 2706 lines: `setup-gen.ts` (1376) +
`trade-chaining.ts` (301) + `trade-dedup.ts` (524) + `ob-engine.ts` (505).
Pipeline position: `buildZoneMap` (ob-engine) yields the `ZoneModel[]` zone map; per-pair
`generateSourceSetups[V45]` (setup-gen) emits structural `TradeSetup[]`; `generateChainedTrades`
(trade-chaining, Law-27) mints reaction generations; `dedupTrades` + `capMirrorEmission` +
`assertRowCountIntegrity` (trade-dedup) enforce stats integrity.
Geometry is never re-implemented in setup-gen: SL/TP come from mirror.ts helpers
(`computeMirrorSL` / `computeMirrorTP` / `proxyAtr1hPips`) and sl-lmv.ts (`computeSL_LMV` /
`entryPrice_LMV`), over the model section-7 ladder enriched with section-6.2 matrix rungs
(setup-gen.ts:14-24). Zero pixels, zero LLM; deterministic — same model yields byte-identical
setups (setup-gen.ts:31-33).

---

## 1. OB-ENGINE ZONE-MAP FACTORY (`src/mdve/ob-engine.ts`)

### 1.1 Timeframe contract

- `MDVE_TIMEFRAMES = ['4H','1H','30m']`, always all three (ob-engine.ts:47-48).
- `ObEngineInput` (ob-engine.ts:200-210): `{ pair, spot, pipValue, barsByTf, pillarResult? }`.
  `pillarResult` absent yields confluence 0, never invented (section-12 Law 3).
- `buildZoneMap` (ob-engine.ts:328): three-lane construction + OBCV lane + T2/T3 nesting +
  deterministic sort (4H, 1H, 30m, then price ascending, then formationMs). Total on any input
  including empty bars, yielding a possibly-empty list.

### 1.2 4H canon path (wrapped, lobe never modified)

- `construct4HZones({bars, instrument, spot, pipValue, timeframe})` from
  `brains/4h-sd-lobe.js`, sliced to `TF_CONSTRUCTION_PARAMS[tf].maxBars` recent bars; move window
  `BARS_PER_DAY * MIN_MOVE_TRADING_DAYS`, min move `SINGULAR_CANDLE.MIN_MOVE_PIPS`
  (ob-engine.ts:333-345). OB candle recovered by `timestamp === createdAt` match; unrecoverable
  keeps canon BoM/MoM verdict + empty event scan, deterministic id
  `${pair}|${tf}|${formationMs}|${floor}` (ob-engine.ts:~352-372).
- Deterministic id rule (section 5): canon lobe wall-clock id suffix discarded — same bars give
  byte-identical model (section-12 Law 2).

### 1.3 Native 1H/30m detector params — every constant has a BECAUSE (section-12 Law 5)

`MDVE_TF_OB_PARAMS` (ob-engine.ts:65):
- 1H `lookbackBars 300` ~= 12.5 trading days (2.5 weeks). BECAUSE: 1H BoM/MoM zones form at
  prior-week sweep origins + mid-rally shelves; the canon 120-bar (~5d) window cannot see them.
- 1H `minMovePips 30` over `moveWindowBars 36` (~= 1.5 trading days). BECAUSE: a 1H order block
  precedes a 1H-scale move — tens of pips over 1-2 sessions on an FX index, i.e. the 4H doctrine
  (50p/3d SINGULAR_CANDLE) re-scaled to the TF (canon Law 2: TF-scaled construction).
- 1H `maxZoneWidthPips 25` = canon `TF_CONSTRUCTION_PARAMS['1H']` (4h-sd-lobe.ts:66), cited not
  imported — the lobe is frozen.
- 30m `lookbackBars 576` ~= 12 trading days. BECAUSE: same horizon as the 1H window,
  expressed in 30m bars (equal doctrine, TF-scaled bar counts).
- 30m `minMovePips 20` over `moveWindowBars 48` (~= 1 trading day). BECAUSE: a 30m order block
  precedes a session-scale leg — finer TF, finer structural scale.
- 30m `maxZoneWidthPips 15` = canon `TF_CONSTRUCTION_PARAMS['30m']` (4h-sd-lobe.ts:67), cited.

### 1.4 `detectTfOrderBlocks` doctrine (ob-engine.ts:141-197)

- Canon singular-origin, re-scaled: OB = LAST opposite-color candle before a displacement leg.
  Bear candle (demand) / bull candle (supply) whose max forward excursion over the next
  `moveWindowBars` bars from its close reaches `minMovePips`. Contiguous qualifiers form ONE base
  (event-granularity); the base OB = its LAST candle. Width `high-low > maxWidth` rejected.
  Bull and bear passes independent. `RawOb` (ob-engine.ts:119-124):
  `{ obIndex, floor, ceiling, type }` in lookback-window index space.

### 1.5 `assembleZone` shared construction (ob-engine.ts:213-265)

- `classification = classifyBoMMoM({bars, obIndex, direction, moveWindowBars, minMovePrice})` —
  section-6.3 formal classifier at the TF own structural scale, never canon 4H scale.
- `reactionEvents = extractReactionEvents(windowBars, obIndex+1, floor, ceiling, demand|supply)`
  from the bar after the OB candle; `freshness = runFreshnessMachine(events)` (section-6.4
  recurrence over event-granularity retests); `zfp = zfpFromState(classification, freshness)`.
- `confluence` = count of 9-pillar levels inside [floor, ceiling], else 0.
- T4 30m rule (operator 2026-07-31): 30m `classification` forced to `MoM` at construction and
  again on the OBCV lane — belt+suspenders over bom-mom.ts piecewise path that can emit BoM at
  30m scale. BECAUSE: a session-scale OB cannot evidence the multi-session displacement a BoM
  origin requires.

### 1.6 OBCV lane bridge (Phase 4, operator 2026-07-31; ob-engine.ts:~266-438)

- `buildObcv({barsByTf, anchorMs, pair, pipValue})`: displacement-field + origin-candle matrix +
  prior-move classifier + telescoping incidence machine. Supplements, never replaces,
  `detectTfOrderBlocks`; both lanes coexist, dedup by id.
- `anchorMs` derived here (ObEngineInput does not carry it) = latest bar timestamp across all
  TFs — same last-available-bar fallback as index.ts:157; same bars give same anchor.
- `obZoneToZoneModel` (ob-engine.ts:303-325) field-fidelity contract: `id/type/top/bottom/`
  `timeframe/classification/formationMs/zfp` pass-through (`OB|pair|tf|originMs|floor` namespace
  never collides with native `${pair}|${tf}|${formationMs}|${floor}`); `freshness:'FRESH'` (no
  section-6.4 recurrence on OBCV lane = group-0 alive, mirror-admissible); `reactionEvents:[]`
  (synthesizing events would fabricate canon structure — honest emptiness); `confluence:0`;
  `ObZone.parent` string NOT mapped to `ZoneModel.parent` object (type/semantics mismatch — T2/T3
  own the links); `center/originIdx/bw/bf/prior` dropped (not ZoneModel fields).
- ZR-3.6 Law-14 data-gap repair (2026-08-04, ob-engine.ts:~415-436): OBCV zones eternal
  VIRGIN/UM (empty events) made the Law-14 no-teleport check misfire on traversed shelves
  (Friday wall [100.803-100.937]: 42 in-week closes inside, 7 below, 0 recorded events). Repair:
  extraction of real battles from the zone own-TF bars forward from `originIdx`, freshness+zfp
  derived — E1 pressure state now TRUE on the OBCV lane (ZR-1 full-pressure-state doctrine).

### 1.7 T2/T3 telescoping nesting (operator 2026-07-31)

- T2 (ob-engine.ts:~440-455): 1H zone fully inside same-type 4H zone yields child
  `refinedLabel='1H Refined 4H'`, `nestedWithin`=parent id, parent `refinedBy`=child id (finer
  edge wins for entry), parent confluence +3 dual-TF bonus (Law 32, cap 14). No parent:
  independent top-level zone, kept as-is.
- T3 (ob-engine.ts:~457-470): 30m inside same-type 1H yields `refinedLabel='30m Refined 1H'` +
  `nestedWithin` + `parent` object link. Orphan 30m MoM kept (valid reaction point).
---

## 2. SETUP GENERATION (`src/mdve/setup-gen.ts`)

### 2.1 Doctrine (section 8.1, setup-gen.ts:1-33)

- A setup is emitted ONLY from a STRUCTURAL anchor — an ORDER_BLOCK-derived zone (section 6.1;
  a ZoneModel is OB-derived by construction) or an LQZ matrix rung (section 6.2) — and ONLY when
  price BATTLED at that anchor (a touch with rejection anatomy: SWEEP / WICK_REJECT / BODY_DEFEND
  / CONSOL_DWELL; PASS_THROUGH is noise, and a PIERCED event is the zone LOSING — no entry
  against a closed-through level).
- `StructureRef` (setup-gen.ts:83-97): `{ kind: ORDER_BLOCK | LQZ, id, direction, top, bottom,
  timeframe, classification, zfp, events }`. Direction law: SUPPLY / BUY_SIDE yields SHORT;
  DEMAND / SELL_SIDE yields LONG (section 8.1 + ICT side doctrine). LQZ rung id deterministic:
  `${pair}|LQZ_M|${center}` (setup-gen.ts:86).
- Identity (section 8.3/8.4, setup-gen.ts:~30): same structure + same day + same session = ONE
  trade; different day OR session = DISTINCT trades (the range top reacting Jul 7 AND Jul 8 =
  2 trades). Plus the cross-structure merge: two same-direction structures whose entries lie
  within the Law-7 buffer of each other, battled in the same (day, session) window, are ONE trade
  — the higher-significance structure represents it (OB > LQZ, BoM > MoM, higher timeframe, zfp,
  id — total order, deterministic). This stops the overlapping OB-slice cluster (ten demand slices
  over 25 pips) from re-inflating into the DXY=39 slop the section-8.1 ruling ended.
- Viability: a candidate whose geometry cannot pay its category floor (canon `rrrForCategory` —
  the SAME bar the mirror applies on target-pair geometry) is not a valid trade — skipped with a
  logged reason, never emitted. "Cap nothing": every valid structural setup is emitted.

### 2.2 Options + deterministic helpers

- `SourceSetupOptions` (setup-gen.ts:108-145): `fromMs`/`toMs` battle window, default
  `[model.anchor.weekStartMs, model.anchor.anchorMs]` — the trade week (prior-week battles are the
  model's CONTEXT: the Jul 3 sweep shapes the week; its setups belong to the prior week's set);
  `includePierced` default FALSE — a pierce is a close through the zone's far edge (the level LOST;
  entering against it is entry-against-breakdown); `categoryFor` override; `onReject` sink.
- `SourceSetupReject` (setup-gen.ts:100-106): `{ structureId, day, session,
  reason: SL_INVALID | TP_NULL | RRR_BELOW_FLOOR, detail }` — honest emission accounting
  (section-12 Law 3).
- Category default (setup-gen.ts:182-190): 4H timeframe OR BoM classification yields HTF_SWING
  (higher-timeframe beginning-of-move structures carry the swing trades); everything else yields
  SWING_SCALP (SS doctrine: range trade zone edge to opposing zone edge — ShapeCode.SS only
  acceptable meaning, AP22). No-signal default: HTF Swing (task doctrine).
- `dayKeyOf` (setup-gen.ts:147-149): UTC ISO day — section-8.4 dedup-key component. `WEEKDAYS`
  (setup-gen.ts:152) feeds the display field. `SESSION_RANK` (setup-gen.ts:155): TOKYO 0, LONDON
  1, NY 2, OFF 3 — total order. `SESSION_DISPLAY` (setup-gen.ts:165-170): TOKYO yields
  LONDON_OPEN, LONDON yields LONDON_MID, NY yields NY_MID, OFF yields NY_CLOSE — DISPLAY ONLY;
  the canonical session is the SessionLabel carried in shapeTrigger/notes; nothing downstream
  reads the display field.
- `significanceOf` (setup-gen.ts:173-179): OB +1000, BoM +100, tfRank (4H 3 / 1H 2 / other 1)
  times 10, plus zfp/100. BECAUSE: total comparator — OB outranks LQZ, BoM outranks MoM, higher
  TF outranks lower.
- `confidenceOf` (setup-gen.ts:192-198): 75 + BoM 10 + 4H 5 + min(10, floor(zfp/10)), cap 95.
  BECAUSE: deterministic from structure quality, never wall-clock. `tierOf` (setup-gen.ts:200-208):
  90 S / 80 A / 70 B / 60 C / 50 D / else F.
- `qDist` (setup-gen.ts:347-349): quantize price distance to 1e-6. BECAUSE: float centers vs sweep
  edges differ ~1.4e-14 and a RAW comparator lets that epsilon pick the rung (measured: the earth
  rung flipped to c=101.310, TP 101.310 instead of the operator 101.240). Every distance
  comparator quantized (section-12 Law 2).
- Entries: `generateSourceSetups` (setup-gen.ts:228-232) = v4.4 frozen path (entry = anchor canon
  front edge; SL = `computeMirrorSL` next-rung walk; TP = `computeMirrorTP` Law-14 walk —
  byte-identical preservation, zero broken windows); `generateSourceSetupsV45` (setup-gen.ts:261)
  = v4.5 LMV-refined lane; both delegate to `generateSourceSetupsImpl` (setup-gen.ts:596) with
  `geometry 'v44' | 'v45'`. v4.5 refinement is GEOMETRY-ONLY per spec (setup-gen.ts:241-258): ENTRY
  `entryPrice_LMV` = defendedEdge (level price ACTUALLY reverses from — modal body-close of
  defending candles); SL `computeSL_LMV` just beyond DEFENDED EXTREME (reactionExtreme) accepted
  inside [Law-10 floor, GOLDEN_SL_MAX 9.5p]; entry zone OWN deepest probe first candidate (early
  entry keeps correct structural SL beyond actual probe; SWEEP_ORIGIN keeps required wide SL at
  sweep catches); LMV MISS degrades honestly to v4.4 geometry, never fabricated levels. ADDITIVE:
  v4.4 export untouched, v4.4 cascade contract (verify-cascade 13/13) preserved.
- RWL constants (setup-gen.ts:364-370): `RWL_BOUNCE_INSET_PIPS 0.2`, `RWL_HAIR_MISS_RRR_DELTA 0.1`,
  `RWL_SHELF_LONG_ADJUST_PIPS 1` (refinement-machine MAX_ENTRY_BAND_ADJUST_PIPS doctrine,
  replicated not imported — machine module frozen, same pattern as sl-lmv.ts replicating
  LAW7_SL_BUFFER_PIPS). BECAUSE lines live in chunk 3 step 8 / step 5.

### 2.3 `lmvZoneForStructure` rank doctrine (setup-gen.ts:294-331)

- Side: LONG yields BUY_SIDE demand, SHORT yields SELL_SIDE supply (LMV side semantics); match =
  band overlap with the structure (`bottom <= s.top && top >= s.bottom`); zero overlap yields null.
- ORDER_BLOCK: match anchored to the BATTLE OWN probe — candidates restricted to zones whose
  defendedEdge sits ON THE DEFENDED SIDE of the probe (LONG: at/above wick tip; SHORT: at/below)
  — a defendedEdge BEYOND the wick tip never fills during the battle week (measured: the 100.793
  shelf under Monday 100.847 wick starved 4 days, then filled into Friday crash, converting a v4.4
  win into a loss). Ranked by |defendedEdge − probe| (zone whose turn-level IS the battle turn
  level), then candles, zfp. No battle events: OB own wick (defense edge) is the probe reference.
  BECAUSE (section 4.2): entry AT the level price actually reverses from — never deeper than the
  observed reversal.
- LQZ: rung own level IS its band — strongest overlapping zone (most reaction candles =
  most-proven turn level, then lowest zfp, then nearest defense edge) — mirror.ts
  defendedEdgeEntry overlap semantics (proven path).
- `centerOfLmvZoneId` (setup-gen.ts:333-336): numeric center of bridged `LMV|pair|center` id
  (toFixed(5)) via trailing-number regex, else 0.

### 2.4 Stage 1 — structural universe (setup-gen.ts:610-636)

- `model.zones` mapped to ORDER_BLOCK refs + `model.lqzMatrix` mapped to LQZ refs (timeframe
  pinned 1H, MoM). ICT side doctrine on matrix: BUY_SIDE liquidity rests ABOVE (buy stops) — a
  rejecting battle there is SHORT; SELL_SIDE below yields LONG.
- Shared geometry inputs (setup-gen.ts:607-608): `mergeTolerance = (LAW7_SL_BUFFER_PIPS[pair] ??
  3) * pipValue`; `atr1hPips = proxyAtr1hPips(model, pipValue)` — ONE shared SL/TP code path for
  source and mirror.

### 2.5 Stage 2 — battle groups + temporal freshness gate (setup-gen.ts:638-793)

- Grouping: (structure, day, session) = one candidate (section 8.4). Events sorted by
  firstTouchMs; out-of-window (`fromMs`/`toMs`) skipped; pierced skipped unless `includePierced`.
- Freshness AT BATTLE TIME (model freshness is END-state at anchor; decision happens at battle):
  (a) index `i > 2` skipped — 4th+ battle is DEPLETED/consumed structure (recurrence ladder UM
  100% / 1x 80% / 2x 50% / 3x+ TP-only; trading the 6th touch is the DXY=39 slop); count is
  event-granularity, pierced included (a pierce consumes the most). (b) any prior pierced event =
  VIOLATED terminal: level closed through, never an entry again. Admissibility evaluated on the
  group earliest clean battle (the moment the entry decision was made).
- Groups ordered by (day, SESSION_RANK); each yields `{ structure, day, session,
  battleMs (earliest firstTouchMs), anatomies (sorted distinct battle kinds) }`.
- v4.5.5 F1-B defended-transit entries (LQZ only, v45 only; setup-gen.ts:~700-793): the LQZ matrix
  logs only REACTION battles (SWEEP/WICK_REJECT/BODY_DEFEND/DWELL) — a directional transit bar
  (open below rung + close at/above center with body >= 50%, or low-probe + close-back >= center)
  is filtered as PASS_THROUGH noise, so the operator Monday transit trade was invisible to every
  downstream gate. The shelf springboard (operator #1 Mon SS Long: E 100.945 ~= shelf center
  100.949, delta 0.4p) IS the battle. Detection runs over the rung OWN LMV candle matrix; row
  selection = nearest center to structure center within 10 pips, candles tiebreak (Wave H2
  selection patch — `.find` returned the FIRST table row c=100.9 whose candles lacked the Monday
  03:00Z transit; level-true selection ended the starve). Law-31 freshness: only the rung FIRST
  defended transit of the week per direction emits (`firstTransitMsByDir`, setup-gen.ts:740-752;
  `firstTransitMs`, 752); revisits are consumed (2x/3x+ touches TP-only at best). Never duplicates
  an existing reaction group (`groups.has(key)`, 778) or prior transit. Emitted with
  `anatomies 'TRANSIT_DEFEND'`, `transit: true` (setup-gen.ts:781-789).
---

## 3. SETUP GENERATION — STAGE 3 GEOMETRY (setup-gen.ts:795-1336)

Per candidate, in strict order:

### 3.1 Battle probe (setup-gen.ts:~807-815)

- Group own wick extreme: LONG min / SHORT max over non-pierced same-day-session event prices.
  Anchors the OB zone match (entry AT the level the battle turned at) and arms the selective SL
  guard below. `battleProbe` undefined when the group carries no same-day-session events.

### 3.2 Entry base (setup-gen.ts:828-836)

- v45 + lmvZone yields `entryPrice_LMV` (defendedEdge — level price actually reverses from);
  otherwise the canon front edge (LONG `s.top`, SHORT `s.bottom`).
- Transit candidate (v45, setup-gen.ts:831-833): entry = rung CENTER — the level the move
  transited through (operator E 100.945 ~= shelf center 100.949, delta 0.4p); the defendedEdge is
  the reinforcement level (100.977), a separate trade.

### 3.3 F1-A short-entry edge (v45, ORDER_BLOCK SHORT only; setup-gen.ts:~840-855)

- Resolved entry in the LOWER half of the supply band = worst fill (Monday band bottom 101.027
  / defEdge 101.092 gave RRR 1.79 rejected, where operator 101.14 yields RRR 4.92 at the SAME
  SL/TP walk). Lift: entry yields band top minus 1 pip (operator proven level, within 1.3p of
  every documented short entry). LONGs untouched (defEdge path is the proven v4.5.1 behavior).
  Scope pinned: OB structures ONLY — LQZ-rung lifts moved entries into rally wicks (3367/3371
  losses). BECAUSE: operator documented levels.

### 3.4 F1-C internal-rung entry (v45; setup-gen.ts:869-901 via `internalLmvRungEntry`, 414-468)

- When the entry S/D band CONTAINS an internal LMV rung (`LMV|` ids, same side, rung band subset
  of zone band), entry = that rung NEAR edge (SHORT rung floor; LONG rung ceiling — the level
  candles wicks aligned at), NOT the zone defendedEdge (modal body-close = REINFORCEMENT level,
  a separate trade). Mirrors shape-brain projectZoneForDay keyZonePrice selection
  (shape-brain.ts:1124-1137); candle-count tiebreak per the lmvZoneForStructure LQZ doctrine;
  sweep-edge proximity via `qDist`; bottom/id tiebreaks close the total order.
- No internal rung yields null — caller keeps defendedEdge behavior, byte-identical fallback
  (section-12 Law 3: never fabricated levels).

### 3.5 F1-E prior-week recovery shelf (LONG OB only)

- Prior-week test (setup-gen.ts:423): `s.events.some(e < weekStartMs)` — the deep-wick anchor is
  the DEEP LIQUIDITY SWEEP, not the operator entry.
- Shelf search (setup-gen.ts:425-463): DEMAND rungs above the anchor (`bottom >= anchor top`)
  within the day recovery reach (`top <= dayHigh`, dayHigh = highest wick any LMV row printed that
  day), carrying a defended bullish transit in the rung own matrix that day (F1-B predicate:
  probe through floor + close back at/above center) AND >= 2 day-closes inside the band (the
  day CONSOLIDATED here — the floor shelf; a single-close band such as [100.885,100.918] with a
  01:00Z wick-through is the transit, not the floor). LOWEST such band wins; candle count, then
  center, break ties. Entry = shelf LONG best-fill = band floor + `RWL_SHELF_LONG_ADJUST_PIPS`
  1 pip (E 100.946 ~= operator 100.945; refinement-machine MAX_ENTRY_BAND_ADJUST_PIPS doctrine,
  replicated — machine module frozen).
- Activation (setup-gen.ts:870-896): shelf defended transit candle time rides as
  `effectiveBattleMs = transitMs` with anatomy TRANSIT_DEFEND (the #1 Mon SS Long IS the shelf
  defended transit — deep-wick battle is the sweep, a different trade), so mdve-stage
  canonical-session rule brackets the reclaim (03:00Z), not the deep-wick sweep.
- Shelf geometry, emitted directly as the operator proven set (setup-gen.ts:1017-1075 — NEVER a
  machine repair: the machine probeAtAnchor would force SL below the deep-wick SWEEP that already
  happened pre-entry, killing RRR; golden SL sits ABOVE the sweep, banking via the quick day TP):
  E = shelf best-fill; SL = tightest in-band law7 candidate (rxExt minus Law-7 buffer, distance in
  [Law-10 floor, 9.5] — operator #1 SL 100.905 ~= tight 100.893); TP = day-projected opposing
  supply via `sourceLaneShapeDayFor` (ZR-6A/B: TP resolves from opposing-zone geometry — internal
  LQZ defendedEdge — never E2 price fields; the DXY earth rungs carry defendedEdge === id center,
  so golden Mon LONG TP 101.130 ~= operator 101.115 holds). Law-14 TP-vs-SL precondition (>= 1.2x
  SL) gates the projection; honest absence keeps the existing TP walk (fallback path, byte-identical).

### 3.6 Anchor ZoneModel + SL (setup-gen.ts:~902-980)

- Anchor carries the helpers mandated shape (only top/bottom/timeframe read; LQZ anchors carry
  rung band); type LONG yields DEMAND else SUPPLY; freshness FRESH; zfp preserved.
- v45 path: `computeSL_LMV(entry, lmvZone, direction, table, pair, {atrPips, weekExtreme})` —
  reaction-extreme SL with selective guard built in (entry zone OWN deepest probe first candidate;
  SWEEP_ORIGIN keeps the structurally required wide SL at sweep catches). Method recorded as
  `lmv-<method>`, rung `LMV|<center>`, distance in pips retained for notes.
- PROBE_GUARD: computed SL landing INSIDE the actual probe (LONG sl > probe / SHORT sl < probe —
  the battle group own deepest wick) means the entry was EARLY, not the SL wide. SL re-placed
  just beyond the battle own probe (probe minus/plus Law-7 buffer), tagged
  `PROBE_GUARD(<method> — inside the battle probe <price>)`. Measured: Monday/Tuesday TOKYO
  battles whose wicks exceeded matched reactionExtreme by <1p turned v4.4 wins into losses; the
  guard restores the structural SL and the honest RRR floor rules on viability.
- No lmvZone: `computeMirrorSL` frozen next-rung walk (one shared path). Null SL yields reject
  SL_INVALID (`no rung within the D17 36-pip ceiling beyond [bottom,top]`).
### 3.7 TP (setup-gen.ts:989-1015)

- Transit candidate (v45): `computeLmvTP` — the SS range target = NEAREST opposing LQZ rung
  (consolidation-scalp doctrine: the range edge, not the range top — operator #1 TP 101.115
  filled Monday; range-top 101.207 never did and Tuesday 100.803 dip ended the carry).
- Otherwise `computeMirrorTP` Law-14 walk, v45 carrying `{ passThroughWeakWalls: true }`
  (v4.5.x REFINEMENT 1 golden-TP doctrine: WEAK walls pass through; TP caps at the first STRONG
  opposing rung — the range-top significance target, FURTHER than the weak wall that capped
  v4.5.0). v4.4 frozen semantics (byte-identical). Null TP yields reject TP_NULL (Law-14 walk
  with >= 1.2x SL precondition found no opposing rung of significance).

### 3.8 F1-D RWL bounce-inset (v45 LONG internal-rung path only; setup-gen.ts:364-365, 1082-1146)

- `RWL_BOUNCE_INSET_PIPS 0.2`; `RWL_HAIR_MISS_RRR_DELTA 0.1`. BECAUSE: the section-8.1 internal
  near-edge LONG entry landed ON the rung CEILING (Wed shelf ceiling 100.972) and RRR missed the
  floor by a hair (2.97 < 3.0) — while the refinement machine LONG floor-adjust (band floor + 1
  pip) would PULL the bounce entry down INTO the sweep (measured v4.5.5 loss: SL 100.893 hit
  after the late fill). Entry re-places at the operator bounce-BACK level 0.2p inside the ceiling
  (100.972 − 0.2p = 100.970 ~= operator #5 Wed E 100.970-100.975 — the level the retracement
  actually bounced from, the 08:00Z Wed bar low); SL recomputed with identical machinery
  (`computeSL_LMV` + PROBE_GUARD; mirror walk when no LMV zone) and TP recomputed (transit /
  Law-14, same branch rule); a cleared floor emits WITHOUT the machine (bounce level is the
  operator proven entry, never a machine repair). SCOPE: RRR within [floor − 0.1, floor) — a
  genuine hair, never a wide miss (wide misses belong to the refinement machine). Deterministic.

### 3.9 R2 refinement machine in the source lane (v45 only; setup-gen.ts:1148-1214)

- An RRR-failed setup is NOT dead — the E/SL/TP is wrong on a correct analysis (operator: most
  1.5-2R trades become 3-4R with proper anchors on the exact same zones). `refineSetup({entry,
  sl, tp, direction, pair, pipValue, categoryFloor, targetModel, shapeDay:
  sourceLaneShapeDayFor(...), anchor, entryZone: {defendedEdge: entry, floor, ceiling},
  slLmv: computeSL_LMV, probeAtAnchor})` runs up to 3 surgical repair attempts on the SAME zone
  anchors targeting RRR >= floor; a repaired setup emits with the wrench annotation; only a failed
  repair hard-rejects with the full 3-attempt audit trail (D36) as the discard reason.
- `probeAtAnchor` = structure own NON-pierced week battles beyond entry at/after battleMs
  (Wave I2 probe window, doctrine 2026-08-01: the probe only considers battles AT OR AFTER the
  anchor formation timestamp — pre-formation anatomy is a DIFFERENT battle; the battle group own
  post-formation probe is the only evidence that can lift the SL). v44 RRR-fail: plain reject
  (`the geometry cannot pay for the risk (canon viable-RRR bar)`).
- `sourceLaneShapeDayFor` (setup-gen.ts:518-594): the source lane E3 TP target with no E2 chain,
  derived from the model OWN structure (Tier C ruling #1: TP = the LQZ WITHIN the opposing S/D
  zone — Earth = internal LQZ, Fire = opposing S/D zone containing it). Fire = strongest
  opposing-side S/D zone beyond entry CONTAINING an internal LMV rung (a zone bearing no internal
  LQZ carries no LQZ-level target — measured: the narrow [101.05-101.066] BoM shelf would
  otherwise starve the projection), ranked BoM > MoM, lowest zfp, then nearest near-edge
  (DAY-FIRST-REACTION selection, 2026-08-01 regression repair: golden Mon LONG TP 101.115 = the
  [101.109,101.148] supply filled Monday; range-top 101.240 carried into Wednesday crash and
  died). IP zones (`source==='PILLAR'`) never Fire (Wave A1.1 DECISION-1: confluence/SL-TP
  rungs, never structural anchors). Violated zones excluded. Earth = internal rung nearest Fire
  near edge (old sweep-edge-flush tiebreak biased to range-top — wrong for the day scalp). Id
  `${pair}|LMV|<center>` = mirror OWN lmvAnchorId format (mirror.ts:1102) so computeLmvTP
  exact-match lands on defendedEdge (Wed RWL LONG TP 101.240 = [101.239-101.275] defendedEdge
  inside 1H BoM [101.110-101.275]). Carries the day-projected PRICE so the machine TP cap can
  enforce it (previously null left the cap dead). Absent yields undefined — machine falls back to
  the significance walk (honest degradation, section-12 Law 3).

### 3.10 TradeSetup build (setup-gen.ts:~1216-1255)

- Id `SRC-${pair}-${sanitizedZoneId}-${yyyymmdd}-${session}`; `shapeAlignment SS`; session display
  map; day weekday from battleMs (or shelf transitMs); shapeTrigger `${anatomy} @ ${day}
  ${session}`; battleMs (effective); rrr/slPips; zoneName; isBoMEntry; zoneType map (LQZ yields
  LSZ_DEMAND/LSZ_SUPPLY; OB yields BOM/MOM_DEMAND/SUPPLY by side); directionValidation [].
- Notes carry section-8.1 provenance + entry/SL/TP methods + RRR vs floor + repair annotation
  (full audit string, deterministic).

### 3.11 Shelf dual-entry (LQZ, groupEvents non-empty, v45; setup-gen.ts:1257-1336)

- Operator verbatim: both entries on the 1 trade emitted — not pick-best (one was a LL
  reinforcement, the other the move start; 2 separate trades; multiples within 5-15 pips are legs
  of 1 trade; a LL reinforcement 30+ pips away is obviously separate). `Priced.edgeRole`
  (setup-gen.ts:796-803): PRIMARY vs BATTLE_ORIGIN (origin vs reinforcement = separate, operator).
- `DUAL_ENTRY_MIN_SEPARATION_PIPS 15` (setup-gen.ts:1272) — the operator one-trade band (FIX 4).
  BECAUSE: the v4.5.4 3-pip bucket split the Wednesday shelf 2.7-pip variants into a spurious
  separate trade (the 100.950 EDGE loss). Battle-bucket means (3-pip buckets, 1273-1286) at >= 15
  pips from defendedEdge emit as BATTLE_ORIGIN edge entries named
  `SRC-..._EDGE<bucket>-<date>-<session>` through the SAME SL/TP machinery + PROBE_GUARD
  (mirror walk when no LMV zone), bound by the same floor (honest casualty, never stretched);
  inside the band = stagger legs, not a trade (setup-gen.ts:1287). Edge notes tag the SHELF
  DUAL-ENTRY provenance (move-origin edge vs defendedEdge reinforcement).

### 3.12 Stage 4 — cross-structure merge (setup-gen.ts:1338-1363)

- `ordered` sort: day, session rank, direction, significance desc, entry, setupId.
- A candidate is dropped when a kept candidate shares (day, session, direction) with |entry diff|
  <= mergeTolerance AND both edgeRoles PRIMARY (setup-gen.ts:1345-1361). v4.5.4 FIX 5: the merge
  is a same-PHYSICAL-level dedup — a BATTLE_ORIGIN edge is NEVER merge-killed, not by its own
  structure reinforcement, not by a cross-structure candidate inside the band (origin vs
  reinforcement = 2 separate trades). Highest-significance represents the band.

### 3.13 Stage 5 — final order (setup-gen.ts:1365-1375)

- Mapped setups sorted by (battleMs, direction, entry, setupId). Deterministic, byte-identical.
---

## 4. LAW-27 CHAINING (`src/mdve/trade-chaining.ts`)

- `MAX_CHAIN_RRR 15` (trade-chaining.ts:47). BECAUSE (Law-13 realism ceiling, 2026-08-04):
  operator chained trades run 3-11R; a chained RRR beyond targets an unrealistic far wall
  (TP beyond ~15x SL) that fills and stops (GU LONGs at 1.34957, RRR 20-30 chains). Rejected —
  never a fabricate-to-win far target.
- `ChainedTradeInput` (trade-chaining.ts:54-66): `{ pair, direction, entry, sl, tp, day, session,
  anchorZoneId?, sourceSetupId, chainedFrom?, chainDepth? }` (depth 0 = primary).
- `ChainedTradeOpts` (trade-chaining.ts:68-88): `{ pipValue, categoryFloor (3.0 via
  rrrForCategory), maxDepth? default 3 }`. ZR-6D (2026-08-04): depth extends to 3 — the operator
  Wed triple (EU #4 yields #5 yields #6: set E at the TP of #4, then the #5-to-#6 reaction) runs
  THREE generations. The honest gates bound it (RRR floor, structural-wall absence, week end,
  section-1.2 identity dedup); depth is a CEILING, never a mandate (a 1-deep chain where only one
  reaction is honest stays 1-deep).
- `SESSION_ORDER` (trade-chaining.ts:~89): TOKYO 0, LONDON 1, NY 2, OFF 3 (deterministic sort +
  day rule).
- `isLateSession` (trade-chaining.ts:91-95): NY/OFF late; TOKYO/LONDON (incl `London`) early;
  unknown yields conservative next-day. BECAUSE (TASK 1.7): a London/early primary reaction
  plausibly fires the SAME day (operator #1 yields #2 same Monday); a NY/late primary reaction is
  the NEXT day (#3 Tue yields #4 Wed).
- `chainedSessionOf` (trade-chaining.ts:103-105): same-day chain yields NY window; next-day
  chain yields next London window. BECAUSE: scalps react at London, swings at NY (operator weekly
  rhythm).
- `nextTradingDay` (trade-chaining.ts:112-117): pure ISO-day arithmetic, deterministic, no
  wall-clock. Saturday rolls +2 to Monday, Sunday +1 (FX Mon-Fri; a Friday-NY parent chain belongs
  to next Monday). Unparseable yields unchanged (caller guards empty day).
- `chainIdentity` (trade-chaining.ts:129-131): section-1.2 frozen dedup canon
  `pair|dir|anchorBucket(entry)|day`. Seeding primaries identities into the engine seen-set makes
  chaining ADDITIVE-SAFE: a chained trade colliding with a primary or an already-minted chained
  trade is suppressed, so `dedupTrades` can never merge a chained row into a primary stagger
  group (primaries stay byte-identical).
- `selectEntryZone` (trade-chaining.ts:142-169): every E1 zone containing the chained entry (the
  parent TP), EXCLUDING `IP|` institutional-overlay bands (section 8.1: confluence/ZFP/context +
  SL/TP rungs, NEVER entries). Opposing-type preferred (a LONG reaction anchors on the DEMAND
  zone at the TP; a SHORT on the SUPPLY), then strongest pressure: BoM over MoM, lowest zfp,
  highest confluence, deterministic id tiebreak closing the total order. Absent yields null =
  honest absence, no emission.
- `chainedTargetTp` (trade-chaining.ts:171-195): the first STRUCTURAL opposing wall beyond entry
  (ZR-3.4 doctrine — shallow LMV shelves and IP bands are pass-through, never the terminal),
  priced by the ZR-3.2 strength ladder: STRONG yields close edge minus/plus the 1.5p spread; WEAK
  yields far edge; MIDDLE yields near edge (approach edge — the defendedEdge equivalent for an S/D
  ZoneModel). Filters: non-`LMV|`, non-`IP|`, opposing type, `isStructuralWall`, beyond entry;
  nearest first, id tiebreak. No structural wall yields honest absence (chain not emitted).
- `chainOne` (trade-chaining.ts:197-262), the single-generation Law-27 propagation. Every honest
  absence (no zone at TP, no operative defense, no structural target, degenerate geometry,
  sub-floor RRR) yields no emission: (1) reaction is the OPPOSITE direction off the TP zone;
  (2) Law 27 — parent TP = child entry; (3) E1 entry zone at TP else absent; (4) ladder-steps SL
  via `computeLadderStepsSL(model, entryZone.id, entry, dir, pipValue, {})` (ZR-3A via the ZR-1
  operative defense) else absent; (5) strength-driven TP else absent; structural sanity (SL/TP on
  correct sides: LONG sl < entry < tp; SHORT sl > entry > tp); (6) honest RRR gate — floor
  rejects, `> MAX_CHAIN_RRR` rejects, risk <= 0 rejects, non-finite TP/entry or empty day rejects;
  (7) day/session propagation (early yields same day; late yields next); (8) provenance
  (`CHAIN-${parentId}-D${depth}`, `chainedFrom`, `chainDepth + 1`).
- `generateChainedTrades` (trade-chaining.ts:265-300): the Law-27 engine. BFS over primaries
  sorted by (day, session rank with `London`/`NY` substring fallback else 4, sourceSetupId);
  primaries seeded into the seen-set; per parent within maxDepth: chainOne, identity check,
  push + re-queue (the chained trade is itself a parent — recursion to depth 3).
---

## 5. DEDUP + EMISSION CAPS (`src/mdve/trade-dedup.ts`)

### 5.1 Constants — every constant has a BECAUSE

- `ANCHOR_TOLERANCE_PIPS` (trade-dedup.ts:44-46): DXY / EUR-USD / GBP-USD / AUD-USD all 3.
  BECAUSE (section 1.3): 3 pips is the canonical zone-alignment tolerance (scaffold dedup
  tolerance + LQZ align tolerance, canon lqz-lobe.ts:185). It groups the staggered entries of
  ONE zone (e.g. 100.869/100.871/100.874 inside the 100.845 shelf ~4-pip width) into one anchor
  bucket WITHOUT over-merging adjacent golden rungs (4-10 pips apart).
- `DEFAULT_ANCHOR_TOLERANCE_PIPS 3` (trade-dedup.ts:49). BECAUSE: the table is uniform 3
  (section 1.2).
- `STAGGER_WEIGHTS [0.33, 0.33, 0.34]` (trade-dedup.ts:57). BECAUSE (section 2.2): E1 front 0.33,
  E2 mid 0.33, E3 back 0.34 (the fill ladder, not trades). Beyond E3 (anchor-duplicate groups > 3,
  e.g. GU x10) each extra leg weighs 0.34 per Appendix B, and the blend NORMALIZES by weight sum
  (mergeGroup DEVIATION note).
- `MAX_MIRRORS_PER_ANCHOR_PER_DAY 1` (trade-dedup.ts:65). BECAUSE (section 4.2): a mirror anchor
  (an EU/GU zone) emits AT MOST ONE mirror trade per day; additional DXY sources mapping to the
  same anchor+day MERGE (provenance), never emit separately. The mechanical kill for GU x10
  (section 4.1).

### 5.2 Types

- `DedupSetup` (trade-dedup.ts:77-93): `{ setupId, pair, direction, entry, sl, tp, day (YYYY-MM-DD
  anchor relevance, section 1.2), session? (PROVENANCE ONLY — NO session component in identity),
  triggerMs? (leg-ordering key, section 2.2 chronological merge), entryZone? { defendedEdge? } }`.
  The pipeline TradeSetup carries weekday-name day and no ISO day / trigger ms / zone anchor —
  the section-9.1 wiring supplies them; the verify-dedup.ts report parser constructs this shape
  directly.
- `StaggerLeg` (trade-dedup.ts:95-103): `{ leg E1/E2/..., entry, weight, session?, triggerMs?,
  setupId }`. `UniqueTrade` (trade-dedup.ts:105-113): DedupSetup + `{ trade_id (dedup identity),
  is_staggered, staggeredEntries, provenance (merged source ids ' + '-joined chronological),
  mergedRowCount }` (section 6.3 mandatory-fields subset owned by PKG-DEDUP).
- `DroppedDuplicate` (trade-dedup.ts:115-120): `{ setupId, trade_id,
  reason: ANCHOR_DUPLICATE | STAGGER_LEG_MERGE | EMISSION_CAP | ZONE_POOL_DUPLICATE, detail }`.
  `DedupStats` (122-129): inputRows / uniqueTrades / droppedDuplicateRows / staggeredGroups /
  maxGroupSize / perPair rows-unique-dropped. `DedupResult` (131-137):
  `{ uniqueTrades, droppedDuplicates, stats }`.

### 5.3 Identity (section 1)

- `anchorOf` (trade-dedup.ts:142-144): the LMV defendedEdge, or the entry (section 1.2).
- `anchorBucket` (trade-dedup.ts:147-151): `round(anchor / (tolPips * PIP[pair]))`
  (section 1.2, Appendix B).
- `tradeIdentity` (trade-dedup.ts:157-159): `${pair}|${direction}|${anchorBucket}|${day}`. NO
  session component — the zone+day IS the trade (section 1.2 canon). NOTE vs setup-gen section
  8.4 (session in identity pre-merge): session survives as stagger-leg provenance inside the
  merged trade; the dedup identity stays session-free.

### 5.4 Staggered-entry merge (section 2)

- `mergeGroup` (trade-dedup.ts:185-221), Appendix B EXACT: legs = group sorted chronologically
  (TOTAL: triggerMs, entry, setupId — byte-identical output for ties, e.g. the EU 1.14389 rows
  sharing a session timestamp) mapped to E1/E2/E3 frozen weights; entry = blended entry; sl/tp =
  FIRST leg SL/TP — ONE SL (structural anchor), ONE TP (Law-14 walk target), all legs share them;
  provenance = merged source row ids. DEVIATION (documented, spec-faithful): Appendix B raw blend
  SUM is arithmetically broken for >3-leg groups (10 identical entries blend to 3.4x price — a
  price outside the legs range); the blend NORMALIZES by weight sum — identical to spec for every
  <= 3-leg group (sum 1.00 = weighted mean, EXACT), the only honest value for the duplicate groups
  the audit demands merged to ONE trade.
- `dedupTrades` (trade-dedup.ts:223-279): group by identity, sorted-identity iteration (Appendix B
  deterministic); rows merged away named in droppedDuplicates (ANCHOR_DUPLICATE when all legs
  share one entry price = GU x10 pattern; STAGGER_LEG_MERGE when legs carry distinct entries =
  session/stagger variants of ONE trade, section 2.2).
- `blendedRrr` (trade-dedup.ts:282-297): section-3.2 frozen blend
  SUM weight*|tp − entry_i|/|entry_i − sl| normalized by weight sum (same documented normalization
  as the blended entry); non-staggered reduces to plain RRR; zero-risk leg contributes nothing.

### 5.5 Emission cap (section 4.2/4.3) — the GU-x10 destroyer

- `capMirrorEmission` (trade-dedup.ts:313-337): cap key (pair, anchor bucket, day) — the FX
  anchor, NEVER the DXY source setup id (section 4.2/4.3): N DXY sources mapping to ONE EU/GU
  anchor+day produce ONE emission. FIRST mirror kept (input order = strongest provenance,
  section 4.2); rest drop EMISSION_CAP with logged reasons (audit `emissions_per_anchor` metric
  visible, FIX 4). `EmissionCapResult` (300-303): `{ kept, dropped }`.

### 5.6 Consumed-pool re-admission (section 4.4)

- `qualifyConsumedPoolReadmission` (trade-dedup.ts:~356-377): a consumed-but-recently-battled
  anchor (v4.5.x R2 pool-loosening, e.g. GU 1.34337 supply battled 3x) re-enters the pool ONLY
  when (a) >= 1 rejection-anatomy battle within the week (REACTIVE, not merely consumed — battle
  evidence required, section 4.4.2) AND (b) the re-anchored SL is vol-cleared (clears the anchor
  wick range, section 4.4.3). Requirement 1 (per-day emission cap) enforced separately by
  capMirrorEmission — admitted AND capped compose. `ConsumedPoolCandidate` (339-347):
  `{ pair, anchorPrice, day, battlesInWeek, volatilityCleared }`. `ReadmissionVerdict` (349-353):
  `{ admitted, reasons }`.

### 5.7 Upstream zone-pool dedup (section 4.5)

- `dedupZonePool` (trade-dedup.ts:~380-408): the v4.4 zone map lists the same zone up to 3x
  (audit finding 10: `IP Supply 101.2277` x2, `IP Demand 100.8347` x3) — the ROOT GENERATOR of
  downstream trade duplication. Zones dedup by (pair, class, anchor bucket) at the 3-pip tolerance
  (section 4.5, scaffold dedup rule) BEFORE mirror + setup generation consume them; first
  occurrence wins (input order = provenance), rest drop ZONE_POOL_DUPLICATE with reasons.
  `ZonePoolZone` (~372-378): `{ zoneId, pair, class, anchorPrice }`.

### 5.8 CI assertion (section 1.4) — the regression guard

- `assertRowCountIntegrity` (trade-dedup.ts:~440-473): |rows| == |uniqueTrades| for every report;
  a session-variant or anchor-duplicate producing a second row for the same trade_id+day FAILS
  THE BUILD. The thrown `RowCountIntegrityError` (~418-428, with `isRowCountIntegrityError`
  guard) NAMES every duplicate row beyond the first per identity. Catches all 23 audit duplicate
  rows (6 DXY + 7 EU + 10 GU); also FAILS on disguised mismatch (counts equal but identity
  multisets differ). `DedupReport` (~410-416): `{ rows, uniqueTrades }`.
  `toDedupSetup` (trade-dedup.ts:~490-524): section-9.1 wiring adapter — TradeSetup + caller ISO
  day + optional triggerMs/anchor (defendedEdge when known, else entry fallback); direction
  normalized through a total predicate, no type assertion.
---

## 6. CONSTANT LEDGER (every constant + BECAUSE, file:line)

| Constant | Value | Location | BECAUSE |
|---|---|---|---|
| 1H lookbackBars | 300 (~2.5wk) | ob-engine.ts:66-76 | prior-week sweep origins + rally proof invisible to canon 120-bar window |
| 1H minMovePips / moveWindowBars | 30 / 36 (~1.5d) | ob-engine.ts:66-76 | 4H doctrine (50p/3d) re-scaled to 1H structural scale |
| 1H maxZoneWidthPips | 25 | ob-engine.ts:66-76 | canon TF_CONSTRUCTION_PARAMS['1H'], cited not imported (lobe frozen) |
| 30m lookbackBars | 576 (~12d) | ob-engine.ts:~90-100 | same horizon as 1H in 30m bars |
| 30m minMovePips / moveWindowBars | 20 / 48 (~1d) | ob-engine.ts:~90-100 | session-scale leg, finer TF finer scale |
| 30m maxZoneWidthPips | 15 | ob-engine.ts:~90-100 | canon TF_CONSTRUCTION_PARAMS['30m'] |
| 30m BoM force | MoM | ob-engine.ts:~351,~438 | session OB cannot evidence multi-session displacement (T4) |
| T2 dual-TF bonus / cap | +3 / 14 | ob-engine.ts:~440-455 | Law 32 dual-TF bonus, capped |
| mergeTolerance | LAW7 buffer (DXY 3p default) | setup-gen.ts:607 | same-direction same-window structures within buffer are one trade |
| confidence base/BoM/4H/zfp-term/cap | 75/10/5/min(10,zfp/10)/95 | setup-gen.ts:192-198 | deterministic structure-quality score, never wall-clock |
| tier thresholds S/A/B/C/D | 90/80/70/60/50 | setup-gen.ts:200-208 | pinned confidence ladder |
| depletion limit | battle idx > 2 skipped | setup-gen.ts:~648-660 | 4th+ touch consumed (UM/1x/2x/3x+TP-only ladder) |
| transit body fraction | >= 0.5 | setup-gen.ts:~743-748 | strong-body reclaim = held defense, not drift |
| transit row window | center within 10 pips | setup-gen.ts:~720-730 | level-true LMV row selection (H2 selection patch) |
| transit Law-31 | first-of-week per dir only | setup-gen.ts:740-773 | revisits consumed (2x/3x+ TP-only at best) |
| SHORT lift | band top minus 1 pip, OB only | setup-gen.ts:~840-855 | operator documented short fills within 1.3p; LQZ lifts wicked (3367/3371) |
| transit entry | rung center | setup-gen.ts:831-833 | E 100.945 ~= shelf center 100.949; defendedEdge is reinforcement |
| RWL_BOUNCE_INSET_PIPS | 0.2 | setup-gen.ts:364 | bounce-back 100.970 = ceiling 100.972 minus 0.2p (operator #5 Wed) |
| RWL_HAIR_MISS_RRR_DELTA | 0.1 | setup-gen.ts:365 | genuine hair only, never wide miss (machine owns wide) |
| RWL_SHELF_LONG_ADJUST_PIPS | 1 | setup-gen.ts:370 | machine MAX_ENTRY_BAND_ADJUST doctrine, replicated (module frozen) |
| shelf closes | >= 2 in band | setup-gen.ts:~440-455 | consolidation floor, not through-probe |
| shelf sides | DEMAND above anchor, in day reach | setup-gen.ts:~430-440 | recovery consolidation above deep sweep |
| Law-14 precondition | TP >= 1.2x SL | setup-gen.ts:~989-999 | viable-RRR bar, canon mirror contract |
| DUAL_ENTRY_MIN_SEPARATION | 15 pips | setup-gen.ts:1272 | operator one-trade band; 3-pip split minted spurious 100.950 EDGE loss |
| dual-entry bucket | 3 pips | setup-gen.ts:1273 | stagger-leg granularity inside band |
| MAX_CHAIN_RRR | 15 | trade-chaining.ts:47 | Law-13: operator chains 3-11R; 20-30R fills-and-stops (GU 1.34957) |
| chain maxDepth | 3 | trade-chaining.ts:68-88 | operator Wed triple EU #4-#5-#6; ceiling never mandate |
| STRONG wall spread adjust | 1.5 pips | trade-chaining.ts:~185-190 | close-edge minus/plus spread |
| ANCHOR_TOLERANCE_PIPS | 3 all pairs | trade-dedup.ts:44-46 | scaffold dedup + LQZ align tolerance (lqz-lobe.ts:185) |
| DEFAULT_ANCHOR_TOLERANCE | 3 | trade-dedup.ts:49 | table uniform 3 |
| STAGGER_WEIGHTS | 0.33/0.33/0.34 | trade-dedup.ts:57 | E1 front / E2 mid / E3 back fill ladder; extra legs 0.34 |
| MAX_MIRRORS_PER_ANCHOR_PER_DAY | 1 | trade-dedup.ts:65 | mechanical GU-x10 ender |
| readmission battles | >= 1 + vol-cleared | trade-dedup.ts:~356-377 | REACTIVE not merely consumed (4.4.2/4.4.3) |
| zone-pool tolerance | 3 pips | trade-dedup.ts:~380-408 | scaffold dedup rule, pre-mirror root-generator ender |
| Imported (mirror-owned) | LAW7_SL_BUFFER_PIPS, GOLDEN_SL_MAX_PIPS 9.5, rrrForCategory floors, computeMirrorSL/TP, proxyAtr1hPips | mirror.ts; sl-lmv.ts computeSL_LMV/entryPrice_LMV | single shared SL/TP path — never re-implemented here |

---

## 7. V6 BLUEPRINT IMPLICATIONS (for the E3 5.3.3-prompt agent)

1. Call order is load-bearing: zone map (with ZR-3.6 OBCV battle extraction + T2/T3 links)
   BEFORE setup-gen (needs zones + lmv table + ladder + lqzMatrix); chaining AFTER primaries
   (needs TPs + E1 map); dedup LAST (identity over defendedEdge/entry + ISO day). Reordering
   breaks anchors.
2. Never fork geometry: E/SL/TP placement lives in mirror.ts + sl-lmv.ts + refinement-machine.ts;
   setup-gen only resolves WHICH anchor/level feeds them. A V6 change to SL/TP math lands in the
   shared helpers or it silently forks source vs mirror paths.
3. Floors bind every emission path equally: primary, BATTLE_ORIGIN edge, chained, repaired — RRR
   floor + Law-14 1.2x precondition + Law-13 15 ceiling. Any new emission path without all three
   re-opens DXY-39 / GU-x10 / far-wall-fill slop.
4. Honest absence is a feature: SL_INVALID / TP_NULL / RRR_BELOW_FLOOR / no-entry-zone /
   no-structural-wall all yield no emission, never a fabricated level (section-12 Law 3). The 15/15
   golden set depends on what the code REFUSES to emit.
5. Session semantics are dual: setup-gen section-8.4 keeps (day, session) distinct pre-merge with
   session as leg provenance; dedup section-1.2 identity is session-free. Chaining bridges them
   (early = same-day NY, late = next-day London). V6 must preserve both or stagger legs collapse
   into duplicates.
6. Operator-measured levels outrank machine elegance: short top-1p lift, 0.2p bounce inset, shelf
   floor+1p best-fill, 15-pip dual-entry band, transit-center entry — each encodes a measured loss.
   Generalizing (rounding, widening scope, importing the frozen machine) re-introduces the exact
   documented loss.

---

## PART 3 — THE V6 MIGRATION (from v6-audit-e2e3, 93 cards)

See reports/v6-audit/v6-audit-e2e3.md for the complete 93-card migration map.
Key conversions:
- computeConfidence → Kev E3.Q2 Score [F,C,B,A,A+]
- validateBreak + cascade → Kev E2.Q3 + G-CASCADE
- 6-check validation + session → Kev Q1/Q3/Q5 + G-SESSION/G-CONF/G-RRR
- chainOne/BFS/merge/cap → G-CHAIN/G-DEDUP (verbatim ports)
- sl-lmv entry/SL → Limite L1/L2
- RRR floor → Gate: if rrr < 2.5: reject (code, never model)
