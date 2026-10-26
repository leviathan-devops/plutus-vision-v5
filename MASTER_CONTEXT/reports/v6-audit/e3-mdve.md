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
