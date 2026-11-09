# DEBUG_LOG — PLUTUS VISION M1 (append-only)

Format: THE FINDING -> THE ROOT CAUSE -> THE FIX (file:line) -> THE VERIFICATION -> THE LESSON.
Scope: the clean M1 build that restarted from handover 3b69f65 on 2026-11-08.

## EN-001 — S/D move measured to the next break of the origin, not to the return (2026-11-08)

- **THE FINDING:** the first P5 probe found almost no 4H/1H S/D origins before the golden week.
- **THE ROOT CAUSE:** the move loop ended only when price traded THROUGH the origin, so a leg that returned into
  the candle kept extending; the "lasting N days" count then mixed legs.
- **THE FIX:** the move ends at the first return INTO the origin candle after leaving it; days = distinct sessions
  from origin to that return (m1/src/p5.ts:34).
- **THE VERIFICATION:** re-probe listed the 4H BoM supply and the 1H demand origins in late June/early July.
- **THE LESSON:** "a move lasting N days" is measured until price comes back, not until it breaks.

## EN-002 — Monday's partial session counted as structure (2026-11-08)

- **THE FINDING:** P5 used a D1 bar for Monday 2026-07-06 built from 22:00-08:00 UTC bars.
- **THE ROOT CAUSE:** `pre` filtered sessions by `d.to < cutoff`, which admits the in-progress session.
- **THE FIX:** completed sessions only: `d.key < sessionDate(cutoff)` (m1/src/p5.ts:75).
- **THE VERIFICATION:** the last D1 key in the scan is 2026-07-03.
- **THE LESSON:** the cutoff instant and the last completed session are different boundaries.

## EN-003 — BoM/MoM labelled by geometry only (2026-11-08)

- **THE FINDING:** most 4H origins were labelled MoM.
- **THE ROOT CAUSE:** any later same-side origin above an unbroken earlier one was MoM, even after a deep reversal.
- **THE FIX:** MoM only when the pullback into the candle retraced < 0.5 of the running leg (a pause); else BoM
  (m1/src/p5.ts:57).
- **THE VERIFICATION:** the 101.33-101.40 4H origin classifies BoM.
- **THE LESSON:** the canon's MoM is "price paused here then continued" — a pause is a shallow retracement.
- **STILL OPEN:** the 100.61-100.68 1H origin still reads MoM 2X (CP-001 comparison row BoM/MoM = WRONG).

## EN-004 — six daily pivot sets instead of three (2026-11-08)

- **THE FINDING:** P1 produced sets for every prior-week session.
- **THE ROOT CAUSE:** the loop iterated all prior days; the canon's step 7 says the last 3 trading days.
- **THE FIX:** `priorDays.slice(-3)` (m1/src/p1.ts:50).
- **THE VERIFICATION:** sets = 3 variants x (1 week + 3 days + overlapping historical weeks).
- **THE LESSON:** read the step's count, not the loop's convenience.

## EN-005 — every zone scored HEAVY/EXTREME (2026-11-08)

- **THE FINDING:** first card: almost every zone >= 10.
- **THE ROOT CAUSE:** (1) the structural dimension gave 2 whenever any two structural levels sat within 3 pips —
  the canon requires an exact price ANCHOR and a structural EXTREME; (2) the POI tier bonus (+1/+2) was added to
  every cluster, while 9.7 assigns tiers to IP zones only; (3) duplicate formula levels (Fib PP == Classic PP)
  counted twice as technical confluence.
- **THE FIX:** structural per its wording (m1/src/assemble.ts:53); POI tier only for MODERATE+ IP zones
  (m1/src/assemble.ts:107); identical prices merged into one level with merged provenance before scoring.
- **THE VERIFICATION:** card degree spread now spans MINIMAL..HEAVY; 16 of 43 zones are MODERATE+ in band.
- **THE LESSON:** a score that saturates is a scoring defect, never a strong market.

## EN-006 — EUR/USD tiers computed on USD notional (2026-11-08)

- **THE FINDING:** EUR 1.4bn strikes classified Tier 1.
- **THE ROOT CAUSE:** all pairs tiered on USD-equivalent; P8's table tiers EUR/USD on the EUR notional.
- **THE FIX:** `tierOf(notional)` for EUR/USD, USD equivalent for the others (m1/src/options.ts:38).
- **THE VERIFICATION:** EUR 1.4bn -> Tier 2, EUR 2.2bn/2.4bn/2.8bn -> Tier 1.
- **THE LESSON:** each pillar's tier table names its own currency.

## EN-007 — the chart was unreadable (VC-000) (2026-11-08)

- **THE FINDING:** 43 full-width boxes, every option label, every intra line: a tiled axis.
- **THE ROOT CAUSE:** the composition drew the card's full output; the canon draws the synthesis (MODERATE+)
  and keeps the full output for inspection.
- **THE FIX:** synthesis-only, measured display band, origin-anchored boxes, one label per zone, P8 strikes only
  (m1/src/compose.ts:31, m1/src/run.ts:72, m1/src/assemble.ts:142).
- **THE VERIFICATION:** CP-001 runtime-state.png; Pinebox load 24 boxes (16 IP + 1 LSZ + 5 S/D + v1's 2).
- **THE LESSON:** full output and chart synthesis are two products of one card.

## EN-008 — Pinebox "5000 newest bars" read as a limitation (2026-11-08)

- **THE FINDING:** I reported that the golden week could not be shown.
- **THE ROOT CAUSE:** I read the IDE source over CDP instead of using the `pinebox` tool's `chart` verb; 5000 1H bars
  reach back ~40 weeks and the week was always on the chart.
- **THE FIX:** `chart op=zoom`, `op=pan dx=-1` (one screen), read back the range, land on the week.
- **THE VERIFICATION:** framed 2026-06-23..07-16 in under a minute (CP-001 frame).
- **THE LESSON:** the tool's verbs first; a "limitation" is a claim until measured.

## EN-009 — zones chained into wide bands (2026-11-08)

- **THE FINDING:** the first assembly produced zones wider than the canon's 0.15 cluster band.
- **THE ROOT CAUSE:** grouping walked the sorted list and joined each level to the previous one within 0.10, so a
  ladder of levels 0.08 apart chained into one wide zone.
- **THE FIX:** seed-based grouping: the highest-scoring unassigned level seeds a zone and takes every unassigned
  level within +/-0.075 (a 0.15 band); the rest stay their own zones (m1/src/assemble.ts:72).
- **THE VERIFICATION:** no zone in the CP-001 card is wider than 0.15 except where its members sit at the band edge.
- **THE LESSON:** "levels within 0.10-0.15 of each other" bounds the zone, not each neighbour pair.

## EN-010 — reactions counted on every touch (2026-11-08)

- **THE FINDING:** most zones read Depleted before the week opened.
- **THE ROOT CAUSE:** every separate touch counted as a reaction; the canon counts STRONG reactions only.
- **THE FIX:** a reaction = a touch followed by a move of >= 0.15 away before the next touch (m1/src/assemble.ts:114).
- **THE VERIFICATION:** card reaction states spread across Virgin / Active / Depleted.
- **THE LESSON:** a touch is not a reaction; the move away is the evidence.

## EN-011 — `any` in the composition and evaluator (2026-11-08)

- **THE FINDING:** compose.ts read the card through `any` casts (style rule ts-no-any fired).
- **THE ROOT CAUSE:** the card shape existed only implicitly in run.ts.
- **THE FIX:** `m1/src/card.ts` defines the card type and `readCard` checks its top-level shape before use
  (m1/src/card.ts:17); compose.ts consumes the typed card.
- **THE VERIFICATION:** regenerated composition sha unchanged (c9261fb3...), so the typing changed no output.
- **THE LESSON:** the card is the boundary between engine and renderer; type it once.

## EN-012 — the M1 gate could not grade any real screenshot (2026-11-08)

- **THE FINDING:** the CP-001 checkpoint commit was refused before the grader ran:
  `REJECT(PV-MODEL_PROMPT): grader request is 1483243 chars (> 220000)`.
- **THE ROOT CAUSE:** gates/commit_gate.py counted the base64 image transport against the TEXT budget. Measured:
  text ~183 K chars (contexts 68,621; diff capped 100,000; checkpoint+comparison 11,387); the operator screenshot
  alone was 1,142,950 chars as a PNG thumbnail. The policy's own minimum PNG size (20 KB) guaranteed every real
  checkpoint would exceed the cap: a gate that could not pass.
- **THE FIX:** admin gate repair e5d2465: images travel as the smaller of PNG/JPEG(q85) of the same thumbnail
  (gates/commit_gate.py:289); the text cap applies to text only; a separate fail-closed image cap
  `max_model_image_chars` 1,500,000 (gates/policy.json:28).
- **THE VERIFICATION:** before the repair commit, the configured grader was sent both CP-001 pictures at the new
  encoding and returned `{"img1":"DXY - FIXTURE - 1h chart, dates Jun 25 to Jul 9, price range 100.200 to 101.900",
  "img2":"DXY - FIXTURE - 1h chart, dates Jun 18 to Jul 30, price range 99.200 to 102.000","same_chart":true}` —
  correct on both (known-positive control). The repair commit passed the gate: `PV-GATE: PASS e5d246572807 admin`.
- **THE LESSON:** a size cap is a cap on a named unit; text and pixels are different units.

## EN-013 — the gate's bypass control after the repairs, and a cleanup slip (2026-11-08)

- **THE FINDING:** after the two admin gate repairs (e5d2465, 378153a), the non-bypassable surface had to be shown to
  still refuse. A `git commit --no-verify` work commit with the message "everything verified and done" was attempted.
- **THE RESULT:** `REJECT(PV-TRAILER)` + `fatal: ref updates aborted by hook`; branch unmoved at 378153a. The control
  refused, but by the trailer rule, not the WORK_CLAIM rule it was designed to hit; the WORK_CLAIM path is covered by
  gates/commit_gate.py:497 and was exercised by the original installation controls.
- **THE SLIP:** the control's `git stash push --staged` did not engage, and its cleanup (`git checkout -- m1/state.json`)
  reverted the staged CP-001 state. Caught by the staged-file count (36 -> 35) and the state read-back; state rewritten
  and re-staged before the checkpoint commit.
- **THE LESSON:** a control that shares the index with real work must run in a throwaway clone, not around a stash.

## EN-014 — S/D origin was a fractal swing, not "the candle immediately before the move" (2026-11-08)

- **THE FINDING:** the oracle 4H BoM supply (101.316-101.430, measured from the oracle image's own axis) was not produced.
- **THE ROOT CAUSE:** scanSd took the origin as the 5-bar swing extreme; canon :1353 takes the SINGLE candle immediately
  before the move began. The Jul 1 23:00 4H candle precedes the first displacement candle (Jul 2 03:00) after the high.
- **THE FIX:** the move begins at the first candle after a swing extreme that closes in the move direction with a
  median-or-larger body (the median measured on the same timeframe's pre-cutoff bars); the origin is the candle before
  it (m1/src/p5.ts:29).
- **THE VERIFICATION:** scan output `4H supply BoM 101.316 101.43 2026-07-01T23:00 move 0.758 days 4 mit 0` — the
  oracle box to the tick; drawn in CP-002 runtime-state.png.
- **THE LESSON:** the origin is defined by the move, not by the extreme.

## EN-015 — reactions counted on passes; Depleted modifier invented (2026-11-08)

- **THE FINDING:** Z13/Z14 read Depleted 7R and were predicted BREAK; both held.
- **THE ROOT CAUSE:** (1) every touch-and-leave counted, including passes through the zone; (2) a "+20 Depleted" ZFP
  modifier that is not in Appendix B.2; (3) reactions counted from a 14-day default instead of the zone's own origin.
- **THE FIX:** a reaction = enter from one side, leave to the SAME side by >= 0.15 (m1/src/assemble.ts:124); the count
  starts at the zone origin (the same instant as the box); the invented modifier removed; canon :1159 applied as written:
  a Depleted zone between price and a deeper BoM inside the week arena, with price travelling toward it, takes the B.1
  One-Touch midpoint 60% (m1/src/assemble.ts:175).
- **THE VERIFICATION:** outcome 42.9% -> 83.3% (5/6) with no zone-specific value (m1/checkpoints/CP-002/outcome.txt).
- **THE LESSON:** every ZFP signal must be a row of Appendix B or a canon sentence; magnitudes are the canon's band midpoints.

## EN-016 — ZFP had no time dimension (2026-11-08)

- **THE FINDING:** Spring Release was a 0-valued placeholder and Cascade was absent.
- **THE ROOT CAUSE:** both B.2 signals depend on WHEN the zone is tested (after the option expiry; after the nearer zone breaks).
- **THE FIX:** zones carry `zfpRules` (Spring Release +25 after the driver's expiry instant; Cascade +25 after the nearer
  same-side IP zone breaks); evaluate.ts applies them at the first-touch time; the chart label prints the rule.
- **THE VERIFICATION:** Z17 `card 22.5 +25 Spring Release +25 Cascade (Z16 broke)` -> BREAK -> BROKE.
- **THE LESSON:** a probability that changes during the week is a rule on the card, not a constant.

## EN-017 — v1 baseline and E1 on different weeks; E1 week hardcoded (2026-11-08) — OPERATOR-CAUGHT

- **THE FINDING:** CP-002 shows the v1 baseline's drawings on the newest candles (Nov) and E1 on 2026-07-06.
- **THE ROOT CAUSE:** the chart was framed by scrolling, but its LAST candle is Nov 6, so v1 (which keys off the last
  candle) renders there; the E1 layer embeds the card's week timestamps as constants instead of detecting the active
  week from the last candle.
- **THE FIX (ordered, in progress):** (1) rewind the CANDLES so the golden week is the last data on the chart (Pinebox
  replay; nothing after the week exists); (2) the E1 layer detects the active trading week from the last candle and
  draws the card for THAT week (cards keyed by week Monday; a week with no card is a named on-chart refusal).
- **THE LESSON:** scrolling moves the view, not the data; the indicator's week is the last candle's week.

## EN-018 — the room renders tables/labels on the CANVAS, not the DOM (2026-11-09)

- **THE FINDING:** the verifier refused `E1_RENDER_ABSENT` while the picture plainly showed the E1 card table and the zone bands.
- **THE ROOT CAUSE:** the room's engine (StationPineEngine → vela) draws Pine tables/labels into the chart canvas; the verifier searched DOM text (`/^E1$/`, `E1 card \|`) — the wrong substrate, so a rendered table could never match. A second wrong instrument read `PlutusBacktestChart.e1Ids` (empty `[]` while the render was live — it tracks something else, not the render).
- **THE FIX:** `m1/tools/pv-verify-room.sh` now judges the CAPTURE PNG: the session gate (the DOM header, which IS DOM) plus a canvas-pixel count of the zone-band colors (rgb(255,152,0)-family, >=300 samples in the chart area).
- **THE VERIFICATION (proof pair, pasted):** dependency absent → `E1_ZONE_BANDS_ABSENT ... only 27 zone-band pixels (<300)` exit 1; dependency present → `E1_RENDER_VERIFIED ... zone_band_pixels=1726` exit 0.
- **THE LESSON:** name the substrate before writing the check — a table drawn by a canvas engine is not in the DOM, and an empty id-list is not an empty chart.

## EN-019 — a non-ASCII label string was suspected and disproved (2026-11-09)

- **THE FINDING:** the first golden-week render attempts produced nothing while the DXY sessions rendered.
- **THE ROOT CAUSE (suspected):** the `€` glyph in the option labels (the only non-ASCII runtime string in the E1 layer).
- **THE FIX:** `m1/src/options.ts` now writes `EUR` (the E1 layer proven pure ASCII by a full scan).
- **THE VERIFICATION:** the regenerated composition (f1dc82e9) renders the golden week with native labels; BUT the earlier render failure was actually the missing re-import/re-run trigger (the room does not re-run the script on session attach — the operator's documented refresh flow), not the glyph: the pre-fix script also rendered once re-imported. The ASCII change stands (it removes the suspicion permanently); the trigger lesson is EN-020.
- **THE LESSON:** remove the suspicious variable AND identify the real trigger; do not credit the fix you cannot isolate.

## EN-020 - the room engine caps objects: the intra-on build rendered nothing (2026-11-09)

- THE FINDING: after e1ShowIntra flipped to true, the room chart rendered ZERO E1 objects (no table, no zones,
  no error: failedAt 0, console clean) while the IDE compiled and ran the same file fine (boxes 4 lines 40 tables 1).
- THE ROOT CAUSE: the card path with intra on emits ~200 extra line objects (every MODERATE+ zone x its intra
  fills: 1H origins + 2 fibs + prior closes + 25-pip rounds); the room engine (StationPineEngine) silently drops
  the whole run when its object budget is exceeded - a load failure, not a Pine error. The pre-intra build
  rendered; this one did not.
- THE FIX: e1ShowIntra default false (m1/src/compose.ts); the MISSING family stays open with a named design:
  throttle the intra fills (nearest zone only, or one fill class per zone) to fit the room budget.
- THE VERIFICATION (the flip test): intra true -> capture 194567 B (empty chart); intra false -> capture 353106 B
  (zones + table). Store verified after the PUT: len 86503, contains d8b3ae7933abc653, intra false.
- THE LESSON: a canvas engine's object budget is a hard limit with a SILENT failure; count the objects the card
  path emits before enabling a family, and keep the budget proof next to the toggle.
