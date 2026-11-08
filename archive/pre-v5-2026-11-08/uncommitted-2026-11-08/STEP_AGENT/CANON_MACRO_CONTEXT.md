# STEP_AGENT — CANON MACRO CONTEXT (compaction-proof)

> If you hit compaction: READ THIS FILE FIRST. It is the graph root. Sources of truth live on disk — this file tells you where everything is and what was learned. Every claim here was verified by reading the cited file or running the cited command in-session on 2026-10-12.

---

## 0. WHO I AM / THE MISSION

- I am the **STEP_AGENT** — one of 6+ concurrent model split-tests running the SAME task in this workspace (`DEEPSEEK_AGENT/`, `LAGUNA_AGENT/`, `MIMO_AGENT/`, `MUSE_AGENT/`, mine). **My workspace is `STEP_AGENT/` + git branch `step_agent`. Never touch another agent's dir, ports, or chrome profile.**
- **Operator ruling (verbatim intent):** deep-absorb the PLUTUS canon, PROVE understanding with live chart exercises, and only AFTER he gives explicit permission: rebuild the indicator so E1+E2+3 all render dynamically for any week, temporally scoped to the most recent bar, 95% accurate across 12 random training weeks verified by bar-replay from Monday London open at 10x to Friday close.
- **FORBIDDEN:** telling the operator something is impossible; asking him to solve problems; changing E1/E2 canon rules ("engine one and engine two in the original spec are basically perfect... you are forbidden from changing them in any way, shape, or form"). E3 uses the CORRECTED engine (2026-09-24 surgical replacement).
- **Rename note:** everything labeled "Trident" → "Plutus" later.

## 1. THE CANON (6 source files — `Original_Canon_Data/Toolset/`)

Read fully this session (evidence: each file read end-to-end):

| File | Lines | Role |
|---|---|---|
| `Trident_Fractal_Architecture_FirstPrinciples_v2.3.md` | 721 | The fractal architecture: 4 elemental densities, Earth→Fire→Water→Air cycle, rocket architecture, MoM-ladder law, energy conservation |
| `Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` | 4216 | E1 (9-Pillar 6D zone map) + E2 (macro shape chain) authority — DO NOT CHANGE E1/E2 |
| `TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md` | 1685 | E3 fixed engine (12 phases) — the working E3 |
| `trident_engine3_v8.py` | 1284 | Working Python E3 reference (sniper entry) |
| `Leviathan_Report_Template_v2.0.py` | 1576 | Report template (52 rules) |
| `Trident_Report_Validator.py` | 780 | Report firewall |

### 1.1 THE FOUR ELEMENTAL DENSITIES (fractal arch §2 — operator-verified)
- **EARTH = liquidity + institutional pressure.** LSZ = standard Earth; IP zones = HEAVY Earth. Foundation of everything; SL must anchor to an Earth "shield". Thin zones NEVER entry/SL. Rocket SL always 1 full pip outside back edge. Thin zones inside a 4H pool count double.
- **FIRE = supply & demand (both).** BoM = hottest Fire (origin, 100% reaction if unmitigated); MoM = cooling Fire ( continuation) — **MoM = LADDER STEPS ONLY, never reversal entries ("guaranteed loss"), virgin MoM = DEATH ZONE**. Fire can't be sustained: after 2 strong piercing moves → 1-2 days HTF consolidation. 95% of NY swings start 2nd half of NY. NY rockets need 3-pip SL minimum.
- **WATER = macro shapes.** BS=tidal wave, WL=crashing wave, consolidation=calm pool, SS=ripples. Price ALWAYS sweeps liquidity zone by zone in sequential order, never skips.
- **AIR = Fibonacci.** No intrinsic density; becomes a SPIDERWEB only when anchored to Earth points (candlewick, swing H/L). Air PIERCES FIRE (4H BoM S/D), not Earth — dual nature: fuel (accelerate) or extinguish (reverse). Wormholes: 0.382↔1.382, 0.618↔1.618. **1.382-1.786 = cleanest rocket entry (90% accuracy), 2.382-2.786 = trigger, 3.382-3.786 = extended TP.**
- Cycle: Earth→Fire→Water→Air→Earth. Density axis (what a thing IS) vs Attack axis (how a trade engages): FLR = Earth-Heavy attack (30m Fib trigger + liq entry/SL, THICK buffer), FR = Fire precision (15m Fib), LR = Water precision (zone-to-zone, THIN buffer, 20-30% failure OK).
- **Avatar State = E + FLR**: all four converge; P(all wrong) = 0.2⁴ = 0.16%.

### 1.2 E1 — WHERE ARE THE WALLS (9-Pillar 6D synthesis, prompt lines 922-1538)
- **P1 pivots** (3 variants Classic/Fib/Camarilla × weekly+daily, verification-mandatory), **P2 MA grid** (weights 200=3.0/100=2.0/50=1.5/20=1.0/9-10=0.5; recapture +2), **P3 component-pair option conversion**, **P4 analyst commentary** (tiers 3/2/1), **P5 structural extremes** (Step 0: 90d swing extremes w/ rejection wicks ≥0.15 DXY + close in upper/lower 50%; 0.45 LSZ scan ±0.05-0.10 beyond the extreme; 0.5 repeated magnets: 2 dates +1.5, 3+ or role-reversal +2.0, 0.5d institutional magnet +2.0; 0.6 intra-zone key levels; **0f 4H zone scan = SINGULAR candle before a strong move (≥0.5 DXY ≥3 days), zone=[candle L,candle H], ≤0.40 wide, mitigation 0X-5X**), P6 Fib+round numbers, P7 derivatives, P8 EUR/USD strike conversion, P9 regime+ZFP.
- **Confluence = 6 dims × 0-2 = 12 + Structural Extreme Bonus (max +2) = 14.**
- **Pressure degree table:** 12-14 EXTREME (<10% fail) · 10-11 HEAVY (10-25%) · 8-9 MODERATE-HEAVY (20-35%) · 6-7 MODERATE (30-45%) · 4-5 LIGHT (40-60%) · 0-3 MINIMAL (>60%).
- **Zone assembly:** sort ALL levels (NO spot-proximity filter), cluster 3+ within 0.15 DXY = HIGH-DENSITY ZONE, pairs within 0.10 = TIGHT CONFLUENCE, degree from group's highest-scoring level, names: RESISTANCE CEILING / UPPER RESISTANCE / EQUILIBRIUM ZONE / MID-RANGE SUPPORT / KEY SUPPORT BAND / LIQUIDITY SWEEP ZONE / BREAKOUT EXTENSION TARGET. ZFP>50% = BREAKOUT RISK. +1 post-consolidation.
- **ZFP = zone_width / pair_reference_range × 100** (DXY=1.60, EU/GU=0.0200, AU=0.0150) — the v8 `calcZFP`.
- **POI tiers:** T1 = IP zone overlaps 4H BoM (0X-1X) = primary trade location; T2 = IP-only; T3 = 4H-only informational.
- **Zone reaction counter:** 0 virgin · 1-2 active (has juice) · 3+ depleted (TP only). Lifecycle: VIRGIN→ACTIVE-1(~80%)→ACTIVE-2(~50%)→DEPLETED→FORTRESS(4+, 95% flip)→BROKEN(terminal).

### 1.3 E2 — WHAT PATH (shape chain, 1H primary, prompt lines 1725-2056)
- **Shapes:** SS (range, both bounds ZFP<30%) · SS(DWL) · BS (break ZFP>45%, 15+min confirm) · PBS (ZFP>70%, pierces) · R (transitional stabilization, target ZFP 20-40%) · RS · WL (spike-reject at Hard Wall ZFP<20%) · RWL (reverse after BS) · PWL · PRWL (strongest reversal) · WLS (3+ zones 0.30-0.50, 2-5 sessions, resolves to BS).
- **ZFP-CONDITIONED TRANSITIONS (the #1 fix):** BS→target ZFP<20% = **RWL NOT R/PBS** · BS 20-40% = R · BS>60% = PBS · BS>80% = PBS strong. SS bounding >45% = BS. R persisting >1 session = reclassify SS.
- **Chains by frequency:** SS→BS→R→WL HIGHEST · SS→BS · BS→R→RWL · BS→RWL→SS→BS · WL→RWL→SS→BS.
- **HTF Zone Mechanics Decision Tree (MoM tested):** sharp whiplash→pierced→BS/WL opposite · minor reaction+retest holds→long consolidation SS 2-4d · breaks+returns→short consolidation SS→BS/WL · no pierce→slow consolidation 2-4d→pierce to BoM.
- **Forward mapping 5 steps** (current shape → transition prob → chain w/ audit trail (max 5 shapes, stop <25% cumulative conf) → alternative chain w/ Decision Zone → day-by-day decomposition). **Trading Speed Rule: assume 30-50% of expected speed; today's move = tomorrow's; +1 day when confidence <65%.**
- **Consolidation phases:** Early→SS both dirs · Mid→SS+DWL inverse · Late (ZFP rising on bound)→SS+BS transition · Post-BS early→reinforcements only · Post-BS recovery→WL/RS entries · Mid-breakout→reinforce at liq.
- **Element matching:** 4H→4H (1H ok) · 15m→30m/1H max (never 4H). Pressure reading: bigger candles = pressure dir; upper wicks = buying pressure; triangle flat side receives.
- Pair elemental profiles: EU Fire-Earth (direct zone test, no shield) · GU Earth-Water (liquidity is the ONLY thing respected, shields protect S/D) · AU Earth-dominant slow (molasses, 2-4 days) · DXY Air-Fire master chart (directional conviction only).

### 1.4 E3 — WHERE DO I SURF (CORRECTED engine, 12 phases)
- **R3 Law: E2 DESIGNATES, E3 OBEYS.** STRUCTURAL_ENTRY_SOURCES = ORDER_BLOCK/LQZ only (IP zones are NEVER entries — confluence/ZFP/context + SL/TP rungs). LONG→demandZoneId, SHORT→supplyZoneId (never anchor long at supply).
- **TS-1 SNIPER ENTRY = zone edge CLOSEST to approaching price** (SHORT from supply: BOTTOM edge; LONG from demand: TOP edge). Operator's SLs: 95% <150 pips, 60-70% <100; RRR avg 4-6x.
- **SL ladder-steps:** 3p outside current-step far edge OR 1-2p inside next-rung close edge; fuel INTACT→LQZ shield, ABSORBED→S/D pressure, else golden fallback (4-9.5p, D17 ceiling 36p). Per-pair buffer: EU 2 / GU 3 / AU 3 / DXY 5.
- **TP (Law 11-14):** nearest opposing zone with LQZ INSIDE the S/D (Earth+Fire convergence); MIDPOINT if overlap else NEAR edge; NEVER far edge; strong zones = close edge +1-2p spread; TP≥1.2×SL precondition; one TP per trade.
- **RRR floor 3.0 emission** ("MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE... ALL MY TRADES ARE 4+"), executed 3.5, norm 4.0-6.4. RRR-fail ≠ reject: 3-attempt refine loop on SAME anchors (R2/D36), entry FIXED, re-anchor SL/TP only.
- **Freshness gate:** 4th+ battle depleted; pierced = VIOLATED terminal. **1-2-3 retest: 0=scalp only, 1=scalp+confirm, 2=swing valid, 3+=TP only.**
- **Confidence:** base 50-95 + IP confluence×1.5 (max 15) + BoM +5 + dir align +8 + storyline +5 + VLM +7 − SL-distance penalties; quality: GOD_TIER ≥90&rrr≥3 · HIGH ≥80&rrr≥2 · STANDARD ≥60 · CONDITIONAL ≥50 · REJECT <50.
- **Day assignment (12-step), sessions:** Mon/Wed/Fri→London, Tue/Thu→London-NY overlap; scalp=London Open, BS=London/NY overlap, HTF swing=NY Mid, reinforcement=NY Open. liquidityScore<5 = reject ("no wood for the fire").
- **BE1-BE12 blind-execution labels:** every setup carries DAY + SESSION + SHAPE TRIGGER + CATEGORY + ANCHOR HIT WINDOW; Weekly Execution Calendar mandatory; close ALL by NY close Friday.
- **Reinforcements:** 8R.1 ladder 50/30/20 + SL cascade; FLR/FR/LR (max 3/trade); stop-limit trip-wire mechanics; chains Law-27 (TP of N = entry of N+1, max depth 3, RRR≤15).
- **Cascade:** DXY→EU INVERSE →GU KEPT, structural equivalence (80% signal, 20% pair-native re-anchor), divergence >35% flag-only. **NO mathematical DXY→pair conversion EVER** (the 355-710pip catastrophe).
- **Honest absence:** SL_INVALID/TP_NULL/RRR_BELOW_FLOOR = NO EMISSION — never fabricate. "The 90% win-rate target depends on what the code REFUSES to emit."

### 1.5 Pine/indicator canon (Part X of the 5.3.3 prompt, lines 3688-3961)
- One indicator, 4 pairs, chart isolation via syminfo.ticker; **S/D zones are NOT mapped** (only IP, LSZ, option strikes — user maps S/D manually); xloc.bar_time ONLY; fills `color.new(base,70)`; labels `label.style_none`; zone order top-to-bottom; table 2×17 rows; ZFP via calcZFP pair refs; pressures spelled out fully ("MODERATE-HEAVY").
- **THE OFFICIAL E1 MODEL:** v8's `calcZFP(tp,bt,pair) = round((tp-bt)/refRange*100)`, label `"nm | degree | ZFP% ZFP"`. NOT a degree-derived step function (reverted improvisation: 5/6 zones read flat 37% — see skill `plutus-vision-render-rig-ops`).
- **UPDATE PROCESS (10.12):** what changes each week = data arrays + tsL/tsR + table week label + shape chain values. What stays = colors/helpers/pair detection/drawing structure/table layout.

## 2. CURRENT STATE OF THE BUILD (as of this session)
- `plutus-vision-v2.pine` (108KB) = the current indicator: **renders E1 zones accurately (95% operator-verified) but E2 + E3 are COMPLETELY ABSENT**. Its zone table is HAND-TYPED literals for the golden week 2026-07-06 (DXY-priced). Only calcZFP computes.
- **MY OBJECTIVE (not started — awaiting operator permission):** make the indicator render E1+E2+E3 fully dynamic for ANY week, temporally scoped to the most recent bar (bar-replay/backtest-safe), 95% accurate across 12 random weeks (rewind to Monday London open, 10x replay to Friday close, compare rendered E2/E3 vs actual price action ≥90-95%).
- E2/E3 engine data exists as fixtures: `data/e1/<PAIR>-<week>.json` (zone maps), `data/e2/<PAIR>-<week>-e2.json` (shape chains: days[], ghost[], momentum, chain, phase), bars in `fixtures/bars/*.json`.

## 3. THE RIG (render + verify) — MY ISOLATED INSTANCE
- **Shared rig (other agents):** pv-server :9851, station :9741, rail :9754, CDP :9222, chrome profiles /tmp/pv-ide-chrome*, display :3. **NEVER kill :9851/:9741/:9222 or /tmp/pv-ide-chrome* — 5 other agents are live.**
- **MY rig:** pv-server **:9861** (`STEP_AGENT/rig-root` static root = symlinks to renderer + **patched pine.html apiBase→9861** + **patched charts/workbench.bundle.js 9851→9861** — the bundle's MAIN_API default is the trap that silently reads another agent's fixture), chrome CDP **:9322**, profile `/tmp/step-agent-chrome`, app URL http://127.0.0.1:9861/pine.html. Driver: `STEP_AGENT/step-rig-cdp.mjs --pair DXY --tf 1H [--from MS --to MS] [--pine f.pine] [--shot out.png]`.
- Kernel API (via CDP Runtime.evaluate on window.PlutusPineShell): `P.loadBars({pair,timeframe})`, `P.editor.setSource(src)+flush()`, `P.run({silent})`, `P.chart.setVisibleRange({from,to})`, `P.chart.drawings.toJSON().drawings.length`, `P.state().lastVision.extent`.
- The page's workbench FixtureProvider maps ticker→pair {EURUSD,GBPUSD,DXY} and queries `${apiBase}/api/v1/chart/bars`; pv-server reads PV_FIXTURE env = one fixture file (cells: pair/timeframe/bars).
- **Trap:** a fixture ending at the anchor shows no forward action — cv-* fixtures span [week-14d, week+8d]. Chrome must be RELOADED (Page.reload) after restarting pv-server with a new fixture, or the page keeps its old bars.

## 4. EXERCISES DONE (proof of understanding — see STEP_AGENT/exercises/)
### EX1 — DXY week 2026-05-04 (random cv week) — MY CALL vs REALITY (fixture cv-2026-05-04.json, 382 bars Apr 20→May 12)
Boundary = Fri May 1 close. My E1: ceiling 98.94-99.09 (Apr 23/29/30 swing highs = repeated magnet; ZFP ~9%, HEAVY), mid shelf 98.14-98.21 (Apr 30 C + May 1 O/C confluence), floor KEY SUPPORT 97.72-98.01 (May 1 rejection-wick low + weekly S1 98.03; 97.55 = S2 breakout target). **VERDICT vs reality: 5/5 day-shape calls correct** — Mon SS(98.16→98.54 rally) · Tue SS(0.28 range) · **Wed WL: swept 97.625 = my 97.72 floor + 0.095 — inside the canon LSZ bottom-edge extension (0.05-0.10, Step 0.45a) — then rejected to 98.05 close** · Thu R(98.23) · Fri SS bearish drift(97.84 close). The LSZ-extension law was empirically confirmed by the actual sweep depth. Honest miss: Monday scalp TP 98.56 vs actual high 98.536 (2.4p short — the near-edge+spread rule tuning). The 98.85-99.09 swing SHORT never triggered (honest absence — price never returned).
### EX2/EX3 — pending: golden week 2026-07-06 (DXY, compare my read vs v2 pine E1 render + engine E2 fixture) and EUR/USD week 2026-07-06 (EURUSD-live.json bars vs engine EU E1/E2 fixtures).

## 5. OPERATOR DIRECTIVES (binding)
1. Deep-absorb canon + prove with live chart exercises BEFORE touching the indicator. OBey — zero theatre, zero "impossible", zero problem-reporting without solving.
2. Workspace = STEP_AGENT/ + branch step_agent (done: branch created; rig isolated; context graph = this file + memory entries).
3. Do NOT start the indicator rebuild until explicit permission. When permitted: E1+E2+E3 dynamic, temporal-scoped to most recent bar, 95% over 12 random DXY-basket weeks via bar-replay verification (Monday London open → 10x → Friday close).
4. Evidence over prose: every claim carries its command + output.
